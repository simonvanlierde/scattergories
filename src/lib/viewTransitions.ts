export function withViewTransition(callback: () => void): void {
  if (typeof window === 'undefined') {
    callback();
    return;
  }

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion || typeof document.startViewTransition !== 'function') {
    callback();
    return;
  }

  document.startViewTransition(callback);
}
