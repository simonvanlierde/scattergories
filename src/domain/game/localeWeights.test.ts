import { describe, expect, it } from 'vitest';
import { FALLBACK_LOCALE } from '@/i18n/localeRegistry';
import {
  getLocaleLetterWeights,
  getLocaleWeightManifest,
  LETTER_WEIGHTS_BY_LOCALE,
  LOCALE_WEIGHT_MANIFEST,
} from './localeWeights';

describe('getLocaleLetterWeights', () => {
  it('returns the weights for a supported locale', () => {
    expect(getLocaleLetterWeights('el')).toBe(LETTER_WEIGHTS_BY_LOCALE.el);
  });

  it('falls back to the default locale for unknown locales', () => {
    expect(getLocaleLetterWeights('zz')).toBe(LETTER_WEIGHTS_BY_LOCALE[FALLBACK_LOCALE]);
  });
});

describe('getLocaleWeightManifest', () => {
  it('returns the manifest for a supported locale', () => {
    expect(getLocaleWeightManifest('el')).toBe(LOCALE_WEIGHT_MANIFEST.el);
  });

  it('falls back to the default locale manifest for unknown locales', () => {
    expect(getLocaleWeightManifest('zz')).toBe(LOCALE_WEIGHT_MANIFEST[FALLBACK_LOCALE]);
  });
});
