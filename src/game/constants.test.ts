import { describe, expect, it } from 'vitest';
import { getLocaleLetters } from '../i18n/localeRegistry';
import {
  CAT_COUNT_DEFAULT,
  CAT_COUNT_MAX,
  CAT_COUNT_MIN,
  CATEGORIES,
  DURATION_DEFAULT,
  DURATION_MAX,
  DURATION_MIN,
  ENGLISH_LETTERS,
  ROUNDS_DEFAULT,
  ROUNDS_MAX,
  ROUNDS_MIN,
} from './constants';

describe('constants integrity', () => {
  it('keeps letters aligned with the English locale registry', () => {
    expect(ENGLISH_LETTERS).toEqual(getLocaleLetters('en'));
  });

  it('defines sane numeric bounds and defaults', () => {
    expect(DURATION_MIN).toBeLessThanOrEqual(DURATION_DEFAULT);
    expect(DURATION_DEFAULT).toBeLessThanOrEqual(DURATION_MAX);

    expect(CAT_COUNT_MIN).toBeLessThanOrEqual(CAT_COUNT_DEFAULT);
    expect(CAT_COUNT_DEFAULT).toBeLessThanOrEqual(CAT_COUNT_MAX);

    expect(ROUNDS_MIN).toBeLessThanOrEqual(ROUNDS_DEFAULT);
    expect(ROUNDS_DEFAULT).toBeLessThanOrEqual(ROUNDS_MAX);
  });

  it('has enough default categories for the maximum draw count', () => {
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(CAT_COUNT_MAX);
  });

  it('does not include blank default categories', () => {
    expect(CATEGORIES.every((category) => category.trim().length > 0)).toBe(true);
  });
});
