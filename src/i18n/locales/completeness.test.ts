import { describe, expect, it } from 'vitest';
import { LETTER_WEIGHTS_BY_LOCALE } from '@/i18n/__generated__/letterWeights';
import { getLocaleLetters, getNativeName, SUPPORTED_LOCALES } from '@/i18n/localeRegistry';
import { loadLocaleNamespaces } from './resources';

// Guards against a locale being registered without shipping the assets it needs —
// the language picker offers every entry in SUPPORTED_LOCALES with no runtime check.
describe('locale asset completeness', () => {
  it.each(SUPPORTED_LOCALES)('%s has letters, a native name, and letter weights', (locale) => {
    expect(getLocaleLetters(locale).length).toBeGreaterThan(0);
    expect(getNativeName(locale)).not.toBe(locale);
    expect(Object.keys(LETTER_WEIGHTS_BY_LOCALE[locale] ?? {}).length).toBeGreaterThan(0);
  });

  it.each(SUPPORTED_LOCALES)('%s has translation and category resources', async (locale) => {
    const { translation, categories } = await loadLocaleNamespaces(locale);
    expect(Object.keys(translation).length).toBeGreaterThan(0);
    expect(Object.keys(categories).length).toBeGreaterThan(0);
  });
});
