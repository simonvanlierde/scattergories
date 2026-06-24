import { Pause, Play, RotateCcw, Settings2, SkipForward, Volume2, VolumeX } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Phase } from '@/domain/game/roundReducer';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/IconButton';

interface ActionBarProps {
  phase: Phase;
  isPaused: boolean;
  isMuted: boolean;
  durationSeconds: number;
  onStart: () => void;
  onPause: () => void;
  onSkip: () => void;
  onReset: () => void;
  onToggleMute: () => void;
  onOpenSettings: () => void;
}

function ControlGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="action-bar__group">
      <legend className="sr-only">{label}</legend>
      {children}
    </fieldset>
  );
}

function RoundTimerButton({
  durationSeconds,
  onClick,
}: {
  durationSeconds: number;
  onClick: () => void;
}) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className="round-timer-pill"
      onClick={onClick}
      aria-label={t('settings.paceLabel', {
        defaultValue: 'Round timer — {{seconds}}s. Tap to change.',
        seconds: durationSeconds,
      })}
    >
      <Icon icon={Settings2} size={16} />
      <span className="round-timer-pill__text">
        {t('settings.pace', {
          defaultValue: '{{seconds}}s',
          seconds: durationSeconds,
        })}
      </span>
    </button>
  );
}

export function ActionBar({
  phase,
  isPaused,
  isMuted,
  durationSeconds,
  onStart,
  onPause,
  onSkip,
  onReset,
  onToggleMute,
  onOpenSettings,
}: ActionBarProps) {
  const { t } = useTranslation();
  const isSpinning = phase === 'spinning';
  const primaryDisabled = isSpinning;
  let primaryLabel = t('buttons.nextRound', { defaultValue: 'Next letter' });
  if (isSpinning) {
    primaryLabel = t('buttons.spinning');
  } else if (phase === 'idle') {
    primaryLabel = t('buttons.startRound');
  }
  const pauseLabel = isPaused ? t('buttons.resume') : t('buttons.pause');
  const muteLabel = isMuted ? t('buttons.unmute') : t('buttons.mute');
  const roundControlsLabel = t('controls.roundGroup', { defaultValue: 'Round controls' });
  const audioControlsLabel = t('controls.audioGroup', { defaultValue: 'Audio controls' });

  return (
    <div className="action-bar">
      <Button
        variant="primary"
        size="lg"
        fullWidth={true}
        onClick={onStart}
        disabled={primaryDisabled}
        leadingIcon={<Icon icon={Play} size={20} />}
      >
        {primaryLabel}
      </Button>

      <div className="action-bar__groups">
        <ControlGroup label={roundControlsLabel}>
          <IconButton
            label={pauseLabel}
            icon={<Icon icon={isPaused ? Play : Pause} size={20} />}
            onClick={onPause}
          />
          <IconButton
            label={t('buttons.skipLetter')}
            icon={<Icon icon={SkipForward} size={20} />}
            onClick={onSkip}
          />
          <IconButton
            label={t('buttons.reset')}
            icon={<Icon icon={RotateCcw} size={20} />}
            onClick={onReset}
            className="action-bar__destructive"
          />
        </ControlGroup>
        <ControlGroup label={t('settings.roundTimerTitle', { defaultValue: 'Round timer' })}>
          <RoundTimerButton durationSeconds={durationSeconds} onClick={onOpenSettings} />
        </ControlGroup>
        <ControlGroup label={audioControlsLabel}>
          <IconButton
            label={muteLabel}
            icon={<Icon icon={isMuted ? VolumeX : Volume2} size={20} />}
            onClick={onToggleMute}
          />
        </ControlGroup>
      </div>
    </div>
  );
}
