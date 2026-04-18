import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FIVE,
  FOUR,
  ONE,
  ONE_SECOND_MS,
  TEN,
  TWENTY,
  TWO,
  TWO_SECONDS_MS,
  ZERO,
} from '../test/constants';
import { useAudio } from './useAudio';
import { useLetterRoller } from './useLetterRoller';
import { useRound } from './useRound';

const SHORT_ROUND_SECONDS = FIVE;
const LONG_ROUND_SECONDS = TWENTY;
const BUFFER_TICKS = FIVE;

vi.mock('./useAudio');
vi.mock('./useLetterRoller');

describe('useRound', () => {
  const mockPlayTick = vi.fn();
  const mockPlayAlarm = vi.fn();
  const mockPlayLetterLand = vi.fn();
  const mockPlayToggle = vi.fn();
  const mockSpinTo = vi.fn();
  const mockResetRoller = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    mockPlayTick.mockClear();
    mockPlayAlarm.mockClear();
    mockPlayLetterLand.mockClear();
    mockPlayToggle.mockClear();
    mockSpinTo.mockClear();
    mockResetRoller.mockClear();
    vi.mocked(useAudio).mockReturnValue({
      playTick: mockPlayTick,
      playAlarm: mockPlayAlarm,
      playLetterLand: mockPlayLetterLand,
      playToggle: mockPlayToggle,
    } satisfies ReturnType<typeof useAudio>);
    vi.mocked(useLetterRoller).mockReturnValue({
      letter: '?',
      visible: false,
      landing: false,
      spinTo: mockSpinTo,
      reset: mockResetRoller,
      cancelSpin: vi.fn(),
    } satisfies ReturnType<typeof useLetterRoller>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const defaultOptions = {
    gameSeconds: SHORT_ROUND_SECONDS,
    totalRounds: TWO,
    isMuted: false,
    locale: 'en',
  };

  const advanceBuffer = () => {
    for (let i = 0; i < BUFFER_TICKS; i += 1) {
      act(() => {
        vi.advanceTimersByTime(ONE_SECOND_MS);
      });
    }
  };

  it('starts in idle state', () => {
    const { result } = renderHook(() => useRound(defaultOptions));
    expect(result.current.phase).toBe('idle');
    expect(result.current.roundCount).toBe(ZERO);
  });

  it('transitions idle -> spinning when startRound is called', () => {
    const { result } = renderHook(() => useRound(defaultOptions));
    act(() => {
      result.current.startRound();
    });
    expect(result.current.phase).toBe('spinning');
    expect(result.current.roundCount).toBe(ONE);
    expect(mockSpinTo).toHaveBeenCalled();
  });

  it('transitions spinning -> buffer when letter lands', () => {
    let landCallback: (() => void) | undefined;
    mockSpinTo.mockImplementation((_letter: string, cb: () => void) => {
      landCallback = cb;
    });

    const { result } = renderHook(() => useRound(defaultOptions));
    act(() => {
      result.current.startRound();
    });

    expect(landCallback).toBeDefined();
    act(() => {
      landCallback?.();
    });

    expect(result.current.phase).toBe('buffer');
    expect(result.current.secondsLeft).toBeGreaterThan(ZERO);
  });

  it('transitions buffer -> running after buffer timeout', () => {
    let landCallback: (() => void) | undefined;
    mockSpinTo.mockImplementation((_letter: string, cb: () => void) => {
      landCallback = cb;
    });

    const { result } = renderHook(() => useRound(defaultOptions));
    act(() => {
      result.current.startRound();
    });
    expect(landCallback).toBeDefined();
    act(() => landCallback?.());

    expect(result.current.phase).toBe('buffer');
    expect(result.current.secondsLeft).toBe(SHORT_ROUND_SECONDS);

    // One tick at a time to be safe with fake timers + effects
    advanceBuffer();

    expect(result.current.phase).toBe('running');
    expect(result.current.secondsLeft).toBe(SHORT_ROUND_SECONDS);
  });

  it('transitions running -> done when time expires', () => {
    let landCallback: (() => void) | undefined;
    mockSpinTo.mockImplementation((_letter: string, cb: () => void) => {
      landCallback = cb;
    });

    const { result } = renderHook(() => useRound(defaultOptions));
    act(() => {
      result.current.startRound();
    });
    expect(landCallback).toBeDefined();
    act(() => landCallback?.());

    // Fast forward buffer
    advanceBuffer();

    expect(result.current.phase).toBe('running');

    // Fast forward game duration (5s)
    for (let i = 0; i < SHORT_ROUND_SECONDS; i += 1) {
      act(() => vi.advanceTimersByTime(ONE_SECOND_MS));
    }

    expect(result.current.phase).toBe('done');
    expect(result.current.alarmOn).toBe(true);
    expect(mockPlayAlarm).toHaveBeenCalled();
  });

  it('plays tick sounds during the last 10 seconds of running phase', () => {
    let landCallback: (() => void) | undefined;
    mockSpinTo.mockImplementation((_letter: string, cb: () => void) => {
      landCallback = cb;
    });

    const { result } = renderHook(() =>
      useRound({ ...defaultOptions, gameSeconds: LONG_ROUND_SECONDS }),
    );
    act(() => {
      result.current.startRound();
    });
    expect(landCallback).toBeDefined();
    act(() => landCallback?.());

    // Buffer
    advanceBuffer();

    expect(result.current.secondsLeft).toBe(LONG_ROUND_SECONDS);
    expect(mockPlayTick).not.toHaveBeenCalled();

    // Advance 10 seconds (down to 10)
    for (let i = 0; i < TEN; i += 1) {
      act(() => vi.advanceTimersByTime(ONE_SECOND_MS));
    }

    expect(result.current.secondsLeft).toBe(TEN);
    expect(mockPlayTick).toHaveBeenCalledTimes(ONE);

    // One more tick
    act(() => {
      vi.advanceTimersByTime(ONE_SECOND_MS);
    });
    expect(mockPlayTick).toHaveBeenCalledTimes(TWO);
  });

  it('can pause and resume during running phase', () => {
    let landCallback: (() => void) | undefined;
    mockSpinTo.mockImplementation((_letter: string, cb: () => void) => {
      landCallback = cb;
    });

    const { result } = renderHook(() => useRound(defaultOptions));
    act(() => {
      result.current.startRound();
    });
    expect(landCallback).toBeDefined();
    act(() => landCallback?.());

    // Buffer
    advanceBuffer();

    expect(result.current.phase).toBe('running');
    expect(result.current.secondsLeft).toBe(SHORT_ROUND_SECONDS);

    act(() => {
      result.current.togglePause();
    });
    expect(result.current.isPaused).toBe(true);

    act(() => {
      vi.advanceTimersByTime(TWO_SECONDS_MS);
    });
    expect(result.current.secondsLeft).toBe(SHORT_ROUND_SECONDS); // should not have changed

    act(() => {
      result.current.togglePause();
    });
    expect(result.current.isPaused).toBe(false);

    act(() => {
      vi.advanceTimersByTime(ONE_SECOND_MS);
    });
    expect(result.current.secondsLeft).toBe(FOUR);
  });

  it('transitions to game-complete status when the last round finishes', () => {
    let landCallback: (() => void) | undefined;
    mockSpinTo.mockImplementation((_letter: string, cb: () => void) => {
      landCallback = cb;
    });

    // totalRounds: 1
    const { result } = renderHook(() => useRound({ ...defaultOptions, totalRounds: ONE }));

    act(() => {
      result.current.startRound();
    });
    expect(landCallback).toBeDefined();
    act(() => landCallback?.());

    // Buffer
    advanceBuffer();

    // Game (5s)
    for (let i = 0; i < SHORT_ROUND_SECONDS; i += 1) {
      act(() => vi.advanceTimersByTime(ONE_SECOND_MS));
    }

    expect(result.current.phase).toBe('done');
    expect(result.current.statusKey).toBe('timer.gameCompleteRound');
  });

  it('resets correctly', () => {
    const { result } = renderHook(() => useRound(defaultOptions));
    act(() => {
      result.current.startRound();
    });
    expect(result.current.phase).toBe('spinning');

    act(() => {
      result.current.resetRound();
    });

    expect(result.current.phase).toBe('idle');
    expect(mockResetRoller).toHaveBeenCalled();
  });
});
