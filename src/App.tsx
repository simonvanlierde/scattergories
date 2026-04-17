import { useEffect, useState } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { AppLoading } from './components/AppLoading';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GameShell } from './components/GameShell';
import { useGameSession } from './hooks/useGameSession';
import { SettingsProvider } from './hooks/useSettings';
import { i18n, initI18n, startupLocaleWarning } from './i18n/config';

initI18n().catch(() => undefined);

const BOOTSTRAP_ERROR_EYEBROW = 'Recovery mode';
const BOOTSTRAP_ERROR_TITLE = "We couldn't start the app.";
const BOOTSTRAP_ERROR_ACTION = 'Reload app';

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

    async function initializeApp() {
      try {
        await initI18n();
        if (isMounted) {
          setIsReady(true);
        }
      } catch (error: unknown) {
        if (isMounted) {
          setBootstrapError(
            error instanceof Error ? error : new Error('Unable to initialize i18n'),
          );
        }
      }
    }

    initializeApp().catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  if (bootstrapError) {
    return (
      <ErrorView
        eyebrow={BOOTSTRAP_ERROR_EYEBROW}
        title={BOOTSTRAP_ERROR_TITLE}
        message={bootstrapError.message}
        actionLabel={BOOTSTRAP_ERROR_ACTION}
      />
    );
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
