import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Phase } from '@/domain/game/roundReducer';
import { formatSeconds } from '@/domain/game/utils';
import { vibrate } from '@/shared/lib/haptics';

const URGENT_THRESHOLD_SECONDS = 15;
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
  const stage = getTimerStage(phase, secondsLeft);
  const isRunning = phase === 'buffer' || phase === 'running';

  useStageHaptics(stage);

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
        <circle className="timer-ring__track" cx="100" cy="100" r={RING_RADIUS} />
        <circle
          className="timer-ring__progress"
          cx="100"
          cy="100"
          r={RING_RADIUS}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 100 100)"
        />
      </svg>
      <span className="timer-ring__readout" aria-live="off">
        {label}
      </span>
    </div>
  );
}
