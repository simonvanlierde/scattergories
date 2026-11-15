import { useEffect, useEffectEvent } from "react";

function isTextEntryTarget(target: HTMLElement | null, tag: string | undefined): boolean {
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || Boolean(target?.isContentEditable);
}

export interface ShortcutHandlers {
  /** Off by user choice (WCAG 2.1.4): no key does anything. */
  isEnabled?: boolean;
  onSpace?: () => void;
  onR?: () => void;
  onP?: () => void;
  onC?: () => void;
  onHelp?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const onShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (handlers.isEnabled === false) {
      return;
    }

    // Browser/OS chords (Cmd+C, Ctrl+R, Alt+…) are never game shortcuts.
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const tag = target?.tagName;

    if (isTextEntryTarget(target, tag)) {
      return;
    }

    // An open <dialog> (How to play, Customize deck, settings) traps focus but not
    // keydown bubbling, so don't let round shortcuts act on the game underneath.
    if (document.querySelector("dialog[open]")) {
      return;
    }

    if (event.code === "Space") {
      // Let a focused button/link handle its own native Space activation.
      if (tag === "BUTTON" || tag === "A" || target?.getAttribute?.("role") === "button") {
        return;
      }
      event.preventDefault();
      handlers.onSpace?.();
      return;
    }

    // Letters match the physical key (event.code) so they work on non-Latin layouts
    // such as Greek; "?" has no fixed key across layouts, so it matches the character.
    switch (event.code) {
      case "KeyR":
        handlers.onR?.();
        return;
      case "KeyP":
        handlers.onP?.();
        return;
      case "KeyC":
        handlers.onC?.();
        return;
      default:
        break;
    }
    if (event.key === "?") {
      event.preventDefault();
      handlers.onHelp?.();
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);
}
