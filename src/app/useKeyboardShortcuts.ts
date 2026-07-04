import { useEffect, useEffectEvent } from 'react';

export interface ShortcutHandlers {
  onSpace?: () => void;
  onR?: () => void;
  onP?: () => void;
  onC?: () => void;
  onHelp?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const onShortcut = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName;

    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) {
      return;
    }

    // An open <dialog> (How to play, Customize deck) traps focus but not keydown
    // bubbling — don't let round shortcuts act on the game underneath it.
    if (document.querySelector('dialog[open]')) {
      return;
    }

    if (event.code === 'Space') {
      // Let a focused button/link handle its own native Space activation.
      if (tag === 'BUTTON' || tag === 'A' || target?.getAttribute?.('role') === 'button') {
        return;
      }
      event.preventDefault();
      handlers.onSpace?.();
      return;
    }

    switch (event.key.toLowerCase()) {
      case 'r':
        handlers.onR?.();
        break;
      case 'p':
        handlers.onP?.();
        break;
      case 'c':
        handlers.onC?.();
        break;
      case '?':
        event.preventDefault();
        handlers.onHelp?.();
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
