import { afterEach, describe, expect, it, vi } from "vitest";
import { safeStorage } from "./safeStorage";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("safeStorage", () => {
  it("reads and writes through to localStorage", () => {
    safeStorage.setItem("k", "v");
    expect(safeStorage.getItem("k")).toBe("v");
  });

  it("returns null instead of throwing when reads are blocked", () => {
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(safeStorage.getItem("k")).toBeNull();
  });

  it("swallows a failed write", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => safeStorage.setItem("k", "v")).not.toThrow();
  });
});
