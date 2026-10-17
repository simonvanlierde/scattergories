import letterWeights from "@/i18n/__generated__/letterWeights.json";
import { FALLBACK_LOCALE, normalizeLocale } from "@/i18n/localeRegistry";
import type { LocaleCode } from "@/i18n/locales/resources";

export const LETTER_WEIGHTS_BY_LOCALE: Partial<Record<string, Readonly<Record<string, number>>>> =
  letterWeights satisfies Record<LocaleCode, Record<string, number>>;

export function getLocaleLetterWeights(
  locale: string | null | undefined,
): Readonly<Record<string, number>> {
  const normalized = normalizeLocale(locale);
  // FALLBACK_LOCALE always exists in the generated table; the empty-object tail is
  // an unreachable guard for noUncheckedIndexedAccess (a missing weight is treated
  // as 1 downstream, so a bare fallback degrades to a uniform draw either way).
  return LETTER_WEIGHTS_BY_LOCALE[normalized] ?? LETTER_WEIGHTS_BY_LOCALE[FALLBACK_LOCALE] ?? {};
}
