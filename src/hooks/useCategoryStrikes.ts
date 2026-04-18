import { useCallback, useMemo, useState } from 'react';

interface UseCategoryStrikesOptions {
  drawnCategories: string[];
  resetSignal: number;
}

const EMPTY_STRUCK: ReadonlySet<string> = new Set();

export function useCategoryStrikes({ drawnCategories, resetSignal }: UseCategoryStrikesOptions) {
  const [struckBySignal, setStruckBySignal] = useState(() => new Map<number, Set<string>>());
  const currentStruck = struckBySignal.get(resetSignal) ?? EMPTY_STRUCK;
  const normalizedStruck = useMemo(() => {
    if (currentStruck.size === 0) {
      return currentStruck;
    }

    const drawnSet = new Set(drawnCategories);
    let changed = false;
    const next = new Set<string>();
    for (const item of currentStruck) {
      if (drawnSet.has(item)) {
        next.add(item);
      } else {
        changed = true;
      }
    }

    return changed ? next : currentStruck;
  }, [currentStruck, drawnCategories]);

  const toggle = useCallback(
    (category: string) => {
      setStruckBySignal((current) => {
        const next = new Map(current);
        const currentSet = new Set(next.get(resetSignal) ?? []);
        if (currentSet.has(category)) {
          currentSet.delete(category);
        } else {
          currentSet.add(category);
        }
        next.set(resetSignal, currentSet);
        return next;
      });
    },
    [resetSignal],
  );

  const isStruck = useCallback(
    (category: string) => normalizedStruck.has(category),
    [normalizedStruck],
  );

  const clear = useCallback(() => {
    setStruckBySignal((current) => {
      const next = new Map(current);
      next.set(resetSignal, new Set());
      return next;
    });
  }, [resetSignal]);

  return { isStruck, toggle, clear, struckCount: normalizedStruck.size };
}
