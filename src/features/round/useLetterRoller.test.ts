import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLetterRoller } from "./useLetterRoller";

const SPIN_PAST_LANDING_MS = 2000;
const FRAME_STEP_MS = 100;

/** matchMedia stub; `reduce` decides whether reduced motion reports as active. */
function stubMotionPreference(reduce: boolean) {
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

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useLetterRoller", () => {
  it('starts with letter "?", not visible, not landing', () => {
    const { result } = renderHook(() => useLetterRoller("en"));
    expect(result.current.letter).toBe("?");
    expect(result.current.visible).toBe(false);
    expect(result.current.landing).toBe(false);
  });

  it("reset returns to initial state after a snap spin", () => {
    // Use reduced-motion so spinTo snaps synchronously and does not loop rAF.
    stubMotionPreference(true);

    const { result } = renderHook(() => useLetterRoller("en"));
    act(() => {
      result.current.spinTo("A", vi.fn());
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.letter).toBe("?");
    expect(result.current.visible).toBe(false);
    expect(result.current.landing).toBe(false);
  });

  it("does not land an in-flight roll after unmount", () => {
    // stubGlobal survives restoreAllMocks, so re-assert full motion for this case.
    stubMotionPreference(false);
    // Queue frames instead of running them, so the roll is mid-flight at unmount.
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    });

    const onLanded = vi.fn();
    const { result, unmount } = renderHook(() => useLetterRoller("en"));
    act(() => {
      result.current.spinTo("A", onLanded);
    });
    unmount();

    // Drive the queued frames past the landing point.
    for (let timestamp = 0; timestamp <= SPIN_PAST_LANDING_MS; timestamp += FRAME_STEP_MS) {
      const frame = frames.shift();
      if (!frame) {
        break;
      }
      frame(timestamp);
    }

    expect(onLanded).not.toHaveBeenCalled();
  });

  describe("spinTo with prefers-reduced-motion", () => {
    it("snaps to final letter immediately when reduce is set", () => {
      stubMotionPreference(true);

      const onLanded = vi.fn();
      const { result } = renderHook(() => useLetterRoller("en"));

      act(() => {
        result.current.spinTo("Z", onLanded);
      });

      expect(result.current.letter).toBe("Z");
      expect(result.current.landing).toBe(true);
      expect(result.current.visible).toBe(true);
      expect(onLanded).toHaveBeenCalledOnce();
    });

    it("sets letter and visible immediately when motion is not reduced", () => {
      // matchMedia returns matches: false by default (from setupTests).
      const { result } = renderHook(() => useLetterRoller("en"));

      act(() => {
        result.current.spinTo("M", vi.fn());
      });

      expect(result.current.letter).toBe("M");
      expect(result.current.visible).toBe(true);
    });
  });
});
