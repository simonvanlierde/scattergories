import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Phase } from '../game/roundReducer';
import { formatSeconds } from '../game/utils';
import { vibrate } from '../lib/haptics';

const URGENT_THRESHOLD_SECONDS = 15;
const RIPPLE_THRESHOLD_SECONDS = 10;
const RING_RADIUS = 86;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type Stage = 'idle' | 'calm' | 'urgent' | 'done';

interface TimerRingProps {
  phase: Phase;
  secondsLeft: number;
  gameSeconds: number;
}

function joinClassNames(...tokens: (string | false | null | undefined)[]): string {
  return tokens.filter(Boolean).join(' ');
}

function getTimerStage(phase: Phase, secondsLeft: number): Stage {
  if (phase === 'done') {
    return 'done';
  }
  if (phase === 'buffer' || phase === 'running') {
    return secondsLeft <= URGENT_THRESHOLD_SECONDS ? 'urgent' : 'calm';
  }
  return 'idle';
}

function computeFraction(
  phase: Phase,
  isRunning: boolean,
  secondsLeft: number,
  gameSeconds: number,
): number {
  if (isRunning && gameSeconds > 0) {
    return Math.max(0, Math.min(1, secondsLeft / gameSeconds));
  }
  if (phase === 'done') {
    return 0;
  }
  return 1;
}

function useStageHaptics(stage: Stage) {
  const lastStageRef = useRef(stage);

  useEffect(() => {
    if (lastStageRef.current === stage) {
      return;
    }
    if (stage === 'urgent' && lastStageRef.current === 'calm') {
      vibrate('warning');
    } else if (stage === 'done') {
      vibrate('strong');
    }
    lastStageRef.current = stage;
  }, [stage]);
}

function useRippleAt(isRunning: boolean, secondsLeft: number, threshold: number) {
  const lastSecondRef = useRef<number | null>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      lastSecondRef.current = null;
      return;
    }
    const wholeSecond = Math.floor(secondsLeft);
    if (wholeSecond === threshold && lastSecondRef.current !== wholeSecond) {
      lastSecondRef.current = wholeSecond;
      setKey((n) => n + 1);
    }
  }, [isRunning, secondsLeft, threshold]);

  return key;
}

function getLabel(
  t: ReturnType<typeof useTranslation>['t'],
  phase: Phase,
  isRunning: boolean,
  secondsLeft: number,
): string {
  if (phase === 'done') {
    return t('timer.timeUp');
  }
  if (isRunning) {
    return formatSeconds(Math.max(0, secondsLeft));
  }
  return t('timer.ready', { defaultValue: 'Ready' });
}

export function TimerRing({ phase, secondsLeft, gameSeconds }: TimerRingProps) {
  const { t } = useTranslation();
  const gradientId = useId();
  const stage = getTimerStage(phase, secondsLeft);
  const isRunning = phase === 'buffer' || phase === 'running';

  useStageHaptics(stage);
  const rippleKey = useRippleAt(isRunning, secondsLeft, RIPPLE_THRESHOLD_SECONDS);

  const fraction = computeFraction(phase, isRunning, secondsLeft, gameSeconds);
  const dashOffset = RING_CIRCUMFERENCE * (1 - fraction);
  const label = getLabel(t, phase, isRunning, secondsLeft);

  return (
    <div
      className={joinClassNames('timer-ring', `timer-ring--${stage}`)}
      data-testid="round-clock"
      role="timer"
      aria-label={t('round.timerLabel', { defaultValue: 'Round clock' })}
    >
      <svg className="timer-ring__svg" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className="timer-ring__stop-start" />
            <stop offset="100%" className="timer-ring__stop-end" />
          </linearGradient>
        </defs>
        <circle className="timer-ring__track" cx="100" cy="100" r={RING_RADIUS} />
        <circle
          className="timer-ring__progress"
          cx="100"
          cy="100"
          r={RING_RADIUS}
          stroke={`url(#${gradientId})`}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 100 100)"
        />
      </svg>
      {rippleKey > 0 ? (
        <span key={rippleKey} className="timer-ring__ripple" aria-hidden="true" />
      ) : null}
      <span className="timer-ring__readout" aria-live="off">
        {label}
      </span>
    </div>
  );
}
