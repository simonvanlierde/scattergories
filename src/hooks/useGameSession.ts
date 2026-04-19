import type { i18n as I18nInstance } from 'i18next';
import type { RefObject } from 'react';
import {
  type ComponentType,
  lazy,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  catCountDefault,
  catCountMax,
  catCountMin,
  categories,
  durationDefault,
  durationMax,
  durationMin,
  roundsDefault,
  roundsMax,
  roundsMin,
} from '../game/constants';
import { clampInt, shuffleFisherYates } from '../game/utils';
import { ensureLanguageLoaded, persistLanguage } from '../i18n/config';
import { getPackCategories } from '../lib/categoryPacks';
import { type NumericFieldName, sanitizeNumericField } from '../settings/schema';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useRound } from './useRound';
import { useSettings } from './useSettings';

const SCATTERGORIES_PRELOAD_ERROR_EVENTS = [
  'vite:preloadError',
  'scattergories:chunk-error',
] as const;
const MOBILE_PROMPT_DECK_QUERY = '(max-width: 52rem)';

function getAvailableCategories(
  categoryMode: string,
  activePack: string,
  customCategories: string[],
): string[] {
  const packCategories = getPackCategories(activePack, categories);

  if (categoryMode === 'default') {
    return packCategories;
  }

  if (categoryMode === 'custom') {
    return [...customCategories];
  }

  return Array.from(new Set([...packCategories, ...customCategories]));
}

function getNormalizedCategoryCount(categoryCount: number, availableCount: number): number {
  return Math.min(categoryCount, Math.max(catCountMin, availableCount));
}

const howToPlayModalLoaders = import.meta.glob('../components/HowToPlayModal.tsx');

function useSessionNumbers(settings: {
  catCountInput: string;
  categoryMode: 'default' | 'custom' | 'mixed';
  activePack: string;
  customCategories: string[];
  durationInput: string;
  totalRoundsInput: string;
}) {
  const gameSeconds = clampInt(settings.durationInput, durationMin, durationMax, durationDefault);
  const categoryCount = clampInt(settings.catCountInput, catCountMin, catCountMax, catCountDefault);
  const totalRounds = clampInt(settings.totalRoundsInput, roundsMin, roundsMax, roundsDefault);
  const availableCategories = useMemo(
    () =>
      getAvailableCategories(settings.categoryMode, settings.activePack, settings.customCategories),
    [settings.categoryMode, settings.activePack, settings.customCategories],
  );
  const normalizedCategoryCount = useMemo(
    () => getNormalizedCategoryCount(categoryCount, availableCategories.length),
    [availableCategories.length, categoryCount],
  );

  return {
    availableCategories,
    categoryCount,
    gameSeconds,
    normalizedCategoryCount,
    totalRounds,
  };
}

function useChunkErrorListener(setHasChunkError: (value: boolean) => void): void {
  useEffect(() => {
    function onPreloadError(event: Event) {
      event.preventDefault();
      setHasChunkError(true);
    }

    for (const eventName of SCATTERGORIES_PRELOAD_ERROR_EVENTS) {
      window.addEventListener(eventName, onPreloadError);
    }

    return () => {
      for (const eventName of SCATTERGORIES_PRELOAD_ERROR_EVENTS) {
        window.removeEventListener(eventName, onPreloadError);
      }
    };
  }, [setHasChunkError]);
}

function useLanguageSwitcher(
  i18n: I18nInstance,
  setIsLanguagePending: (value: boolean) => void,
  setHasChunkError: (value: boolean) => void,
) {
  return useCallback(
    (language: string) => {
      setIsLanguagePending(true);

      async function switchLanguage() {
        try {
          persistLanguage(language);
          const resolved = await ensureLanguageLoaded(language);
          await i18n.changeLanguage(resolved);
          persistLanguage(resolved);
        } catch {
          setHasChunkError(true);
        } finally {
          setIsLanguagePending(false);
        }
      }

      switchLanguage().catch(() => undefined);
    },
    [i18n, setHasChunkError, setIsLanguagePending],
  );
}

function getCompactLayoutSnapshot() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia(MOBILE_PROMPT_DECK_QUERY).matches;
}

function subscribeCompactLayout(onStoreChange: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia(MOBILE_PROMPT_DECK_QUERY);
  const handleChange = () => onStoreChange();

  mediaQuery.addEventListener('change', handleChange);

  return () => mediaQuery.removeEventListener('change', handleChange);
}

