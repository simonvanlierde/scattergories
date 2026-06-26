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
  const [landing, setLanding] = useState(false);
  const spinIdRef = useRef(0);

  // Pins and the current display are read through refs so that toggling a pin
  // doesn't recompose (and thus reorder) the drawn list, and so redraws can keep
  // pinned categories in the slots they currently occupy.
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;
  const displayRef = useRef(displayCategories);
  displayRef.current = displayCategories;

  const redrawCategories = useCallback(
    (animate: boolean) => {
      const currentPinned = pinnedRef.current;
      const { deck, pool } = composeDeck({
        customCategories,
        deckBuiltins,
        pinned: currentPinned,
        count,
        previous: displayRef.current,
      });

      // Cancel any in-flight roll and clear the landing flag.
      spinIdRef.current += 1;
      setLanding(false);

      const pinnedSet = new Set(currentPinned);
      const fillSlotCount = deck.reduce((n, name) => (pinnedSet.has(name) ? n : n + 1), 0);
      const canAnimate = animate && fillSlotCount > 0 && pool.length > 0 && !prefersReducedMotion();
      if (!canAnimate) {
        setDisplayCategories(deck);
        return;
      }

      const spinId = spinIdRef.current;
      runRoll({
        onFlip: () => {
          // Pinned slots hold still; only the unpinned slots roll in place.
          setDisplayCategories(deck.map((name) => (pinnedSet.has(name) ? name : pickRandom(pool))));
        },
        onLanded: () => {
          setDisplayCategories(deck);
          setLanding(true);
        },
        spinId,
        spinIdRef,
      });
    },
    [customCategories, deckBuiltins, count],
  );

  // Compose instantly (no roll) whenever the deck inputs change — mount, deck
  // edits, count changes. Pin toggles deliberately don't recompose (they keep
  // the current order). Animated redraws come from round start / the Redraw
  // button via redrawCategories(true).
  useEffect(() => {
    redrawCategories(false);
  }, [redrawCategories]);

  return {
    drawnCategories: displayCategories,
    landing,
    redrawCategories,
  };
}

export { useCategoryBoard };
