import { useTranslation } from "react-i18next";
import type { Phase, StatusKey } from "@/domain/game/roundReducer";
import { ActionBar } from "./ActionBar";
import { LetterHero } from "./LetterHero";
import { CRITICAL_THRESHOLD_SECONDS, TimerRing, URGENT_THRESHOLD_SECONDS } from "./TimerRing";

interface PlaymatProps {
  phase: Phase;
  isPaused: boolean;
  secondsLeft: number;
  gameSeconds: number;
  letter: string;
  letterVisible: boolean;
  letterLanding: boolean;
  statusKey: StatusKey;
  roundNumber: number;
  onPrimary: () => void;
  onNewLetter: () => void;
  onNextRound: () => void;
}

interface PlaymatStatusProps {
  statusKey: StatusKey;
  phase: Phase;
  secondsLeft: number;
  gameSeconds: number;
}

/** The urgency threshold the clock has passed, if the round started above it. */
function passedThreshold(phase: Phase, secondsLeft: number, gameSeconds: number) {
  if (phase !== "running") {
    return null;
  }
  return (
    [CRITICAL_THRESHOLD_SECONDS, URGENT_THRESHOLD_SECONDS].find(
      (threshold) => secondsLeft <= threshold && threshold < gameSeconds,
    ) ?? null
  );
}

// The readout ticks silently (aria-live off); these regions speak only when their
// text changes, so a threshold is announced once, as the ring changes colour.
// The last 5 seconds and the end of the round interrupt whatever is being read;
// everything else waits its turn. Only one region holds text at a time.
function PlaymatStatus({ statusKey, phase, secondsLeft, gameSeconds }: PlaymatStatusProps) {
  const { t } = useTranslation();
  const threshold = passedThreshold(phase, secondsLeft, gameSeconds);
  let text = statusKey ? t(statusKey) : "";
  if (threshold !== null) {
    text = t("timer.secondsWarning", { seconds: threshold });
  }
  const isUrgent = threshold === CRITICAL_THRESHOLD_SECONDS || statusKey === "timer.roundOver";

  return (
    <div data-testid="round-status" className="sr-only">
      <p aria-live="polite" aria-atomic="true">
        {isUrgent ? "" : text}
      </p>
      <p aria-live="assertive" aria-atomic="true">
        {isUrgent ? text : ""}
      </p>
    </div>
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
  roundNumber,
  onPrimary,
  onNewLetter,
  onNextRound,
}: PlaymatProps) {
  const { t } = useTranslation();

  return (
    <section className="playmat" aria-label={t("playmat.label")} data-phase={phase}>
      <div className="playmat__hero">
        <TimerRing phase={phase} isPaused={isPaused} secondsLeft={secondsLeft} gameSeconds={gameSeconds} />
        <LetterHero letter={letter} visible={letterVisible} landing={letterLanding} />
        {roundNumber > 0 && <p className="playmat__round">{t("round.number", { number: roundNumber })}</p>}
      </div>

      <PlaymatStatus statusKey={statusKey} phase={phase} secondsLeft={secondsLeft} gameSeconds={gameSeconds} />

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
