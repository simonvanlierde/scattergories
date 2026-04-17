import { useCallback, useEffect, useRef } from 'react';

type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };

// Tick sound (last 10 seconds)
const TICK_FREQ_HZ = 1200;
const TICK_GAIN = 0.03;
const TICK_DECAY_GAIN = 0.001;
const TICK_DURATION_S = 0.08;

// Alarm sound (round over) — three descending tones
const ALARM_GAIN = 0.25;
const ALARM_TONES: [number, number, number][] = [
  [0.0, 880, 0.3],
  [0.4, 660, 0.3],
  [0.8, 440, 0.6],
];

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
    oscillator.frequency.setValueAtTime(TICK_FREQ_HZ, context.currentTime);
    gain.gain.setValueAtTime(TICK_GAIN, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(TICK_DECAY_GAIN, context.currentTime + TICK_DURATION_S);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + TICK_DURATION_S);
  }, [getContext, isMuted]);

  const playAlarm = useCallback(() => {
    if (isMuted) {
      return;
    }

    const context = getContext();

    if (!context) {
      return;
    }

    for (const [time, frequency, duration] of ALARM_TONES) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(frequency, context.currentTime + time);
      gain.gain.setValueAtTime(ALARM_GAIN, context.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(
        TICK_DECAY_GAIN,
        context.currentTime + time + duration,
      );
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
