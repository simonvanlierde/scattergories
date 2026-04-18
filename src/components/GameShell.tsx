import { Award, HelpCircle, Settings as SettingsIcon } from 'lucide-react';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { useGameSession } from '../hooks/useGameSession';
import { useIsDesktopLayout } from '../hooks/useIsDesktopLayout';
import { useOnboarding } from '../hooks/useOnboarding';
import { getAchievementById } from '../lib/achievements';
import { AppFooter } from './AppFooter';
import { AppRail } from './AppRail';
import { CategoriesPanel } from './CategoriesPanel';
import { OnboardingBanner } from './OnboardingBanner';
import { PauseOverlay } from './PauseOverlay';
import { Playmat } from './Playmat';
import { SettingsSheet } from './SettingsSheet';
import { ShortcutsSheet } from './ShortcutsSheet';
import { BrandMark } from './ui/BrandMark';
import { Icon } from './ui/Icon';
import { IconButton } from './ui/IconButton';
import { type ToastItem, ToastRegion } from './ui/Toast';

type SettingsScrollTarget = 'achievements';

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
  session: ReturnType<typeof useGameSession>;
  startupLocaleWarning: string | null;
}

interface TopBarProps {
  session: ReturnType<typeof useGameSession>;
  onOpenSettings: () => void;
}

function TopBar({ session, onOpenSettings }: TopBarProps) {
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
          onClick={session.controls.onToggleHowToPlay}
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
  session: GameShellProps['session'];
  onOpenSettings: () => void;
  onAchievementsUnlocked: (ids: string[]) => void;
}

function PlayGrid({ session, onOpenSettings, onAchievementsUnlocked }: PlayGridProps) {
  return (
    <section className="play-grid">
      <Playmat
        session={session}
        onOpenSettings={onOpenSettings}
        onAchievementsUnlocked={onAchievementsUnlocked}
      />

      <CategoriesPanel
        categories={{
          availableCount: session.categories.availableCount,
          catCountInput: session.settings.catCountInput,
          customCategories: session.settings.customCategories,
          isPromptDeckOpen: session.flags.isPromptDeckOpen,
          mode: session.settings.categoryMode,
          newCategoryInput: session.categories.newCategoryInput,
        }}
        inputRef={session.categories.inputRef}
        isCompactLayout={session.flags.isCompactLayout}
        actions={{
          onAddCustom: session.controls.onAddCustomCategory,
          onCategoryModeChange: session.controls.onCategoryModeChange,
          onCatCountBlur: () => session.controls.onBlurNumericField('catCountInput'),
          onCatCountChange: (value) => session.controls.onUpdateField('catCountInput', value),
          onNewCategoryInputChange: session.categories.setNewCategoryInput,
          onRemoveCustom: session.controls.onRemoveCustomCategory,
          onShuffle: session.controls.onRedrawCategories,
          onTogglePromptDeck: session.controls.onTogglePromptDeck,
        }}
      />
    </section>
  );
}

function useAchievementToasts() {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const onUnlocked = useCallback(
    (ids: string[]) => {
      const nowMs = Date.now();
      const next: ToastItem[] = ids.flatMap((id) => {
        const achievement = getAchievementById(id);
        if (!achievement) {
          return [];
        }
        return [
          {
            id: `${achievement.id}-${nowMs}`,
            title: t('achievements.unlocked', { defaultValue: 'Achievement unlocked' }),
            description: t(achievement.labelKey, { defaultValue: achievement.fallbackLabel }),
            icon: <Icon icon={Award} size={18} />,
            tone: 'accent' as const,
          },
        ];
      });
      if (next.length > 0) {
        setToasts((prev) => [...prev, ...next]);
      }
    },
    [t],
  );

  return { toasts, dismiss, onUnlocked };
}

