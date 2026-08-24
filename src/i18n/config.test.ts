import type { InitOptions } from "i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// A throwaway i18next instance per module reset, so each case boots config.ts
// from scratch — the real singleton stays initialized across tests.
vi.mock("i18next", () => {
  const instance = {
    isInitialized: false,
    language: "",
    on: vi.fn(),
    use: vi.fn(() => instance),
    init: vi.fn((options: InitOptions) => {
      instance.isInitialized = true;
      instance.language = String(options.lng);
      return Promise.resolve();
    }),
    changeLanguage: vi.fn((language: string) => {
      instance.language = language;
      return Promise.resolve();
    }),
    hasResourceBundle: vi.fn(() => false),
    addResourceBundle: vi.fn(),
  };
  return { default: instance };
});

vi.mock("./locales/resources", () => ({ loadLocaleNamespaces: vi.fn() }));

const STORAGE_KEY = "scattergories.language";

/** Fresh module graph per case: config.ts reads storage once, at import time. */
async function bootI18n(loadFails = false) {
  vi.resetModules();
  // The mocked module object survives resetModules — hand config.ts a pristine one.
  const stub = (await import("i18next")).default as unknown as {
    isInitialized: boolean;
    language: string;
  };
  stub.isInitialized = false;
  stub.language = "";
  const { loadLocaleNamespaces } = await import("./locales/resources");
  if (loadFails) {
    vi.mocked(loadLocaleNamespaces).mockRejectedValue(new Error("chunk 404"));
  } else {
    vi.mocked(loadLocaleNamespaces).mockResolvedValue({ translation: {}, categories: {} });
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
  it("falls back to English and rewrites storage when a locale chunk fails", async () => {
    window.localStorage.setItem(STORAGE_KEY, "fr");

    const i18n = await bootI18n(true);

    expect(i18n.language).toBe("en");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("en");
  });

  it("seeds from the browser language when nothing is stored", async () => {
    stubBrowserLanguage("de-DE");

    const i18n = await bootI18n();

    expect(i18n.language).toBe("de");
  });

  it("ignores an unsupported browser language", async () => {
    stubBrowserLanguage("ja-JP");

    const i18n = await bootI18n();

    expect(i18n.language).toBe("en");
  });
});
