import { useCallback, useEffect, useRef, useState } from 'react';
import { pickRandom, shuffleFisherYates } from '@/domain/game/utils';
import { prefersReducedMotion, runRoll } from '@/features/round/rollAnimation';

interface UseCategoryBoardParams {
  /** Custom categories — always shown, never animated. */
  pinnedCategories: string[];
  /** Pack pool that fills the remaining slots up to `count`. */
  poolCategories: string[];
  count: number;
  includePack: boolean;
}

function composeDeck(params: UseCategoryBoardParams): string[] {
  const { pinnedCategories, poolCategories, count, includePack } = params;
  if (!includePack) {
    return [...pinnedCategories];
  }
  const fill = shuffleFisherYates(poolCategories).slice(
    0,
    Math.max(0, count - pinnedCategories.length),
  );
  return [...pinnedCategories, ...fill];
}

function useCategoryBoard(params: UseCategoryBoardParams) {
  const { pinnedCategories, poolCategories, count, includePack } = params;
  const [displayCategories, setDisplayCategories] = useState<string[]>([]);
  const [landing, setLanding] = useState(false);
  const spinIdRef = useRef(0);

  const redrawCategories = useCallback(
    (animate: boolean) => {
      const finalDeck = composeDeck({ pinnedCategories, poolCategories, count, includePack });
      const packSlotCount = finalDeck.length - pinnedCategories.length;

      // Cancel any in-flight roll and clear the landing flag.
      spinIdRef.current += 1;
      setLanding(false);

      const canAnimate =
        animate && packSlotCount > 0 && poolCategories.length > 0 && !prefersReducedMotion();
      if (!canAnimate) {
        setDisplayCategories(finalDeck);
        return;
      }

      const spinId = spinIdRef.current;
      runRoll({
        onFlip: () => {
          const rolling = Array.from({ length: packSlotCount }, () => pickRandom(poolCategories));
          setDisplayCategories([...pinnedCategories, ...rolling]);
        },
        onLanded: () => {
          setDisplayCategories(finalDeck);
          setLanding(true);
        },
        spinId,
        spinIdRef,
      });
    },
    [pinnedCategories, poolCategories, count, includePack],
  );

  // Compose instantly (no roll) whenever the inputs change — mount, pack/custom
  // edits, count or include-pack toggles. Animated redraws come from round start
  // and the Redraw button via redrawCategories(true).
  useEffect(() => {
    redrawCategories(false);
  }, [redrawCategories]);

  return {
    drawnCategories: displayCategories,
    customCount: pinnedCategories.length,
    landing,
    redrawCategories,
  };
}

export { useCategoryBoard };
