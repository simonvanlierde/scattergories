import { useEffect, useRef } from 'react';

/**
 * Stores the focused element when `active` becomes true and restores focus
 * to it when `active` becomes false. Native <dialog>.showModal() traps focus
 * while open, but does not consistently restore it across browsers.
 */
export function useReturnFocus(active: boolean): void {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) {
      return;
    }
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    return () => {
      previouslyFocused.current?.focus();
    };
  }, [active]);
}
