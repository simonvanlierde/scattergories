import letterWeights from "@/i18n/__generated__/letterWeights.json";
import { FALLBACK_LOCALE, getLocaleLetters, normalizeLocale } from "@/i18n/localeRegistry";
import type { LocaleCode } from "@/i18n/locales/resources";

export const LETTER_WEIGHTS_BY_LOCALE: Partial<Record<string, Readonly<Record<string, number>>>> =
  letterWeights satisfies Record<LocaleCode, Record<string, number>>;

export function getLocaleLetterWeights(locale: string | null | undefined): Readonly<Record<string, number>> {
  const normalized = normalizeLocale(locale);
  // FALLBACK_LOCALE always exists in the generated table; the empty-object tail is
  // an unreachable guard for noUncheckedIndexedAccess (a missing weight is treated
  // as 1 downstream, so a bare fallback degrades to a uniform draw either way).
  return LETTER_WEIGHTS_BY_LOCALE[normalized] ?? LETTER_WEIGHTS_BY_LOCALE[FALLBACK_LOCALE] ?? {};
}

/**
 * Each letter of the locale's alphabet, in alphabet order, with its chance of being drawn
 * when no letter is skipped: its weight over the alphabet's total, as `drawLetter` uses them.
 */
export function getLetterOdds(locale: string | null | undefined): { letter: string; chance: number }[] {
  const letters = getLocaleLetters(locale);
  const weights = getLocaleLetterWeights(locale);
  const total = letters.reduce((sum, letter) => sum + (weights[letter] ?? 1), 0);
  return letters.map((letter) => ({
    letter,
    chance: total > 0 ? (weights[letter] ?? 1) / total : 1 / letters.length,
  }));
}
