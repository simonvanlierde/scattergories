import { useCallback, useState } from "react";
import { safeStorage } from "@/shared/lib/safeStorage";

export const ONBOARDED_KEY = "scattergories.onboarded.v1";

/**
 * First-run gate: `needsOnboarding` is true until the player has seen (and
 * dismissed) the rules once. Persisted best-effort — a blocked/full store
 * just means the rules show again next visit, never a crash.
 */
export function useOnboarding() {
  const [onboarded, setOnboarded] = useState(() => safeStorage.getItem(ONBOARDED_KEY) === "1");

  const complete = useCallback(() => {
    safeStorage.setItem(ONBOARDED_KEY, "1");
    setOnboarded(true);
  }, []);

  return { needsOnboarding: !onboarded, complete };
}
