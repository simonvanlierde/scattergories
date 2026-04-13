import { useEffect } from 'react';

export interface ShortcutHandlers {
  onSpace?: () => void;
  onR?: () => void;
  onN?: () => void;
  onP?: () => void;
  onC?: () => void;
  onA?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        handlers.onSpace?.();
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'r':
          handlers.onR?.();
          break;
        case 'n':
          handlers.onN?.();
          break;
        case 'p':
          handlers.onP?.();
          break;
        case 'c':
          handlers.onC?.();
          break;
        case 'a':
          handlers.onA?.();
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlers]);
}
