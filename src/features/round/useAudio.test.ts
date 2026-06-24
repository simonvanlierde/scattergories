import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAudio } from './useAudio';

const ALARM_TONE_COUNT = 3;

function makeAudioContextMock() {
  const oscillatorMock = {
    connect: vi.fn(),
    type: '',
    frequency: { setValueAtTime: vi.fn() },
    start: vi.fn(),
    stop: vi.fn(),
  };
  const gainMock = {
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  };
  const contextMock = {
    currentTime: 0,
    destination: {},
    createOscillator: vi.fn(() => oscillatorMock),
    createGain: vi.fn(() => gainMock),
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
  // Regular function (not arrow) required so it can be used with `new`.
  const audioContextCtor = vi.fn(function makeCtx() {
    return contextMock;
  });
  return { contextMock, oscillatorMock, gainMock, audioContextCtor };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useAudio', () => {
  describe('when muted', () => {
    it('playTick does not create an AudioContext', () => {
      const { audioContextCtor } = makeAudioContextMock();
      vi.stubGlobal('AudioContext', audioContextCtor);

      const { result } = renderHook(() => useAudio(true));
      act(() => {
        result.current.playTick();
      });
      expect(audioContextCtor).not.toHaveBeenCalled();
    });

    it('playAlarm does not create an AudioContext', () => {
      const { audioContextCtor } = makeAudioContextMock();
      vi.stubGlobal('AudioContext', audioContextCtor);

      const { result } = renderHook(() => useAudio(true));
      act(() => {
        result.current.playAlarm();
      });
      expect(audioContextCtor).not.toHaveBeenCalled();
    });
  });

  describe('when not muted', () => {
    it('playTick creates an AudioContext and plays a tone', () => {
      const { contextMock, audioContextCtor } = makeAudioContextMock();
      vi.stubGlobal('AudioContext', audioContextCtor);

      const { result } = renderHook(() => useAudio(false));
      act(() => {
        result.current.playTick();
      });

      expect(contextMock.createOscillator).toHaveBeenCalledOnce();
      expect(contextMock.createGain).toHaveBeenCalledOnce();
    });

    it('playAlarm creates an AudioContext and plays three tones', () => {
      const { contextMock, audioContextCtor } = makeAudioContextMock();
      vi.stubGlobal('AudioContext', audioContextCtor);

      const { result } = renderHook(() => useAudio(false));
      act(() => {
        result.current.playAlarm();
      });

      expect(contextMock.createOscillator).toHaveBeenCalledTimes(ALARM_TONE_COUNT);
      expect(contextMock.createGain).toHaveBeenCalledTimes(ALARM_TONE_COUNT);
    });

    it('reuses the same AudioContext on subsequent calls', () => {
      const { audioContextCtor } = makeAudioContextMock();
      vi.stubGlobal('AudioContext', audioContextCtor);

      const { result } = renderHook(() => useAudio(false));
      act(() => {
        result.current.playTick();
        result.current.playTick();
      });

      expect(audioContextCtor).toHaveBeenCalledOnce();
    });

    it('closes the AudioContext on unmount', () => {
      const { contextMock, audioContextCtor } = makeAudioContextMock();
      vi.stubGlobal('AudioContext', audioContextCtor);

      const { result, unmount } = renderHook(() => useAudio(false));
      act(() => {
        result.current.playTick();
      });
      unmount();

      expect(contextMock.close).toHaveBeenCalledOnce();
    });
  });

  describe('when AudioContext is unavailable', () => {
    it('playTick does not throw', () => {
      vi.stubGlobal('AudioContext', undefined);
      vi.stubGlobal('webkitAudioContext', undefined);

      const { result } = renderHook(() => useAudio(false));
      expect(() => {
        act(() => {
          result.current.playTick();
        });
      }).not.toThrow();
    });
  });
});
