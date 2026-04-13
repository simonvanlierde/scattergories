import { useCallback, useEffect, useRef } from 'react';

type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };

function resolveAudioCtor(): typeof AudioContext | undefined {
  return window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;
}

export function useAudio(isMuted: boolean) {
  const contextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback((): AudioContext | null => {
    const Ctor = resolveAudioCtor();

    if (!Ctor) {
      return null;
    }

    if (!contextRef.current) {
      contextRef.current = new Ctor();
    }

    contextRef.current.resume().catch(() => undefined);
    return contextRef.current;
  }, []);

  const playTick = useCallback(() => {
    if (isMuted) {
      return;
    }

    const context = getContext();

    if (!context) {
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(1200, context.currentTime);
    gain.gain.setValueAtTime(0.03, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.08);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.08);
  }, [getContext, isMuted]);

  const playAlarm = useCallback(() => {
    if (isMuted) {
      return;
    }

    const context = getContext();

    if (!context) {
      return;
    }

    const tones: [number, number, number][] = [
      [0.0, 880, 0.3],
      [0.4, 660, 0.3],
      [0.8, 440, 0.6],
    ];

    for (const [time, frequency, duration] of tones) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(frequency, context.currentTime + time);
      gain.gain.setValueAtTime(0.25, context.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + time + duration);
      oscillator.start(context.currentTime + time);
      oscillator.stop(context.currentTime + time + duration);
    }
  }, [getContext, isMuted]);

  useEffect(
    () => () => {
      contextRef.current?.close().catch(() => undefined);
      contextRef.current = null;
    },
    [],
  );

  return { playTick, playAlarm };
}
