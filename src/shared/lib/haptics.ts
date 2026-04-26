type HapticPattern = 'tap' | 'success' | 'warning' | 'strong';

const TAP_VIBRATION_MS = 10;
const SUCCESS_VIBRATION_FIRST_MS = 10;
const SUCCESS_VIBRATION_GAP_MS = 40;
const WARNING_VIBRATION_FIRST_MS = 30;
const WARNING_VIBRATION_GAP_MS = 60;
const STRONG_VIBRATION_FIRST_MS = 40;
const STRONG_VIBRATION_GAP_MS = 80;

const SUCCESS_VIBRATION_PATTERN = [
  SUCCESS_VIBRATION_FIRST_MS,
  SUCCESS_VIBRATION_GAP_MS,
  SUCCESS_VIBRATION_FIRST_MS,
];
const WARNING_VIBRATION_PATTERN = [
  WARNING_VIBRATION_FIRST_MS,
  WARNING_VIBRATION_GAP_MS,
  WARNING_VIBRATION_FIRST_MS,
];
const STRONG_VIBRATION_PATTERN = [
  STRONG_VIBRATION_FIRST_MS,
  STRONG_VIBRATION_GAP_MS,
  STRONG_VIBRATION_FIRST_MS,
  STRONG_VIBRATION_GAP_MS,
  STRONG_VIBRATION_GAP_MS,
];

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: TAP_VIBRATION_MS,
  success: SUCCESS_VIBRATION_PATTERN,
  warning: WARNING_VIBRATION_PATTERN,
  strong: STRONG_VIBRATION_PATTERN,
};

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function vibrate(pattern: HapticPattern): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }
  if (prefersReducedMotion()) {
    return;
  }
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    /* some browsers throw on user-gesture-less vibrate — swallow */
  }
}

export type { HapticPattern };
export { vibrate };
