import { describe, expect, it } from "vitest";
import { getLocaleLetters } from "@/i18n/localeRegistry";
import {
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
} from "./deck";
import { CATEGORY_KEYS } from "./game/categoryKeys";
import { catCountMin } from "./game/constants";
import { getLocaleLetterWeights } from "./game/localeWeights";

describe("category packs", () => {
  // A typo in a pack key silently shrinks that pack instead of failing loudly,
  // because getPackCategories filters unknown keys out.
  it.each(PACKS)("$id only lists keys the domain knows about", (pack) => {
    const unknown = pack.keys.filter((key) => !CATEGORY_KEYS.includes(key));
    expect(unknown).toEqual([]);
  });

  it("the classic pack means every category except the adult ones", () => {
    expect(getPackCategories(CLASSIC_PACK_ID)).toEqual(CATEGORY_KEYS.filter((key) => !ADULT_KEYS.includes(key)));
  });

  it("only grown-ups lists adult keys, apart from Beers in foodie", () => {
    const leaks = PACKS.filter((pack) => pack.id !== "grown-ups").flatMap((pack) =>
      pack.keys.filter((key) => ADULT_KEYS.includes(key)).map((key) => `${pack.id}:${key}`),
    );
    expect(leaks).toEqual(["foodie:Beers"]);
    expect(getPackCategories("grown-ups")).toEqual([...ADULT_KEYS]);
  });

  it("drops unknown keys and treats an unknown pack as Classic", () => {
    expect(getPackCategories("no-such-pack")).toEqual(getPackCategories(CLASSIC_PACK_ID));
  });

  it("the default deck is Classic, so the Grown-ups pack stays opt-in", () => {
    const deck = getDefaultDeckBuiltins();
    expect(deck).toEqual(getPackCategories(CLASSIC_PACK_ID));
    expect(deck.filter((key) => ADULT_KEYS.includes(key))).toEqual([]);
    expect(getDefaultDeckBuiltins()).not.toBe(deck);
  });

  it("adding a pack appends its new keys once, keeping the existing order", () => {
    const deck = addPackToDeck(["Animals", "Beers"], "grown-ups");
    expect(deck.slice(0, 2)).toEqual(["Animals", "Beers"]);
    expect(deck.slice(2)).toEqual(ADULT_KEYS.filter((key) => key !== "Beers"));
    expect(addPackToDeck(deck, "grown-ups")).toEqual(deck);
  });
});

describe("deck size and draw count", () => {
  it("counts a name that is both custom and built-in once", () => {
    expect(getDeckSize(["Mine", "Animals"], ["Animals", "Foods"])).toBe(3);
  });

  it("caps the draw at the deck size but never below the minimum", () => {
    expect(getDrawCount(12, 30)).toBe(12);
    expect(getDrawCount(12, 5)).toBe(Math.max(catCountMin, 5));
    expect(getDrawCount(12, 0)).toBe(catCountMin);
  });
});

describe("composeDeck", () => {
  it("includes every pinned category and fills up to count", () => {
    const { deck } = composeDeck({
      customCategories: [],
      deckBuiltins: ["a", "b", "c", "d", "e"],
      pinned: ["a"],
      count: 3,
    });
    expect(deck).toHaveLength(3);
    expect(deck).toContain("a");
  });

  it("keeps a pinned category in its current slot on redraw (no hopping)", () => {
    const previous = ["x", "p", "y"];
    const { deck } = composeDeck({
      customCategories: [],
      deckBuiltins: ["p", "x", "y", "z", "w", "v"],
      pinned: ["p"],
      count: 3,
      previous,
    });
    expect(deck[1]).toBe("p");
    expect(deck).toHaveLength(3);
  });

  it("keeps multiple pinned categories in their existing positions", () => {
    const previous = ["p1", "u", "p2", "v"];
    const { deck } = composeDeck({
      customCategories: [],
      deckBuiltins: ["p1", "p2", "u", "v", "w", "x"],
      pinned: ["p1", "p2"],
      count: 4,
      previous,
    });
    expect(deck[0]).toBe("p1");
    expect(deck[2]).toBe("p2");
  });

  it("seats a freshly pinned category that is not yet on the board", () => {
    const { deck } = composeDeck({
      customCategories: ["new"],
      deckBuiltins: ["x", "y", "z", "w"],
      pinned: ["new"],
      count: 3,
      previous: ["x", "y", "z"],
    });
    expect(deck).toContain("new");
    expect(deck).toHaveLength(3);
  });

  it("collapses to just the pinned categories when the pool is empty", () => {
    const { deck } = composeDeck({
      customCategories: ["only"],
      deckBuiltins: [],
      pinned: ["only"],
      count: 8,
      previous: ["only", "a", "b"],
    });
    expect(deck).toEqual(["only"]);
  });

  it("only exposes unpinned categories in the reroll pool", () => {
    const { pool } = composeDeck({
      customCategories: [],
      deckBuiltins: ["a", "b", "c"],
      pinned: ["a"],
      count: 3,
    });
    expect(pool).not.toContain("a");
    expect(pool).toEqual(expect.arrayContaining(["b", "c"]));
  });
});

