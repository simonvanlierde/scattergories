import type { useSettings } from "@/features/settings/SettingsProvider";
import type { PromptDeckPreference } from "@/features/settings/schema";

// The drawn categories are what every player reads, so they show by default on
// every layout; only an explicit collapse hides them.
function usePromptDeckState(preference: PromptDeckPreference, update: ReturnType<typeof useSettings>["update"]) {
  const isPromptDeckOpen = preference !== "collapsed";
  const togglePromptDeck = () => {
    update("promptDeckPreference", isPromptDeckOpen ? "collapsed" : "open");
  };

  return { isPromptDeckOpen, togglePromptDeck };
}

export { usePromptDeckState };
