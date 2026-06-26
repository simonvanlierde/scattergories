import { Globe, Moon, Sun, Timer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { durationMax, durationMin } from '@/domain/game/constants';
import { getEnabledLocales, isLocaleEnabled } from '@/i18n/localeHealth';
import { getNativeName, SUPPORTED_LOCALES } from '@/i18n/localeRegistry';
import { Field } from '@/shared/ui/Field';
import { Icon } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/IconButton';
import { Popover } from '@/shared/ui/Popover';

type TimingField = 'durationInput';

interface SettingsClusterProps {
  language: string;
  isLanguagePending: boolean;
  theme: 'light' | 'dark';
  canEditRoundSettings: boolean;
  durationInput: string;
  onLanguageChange: (value: string) => void;
  onToggleTheme: () => void;
  onUpdateTimingField: (field: TimingField, value: string) => void;
  onBlurTimingField: (field: TimingField) => void;
}

function LanguagePicker({
  language,
  isLanguagePending,
  onLanguageChange,
}: Pick<SettingsClusterProps, 'language' | 'isLanguagePending' | 'onLanguageChange'>) {
  const { t } = useTranslation();
  const enabledLocales = getEnabledLocales();

  return (
    <label className="settings-select">
      <span>{t('language.label', { defaultValue: 'Language' })}</span>
      <select
        aria-label={t('language.label', { defaultValue: 'Language' })}
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
  );
}

function TimerField({
  canEditRoundSettings,
  durationInput,
  onUpdateTimingField,
  onBlurTimingField,
}: Pick<
  SettingsClusterProps,
  'canEditRoundSettings' | 'durationInput' | 'onUpdateTimingField' | 'onBlurTimingField'
>) {
  const { t } = useTranslation();
  const lockedHint = canEditRoundSettings
    ? undefined
    : t('settings.lockedHint', { defaultValue: 'Finish or reset the round to edit' });

  return (
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
  );
}

export function SettingsCluster({
  language,
  isLanguagePending,
  theme,
  canEditRoundSettings,
  durationInput,
  onLanguageChange,
  onToggleTheme,
  onUpdateTimingField,
  onBlurTimingField,
}: SettingsClusterProps) {
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  return (
    <div className="settings-cluster">
      <Popover
        icon={Timer}
        label={t('settings.roundTimerTitle', { defaultValue: 'Round timer' })}
        title={t('settings.pace', { defaultValue: '{{seconds}}s', seconds: durationInput })}
      >
        <TimerField
          canEditRoundSettings={canEditRoundSettings}
          durationInput={durationInput}
          onUpdateTimingField={onUpdateTimingField}
          onBlurTimingField={onBlurTimingField}
        />
      </Popover>

      <Popover
        icon={Globe}
        label={t('language.label', { defaultValue: 'Language' })}
        title={getNativeName(language)}
      >
        <LanguagePicker
          language={language}
          isLanguagePending={isLanguagePending}
          onLanguageChange={onLanguageChange}
        />
      </Popover>

      <IconButton
        label={
          isDark
            ? t('theme.switchToLight', { defaultValue: 'Switch to light mode' })
            : t('theme.switchToDark', { defaultValue: 'Switch to dark mode' })
        }
        icon={<Icon icon={isDark ? Sun : Moon} size={20} />}
        onClick={onToggleTheme}
      />
    </div>
  );
}
