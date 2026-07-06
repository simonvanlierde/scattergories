import { LETTER_WEIGHTS_BY_LOCALE } from "@/i18n/__generated__/letterWeights";
import { FALLBACK_LOCALE, normalizeLocale } from "@/i18n/localeRegistry";

export function getLocaleLetterWeights(locale: string | null | undefined): Record<string, number> {
  const normalized = normalizeLocale(locale);
  // FALLBACK_LOCALE always exists in the generated table; the empty-object tail is
  // an unreachable guard for noUncheckedIndexedAccess (a missing weight is treated
  // as 1 downstream, so a bare fallback degrades to a uniform bag either way).
  return LETTER_WEIGHTS_BY_LOCALE[normalized] ?? LETTER_WEIGHTS_BY_LOCALE[FALLBACK_LOCALE] ?? {};
}
