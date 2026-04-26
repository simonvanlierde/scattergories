import { useCallback, useSyncExternalStore } from 'react';
import type { useSettings } from '@/features/settings/SettingsProvider';
import type { PromptDeckPreference } from '@/features/settings/schema';

const MOBILE_PROMPT_DECK_QUERY = '(max-width: 52rem)';

function getCompactLayoutSnapshot() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia(MOBILE_PROMPT_DECK_QUERY).matches;
}

function subscribeCompactLayout(onStoreChange: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia(MOBILE_PROMPT_DECK_QUERY);
  const handleChange = () => onStoreChange();

  mediaQuery.addEventListener('change', handleChange);

  return () => mediaQuery.removeEventListener('change', handleChange);
}

function useIsCompactLayout() {
  return useSyncExternalStore(subscribeCompactLayout, getCompactLayoutSnapshot, () => false);
}

function getPromptDeckOpenState(preference: PromptDeckPreference, isCompactLayout: boolean) {
  if (preference === 'auto') {
    return !isCompactLayout;
  }

  return preference === 'open';
}

function usePromptDeckState(
  preference: PromptDeckPreference,
  update: ReturnType<typeof useSettings>['update'],
) {
  const isCompactLayout = useIsCompactLayout();
  const isPromptDeckOpen = getPromptDeckOpenState(preference, isCompactLayout);
  const setPromptDeckPreference = useCallback(
    (nextOpen: boolean) => {
      update('promptDeckPreference', nextOpen ? 'open' : 'collapsed');
    },
    [update],
  );
  const togglePromptDeck = useCallback(() => {
    setPromptDeckPreference(!isPromptDeckOpen);
  }, [isPromptDeckOpen, setPromptDeckPreference]);
  const revealPromptDeck = useCallback(() => {
    if (!isPromptDeckOpen) {
      setPromptDeckPreference(true);
    }
  }, [isPromptDeckOpen, setPromptDeckPreference]);

  return {
    isCompactLayout,
    isPromptDeckOpen,
    revealPromptDeck,
    togglePromptDeck,
  };
}

export { usePromptDeckState };
