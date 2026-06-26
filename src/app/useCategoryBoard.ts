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

function useCategoryBoard(params: UseCategoryBoardParams) {
  const { customCategories, deckBuiltins, pinned, count } = params;
  const [displayCategories, setDisplayCategories] = useState<string[]>([]);
  const [pinnedCount, setPinnedCount] = useState(0);
  const [landing, setLanding] = useState(false);
  const spinIdRef = useRef(0);

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
  };
}

export { useCategoryBoard };