// Park-Miller generator: seeded, so the statistical checks below are repeatable.
function seededRandom(seed: number): () => number {
  const modulus = 2_147_483_647;
  let state = seed;
  return () => {
    state = (state * 48_271) % modulus;
    return state / modulus;
  };
}

function ranks(values: number[]): number[] {
  const order = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const result = new Array<number>(values.length);
  order.forEach(({ index }, rank) => {
    result[index] = rank;
  });
  return result;
}

function spearman(a: number[], b: number[]): number {
  const ra = ranks(a);
  const rb = ranks(b);
  const n = a.length;
  const squaredDiffs = ra.reduce((sum, r, i) => sum + (r - rb[i]!) ** 2, 0);
  return 1 - (6 * squaredDiffs) / (n * (n * n - 1));
}

function simulate(letters: string[], weights: Record<string, number>, windowSize: number) {
  const random = seededRandom(42);
  const draws: string[] = [];
  for (let i = 0; i < 10_000; i += 1) {
    draws.push(drawLetter(letters, weights, draws.slice(-windowSize), random));
  }
  return draws;
}

describe("drawLetter", () => {
  const letters = getLocaleLetters("en");
  const weights = getLocaleLetterWeights("en");

  it("follows the weights and never repeats a letter within the window", () => {
    const draws = simulate(letters, weights, RECENT_LETTER_WINDOW);

    for (let i = 1; i < draws.length; i += 1) {
      const window = draws.slice(Math.max(0, i - RECENT_LETTER_WINDOW), i);
      expect(window).not.toContain(draws[i]);
    }
    const counts = letters.map((letter) => draws.filter((d) => d === letter).length);
    const letterWeights = letters.map((letter) => weights[letter] ?? 0);
    expect(spearman(counts, letterWeights)).toBeGreaterThan(0.95);
  });

  it("skips only the previous letter with a window of one", () => {
    const draws = simulate(letters, weights, 1);

    for (let i = 1; i < draws.length; i += 1) {
      expect(draws[i]).not.toBe(draws[i - 1]);
    }
    // Unlike a bag, nothing forces each letter out once per cycle.
    const counts = letters.map((letter) => draws.filter((d) => d === letter).length);
    expect(Math.max(...counts) / Math.min(...counts)).toBeGreaterThan(10);
  });

  it("caps the window below a short alphabet's size", () => {
    const short = ["A", "B", "C", "D"];
    const draws = simulate(short, { A: 4, B: 3, C: 2, D: 1 }, RECENT_LETTER_WINDOW);

    // Window 3 on four letters: every draw is the one letter missing from the last three.
    for (let i = 3; i < draws.length; i += 1) {
      expect(new Set(draws.slice(i - 3, i + 1)).size).toBe(4);
    }
  });

  it("ignores recent letters from another alphabet", () => {
    expect(drawLetter(["A", "B"], { A: 1, B: 1 }, ["Ω", "A"], () => 0)).toBe("B");
  });

  it("treats a letter without a weight as weight 1", () => {
    expect(drawLetter(["A", "B"], { B: 3 }, [], () => 0.2)).toBe("A");
    expect(drawLetter(["A", "B"], { B: 3 }, [], () => 0.3)).toBe("B");
  });

  it("falls back to a uniform pick when every weight is zero", () => {
    expect(drawLetter(["A", "B"], { A: 0, B: 0 }, [], () => 0)).toBe("A");
  });
});

describe("drawRoundLetter", () => {
  it("draws from the locale's own alphabet", () => {
    const { letter } = drawRoundLetter("el", [], true, () => 0);
    expect(getLocaleLetters("el")).toContain(letter);
  });

  it("skips the recent window with avoidRepeats on and keeps the history bounded", () => {
    const letters = getLocaleLetters("en");
    const recent = letters.slice(0, RECENT_LETTER_WINDOW);
    const { letter, recentLetters } = drawRoundLetter("en", recent, true, () => 0);

    expect(recent).not.toContain(letter);
    expect(recentLetters).toEqual([...recent.slice(1), letter]);
  });

  // A literal 9, not the constant: players notice a letter that comes back within nine rounds.
  it.each(["en", "es", "fr", "de", "it", "nl", "pl", "pt", "el"])(
    "never repeats a letter within 9 rounds in %s",
    (locale) => {
      const random = seededRandom(7);
      let recent: string[] = [];
      const draws: string[] = [];
      for (let i = 0; i < 2_000; i += 1) {
        const result = drawRoundLetter(locale, recent, true, random);
        recent = result.recentLetters;
        draws.push(result.letter);
      }
      for (let i = 9; i <= draws.length; i += 1) {
        expect(new Set(draws.slice(i - 9, i)).size).toBe(9);
      }
    },
  );

  it("skips only the previous letter with avoidRepeats off", () => {
    // random 0 picks the first candidate, so "A" comes back unless it is the previous letter.
    expect(drawRoundLetter("en", ["B", "A"], false, () => 0).letter).toBe("B");
    expect(drawRoundLetter("en", ["A", "B"], false, () => 0).letter).toBe("A");
  });
});
