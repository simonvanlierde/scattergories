import { describe, expect, it } from "vitest";
import {
  catCountDefault,
  catCountMax,
  catCountMin,
  categories,
  durationDefault,
  durationMax,
  durationMin,
} from "./constants";

describe("constants integrity", () => {
  it("defines sane numeric bounds and defaults", () => {
    expect(durationMin).toBeLessThanOrEqual(durationDefault);
    expect(durationDefault).toBeLessThanOrEqual(durationMax);

    expect(catCountMin).toBeLessThanOrEqual(catCountDefault);
    expect(catCountDefault).toBeLessThanOrEqual(catCountMax);
  });

  it("has enough default categories for the maximum draw count", () => {
    expect(categories.length).toBeGreaterThanOrEqual(catCountMax);
  });

  it("does not include blank default categories", () => {
    expect(categories.every((category) => category.trim().length > 0)).toBe(true);
  });
});
