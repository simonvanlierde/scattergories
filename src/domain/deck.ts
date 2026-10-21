/* The deck rules: which built-in packs exist, what the default deck holds, how a round's
 * categories are drawn and how its letter is drawn. Pure functions only; the settings and the
 * board hooks call these and keep the state. */
import { getLocaleLetters } from "@/i18n/localeRegistry";
import { CATEGORY_KEYS } from "./game/categoryKeys";
import { catCountMin } from "./game/constants";
import { getLocaleLetterWeights } from "./game/localeWeights";
import { pickRandom, shuffleFisherYates } from "./game/utils";

type RandomSource = () => number;

// ---------------------------------------------------------------------------
// Packs: named subsets of CATEGORY_KEYS. Every locale translates every key, so
// a pack needs no per-locale content.

const CLASSIC_PACK_ID = "classic";

interface CategoryPack {
  id: string;
  labelKey: string;
  /* Empty list means "every category except the adult ones" (Classic). */
  keys: readonly string[];
}

/* Kept out of Classic and the default deck; players opt in through Grown-ups. */
const ADULT_KEYS: readonly string[] = [
  "Offensive Words",
  "4-Letter Words",
  "Bar Things",
  "Beers",
  "Crimes",
  "Weapons",
  "Deadly Things",
  "Medicine/Drugs",
];

const FOODIE_KEYS = [
  "Foods",
  "Fruits",
  "Vegetables",
  "Candy / Sweets",
  "Beverages",
  "Pizza Toppings",
  "Types of Cheese",
  "Breakfast Foods",
  "Spicy Foods",
  "Spices/Herbs",
  "Sandwiches",
  "Kinds of Soup",
  "Desserts",
  "Junk Food",
  "Diet Foods",
  "Seafood",
  "Dairy Products",
  "Ethnic Foods",
  "Menu Items",
  "Ice Cream Flavors",
  "Kitchen Things",
  "Utensils",
  "Raw Foods",
  "Beers",
  "Fast Food Chains",
  "Restaurants",
  "Grocery Items",
  "Fridge Items",
  "Green Foods",
];

const POP_CULTURE_KEYS = [
  "Movies",
  "TV Shows",
  "Famous People",
  "Fictional Characters",
  "Superheroes",
  "Cartoon Characters",
  "Celebrities",
  "Book Titles",
  "Authors",
  "Song Titles",
  "Christmas Songs",
  "Video Games",
  "Board Games",
  "Instruments",
  "Music Genres",
  "Musical Groups",
  "TV Stars",
  "Children's Books",
  "Magazines",
  "Awards",
  "Halloween Costumes",
  "Villains/Monsters",
  "Heroes",
  "Fairy Tale Figures",
  "Duos & Trios",
  "Dance Styles",
];

const TRAVEL_KEYS = [
  "Countries",
  "Cities",
  "U.S. Cities",
  "Foreign Cities",
  "States",
  "Capitals",
  "Tropical Places",
  "Vacation Spots",
  "Honeymoon Spots",
  "European Places",
  "Tourist Attractions",
  "Bodies of Water",
  "Map Features",
  "Parks",
  "Park Things",
  "Modes of Transport",
  "Vehicles",
  "Types of Cars",
  "Suitcase Items",
  "Travel Items",
  "Beach Things",
];

const KIDS_KEYS = [
  "Animals",
  "Farm Animals",
  "Birds",
  "Fish",
  "Insects",
  "Reptiles/Amphibians",
  "Fruits",
  "Vegetables",
  "Colors",
  "Toys",
  "Board Games",
  "Card Games",
  "Breakfast Foods",
  "Ice Cream Flavors",
  "Candy / Sweets",
  "Fairy Tale Figures",
  "Cartoon Characters",
  "Superheroes",
  "Instruments",
  "School Subjects",
  "School Supplies",
  "Park Things",
  "Beach Things",
  "Things in Space",
  "Mythical Beasts",
  "Dance Styles",
  "Sports",
  "Plants & Flowers",
  "Flowers",
  "Trees",
  "Growing Things",
  "Morning Habits",
  "Outdoor Things",
  "Weather Types",
  "Indoor Activities",
  "Outdoor Activities",
  "A Boy's Name",
  "A Girl's Name",
];

const HOUSEHOLD_KEYS = [
  "Kitchen Things",
  "Bathroom Things",
  "Bedroom Things",
  "Office Things",
  "Desk Items",
  "Furniture",
  "Appliances",
  "Chores",
  "Tools",
  "Utensils",
  "Things in a Bag",
  "Medicine Cabinet",
  "Fridge Items",
  "Wallet Items",
  "Gadgets",
  "Computer Parts",
  "Things With Remotes",
  "Things You Plug In",
  "Wireless Things",
  "School Supplies",
  "Items in This Room",
  "Suitcase Items",
  "Cosmetics",
];

