import { useEffect, useEffectEvent } from "react";

function isTextEntryTarget(target: HTMLElement | null, tag: string | undefined): boolean {
  return (
    tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || Boolean(target?.isContentEditable)
  );
}

export interface ShortcutHandlers {
  onSpace?: () => void;
  onR?: () => void;
  onP?: () => void;
  onC?: () => void;
  onHelp?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const onShortcut = useEffectEvent((event: KeyboardEvent) => {
    // Browser/OS chords (Cmd+C, Ctrl+R, Alt+…) are never game shortcuts.
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const tag = target?.tagName;

    if (isTextEntryTarget(target, tag)) {
      return;
    }

    // An open <dialog> (How to play, Customize deck) traps focus but not keydown
    // bubbling — don't let round shortcuts act on the game underneath it.
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

    switch (event.key.toLowerCase()) {
      case "r":
        handlers.onR?.();
        break;
      case "p":
        handlers.onP?.();
        break;
      case "c":
        handlers.onC?.();
        break;
      case "?":
        event.preventDefault();
        handlers.onHelp?.();
        break;
      default:
        break;
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);
}
