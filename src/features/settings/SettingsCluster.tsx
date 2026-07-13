import { Moon, Settings, Sun, Volume2, VolumeX } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  bufferSecondsDefault,
  bufferSecondsMax,
  bufferSecondsMin,
  durationDefault,
  durationMax,
  durationMin,
} from "@/domain/game/constants";
import { getNativeName, SUPPORTED_LOCALES } from "@/i18n/localeRegistry";
import { DebouncedNumberField } from "@/shared/ui/DebouncedNumberField";
import { Icon } from "@/shared/ui/Icon";
import { IconButton } from "@/shared/ui/IconButton";
import { Sheet } from "@/shared/ui/Sheet";

type TimingField = "durationInput" | "bufferSecondsInput";

interface SettingsClusterProps {
  language: string;
  isLanguagePending: boolean;
  theme: "light" | "dark";
  isMuted: boolean;
  avoidRepeats: boolean;
  durationInput: string;
  bufferSecondsInput: string;
  onLanguageChange: (value: string) => void;
  onToggleTheme: () => void;
  onToggleMute: () => void;
  onToggleAvoidRepeats: () => void;
  onUpdateTimingField: (field: TimingField, value: string) => void;
}

/** A titled group. One-control groups put the control on the title row instead of below it. */
function SettingsSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="settings-section">
      <div className="settings-section__head">
        <h3 className="settings-section__title">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function LanguageSelect({
  language,
  isLanguagePending,
  onSelect,
}: Pick<SettingsClusterProps, "language" | "isLanguagePending"> & {
  onSelect: (code: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <select
      className="settings-select"
      aria-label={t("language.label")}
      value={language}
      disabled={isLanguagePending}
      onChange={(event) => onSelect(event.target.value)}
    >
      {SUPPORTED_LOCALES.map((code) => (
        <option key={code} value={code}>
          {getNativeName(code)}
        </option>
      ))}
    </select>
  );
}

/** Light/dark as a segmented choice — a settings panel should show the state, not just flip it. */
function ThemeChoice({
  theme,
  onToggleTheme,
}: Pick<SettingsClusterProps, "theme" | "onToggleTheme">) {
  const { t } = useTranslation();
  const isDark = theme === "dark";

  return (
    <fieldset className="theme-choice">
      <legend className="sr-only">{t("theme.label")}</legend>
      {/* Selecting the already-checked radio fires no change event, so a plain
          toggle is enough — no need to guard either handler. */}
      <label className="theme-choice__item">
        <input type="radio" name="theme" checked={!isDark} onChange={onToggleTheme} />
        <Icon icon={Sun} size={16} />
        <span>{t("theme.light")}</span>
      </label>
      <label className="theme-choice__item">
        <input type="radio" name="theme" checked={isDark} onChange={onToggleTheme} />
        <Icon icon={Moon} size={16} />
        <span>{t("theme.dark")}</span>
      </label>
    </fieldset>
  );
}

function GameplaySettings({
  avoidRepeats,
  durationInput,
  bufferSecondsInput,
  onToggleAvoidRepeats,
  onUpdateTimingField,
}: Pick<
  SettingsClusterProps,
  | "avoidRepeats"
  | "durationInput"
  | "bufferSecondsInput"
  | "onToggleAvoidRepeats"
  | "onUpdateTimingField"
>) {
  const { t } = useTranslation();

  return (
    <div className="settings-rows">
      <DebouncedNumberField
        id="duration"
        label={t("settings.duration")}
        hint={t("settings.durationHint")}
        value={durationInput}
        min={durationMin}
        max={durationMax}
        fallback={durationDefault}
        suffix="s"
        onCommit={(value) => onUpdateTimingField("durationInput", value)}
      />
      <DebouncedNumberField
        id="getReady"
        label={t("settings.getReady")}
        hint={t("settings.getReadyHint")}
        value={bufferSecondsInput}
        min={bufferSecondsMin}
        max={bufferSecondsMax}
        fallback={bufferSecondsDefault}
        suffix="s"
        onCommit={(value) => onUpdateTimingField("bufferSecondsInput", value)}
      />
      <label className="settings-toggle">
        <span className="ds-field__text">
          <span className="ds-field__label">{t("settings.avoidRepeats")}</span>
          <span className="ds-field__hint">{t("settings.avoidRepeatsHint")}</span>
        </span>
        <input type="checkbox" checked={avoidRepeats} onChange={onToggleAvoidRepeats} />
      </label>
    </div>
  );
}

export function SettingsCluster({
  language,
  isLanguagePending,
  theme,
  isMuted,
  avoidRepeats,
  durationInput,
  bufferSecondsInput,
  onLanguageChange,
  onToggleTheme,
  onToggleMute,
  onToggleAvoidRepeats,
  onUpdateTimingField,
}: SettingsClusterProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="settings-cluster">
      {/* Sound stays in the footer: it is the one setting that gets flipped
          mid-round. Everything else lives a click deeper. */}
      <IconButton
        label={isMuted ? t("buttons.unmute") : t("buttons.mute")}
        icon={<Icon icon={isMuted ? VolumeX : Volume2} size={20} />}
        aria-pressed={isMuted}
        onClick={onToggleMute}
      />

      <IconButton
        label={t("settings.title")}
        icon={<Icon icon={Settings} size={20} />}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
      />

      <Sheet
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={t("settings.title")}
        closeLabel={t("buttons.closeTooltip")}
      >
        <div className="settings-panel">
          <SettingsSection title={t("settings.gameplay")}>
            <GameplaySettings
              avoidRepeats={avoidRepeats}
              durationInput={durationInput}
              bufferSecondsInput={bufferSecondsInput}
              onToggleAvoidRepeats={onToggleAvoidRepeats}
              onUpdateTimingField={onUpdateTimingField}
            />
          </SettingsSection>

          <SettingsSection
            title={t("language.label")}
            action={
              <LanguageSelect
                language={language}
                isLanguagePending={isLanguagePending}
                onSelect={onLanguageChange}
              />
            }
          />

          <SettingsSection
            title={t("theme.label")}
            action={<ThemeChoice theme={theme} onToggleTheme={onToggleTheme} />}
          />
        </div>
      </Sheet>
    </div>
  );
}
