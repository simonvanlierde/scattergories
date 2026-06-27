import { Check, Globe, Moon, Sun, Timer, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  bufferSecondsDefault,
  bufferSecondsMax,
  bufferSecondsMin,
  durationDefault,
  durationMax,
  durationMin,
} from '@/domain/game/constants';
import { clampInt } from '@/domain/game/utils';
import { getEnabledLocales, isLocaleEnabled } from '@/i18n/localeHealth';
import { getNativeName, SUPPORTED_LOCALES } from '@/i18n/localeRegistry';
import { useDebouncedCommit } from '@/shared/lib/useDebouncedCommit';
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

interface NumericTimingFieldProps {
  field: TimingField;
  id: string;
  label: string;
  value: string;
  min: number;
  max: number;
  fallback: number;
  onCommit: (field: TimingField, value: string) => void;
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: self-contained debounced numeric input; the draft/commit/flush-on-unmount logic is one cohesive unit.
function NumericTimingField({
  field,
  id,
  label,
  value,
  min,
  max,
  fallback,
  onCommit,
}: NumericTimingFieldProps) {
  const [draft, setDraft] = useState(value);
  const isFocusedRef = useRef(false);

  // Reflect external changes to the prop while the user is not editing.
  useEffect(() => {
    if (!isFocusedRef.current) {
      setDraft(value);
    }
  }, [value]);

  const commit = useCallback(
    (raw: string) => {
      onCommit(field, String(clampInt(raw, min, max, fallback)));
    },
    [onCommit, field, min, max, fallback],
  );

  const { schedule, cancel } = useDebouncedCommit(commit);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setDraft(next);
      schedule(next);
    },
    [schedule],
  );

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
    cancel();
    const clamped = String(clampInt(draft, min, max, fallback));
    setDraft(clamped);
    onCommit(field, clamped);
  }, [cancel, draft, min, max, fallback, onCommit, field]);

  // Enter commits (by blurring the field).
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  }, []);

  // Flush a pending edit if the field unmounts before onBlur fires — e.g. the
  // popover is closed by an outside click while the input still has focus.
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const valueRef = useRef(value);
  valueRef.current = value;
  const flushRef = useRef<() => void>(() => undefined);
  flushRef.current = () => {
    cancel();
    const clamped = String(clampInt(draftRef.current, min, max, fallback));
    if (clamped !== valueRef.current) {
      onCommit(field, clamped);
    }
  };
  useEffect(() => () => flushRef.current(), []);

  return (
    <Field
      className="ds-field--inline"
      id={id}
      label={label}
      type="number"
      inputMode="numeric"
      value={draft}
      min={min}
      max={max}
      suffix="s"
      onFocus={() => {
        isFocusedRef.current = true;
      }}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}

function TimingFields({
  durationInput,
  bufferSecondsInput,
  onUpdateTimingField,
}: Pick<SettingsClusterProps, 'durationInput' | 'bufferSecondsInput' | 'onUpdateTimingField'>) {
  const { t } = useTranslation();

  return (
    <div className="timing-fields">
      <NumericTimingField
        field="durationInput"
        id="duration"
        label={t('settings.duration')}
        value={durationInput}
        min={durationMin}
        max={durationMax}
        fallback={durationDefault}
        onCommit={onUpdateTimingField}
      />
      <NumericTimingField
        field="bufferSecondsInput"
        id="getReady"
        label={t('settings.getReady', { defaultValue: 'Get ready' })}
        value={bufferSecondsInput}
        min={bufferSecondsMin}
        max={bufferSecondsMax}
        fallback={bufferSecondsDefault}
        onCommit={onUpdateTimingField}
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
