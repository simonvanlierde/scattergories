import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { getLocaleLetters } from '@/i18n/localeRegistry';
import { ONE_SECOND_MS, TWO_SECONDS_MS } from '@/test/constants';
import { BUFFER_SECONDS } from '@/test/gameConstants';
import { useAudio } from './useAudio';
import { useLetterRoller } from './useLetterRoller';
import { useRound } from './useRound';

const SHORT_ROUND_SECONDS = 5;
const LONG_ROUND_SECONDS = 20;
const PARTIAL_SECOND_MS = 400;
const REMAINDER_MS = ONE_SECOND_MS - PARTIAL_SECOND_MS;
const PAUSED_WAIT_MS = 5000;

vi.mock('./useAudio');
vi.mock('./useLetterRoller');

const mockPlayTick = vi.fn();
const mockPlayAlarm = vi.fn();
const mockPlayLetterLand = vi.fn();
const mockSpinTo = vi.fn();
const mockResetRoller = vi.fn();

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
      bufferSeconds: BUFFER_SECONDS,
      isMuted: false,
      locale: 'en',
      ...options,
    }),
  );

  const advanceSeconds = (seconds: number) => {
    for (let elapsed = 0; elapsed < seconds; elapsed += 1) {
      act(() => vi.advanceTimersByTime(ONE_SECOND_MS));
    }
  };

  return {
    get current() {
      return rendered.result.current;
    },
    start() {
      act(() => rendered.result.current.primaryAction());
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

  driver.advanceSeconds(10);
  expect(driver.current.secondsLeft).toBe(10);
  expect(mockPlayTick).toHaveBeenCalledTimes(1);

  driver.advanceSeconds(1);
  expect(mockPlayTick).toHaveBeenCalledTimes(2);
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
  driver.advanceSeconds(1);

  expect(driver.current.isPaused).toBe(false);
  expect(driver.current.secondsLeft).toBe(SHORT_ROUND_SECONDS - 1);
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

it('draws letters from a non-repeating bag and tracks used letters', () => {
  const driver = createRoundDriver();

  driver.start();
  const first = mockSpinTo.mock.calls[0]?.[0];
  driver.landLetter();
  act(() => driver.current.nextRound());
  const second = mockSpinTo.mock.calls[1]?.[0];

  expect(second).not.toBe(first);
  expect(driver.current.usedLetters).toEqual([first, second]);
});

it('new letter rerolls and auto-starts the get-ready buffer', () => {
  const driver = createRoundDriver();

  driver.start();
  driver.landLetter();
  // From buffer, reroll the letter — should re-spin then auto-start the buffer.
  act(() => driver.current.newLetter());
  expect(driver.current.phase).toBe('spinning');
  driver.landLetter();
  expect(driver.current.phase).toBe('buffer');
  expect(driver.current.secondsLeft).toBe(BUFFER_SECONDS);
});

it('keeps sub-second progress across a pause/resume', () => {
  const driver = createRoundDriver();

  driver.start();
  driver.landLetter();
  driver.advanceBuffer();
  expect(driver.current.secondsLeft).toBe(SHORT_ROUND_SECONDS);

  // Part-way into the current second, then pause and wait a while.
  act(() => vi.advanceTimersByTime(PARTIAL_SECOND_MS));
  expect(driver.current.secondsLeft).toBe(SHORT_ROUND_SECONDS);
  act(() => driver.current.togglePause());
  act(() => vi.advanceTimersByTime(PAUSED_WAIT_MS));

  // Resuming needs only the leftover of that second — not a fresh full second.
  act(() => driver.current.togglePause());
  act(() => vi.advanceTimersByTime(REMAINDER_MS - 1));
  expect(driver.current.secondsLeft).toBe(SHORT_ROUND_SECONDS);
  act(() => vi.advanceTimersByTime(1));
  expect(driver.current.secondsLeft).toBe(SHORT_ROUND_SECONDS - 1);
});

it('rebuilds the letter bag for the new alphabet when the locale changes', () => {
  let landCallback: (() => void) | undefined;
  mockSpinTo.mockImplementation((_letter: string, callback: () => void) => {
    landCallback = callback;
  });
  const { result, rerender } = renderHook(
    (props: Parameters<typeof useRound>[0]) => useRound(props),
    {
      initialProps: {
        gameSeconds: SHORT_ROUND_SECONDS,
        bufferSeconds: BUFFER_SECONDS,
        isMuted: false,
        locale: 'en',
      },
    },
  );

  act(() => result.current.nextRound());
  const enLetter = mockSpinTo.mock.calls[0]?.[0];
  expect(getLocaleLetters('en')).toContain(enLetter);
  act(() => landCallback?.());
  expect(result.current.usedLetters).toEqual([enLetter]);

  rerender({
    gameSeconds: SHORT_ROUND_SECONDS,
    bufferSeconds: BUFFER_SECONDS,
    isMuted: false,
    locale: 'el',
  });
  // The switch clears the old-alphabet draw history and rebuilds the bag.
  expect(result.current.usedLetters).toEqual([]);

  act(() => result.current.nextRound());
  const elLetter = mockSpinTo.mock.calls[1]?.[0];
  expect(getLocaleLetters('el')).toContain(elLetter);
  expect(getLocaleLetters('en')).not.toContain(elLetter);
});
