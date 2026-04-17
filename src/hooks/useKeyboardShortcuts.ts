import { useEffect, useEffectEvent } from 'react';

export interface ShortcutHandlers {
  onSpace?: () => void;
  onR?: () => void;
  onN?: () => void;
  onP?: () => void;
  onC?: () => void;
  onA?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const onShortcut = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName;

    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) {
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
  });

  useEffect(() => {
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);
}
