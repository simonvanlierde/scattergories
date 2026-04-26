const LOADING_EYEBROW = 'Scattergories';
const LOADING_TITLE = 'Loading your game night...';
const LOADING_BODY = 'Preparing locales, controls, and categories.';

function AppLoading() {
  return (
    <main className="app-shell app-shell--loading" data-theme="dark">
      <div className="app-loading" role="status" aria-live="polite">
        <p className="eyebrow">{LOADING_EYEBROW}</p>
        <h1>{LOADING_TITLE}</h1>
        <p>{LOADING_BODY}</p>
      </div>
    </main>
  );
}

export { AppLoading };
