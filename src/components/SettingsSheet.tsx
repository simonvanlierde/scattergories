import { Moon, Sun } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { durationMax, durationMin, roundsMax, roundsMin } from '../game/constants';
import { getEnabledLocales, isLocaleEnabled } from '../i18n/localeHealth';
import { getNativeName, SUPPORTED_LOCALES } from '../i18n/localeRegistry';
import { PACKS } from '../lib/categoryPacks';
import { AchievementsSection } from './AchievementsSection';
import { Button } from './ui/Button';
import { Field } from './ui/Field';
import { Icon } from './ui/Icon';
import { Sheet } from './ui/Sheet';

type SessionField = 'durationInput' | 'totalRoundsInput';
type SettingsScrollTarget = 'achievements';

const SCROLL_TARGET_ID: Record<SettingsScrollTarget, string> = {
  achievements: 'settings-achievements',
};

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  language: string;
  isLanguagePending: boolean;
  theme: 'light' | 'dark';
  canEditSession: boolean;
  durationInput: string;
  totalRoundsInput: string;
  activePack: string;
  scrollTo?: SettingsScrollTarget;
  onLanguageChange: (value: string) => void;
  onToggleTheme: () => void;
  onUpdateSessionField: (field: SessionField, value: string) => void;
  onBlurSessionField: (field: SessionField) => void;
  onActivePackChange: (packId: string) => void;
}

interface PackSectionProps {
  activePack: string;
  canEditSession: boolean;
  onActivePackChange: (packId: string) => void;
}

function PackSection({ activePack, canEditSession, onActivePackChange }: PackSectionProps) {
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
          disabled={!canEditSession}
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

interface SessionSectionProps {
  canEditSession: boolean;
  durationInput: string;
  totalRoundsInput: string;
  onUpdateSessionField: (field: SessionField, value: string) => void;
  onBlurSessionField: (field: SessionField) => void;
}

function SessionSection({
  canEditSession,
  durationInput,
  totalRoundsInput,
  onUpdateSessionField,
  onBlurSessionField,
}: SessionSectionProps) {
  const { t } = useTranslation();
  const lockedHint = canEditSession
    ? undefined
    : t('settings.lockedHint', { defaultValue: 'Finish or reset the round to edit' });

  return (
    <section className="settings-section" aria-labelledby="settings-session">
      <h3 id="settings-session" className="settings-section__title">
        {t('settings.sessionTitle', { defaultValue: 'Round pace' })}
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
          disabled={!canEditSession}
          suffix={t('status.seconds')}
          helper={lockedHint}
          onChange={(event) => onUpdateSessionField('durationInput', event.target.value)}
          onBlur={() => onBlurSessionField('durationInput')}
        />
        <Field
          id="totalRounds"
          label={t('settings.rounds')}
          type="number"
          inputMode="numeric"
          value={totalRoundsInput}
          min={roundsMin}
          max={roundsMax}
          disabled={!canEditSession}
          onChange={(event) => onUpdateSessionField('totalRoundsInput', event.target.value)}
          onBlur={() => onBlurSessionField('totalRoundsInput')}
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
        leadingIcon={<Icon icon={isDark ? Sun : Moon} size={18} />}
      >
        {isDark
          ? t('theme.light', { defaultValue: 'Light mode' })
          : t('theme.dark', { defaultValue: 'Dark mode' })}
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
  canEditSession,
  durationInput,
  totalRoundsInput,
  activePack,
  scrollTo,
  onLanguageChange,
  onToggleTheme,
  onUpdateSessionField,
  onBlurSessionField,
  onActivePackChange,
}: SettingsSheetProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!(open && scrollTo)) {
      return;
    }
    const id = SCROLL_TARGET_ID[scrollTo];
    const rafId = window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [open, scrollTo]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('settings.sheetTitle', { defaultValue: 'Settings' })}
      closeLabel={t('buttons.closeTooltip', { defaultValue: 'Close' })}
    >
      <SessionSection
        canEditSession={canEditSession}
        durationInput={durationInput}
        totalRoundsInput={totalRoundsInput}
        onUpdateSessionField={onUpdateSessionField}
        onBlurSessionField={onBlurSessionField}
      />
      <PackSection
        activePack={activePack}
        canEditSession={canEditSession}
        onActivePackChange={onActivePackChange}
      />
      <LanguageSection
        language={language}
        isLanguagePending={isLanguagePending}
        onLanguageChange={onLanguageChange}
      />
      <ThemeSection theme={theme} onToggleTheme={onToggleTheme} />
      <AchievementsSection />
    </Sheet>
  );
}
