import { FALLBACK_LOCALE, getLocaleLetters, normalizeLocale } from '@/i18n/localeRegistry';
import { getLocaleLetterWeights } from './localeWeights';

type RandomSource = () => number;

export function weightedLetterBag(
  locale: string = FALLBACK_LOCALE,
  random: RandomSource = Math.random,
): string[] {
  const normalizedLocale = normalizeLocale(locale);
  const letterWeights = getLocaleLetterWeights(normalizedLocale);
  const letters = getLocaleLetters(normalizedLocale);
  return [...letters]
    .map((letter) => ({
      letter,
      score: random() * (letterWeights[letter] ?? 1),
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

export function pickRandom<T>(items: readonly T[], random: RandomSource = Math.random): T {
  return items[Math.floor(random() * items.length)];
}

export function shuffleFisherYates<T>(
  items: readonly T[],
  random: RandomSource = Math.random,
): T[] {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}
