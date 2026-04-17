import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAudio } from './useAudio';
import { useLetterRoller } from './useLetterRoller';
import { useRound } from './useRound';

vi.mock('./useAudio');
vi.mock('./useLetterRoller');

describe('useRound', () => {
  const mockPlayTick = vi.fn();
  const mockPlayAlarm = vi.fn();
  const mockSpinTo = vi.fn();
  const mockResetRoller = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(useAudio).mockReturnValue({
      playTick: mockPlayTick,
      playAlarm: mockPlayAlarm,
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
    gameSeconds: 5,
    totalRounds: 2,
    isMuted: false,
    locale: 'en',
  };

  it('starts in idle state', () => {
    const { result } = renderHook(() => useRound(defaultOptions));
    expect(result.current.phase).toBe('idle');
    expect(result.current.roundCount).toBe(0);
  });

  it('transitions idle -> spinning when startRound is called', () => {
    const { result } = renderHook(() => useRound(defaultOptions));
    act(() => {
      result.current.startRound();
    });
    expect(result.current.phase).toBe('spinning');
    expect(result.current.roundCount).toBe(1);
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
    expect(result.current.secondsLeft).toBeGreaterThan(0);
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
    expect(result.current.secondsLeft).toBe(3);

    // One tick at a time to be safe with fake timers + effects
    for (let i = 0; i < 3; i++) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }

    expect(result.current.phase).toBe('running');
    expect(result.current.secondsLeft).toBe(5);
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
    for (let i = 0; i < 3; i++) {
      act(() => vi.advanceTimersByTime(1000));
    }

    expect(result.current.phase).toBe('running');

    // Fast forward game duration (5s)
    for (let i = 0; i < 5; i++) {
      act(() => vi.advanceTimersByTime(1000));
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

    const { result } = renderHook(() => useRound({ ...defaultOptions, gameSeconds: 20 }));
    act(() => {
      result.current.startRound();
    });
    expect(landCallback).toBeDefined();
    act(() => landCallback?.());

    // Buffer
    for (let i = 0; i < 3; i++) {
      act(() => vi.advanceTimersByTime(1000));
    }

    expect(result.current.secondsLeft).toBe(20);
    expect(mockPlayTick).not.toHaveBeenCalled();

    // Advance 10 seconds (down to 10)
    for (let i = 0; i < 10; i++) {
      act(() => vi.advanceTimersByTime(1000));
    }

    expect(result.current.secondsLeft).toBe(10);
    expect(mockPlayTick).toHaveBeenCalledTimes(1);

    // One more tick
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockPlayTick).toHaveBeenCalledTimes(2);
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
    for (let i = 0; i < 3; i++) {
      act(() => vi.advanceTimersByTime(1000));
    }

    expect(result.current.phase).toBe('running');
    expect(result.current.secondsLeft).toBe(5);

    act(() => {
      result.current.togglePause();
    });
    expect(result.current.isPaused).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.secondsLeft).toBe(5); // should not have changed

    act(() => {
      result.current.togglePause();
    });
    expect(result.current.isPaused).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.secondsLeft).toBe(4);
  });

  it('transitions to game-complete status when the last round finishes', () => {
    let landCallback: (() => void) | undefined;
    mockSpinTo.mockImplementation((_letter: string, cb: () => void) => {
      landCallback = cb;
    });

    // totalRounds: 1
    const { result } = renderHook(() => useRound({ ...defaultOptions, totalRounds: 1 }));

    act(() => {
      result.current.startRound();
    });
    expect(landCallback).toBeDefined();
    act(() => landCallback?.());

    // Buffer
    for (let i = 0; i < 3; i++) {
      act(() => vi.advanceTimersByTime(1000));
    }

    // Game (5s)
    for (let i = 0; i < 5; i++) {
      act(() => vi.advanceTimersByTime(1000));
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
