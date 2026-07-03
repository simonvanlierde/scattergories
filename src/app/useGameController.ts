import type { RefObject } from 'react';
import { type ComponentType, lazy, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Phase, StatusKey } from '@/domain/game/roundReducer';
import { useRound } from '@/features/round/useRound';
import { useSettings } from '@/features/settings/SettingsProvider';
import type { NumericFieldName } from '@/features/settings/schema';
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
    drawnCustomCategories: string[];
    isLanding: boolean;
    isPromptDeckOpen: boolean;
    inputRef: RefObject<HTMLInputElement>;
  };
  controls: {
    onAddCustomCategory: (name: string) => void;
    onBlurNumericField: (field: NumericFieldName) => void;
    onTogglePin: (name: string) => void;
    onTogglePinAll: (names: string[]) => void;
    onAddPack: (packId: string) => void;
    onRemoveBuiltin: (name: string) => void;
    onRemoveAllCustom: () => void;
    onRemoveAllBuiltins: () => void;
    onCloseHowToPlay: () => void;
    onLanguageChange: (language: string) => void;
    onOpenHowToPlay: () => void;
    onReloadAfterChunkError: () => void;
    onRemoveCustomCategory: (category: string) => void;
    onRedrawCategories: () => void;
    onStartRound: () => void;
    onToggleMute: () => void;
    onTogglePause: () => void;
    onTogglePromptDeck: () => void;
    onToggleTheme: () => void;
    onUpdateField: ReturnType<typeof useSettings>['update'];
    onNewLetter: () => void;
    onNextRound: () => void;
  };
  flags: {
    hasChunkError: boolean;
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

const HowToPlayDialog = lazy(async () => {
  const loader = howToPlayModalLoaders['./HowToPlayModal.tsx'];

  if (!loader) {
    throw new Error('Unable to load HowToPlayModal.');
  }

  const module = (await loader()) as Record<string, ComponentType<{ onClose: () => void }>>;
  return { default: module.HowToPlayModal };
});

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: aggregator hook — the body wires together the sub-hooks and returns one flat controller object; splitting it would only scatter that shape.
function useGameController(): GameController {
  const {
    settings,
    update,
    addCustom,
    removeCustom,
    togglePin,
    togglePinAll,
    addPack,
    removeBuiltin,
    removeAllCustom,
    removeAllBuiltins,
  } = useSettings();
  const { i18n } = useTranslation();
  const promptDeck = usePromptDeckState(settings.promptDeckPreference, update);
  const roundSetup = useRoundSetup(settings);
  // True while a round is mid-flight (buffer/running, paused or not). Deck edits
  // made during a round are deferred to the next redraw rather than applied live.
  const roundInProgressRef = useRef(false);
  const board = useCategoryBoard({
    customCategories: roundSetup.customCategories,
    deckBuiltins: roundSetup.deckBuiltins,
    pinned: roundSetup.pinned,
    count: roundSetup.normalizedCategoryCount,
    deferComposeRef: roundInProgressRef,
  });
  const round = useRound({
    gameSeconds: roundSetup.gameSeconds,
    bufferSeconds: roundSetup.bufferSeconds,
    isMuted: settings.isMuted,
    locale: i18n.resolvedLanguage ?? i18n.language,
    onLetterPicked: () => board.redrawCategories(true),
  });
  roundInProgressRef.current = round.phase === 'buffer' || round.phase === 'running';
  const controls = useAppControls({
    i18n,
    settings,
    update,
  });

  useKeyboardShortcuts({
    onSpace: round.primaryAction,
    onR: round.newLetter,
    onP: round.togglePause,
    onC: promptDeck.togglePromptDeck,
    onHelp: () => controls.setIsHowToPlayOpen(true),
  });

  return {
    categories: {
      availableCount: roundSetup.availableCount,
      drawnCategories: board.drawnCategories,
      drawnCustomCategories: board.drawnCustom,
      isLanding: board.landing,
      isPromptDeckOpen: promptDeck.isPromptDeckOpen,
      inputRef: controls.newCategoryInputRef as RefObject<HTMLInputElement>,
    },
    controls: {
      onAddCustomCategory: addCustom,
      onBlurNumericField: controls.blurNumericField,
      onTogglePin: togglePin,
      onTogglePinAll: togglePinAll,
      onAddPack: addPack,
      onRemoveBuiltin: removeBuiltin,
      onRemoveAllCustom: removeAllCustom,
      onRemoveAllBuiltins: removeAllBuiltins,
      onCloseHowToPlay: () => controls.setIsHowToPlayOpen(false),
      onLanguageChange: controls.handleLanguageChange,
      onOpenHowToPlay: () => controls.setIsHowToPlayOpen(true),
      onReloadAfterChunkError: () => window.location.reload(),
      onRemoveCustomCategory: removeCustom,
      onRedrawCategories: () => board.redrawCategories(true),
      onStartRound: round.primaryAction,
      onToggleMute: () => update('isMuted', !settings.isMuted),
      onTogglePause: round.togglePause,
      onTogglePromptDeck: promptDeck.togglePromptDeck,
      onToggleTheme: () => update('theme', settings.theme === 'light' ? 'dark' : 'light'),
      onUpdateField: update,
      onNewLetter: round.newLetter,
      onNextRound: round.nextRound,
    },
    flags: {
      hasChunkError: controls.hasChunkError,
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
