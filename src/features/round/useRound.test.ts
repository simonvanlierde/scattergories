import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { FIVE, ONE, ONE_SECOND_MS, TEN, TWENTY, TWO, TWO_SECONDS_MS, ZERO } from '@/test/constants';
import { BUFFER_SECONDS } from '@/test/gameConstants';
import { useAudio } from './useAudio';
import { useLetterRoller } from './useLetterRoller';
import { useRound } from './useRound';

const SHORT_ROUND_SECONDS = FIVE;
const LONG_ROUND_SECONDS = TWENTY;

vi.mock('./useAudio');
vi.mock('./useLetterRoller');

const mockPlayTick = vi.fn();
const mockPlayAlarm = vi.fn();
const mockPlayLetterLand = vi.fn();
const mockSpinTo = vi.fn();
const mockResetRoller = vi.fn();
const mockCancelSpin = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.mocked(useAudio).mockReturnValue({
    playTick: mockPlayTick,
    playAlarm: mockPlayAlarm,
    playLetterLand: mockPlayLetterLand,
  } satisfies ReturnType<typeof useAudio>);
  vi.mocked(useLetterRoller).mockReturnValue({
    letter: '?',
    visible: false,
    landing: false,
    spinTo: mockSpinTo,
    reset: mockResetRoller,
    cancelSpin: mockCancelSpin,
  } satisfies ReturnType<typeof useLetterRoller>);
});

function createRoundDriver(options: Partial<Parameters<typeof useRound>[0]> = {}) {
  let landCallback: (() => void) | undefined;
  mockSpinTo.mockImplementation((_letter: string, callback: () => void) => {
    landCallback = callback;
  });

  const rendered = renderHook(() =>
    useRound({
      gameSeconds: SHORT_ROUND_SECONDS,
      isMuted: false,
      locale: 'en',
      categoryRefreshMode: 'auto',
      ...options,
    }),
  );

  const advanceSeconds = (seconds: number) => {
    for (let elapsed = ZERO; elapsed < seconds; elapsed += ONE) {
      act(() => vi.advanceTimersByTime(ONE_SECOND_MS));
    }
  };

  return {
    get current() {
      return rendered.result.current;
    },
    start() {
      act(() => rendered.result.current.startRound());
    },
    landLetter() {
      if (!landCallback) {
        throw new Error('Expected spinTo to register a landing callback before landing');
      }
      act(() => landCallback?.());
    },
    advanceBuffer() {
      advanceSeconds(BUFFER_SECONDS);
    },
    advanceGame(seconds = options.gameSeconds ?? SHORT_ROUND_SECONDS) {
      advanceSeconds(seconds);
    },
    advanceSeconds,
  };
}

it('starts in idle state', () => {
  const driver = createRoundDriver();

  expect(driver.current.phase).toBe('idle');
});

it('starts a round by spinning a letter', () => {
  const driver = createRoundDriver();

  driver.start();

  expect(driver.current.phase).toBe('spinning');
  expect(mockSpinTo).toHaveBeenCalledOnce();
});

it('moves from landed letter buffer into the running countdown', () => {
  const driver = createRoundDriver();

  driver.start();
  driver.landLetter();

  expect(driver.current.phase).toBe('buffer');
  expect(driver.current.secondsLeft).toBe(BUFFER_SECONDS);

  driver.advanceBuffer();

  expect(driver.current.phase).toBe('running');
  expect(driver.current.secondsLeft).toBe(SHORT_ROUND_SECONDS);
});

it('finishes a running round and plays the alarm', () => {
  const driver = createRoundDriver();

  driver.start();
  driver.landLetter();
  driver.advanceBuffer();
  driver.advanceGame();

  expect(driver.current.phase).toBe('done');
  expect(driver.current.alarmOn).toBe(true);
  expect(mockPlayAlarm).toHaveBeenCalledOnce();
});

it('plays tick sounds during the final 10 running seconds', () => {
  const driver = createRoundDriver({ gameSeconds: LONG_ROUND_SECONDS });

  driver.start();
  driver.landLetter();
  driver.advanceBuffer();

  expect(driver.current.secondsLeft).toBe(LONG_ROUND_SECONDS);
  expect(mockPlayTick).not.toHaveBeenCalled();

  driver.advanceSeconds(TEN);
  expect(driver.current.secondsLeft).toBe(TEN);
  expect(mockPlayTick).toHaveBeenCalledTimes(ONE);

  driver.advanceSeconds(ONE);
  expect(mockPlayTick).toHaveBeenCalledTimes(TWO);
});

it('pauses and resumes without losing countdown time', () => {
  const driver = createRoundDriver();

  driver.start();
  driver.landLetter();
  driver.advanceBuffer();

  act(() => driver.current.togglePause());
  expect(driver.current.isPaused).toBe(true);

  act(() => vi.advanceTimersByTime(TWO_SECONDS_MS));
  expect(driver.current.secondsLeft).toBe(SHORT_ROUND_SECONDS);

  act(() => driver.current.togglePause());
  driver.advanceSeconds(ONE);

  expect(driver.current.isPaused).toBe(false);
  expect(driver.current.secondsLeft).toBe(SHORT_ROUND_SECONDS - ONE);
});

it('uses the plain round-over status when time runs out', () => {
  const driver = createRoundDriver();

  driver.start();
  driver.landLetter();
  driver.advanceBuffer();
  driver.advanceGame();

  expect(driver.current.phase).toBe('done');
  expect(driver.current.statusKey).toBe('timer.roundOver');
});

it('auto mode avoids only the immediately previous letter', () => {
  const driver = createRoundDriver({ categoryRefreshMode: 'auto' });

  driver.start();
  const first = mockSpinTo.mock.calls[0]?.[0];
  driver.landLetter();
  act(() => driver.current.rerollLetter());
  const second = mockSpinTo.mock.calls[1]?.[0];

  expect(second).not.toBe(first);
  expect(driver.current.usedLetters).toEqual([]);
});

it('pinned mode tracks used letters with the non-repeating bag', () => {
  const driver = createRoundDriver({ categoryRefreshMode: 'pinned' });

  driver.start();
  const first = mockSpinTo.mock.calls[0]?.[0];
  driver.landLetter();
  act(() => driver.current.rerollLetter());
  const second = mockSpinTo.mock.calls[1]?.[0];

  expect(second).not.toBe(first);
  expect(driver.current.usedLetters).toEqual([first, second]);
});
