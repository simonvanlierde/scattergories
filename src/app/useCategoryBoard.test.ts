import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCategoryBoard } from "./useCategoryBoard";

// Keep prefersReducedMotion (false by default via setupTests matchMedia), but
// make runRoll synchronous so the animated path runs to its landing frame.
vi.mock("@/features/round/rollAnimation", async (importActual) => {
  const actual = await importActual<typeof import("@/features/round/rollAnimation")>();
  return {
    ...actual,
    runRoll: vi.fn((p: { onFlip: () => void; onLanded: () => void }) => {
      p.onFlip();
      p.onLanded();
    }),
  };
});

// Stable references: redrawCategories memoizes on these, and its mount effect
// depends on that callback — fresh array literals per render would loop forever.
const BUILTINS = ["a", "b", "c", "d", "e", "f"];
const NO_CUSTOM: string[] = [];
const NO_PINS: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useCategoryBoard", () => {
  it("composes the deck on mount", () => {
    const { result } = renderHook(() =>
      useCategoryBoard({
        customCategories: NO_CUSTOM,
        deckBuiltins: BUILTINS,
        pinned: NO_PINS,
        count: 3,
      }),
    );
    expect(result.current.drawnCategories).toHaveLength(3);
  });

  it("defers the compose while a round is in progress", () => {
    const deferComposeRef = { current: true };
    const { result } = renderHook(() =>
      useCategoryBoard({
        customCategories: NO_CUSTOM,
        deckBuiltins: BUILTINS,
        pinned: NO_PINS,
        count: 3,
        deferComposeRef,
      }),
    );
    expect(result.current.drawnCategories).toEqual([]);
  });

  it("lands on the final deck after an animated redraw", () => {
    const { result } = renderHook(() =>
      useCategoryBoard({
        customCategories: NO_CUSTOM,
        deckBuiltins: BUILTINS,
        pinned: NO_PINS,
        count: 3,
      }),
    );

    act(() => {
      result.current.redrawCategories(true);
    });

    expect(result.current.landing).toBe(true);
    expect(result.current.drawnCategories).toHaveLength(3);
    expect(result.current.drawnCategories.every((name) => BUILTINS.includes(name))).toBe(true);
  });
});
