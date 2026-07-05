import { describe, expect, it } from 'vitest';
import { getLocaleLetters } from '@/i18n/localeRegistry';
import { englishLetters } from './constants';
import { getLocaleLetterWeights } from './localeWeights';
import {
  clampInt,
  formatSeconds,
  pickRandom,
  shuffleFisherYates,
  weightedLetterBag,
} from './utils';

const NINETY_NINE = 99;
const HALF_RANDOM = 0.5;
const QUARTER_RANDOM = 0.25;
const THREE_QUARTER_RANDOM = 0.75;

describe('clampInt', () => {
  it.each([
    { value: 5, min: 1, max: 10, expected: 5 },
    { value: 0, min: 1, max: 10, expected: 1 },
    { value: 15, min: 1, max: 10, expected: 10 },
    { value: 1, min: 1, max: 10, expected: 1 },
    { value: 10, min: 1, max: 10, expected: 10 },
    { value: -5, min: -10, max: 10, expected: -5 },
    { value: -100, min: -10, max: 10, expected: -10 },
  ])('clamps $value within [$min, $max] → $expected', ({ value, min, max, expected }) => {
    expect(clampInt(value, min, max, 0)).toBe(expected);
  });

  it('parses numeric strings', () => {
    expect(clampInt('5', 1, 10, 0)).toBe(5);
    expect(clampInt('15', 1, 10, 0)).toBe(10);
  });

  it('returns fallback for non-numeric strings', () => {
    expect(clampInt('foo', 1, 10, NINETY_NINE)).toBe(NINETY_NINE);
    expect(clampInt('', 1, 10, NINETY_NINE)).toBe(NINETY_NINE);
  });

  it('returns fallback for NaN', () => {
    expect(clampInt(Number.NaN, 1, 10, 42)).toBe(42);
  });

  it('clamps Infinity to bounds', () => {
    expect(clampInt(Number.POSITIVE_INFINITY, 1, 10, 0)).toBe(10);
    expect(clampInt(Number.NEGATIVE_INFINITY, 1, 10, 0)).toBe(1);
  });
});

describe('formatSeconds', () => {
  it.each([
    [0, '0s'],
    [9, '9s'],
    [45, '45s'],
    [59, '59s'],
    [60, '1:00'],
    [65, '1:05'],
    [125, '2:05'],
    [600, '10:00'],
    [3600, '60:00'],
  ])('formats %ss as "%s"', (input, expected) => {
    expect(formatSeconds(input)).toBe(expected);
  });
});

describe('pickRandom', () => {
  const items = ['A', 'B', 'C', 'D'] as const;

  it('returns the first element when the RNG is 0', () => {
    expect(pickRandom(items, () => 0)).toBe('A');
  });

  it('returns the last element when the RNG approaches 1', () => {
    expect(pickRandom(items, () => 0.9999)).toBe('D');
  });

  it('always returns a member of the input', () => {
    expect(items).toContain(pickRandom(items, () => HALF_RANDOM));
  });
});

describe('shuffleFisherYates', () => {
  it('returns a new array with the same elements', () => {
    const original = [1, 2, 3, 4, 5];
    const result = shuffleFisherYates(original);

    expect(result).not.toBe(original);
    expect(result).toHaveLength(original.length);
    expect([...result].sort()).toEqual([...original].sort());
  });

  it('produces a deterministic shuffle for a fixed RNG', () => {
    expect(shuffleFisherYates([1, 2, 3, 4, 5], () => 0)).toEqual([2, 3, 4, 5, 1]);
  });

  it('supports deterministic non-zero RNG sequences', () => {
    const values = [HALF_RANDOM, QUARTER_RANDOM, THREE_QUARTER_RANDOM, 0];
    const nextRandom = () => values.shift() ?? 0;

    expect(shuffleFisherYates([1, 2, 3, 4, 5], nextRandom)).toEqual([4, 1, 5, 2, 3]);
  });
});

describe('weightedLetterBag', () => {
  it('contains every letter exactly once', () => {
    const bag = weightedLetterBag();
    expect(bag).toHaveLength(englishLetters.length);
    expect([...bag].sort()).toEqual([...englishLetters].sort());
  });

  it('accepts a locale argument and still returns all letters', () => {
    const bag = weightedLetterBag('fr-FR');
    expect(bag).toHaveLength(englishLetters.length);
    expect([...bag].sort()).toEqual([...englishLetters].sort());
  });

  it('uses the Greek alphabet for Greek locales', () => {
    const bag = weightedLetterBag('el');
    expect(bag).toHaveLength(getLocaleLetters('el').length);
    expect([...bag].sort()).toEqual([...getLocaleLetters('el')].sort());
  });

  it('produces varying orderings across calls', () => {
    const orderings = new Set<string>();
    for (let i = 0; i < 20; i += 1) {
      orderings.add(weightedLetterBag().join(''));
    }
    expect(orderings.size).toBeGreaterThan(1);
  });

  it('accepts an injected RNG for deterministic weighted order', () => {
    expect(weightedLetterBag('en', () => 0)).toEqual(englishLetters);
  });

  it('orders letters proportionally to their weights', () => {
    const trials = 4000;
    const highLetter = 'T';
    const lowLetter = 'Q';
    const toleranceDigits = 1;
    const weights = getLocaleLetterWeights('en');

    let highFirst = 0;
    for (let i = 0; i < trials; i += 1) {
      const bag = weightedLetterBag('en');
      if (bag.indexOf(highLetter) < bag.indexOf(lowLetter)) {
        highFirst += 1;
      }
    }

    // Reservoir-sampling keys give P(high before low) = w_high / (w_high + w_low).
    const expected = weights[highLetter] / (weights[highLetter] + weights[lowLetter]);
    expect(highFirst / trials).toBeCloseTo(expected, toleranceDigits);
  });
});
