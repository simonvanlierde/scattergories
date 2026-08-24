import { useSyncExternalStore } from "react";
import type { useSettings } from "@/features/settings/SettingsProvider";
import type { PromptDeckPreference } from "@/features/settings/schema";

const MOBILE_PROMPT_DECK_QUERY = "(max-width: 52rem)";

function getCompactLayoutSnapshot() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(MOBILE_PROMPT_DECK_QUERY).matches;
}

function subscribeCompactLayout(onStoreChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia(MOBILE_PROMPT_DECK_QUERY);
  const handleChange = () => onStoreChange();

  mediaQuery.addEventListener("change", handleChange);

  return () => mediaQuery.removeEventListener("change", handleChange);
}

function useIsCompactLayout() {
  return useSyncExternalStore(subscribeCompactLayout, getCompactLayoutSnapshot, () => false);
}

// The drawn categories are what every player reads, so they show by default on
// every layout; the compact flag only shapes the layout, never the default.
function getPromptDeckOpenState(preference: PromptDeckPreference) {
  return preference !== "collapsed";
}

function usePromptDeckState(
  preference: PromptDeckPreference,
  update: ReturnType<typeof useSettings>["update"],
) {
  const isCompactLayout = useIsCompactLayout();
  const isPromptDeckOpen = getPromptDeckOpenState(preference);
  const setPromptDeckPreference = (nextOpen: boolean) => {
    update("promptDeckPreference", nextOpen ? "open" : "collapsed");
  };
  const togglePromptDeck = () => {
    setPromptDeckPreference(!isPromptDeckOpen);
  };

  return {
    isCompactLayout,
    isPromptDeckOpen,
    togglePromptDeck,
  };
}

export { usePromptDeckState };
