import { describe, expect, it } from "vitest";
import { computeFraction, getTimerStage } from "./TimerRing";

describe("getTimerStage", () => {
  it("is calm well before the deadline", () => {
    expect(getTimerStage("running", 30)).toBe("calm");
  });
  it("becomes urgent at 15s and stays urgent above the critical threshold", () => {
    expect(getTimerStage("running", 15)).toBe("urgent");
    expect(getTimerStage("running", 6)).toBe("urgent");
  });
  it("becomes critical at 5s and below", () => {
    expect(getTimerStage("running", 5)).toBe("critical");
    expect(getTimerStage("running", 1)).toBe("critical");
  });
  it("is done when the phase is done", () => {
    expect(getTimerStage("done", 0)).toBe("done");
  });
  it("is idle before the round starts", () => {
    expect(getTimerStage("idle", 90)).toBe("idle");
  });
});

describe("computeFraction", () => {
  it("winds the ring up over the get-ready seconds, full on the last one", () => {
    expect(computeFraction("buffer", 3, 90, 3)).toBeCloseTo(1 / 3);
    expect(computeFraction("buffer", 2, 90, 3)).toBeCloseTo(2 / 3);
    expect(computeFraction("buffer", 1, 90, 3)).toBe(1);
  });
  it("starts the wind-up from empty while the letter rolls", () => {
    expect(computeFraction("spinning", 0, 90, 3)).toBe(0);
  });
  it("drains the ring while the round runs", () => {
    expect(computeFraction("running", 45, 90, 3)).toBe(0.5);
  });
  it("closes the ring when time is up", () => {
    expect(computeFraction("done", 0, 90, 3)).toBe(1);
  });
});
