import { HelpCircle, Settings as SettingsIcon } from 'lucide-react';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CategoriesPanel } from '@/features/categories/CategoriesPanel';
import { PauseOverlay } from '@/features/round/PauseOverlay';
import { Playmat } from '@/features/round/Playmat';
import { SettingsSheet } from '@/features/settings/SettingsSheet';
import { BrandMark } from '@/shared/ui/BrandMark';
import { Icon } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/IconButton';
import { AppFooter } from './AppFooter';
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

interface TopBarProps {
  game: GameController;
  onOpenSettings: () => void;
}

function TopBar({ game, onOpenSettings }: TopBarProps) {
  const { t } = useTranslation();

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <BrandMark />
        <h1>{t('title')}</h1>
      </div>

      <div className="topbar__actions">
        <IconButton
          label={t('settings.openLabel', { defaultValue: 'Settings' })}
          icon={<Icon icon={SettingsIcon} size={20} />}
          onClick={onOpenSettings}
        />
        <IconButton
          label={t('footer.howToPlay')}
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
  onOpenSettings: () => void;
}

function PlayGrid({ game, onOpenSettings }: PlayGridProps) {
  return (
    <section className="play-grid">
      <Playmat game={game} onOpenSettings={onOpenSettings} />

      <CategoriesPanel
        categories={{
          availableCount: game.categories.availableCount,
          catCountInput: game.settings.catCountInput,
          customCategories: game.settings.customCategories,
          drawnCategories: game.categories.drawnCategories,
          isPromptDeckOpen: game.flags.isPromptDeckOpen,
          mode: game.settings.categoryMode,
          refreshMode: game.settings.categoryRefreshMode,
          newCategoryInput: game.categories.newCategoryInput,
        }}
        inputRef={game.categories.inputRef}
        actions={{
          onAddCustom: game.controls.onAddCustomCategory,
          onCategoryModeChange: game.controls.onCategoryModeChange,
          onCategoryRefreshModeChange: game.controls.onCategoryRefreshModeChange,
          onCatCountBlur: () => game.controls.onBlurNumericField('catCountInput'),
          onCatCountChange: (value) => game.controls.onUpdateField('catCountInput', value),
          onNewCategoryInputChange: game.categories.setNewCategoryInput,
          onRemoveCustom: game.controls.onRemoveCustomCategory,
          onShuffle: game.controls.onRedrawCategories,
          onTogglePromptDeck: game.controls.onTogglePromptDeck,
        }}
      />
    </section>
  );
}

function useShellState() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const openSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);
  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);
  const toggleShortcuts = useCallback(() => {
    setIsShortcutsOpen((open) => !open);
  }, []);
  const closeShortcuts = useCallback(() => setIsShortcutsOpen(false), []);

  useShortcutKey(toggleShortcuts);

  return {
    isSettingsOpen,
    isShortcutsOpen,
    openSettings,
    closeSettings,
    toggleShortcuts,
    closeShortcuts,
  };
}

function GameShell({ game, startupLocaleWarning }: GameShellProps) {
  const { t, i18n } = useTranslation();
  const shell = useShellState();
  const canEditRoundSettings = game.round.phase === 'idle' || game.round.phase === 'done';

  return (
    <main
      className={`app-shell${game.round.alarmOn ? ' alarm' : ''}`}
      data-theme={game.settings.theme}
    >
      <div className="app-shell__bg" aria-hidden="true" />
      <div className="app">
        <TopBar game={game} onOpenSettings={() => shell.openSettings()} />

        {startupLocaleWarning ? <WarningBanner message={startupLocaleWarning} /> : null}

        {game.flags.hasChunkError ? (
          <ChunkErrorBanner onReload={game.controls.onReloadAfterChunkError} />
        ) : null}

        <PlayGrid game={game} onOpenSettings={() => shell.openSettings()} />

        <AppFooter />
      </div>

      <SettingsSheet
        open={shell.isSettingsOpen}
        onClose={shell.closeSettings}
        language={i18n.resolvedLanguage ?? i18n.language}
        isLanguagePending={game.flags.isLanguagePending}
        theme={game.settings.theme}
        canEditRoundSettings={canEditRoundSettings}
        durationInput={game.settings.durationInput}
        activePack={game.settings.activePack}
        onLanguageChange={game.controls.onLanguageChange}
        onToggleTheme={game.controls.onToggleTheme}
        onUpdateTimingField={game.controls.onUpdateField}
        onBlurTimingField={game.controls.onBlurNumericField}
        onActivePackChange={game.controls.onActivePackChange}
      />

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

      {game.round.isPaused && (game.round.phase === 'running' || game.round.phase === 'buffer') ? (
        <PauseOverlay onResume={game.controls.onTogglePause} />
      ) : null}
    </main>
  );
}

export { GameShell };
