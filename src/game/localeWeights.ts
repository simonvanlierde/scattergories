import { FALLBACK_LOCALE, normalizeLocale } from '../i18n/localeRegistry';
import {
  LETTER_WEIGHTS_BY_LOCALE as GENERATED_LETTER_WEIGHTS_BY_LOCALE,
  LOCALE_WEIGHT_MANIFEST as GENERATED_LOCALE_WEIGHT_MANIFEST,
} from '../i18n/locales/letterWeights.generated';

type GeneratedLocaleWeightManifest =
  import('../i18n/locales/letterWeights.generated').LocaleWeightManifest;

export const LETTER_WEIGHTS_BY_LOCALE = GENERATED_LETTER_WEIGHTS_BY_LOCALE;
export const LOCALE_WEIGHT_MANIFEST = GENERATED_LOCALE_WEIGHT_MANIFEST;

export function getLocaleLetterWeights(locale: string | null | undefined): Record<string, number> {
  const normalized = normalizeLocale(locale);
  return LETTER_WEIGHTS_BY_LOCALE[normalized] ?? LETTER_WEIGHTS_BY_LOCALE[FALLBACK_LOCALE];
}

export function getLocaleWeightManifest(
  locale: string | null | undefined,
): GeneratedLocaleWeightManifest {
  const normalized = normalizeLocale(locale);
  return LOCALE_WEIGHT_MANIFEST[normalized] ?? LOCALE_WEIGHT_MANIFEST[FALLBACK_LOCALE];
}

export type { LocaleWeightManifest };
