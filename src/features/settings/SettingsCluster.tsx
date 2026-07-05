import { Check, Globe, Moon, Sun, Timer, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  bufferSecondsDefault,
  bufferSecondsMax,
  bufferSecondsMin,
  durationDefault,
  durationMax,
  durationMin,
} from '@/domain/game/constants';
import { getNativeName, SUPPORTED_LOCALES } from '@/i18n/localeRegistry';
import { DebouncedNumberField } from '@/shared/ui/DebouncedNumberField';
import { Icon } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/IconButton';
import { Popover } from '@/shared/ui/Popover';

type TimingField = 'durationInput' | 'bufferSecondsInput';

interface SettingsClusterProps {
  language: string;
  isLanguagePending: boolean;
  theme: 'light' | 'dark';
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

function LanguageMenu({
  language,
  isLanguagePending,
  onSelect,
}: Pick<SettingsClusterProps, 'language' | 'isLanguagePending'> & {
  onSelect: (code: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="lang-menu" role="menu" aria-label={t('language.label')}>
      {SUPPORTED_LOCALES.map((code) => {
        const selected = code === language;
        return (
          <button
            key={code}
            type="button"
            role="menuitemradio"
            aria-checked={selected}
            data-locale={code}
            className="lang-menu__item"
            disabled={isLanguagePending}
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
  avoidRepeats,
  onUpdateTimingField,
  onToggleAvoidRepeats,
}: Pick<
  SettingsClusterProps,
  | 'durationInput'
  | 'bufferSecondsInput'
  | 'avoidRepeats'
  | 'onUpdateTimingField'
  | 'onToggleAvoidRepeats'
>) {
  const { t } = useTranslation();

  return (
    <div className="timing-fields">
      <DebouncedNumberField
        id="duration"
        label={t('settings.duration')}
        value={durationInput}
        min={durationMin}
        max={durationMax}
        fallback={durationDefault}
        suffix="s"
        onCommit={(value) => onUpdateTimingField('durationInput', value)}
      />
      <DebouncedNumberField
        id="getReady"
        label={t('settings.getReady')}
        value={bufferSecondsInput}
        min={bufferSecondsMin}
        max={bufferSecondsMax}
        fallback={bufferSecondsDefault}
        suffix="s"
        onCommit={(value) => onUpdateTimingField('bufferSecondsInput', value)}
      />
      <label className="settings-toggle">
        <input type="checkbox" checked={avoidRepeats} onChange={onToggleAvoidRepeats} />
        <span>{t('settings.avoidRepeats')}</span>
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
  const isDark = theme === 'dark';

  return (
    <div className="settings-cluster">
      <Popover
        icon={Timer}
        label={t('settings.roundTimerTitle')}
        title={t('settings.pace', { seconds: durationInput })}
      >
        <TimingFields
          durationInput={durationInput}
          bufferSecondsInput={bufferSecondsInput}
          avoidRepeats={avoidRepeats}
          onUpdateTimingField={onUpdateTimingField}
          onToggleAvoidRepeats={onToggleAvoidRepeats}
        />
      </Popover>

      <Popover icon={Globe} label={t('language.label')} title={getNativeName(language)}>
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
        label={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
        icon={<Icon icon={isDark ? Sun : Moon} size={20} />}
        onClick={onToggleTheme}
      />
    </div>
  );
}
