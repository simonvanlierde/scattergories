import { shuffleFisherYates } from '@/domain/game/utils';

interface ComposeDeckParams {
  customCategories: string[];
  deckBuiltins: string[];
  pinned: string[];
  count: number;
}

interface ComposedDeck {
  /** The drawn deck: pinned categories first (never rolled), then the random fill. */
  deck: string[];
  /** Number of leading pinned slots (the boundary the roll animation respects). */
  pinnedCount: number;
  /** Unpinned categories available to fill / reroll the remaining slots. */
  pool: string[];
}

/**
 * Builds a round's drawn deck: all pinned categories are always included
 * (customs first, then pinned built-ins), and the remaining slots up to
 * `count` are filled randomly from the unpinned pool. If pinned categories
 * already meet or exceed `count`, they are all shown with no fill.
 */
function composeDeck({
  customCategories,
  deckBuiltins,
  pinned,
  count,
}: ComposeDeckParams): ComposedDeck {
  const pinnedSet = new Set(pinned);
  const customSet = new Set(customCategories);

  const pinnedCustoms = customCategories.filter((name) => pinnedSet.has(name));
  const pinnedBuiltins = deckBuiltins.filter((name) => pinnedSet.has(name) && !customSet.has(name));
  const pinnedOrdered = [...pinnedCustoms, ...pinnedBuiltins];

  const unpinnedCustoms = customCategories.filter((name) => !pinnedSet.has(name));
  const unpinnedBuiltins = deckBuiltins.filter(
    (name) => !(pinnedSet.has(name) || customSet.has(name)),
  );
  const pool = [...unpinnedCustoms, ...unpinnedBuiltins];

  if (pinnedOrdered.length >= count) {
    return { deck: pinnedOrdered, pinnedCount: pinnedOrdered.length, pool: [] };
  }

  const fill = shuffleFisherYates(pool).slice(0, count - pinnedOrdered.length);
  return { deck: [...pinnedOrdered, ...fill], pinnedCount: pinnedOrdered.length, pool };
}

export type { ComposeDeckParams, ComposedDeck };
export { composeDeck };
