import type { i18n as I18nInstance } from 'i18next';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import {
  type ComponentType,
  lazy,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useRound } from './useRound';
import { useSettings } from './useSettings';

const SCATTERGORIES_PRELOAD_ERROR_EVENTS = [
  'vite:preloadError',
  'scattergories:chunk-error',
] as const;

type NumericFieldName = 'durationInput' | 'catCountInput' | 'totalRoundsInput';

interface NumericFieldConfig {
  fallback: number;
  max: number;
  min: number;
}

const NUMERIC_FIELDS: Record<NumericFieldName, NumericFieldConfig> = {
  durationInput: {
    min: durationMin,
    max: durationMax,
    fallback: durationDefault,
  },
  catCountInput: {
    min: catCountMin,
    max: catCountMax,
    fallback: catCountDefault,
  },
  totalRoundsInput: {
    min: roundsMin,
    max: roundsMax,
    fallback: roundsDefault,
  },
};

function getAvailableCategories(categoryMode: string, customCategories: string[]): string[] {
  if (categoryMode === 'default') {
    return [...categories];
  }

  if (categoryMode === 'custom') {
    return [...customCategories];
  }

  return Array.from(new Set([...categories, ...customCategories]));
}

function getNormalizedCategoryCount(categoryCount: number, availableCount: number): number {
  return Math.min(categoryCount, Math.max(catCountMin, availableCount));
}

const howToPlayModalLoaders = import.meta.glob('../components/HowToPlayModal.tsx');

