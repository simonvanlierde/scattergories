import { describe, expect, it } from "vitest";
import { LETTER_WEIGHTS_BY_LOCALE } from "@/i18n/__generated__/letterWeights";
import {
  FALLBACK_LOCALE,
  getLocaleLetters,
  getNativeName,
  SUPPORTED_LOCALES,
} from "@/i18n/localeRegistry";
import { loadLocaleNamespaces } from "./resources";

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

// Guards against a locale being registered without shipping the assets it needs —
// the language picker offers every entry in SUPPORTED_LOCALES with no runtime check.
describe("locale asset completeness", () => {
  it.each(SUPPORTED_LOCALES)("%s has letters, a native name, and letter weights", (locale) => {
    expect(getLocaleLetters(locale).length).toBeGreaterThan(0);
    expect(getNativeName(locale)).not.toBe(locale);
    expect(Object.keys(LETTER_WEIGHTS_BY_LOCALE[locale] ?? {}).length).toBeGreaterThan(0);
  });

  it.each(SUPPORTED_LOCALES)("%s has translation and category resources", async (locale) => {
    const { translation, categories } = await loadLocaleNamespaces(locale);
    expect(Object.keys(translation).length).toBeGreaterThan(0);
    expect(Object.keys(categories).length).toBeGreaterThan(0);
  });

  // Guards against key drift: every locale must ship exactly the keys en does —
  // missing keys fall back to English (untranslated UI), stale keys are dead weight.
  it.each(
    SUPPORTED_LOCALES.filter((locale) => locale !== FALLBACK_LOCALE),
  )("%s translation keys match the %s template", async (locale) => {
    const en = await loadLocaleNamespaces(FALLBACK_LOCALE);
    const { translation } = await loadLocaleNamespaces(locale);
    const expected = flattenKeys(en.translation).sort();
    const actual = flattenKeys(translation).sort();
    expect(actual).toEqual(expected);
  });
});
