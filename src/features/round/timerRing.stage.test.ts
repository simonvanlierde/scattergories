import { describe, expect, it } from "vitest";
import { getTimerStage } from "./TimerRing";

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
