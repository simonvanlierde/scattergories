import { useEffect, useState } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import { SettingsProvider } from "@/features/settings/SettingsProvider";
import { getPreferredTheme } from "@/features/settings/schema";
import { bootLanguage, i18n, initI18n } from "@/i18n/config";
import { AppLoading } from "./AppLoading";
import { getBootMessages } from "./bootMessages";
import { ErrorBoundary } from "./ErrorBoundary";
import { GameShell } from "./GameShell";
import { useGameController } from "./useGameController";

interface ErrorViewProps {
  eyebrow: string;
  title: string;
  message: string;
  actionLabel: string;
}

function ErrorView({ eyebrow, title, message, actionLabel }: ErrorViewProps) {
  return (
    <main className="app-shell" data-theme={getPreferredTheme()}>
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

function BootstrapErrorFallback() {
  const messages = getBootMessages(bootLanguage);
  return (
    <ErrorView
      eyebrow={messages.errorEyebrow}
      title={messages.errorTitle}
      message={messages.errorBody}
      actionLabel={messages.reload}
    />
  );
}

function AppErrorFallback() {
  const { t } = useTranslation();

  return (
    <ErrorView
      eyebrow={t("errors.boundaryEyebrow")}
      title={t("errors.boundaryTitle")}
      message={t("errors.boundaryBody")}
      actionLabel={t("errors.reload")}
    />
  );
}

function AppContent() {
  const game = useGameController();

  return (
    <ErrorBoundary fallback={<AppErrorFallback />}>
      <GameShell game={game} />
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

function App() {
  const [isReady, setIsReady] = useState(false);
  const [bootFailed, setBootFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    initI18n().then(
      () => {
        if (isMounted) {
          setIsReady(true);
        }
      },
      (error: unknown) => {
        // The player sees a plain-language screen; the detail stays in the console.
        // biome-ignore lint/suspicious/noConsole: the only record of why boot failed.
        console.error("App failed to start:", error);
        if (isMounted) {
          setBootFailed(true);
        }
      },
    );

    return () => {
      isMounted = false;
    };
  }, []);

  if (bootFailed) {
    return <BootstrapErrorFallback />;
  }

  if (!isReady) {
    return <AppLoading />;
  }

  return <AppProviders />;
}

export { App };
