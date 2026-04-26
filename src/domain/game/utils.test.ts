import { describe, expect, it } from 'vitest';
import { getLocaleLetters } from '@/i18n/localeRegistry';
import {
  APPROACHES_ONE,
  FIFTEEN,
  FIFTY_NINE,
  FIVE,
  FORTY_FIVE,
  FORTY_TWO,
  FOUR,
  HUNDRED_AND_TWENTY_FIVE,
  NEGATIVE_FIVE,
  NEGATIVE_HUNDRED,
  NEGATIVE_TEN,
  NINE,
  ONE,
  SIX_HUNDRED,
  SIXTY,
  SIXTY_FIVE,
  TEN,
  THREE,
  THREE_THOUSAND_SIX_HUNDRED,
  TWENTY,
  ZERO,
} from '@/test/constants';
import { englishLetters } from './constants';
import {
  clampInt,
  formatSeconds,
  pickRandom,
  shuffleFisherYates,
  weightedLetterBag,
} from './utils';

const TWO = 2;
const NINETY_NINE = 99;
const HALF_RANDOM = 0.5;
const QUARTER_RANDOM = 0.25;
const THREE_QUARTER_RANDOM = 0.75;

describe('clampInt', () => {
  it.each([
    { value: FIVE, min: ONE, max: TEN, expected: FIVE },
    { value: ZERO, min: ONE, max: TEN, expected: ONE },
    { value: FIFTEEN, min: ONE, max: TEN, expected: TEN },
    { value: ONE, min: ONE, max: TEN, expected: ONE },
    { value: TEN, min: ONE, max: TEN, expected: TEN },
    { value: NEGATIVE_FIVE, min: NEGATIVE_TEN, max: TEN, expected: NEGATIVE_FIVE },
    { value: NEGATIVE_HUNDRED, min: NEGATIVE_TEN, max: TEN, expected: NEGATIVE_TEN },
  ])('clamps $value within [$min, $max] → $expected', ({ value, min, max, expected }) => {
    expect(clampInt(value, min, max, ZERO)).toBe(expected);
  });

  it('parses numeric strings', () => {
    expect(clampInt('5', ONE, TEN, ZERO)).toBe(FIVE);
    expect(clampInt('15', ONE, TEN, ZERO)).toBe(TEN);
  });

  it('returns fallback for non-numeric strings', () => {
    expect(clampInt('foo', ONE, TEN, NINETY_NINE)).toBe(NINETY_NINE);
    expect(clampInt('', ONE, TEN, NINETY_NINE)).toBe(NINETY_NINE);
  });

  it('returns fallback for NaN', () => {
    expect(clampInt(Number.NaN, ONE, TEN, FORTY_TWO)).toBe(FORTY_TWO);
  });

  it('clamps Infinity to bounds', () => {
    expect(clampInt(Number.POSITIVE_INFINITY, ONE, TEN, ZERO)).toBe(TEN);
    expect(clampInt(Number.NEGATIVE_INFINITY, ONE, TEN, ZERO)).toBe(ONE);
  });
});

describe('formatSeconds', () => {
  it.each([
    [ZERO, '0s'],
    [NINE, '9s'],
    [FORTY_FIVE, '45s'],
    [FIFTY_NINE, '59s'],
    [SIXTY, '1:00'],
    [SIXTY_FIVE, '1:05'],
    [HUNDRED_AND_TWENTY_FIVE, '2:05'],
    [SIX_HUNDRED, '10:00'],
    [THREE_THOUSAND_SIX_HUNDRED, '60:00'],
  ])('formats %ss as "%s"', (input, expected) => {
    expect(formatSeconds(input)).toBe(expected);
  });
});

describe('pickRandom', () => {
  const items = ['A', 'B', 'C', 'D'] as const;

  it('returns the first element when the RNG is 0', () => {
    expect(pickRandom(items, () => ZERO)).toBe('A');
  });

  it('returns the last element when the RNG approaches 1', () => {
    expect(pickRandom(items, () => APPROACHES_ONE)).toBe('D');
  });

  it('always returns a member of the input', () => {
    expect(items).toContain(pickRandom(items, () => HALF_RANDOM));
  });
});

describe('shuffleFisherYates', () => {
  it('returns a new array with the same elements', () => {
    const original = [ONE, TWO, THREE, FOUR, FIVE];
    const result = shuffleFisherYates(original);

    expect(result).not.toBe(original);
    expect(result).toHaveLength(original.length);
    expect([...result].sort()).toEqual([...original].sort());
  });

  it('produces a deterministic shuffle for a fixed RNG', () => {
    expect(shuffleFisherYates([ONE, TWO, THREE, FOUR, FIVE], () => ZERO)).toEqual([
      TWO,
      THREE,
      FOUR,
      FIVE,
      ONE,
    ]);
  });

  it('supports deterministic non-zero RNG sequences', () => {
    const values = [HALF_RANDOM, QUARTER_RANDOM, THREE_QUARTER_RANDOM, ZERO];
    const nextRandom = () => values.shift() ?? ZERO;

    expect(shuffleFisherYates([ONE, TWO, THREE, FOUR, FIVE], nextRandom)).toEqual([
      FOUR,
      ONE,
      FIVE,
      TWO,
      THREE,
    ]);
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
    for (let i = ZERO; i < TWENTY; i += ONE) {
      orderings.add(weightedLetterBag().join(''));
    }
    expect(orderings.size).toBeGreaterThan(1);
  });

  it('accepts an injected RNG for deterministic weighted order', () => {
    expect(weightedLetterBag('en', () => ZERO)).toEqual(englishLetters);
  });
});
