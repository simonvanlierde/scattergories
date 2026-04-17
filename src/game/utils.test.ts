import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLocaleLetters } from '../i18n/localeRegistry';
import { ENGLISH_LETTERS } from './constants';
import {
  clampInt,
  formatSeconds,
  pickRandom,
  shuffleFisherYates,
  weightedLetterBag,
} from './utils';

afterEach(() => {
  vi.restoreAllMocks();
});

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
    expect(clampInt('foo', 1, 10, 99)).toBe(99);
    expect(clampInt('', 1, 10, 99)).toBe(99);
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

  it('returns the first element when Math.random is 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(pickRandom(items)).toBe('A');
  });

  it('returns the last element when Math.random approaches 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9999);
    expect(pickRandom(items)).toBe('D');
  });

  it('always returns a member of the input', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(items).toContain(pickRandom(items));
    }
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
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(shuffleFisherYates([1, 2, 3, 4, 5])).toEqual([2, 3, 4, 5, 1]);
  });

  it('actually permutes the input across many runs', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const seen = new Set<string>();
    for (let i = 0; i < 50; i += 1) {
      seen.add(shuffleFisherYates(input).join(','));
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe('weightedLetterBag', () => {
  it('contains every letter exactly once', () => {
    const bag = weightedLetterBag();
    expect(bag).toHaveLength(ENGLISH_LETTERS.length);
    expect([...bag].sort()).toEqual([...ENGLISH_LETTERS].sort());
  });

  it('accepts a locale argument and still returns all letters', () => {
    const bag = weightedLetterBag('fr-FR');
    expect(bag).toHaveLength(ENGLISH_LETTERS.length);
    expect([...bag].sort()).toEqual([...ENGLISH_LETTERS].sort());
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

  it('places high-weight letters later in the bag than low-weight letters over many runs', () => {
    const highWeightLetter = 'T';
    const lowWeightLetter = 'Q';
    const highPositions: number[] = [];
    const lowPositions: number[] = [];

    for (let i = 0; i < 1000; i += 1) {
      const bag = weightedLetterBag('en');
      highPositions.push(bag.indexOf(highWeightLetter));
      lowPositions.push(bag.indexOf(lowWeightLetter));
    }

    const averageHigh = highPositions.reduce((sum, value) => sum + value, 0) / highPositions.length;
    const averageLow = lowPositions.reduce((sum, value) => sum + value, 0) / lowPositions.length;

    expect(averageHigh).toBeGreaterThan(averageLow);
  });
});
