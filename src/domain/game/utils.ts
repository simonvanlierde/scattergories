type RandomSource = () => number;

export function clampInt(value: string | number, min: number, max: number, fallback: number): number {
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

export function shuffleFisherYates<T>(items: readonly T[], random: RandomSource = Math.random): T[] {
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
