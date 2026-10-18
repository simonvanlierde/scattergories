import { lazy } from "react";
import { useTranslation } from "react-i18next";
import { useRound } from "@/features/round/useRound";
import { useSettings } from "@/features/settings/SettingsProvider";
import { useAppControls } from "./useAppControls";
import { useCategoryBoard } from "./useCategoryBoard";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";
import { usePromptDeckState } from "./usePromptDeckState";
import { useRoundSetup } from "./useRoundSetup";

// NOTE: fetch starts at module load (app boot), not at first Suspense — first-run
// visitors need this chunk immediately, so warming it early avoids a loading flash
// while keeping it split out of the main bundle for the budget check.
// biome-ignore lint/security/noSecrets: module export name, not a secret — high-entropy false positive.
const howToPlayModalPromise = import("./HowToPlayModal");
const HowToPlayDialog = lazy(async () => ({
  default: (await howToPlayModalPromise).HowToPlayModal,
}));

/**
 * The one boundary between src/app/ and the feature hooks, grouped by concern:
 * `round` (letter and clock), `deck` (drawn categories and deck edits),
 * `settings` (saved values and their setters) and `app` (dialogs, language, errors).
 */
function useGameController() {
  const { settings, update, ...deckEdits } = useSettings();
  const { i18n } = useTranslation();
  const promptDeck = usePromptDeckState(settings.promptDeckPreference, update);
  const roundSetup = useRoundSetup(settings);
  const round = useRound({
    gameSeconds: roundSetup.gameSeconds,
    bufferSeconds: roundSetup.bufferSeconds,
    isMuted: settings.isMuted,
    locale: i18n.resolvedLanguage ?? i18n.language,
    avoidRepeats: settings.avoidRepeats,
    // Only called from a spin, after this render has defined `board`.
    onLetterPicked: () => board.redrawCategories(true),
  });
  const board = useCategoryBoard({
    customCategories: roundSetup.customCategories,
    deckBuiltins: roundSetup.deckBuiltins,
    pinned: roundSetup.pinned,
    count: roundSetup.normalizedCategoryCount,
    // Deck edits made mid-round wait for the next redraw.
    deferCompose: round.phase === "buffer" || round.phase === "running",
  });
  const app = useAppControls({ i18n });
  const openHowToPlay = () => app.setIsHowToPlayOpen(true);

  // Same gate as ActionBar's New-letter button so the 'R' shortcut can't wipe a
  // running round the button wouldn't let you touch: reroll only during the
  // get-ready countdown or while paused, never mid-play.
  const canReroll = round.phase === "buffer" || (round.phase === "running" && round.isPaused);

  useKeyboardShortcuts({
    onSpace: round.primaryAction,
    onR: () => {
      if (canReroll) {
        round.newLetter();
      }
    },
    onP: round.togglePause,
    onC: promptDeck.togglePromptDeck,
    onHelp: openHowToPlay,
  });

  return {
    round,
    deck: {
      ...board,
      ...deckEdits,
      ...promptDeck,
      availableCount: roundSetup.availableCount,
      redraw: () => board.redrawCategories(true),
      inputRef: app.newCategoryInputRef,
    },
    settings: {
      ...settings,
      gameSeconds: roundSetup.gameSeconds,
      update,
      toggle: (key: "isMuted" | "avoidRepeats") => update(key, !settings[key]),
      toggleTheme: () => update("theme", settings.theme === "light" ? "dark" : "light"),
    },
    app: {
      hasChunkError: app.hasChunkError,
      isHowToPlayOpen: app.isHowToPlayOpen,
      isLanguagePending: app.isLanguagePending,
      changeLanguage: app.handleLanguageChange,
      openHowToPlay,
      closeHowToPlay: () => app.setIsHowToPlayOpen(false),
      reload: () => window.location.reload(),
      HowToPlayDialog,
    },
  };
}

type GameController = ReturnType<typeof useGameController>;

export type { GameController };
export { useGameController };
