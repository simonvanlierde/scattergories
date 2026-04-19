import { useEffect, useState } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { AppLoading } from './components/AppLoading';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GameShell } from './components/GameShell';
import { useGameSession } from './hooks/useGameSession';
import { SettingsProvider } from './hooks/useSettings';
import { i18n, initI18n, startupLocaleWarning } from './i18n/config';

initI18n().catch(() => undefined);

interface ErrorViewProps {
  eyebrow: string;
  title: string;
  message: string;
  actionLabel: string;
}

function ErrorView({ eyebrow, title, message, actionLabel }: ErrorViewProps) {
  return (
    <main className="app-shell" data-theme="dark">
      <section className="app-error" role="alert">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{message}</p>
        <button type="button" onClick={() => window.location.reload()}>
          {actionLabel}
        </button>
      </section>
    </main>
  );
}

function BootstrapErrorFallback({ error }: { error: Error }) {
  return (
    <ErrorView
      eyebrow="Recovery mode"
      title="We couldn't start the app."
      message={error.message}
      actionLabel="Reload app"
    />
  );
}

function AppErrorFallback() {
  const { t } = useTranslation();

  return (
    <ErrorView
      eyebrow={t('errors.boundaryEyebrow', { defaultValue: 'Recovery mode' })}
      title={t('errors.boundaryTitle', { defaultValue: 'Something went wrong.' })}
      message={t('errors.boundaryBody', {
        defaultValue: 'Reload the app to reset the current session and continue playing.',
      })}
      actionLabel={t('errors.reload', { defaultValue: 'Reload app' })}
    />
  );
}

function AppContent() {
  const session = useGameSession();

  return (
    <ErrorBoundary fallback={<AppErrorFallback />}>
      <GameShell session={session} startupLocaleWarning={startupLocaleWarning} />
    </ErrorBoundary>
  );
}

function AppProviders() {
  return (
    <I18nextProvider i18n={i18n}>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </I18nextProvider>
  );
}

function AppBootstrap() {
  const [isReady, setIsReady] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    initI18n().then(
      () => {
        if (isMounted) {
          setIsReady(true);
        }
      },
      (error: unknown) => {
        if (isMounted) {
          setBootstrapError(
            error instanceof Error ? error : new Error('Unable to initialize i18n'),
          );
        }
      },
    );

    return () => {
      isMounted = false;
    };
  }, []);

  if (bootstrapError) {
    return <BootstrapErrorFallback error={bootstrapError} />;
  }

  if (!isReady) {
    return <AppLoading />;
  }

  return <AppProviders />;
}

function App() {
  return <AppBootstrap />;
}

export { App };
