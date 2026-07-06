import { describe, expect, it } from "vitest";
import { LETTER_WEIGHTS_BY_LOCALE } from "@/i18n/__generated__/letterWeights";
import { FALLBACK_LOCALE } from "@/i18n/localeRegistry";
import { getLocaleLetterWeights } from "./localeWeights";

describe("getLocaleLetterWeights", () => {
  it("returns the weights for a supported locale", () => {
    expect(getLocaleLetterWeights("el")).toBe(LETTER_WEIGHTS_BY_LOCALE.el);
  });

  it("falls back to the default locale for unknown locales", () => {
    expect(getLocaleLetterWeights("zz")).toBe(LETTER_WEIGHTS_BY_LOCALE[FALLBACK_LOCALE]);
  });
});
