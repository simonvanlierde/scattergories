import { useLingui } from "@lingui/react";
import type { PlayStyle } from "@/features/settings/schema";

interface PlayStyleChoiceProps {
  value: PlayStyle;
  disabled: boolean;
  onChange: (value: PlayStyle) => void;
}

export function PlayStyleChoice({ value, disabled, onChange }: PlayStyleChoiceProps) {
  const { _: t } = useLingui();
  return (
    <header className="play-style">
      <fieldset className="play-style__choices" disabled={disabled}>
        <legend className="sr-only">{t("playStyle.label")}</legend>
        <label className="play-style__option">
          <input type="radio" name="play-style" checked={value === "board"} onChange={() => onChange("board")} />
          <span>{t("playStyle.board")}</span>
        </label>
        <label className="play-style__option">
          <input type="radio" name="play-style" checked={value === "simple"} onChange={() => onChange("simple")} />
          <span>{t("playStyle.simple")}</span>
        </label>
      </fieldset>
      {value === "simple" ? <p className="play-style__hint">{t("playStyle.simpleHint")}</p> : null}
    </header>
  );
}
