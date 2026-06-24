import { useTranslation } from 'react-i18next';
import type { GameController } from '@/app/useGameController';
import { ActionBar } from './ActionBar';
import { LetterHero } from './LetterHero';
import { RoundEndScreen } from './RoundEndScreen';
import { TimerRing } from './TimerRing';

interface PlaymatProps {
  game: GameController;
  onOpenSettings: () => void;
}

type RoundPhase = PlaymatProps['game']['round']['phase'];

function PlaymatHero({
  phase,
  secondsLeft,
  gameSeconds,
  letter,
  letterVisible,
  letterLanding,
}: {
  phase: RoundPhase;
  secondsLeft: number;
  gameSeconds: number;
  letter: string;
  letterVisible: boolean;
  letterLanding: boolean;
}) {
  return (
    <div className="playmat__hero">
      <TimerRing phase={phase} secondsLeft={secondsLeft} gameSeconds={gameSeconds} />
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
  onOpenSettings,
}: {
  round: PlaymatProps['game']['round'];
  settings: PlaymatProps['game']['settings'];
  controls: PlaymatProps['game']['controls'];
  onOpenSettings: () => void;
}) {
  return (
    <>
      {round.phase === 'done' ? (
        <RoundEndScreen letter={round.letter} onAdvance={controls.onStartRound} />
      ) : (
        <PlaymatHero
          phase={round.phase}
          secondsLeft={round.secondsLeft}
          gameSeconds={settings.gameSeconds}
          letter={round.letter}
          letterVisible={round.letterVisible}
          letterLanding={round.letterLanding}
        />
      )}

      <PlaymatStatus phase={round.phase} statusKey={round.statusKey} />

      <ActionBar
        phase={round.phase}
        isPaused={round.isPaused}
        isMuted={settings.isMuted}
        durationSeconds={settings.gameSeconds}
        onStart={controls.onStartRound}
        onPause={controls.onTogglePause}
        onSkip={controls.onSkipLetter}
        onReset={controls.onResetRound}
        onToggleMute={controls.onToggleMute}
        onOpenSettings={onOpenSettings}
      />
    </>
  );
}

export function Playmat({ game, onOpenSettings }: PlaymatProps) {
  const { t } = useTranslation();
  const { round, settings, controls } = game;

  const showUsedLetters = settings.categoryRefreshMode === 'pinned';
  const usedLettersText = t('usedLetters', {
    letters: round.usedLetters.join(', '),
    empty: round.usedLetters.length > 0 ? '' : t('usedLettersEmpty'),
  });

  return (
    <section
      className="playmat"
      aria-label={t('playmat.label', { defaultValue: 'Game board' })}
      data-phase={round.phase}
    >
      {showUsedLetters ? (
        <header className="playmat__meta">
          <p className="playmat__used-letters" aria-live="polite">
            {usedLettersText}
          </p>
        </header>
      ) : null}
      <PlaymatRoundContent
        round={round}
        settings={settings}
        controls={controls}
        onOpenSettings={onOpenSettings}
      />
    </section>
  );
}
