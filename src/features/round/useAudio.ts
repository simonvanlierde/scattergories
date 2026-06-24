import { useCallback, useEffect, useRef } from 'react';

type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };

// Tick sound (last 10 seconds)
const TICK_FREQ_HZ = 1200;
const TICK_GAIN = 0.03;
const TICK_DECAY_GAIN = 0.001;
const TICK_DURATION_S = 0.08;

// Letter-land sound — soft low thud when the letter reveals
const LETTER_LAND_FREQ_HZ = 220;
const LETTER_LAND_GAIN = 0.12;
const LETTER_LAND_DURATION_S = 0.22;

// Alarm sound (round over) — three descending tones
const ALARM_START_1_S = 0.0;
const ALARM_START_2_S = 0.4;
const ALARM_START_3_S = 0.8;
const ALARM_FREQ_1_HZ = 880;
const ALARM_FREQ_2_HZ = 660;
const ALARM_FREQ_3_HZ = 440;
const ALARM_DURATION_1_S = 0.3;
const ALARM_DURATION_2_S = 0.3;
const ALARM_DURATION_3_S = 0.6;
const ALARM_GAIN = 0.25;
const ALARM_TONES: [number, number, number][] = [
  [ALARM_START_1_S, ALARM_FREQ_1_HZ, ALARM_DURATION_1_S],
  [ALARM_START_2_S, ALARM_FREQ_2_HZ, ALARM_DURATION_2_S],
  [ALARM_START_3_S, ALARM_FREQ_3_HZ, ALARM_DURATION_3_S],
];

function resolveAudioCtor(): typeof AudioContext | undefined {
  return window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;
}

function createAudioNode(context: AudioContext, type: OscillatorType, time: number) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.type = type;
  oscillator.start(time);
  return { gain, oscillator };
}

function playTone(
  context: AudioContext,
  tone: {
    type: OscillatorType;
    startTime: number;
    frequency: number;
    duration: number;
    gainValue: number;
    decayGain: number;
  },
) {
  const { gain, oscillator } = createAudioNode(context, tone.type, tone.startTime);
  oscillator.frequency.setValueAtTime(tone.frequency, tone.startTime);
  gain.gain.setValueAtTime(tone.gainValue, tone.startTime);
  gain.gain.exponentialRampToValueAtTime(tone.decayGain, tone.startTime + tone.duration);
  oscillator.stop(tone.startTime + tone.duration);
}

function playTickSound(context: AudioContext) {
  playTone(context, {
    type: 'triangle',
    startTime: context.currentTime,
    frequency: TICK_FREQ_HZ,
    duration: TICK_DURATION_S,
    gainValue: TICK_GAIN,
    decayGain: TICK_DECAY_GAIN,
  });
}

function playLetterLandSound(context: AudioContext) {
  playTone(context, {
    type: 'sine',
    startTime: context.currentTime,
    frequency: LETTER_LAND_FREQ_HZ,
    duration: LETTER_LAND_DURATION_S,
    gainValue: LETTER_LAND_GAIN,
    decayGain: TICK_DECAY_GAIN,
  });
}

function playAlarmSound(context: AudioContext) {
  for (const [time, frequency, duration] of ALARM_TONES) {
    playTone(context, {
      type: 'square',
      startTime: context.currentTime + time,
      frequency,
      duration,
      gainValue: ALARM_GAIN,
      decayGain: TICK_DECAY_GAIN,
    });
  }
}

function useSoundPlayer(
  isMuted: boolean,
  getContext: () => AudioContext | null,
  playFn: (context: AudioContext) => void,
) {
  return useCallback(() => {
    if (isMuted) {
      return;
    }
    const context = getContext();
    if (!context) {
      return;
    }
    playFn(context);
  }, [getContext, isMuted, playFn]);
}

function useAudioContext() {
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

  useEffect(
    () => () => {
      contextRef.current?.close().catch(() => undefined);
      contextRef.current = null;
    },
    [],
  );

  return getContext;
}

export function useAudio(isMuted: boolean) {
  const getContext = useAudioContext();
  const playTick = useSoundPlayer(isMuted, getContext, playTickSound);
  const playAlarm = useSoundPlayer(isMuted, getContext, playAlarmSound);
  const playLetterLand = useSoundPlayer(isMuted, getContext, playLetterLandSound);
  return { playTick, playAlarm, playLetterLand };
}
