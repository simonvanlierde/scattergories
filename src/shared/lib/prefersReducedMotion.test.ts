import { afterEach, describe, expect, it, vi } from "vitest";
import { prefersReducedMotion } from "./prefersReducedMotion";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("prefersReducedMotion", () => {
  it("returns false when matchMedia is not available", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(prefersReducedMotion()).toBe(false);
  });

  it("reflects the media query result", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    expect(prefersReducedMotion()).toBe(true);
  });
});
