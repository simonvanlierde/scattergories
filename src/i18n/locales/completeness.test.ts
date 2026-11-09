import { parsePoFile } from "@lingui/format-po";
import { describe, expect, it } from "vitest";
import { BOOT_MESSAGES } from "@/app/bootMessages";
import { PACKS } from "@/domain/deck";
import { CATEGORY_KEYS } from "@/domain/game/categoryKeys";
import { LETTER_WEIGHTS_BY_LOCALE } from "@/domain/game/localeWeights";
import { FALLBACK_LOCALE, getLocaleLetters, getNativeName, SUPPORTED_LOCALES } from "@/i18n/localeRegistry";
import { loadLocaleMessages } from "./resources";

const catalogs = import.meta.glob<string>("./*.po", { query: "?raw", import: "default", eager: true });

function entries(locale: string): Record<string, string> {
  const source = catalogs[`./${locale}.po`] ?? "";
  return Object.fromEntries(parsePoFile(source).items.map((item) => [item.msgid, item.msgstr[0] ?? ""]));
}

const english = entries(FALLBACK_LOCALE);
const markup = (message: string) => message.match(/\{\w+\}|<\/?\d+>/g)?.sort() ?? [];

describe("locale asset completeness", () => {
  it.each(SUPPORTED_LOCALES)("%s has letters, a native name, and letter weights", (locale) => {
    expect(getLocaleLetters(locale).length).toBeGreaterThan(0);
    expect(getNativeName(locale)).not.toBe(locale);
    expect(Object.keys(LETTER_WEIGHTS_BY_LOCALE[locale] ?? {}).sort()).toEqual(getLocaleLetters(locale).sort());
  });

  it.each(SUPPORTED_LOCALES)("%s has boot screen messages", (locale) => {
    const messages: Record<string, object> = BOOT_MESSAGES;
    expect(Object.keys(messages[locale] ?? {})).toEqual(Object.keys(BOOT_MESSAGES.en));
  });

  it("English category messages match the domain key list", () => {
    expect(
      Object.keys(english)
        .filter((id) => id.startsWith("category."))
        .sort(),
    ).toEqual(CATEGORY_KEYS.map((key) => `category.${key}`).sort());
  });

  it("every pack label resolves in English", () => {
    expect(PACKS.filter((pack) => !english[pack.labelKey]).map((pack) => pack.labelKey)).toEqual([]);
  });

  it.each(SUPPORTED_LOCALES)("%s compiles and preserves all messages, placeholders, and links", async (locale) => {
    const translations = entries(locale);
    const compiled = await loadLocaleMessages(locale);
    expect(Object.keys(translations).sort()).toEqual(Object.keys(english).sort());
    expect(Object.keys(compiled).sort()).toEqual(Object.keys(english).sort());
    for (const [id, source] of Object.entries(english)) {
      expect(translations[id], id).toBeTruthy();
      expect(markup(translations[id] ?? ""), id).toEqual(markup(source));
    }
  });
});
