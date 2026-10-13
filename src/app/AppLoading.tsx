import { getPreferredTheme } from "@/features/settings/schema";
import { bootMessages } from "./bootMessages";

function AppLoading() {
  return (
    <main className="app-shell app-shell--loading" data-theme={getPreferredTheme()}>
      <div className="app-loading" role="status" aria-live="polite">
        <p className="eyebrow">Scattergories</p>
        <h1>{bootMessages.loadingTitle}</h1>
        <p>{bootMessages.loadingBody}</p>
      </div>
    </main>
  );
}

export { AppLoading };
