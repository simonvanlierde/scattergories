import { useTranslation } from 'react-i18next';
import type { GameController } from '@/app/useGameController';
import { ActionBar } from './ActionBar';
import { LetterHero } from './LetterHero';
import { TimerRing } from './TimerRing';

interface PlaymatProps {
  game: GameController;
}

type RoundPhase = PlaymatProps['game']['round']['phase'];

function PlaymatHero({
  phase,
  isPaused,
  secondsLeft,
  gameSeconds,
  letter,
  letterVisible,
  letterLanding,
}: {
  phase: RoundPhase;
  isPaused: boolean;
  secondsLeft: number;
  gameSeconds: number;
  letter: string;
  letterVisible: boolean;
  letterLanding: boolean;
}) {
  return (
    <div className="playmat__hero">
      <TimerRing
        phase={phase}
        isPaused={isPaused}
        secondsLeft={secondsLeft}
        gameSeconds={gameSeconds}
      />
      <LetterHero letter={letter} visible={letterVisible} landing={letterLanding} />
    </div>
  );
}

function PlaymatStatus({ phase, statusKey }: { phase: RoundPhase; statusKey: string | null }) {
  const { t } = useTranslation();

  return (
    <p
      data-testid="round-status"
      className={`playmat__status${phase === 'done' ? ' playmat__status--done' : ''}`}
      aria-live="polite"
      aria-atomic="true"
    >
      {statusKey ? t(statusKey) : ''}
    </p>
  );
}

function PlaymatRoundContent({
  round,
  settings,
  controls,
}: {
  round: PlaymatProps['game']['round'];
  settings: PlaymatProps['game']['settings'];
  controls: PlaymatProps['game']['controls'];
}) {
  return (
    <>
      <PlaymatHero
        phase={round.phase}
        isPaused={round.isPaused}
        secondsLeft={round.secondsLeft}
        gameSeconds={settings.gameSeconds}
        letter={round.letter}
        letterVisible={round.letterVisible}
        letterLanding={round.letterLanding}
      />

      <PlaymatStatus phase={round.phase} statusKey={round.statusKey} />

      <ActionBar
        phase={round.phase}
        isPaused={round.isPaused}
        onPrimary={controls.onStartRound}
        onNewLetter={controls.onNewLetter}
        onNextRound={controls.onNextRound}
      />
    </>
  );
}

export function Playmat({ game }: PlaymatProps) {
  const { t } = useTranslation();
  const { round, settings, controls } = game;

  return (
    <section
      className="playmat"
      aria-label={t('playmat.label', { defaultValue: 'Game board' })}
      data-phase={round.phase}
    >
      <PlaymatRoundContent round={round} settings={settings} controls={controls} />
    </section>
  );
}
