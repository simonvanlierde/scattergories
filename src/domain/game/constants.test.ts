import { describe, expect, it } from 'vitest';
import { getLocaleLetters } from '@/i18n/localeRegistry';
import {
  catCountDefault,
  catCountMax,
  catCountMin,
  categories,
  durationDefault,
  durationMax,
  durationMin,
  englishLetters,
} from './constants';

describe('constants integrity', () => {
  it('keeps letters aligned with the English locale registry', () => {
    expect(englishLetters).toEqual(getLocaleLetters('en'));
  });

  it('defines sane numeric bounds and defaults', () => {
    expect(durationMin).toBeLessThanOrEqual(durationDefault);
    expect(durationDefault).toBeLessThanOrEqual(durationMax);

    expect(catCountMin).toBeLessThanOrEqual(catCountDefault);
    expect(catCountDefault).toBeLessThanOrEqual(catCountMax);
  });

  it('has enough default categories for the maximum draw count', () => {
    expect(categories.length).toBeGreaterThanOrEqual(catCountMax);
  });

  it('does not include blank default categories', () => {
    expect(categories.every((category) => category.trim().length > 0)).toBe(true);
  });
});
