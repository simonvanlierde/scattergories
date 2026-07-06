import { afterEach, describe, expect, it, vi } from "vitest";
import { vibrate } from "./haptics";

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduce && query === "(prefers-reduced-motion: reduce)",
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("vibrate", () => {
  it("does nothing when navigator.vibrate is unavailable", () => {
    vi.stubGlobal("navigator", {}); // no vibrate function
    expect(() => vibrate("warning")).not.toThrow();
  });

  it("skips vibration when reduced motion is preferred", () => {
    const spy = vi.fn();
    vi.stubGlobal("navigator", { vibrate: spy });
    stubReducedMotion(true);

    vibrate("strong");
    expect(spy).not.toHaveBeenCalled();
  });

  it("fires the pattern for the given kind when motion is allowed", () => {
    const spy = vi.fn();
    vi.stubGlobal("navigator", { vibrate: spy });
    stubReducedMotion(false);

    vibrate("warning");
    expect(spy).toHaveBeenCalledWith([30, 60, 30]);
  });

  it("swallows errors thrown by navigator.vibrate", () => {
    vi.stubGlobal("navigator", {
      vibrate: () => {
        throw new Error("no user gesture");
      },
    });
    stubReducedMotion(false);

    expect(() => vibrate("strong")).not.toThrow();
  });
});
