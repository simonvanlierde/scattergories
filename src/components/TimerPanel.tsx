import { useTranslation } from 'react-i18next';
import { DURATION_MAX, DURATION_MIN, ROUNDS_MAX, ROUNDS_MIN } from '../game/constants';
import type { Phase, StatusKey } from '../game/roundReducer';
import { formatSeconds } from '../game/utils';

const URGENT_THRESHOLD_SECONDS = 15;

interface TimerRoundState {
  phase: Phase;
  secondsLeft: number;
  isPaused: boolean;
  letter: string;
  letterVisible: boolean;
  letterLanding: boolean;
  roundCount: number;
  hasMoreRounds: boolean;
  statusKey: StatusKey;
}

interface TimerSettings {
  isMuted: boolean;
  durationInput: string;
  totalRoundsInput: string;
  totalRounds: number;
}

interface TimerActions {
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

interface TimerPanelProps {
  round: TimerRoundState;
  settings: TimerSettings;
  actions: TimerActions;
}

function TimerPanel({ round, settings, actions }: TimerPanelProps) {
  const { t } = useTranslation();
  const {
    phase,
    secondsLeft,
    isPaused,
    letter,
    letterVisible,
    letterLanding,
    roundCount,
    hasMoreRounds,
    statusKey,
  } = round;
  const { isMuted, durationInput, totalRoundsInput, totalRounds } = settings;

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
  const skipButtonTooltip = t('buttons.skipLetterTooltip');
  const resetButtonTooltip = t('buttons.resetTooltip');
  const muteLabel = isMuted ? t('buttons.unmute') : t('buttons.mute');

  return (
    <section className="timer-section" aria-label="Round timer" data-phase={phase}>
      <div className="play-surface">
        <p className="round-counter">
          {t('roundCounter', { current: displayRound, total: totalRounds })}
        </p>
        <div
          className={`letter ${letterVisible ? '' : 'hidden'} ${letterLanding ? 'landing' : ''}`}
        >
          {letter}
        </div>
        {/* aria-live="off": avoid announcing every tick; status div below covers phase transitions */}
        <div className={timerClassName} aria-live="off">
          {timerText}
        </div>
        {/* Announce only meaningful phase changes (get ready, go, round over, game complete) */}
        <div
          className={`status${phase === 'done' ? ' done' : ''}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {statusKey ? t(statusKey) : ''}
        </div>
      </div>

      <div className="buttons">
        <button
          id="btn"
          type="button"
          onClick={actions.onStart}
          disabled={phase === 'spinning' || !hasMoreRounds}
        >
          {mainButtonLabel}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={actions.onSkip}
          title={skipButtonTooltip}
        >
          {t('buttons.skipLetter')}
        </button>
        <button
          id="resetBtn"
          type="button"
          className={`btn-secondary ${phase === 'idle' ? 'hidden' : ''}`}
          onClick={actions.onReset}
          title={resetButtonTooltip}
        >
          {t('buttons.reset')}
        </button>
        <button
          type="button"
          className={`btn-secondary ${isRunning ? '' : 'hidden'}`}
          onClick={actions.onPause}
        >
          {pauseButtonLabel}
        </button>
        <button type="button" className="btn-secondary new-game-btn" onClick={actions.onNewGame}>
          {t('buttons.newGame')}
        </button>
        <button type="button" className="btn-secondary" onClick={actions.onToggleMute}>
          {muteLabel}
        </button>
      </div>

      <fieldset className="settings">
        <legend className="sr-only">{`${t('settings.duration')} ${t('settings.rounds')}`}</legend>
        <div className="setting-field">
          <label htmlFor="duration">{t('settings.duration')}</label>
          <div className="number-with-unit">
            <input
              type="number"
              id="duration"
              value={durationInput}
              min={DURATION_MIN}
              max={DURATION_MAX}
              disabled={!canEditDuration}
              onChange={(event) => actions.onDurationChange(event.target.value)}
              onBlur={actions.onDurationBlur}
            />
            <span>{t('status.seconds')}</span>
          </div>
        </div>

        <div className="setting-field">
          <label htmlFor="totalRounds">{t('settings.rounds')}</label>
          <input
            type="number"
            id="totalRounds"
            value={totalRoundsInput}
            min={ROUNDS_MIN}
            max={ROUNDS_MAX}
            disabled={!canEditDuration}
            onChange={(event) => actions.onTotalRoundsChange(event.target.value)}
            onBlur={actions.onTotalRoundsBlur}
          />
        </div>
      </fieldset>
    </section>
  );
}

export { TimerPanel };