const PACKS: readonly CategoryPack[] = Object.freeze([
  {
    id: CLASSIC_PACK_ID,
    labelKey: "packs.classic.label",
    keys: [],
  },
  {
    id: "foodie",
    labelKey: "packs.foodie.label",
    keys: FOODIE_KEYS,
  },
  {
    id: "pop-culture",
    labelKey: "packs.popCulture.label",
    keys: POP_CULTURE_KEYS,
  },
  {
    id: "travel",
    labelKey: "packs.travel.label",
    keys: TRAVEL_KEYS,
  },
  {
    id: "kids",
    labelKey: "packs.kids.label",
    keys: KIDS_KEYS,
  },
  {
    id: "household",
    labelKey: "packs.household.label",
    keys: HOUSEHOLD_KEYS,
  },
  {
    id: "grown-ups",
    labelKey: "packs.grownUps.label",
    keys: ADULT_KEYS,
  },
]);

/** The built-in keys in a pack, dropping any key the domain doesn't know. Classic, or an
 * unknown pack id, means every key except ADULT_KEYS. */
function getPackCategories(packId: string): string[] {
  const pack = PACKS.find((entry) => entry.id === packId);
  if (!pack || pack.keys.length === 0) {
    return CATEGORY_KEYS.filter((key) => !ADULT_KEYS.includes(key));
  }
  const available = new Set(CATEGORY_KEYS);
  return pack.keys.filter((key) => available.has(key));
}

/** The built-ins a new player starts with: Classic, so the Grown-ups pack stays opt-in. */
function getDefaultDeckBuiltins(): string[] {
  return getPackCategories(CLASSIC_PACK_ID);
}

/** Adds a pack's keys to the deck's built-ins, keeping the existing order and no duplicates. */
function addPackToDeck(deckBuiltins: readonly string[], packId: string): string[] {
  return Array.from(new Set([...deckBuiltins, ...getPackCategories(packId)]));
}

// ---------------------------------------------------------------------------
// Category selection.

/** How many distinct categories the deck holds, customs and built-ins together. */
function getDeckSize(customCategories: readonly string[], deckBuiltins: readonly string[]): number {
  return new Set([...customCategories, ...deckBuiltins]).size;
}

/** The number of categories to draw: the requested count, capped by the deck size, but never
 * below the minimum category count. */
function getDrawCount(requested: number, deckSize: number): number {
  return Math.min(requested, Math.max(catCountMin, deckSize));
}

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
 * Builds a round's drawn deck. Pinned categories are seated first, and each one
 * keeps the slot it currently occupies in `previous` so a redraw never makes a
 * pinned category hop to a new position. With more pins than `count`, only
 * `count` of them are drawn. The remaining slots are filled randomly from the
 * unpinned pool.
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
  const unpinnedBuiltins = deckBuiltins.filter((name) => !(pinnedSet.has(name) || customSet.has(name)));
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

// ---------------------------------------------------------------------------
// Letters.

/**
 * How many of the latest letters an "avoid repeats" draw skips. At 12, rare letters (Q, X, Y in
 * English) came up about twice their weight; at 8 they run about 1.5x, and a repeat within 10
 * rounds happens in about 9% of sessions, never before round 9.
 */
const RECENT_LETTER_WINDOW = 8;

/**
 * Draws one letter with probability proportional to its weight, skipping the
 * letters in `recent` (oldest first). At most the latest `letters.length - 1`
 * are skipped, so a short alphabet always leaves a letter to draw.
 */
function drawLetter(
  letters: readonly string[],
  weights: Readonly<Record<string, number>>,
  recent: readonly string[],
  random: RandomSource = Math.random,
): string {
  const size = Math.max(0, Math.min(recent.length, letters.length - 1));
  const skipped = new Set(recent.slice(recent.length - size));
  const candidates = letters.filter((letter) => !skipped.has(letter));
  const total = candidates.reduce((sum, letter) => sum + (weights[letter] ?? 1), 0);
  let target = random() * total;
  for (const letter of candidates) {
    target -= weights[letter] ?? 1;
    if (target < 0) {
      return letter;
    }
  }
  // Only reached on float rounding at the top of the range, or all-zero weights.
  return pickRandom(candidates, random);
}

/**
 * Draws the round's letter from the locale's alphabet and weights. With avoidRepeats on it
 * skips the last RECENT_LETTER_WINDOW letters; with it off it still skips the previous letter,
 * so a spin never lands where it started and reads as "the spin did nothing". Returns the
 * letter and the updated recent-letter history.
 */
function drawRoundLetter(
  locale: string,
  recentLetters: readonly string[],
  avoidRepeats: boolean,
  random: RandomSource = Math.random,
): { letter: string; recentLetters: string[] } {
  const letter = drawLetter(
    getLocaleLetters(locale),
    getLocaleLetterWeights(locale),
    recentLetters.slice(avoidRepeats ? -RECENT_LETTER_WINDOW : -1),
    random,
  );
  return { letter, recentLetters: [...recentLetters, letter].slice(-RECENT_LETTER_WINDOW) };
}

export {
  ADULT_KEYS,
  addPackToDeck,
  CLASSIC_PACK_ID,
  composeDeck,
  drawLetter,
  drawRoundLetter,
  getDeckSize,
  getDefaultDeckBuiltins,
  getDrawCount,
  getPackCategories,
  PACKS,
  RECENT_LETTER_WINDOW,
};
