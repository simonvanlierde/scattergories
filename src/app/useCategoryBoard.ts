import { useCallback, useEffect, useRef, useState } from 'react';
import { pickRandom } from '@/domain/game/utils';
import { prefersReducedMotion, runRoll } from '@/features/round/rollAnimation';
import { composeDeck } from '@/shared/lib/deck';

interface UseCategoryBoardParams {
  customCategories: string[];
  deckBuiltins: string[];
  pinned: string[];
  count: number;
}

function replaceAt(list: string[], index: number, value: string): string[] {
  const next = [...list];
  next[index] = value;
  return next;
}

function useCategoryBoard(params: UseCategoryBoardParams) {
  const { customCategories, deckBuiltins, pinned, count } = params;
  const [displayCategories, setDisplayCategories] = useState<string[]>([]);
  const [pinnedCount, setPinnedCount] = useState(0);
  const [landing, setLanding] = useState(false);
  const spinIdRef = useRef(0);
  const poolRef = useRef<string[]>([]);
  const pinnedCountRef = useRef(0);
  const displayRef = useRef<string[]>([]);

  useEffect(() => {
    displayRef.current = displayCategories;
  }, [displayCategories]);

  const redrawCategories = useCallback(
    (animate: boolean) => {
      const {
        deck,
        pinnedCount: pinned_,
        pool,
      } = composeDeck({
        customCategories,
        deckBuiltins,
        pinned,
        count,
      });
      poolRef.current = pool;
      pinnedCountRef.current = pinned_;
      setPinnedCount(pinned_);

      // Cancel any in-flight roll and clear the landing flag.
      spinIdRef.current += 1;
      setLanding(false);

      const fillSlotCount = deck.length - pinned_;
      const canAnimate = animate && fillSlotCount > 0 && pool.length > 0 && !prefersReducedMotion();
      if (!canAnimate) {
        setDisplayCategories(deck);
        return;
      }

      const pinnedSlice = deck.slice(0, pinned_);
      const spinId = spinIdRef.current;
      runRoll({
        onFlip: () => {
          const rolling = Array.from({ length: fillSlotCount }, () => pickRandom(pool));
          setDisplayCategories([...pinnedSlice, ...rolling]);
        },
        onLanded: () => {
          setDisplayCategories(deck);
          setLanding(true);
        },
        spinId,
        spinIdRef,
      });
    },
    [customCategories, deckBuiltins, pinned, count],
  );

  // Reroll a single unpinned slot, drawing a fresh unpinned category.
  const redrawSlot = useCallback((index: number) => {
    const pool = poolRef.current;
    const current = displayRef.current;
    if (index < pinnedCountRef.current || pool.length === 0) {
      return;
    }
    const candidates = pool.filter((name) => !current.includes(name));
    if (candidates.length === 0) {
      return;
    }
    const replacement = pickRandom(candidates);
    spinIdRef.current += 1;
    const spinId = spinIdRef.current;

    if (prefersReducedMotion()) {
      setDisplayCategories((d) => replaceAt(d, index, replacement));
      return;
    }

    runRoll({
      onFlip: () => setDisplayCategories((d) => replaceAt(d, index, pickRandom(pool))),
      onLanded: () => setDisplayCategories((d) => replaceAt(d, index, replacement)),
      spinId,
      spinIdRef,
    });
  }, []);

  // Compose instantly (no roll) whenever the deck inputs change — mount, deck
  // edits, pin toggles, count changes. Animated redraws come from round start /
  // the Redraw button via redrawCategories(true).
  useEffect(() => {
    redrawCategories(false);
  }, [redrawCategories]);

  return {
    drawnCategories: displayCategories,
    pinnedCount,
    landing,
    redrawCategories,
    redrawSlot,
  };
}

export { useCategoryBoard };
