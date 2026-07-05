import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Phase } from '@/domain/game/roundReducer';
import { formatSeconds } from '@/domain/game/utils';
import { vibrate } from '@/shared/lib/haptics';
import { cx } from '@/shared/ui/cx';

const URGENT_THRESHOLD_SECONDS = 15;
const CRITICAL_THRESHOLD_SECONDS = 5;
const RING_RADIUS = 86;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type Stage = 'idle' | 'getready' | 'calm' | 'urgent' | 'critical' | 'done';

interface TimerRingProps {
  phase: Phase;
  isPaused: boolean;
  secondsLeft: number;
  gameSeconds: number;
}

function getTimerStage(phase: Phase, secondsLeft: number): Stage {
  if (phase === 'done') {
    return 'done';
  }
  // The get-ready/buffer phase is its own calm stage — never the urgency colors,
  // even though its countdown is only a few seconds.
  if (phase === 'buffer') {
    return 'getready';
  }
  if (phase === 'running') {
    if (secondsLeft <= CRITICAL_THRESHOLD_SECONDS) {
      return 'critical';
    }
    return secondsLeft <= URGENT_THRESHOLD_SECONDS ? 'urgent' : 'calm';
  }
  return 'idle';
}

function computeFraction(phase: Phase, secondsLeft: number, gameSeconds: number): number {
  // Only the live round drains the ring; get-ready shows a full, calm ring.
  if (phase === 'running' && gameSeconds > 0) {
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
    } else if (stage === 'critical') {
      vibrate('warning');
    } else if (stage === 'done') {
      vibrate('strong');
    }
    lastStageRef.current = stage;
  }, [stage]);
}

function getLabel(
  t: ReturnType<typeof useTranslation>['t'],
  o: { phase: Phase; isRunning: boolean; isPaused: boolean; secondsLeft: number },
): string {
  if (o.phase === 'done') {
    return t('timer.timeUp');
  }
  if (o.isRunning && o.isPaused) {
    return t('timer.paused');
  }
  if (o.phase === 'buffer') {
    return t('timer.startIn', {
      seconds: Math.max(0, o.secondsLeft),
    });
  }
  if (o.phase === 'running') {
    return formatSeconds(Math.max(0, o.secondsLeft));
  }
  if (o.phase === 'spinning') {
    return t('timer.getReady');
  }
  return t('timer.ready');
}

function TimerRing({ phase, isPaused, secondsLeft, gameSeconds }: TimerRingProps) {
  const { t } = useTranslation();
  const stage = getTimerStage(phase, secondsLeft);
  const isRunning = phase === 'buffer' || phase === 'running';

  useStageHaptics(stage);

  const fraction = computeFraction(phase, secondsLeft, gameSeconds);
  const dashOffset = RING_CIRCUMFERENCE * (1 - fraction);
  const label = getLabel(t, { phase, isRunning, isPaused, secondsLeft });

  return (
    <div
      className={cx(
        'timer-ring',
        `timer-ring--${stage}`,
        isRunning && isPaused && 'timer-ring--paused',
      )}
      data-testid="round-clock"
      role="timer"
      aria-label={t('round.timerLabel')}
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

export { getTimerStage, TimerRing };
