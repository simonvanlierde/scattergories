import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a debounced version of `commit` plus a `cancel` function.
 * Calls to the debounced function reset a timer; `commit` runs once the
 * caller pauses for `delay` ms. The pending timer is cleared on unmount.
 */
export function useDebouncedCommit<T>(commit: (value: T) => void, delay = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commitRef = useRef(commit);
  commitRef.current = commit;

  // Kept memoized: it's read in the useEffect dependency array below, where a
  // render-body function would trip biome's useExhaustiveDependencies lint.
  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const schedule = (value: T) => {
    cancel();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      commitRef.current(value);
    }, delay);
  };

  useEffect(() => cancel, [cancel]);

  return { schedule, cancel };
}
