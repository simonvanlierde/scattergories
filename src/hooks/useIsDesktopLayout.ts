import { useSyncExternalStore } from 'react';

const DESKTOP_LAYOUT_QUERY = '(min-width: 64rem)';

function getSnapshot(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(DESKTOP_LAYOUT_QUERY).matches;
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined;
  }
  const mediaQuery = window.matchMedia(DESKTOP_LAYOUT_QUERY);
  const handleChange = () => onChange();
  mediaQuery.addEventListener('change', handleChange);
  return () => mediaQuery.removeEventListener('change', handleChange);
}

function getServerSnapshot(): boolean {
  return false;
}

export function useIsDesktopLayout(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
