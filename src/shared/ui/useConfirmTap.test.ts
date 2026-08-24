import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useConfirmTap } from "./useConfirmTap";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it("fires only on the second tap and disarms after the timeout", () => {
  const action = vi.fn();
  const { result } = renderHook(() => useConfirmTap(action));

  act(() => result.current.onClick());
  expect(result.current.armed).toBe(true);
  expect(action).not.toHaveBeenCalled();

  act(() => vi.advanceTimersByTime(3000));
  expect(result.current.armed).toBe(false);

  act(() => result.current.onClick());
  act(() => result.current.onClick());
  expect(action).toHaveBeenCalledTimes(1);
  expect(result.current.armed).toBe(false);
});
