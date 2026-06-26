import type { MutableRefObject } from 'react';

/**
 * Shared "rolling" animation core used by both the letter spinner and the
 * category deck roll, so they share an identical speed and duration.
 *
 * The roll flips fast at the start and decelerates (quadratically) toward a
 * 1.8s landing. Each flip calls `onFlip` (the caller decides what to show);
 * the final frame calls `onLanded`.
 */
export const SPIN_MS = 1800;
const BASE_FLIP_INTERVAL_MS = 60;
const FLIP_INTERVAL_SPREAD_MS = 260;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function getFlipInterval(progress: number): number {
  return BASE_FLIP_INTERVAL_MS + progress * progress * FLIP_INTERVAL_SPREAD_MS;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function runRoll(params: {
  onFlip: () => void;
  onLanded: () => void;
  spinId: number;
  spinIdRef: MutableRefObject<number>;
}) {
  let startTimestamp = 0;
  let lastFlipTimestamp = 0;

  function frame(timestamp: number) {
    if (params.spinIdRef.current !== params.spinId) {
      return;
    }

    if (startTimestamp === 0) {
      startTimestamp = timestamp;
      lastFlipTimestamp = timestamp;
    }

    const elapsed = timestamp - startTimestamp;
    const progress = Math.min(elapsed / SPIN_MS, 1);
    const flipInterval = getFlipInterval(progress);

    if (timestamp - lastFlipTimestamp >= flipInterval) {
      lastFlipTimestamp = timestamp;

      if (progress >= 1) {
        params.onLanded();
        return;
      }

      params.onFlip();
      window.requestAnimationFrame(frame);
      return;
    }

    window.requestAnimationFrame(frame);
  }

  window.requestAnimationFrame(frame);
}
