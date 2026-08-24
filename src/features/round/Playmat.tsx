import { useTranslation } from "react-i18next";
import type { Phase, StatusKey } from "@/domain/game/roundReducer";
import { ActionBar } from "./ActionBar";
import { LetterHero } from "./LetterHero";
import { TimerRing } from "./TimerRing";

interface PlaymatProps {
  phase: Phase;
  isPaused: boolean;
  secondsLeft: number;
  gameSeconds: number;
  letter: string;
  letterVisible: boolean;
  letterLanding: boolean;
  statusKey: StatusKey;
  onPrimary: () => void;
  onNewLetter: () => void;
  onNextRound: () => void;
}

function PlaymatStatus({ statusKey }: { statusKey: StatusKey }) {
  const { t } = useTranslation();

  return (
    <p data-testid="round-status" className="sr-only" aria-live="polite" aria-atomic="true">
      {statusKey ? t(statusKey) : ""}
    </p>
  );
}

export function Playmat({
  phase,
  isPaused,
  secondsLeft,
  gameSeconds,
  letter,
  letterVisible,
  letterLanding,
  statusKey,
  onPrimary,
  onNewLetter,
  onNextRound,
}: PlaymatProps) {
  const { t } = useTranslation();

  return (
    <section className="playmat" aria-label={t("playmat.label")} data-phase={phase}>
      <div className="playmat__hero">
        <TimerRing
          phase={phase}
          isPaused={isPaused}
          secondsLeft={secondsLeft}
          gameSeconds={gameSeconds}
        />
        <LetterHero letter={letter} visible={letterVisible} landing={letterLanding} />
      </div>

      <PlaymatStatus statusKey={statusKey} />

      <ActionBar
        phase={phase}
        isPaused={isPaused}
        onPrimary={onPrimary}
        onNewLetter={onNewLetter}
        onNextRound={onNextRound}
      />
    </section>
  );
}
