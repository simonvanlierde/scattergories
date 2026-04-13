import { LETTER_WEIGHTS, LETTERS } from './constants';

export function weightedLetterBag(): string[] {
  return [...LETTERS]
    .map((letter) => ({
      letter,
      score: Math.random() * (LETTER_WEIGHTS[letter] ?? 1),
    }))
    .sort((a, b) => a.score - b.score)
    .map((entry) => entry.letter);
}

export function clampInt(
  value: string | number,
  min: number,
  max: number,
  fallback: number,
): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

export function formatSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`;
}

export function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function shuffleFisherYates<T>(items: readonly T[]): T[] {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}
