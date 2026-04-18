import { useCallback, useState } from 'react';

const STORAGE_KEY = 'scattegories.onboarded.v1';

function readOnboarded(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return true;
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return true;
  }
}

function writeOnboarded(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    /* ignore */
  }
}

export function useOnboarding() {
  const [isOnboarded, setIsOnboarded] = useState<boolean>(readOnboarded);

  const dismiss = useCallback(() => {
    writeOnboarded();
    setIsOnboarded(true);
  }, []);

  return { isOnboarded, dismiss };
}
