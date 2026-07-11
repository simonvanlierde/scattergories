import { X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { safeStorage } from "@/shared/lib/safeStorage";
import { BrandMark } from "@/shared/ui/BrandMark";
import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { IconButton } from "@/shared/ui/IconButton";
import { useReturnFocus } from "@/shared/ui/useReturnFocus";

export const ONBOARDED_KEY = "scattergories.onboarded.v1";

/**
 * First-run gate: `needsOnboarding` is true until the player has seen (and
 * dismissed) the welcome once. Persisted best-effort — a blocked/full store
 * just means the card shows again next visit, never a crash.
 */
export function useOnboarding() {
  const [onboarded, setOnboarded] = useState(() => safeStorage.getItem(ONBOARDED_KEY) === "1");

  const complete = useCallback(() => {
    safeStorage.setItem(ONBOARDED_KEY, "1");
    setOnboarded(true);
  }, []);

  return { needsOnboarding: !onboarded, complete };
}

interface WelcomeOverlayProps {
  /** Roll the first letter and leave onboarding. */
  onStart: () => void;
  /** Open the full rules and leave onboarding. */
  onHowToPlay: () => void;
  /** Close without rolling (X, Esc, or backdrop). */
  onDismiss: () => void;
}

// The three beats of a round — a real sequence, so it earns numbered markers.
const STEP_KEYS = ["welcome.roll", "welcome.write", "welcome.race"] as const;

export function WelcomeOverlay({ onStart, onHowToPlay, onDismiss }: WelcomeOverlayProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useReturnFocus(true);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    function handleCancel(event: Event) {
      event.preventDefault();
      onDismiss();
    }

    // Only dismiss when the press *started* on the backdrop (mirrors Sheet).
    let pressedBackdrop = false;

    function handlePointerDown(event: PointerEvent) {
      pressedBackdrop = event.target === dialog;
    }

    function handleClick(event: MouseEvent) {
      if (event.target === dialog && pressedBackdrop) {
        onDismiss();
      }
      pressedBackdrop = false;
    }

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("pointerdown", handlePointerDown);
    dialog.addEventListener("click", handleClick);

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("pointerdown", handlePointerDown);
      dialog.removeEventListener("click", handleClick);
    };
  }, [onDismiss]);

  return (
    <dialog ref={dialogRef} className="welcome" aria-labelledby={titleId} aria-modal="true">
      <IconButton
        className="welcome__close"
        label={t("buttons.closeTooltip")}
        icon={<Icon icon={X} size={22} />}
        onClick={onDismiss}
      />

      <div className="welcome__body">
        <p className="welcome__eyebrow">
          <BrandMark />
          <span>{t("title")}</span>
        </p>

        <h2 id={titleId} className="welcome__headline">
          {t("modal.objectiveText")}
        </h2>

        <ol className="welcome__steps">
          {STEP_KEYS.map((key, index) => (
            <li key={key} className="welcome__step">
              <span className="welcome__step-num" aria-hidden="true">
                {index + 1}
              </span>
              <span className="welcome__step-label">{t(key)}</span>
            </li>
          ))}
        </ol>

        <div className="welcome__actions">
          <Button
            variant="primary"
            size="lg"
            className="welcome__start"
            onClick={onStart}
            autoFocus
          >
            {t("buttons.startRound")}
          </Button>
          <Button variant="ghost" size="md" onClick={onHowToPlay}>
            {t("buttons.howToPlay")}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