function useSessionNumbers(settings: {
  catCountInput: string;
  categoryMode: 'default' | 'custom' | 'mixed';
  customCategories: string[];
  durationInput: string;
  totalRoundsInput: string;
}) {
  const gameSeconds = clampInt(settings.durationInput, durationMin, durationMax, durationDefault);
  const categoryCount = clampInt(settings.catCountInput, catCountMin, catCountMax, catCountDefault);
  const totalRounds = clampInt(settings.totalRoundsInput, roundsMin, roundsMax, roundsDefault);
  const availableCategories = useMemo(
    () => getAvailableCategories(settings.categoryMode, settings.customCategories),
    [settings.categoryMode, settings.customCategories],
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

function sanitizeSettingsField(
  settings: Record<NumericFieldName, string>,
  field: NumericFieldName,
): string {
  const config = NUMERIC_FIELDS[field];
  return String(clampInt(settings[field], config.min, config.max, config.fallback));
}

function getNumericSettings(settings: {
  durationInput: string;
  catCountInput: string;
  totalRoundsInput: string;
}): Record<NumericFieldName, string> {
  return {
    durationInput: settings.durationInput,
    catCountInput: settings.catCountInput,
    totalRoundsInput: settings.totalRoundsInput,
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

  const handleNewGame = useMemo(
    () => createNewGameHandler(redrawCategories, params.round),
    [params.round, redrawCategories],
  );

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
  round: ReturnType<typeof useRound>;
  settings: {
    catCountInput: string;
    durationInput: string;
    isMuted: boolean;
    theme: 'light' | 'dark';
    totalRoundsInput: string;
  };
  update: ReturnType<typeof useSettings>['update'];
}) {
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [hasChunkError, setHasChunkError] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isLanguagePending, setIsLanguagePending] = useState(false);
  const newCategoryInputRef = useRef<HTMLInputElement>(null);

  const sanitizeNumericField = useMemo(
    () => createNumericFieldSanitizer(params.settings, params.update),
    [params.settings, params.update],
  );
  const handleAddCustomCategory = useMemo(
    () =>
      createCustomCategoryHandler(params.addCustomCategory, setNewCategoryInput, newCategoryInput),
    [newCategoryInput, params.addCustomCategory],
  );
  const focusNewCategoryInput = useCallback(() => {
    newCategoryInputRef.current?.focus();
  }, []);
  const handleReloadAfterChunkError = useMemo(() => createReloadHandler(), []);
  const handleLanguageChange = useLanguageSwitcher(
    params.i18n,
    setIsLanguagePending,
    setHasChunkError,
  );

  useChunkErrorListener(setHasChunkError);

  return {
    focusNewCategoryInput,
    handleAddCustomCategory,
    handleLanguageChange,
    handleReloadAfterChunkError,
    hasChunkError,
    isHowToPlayOpen,
    isLanguagePending,
    newCategoryInput,
    newCategoryInputRef,
    sanitizeNumericField,
    setIsHowToPlayOpen,
    setNewCategoryInput,
  };
}

function useSessionKeyboardShortcuts(params: {
  focusNewCategoryInput: () => void;
  handleNewGame: () => void;
  redrawCategories: () => void;
  round: ReturnType<typeof useRound>;
}) {
  useKeyboardShortcuts({
    onSpace: params.round.startRound,
    onR: params.round.rerollLetter,
    onN: params.handleNewGame,
    onP: params.round.togglePause,
    onC: params.redrawCategories,
    onA: params.focusNewCategoryInput,
  });
}

function buildCategoriesModel(params: {
  availableCount: number;
  drawnCategories: string[];
  newCategoryInput: string;
  normalizedCategoryCount: number;
  setNewCategoryInput: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  return {
    availableCount: params.availableCount,
    drawnCategories: params.drawnCategories,
    newCategoryInput: params.newCategoryInput,
    normalizedCategoryCount: params.normalizedCategoryCount,
    setNewCategoryInput: params.setNewCategoryInput,
    inputRef: params.inputRef,
  };
}

function buildControlsModel(params: {
  handleAddCustomCategory: () => void;
  handleLanguageChange: (language: string) => void;
  handleNewGame: () => void;
  handleReloadAfterChunkError: () => void;
  handleRedrawCategories: () => void;
  handleRemoveCustomCategory: (category: string) => void;
  round: ReturnType<typeof useRound>;
  setIsHowToPlayOpen: Dispatch<SetStateAction<boolean>>;
  settings: {
    isMuted: boolean;
    theme: 'light' | 'dark';
  };
  update: ReturnType<typeof useSettings>['update'];
  sanitizeNumericField: (field: NumericFieldName) => void;
}) {
  return {
    onAddCustomCategory: params.handleAddCustomCategory,
    onBlurNumericField: params.sanitizeNumericField,
    onCategoryModeChange: (mode: 'default' | 'custom' | 'mixed') =>
      params.update('categoryMode', mode),
    onLanguageChange: params.handleLanguageChange,
    onNewGame: params.handleNewGame,
    onReloadAfterChunkError: params.handleReloadAfterChunkError,
    onRemoveCustomCategory: params.handleRemoveCustomCategory,
    onRedrawCategories: params.handleRedrawCategories,
    onResetRound: params.round.resetRound,
    onStartRound: params.round.startRound,
    onToggleHowToPlay: () => params.setIsHowToPlayOpen((current) => !current),
    onToggleMute: () => params.update('isMuted', !params.settings.isMuted),
    onTogglePause: params.round.togglePause,
    onToggleTheme: () =>
      params.update('theme', params.settings.theme === 'light' ? 'dark' : 'light'),
    onUpdateField: params.update,
    onSkipLetter: params.round.rerollLetter,
  };
}

function buildFlagsModel(params: {
  hasChunkError: boolean;
  hasMoreRounds: boolean;
  isHowToPlayOpen: boolean;
  isLanguagePending: boolean;
}) {
  return params;
}

function buildRoundModel(round: ReturnType<typeof useRound>) {
  return {
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
  };
}

function buildSettingsModel(
  settings: {
    catCountInput: string;
    categoryMode: 'default' | 'custom' | 'mixed';
    customCategories: string[];
    durationInput: string;
    isMuted: boolean;
    theme: 'light' | 'dark';
    totalRoundsInput: string;
  },
  totalRounds: number,
  gameSeconds: number,
) {
  return {
    ...settings,
    totalRounds,
    gameSeconds,
  };
}

function createNumericFieldSanitizer(
  settings: {
    durationInput: string;
    catCountInput: string;
    totalRoundsInput: string;
  },
  update: ReturnType<typeof useSettings>['update'],
) {
  return (field: NumericFieldName) => {
    update(field, sanitizeSettingsField(getNumericSettings(settings), field));
  };
}

function createCustomCategoryHandler(
  addCustomCategory: (value: string) => void,
  setNewCategoryInput: (value: string) => void,
  newCategoryInput: string,
) {
  return () => {
    addCustomCategory(newCategoryInput);
    setNewCategoryInput('');
  };
}

function createNewGameHandler(redrawCategories: () => void, round: ReturnType<typeof useRound>) {
  return () => {
    redrawCategories();
    round.newGame();
  };
}

function createReloadHandler() {
  return () => window.location.reload();
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
    round,
    settings,
    update,
  });

  useSessionKeyboardShortcuts({
    focusNewCategoryInput: controls.focusNewCategoryInput,
    handleNewGame: board.handleNewGame,
    redrawCategories: board.redrawCategories,
    round,
  });

  return {
    categories: buildCategoriesModel({
      availableCount: numbers.availableCategories.length,
      drawnCategories: board.drawnCategories,
      newCategoryInput: controls.newCategoryInput,
      normalizedCategoryCount: numbers.normalizedCategoryCount,
      setNewCategoryInput: controls.setNewCategoryInput,
      inputRef: controls.newCategoryInputRef as RefObject<HTMLInputElement>,
    }),
    controls: buildControlsModel({
      handleAddCustomCategory: controls.handleAddCustomCategory,
      handleLanguageChange: controls.handleLanguageChange,
      handleNewGame: board.handleNewGame,
      handleReloadAfterChunkError: controls.handleReloadAfterChunkError,
      handleRedrawCategories: board.redrawCategories,
      handleRemoveCustomCategory: removeCustomCategory,
      round,
      sanitizeNumericField: controls.sanitizeNumericField,
      setIsHowToPlayOpen: controls.setIsHowToPlayOpen,
      settings,
      update,
    }),
    flags: buildFlagsModel({
      hasChunkError: controls.hasChunkError,
      hasMoreRounds: round.hasMoreRounds,
      isHowToPlayOpen: controls.isHowToPlayOpen,
      isLanguagePending: controls.isLanguagePending,
    }),
    round: buildRoundModel(round),
    settings: buildSettingsModel(settings, numbers.totalRounds, numbers.gameSeconds),
    howToPlayDialog: HowToPlayDialog,
  };
}

export { useGameSession };
