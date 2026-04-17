import { describe, expect, it } from 'vitest';
import { LETTER_WEIGHTS_BY_LOCALE, LOCALE_WEIGHT_MANIFEST } from '../game/localeWeights';
import {
  getBootstrapLocaleWarning,
  getEnabledLocales,
  getLocaleHealth,
  resolveLocale,
} from './localeHealth';
import { getLocaleLetters, SUPPORTED_LOCALES } from './localeRegistry';
import { hasLocaleResources, loadLocaleNamespaces } from './locales/resources';

describe('locale assets', () => {
  it('provides translations, categories, and weights for every supported locale', async () => {
    const results = await Promise.all(
      SUPPORTED_LOCALES.map(async (locale) => {
        expect(hasLocaleResources(locale)).toBe(true);
        const namespaces = await loadLocaleNamespaces(locale);
        expect(namespaces.translation).toBeTruthy();
        expect(namespaces.categories).toBeTruthy();
        expect(
          LETTER_WEIGHTS_BY_LOCALE[locale as keyof typeof LETTER_WEIGHTS_BY_LOCALE],
        ).toBeTruthy();
        expect(
          Object.keys(LETTER_WEIGHTS_BY_LOCALE[locale as keyof typeof LETTER_WEIGHTS_BY_LOCALE]),
        ).toHaveLength(getLocaleLetters(locale).length);
        expect(getLocaleHealth(locale).isComplete).toBe(true);
        expect(
          LOCALE_WEIGHT_MANIFEST[locale as keyof typeof LOCALE_WEIGHT_MANIFEST].hasWeights,
        ).toBe(true);
      }),
    );

    expect(results).toHaveLength(SUPPORTED_LOCALES.length);
  });

  it('falls back to English for unknown locales and surfaces a warning', () => {
    expect(resolveLocale('zz')).toBe('en');
    expect(getBootstrapLocaleWarning('zz')).toContain('using en');
  });

  it('enables every supported locale when the assets are complete', () => {
    expect(getEnabledLocales()).toEqual(SUPPORTED_LOCALES);
  });
});
