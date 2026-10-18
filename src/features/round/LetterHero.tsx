import { useTranslation } from "react-i18next";
import { cx } from "@/shared/ui/cx";

interface LetterHeroProps {
  letter: string;
  visible: boolean;
  landing: boolean;
}

export function LetterHero({ letter, visible, landing }: LetterHeroProps) {
  const { t } = useTranslation();
  // The glyph flips through a dozen letters before it lands; a live region would
  // read every one. Screen readers get the drawn letter once, when it lands.
  const announced = visible && landing ? `${t("round.letterLabel")} ${letter}` : "";
  return (
    <div className={cx("letter-hero", landing && "letter-hero--landing")}>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announced}
      </span>
      <span
        data-testid="current-letter"
        aria-hidden="true"
        className={cx(
          "letter-hero__glyph",
          !visible && "letter-hero__glyph--hidden",
          landing && "letter-hero__glyph--landing",
        )}
        style={{ viewTransitionName: "letter-hero" }}
      >
        {letter}
      </span>
    </div>
  );
}
