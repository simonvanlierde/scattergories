import { useLingui } from "@lingui/react";
import { Dices, Pause, Play, SkipForward } from "lucide-react";
import type { ReactNode } from "react";
import type { Phase } from "@/domain/game/roundReducer";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { useConfirmTap } from "@/shared/ui/useConfirmTap";

interface ActionBarProps {
  phase: Phase;
  isPaused: boolean;
  onPrimary: () => void;
  onNewLetter: () => void;
  onNextRound: () => void;
}

function ControlGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="action-bar__group action-bar__group--bare">
      <legend className="sr-only">{label}</legend>
      {children}
    </fieldset>
  );
}

type Translate = ReturnType<typeof useLingui>["_"];

function resolvePrimary(phase: Phase, isPaused: boolean, t: Translate) {
  if (phase === "spinning") {
    return { label: t("buttons.spinning"), icon: Play };
  }
  if (phase === "done") {
    return { label: t("buttons.nextRound"), icon: Play };
  }
  if (phase === "buffer" || phase === "running") {
    return isPaused ? { label: t("buttons.resume"), icon: Play } : { label: t("buttons.pause"), icon: Pause };
  }
  return { label: t("buttons.startRound"), icon: Play };
}

export function ActionBar({ phase, isPaused, onPrimary, onNewLetter, onNextRound }: ActionBarProps) {
  const { _: t } = useLingui();
  const isPausedRound = (phase === "buffer" || phase === "running") && isPaused;
  const roundControlsLabel = t("controls.roundGroup");

  // New letter (reroll) — during the get-ready countdown (no answers written yet)
  // and while paused. Never mid-play, where it would wipe in-progress answers.
  const showNewLetter = phase === "buffer" || isPausedRound;
  // Next round — while actively running or paused.
  const showNextRound = phase === "running" || isPausedRound;

  const { label: primaryLabel, icon: primaryIcon } = resolvePrimary(phase, isPaused, t);
  // Skipping mid-play wipes the table's letter, so the live clock asks for a
  // second tap. A paused round skips in one.
  const mustConfirmSkip = phase === "running" && !isPaused;
  const skip = useConfirmTap(onNextRound);

  return (
    <div className="action-bar">
      <Button
        variant="primary"
        size="lg"
        className="action-bar__primary"
        onClick={onPrimary}
        disabled={phase === "spinning"}
        leadingIcon={<Icon icon={primaryIcon} size={20} />}
      >
        {primaryLabel}
      </Button>

      {/* Always rendered so the layout never shifts — disabled (greyed) when the
          action isn't available in the current phase. */}
      <ControlGroup label={roundControlsLabel}>
        <Button
          variant="ghost"
          size="sm"
          className="action-bar__secondary"
          leadingIcon={<Icon icon={Dices} size={18} />}
          disabled={!showNewLetter}
          onClick={onNewLetter}
        >
          {t("buttons.newLetter")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={<Icon icon={SkipForward} size={18} />}
          className={skip.armed ? "action-bar__secondary ds-icon-button--armed" : "action-bar__secondary"}
          disabled={!showNextRound}
          onClick={mustConfirmSkip ? skip.onClick : onNextRound}
        >
          {t("buttons.nextRound")}
        </Button>
      </ControlGroup>
      {/* Keep the live region mounted so arming is announced without moving focus. */}
      <p className="action-bar__confirm" aria-live="polite">
        {skip.armed ? t("buttons.skipConfirm") : null}
      </p>
    </div>
  );
}
