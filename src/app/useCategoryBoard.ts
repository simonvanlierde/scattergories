import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { pickRandom } from "@/domain/game/utils";
import { prefersReducedMotion, runRoll } from "@/features/round/rollAnimation";
import { composeDeck } from "@/shared/lib/deck";

interface UseCategoryBoardParams {
  customCategories: string[];
  deckBuiltins: string[];
  pinned: string[];
  count: number;
  /**
   * When `.current` is true (a round is in progress), deck edits are NOT applied
   * to the drawn categories instantly — they take effect on the next redraw.
   */
  deferComposeRef?: RefObject<boolean>;
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: cohesive board hook — the redraw callback closes over local state and setters that don't extract without threading them all back through.
function useCategoryBoard(params: UseCategoryBoardParams) {
  const { customCategories, deckBuiltins, pinned, count, deferComposeRef } = params;
  const [displayCategories, setDisplayCategories] = useState<string[]>([]);
  // Which drawn names were custom AT DRAW TIME. Snapshotted alongside the deck so
  // a round's "custom" styling stays frozen even if the deck is edited mid-round.
  const [drawnCustom, setDrawnCustom] = useState<string[]>([]);
  // "rolling" while the slots are actually spinning (the footer die spins along
  // with them), "landed" right after, "idle" otherwise. landing/spinning below
  // are just this one state read two ways — they're never true at once.
  const [phase, setPhase] = useState<"idle" | "rolling" | "landed">("idle");
  const spinIdRef = useRef(0);

  // Pins and the current display are read through refs so that toggling a pin
  // doesn't recompose (and thus reorder) the drawn list, and so redraws can keep
  // pinned categories in the slots they currently occupy.
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;
  const displayRef = useRef(displayCategories);
  displayRef.current = displayCategories;

  // Kept memoized: it's read in the useEffect dependency array below, where a
  // render-body function would trip biome's useExhaustiveDependencies lint.
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

      // Cancel any in-flight roll and clear the landed flag.
      spinIdRef.current += 1;
      setPhase("idle");

      const customSnapshot = deck.filter((name) => customCategories.includes(name));
      const pinnedSet = new Set(currentPinned);
      const fillSlotCount = deck.reduce((n, name) => (pinnedSet.has(name) ? n : n + 1), 0);
      const canAnimate = animate && fillSlotCount > 0 && pool.length > 0 && !prefersReducedMotion();
      if (!canAnimate) {
        setDisplayCategories(deck);
        setDrawnCustom(customSnapshot);
        return;
      }

      const spinId = spinIdRef.current;
      setPhase("rolling");
      runRoll({
        onFlip: () => {
          // Pinned slots hold still; only the unpinned slots roll in place.
          setDisplayCategories(deck.map((name) => (pinnedSet.has(name) ? name : pickRandom(pool))));
        },
        onLanded: () => {
          setDisplayCategories(deck);
          setDrawnCustom(customSnapshot);
          setPhase("landed");
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
  //
  // While a round is in progress, deck edits are deferred: the compose is
  // skipped so the drawn categories stay put, and the edits are picked up on the
  // next redraw (next round / Redraw button).
  useEffect(() => {
    if (deferComposeRef?.current) {
      return;
    }
    redrawCategories(false);
  }, [redrawCategories, deferComposeRef]);

  return {
    drawnCategories: displayCategories,
    drawnCustom,
    landing: phase === "landed",
    spinning: phase === "rolling",
    redrawCategories,
  };
}

export { useCategoryBoard };