function useShellState() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsScrollTo, setSettingsScrollTo] = useState<SettingsScrollTarget | undefined>(
    undefined,
  );
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const openSettings = useCallback((target?: SettingsScrollTarget) => {
    setSettingsScrollTo(target);
    setIsSettingsOpen(true);
  }, []);
  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
    setSettingsScrollTo(undefined);
  }, []);
  const toggleShortcuts = useCallback(() => {
    setIsShortcutsOpen((open) => !open);
  }, []);
  const closeShortcuts = useCallback(() => setIsShortcutsOpen(false), []);

  useShortcutKey(toggleShortcuts);

  return {
    isSettingsOpen,
    settingsScrollTo,
    isShortcutsOpen,
    openSettings,
    closeSettings,
    toggleShortcuts,
    closeShortcuts,
  };
}

function GameShell({ session, startupLocaleWarning }: GameShellProps) {
  const { t, i18n } = useTranslation();
  const shell = useShellState();
  const achievementToasts = useAchievementToasts();
  const onboarding = useOnboarding();
  const isDesktopLayout = useIsDesktopLayout();
  const canEditSession = session.round.phase === 'idle' || session.round.phase === 'done';

  return (
    <main
      className={`app-shell${session.round.alarmOn ? ' alarm' : ''}`}
      data-theme={session.settings.theme}
    >
      <div className="app-shell__bg" aria-hidden="true" />
      {isDesktopLayout ? (
        <AppRail
          onOpenSettings={() => shell.openSettings()}
          onOpenAchievements={() => shell.openSettings('achievements')}
          onToggleHowToPlay={session.controls.onToggleHowToPlay}
          onOpenShortcuts={shell.toggleShortcuts}
        />
      ) : null}
      <div className="app">
        <TopBar session={session} onOpenSettings={() => shell.openSettings()} />

        {startupLocaleWarning ? <WarningBanner message={startupLocaleWarning} /> : null}

        {session.flags.hasChunkError ? (
          <ChunkErrorBanner onReload={session.controls.onReloadAfterChunkError} />
        ) : null}

        {onboarding.isOnboarded ? null : <OnboardingBanner onDismiss={onboarding.dismiss} />}

        <PlayGrid
          session={session}
          onOpenSettings={() => shell.openSettings()}
          onAchievementsUnlocked={achievementToasts.onUnlocked}
        />

        <AppFooter />
      </div>

      <SettingsSheet
        open={shell.isSettingsOpen}
        onClose={shell.closeSettings}
        language={i18n.resolvedLanguage ?? i18n.language}
        isLanguagePending={session.flags.isLanguagePending}
        theme={session.settings.theme}
        canEditSession={canEditSession}
        durationInput={session.settings.durationInput}
        totalRoundsInput={session.settings.totalRoundsInput}
        activePack={session.settings.activePack}
        scrollTo={shell.settingsScrollTo}
        onLanguageChange={session.controls.onLanguageChange}
        onToggleTheme={session.controls.onToggleTheme}
        onUpdateSessionField={session.controls.onUpdateField}
        onBlurSessionField={session.controls.onBlurNumericField}
        onActivePackChange={session.controls.onActivePackChange}
      />

      <ShortcutsSheet open={shell.isShortcutsOpen} onClose={shell.closeShortcuts} />

      {session.flags.isHowToPlayOpen ? (
        <Suspense
          fallback={
            <div className="modal-loading" role="status" aria-live="polite">
              {t('modal.loading', { defaultValue: 'Opening rules…' })}
            </div>
          }
        >
          <session.howToPlayDialog onClose={session.controls.onToggleHowToPlay} />
        </Suspense>
      ) : null}

      {session.round.isPaused &&
      (session.round.phase === 'running' || session.round.phase === 'buffer') ? (
        <PauseOverlay onResume={session.controls.onTogglePause} />
      ) : null}

      <ToastRegion toasts={achievementToasts.toasts} onDismiss={achievementToasts.dismiss} />
    </main>
  );
}

export { GameShell };
