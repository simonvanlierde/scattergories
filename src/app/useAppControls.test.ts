import { act, renderHook, waitFor } from "@testing-library/react";
import type { i18n as I18nInstance } from "i18next";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ensureLanguageLoaded, persistLanguage } from "@/i18n/config";
import { useAppControls } from "./useAppControls";

vi.mock("@/i18n/config", () => ({
  ensureLanguageLoaded: vi.fn(),
  persistLanguage: vi.fn(),
}));

function makeI18n() {
  return { changeLanguage: vi.fn().mockResolvedValue(undefined) } as unknown as I18nInstance;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.mocked(ensureLanguageLoaded).mockReset();
  vi.mocked(persistLanguage).mockReset();
});

describe("useAppControls", () => {
  it("flags a chunk error when vite fires a preloadError", () => {
    const { result } = renderHook(() => useAppControls({ i18n: makeI18n() }));
    expect(result.current.hasChunkError).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("vite:preloadError"));
    });
    expect(result.current.hasChunkError).toBe(true);
  });

  it("resolves and persists the language on a successful switch", async () => {
    vi.mocked(ensureLanguageLoaded).mockResolvedValue("fr");
    const i18n = makeI18n();
    const { result } = renderHook(() => useAppControls({ i18n }));

    act(() => {
      result.current.handleLanguageChange("fr");
    });
    expect(result.current.isLanguagePending).toBe(true);

    await waitFor(() => expect(result.current.isLanguagePending).toBe(false));
    expect(i18n.changeLanguage).toHaveBeenCalledWith("fr");
    expect(persistLanguage).toHaveBeenCalledWith("fr");
    expect(result.current.hasChunkError).toBe(false);
  });

  it("flags a chunk error when loading the language fails", async () => {
    vi.mocked(ensureLanguageLoaded).mockRejectedValue(new Error("chunk 404"));
    const { result } = renderHook(() => useAppControls({ i18n: makeI18n() }));

    act(() => {
      result.current.handleLanguageChange("de");
    });

    await waitFor(() => expect(result.current.hasChunkError).toBe(true));
    expect(result.current.isLanguagePending).toBe(false);
  });
});