function useIsCompactLayout() {
  return useSyncExternalStore(subscribeCompactLayout, getCompactLayoutSnapshot, () => false);
}

function getPromptDeckOpenState(
  preference: 'auto' | 'open' | 'collapsed',
  isCompactLayout: boolean,
) {
  if (preference === 'auto') {
    return !isCompactLayout;
  }

  return preference === 'open';
}

function useCategoryBoard(params: {
  availableCategories: string[];
  normalizedCategoryCount: number;
  round: ReturnType<typeof useRound>;
}) {
  const [drawnCategories, setDrawnCategories] = useState<string[]>([]);

  const redrawCategories = useCallback(() => {
    startTransition(() => {
      if (params.availableCategories.length === 0) {
        setDrawnCategories([]);
        return;
      }

      setDrawnCategories(
        shuffleFisherYates(params.availableCategories).slice(0, params.normalizedCategoryCount),
      );
    });
  }, [params.availableCategories, params.normalizedCategoryCount]);

  const handleNewGame = useCallback(() => {
    redrawCategories();
    params.round.newGame();
  }, [params.round, redrawCategories]);

  useEffect(() => {
    redrawCategories();
  }, [redrawCategories]);

  return {
    drawnCategories,
    handleNewGame,
    redrawCategories,
    setDrawnCategories,
  };
}

function useSessionControls(params: {
  addCustomCategory: (value: string) => void;
  i18n: I18nInstance;
  settings: {
    catCountInput: string;
    durationInput: string;
    totalRoundsInput: string;
  };
  update: ReturnType<typeof useSettings>['update'];
  isPromptDeckOpen: boolean;
}) {
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [hasChunkError, setHasChunkError] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isLanguagePending, setIsLanguagePending] = useState(false);
  const [shouldFocusPromptInput, setShouldFocusPromptInput] = useState(false);
  const newCategoryInputRef = useRef<HTMLInputElement>(null);
  const { update, addCustomCategory, isPromptDeckOpen, settings } = params;

  const blurNumericField = useCallback(
    (field: NumericFieldName) => {
      update(field, sanitizeNumericField(field, settings[field]));
    },
    [settings, update],
  );
  const handleAddCustomCategory = useCallback(() => {
    addCustomCategory(newCategoryInput);
    setNewCategoryInput('');
  }, [addCustomCategory, newCategoryInput]);
  const handleLanguageChange = useLanguageSwitcher(
    params.i18n,
    setIsLanguagePending,
    setHasChunkError,
  );
  const setPromptDeckPreference = useCallback(
    (nextOpen: boolean) => {
      update('promptDeckPreference', nextOpen ? 'open' : 'collapsed');
    },
    [update],
  );
  const togglePromptDeck = useCallback(() => {
    setPromptDeckPreference(!isPromptDeckOpen);
  }, [isPromptDeckOpen, setPromptDeckPreference]);
  const revealPromptDeck = useCallback(() => {
    if (!isPromptDeckOpen) {
      setPromptDeckPreference(true);
    }
  }, [isPromptDeckOpen, setPromptDeckPreference]);

  useEffect(() => {
    if (!(shouldFocusPromptInput && isPromptDeckOpen && newCategoryInputRef.current)) {
      return;
    }

    newCategoryInputRef.current.focus();
    setShouldFocusPromptInput(false);
  }, [isPromptDeckOpen, shouldFocusPromptInput]);

  useChunkErrorListener(setHasChunkError);

  return {
    focusNewCategoryInput: () => {
      setShouldFocusPromptInput(true);
    },
    blurNumericField,
    handleAddCustomCategory,
    handleLanguageChange,
    hasChunkError,
    isHowToPlayOpen,
    isLanguagePending,
    newCategoryInput,
    newCategoryInputRef,
    revealPromptDeck,
    setIsHowToPlayOpen,
    setNewCategoryInput,
    togglePromptDeck,
  };
}

function useSessionKeyboardShortcuts(params: {
  handleNewGame: () => void;
  revealPromptDeck: () => void;
  round: ReturnType<typeof useRound>;
  togglePromptDeck: () => void;
  focusPromptDeckInput: () => void;
}) {
  useKeyboardShortcuts({
    onSpace: params.round.startRound,
    onR: params.round.rerollLetter,
    onN: params.handleNewGame,
    onP: params.round.togglePause,
    onC: params.togglePromptDeck,
    onA: () => {
      params.revealPromptDeck();
      params.focusPromptDeckInput();
    },
  });
}

