const STATS_STORAGE_KEY = 'scattergories.stats.v1';
const DATE_SLICE_LENGTH = 10; // YYYY-MM-DD
const ONE_DAY_MS = 86_400_000;

interface LetterMastery {
  seen: number;
}

interface Stats {
  sessionsPlayed: number;
  roundsPlayed: number;
  lastPlayedDate: string | null;
  currentStreakDays: number;
  longestStreakDays: number;
  letters: Record<string, LetterMastery>;
}

interface RoundRecord {
  letter: string;
  playedAt?: Date;
}

function makeEmpty(): Stats {
  return {
    sessionsPlayed: 0,
    roundsPlayed: 0,
    lastPlayedDate: null,
    currentStreakDays: 0,
    longestStreakDays: 0,
    letters: {},
  };
}

function getLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isConsecutiveDay(previous: string | null, today: string): boolean {
  if (!previous) {
    return false;
  }
  const prevDate = new Date(`${previous}T00:00:00`);
  const todayDate = new Date(`${today}T00:00:00`);
  const diff = todayDate.getTime() - prevDate.getTime();
  return diff >= ONE_DAY_MS && diff < 2 * ONE_DAY_MS;
}

function parseStats(raw: string | null): Stats {
  if (!raw) {
    return makeEmpty();
  }
  try {
    const parsed = JSON.parse(raw) as Partial<Stats>;
    const empty = makeEmpty();
    const parsedLetters =
      parsed.letters && typeof parsed.letters === 'object'
        ? (parsed.letters as Record<string, LetterMastery>)
        : empty.letters;
    return {
      sessionsPlayed:
        Number(
          (parsed as Partial<Stats> & { gamesPlayed?: number }).gamesPlayed ??
            parsed.sessionsPlayed,
        ) || empty.sessionsPlayed,
      roundsPlayed: Number(parsed.roundsPlayed) || empty.roundsPlayed,
      lastPlayedDate:
        typeof parsed.lastPlayedDate === 'string' &&
        parsed.lastPlayedDate.length === DATE_SLICE_LENGTH
          ? parsed.lastPlayedDate
          : empty.lastPlayedDate,
      currentStreakDays: Number(parsed.currentStreakDays) || empty.currentStreakDays,
      longestStreakDays: Number(parsed.longestStreakDays) || empty.longestStreakDays,
      letters: Object.fromEntries(
        Object.entries(parsedLetters).map(([letter, mastery]) => [
          letter,
          { seen: Number(mastery?.seen) || 0 },
        ]),
      ),
    };
  } catch {
    return makeEmpty();
  }
}

function readStats(): Stats {
  if (typeof window === 'undefined') {
    return makeEmpty();
  }
  return parseStats(window.localStorage.getItem(STATS_STORAGE_KEY));
}

function writeStats(stats: Stats): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    window.dispatchEvent(new CustomEvent('scattergories:stats-change'));
  } catch {
    /* quota or privacy mode — ignore */
  }
}

function advanceStreak(
  previous: Stats,
  today: string,
): {
  currentStreakDays: number;
  longestStreakDays: number;
} {
  if (previous.lastPlayedDate === today) {
    return {
      currentStreakDays: previous.currentStreakDays,
      longestStreakDays: previous.longestStreakDays,
    };
  }
  const nextStreak = isConsecutiveDay(previous.lastPlayedDate, today)
    ? previous.currentStreakDays + 1
    : 1;
  return {
    currentStreakDays: nextStreak,
    longestStreakDays: Math.max(previous.longestStreakDays, nextStreak),
  };
}

function upsertLetter(
  letters: Record<string, LetterMastery>,
  letter: string,
): Record<string, LetterMastery> {
  const normalized = letter.toUpperCase();
  if (!normalized) {
    return letters;
  }
  const existing = letters[normalized] ?? { seen: 0 };
  return {
    ...letters,
    [normalized]: {
      seen: existing.seen + 1,
    },
  };
}

function projectNextStats(previous: Stats, record: RoundRecord, completedSession: boolean): Stats {
  const today = getLocalDate(record.playedAt ?? new Date());
  const streak = advanceStreak(previous, today);
  const afterRound: Stats = {
    sessionsPlayed: previous.sessionsPlayed,
    roundsPlayed: previous.roundsPlayed + 1,
    lastPlayedDate: today,
    currentStreakDays: streak.currentStreakDays,
    longestStreakDays: streak.longestStreakDays,
    letters: upsertLetter(previous.letters, record.letter),
  };
  if (!completedSession) {
    return afterRound;
  }
  return { ...afterRound, sessionsPlayed: afterRound.sessionsPlayed + 1 };
}

function recordRound(record: RoundRecord, completedSession = false): Stats {
  const next = projectNextStats(readStats(), record, completedSession);
  writeStats(next);
  return next;
}

function recordSessionComplete(): Stats {
  const previous = readStats();
  const next: Stats = { ...previous, sessionsPlayed: previous.sessionsPlayed + 1 };
  writeStats(next);
  return next;
}

function clearStats(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(STATS_STORAGE_KEY);
}

export type { LetterMastery, RoundRecord, Stats };
export {
  clearStats,
  getLocalDate,
  isConsecutiveDay,
  makeEmpty,
  parseStats,
  projectNextStats,
  readStats,
  recordRound,
  recordSessionComplete,
  STATS_STORAGE_KEY,
};
