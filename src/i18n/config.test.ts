import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { messages as english } from "./locales/en.po";

vi.mock("./locales/resources", () => ({ loadLocaleMessages: vi.fn() }));

const STORAGE_KEY = "scattergories.language";

/** Fresh module graph per case: config.ts reads storage once, at import time. */
async function bootI18n(loadFails = false) {
  vi.resetModules();
  const { loadLocaleMessages } = await import("./locales/resources");
  if (loadFails) {
    // English is bundled in the real loader, so only the other locales can fail.
    vi.mocked(loadLocaleMessages).mockImplementation((locale) =>
      locale === "en" ? Promise.resolve(english) : Promise.reject(new Error("chunk 404")),
    );
  } else {
    vi.mocked(loadLocaleMessages).mockResolvedValue(english);
  }
  const { initI18n } = await import("./config");
  return await initI18n();
}

/** jsdom's navigator.language is a prototype getter — override it per case. */
function stubBrowserLanguage(language: string) {
  Object.defineProperty(window.navigator, "language", { value: language, configurable: true });
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(window.navigator, "language");
  window.localStorage.clear();
});

describe("initI18n", () => {
  it("falls back to English for the session but keeps the stored choice when a chunk fails", async () => {
    window.localStorage.setItem(STORAGE_KEY, "fr");

    const i18n = await bootI18n(true);

    expect(i18n.locale).toBe("en");
    expect(i18n._("title")).toBe("Scattergories");
    expect(document.documentElement.lang).toBe("en");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("fr");
  });

  it("does not store English when the browser language's chunk fails", async () => {
    stubBrowserLanguage("de-DE");

    const i18n = await bootI18n(true);

    expect(i18n.locale).toBe("en");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("stores the normalized language once its chunk loads", async () => {
    window.localStorage.setItem(STORAGE_KEY, "fr-FR");

    const i18n = await bootI18n();

    expect(i18n.locale).toBe("fr");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("fr");
  });

  it("seeds from the browser language when nothing is stored", async () => {
    stubBrowserLanguage("de-DE");

    const i18n = await bootI18n();

    expect(i18n.locale).toBe("de");
  });

  it("ignores an unsupported browser language", async () => {
    stubBrowserLanguage("ja-JP");

    const i18n = await bootI18n();

    expect(i18n.locale).toBe("en");
  });
});
