import { describe, expect, it } from "vitest";
import { FALLBACK_LOCALE, getLocaleLetters } from "@/i18n/localeRegistry";
import { getLetterOdds, getLocaleLetterWeights, LETTER_WEIGHTS_BY_LOCALE } from "./localeWeights";

describe("getLocaleLetterWeights", () => {
  it("returns the weights for a supported locale", () => {
    expect(getLocaleLetterWeights("el")).toBe(LETTER_WEIGHTS_BY_LOCALE.el);
  });

  it("falls back to the default locale for unknown locales", () => {
    expect(getLocaleLetterWeights("zz")).toBe(LETTER_WEIGHTS_BY_LOCALE[FALLBACK_LOCALE]);
  });
});

describe("getLetterOdds", () => {
  it("lists every letter of the alphabet in order, with chances that sum to 1", () => {
    const odds = getLetterOdds("pl");

    expect(odds.map(({ letter }) => letter)).toEqual(getLocaleLetters("pl"));
    expect(odds.reduce((sum, { chance }) => sum + chance, 0)).toBeCloseTo(1, 10);
  });

  it("keeps the ratios of the shipped weights", () => {
    const weights = getLocaleLetterWeights("en");
    const odds = Object.fromEntries(getLetterOdds("en").map(({ letter, chance }) => [letter, chance]));

    expect((odds.S ?? 0) / (odds.Q ?? 1)).toBeCloseTo((weights.S ?? 0) / (weights.Q ?? 1), 10);
    expect(odds.S).toBeGreaterThan(odds.X ?? 1);
  });
});
