import type { Stats } from './stats';

const ACHIEVEMENTS_STORAGE_KEY = 'scattergories.achievements.v1';
const WEEK_WARRIOR_DAYS = 7;
const ALPHABET_HUNTER_LETTERS = 26;
const VETERAN_GAMES = 25;

interface RoundContext {
  isSessionComplete: boolean;
}

interface Achievement {
  id: string;
  labelKey: string;
  fallbackLabel: string;
  descriptionKey: string;
  fallbackDescription: string;
  predicate: (stats: Stats, round: RoundContext) => boolean;
}

const ACHIEVEMENTS: readonly Achievement[] = Object.freeze([
  {
    id: 'first-round',
    labelKey: 'achievements.firstRound.label',
    fallbackLabel: 'First round',
    descriptionKey: 'achievements.firstRound.description',
    fallbackDescription: 'Played your very first round.',
    predicate: (stats) => stats.roundsPlayed >= 1,
  },
  {
    id: 'full-sweep',
    labelKey: 'achievements.fullSweep.label',
    fallbackLabel: 'Session finisher',
    descriptionKey: 'achievements.fullSweep.description',
    fallbackDescription: 'Finished a full session.',
    predicate: (_stats, round) => round.isSessionComplete,
  },
  {
    id: 'week-warrior',
    labelKey: 'achievements.weekWarrior.label',
    fallbackLabel: 'Week warrior',
    descriptionKey: 'achievements.weekWarrior.description',
    fallbackDescription: 'Played on 7 consecutive days.',
    predicate: (stats) => stats.currentStreakDays >= WEEK_WARRIOR_DAYS,
  },
  {
    id: 'alphabet-hunter',
    labelKey: 'achievements.alphabetHunter.label',
    fallbackLabel: 'Alphabet hunter',
    descriptionKey: 'achievements.alphabetHunter.description',
    fallbackDescription: 'Seen all 26 letters at least once.',
    predicate: (stats) => Object.keys(stats.letters).length >= ALPHABET_HUNTER_LETTERS,
  },
  {
    id: 'veteran',
    labelKey: 'achievements.veteran.label',
    fallbackLabel: 'Veteran',
    descriptionKey: 'achievements.veteran.description',
    fallbackDescription: 'Completed 25 sessions.',
    predicate: (stats) => stats.sessionsPlayed >= VETERAN_GAMES,
  },
]);

function readUnlocked(): Set<string> {
  if (typeof window === 'undefined') {
    return new Set();
  }
  try {
    const raw = window.localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    return new Set(parsed.filter((value): value is string => typeof value === 'string'));
  } catch {
    return new Set();
  }
}

function writeUnlocked(unlocked: Set<string>): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(Array.from(unlocked)));
  } catch {
    /* quota or privacy mode — ignore */
  }
}

function evaluateAchievements(stats: Stats, round: RoundContext): string[] {
  return ACHIEVEMENTS.filter((achievement) => achievement.predicate(stats, round)).map(
    (achievement) => achievement.id,
  );
}

function findNewlyUnlocked(
  stats: Stats,
  round: RoundContext,
  previouslyUnlocked: Set<string>,
): string[] {
  return evaluateAchievements(stats, round).filter((id) => !previouslyUnlocked.has(id));
}

function recordNewlyUnlocked(stats: Stats, round: RoundContext): string[] {
  const previouslyUnlocked = readUnlocked();
  const newlyUnlocked = findNewlyUnlocked(stats, round, previouslyUnlocked);
  if (newlyUnlocked.length === 0) {
    return [];
  }
  for (const id of newlyUnlocked) {
    previouslyUnlocked.add(id);
  }
  writeUnlocked(previouslyUnlocked);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('scattergories:achievements-change'));
  }
  return newlyUnlocked;
}

function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id);
}

function clearAchievements(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(ACHIEVEMENTS_STORAGE_KEY);
}

export type { Achievement, RoundContext };
export {
  ACHIEVEMENTS,
  ACHIEVEMENTS_STORAGE_KEY,
  clearAchievements,
  evaluateAchievements,
  findNewlyUnlocked,
  getAchievementById,
  readUnlocked,
  recordNewlyUnlocked,
  writeUnlocked,
};
