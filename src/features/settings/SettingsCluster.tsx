import { Check, Globe, Moon, Sun, Timer, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  bufferSecondsMax,
  bufferSecondsMin,
  durationMax,
  durationMin,
} from '@/domain/game/constants';
import { getEnabledLocales, isLocaleEnabled } from '@/i18n/localeHealth';
import { getNativeName, SUPPORTED_LOCALES } from '@/i18n/localeRegistry';
import { Field } from '@/shared/ui/Field';
import { Icon } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/IconButton';
import { Popover } from '@/shared/ui/Popover';

type TimingField = 'durationInput' | 'bufferSecondsInput';

interface SettingsClusterProps {
  language: string;
  isLanguagePending: boolean;
  theme: 'light' | 'dark';
  isMuted: boolean;
  durationInput: string;
  bufferSecondsInput: string;
  onLanguageChange: (value: string) => void;
  onToggleTheme: () => void;
  onToggleMute: () => void;
  onUpdateTimingField: (field: TimingField, value: string) => void;
  onBlurTimingField: (field: TimingField) => void;
}

function LanguageMenu({
  language,
  isLanguagePending,
  onSelect,
}: Pick<SettingsClusterProps, 'language' | 'isLanguagePending'> & {
  onSelect: (code: string) => void;
}) {
  const { t } = useTranslation();
  const enabledLocales = getEnabledLocales();

  return (
    <div
      className="lang-menu"
      role="menu"
      aria-label={t('language.label', { defaultValue: 'Language' })}
    >
      {SUPPORTED_LOCALES.map((code) => {
        const available = enabledLocales.includes(code) && isLocaleEnabled(code);
        const selected = code === language;
        return (
          <button
            key={code}
            type="button"
            role="menuitemradio"
            aria-checked={selected}
            data-locale={code}
            className="lang-menu__item"
            disabled={!available || isLanguagePending}
            onClick={() => onSelect(code)}
          >
            <span>{getNativeName(code)}</span>
            {selected ? <Icon icon={Check} size={16} /> : null}
          </button>
        );
      })}
    </div>
  );
}

function TimingFields({
  durationInput,
  bufferSecondsInput,
  onUpdateTimingField,
  onBlurTimingField,
}: Pick<
  SettingsClusterProps,
  'durationInput' | 'bufferSecondsInput' | 'onUpdateTimingField' | 'onBlurTimingField'
>) {
  const { t } = useTranslation();

  return (
    <div className="timing-fields">
      <Field
        className="ds-field--inline"
        id="duration"
        label={t('settings.duration')}
        type="number"
        inputMode="numeric"
        value={durationInput}
        min={durationMin}
        max={durationMax}
        suffix="s"
        onChange={(event) => onUpdateTimingField('durationInput', event.target.value)}
        onBlur={() => onBlurTimingField('durationInput')}
      />
      <Field
        className="ds-field--inline"
        id="getReady"
        label={t('settings.getReady', { defaultValue: 'Get ready' })}
        type="number"
        inputMode="numeric"
        value={bufferSecondsInput}
        min={bufferSecondsMin}
        max={bufferSecondsMax}
        suffix="s"
        onChange={(event) => onUpdateTimingField('bufferSecondsInput', event.target.value)}
        onBlur={() => onBlurTimingField('bufferSecondsInput')}
      />
    </div>
  );
}

export function SettingsCluster({
  language,
  isLanguagePending,
  theme,
  isMuted,
  durationInput,
  bufferSecondsInput,
  onLanguageChange,
  onToggleTheme,
  onToggleMute,
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
        <TimingFields
          durationInput={durationInput}
          bufferSecondsInput={bufferSecondsInput}
          onUpdateTimingField={onUpdateTimingField}
          onBlurTimingField={onBlurTimingField}
        />
      </Popover>

      <Popover
        icon={Globe}
        label={t('language.label', { defaultValue: 'Language' })}
        title={getNativeName(language)}
      >
        {(close) => (
          <LanguageMenu
            language={language}
            isLanguagePending={isLanguagePending}
            onSelect={(code) => {
              onLanguageChange(code);
              close();
            }}
          />
        )}
      </Popover>

      <IconButton
        label={isMuted ? t('buttons.unmute') : t('buttons.mute')}
        icon={<Icon icon={isMuted ? VolumeX : Volume2} size={20} />}
        aria-pressed={isMuted}
        onClick={onToggleMute}
      />

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
