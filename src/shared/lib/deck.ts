import { shuffleFisherYates } from '@/domain/game/utils';

interface ComposeDeckParams {
  customCategories: string[];
  deckBuiltins: string[];
  pinned: string[];
  count: number;
  /** The currently displayed deck, so pinned categories keep their positions. */
  previous?: string[];
}

interface ComposedDeck {
  /** The drawn deck: pinned categories hold their slots, the rest is random fill. */
  deck: string[];
  /** Unpinned categories available to fill / reroll the remaining slots. */
  pool: string[];
}

/** Fill the still-empty slots with a random sample of the unpinned pool, in place. */
function fillEmptySlots(slots: (string | null)[], pool: string[]): void {
  const emptyIndices = slots.flatMap((slot, index) => (slot === null ? [index] : []));
  const fill = shuffleFisherYates(pool).slice(0, emptyIndices.length);
  fill.forEach((name, i) => {
    const slot = emptyIndices[i];
    if (slot !== undefined) {
      slots[slot] = name;
    }
  });
}

/**
 * Builds a round's drawn deck. All pinned categories are always included, and
 * each one keeps the slot it currently occupies in `previous` so a redraw never
 * makes a pinned category hop to a new position. The remaining slots up to
 * `count` are filled randomly from the unpinned pool.
 */
function composeDeck({
  customCategories,
  deckBuiltins,
  pinned,
  count,
  previous = [],
}: ComposeDeckParams): ComposedDeck {
  const pinnedSet = new Set(pinned);
  const customSet = new Set(customCategories);

  // Pinned categories actually present in the deck (customs first, then
  // built-ins), in a stable order — used to seat pins that aren't already placed.
  const pinnedCustoms = customCategories.filter((name) => pinnedSet.has(name));
  const pinnedBuiltins = deckBuiltins.filter((name) => pinnedSet.has(name) && !customSet.has(name));
  const pinnedOrdered = [...pinnedCustoms, ...pinnedBuiltins];

  const unpinnedCustoms = customCategories.filter((name) => !pinnedSet.has(name));
  const unpinnedBuiltins = deckBuiltins.filter(
    (name) => !(pinnedSet.has(name) || customSet.has(name)),
  );
  const pool = [...unpinnedCustoms, ...unpinnedBuiltins];

  const slots: (string | null)[] = new Array(count).fill(null);
  const placed = new Set<string>();

  // 1. Keep pinned categories in the slots they already occupy.
  const carryOver = Math.min(previous.length, count);
  for (let i = 0; i < carryOver; i += 1) {
    const name = previous[i];
    if (name !== undefined && pinnedSet.has(name) && !placed.has(name)) {
      slots[i] = name;
      placed.add(name);
    }
  }

  // 2. Seat any remaining pinned categories (freshly pinned, or shifted in by a
  //    smaller count) into the earliest free slots.
  const remainingPinned = pinnedOrdered.filter((name) => !placed.has(name));
  let nextPinned = 0;
  for (let i = 0; i < count && nextPinned < remainingPinned.length; i += 1) {
    const name = remainingPinned[nextPinned];
    if (slots[i] === null && name !== undefined) {
      slots[i] = name;
      nextPinned += 1;
    }
  }

  // 3. Fill the rest with a random sample of the unpinned pool.
  fillEmptySlots(slots, pool);

  // Drop any slots the pool was too small to fill, preserving order.
  const deck = slots.filter((name): name is string => name !== null);
  return { deck, pool };
}

export { composeDeck };
