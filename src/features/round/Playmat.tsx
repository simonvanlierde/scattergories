import { useTranslation } from 'react-i18next';
import type { GameController } from '@/app/useGameController';
import { ActionBar } from './ActionBar';
import { LetterHero } from './LetterHero';
import { RoundEnd } from './RoundEnd';
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

function PlaymatStatus({ statusKey }: { statusKey: string | null }) {
  const { t } = useTranslation();

  return (
    <p data-testid="round-status" className="sr-only" aria-live="polite" aria-atomic="true">
      {statusKey ? t(statusKey) : ''}
    </p>
  );
}

// Shown between rounds (idle/done) so players can see which letters have already
// come up — the "have we done B yet?" question at the table. Hidden during play
// to keep the live board focused on the clock.
function UsedLetters({ letters }: { letters: string[] }) {
  const { t } = useTranslation();

  if (letters.length === 0) {
    return null;
  }

  return (
    <div className="playmat__meta">
      <p className="playmat__used-letters">
        {t('usedLetters', {
          letters: letters.join(' · '),
        })}
      </p>
    </div>
  );
}

function PlaymatRoundContent({
  round,
  settings,
  categories,
  controls,
}: {
  round: PlaymatProps['game']['round'];
  settings: PlaymatProps['game']['settings'];
  categories: PlaymatProps['game']['categories'];
  controls: PlaymatProps['game']['controls'];
}) {
  const isDone = round.phase === 'done';
  // Between rounds only — during play the strip would compete with the clock.
  const showUsedLetters = round.phase === 'idle' || isDone;

  return (
    <>
      {showUsedLetters ? <UsedLetters letters={round.usedLetters} /> : null}

      {isDone ? (
        <RoundEnd
          letter={round.letter}
          categoriesCount={categories.drawnCategories.length}
          roundsPlayed={round.usedLetters.length}
        />
      ) : (
        <PlaymatHero
          phase={round.phase}
          isPaused={round.isPaused}
          secondsLeft={round.secondsLeft}
          gameSeconds={settings.gameSeconds}
          letter={round.letter}
          letterVisible={round.letterVisible}
          letterLanding={round.letterLanding}
        />
      )}

      <PlaymatStatus statusKey={round.statusKey} />

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
  const { round, settings, categories, controls } = game;

  return (
    <section className="playmat" aria-label={t('playmat.label')} data-phase={round.phase}>
      <PlaymatRoundContent
        round={round}
        settings={settings}
        categories={categories}
        controls={controls}
      />
    </section>
  );
}
