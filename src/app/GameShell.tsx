import { HelpCircle } from 'lucide-react';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { canEditDeck } from '@/domain/game/roundReducer';
import { CategoriesPanel } from '@/features/categories/CategoriesPanel';
import { Playmat } from '@/features/round/Playmat';
import { SettingsCluster } from '@/features/settings/SettingsCluster';
import { BrandMark } from '@/shared/ui/BrandMark';
import { Icon } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/IconButton';
import { ShortcutsSheet } from './ShortcutsSheet';
import type { GameController } from './useGameController';

function useShortcutKey(onToggle: () => void) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '?' || event.defaultPrevented) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      onToggle();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onToggle]);
}

interface GameShellProps {
  game: GameController;
  startupLocaleWarning: string | null;
}

function TopBar({ game }: { game: GameController }) {
  const { t, i18n } = useTranslation();

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <BrandMark />
        <h1>{t('title')}</h1>
      </div>

      <div className="topbar__actions">
        <SettingsCluster
          language={i18n.resolvedLanguage ?? i18n.language}
          isLanguagePending={game.flags.isLanguagePending}
          theme={game.settings.theme}
          isMuted={game.settings.isMuted}
          durationInput={game.settings.durationInput}
          bufferSecondsInput={game.settings.bufferSecondsInput}
          onLanguageChange={game.controls.onLanguageChange}
          onToggleTheme={game.controls.onToggleTheme}
          onToggleMute={game.controls.onToggleMute}
          onUpdateTimingField={game.controls.onUpdateField}
          onBlurTimingField={game.controls.onBlurNumericField}
        />
        <IconButton
          label={t('buttons.howToPlay')}
          icon={<Icon icon={HelpCircle} size={20} />}
          onClick={game.controls.onOpenHowToPlay}
        />
      </div>
    </header>
  );
}

function WarningBanner({ message }: { message: string }) {
  return (
    <p className="banner banner--warning" role="alert">
      {message}
    </p>
  );
}

function ChunkErrorBanner({ onReload }: { onReload: () => void }) {
  const { t } = useTranslation();

  return (
    <section
      className="banner banner--danger"
      role="alert"
      aria-label={t('errors.chunkTitle', { defaultValue: 'Update available' })}
    >
      <div>
        <strong>{t('errors.chunkTitle', { defaultValue: 'A fresh app version is ready.' })}</strong>
        <p>
          {t('errors.chunkBody', {
            defaultValue:
              'One of the interface chunks changed while the app was open. Reload to continue safely.',
          })}
        </p>
      </div>
      <button type="button" onClick={onReload}>
        {t('errors.reload', { defaultValue: 'Reload app' })}
      </button>
    </section>
  );
}

interface PlayGridProps {
  game: GameShellProps['game'];
}

function PlayGrid({ game }: PlayGridProps) {
  const canEdit = canEditDeck(game.round.phase, game.round.isPaused);

  return (
    <section className="play-grid">
      <Playmat game={game} />

      <CategoriesPanel
        categories={{
          availableCount: game.categories.availableCount,
          catCountInput: game.settings.catCountInput,
          customCategories: game.settings.customCategories,
          deckBuiltins: game.settings.deckBuiltins,
          pinned: game.settings.pinned,
          drawnCategories: game.categories.drawnCategories,
          isLanding: game.categories.isLanding,
          isPromptDeckOpen: game.flags.isPromptDeckOpen,
          canEdit,
        }}
        inputRef={game.categories.inputRef}
        actions={{
          onAddCustom: game.controls.onAddCustomCategory,
          onRemoveCustom: game.controls.onRemoveCustomCategory,
          onRemoveBuiltin: game.controls.onRemoveBuiltin,
          onTogglePin: game.controls.onTogglePin,
          onAddPack: game.controls.onAddPack,
          onRemoveAllCustom: game.controls.onRemoveAllCustom,
          onRemoveAllBuiltins: game.controls.onRemoveAllBuiltins,
          onCatCountBlur: () => game.controls.onBlurNumericField('catCountInput'),
          onCatCountChange: (value) => game.controls.onUpdateField('catCountInput', value),
          onRedraw: game.controls.onRedrawCategories,
          onTogglePinAll: game.controls.onTogglePinAll,
          onTogglePromptDeck: game.controls.onTogglePromptDeck,
        }}
      />
    </section>
  );
}

function useShellState() {
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const toggleShortcuts = useCallback(() => {
    setIsShortcutsOpen((open) => !open);
  }, []);
  const closeShortcuts = useCallback(() => setIsShortcutsOpen(false), []);

  useShortcutKey(toggleShortcuts);

  return {
    isShortcutsOpen,
    toggleShortcuts,
    closeShortcuts,
  };
}

function GameShell({ game, startupLocaleWarning }: GameShellProps) {
  const { t } = useTranslation();
  const shell = useShellState();

  return (
    <main
      className={`app-shell${game.round.alarmOn ? ' alarm' : ''}`}
      data-theme={game.settings.theme}
    >
      <div className="app-shell__bg" aria-hidden="true" />
      <div className="app">
        <TopBar game={game} />

        {startupLocaleWarning ? <WarningBanner message={startupLocaleWarning} /> : null}

        {game.flags.hasChunkError ? (
          <ChunkErrorBanner onReload={game.controls.onReloadAfterChunkError} />
        ) : null}

        <PlayGrid game={game} />
      </div>

      <ShortcutsSheet open={shell.isShortcutsOpen} onClose={shell.closeShortcuts} />

      {game.flags.isHowToPlayOpen ? (
        <Suspense
          fallback={
            <div className="modal-loading" role="status" aria-live="polite">
              {t('modal.loading', { defaultValue: 'Opening rules…' })}
            </div>
          }
        >
          <game.howToPlayDialog onClose={game.controls.onCloseHowToPlay} />
        </Suspense>
      ) : null}
    </main>
  );
}

export { GameShell };