const HowToPlayDialog = lazy(async () => {
  const loader = howToPlayModalLoaders['../components/HowToPlayModal.tsx'];

  if (!loader) {
    throw new Error('Unable to load HowToPlayModal.');
  }

  const module = (await loader()) as Record<string, ComponentType<{ onClose: () => void }>>;
  return { default: module.HowToPlayModal };
});

function useGameSession() {
  const { settings, update, addCustomCategory, removeCustomCategory } = useSettings();
  const { i18n } = useTranslation();
  const isCompactLayout = useIsCompactLayout();
  const isPromptDeckOpen = getPromptDeckOpenState(settings.promptDeckPreference, isCompactLayout);
  const numbers = useSessionNumbers(settings);
  const round = useRound({
    gameSeconds: numbers.gameSeconds,
    totalRounds: numbers.totalRounds,
    isMuted: settings.isMuted,
    locale: i18n.resolvedLanguage ?? i18n.language,
  });
  const board = useCategoryBoard({
    availableCategories: numbers.availableCategories,
    normalizedCategoryCount: numbers.normalizedCategoryCount,
    round,
  });
  const controls = useSessionControls({
    addCustomCategory,
    i18n,
    settings,
    update,
    isPromptDeckOpen,
  });

  useSessionKeyboardShortcuts({
    focusPromptDeckInput: controls.focusNewCategoryInput,
    handleNewGame: board.handleNewGame,
    revealPromptDeck: controls.revealPromptDeck,
    round,
    togglePromptDeck: controls.togglePromptDeck,
  });

  return {
    categories: {
      availableCount: numbers.availableCategories.length,
      drawnCategories: board.drawnCategories,
      isCompactLayout,
      isPromptDeckOpen,
      newCategoryInput: controls.newCategoryInput,
      normalizedCategoryCount: numbers.normalizedCategoryCount,
      setNewCategoryInput: controls.setNewCategoryInput,
      inputRef: controls.newCategoryInputRef as RefObject<HTMLInputElement>,
    },
    controls: {
      onAddCustomCategory: controls.handleAddCustomCategory,
      onActivePackChange: (packId: string) => update('activePack', packId),
      onBlurNumericField: controls.blurNumericField,
      onCategoryModeChange: (mode: 'default' | 'custom' | 'mixed') => update('categoryMode', mode),
      onLanguageChange: controls.handleLanguageChange,
      onNewGame: board.handleNewGame,
      onReloadAfterChunkError: () => window.location.reload(),
      onRemoveCustomCategory: removeCustomCategory,
      onRedrawCategories: board.redrawCategories,
      onResetRound: round.resetRound,
      onStartRound: round.startRound,
      onToggleHowToPlay: () => controls.setIsHowToPlayOpen((current) => !current),
      onToggleMute: () => update('isMuted', !settings.isMuted),
      onTogglePause: round.togglePause,
      onTogglePromptDeck: controls.togglePromptDeck,
      onToggleTheme: () => update('theme', settings.theme === 'light' ? 'dark' : 'light'),
      onUpdateField: update,
      onSkipLetter: round.rerollLetter,
    },
    flags: {
      hasChunkError: controls.hasChunkError,
      hasMoreRounds: round.hasMoreRounds,
      isCompactLayout,
      isHowToPlayOpen: controls.isHowToPlayOpen,
      isLanguagePending: controls.isLanguagePending,
      isPromptDeckOpen,
    },
    round: {
      alarmOn: round.alarmOn,
      isPaused: round.isPaused,
      letter: round.letter,
      letterLanding: round.letterLanding,
      letterVisible: round.letterVisible,
      phase: round.phase,
      roundCount: round.roundCount,
      secondsLeft: round.secondsLeft,
      statusKey: round.statusKey,
      usedLetters: round.usedLetters,
      playToggle: round.playToggle,
    },
    settings: {
      ...settings,
      totalRounds: numbers.totalRounds,
      gameSeconds: numbers.gameSeconds,
    },
    howToPlayDialog: HowToPlayDialog,
  };
}

export { useGameSession };
