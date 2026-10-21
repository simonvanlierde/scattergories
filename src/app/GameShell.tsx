import { HelpCircle } from "lucide-react";
import { Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { canEditDeck } from "@/domain/game/roundReducer";
import { CategoriesPanel } from "@/features/categories/CategoriesPanel";
import { Playmat } from "@/features/round/Playmat";
import { SettingsCluster } from "@/features/settings/SettingsCluster";
import { BrandMark } from "@/shared/ui/BrandMark";
import { Button } from "@/shared/ui/Button";
import { cx } from "@/shared/ui/cx";
import { Icon } from "@/shared/ui/Icon";
import { IconButton } from "@/shared/ui/IconButton";
import type { GameController } from "./useGameController";
import { useOnboarding } from "./useOnboarding";

interface GameShellProps {
  game: GameController;
}

// Must match the two <meta name="theme-color"> tags in index.html — those cover
// the pre-JS/OS-default paint, this effect corrects them once the user's actual
// theme (which can diverge from the OS, e.g. after an in-app override) is known.
// The manifest's static theme_color can't be made conditional at all (no media
// support in that spec), so this is the only place installed/standalone chrome
// color can track the real theme.
const THEME_COLORS = { light: "#fcfaf4", dark: "#0d0804" } as const;

function ControlBar({ game }: { game: GameController }) {
  const { t, i18n } = useTranslation();

  return (
    <footer className="controlbar">
      {/* The die rolls while the letter spins and while the categories reroll — the
          mark reacts to the roll, it never triggers one; a logo is not a control. */}
      <div
        className={cx(
          "controlbar__brand",
          (game.round.phase === "spinning" || game.deck.spinning) && "controlbar__brand--rolling",
        )}
      >
        {/* Big enough to carry all three glyphs — they are what visibly roll. */}
        <BrandMark size={32} />
        <h1>{t("title")}</h1>
      </div>

      <div className="controlbar__actions">
        <SettingsCluster
          language={i18n.resolvedLanguage ?? i18n.language}
          isLanguagePending={game.app.isLanguagePending}
          theme={game.settings.theme}
          isMuted={game.settings.isMuted}
          avoidRepeats={game.settings.avoidRepeats}
          durationInput={game.settings.durationInput}
          bufferSecondsInput={game.settings.bufferSecondsInput}
          onLanguageChange={game.app.changeLanguage}
          onToggleTheme={game.settings.toggleTheme}
          onToggleMute={() => game.settings.toggle("isMuted")}
          onToggleAvoidRepeats={() => game.settings.toggle("avoidRepeats")}
          onUpdateTimingField={game.settings.update}
        />
        <IconButton
          label={t("buttons.howToPlay")}
          icon={<Icon icon={HelpCircle} size={20} />}
          onClick={game.app.openHowToPlay}
        />
      </div>
    </footer>
  );
}

function ChunkErrorBanner({ onReload }: { onReload: () => void }) {
  const { t } = useTranslation();

  return (
    <section className="banner banner--danger" role="alert" aria-label={t("errors.chunkTitle")}>
      <div>
        <strong>{t("errors.chunkTitle")}</strong>
        <p>{t("errors.chunkBody")}</p>
      </div>
      <Button variant="primary" onClick={onReload}>
        {t("errors.reload")}
      </Button>
    </section>
  );
}

interface PlayGridProps {
  game: GameShellProps["game"];
}

function PlayGrid({ game }: PlayGridProps) {
  const canEdit = canEditDeck(game.round.phase, game.round.isPaused);

  return (
    <section className={cx("play-grid", !game.deck.isPromptDeckOpen && "play-grid--deck-collapsed")}>
      <Playmat
        phase={game.round.phase}
        isPaused={game.round.isPaused}
        secondsLeft={game.round.secondsLeft}
        gameSeconds={game.settings.gameSeconds}
        letter={game.round.letter}
        letterVisible={game.round.letterVisible}
        letterLanding={game.round.letterLanding}
        statusKey={game.round.statusKey}
        roundNumber={game.round.roundNumber}
        onPrimary={game.round.primaryAction}
        onNewLetter={game.round.newLetter}
        onNextRound={game.round.nextRound}
      />

      <CategoriesPanel
        categories={{
          availableCount: game.deck.availableCount,
          catCountInput: game.settings.catCountInput,
          customCategories: game.settings.customCategories,
          deckBuiltins: game.settings.deckBuiltins,
          pinned: game.settings.pinned,
          drawnCategories: game.deck.drawnCategories,
          drawnCustomCategories: game.deck.drawnCustom,
          isLanding: game.deck.landing,
          isRerolling: game.deck.spinning,
          isPromptDeckOpen: game.deck.isPromptDeckOpen,
          canEdit,
        }}
        inputRef={game.deck.inputRef}
        actions={{
          onAddCustom: game.deck.addCustom,
          onRemoveCustom: game.deck.removeCustom,
          onRemoveBuiltin: game.deck.removeBuiltin,
          onTogglePin: game.deck.togglePin,
          onAddPack: game.deck.addPack,
          onRemoveAllCustom: game.deck.removeAllCustom,
          onRemoveAllBuiltins: game.deck.removeAllBuiltins,
          onCatCountChange: (value) => game.settings.update("catCountInput", value),
          onRedraw: game.deck.redraw,
          onTogglePinAll: game.deck.togglePinAll,
          onTogglePromptDeck: game.deck.togglePromptDeck,
          onTogglePause: game.round.togglePause,
        }}
      />
    </section>
  );
}

function GameShell({ game }: GameShellProps) {
  const { t } = useTranslation();
  const onboarding = useOnboarding();

  useEffect(() => {
    const color = THEME_COLORS[game.settings.theme];
    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
      meta.setAttribute("content", color);
    }
  }, [game.settings.theme]);

  return (
    <main className={cx("app-shell", game.round.alarmOn && "alarm")} data-theme={game.settings.theme}>
      <div className="app">
        {game.app.hasChunkError ? <ChunkErrorBanner onReload={game.app.reload} /> : null}

        <PlayGrid game={game} />

        <ControlBar game={game} />
      </div>

      {/* The rules are the welcome: on first run they open with a CTA that rolls
          the opening letter, otherwise they are the ? button's dialog. */}
      {onboarding.needsOnboarding || game.app.isHowToPlayOpen ? (
        <Suspense
          fallback={
            <div className="modal-loading" role="status" aria-live="polite">
              {t("modal.loading")}
            </div>
          }
        >
          <game.app.HowToPlayDialog
            onClose={onboarding.needsOnboarding ? onboarding.complete : game.app.closeHowToPlay}
            onStart={
              onboarding.needsOnboarding
                ? () => {
                    onboarding.complete();
                    game.round.primaryAction();
                  }
                : undefined
            }
          />
        </Suspense>
      ) : null}
    </main>
  );
}

export { GameShell };
