import { useCallback, useMemo, useState } from 'react';

interface UseCategoryStrikesOptions {
  drawnCategories: string[];
  resetSignal: number;
}

export function useCategoryStrikes({ drawnCategories, resetSignal }: UseCategoryStrikesOptions) {
  const [struck, setStruck] = useState<ReadonlySet<string>>(() => new Set());
  const [lastResetSignal, setLastResetSignal] = useState(resetSignal);

  if (lastResetSignal !== resetSignal) {
    setLastResetSignal(resetSignal);
    setStruck(new Set());
  }

  const normalizedStruck = useMemo(() => {
    if (struck.size === 0) {
      return struck;
    }
    const drawnSet = new Set(drawnCategories);
    const next = new Set<string>();
    for (const item of struck) {
      if (drawnSet.has(item)) {
        next.add(item);
      }
    }
    return next.size === struck.size ? struck : next;
  }, [struck, drawnCategories]);

  const toggle = useCallback((category: string) => {
    setStruck((current) => {
      const next = new Set(current);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const isStruck = useCallback(
    (category: string) => normalizedStruck.has(category),
    [normalizedStruck],
  );

  const clear = useCallback(() => {
    setStruck(new Set());
  }, []);

  return { isStruck, toggle, clear, struckCount: normalizedStruck.size };
}
