import { getPreferredTheme } from "@/features/settings/schema";
import { bootLanguage } from "@/i18n/config";
import { getBootMessages } from "./bootMessages";

function AppLoading() {
  const messages = getBootMessages(bootLanguage);
  return (
    <main className="app-shell app-shell--loading" data-theme={getPreferredTheme()}>
      <div className="app-loading" role="status" aria-live="polite">
        <p className="eyebrow">Scattergories</p>
        <h1>{messages.loadingTitle}</h1>
        <p>{messages.loadingBody}</p>
      </div>
    </main>
  );
}

export { AppLoading };
