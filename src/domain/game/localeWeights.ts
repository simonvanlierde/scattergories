import { LETTER_WEIGHTS_BY_LOCALE } from '@/i18n/__generated__/letterWeights';
import { FALLBACK_LOCALE, normalizeLocale } from '@/i18n/localeRegistry';

export function getLocaleLetterWeights(locale: string | null | undefined): Record<string, number> {
  const normalized = normalizeLocale(locale);
  return LETTER_WEIGHTS_BY_LOCALE[normalized] ?? LETTER_WEIGHTS_BY_LOCALE[FALLBACK_LOCALE];
}
