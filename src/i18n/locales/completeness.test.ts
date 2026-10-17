import { describe, expect, it } from "vitest";
import { BOOT_MESSAGES } from "@/app/bootMessages";
import { CATEGORY_KEYS } from "@/domain/game/categoryKeys";
import { LETTER_WEIGHTS_BY_LOCALE } from "@/domain/game/localeWeights";
import {
  FALLBACK_LOCALE,
  getLocaleLetters,
  getNativeName,
  SUPPORTED_LOCALES,
} from "@/i18n/localeRegistry";
import { PACKS } from "@/shared/lib/categoryPacks";
import { loadLocaleNamespaces } from "./resources";

function flattenEntries(value: unknown, prefix = ""): [string, unknown][] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return [[prefix, value]];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    flattenEntries(child, prefix ? `${prefix}.${key}` : key),
  );
}

function flattenKeys(value: unknown): string[] {
  return flattenEntries(value).map(([key]) => key);
}

const PLACEHOLDER_OR_TAG = /\{\{[^}]+\}\}|<\/?[\w-]+>/g;

/** Each string's `{{var}}` placeholders and `<tag>`s, sorted so word order may differ. */
function markupByKey(value: unknown): Record<string, string[]> {
  return Object.fromEntries(
    flattenEntries(value).map(([key, text]) => [
      key,
      String(text).match(PLACEHOLDER_OR_TAG)?.sort() ?? [],
    ]),
  );
}

// Guards against a locale being registered without shipping the assets it needs —
// the language picker offers every entry in SUPPORTED_LOCALES with no runtime check.
describe("locale asset completeness", () => {
  it.each(SUPPORTED_LOCALES)("%s has letters, a native name, and letter weights", (locale) => {
    expect(getLocaleLetters(locale).length).toBeGreaterThan(0);
    expect(getNativeName(locale)).not.toBe(locale);
    // A letter missing from the table gets weight 1, far above the real frequencies
    // (under 0.2), so it would come up far more often than any real letter. Weights
    // must cover the alphabet exactly.
    expect(Object.keys(LETTER_WEIGHTS_BY_LOCALE[locale] ?? {}).sort()).toEqual(
      getLocaleLetters(locale).sort(),
    );
  });

  it.each(SUPPORTED_LOCALES)("%s has boot screen messages", (locale) => {
    const messages: Record<string, object> = BOOT_MESSAGES;
    expect(Object.keys(messages[locale] ?? {})).toEqual(Object.keys(BOOT_MESSAGES.en));
  });

  it.each(SUPPORTED_LOCALES)("%s has translation and category resources", async (locale) => {
    const { translation, categories } = await loadLocaleNamespaces(locale);
    expect(Object.keys(translation).length).toBeGreaterThan(0);
    expect(Object.keys(categories).length).toBeGreaterThan(0);
  });

  // The domain list is the source of truth for which categories exist; the
  // English file is just its first translation and must not drift from it.
  it("the English category file matches the domain key list", async () => {
    const { categories } = await loadLocaleNamespaces(FALLBACK_LOCALE);
    expect(Object.keys(categories)).toEqual([...CATEGORY_KEYS]);
  });

  it("every pack label key resolves in the English translations", async () => {
    const { translation } = await loadLocaleNamespaces(FALLBACK_LOCALE);
    const keys = new Set(flattenKeys(translation));
    expect(PACKS.filter((pack) => !keys.has(pack.labelKey)).map((pack) => pack.labelKey)).toEqual(
      [],
    );
  });

  // Guards against key drift: every locale must ship exactly the keys en does —
  // missing keys fall back to English (untranslated UI), stale keys are dead weight.
  it.each(SUPPORTED_LOCALES.filter((locale) => locale !== FALLBACK_LOCALE))(
    "%s translation keys match the %s template",
    async (locale) => {
      const en = await loadLocaleNamespaces(FALLBACK_LOCALE);
      const { translation } = await loadLocaleNamespaces(locale);
      const expected = flattenKeys(en.translation).sort();
      const actual = flattenKeys(translation).sort();
      expect(actual).toEqual(expected);
    },
  );

  // A translated placeholder renders as literal "{{name}}", and a renamed tag
  // drops its link, so each string must keep English's markup exactly.
  it.each(SUPPORTED_LOCALES.filter((locale) => locale !== FALLBACK_LOCALE))(
    "%s keeps every placeholder and tag of the English strings",
    async (locale) => {
      const en = await loadLocaleNamespaces(FALLBACK_LOCALE);
      const { translation } = await loadLocaleNamespaces(locale);
      expect(markupByKey(translation)).toEqual(markupByKey(en.translation));
    },
  );
});
