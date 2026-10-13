type RandomSource = () => number;

/** How many of the latest letters an "avoid repeats" draw skips. */
export const RECENT_LETTER_WINDOW = 12;

/**
 * Draws one letter with probability proportional to its weight, skipping the
 * letters in `recent` (oldest first). At most the latest `letters.length - 1`
 * are skipped, so a short alphabet always leaves a letter to draw.
 */
export function drawLetter(
  letters: readonly string[],
  weights: Readonly<Record<string, number>>,
  recent: readonly string[],
  random: RandomSource = Math.random,
): string {
  const size = Math.max(0, Math.min(recent.length, letters.length - 1));
  const skipped = new Set(recent.slice(recent.length - size));
  const candidates = letters.filter((letter) => !skipped.has(letter));
  const total = candidates.reduce((sum, letter) => sum + (weights[letter] ?? 1), 0);
  let target = random() * total;
  for (const letter of candidates) {
    target -= weights[letter] ?? 1;
    if (target < 0) {
      return letter;
    }
  }
  // Only reached on float rounding at the top of the range, or all-zero weights.
  return pickRandom(candidates, random);
}

export function clampInt(
  value: string | number,
  min: number,
  max: number,
  fallback: number,
): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

export function formatSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return mins > 0 ? `${mins}:${String(secs).padStart(2, "0")}` : `${secs}s`;
}

export function pickRandom<T>(items: readonly T[], random: RandomSource = Math.random): T {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) {
    throw new Error("pickRandom called on an empty array");
  }
  return item;
}

export function shuffleFisherYates<T>(
  items: readonly T[],
  random: RandomSource = Math.random,
): T[] {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const a = shuffled[i];
    const b = shuffled[j];
    if (a !== undefined && b !== undefined) {
      shuffled[i] = b;
      shuffled[j] = a;
    }
  }

  return shuffled;
}
