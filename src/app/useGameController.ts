import type { RefObject } from 'react';
import { type ComponentType, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import type { Phase, StatusKey } from '@/domain/game/roundReducer';
import { useRound } from '@/features/round/useRound';
import { useSettings } from '@/features/settings/SettingsProvider';
import type {
  CategoryMode,
  CategoryRefreshMode,
  NumericFieldName,
} from '@/features/settings/schema';
import { useAppControls } from './useAppControls';
import { useCategoryBoard } from './useCategoryBoard';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { usePromptDeckState } from './usePromptDeckState';
import { useRoundSetup } from './useRoundSetup';

const howToPlayModalLoaders = import.meta.glob('./HowToPlayModal.tsx');

interface GameController {
  categories: {
    availableCount: number;
    drawnCategories: string[];
    isCompactLayout: boolean;
    isPromptDeckOpen: boolean;
    newCategoryInput: string;
    normalizedCategoryCount: number;
    setNewCategoryInput: (value: string) => void;
    inputRef: RefObject<HTMLInputElement>;
  };
  controls: {
    onAddCustomCategory: () => void;
    onActivePackChange: (packId: string) => void;
    onBlurNumericField: (field: NumericFieldName) => void;
    onCategoryModeChange: (mode: CategoryMode) => void;
    onCategoryRefreshModeChange: (mode: CategoryRefreshMode) => void;
    onCloseHowToPlay: () => void;
    onLanguageChange: (language: string) => void;
    onOpenHowToPlay: () => void;
    onReloadAfterChunkError: () => void;
    onRemoveCustomCategory: (category: string) => void;
    onRedrawCategories: () => void;
    onResetRound: () => void;
    onStartRound: () => void;
    onToggleMute: () => void;
    onTogglePause: () => void;
    onTogglePromptDeck: () => void;
    onToggleTheme: () => void;
    onUpdateField: ReturnType<typeof useSettings>['update'];
    onSkipLetter: () => void;
  };
  flags: {
    hasChunkError: boolean;
    isCompactLayout: boolean;
    isHowToPlayOpen: boolean;
    isLanguagePending: boolean;
    isPromptDeckOpen: boolean;
  };
  round: {
    alarmOn: boolean;
    isPaused: boolean;
    letter: string;
    letterLanding: boolean;
    letterVisible: boolean;
    phase: Phase;
    secondsLeft: number;
    statusKey: StatusKey;
    usedLetters: string[];
  };
  settings: ReturnType<typeof useSettings>['settings'] & {
    gameSeconds: number;
  };
  howToPlayDialog: ComponentType<{ onClose: () => void }>;
}

function useGameKeyboardShortcuts(params: {
  revealPromptDeck: () => void;
  round: ReturnType<typeof useRound>;
  togglePromptDeck: () => void;
  focusPromptDeckInput: () => void;
}) {
  useKeyboardShortcuts({
    onSpace: params.round.startRound,
    onR: params.round.rerollLetter,
    onP: params.round.togglePause,
    onC: params.togglePromptDeck,
    onA: () => {
      params.revealPromptDeck();
      params.focusPromptDeckInput();
    },
  });
}

const HowToPlayDialog = lazy(async () => {
  const loader = howToPlayModalLoaders['./HowToPlayModal.tsx'];

  if (!loader) {
    throw new Error('Unable to load HowToPlayModal.');
  }

  const module = (await loader()) as Record<string, ComponentType<{ onClose: () => void }>>;
  return { default: module.HowToPlayModal };
});

function useGameController(): GameController {
  const { settings, update, addCustomCategory, removeCustomCategory } = useSettings();
  const { i18n } = useTranslation();
  const promptDeck = usePromptDeckState(settings.promptDeckPreference, update);
  const roundSetup = useRoundSetup(settings);
  const board = useCategoryBoard({
    availableCategories: roundSetup.availableCategories,
    normalizedCategoryCount: roundSetup.normalizedCategoryCount,
  });
  const round = useRound({
    gameSeconds: roundSetup.gameSeconds,
    isMuted: settings.isMuted,
    locale: i18n.resolvedLanguage ?? i18n.language,
    categoryRefreshMode: settings.categoryRefreshMode,
    onLetterPicked:
      settings.categoryRefreshMode === 'auto' ? board.redrawCategories : () => undefined,
  });
  const controls = useAppControls({
    addCustomCategory,
    i18n,
    settings,
    update,
    isPromptDeckOpen: promptDeck.isPromptDeckOpen,
  });

  useGameKeyboardShortcuts({
    focusPromptDeckInput: controls.focusNewCategoryInput,
    revealPromptDeck: promptDeck.revealPromptDeck,
    round,
    togglePromptDeck: promptDeck.togglePromptDeck,
  });

  return {
    categories: {
      availableCount: roundSetup.availableCategories.length,
      drawnCategories: board.drawnCategories,
      isCompactLayout: promptDeck.isCompactLayout,
      isPromptDeckOpen: promptDeck.isPromptDeckOpen,
      newCategoryInput: controls.newCategoryInput,
      normalizedCategoryCount: roundSetup.normalizedCategoryCount,
      setNewCategoryInput: controls.setNewCategoryInput,
      inputRef: controls.newCategoryInputRef as RefObject<HTMLInputElement>,
    },
    controls: {
      onAddCustomCategory: controls.handleAddCustomCategory,
      onActivePackChange: (packId: string) => update('activePack', packId),
      onBlurNumericField: controls.blurNumericField,
      onCategoryModeChange: (mode) => update('categoryMode', mode),
      onCategoryRefreshModeChange: (mode) => update('categoryRefreshMode', mode),
      onCloseHowToPlay: () => controls.setIsHowToPlayOpen(false),
      onLanguageChange: controls.handleLanguageChange,
      onOpenHowToPlay: () => controls.setIsHowToPlayOpen(true),
      onReloadAfterChunkError: () => window.location.reload(),
      onRemoveCustomCategory: removeCustomCategory,
      onRedrawCategories: board.redrawCategories,
      onResetRound: round.resetRound,
      onStartRound: round.startRound,
      onToggleMute: () => update('isMuted', !settings.isMuted),
      onTogglePause: round.togglePause,
      onTogglePromptDeck: promptDeck.togglePromptDeck,
      onToggleTheme: () => update('theme', settings.theme === 'light' ? 'dark' : 'light'),
      onUpdateField: update,
      onSkipLetter: round.rerollLetter,
    },
    flags: {
      hasChunkError: controls.hasChunkError,
      isCompactLayout: promptDeck.isCompactLayout,
      isHowToPlayOpen: controls.isHowToPlayOpen,
      isLanguagePending: controls.isLanguagePending,
      isPromptDeckOpen: promptDeck.isPromptDeckOpen,
    },
    round: {
      alarmOn: round.alarmOn,
      isPaused: round.isPaused,
      letter: round.letter,
      letterLanding: round.letterLanding,
      letterVisible: round.letterVisible,
      phase: round.phase,
      secondsLeft: round.secondsLeft,
      statusKey: round.statusKey,
      usedLetters: round.usedLetters,
    },
    settings: {
      ...settings,
      gameSeconds: roundSetup.gameSeconds,
    },
    howToPlayDialog: HowToPlayDialog,
  };
}

export type { GameController };
export { useGameController };
