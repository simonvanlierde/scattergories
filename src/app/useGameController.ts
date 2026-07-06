import type { RefObject } from "react";
import { type ComponentType, lazy, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Phase, StatusKey } from "@/domain/game/roundReducer";
import { useRound } from "@/features/round/useRound";
import { useSettings } from "@/features/settings/SettingsProvider";
import { useAppControls } from "./useAppControls";
import { useCategoryBoard } from "./useCategoryBoard";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { usePromptDeckState } from "./usePromptDeckState";
import { useRoundSetup } from "./useRoundSetup";

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
    onToggleAvoidRepeats: () => void;
    onToggleMute: () => void;
    onTogglePause: () => void;
    onTogglePromptDeck: () => void;
    onToggleTheme: () => void;
    onUpdateField: ReturnType<typeof useSettings>["update"];
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
  };
  settings: ReturnType<typeof useSettings>["settings"] & {
    gameSeconds: number;
  };
  howToPlayDialog: ComponentType<{ onClose: () => void }>;
}

const HowToPlayDialog = lazy(async () => ({
  // biome-ignore lint/security/noSecrets: module export name, not a secret — high-entropy false positive.
  default: (await import("./HowToPlayModal")).HowToPlayModal,
}));

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
    avoidRepeats: settings.avoidRepeats,
    onLetterPicked: () => board.redrawCategories(true),
  });
  roundInProgressRef.current = round.phase === "buffer" || round.phase === "running";
  const controls = useAppControls({ i18n });

  // Same gate as ActionBar's New-letter button so the 'R' shortcut can't wipe a
  // running round the button wouldn't let you touch: reroll only during the
  // get-ready countdown or while paused, never mid-play.
  const isPausedRound = (round.phase === "buffer" || round.phase === "running") && round.isPaused;
  const canReroll = round.phase === "buffer" || isPausedRound;

  useKeyboardShortcuts({
    onSpace: round.primaryAction,
    onR: () => {
      if (canReroll) {
        round.newLetter();
      }
    },
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
      onToggleAvoidRepeats: () => update("avoidRepeats", !settings.avoidRepeats),
      onToggleMute: () => update("isMuted", !settings.isMuted),
      onTogglePause: round.togglePause,
      onTogglePromptDeck: promptDeck.togglePromptDeck,
      onToggleTheme: () => update("theme", settings.theme === "light" ? "dark" : "light"),
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
