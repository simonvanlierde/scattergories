import { beforeEach, describe, expect, it } from 'vitest';
import { makeEmpty, parseStats, projectNextStats, STATS_STORAGE_KEY } from './stats';

const LETTER_A = 'A';
const LETTER_M = 'M';

beforeEach(() => {
  window.localStorage.clear();
});

describe('stats', () => {
  it('does not expose or carry old session counts', () => {
    const parsed = parseStats(
      JSON.stringify({
        sessionsPlayed: 12,
        roundsPlayed: 4,
        letters: { [LETTER_A]: { seen: 2 } },
      }),
    );

    expect(parsed).toEqual({
      ...makeEmpty(),
      roundsPlayed: 4,
      letters: { [LETTER_A]: { seen: 2 } },
    });
    expect('sessionsPlayed' in parsed).toBe(false);
  });

  it('records completed rounds, streak dates, and letters', () => {
    const next = projectNextStats(makeEmpty(), {
      letter: 'm',
      playedAt: new Date('2026-04-26T12:00:00'),
    });

    expect(next.roundsPlayed).toBe(1);
    expect(next.lastPlayedDate).toBe('2026-04-26');
    expect(next.currentStreakDays).toBe(1);
    expect(next.longestStreakDays).toBe(1);
    expect(next.letters).toEqual({ [LETTER_M]: { seen: 1 } });
    expect(window.localStorage.getItem(STATS_STORAGE_KEY)).toBeNull();
  });
});
