import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runRoll } from "./rollAnimation";

/**
 * Controllable requestAnimationFrame: queues frame callbacks so a test can
 * step them forward with chosen timestamps and drive the deceleration logic.
 */
function stubRaf() {
  const queue: FrameRequestCallback[] = [];
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    queue.push(cb);
    return queue.length;
  });
  return {
    step(timestamp: number) {
      const cb = queue.shift();
      if (cb) cb(timestamp);
    },
    get pending() {
      return queue.length;
    },
  };
}

function makeParams(spinId = 1, currentId = 1) {
  return {
    onFlip: vi.fn(),
    onLanded: vi.fn(),
    spinId,
    spinIdRef: { current: currentId },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runRoll", () => {
  let raf: ReturnType<typeof stubRaf>;
  beforeEach(() => {
    raf = stubRaf();
  });

  it("flips while spinning and lands exactly once when progress completes", () => {
    const p = makeParams();
    runRoll(p);

    raf.step(1000); // first frame: sets start, no flip yet (interval not elapsed)
    expect(p.onFlip).not.toHaveBeenCalled();

    raf.step(1100); // interval elapsed -> flip, still spinning
    expect(p.onFlip).toHaveBeenCalledOnce();
    expect(p.onLanded).not.toHaveBeenCalled();

    raf.step(2300); // past SPIN_MS (1200) -> lands, stops scheduling
    expect(p.onLanded).toHaveBeenCalledOnce();
    expect(p.onFlip).toHaveBeenCalledOnce();
    expect(raf.pending).toBe(0);
  });

  it("aborts immediately when the spin id is superseded", () => {
    const p = makeParams(1, 2); // ref no longer matches this spin
    runRoll(p);

    raf.step(0);
    expect(p.onFlip).not.toHaveBeenCalled();
    expect(p.onLanded).not.toHaveBeenCalled();
    expect(raf.pending).toBe(0);
  });

  it("decelerates: waits longer between flips as progress grows", () => {
    const p = makeParams();
    runRoll(p);

    raf.step(1000); // start
    raf.step(1080); // early: 80ms > ~60ms base interval -> flips
    expect(p.onFlip).toHaveBeenCalledTimes(1);

    // Late in the roll the interval widens (~300ms+); an 80ms gap is too small.
    raf.step(1900); // flips (large gap from last flip)
    raf.step(1980); // only 80ms later, near end -> below widened interval, no flip
    expect(p.onFlip).toHaveBeenCalledTimes(2);
  });
});
