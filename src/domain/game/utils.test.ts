import { describe, expect, it } from "vitest";
import { getLocaleLetters } from "@/i18n/localeRegistry";
import { getLocaleLetterWeights } from "./localeWeights";
import {
  clampInt,
  drawLetter,
  formatSeconds,
  pickRandom,
  RECENT_LETTER_WINDOW,
  shuffleFisherYates,
} from "./utils";

const NINETY_NINE = 99;
const HALF_RANDOM = 0.5;
const QUARTER_RANDOM = 0.25;
const THREE_QUARTER_RANDOM = 0.75;

describe("clampInt", () => {
  it.each([
    { value: 5, min: 1, max: 10, expected: 5 },
    { value: 0, min: 1, max: 10, expected: 1 },
    { value: 15, min: 1, max: 10, expected: 10 },
    { value: 1, min: 1, max: 10, expected: 1 },
    { value: 10, min: 1, max: 10, expected: 10 },
    { value: -5, min: -10, max: 10, expected: -5 },
    { value: -100, min: -10, max: 10, expected: -10 },
  ])("clamps $value within [$min, $max] → $expected", ({ value, min, max, expected }) => {
    expect(clampInt(value, min, max, 0)).toBe(expected);
  });

  it("parses numeric strings", () => {
    expect(clampInt("5", 1, 10, 0)).toBe(5);
    expect(clampInt("15", 1, 10, 0)).toBe(10);
  });

  it("returns fallback for non-numeric strings", () => {
    expect(clampInt("foo", 1, 10, NINETY_NINE)).toBe(NINETY_NINE);
    expect(clampInt("", 1, 10, NINETY_NINE)).toBe(NINETY_NINE);
  });

  it("returns fallback for NaN", () => {
    expect(clampInt(Number.NaN, 1, 10, 42)).toBe(42);
  });

  it("clamps Infinity to bounds", () => {
    expect(clampInt(Number.POSITIVE_INFINITY, 1, 10, 0)).toBe(10);
    expect(clampInt(Number.NEGATIVE_INFINITY, 1, 10, 0)).toBe(1);
  });
});

describe("formatSeconds", () => {
  it.each([
    [0, "0s"],
    [9, "9s"],
    [45, "45s"],
    [59, "59s"],
    [60, "1:00"],
    [65, "1:05"],
    [125, "2:05"],
    [600, "10:00"],
    [3600, "60:00"],
  ])('formats %ss as "%s"', (input, expected) => {
    expect(formatSeconds(input)).toBe(expected);
  });
});

describe("pickRandom", () => {
  const items = ["A", "B", "C", "D"] as const;

  it("returns the first element when the RNG is 0", () => {
    expect(pickRandom(items, () => 0)).toBe("A");
  });

  it("returns the last element when the RNG approaches 1", () => {
    expect(pickRandom(items, () => 0.9999)).toBe("D");
  });

  it("always returns a member of the input", () => {
    expect(items).toContain(pickRandom(items, () => HALF_RANDOM));
  });
});

describe("shuffleFisherYates", () => {
  it("returns a new array with the same elements", () => {
    const original = [1, 2, 3, 4, 5];
    const result = shuffleFisherYates(original);

    expect(result).not.toBe(original);
    expect(result).toHaveLength(original.length);
    expect([...result].sort()).toEqual([...original].sort());
  });

  it("produces a deterministic shuffle for a fixed RNG", () => {
    expect(shuffleFisherYates([1, 2, 3, 4, 5], () => 0)).toEqual([2, 3, 4, 5, 1]);
  });

  it("supports deterministic non-zero RNG sequences", () => {
    const values = [HALF_RANDOM, QUARTER_RANDOM, THREE_QUARTER_RANDOM, 0];
    const nextRandom = () => values.shift() ?? 0;

    expect(shuffleFisherYates([1, 2, 3, 4, 5], nextRandom)).toEqual([4, 1, 5, 2, 3]);
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

  it("falls back to a uniform pick when every weight is zero", () => {
    expect(drawLetter(["A", "B"], { A: 0, B: 0 }, [], () => 0)).toBe("A");
  });
});
