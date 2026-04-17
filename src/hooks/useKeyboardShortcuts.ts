import { useEffect, useRef } from 'react';

export interface ShortcutHandlers {
  onSpace?: () => void;
  onR?: () => void;
  onN?: () => void;
  onP?: () => void;
  onC?: () => void;
  onA?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        handlersRef.current.onSpace?.();
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'r':
          handlersRef.current.onR?.();
          break;
        case 'n':
          handlersRef.current.onN?.();
          break;
        case 'p':
          handlersRef.current.onP?.();
          break;
        case 'c':
          handlersRef.current.onC?.();
          break;
        case 'a':
          handlersRef.current.onA?.();
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
