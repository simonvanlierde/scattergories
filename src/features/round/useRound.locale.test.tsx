import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useRound } from "./useRound";

it("finishes the real letter roll when the language changes before landing", () => {
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.push(callback);
    return frames.length;
  });
  const { result, rerender } = renderHook(
    ({ locale }) => useRound({ locale, gameSeconds: 90, bufferSeconds: 3, isMuted: true }),
    { initialProps: { locale: "en" } },
  );

  act(() => result.current.primaryAction());
  expect(result.current.phase).toBe("spinning");
  rerender({ locale: "nl" });
  for (let timestamp = 0; timestamp <= 2000; timestamp += 100) {
    const frame = frames.shift();
    if (!frame) break;
    act(() => frame(timestamp));
  }

  expect(result.current.phase).toBe("buffer");
  expect(result.current.letterVisible).toBe(true);
  expect(result.current.letter).not.toBe("?");
});
