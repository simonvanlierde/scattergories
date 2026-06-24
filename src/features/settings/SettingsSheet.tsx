import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { durationMax, durationMin } from '@/domain/game/constants';
import { getEnabledLocales, isLocaleEnabled } from '@/i18n/localeHealth';
import { getNativeName, SUPPORTED_LOCALES } from '@/i18n/localeRegistry';
import { PACKS } from '@/shared/lib/categoryPacks';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { Icon } from '@/shared/ui/Icon';
import { Sheet } from '@/shared/ui/Sheet';

type TimingField = 'durationInput';

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  language: string;
  isLanguagePending: boolean;
  theme: 'light' | 'dark';
  canEditRoundSettings: boolean;
  durationInput: string;
  activePack: string;
  onLanguageChange: (value: string) => void;
  onToggleTheme: () => void;
  onUpdateTimingField: (field: TimingField, value: string) => void;
  onBlurTimingField: (field: TimingField) => void;
  onActivePackChange: (packId: string) => void;
}

interface PackSectionProps {
  activePack: string;
  canEditRoundSettings: boolean;
  onActivePackChange: (packId: string) => void;
}

function PackSection({ activePack, canEditRoundSettings, onActivePackChange }: PackSectionProps) {
  const { t } = useTranslation();
  const activeMeta = PACKS.find((pack) => pack.id === activePack);

  return (
    <section className="settings-section" aria-labelledby="settings-pack">
      <h3 id="settings-pack" className="settings-section__title">
        {t('packs.sectionTitle', { defaultValue: 'Category pack' })}
      </h3>
      <label className="settings-select">
        <span className="sr-only">
          {t('packs.sectionTitle', { defaultValue: 'Category pack' })}
        </span>
        <select
          aria-label={t('packs.sectionTitle', { defaultValue: 'Category pack' })}
          value={activePack}
          disabled={!canEditRoundSettings}
          onChange={(event) => onActivePackChange(event.target.value)}
        >
          {PACKS.map((pack) => (
            <option key={pack.id} value={pack.id}>
              {t(pack.labelKey, { defaultValue: pack.fallbackLabel })}
            </option>
          ))}
        </select>
      </label>
      {activeMeta ? (
        <p className="settings-section__hint">
          {t(activeMeta.descriptionKey, { defaultValue: activeMeta.fallbackDescription })}
        </p>
      ) : null}
    </section>
  );
}

interface TimingSectionProps {
  canEditRoundSettings: boolean;
  durationInput: string;
  onUpdateTimingField: (field: TimingField, value: string) => void;
  onBlurTimingField: (field: TimingField) => void;
}

function TimingSection({
  canEditRoundSettings,
  durationInput,
  onUpdateTimingField,
  onBlurTimingField,
}: TimingSectionProps) {
  const { t } = useTranslation();
  const lockedHint = canEditRoundSettings
    ? undefined
    : t('settings.lockedHint', { defaultValue: 'Finish or reset the round to edit' });

  return (
    <section className="settings-section" aria-labelledby="settings-round-timer">
      <h3 id="settings-round-timer" className="settings-section__title">
        {t('settings.roundTimerTitle', { defaultValue: 'Round timer' })}
      </h3>
      <div className="settings-section__grid">
        <Field
          id="duration"
          label={t('settings.duration')}
          type="number"
          inputMode="numeric"
          value={durationInput}
          min={durationMin}
          max={durationMax}
          disabled={!canEditRoundSettings}
          suffix={t('status.seconds')}
          helper={lockedHint}
          onChange={(event) => onUpdateTimingField('durationInput', event.target.value)}
          onBlur={() => onBlurTimingField('durationInput')}
        />
      </div>
    </section>
  );
}

interface LanguageSectionProps {
  language: string;
  isLanguagePending: boolean;
  onLanguageChange: (value: string) => void;
}

function LanguageSection({ language, isLanguagePending, onLanguageChange }: LanguageSectionProps) {
  const { t } = useTranslation();
  const enabledLocales = getEnabledLocales();

  return (
    <section className="settings-section" aria-labelledby="settings-language">
      <h3 id="settings-language" className="settings-section__title">
        {t('language.label', { defaultValue: 'Language' })}
      </h3>
      <label className="settings-select">
        <span className="sr-only">{t('language.label')}</span>
        <select
          aria-label={t('language.label')}
          value={language}
          disabled={isLanguagePending}
          onChange={(event) => onLanguageChange(event.target.value)}
        >
          {SUPPORTED_LOCALES.map((code) => (
            <option
              key={code}
              value={code}
              disabled={!(enabledLocales.includes(code) && isLocaleEnabled(code))}
            >
              {getNativeName(code)}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

interface ThemeSectionProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

function ThemeSection({ theme, onToggleTheme }: ThemeSectionProps) {
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  return (
    <section className="settings-section" aria-labelledby="settings-theme">
      <h3 id="settings-theme" className="settings-section__title">
        {t('theme.sectionTitle', { defaultValue: 'Appearance' })}
      </h3>
      <Button
        variant="secondary"
        onClick={onToggleTheme}
        aria-pressed={isDark}
        leadingIcon={<Icon icon={isDark ? Moon : Sun} size={18} />}
      >
        {isDark
          ? t('theme.dark', { defaultValue: 'Dark mode' })
          : t('theme.light', { defaultValue: 'Light mode' })}
      </Button>
    </section>
  );
}

export function SettingsSheet({
  open,
  onClose,
  language,
  isLanguagePending,
  theme,
  canEditRoundSettings,
  durationInput,
  activePack,
  onLanguageChange,
  onToggleTheme,
  onUpdateTimingField,
  onBlurTimingField,
  onActivePackChange,
}: SettingsSheetProps) {
  const { t } = useTranslation();

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('settings.sheetTitle', { defaultValue: 'Settings' })}
      closeLabel={t('buttons.closeTooltip', { defaultValue: 'Close' })}
    >
      <TimingSection
        canEditRoundSettings={canEditRoundSettings}
        durationInput={durationInput}
        onUpdateTimingField={onUpdateTimingField}
        onBlurTimingField={onBlurTimingField}
      />
      <PackSection
        activePack={activePack}
        canEditRoundSettings={canEditRoundSettings}
        onActivePackChange={onActivePackChange}
      />
      <LanguageSection
        language={language}
        isLanguagePending={isLanguagePending}
        onLanguageChange={onLanguageChange}
      />
      <ThemeSection theme={theme} onToggleTheme={onToggleTheme} />
    </Sheet>
  );
}
