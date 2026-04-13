import { useTranslation } from 'react-i18next';
import type { Phase, StatusKey } from '../game/roundReducer';
import { formatSeconds } from '../game/utils';

const URGENT_THRESHOLD_SECONDS = 15;

interface TimerPanelProps {
  phase: Phase;
  secondsLeft: number;
  isPaused: boolean;
  letter: string;
  letterVisible: boolean;
  letterLanding: boolean;
  roundCount: number;
  totalRounds: number;
  hasMoreRounds: boolean;
  statusKey: StatusKey;
  isMuted: boolean;
  durationInput: string;
  totalRoundsInput: string;
  onStart: () => void;
  onSkip: () => void;
  onReset: () => void;
  onPause: () => void;
  onNewGame: () => void;
  onToggleMute: () => void;
  onDurationChange: (value: string) => void;
  onDurationBlur: () => void;
  onTotalRoundsChange: (value: string) => void;
  onTotalRoundsBlur: () => void;
}

export function TimerPanel(props: TimerPanelProps) {
  const { t } = useTranslation();
  const {
    phase,
    secondsLeft,
    isPaused,
    letter,
    letterVisible,
    letterLanding,
    roundCount,
    totalRounds,
    hasMoreRounds,
    statusKey,
    isMuted,
    durationInput,
    totalRoundsInput,
  } = props;

  const displayRound = Math.min(totalRounds, Math.max(1, roundCount || 1));
  const canEditDuration = phase === 'idle' || phase === 'done';
  const isRunning = phase === 'buffer' || phase === 'running';

  let timerText = '';
  if (phase === 'done') {
    timerText = t('timer.timeUp');
  } else if (isRunning) {
    timerText = formatSeconds(Math.max(0, secondsLeft));
  }

  let timerClassName = 'timer';
  if (phase === 'buffer') {
    timerClassName = 'timer buffer';
  } else if (phase === 'running') {
    const urgent = secondsLeft <= URGENT_THRESHOLD_SECONDS ? ' urgent' : '';
    timerClassName = `timer running${urgent}`;
  } else if (phase === 'done') {
    timerClassName = 'timer done';
  }

  let mainButtonLabel: string;
  if (phase === 'spinning') {
    mainButtonLabel = t('buttons.spinning');
  } else if (roundCount === 0) {
    mainButtonLabel = t('buttons.startRound');
  } else {
    mainButtonLabel = t('buttons.nextRound');
  }
  const pauseButtonLabel = isPaused ? t('buttons.resume') : t('buttons.pause');

  return (
    <section className="timer-section" aria-label="Round timer">
      <p className="round-counter">
        {t('roundCounter', { current: displayRound, total: totalRounds })}
      </p>
      <div className={`letter ${letterVisible ? '' : 'hidden'} ${letterLanding ? 'landing' : ''}`}>
        {letter}
      </div>
      <div className={timerClassName} aria-live="polite">
        {timerText}
      </div>
      <div className={`status${phase === 'done' ? ' done' : ''}`} aria-live="polite">
        {statusKey ? t(statusKey) : ''}
      </div>

      <div className="buttons">
        <button
          id="btn"
          type="button"
          onClick={props.onStart}
          disabled={phase === 'spinning' || !hasMoreRounds}
        >
          {mainButtonLabel}
        </button>
        <button type="button" className="btn-secondary" onClick={props.onSkip}>
          {t('buttons.skipLetter')}
        </button>
        <button
          id="resetBtn"
          type="button"
          className={`btn-secondary ${phase === 'idle' ? 'hidden' : ''}`}
          onClick={props.onReset}
        >
          {t('buttons.reset')}
        </button>
        <button
          type="button"
          className={`btn-secondary ${isRunning ? '' : 'hidden'}`}
          onClick={props.onPause}
        >
          {pauseButtonLabel}
        </button>
        <button type="button" className="btn-secondary new-game-btn" onClick={props.onNewGame}>
          {t('buttons.newGame')}
        </button>
        <button type="button" className="btn-secondary" onClick={props.onToggleMute}>
          {isMuted ? t('buttons.unmute') : t('buttons.mute')}
        </button>
      </div>

      <div className="settings">
        <label htmlFor="duration">{t('settings.duration')}</label>
        <input
          type="number"
          id="duration"
          value={durationInput}
          min={10}
          max={600}
          disabled={!canEditDuration}
          onChange={(event) => props.onDurationChange(event.target.value)}
          onBlur={props.onDurationBlur}
        />
        <span>{t('status.seconds')}</span>

        <label htmlFor="totalRounds">{t('settings.rounds')}</label>
        <input
          type="number"
          id="totalRounds"
          value={totalRoundsInput}
          min={1}
          max={10}
          disabled={!canEditDuration}
          onChange={(event) => props.onTotalRoundsChange(event.target.value)}
          onBlur={props.onTotalRoundsBlur}
        />
      </div>
    </section>
  );
}
