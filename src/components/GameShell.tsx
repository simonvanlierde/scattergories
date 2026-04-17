import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import type { useGameSession } from '../hooks/useGameSession';
import { getEnabledLocales, isLocaleEnabled } from '../i18n/localeHealth';
import { getNativeName, SUPPORTED_LOCALES } from '../i18n/localeRegistry';
import { AppFooter } from './AppFooter';
import { CategoriesPanel } from './CategoriesPanel';
import { TimerPanel } from './TimerPanel';

// spell-checker: ignore lede

interface GameShellProps {
  session: ReturnType<typeof useGameSession>;
  startupLocaleWarning: string | null;
}

function HeroSection({ session }: Pick<GameShellProps, 'session'>) {
  const { t } = useTranslation();

  return (
    <header className="hero">
      <div className="hero__copy">
        <p className="eyebrow">{t('hero.eyebrow', { defaultValue: 'Party game companion' })}</p>
        <h1>{t('title')}</h1>
        <p className="hero__lede">
          {t('hero.description', {
            defaultValue:
              'Spin a locale-aware letter, draw a fresh deck of prompts, and keep every round moving.',
          })}
        </p>
      </div>
      <div className="hero__meta">
        <div className="hero-stat">
          <span>{t('settings.duration')}</span>
          <strong>
            {t('hero.timerValue', {
              defaultValue: '{{count}}s',
              count: session.settings.gameSeconds,
            })}
          </strong>
        </div>
        <div className="hero-stat">
          <span>{t('settings.rounds')}</span>
          <strong>{session.settings.totalRounds}</strong>
        </div>
        <div className="hero-stat">
          <span>{t('settings.categoryDraw')}</span>
          <strong>{session.categories.normalizedCategoryCount}</strong>
        </div>
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

function PlayGrid({ session }: Pick<GameShellProps, 'session'>) {
  return (
    <section className="play-grid">
      <TimerPanel
        round={{
          ...session.round,
          hasMoreRounds: session.flags.hasMoreRounds,
        }}
        settings={{
          durationInput: session.settings.durationInput,
          isMuted: session.settings.isMuted,
          totalRounds: session.settings.totalRounds,
          totalRoundsInput: session.settings.totalRoundsInput,
        }}
        actions={{
          onDurationBlur: () => session.controls.onBlurNumericField('durationInput'),
          onDurationChange: (value) => session.controls.onUpdateField('durationInput', value),
          onNewGame: session.controls.onNewGame,
          onPause: session.controls.onTogglePause,
          onReset: session.controls.onResetRound,
          onSkip: session.controls.onSkipLetter,
          onStart: session.controls.onStartRound,
          onToggleMute: session.controls.onToggleMute,
          onTotalRoundsBlur: () => session.controls.onBlurNumericField('totalRoundsInput'),
          onTotalRoundsChange: (value) => session.controls.onUpdateField('totalRoundsInput', value),
        }}
      />

      <CategoriesPanel
        categories={{
          availableCount: session.categories.availableCount,
          catCountInput: session.settings.catCountInput,
          customCategories: session.settings.customCategories,
          drawnCategories: session.categories.drawnCategories,
          mode: session.settings.categoryMode,
          newCategoryInput: session.categories.newCategoryInput,
          usedLetters: session.round.usedLetters,
        }}
        inputRef={session.categories.inputRef}
        actions={{
          onAddCustom: session.controls.onAddCustomCategory,
          onCategoryModeChange: session.controls.onCategoryModeChange,
          onCatCountBlur: () => session.controls.onBlurNumericField('catCountInput'),
          onCatCountChange: (value) => session.controls.onUpdateField('catCountInput', value),
          onNewCategoryInputChange: session.categories.setNewCategoryInput,
          onRemoveCustom: session.controls.onRemoveCustomCategory,
          onShuffle: session.controls.onRedrawCategories,
        }}
      />
    </section>
  );
}

function FooterSection({ session }: Pick<GameShellProps, 'session'>) {
  const { i18n } = useTranslation();
  const enabledLocales = getEnabledLocales();

  return (
    <AppFooter
      currentLanguage={i18n.resolvedLanguage ?? i18n.language}
      isLanguagePending={session.flags.isLanguagePending}
      languageOptions={SUPPORTED_LOCALES.map((code) => ({
        code,
        isDisabled: !(enabledLocales.includes(code) && isLocaleEnabled(code)),
        nativeName: getNativeName(code),
      }))}
      theme={session.settings.theme}
      onLanguageChange={session.controls.onLanguageChange}
      onShowHowToPlay={session.controls.onToggleHowToPlay}
      onToggleTheme={session.controls.onToggleTheme}
    />
  );
}

function GameShell({ session, startupLocaleWarning }: GameShellProps) {
  const { t } = useTranslation();

  return (
    <main
      className={`app-shell${session.round.alarmOn ? ' alarm' : ''}`}
      data-theme={session.settings.theme}
    >
      <div className="app-shell__bg" aria-hidden="true" />
      <div className="app">
        <HeroSection session={session} />

        {startupLocaleWarning ? <WarningBanner message={startupLocaleWarning} /> : null}

        {session.flags.hasChunkError ? (
          <ChunkErrorBanner onReload={session.controls.onReloadAfterChunkError} />
        ) : null}

        <PlayGrid session={session} />

        <FooterSection session={session} />
      </div>

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
    </main>
  );
}

export { GameShell };
