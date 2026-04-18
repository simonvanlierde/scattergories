import { Settings2 } from 'lucide-react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCategoryStrikes } from '../hooks/useCategoryStrikes';
import type { useGameSession } from '../hooks/useGameSession';
import { ActionBar } from './ActionBar';
import { CategoryChecklist } from './CategoryChecklist';
import { LetterHero } from './LetterHero';
import { RoundEndScreen } from './RoundEndScreen';
import { TimerRing } from './TimerRing';
import { Badge } from './ui/Badge';
import { Icon } from './ui/Icon';

interface PlaymatProps {
  session: ReturnType<typeof useGameSession>;
  onOpenSettings: () => void;
  onAchievementsUnlocked?: (ids: string[]) => void;
}

type RoundPhase = PlaymatProps['session']['round']['phase'];

function PlaymatMeta({
  currentRound,
  totalRounds,
  usedLettersText,
}: {
  currentRound: number;
  totalRounds: number;
  usedLettersText: string;
}) {
  const { t } = useTranslation();

  return (
    <header className="playmat__meta">
      <Badge tone="accent">
        {t('roundCounter', { current: currentRound, total: totalRounds })}
      </Badge>
      <p className="playmat__used-letters" aria-live="polite">
        {usedLettersText}
      </p>
    </header>
  );
}

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

function SessionPacePill({
  durationSeconds,
  totalRounds,
  onClick,
}: {
  durationSeconds: number;
  totalRounds: number;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className="session-pace-pill"
      onClick={onClick}
      aria-label={t('settings.paceLabel', {
        defaultValue: 'Round pace — {{seconds}}s × {{rounds}} rounds. Tap to change.',
        seconds: durationSeconds,
        rounds: totalRounds,
      })}
    >
      <Icon icon={Settings2} size={16} />
      <span className="session-pace-pill__text">
        {t('settings.pace', {
          defaultValue: '{{seconds}}s × {{rounds}}',
          seconds: durationSeconds,
          rounds: totalRounds,
        })}
      </span>
    </button>
  );
}

function PlaymatRoundContent({
  round,
  settings,
  controls,
  categories,
  flags,
  strikes,
  onToggleCategory,
  onOpenSettings,
  onAchievementsUnlocked,
}: {
  round: PlaymatProps['session']['round'];
  settings: PlaymatProps['session']['settings'];
  controls: PlaymatProps['session']['controls'];
  categories: PlaymatProps['session']['categories'];
  flags: PlaymatProps['session']['flags'];
  strikes: ReturnType<typeof useCategoryStrikes>;
  onToggleCategory: (category: string) => void;
  onOpenSettings: () => void;
  onAchievementsUnlocked?: (ids: string[]) => void;
}) {
  return (
    <>
      {round.phase === 'done' ? (
        <RoundEndScreen
          letter={round.letter}
          roundCount={Math.min(settings.totalRounds, Math.max(1, round.roundCount || 1))}
          totalRounds={settings.totalRounds}
          hasMoreRounds={flags.hasMoreRounds}
          categoriesStruck={strikes.struckCount}
          categoriesTotal={categories.drawnCategories.length}
          onAdvance={controls.onStartRound}
          onAchievementsUnlocked={onAchievementsUnlocked}
        />
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

      <CategoryChecklist
        categories={categories.drawnCategories}
        availableCount={categories.availableCount}
        isStruck={strikes.isStruck}
        onToggle={onToggleCategory}
      />

      <ActionBar
        phase={round.phase}
        isPaused={round.isPaused}
        isMuted={settings.isMuted}
        roundCount={round.roundCount}
        hasMoreRounds={flags.hasMoreRounds}
        onStart={controls.onStartRound}
        onPause={controls.onTogglePause}
        onSkip={controls.onSkipLetter}
        onReset={controls.onResetRound}
        onNewGame={controls.onNewGame}
        onToggleMute={controls.onToggleMute}
      />

      <SessionPacePill
        durationSeconds={settings.gameSeconds}
        totalRounds={settings.totalRounds}
        onClick={onOpenSettings}
      />
    </>
  );
}

export function Playmat({ session, onOpenSettings, onAchievementsUnlocked }: PlaymatProps) {
  const { t } = useTranslation();
  const { round, settings, controls, categories, flags } = session;

  const strikes = useCategoryStrikes({
    drawnCategories: categories.drawnCategories,
    resetSignal: round.roundCount,
  });
  const { toggle: toggleStrike } = strikes;
  const { playToggle } = round;
  const handleToggle = useCallback(
    (category: string) => {
      toggleStrike(category);
      playToggle();
    },
    [toggleStrike, playToggle],
  );

  const displayRound = Math.min(settings.totalRounds, Math.max(1, round.roundCount || 1));
  const usedLettersText =
    round.usedLetters.length > 0
      ? t('usedLetters', {
          letters: round.usedLetters.join(', '),
          empty: '',
        })
      : t('usedLetters', {
          letters: '',
          empty: t('usedLettersEmpty'),
        });

  return (
    <section
      className="playmat"
      aria-label={t('playmat.label', { defaultValue: 'Game board' })}
      data-phase={round.phase}
    >
      <PlaymatMeta
        currentRound={displayRound}
        totalRounds={settings.totalRounds}
        usedLettersText={usedLettersText}
      />
      <PlaymatRoundContent
        round={round}
        settings={settings}
        controls={controls}
        categories={categories}
        flags={flags}
        strikes={strikes}
        onToggleCategory={handleToggle}
        onOpenSettings={onOpenSettings}
        onAchievementsUnlocked={onAchievementsUnlocked}
      />
    </section>
  );
}
