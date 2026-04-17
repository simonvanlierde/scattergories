import { useTranslation } from 'react-i18next';
import { durationMax, durationMin, roundsMax, roundsMin } from '../game/constants';
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

function getTimerText(
  phase: Phase,
  secondsLeft: number,
  t: ReturnType<typeof useTranslation>['t'],
) {
  if (phase === 'done') {
    return t('timer.timeUp');
  }

  if (phase === 'buffer' || phase === 'running') {
    return formatSeconds(Math.max(0, secondsLeft));
  }

  return '';
}

function getTimerClassName(phase: Phase, secondsLeft: number) {
  if (phase === 'buffer') {
    return 'timer buffer';
  }

  if (phase === 'running') {
    const urgent = secondsLeft <= URGENT_THRESHOLD_SECONDS ? ' urgent' : '';
    return `timer running${urgent}`;
  }

  if (phase === 'done') {
    return 'timer done';
  }

  return 'timer';
}

function getMainButtonLabel(
  phase: Phase,
  roundCount: number,
  t: ReturnType<typeof useTranslation>['t'],
) {
  if (phase === 'spinning') {
    return t('buttons.spinning');
  }

  if (roundCount === 0) {
    return t('buttons.startRound');
  }

  return t('buttons.nextRound');
}

function RoundDisplay({
  phase,
  secondsLeft,
  letter,
  letterVisible,
  letterLanding,
  roundCount,
  totalRounds,
  statusKey,
}: Pick<
  TimerRoundState,
  | 'phase'
  | 'secondsLeft'
  | 'letter'
  | 'letterVisible'
  | 'letterLanding'
  | 'roundCount'
  | 'statusKey'
> & { totalRounds: number }) {
  const { t } = useTranslation();
  const displayRound = Math.min(totalRounds, Math.max(1, roundCount || 1));
  const timerText = getTimerText(phase, secondsLeft, t);
  const timerClassName = getTimerClassName(phase, secondsLeft);

  return (
    <div className="round-display">
      <div className="round-display__header">
        <div>
          <p className="eyebrow" id="round-panel-title">
            {t('round.panelEyebrow', { defaultValue: 'Round control room' })}
          </p>
          <p className="round-counter">
            {t('roundCounter', { current: displayRound, total: totalRounds })}
          </p>
        </div>
        <p className="round-hint">
          {t('shortcuts', {
            defaultValue:
              'Shortcuts: Space next round, R skip letter, P pause, N new game, C categories, A add custom',
          })}
        </p>
      </div>

      <div className="letter-stage" aria-live="polite" aria-atomic="true">
        <span className="letter-stage__label">
          {t('round.letterLabel', { defaultValue: 'Current letter' })}
        </span>
        <div
          data-testid="current-letter"
          className={`letter ${letterVisible ? '' : 'hidden'} ${letterLanding ? 'landing' : ''}`}
        >
          {letter}
        </div>
      </div>

      <div className="round-timer">
        <span className="round-timer__label">
          {t('round.timerLabel', { defaultValue: 'Round clock' })}
        </span>
        <div className={timerClassName} aria-live="off" data-testid="round-clock">
          {timerText}
        </div>
      </div>

      <div
        data-testid="round-status"
        className={`status${phase === 'done' ? ' done' : ''}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {statusKey ? t(statusKey) : ''}
      </div>
    </div>
  );
}

function ControlCard({
  actions,
  isMuted,
  isPaused,
  phase,
  roundCount,
  hasMoreRounds,
  durationInput,
  totalRoundsInput,
}: {
  actions: TimerActions;
  isMuted: boolean;
  durationInput: string;
  totalRoundsInput: string;
} & {
  hasMoreRounds: boolean;
  roundCount: number;
  isPaused: boolean;
  phase: TimerRoundState['phase'];
}) {
  const { t } = useTranslation();
  const canEditDuration = phase === 'idle' || phase === 'done';
  const isRunning = phase === 'buffer' || phase === 'running';
  const mainButtonLabel = getMainButtonLabel(phase, roundCount, t);
  const pauseButtonLabel = isPaused ? t('buttons.resume') : t('buttons.pause');
  const skipButtonTooltip = t('buttons.skipLetterTooltip');
  const resetButtonTooltip = t('buttons.resetTooltip');
  const muteLabel = isMuted ? t('buttons.unmute') : t('buttons.mute');

  return (
    <div className="control-card">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{t('controls.eyebrow', { defaultValue: 'Controls' })}</p>
          <h2>{t('controls.title', { defaultValue: 'Keep the round moving' })}</h2>
        </div>
        <p>
          {t('controls.body', {
            defaultValue: 'Start, pause, reroll, and tune pacing without leaving the board.',
          })}
        </p>
      </div>

      <div className="buttons">
        <button
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

      <SessionSettings
        actions={actions}
        canEditDuration={canEditDuration}
        durationInput={durationInput}
        totalRoundsInput={totalRoundsInput}
      />
    </div>
  );
}

function SessionSettings({
  actions,
  canEditDuration,
  durationInput,
  totalRoundsInput,
}: {
  actions: TimerActions;
  canEditDuration: boolean;
  durationInput: string;
  totalRoundsInput: string;
}) {
  const { t } = useTranslation();

  return (
    <fieldset className="settings-panel">
      <legend>{t('controls.settingsLegend', { defaultValue: 'Session settings' })}</legend>
      <div className="settings-grid">
        <div className="setting-field">
          <label htmlFor="duration">{t('settings.duration')}</label>
          <div className="number-with-unit">
            <input
              type="number"
              id="duration"
              value={durationInput}
              min={durationMin}
              max={durationMax}
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
            min={roundsMin}
            max={roundsMax}
            disabled={!canEditDuration}
            onChange={(event) => actions.onTotalRoundsChange(event.target.value)}
            onBlur={actions.onTotalRoundsBlur}
          />
        </div>
      </div>
    </fieldset>
  );
}

function TimerPanel({ round, settings, actions }: TimerPanelProps) {
  const {
    phase,
    secondsLeft,
    letter,
    letterVisible,
    letterLanding,
    roundCount,
    hasMoreRounds,
    statusKey,
    isPaused,
  } = round;
  const { isMuted, durationInput, totalRoundsInput, totalRounds } = settings;

  return (
    <section
      className="round-card"
      aria-labelledby="round-panel-title"
      data-phase={phase}
      data-running={phase === 'buffer' || phase === 'running' ? 'true' : 'false'}
    >
      <RoundDisplay
        phase={phase}
        secondsLeft={secondsLeft}
        letter={letter}
        letterVisible={letterVisible}
        letterLanding={letterLanding}
        roundCount={roundCount}
        statusKey={statusKey}
        totalRounds={totalRounds}
      />

      <ControlCard
        actions={actions}
        durationInput={durationInput}
        hasMoreRounds={hasMoreRounds}
        isMuted={isMuted}
        isPaused={isPaused}
        phase={phase}
        roundCount={roundCount}
        totalRoundsInput={totalRoundsInput}
      />
    </section>
  );
}

export { TimerPanel };
