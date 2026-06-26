import { Pause, Play, SkipForward, Volume2, VolumeX } from 'lucide-react';
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
  onStart: () => void;
  onPause: () => void;
  onSkip: () => void;
  onToggleMute: () => void;
}

function ControlGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="action-bar__group">
      <legend className="sr-only">{label}</legend>
      {children}
    </fieldset>
  );
}

export function ActionBar({
  phase,
  isPaused,
  isMuted,
  onStart,
  onPause,
  onSkip,
  onToggleMute,
}: ActionBarProps) {
  const { t } = useTranslation();
  const isSpinning = phase === 'spinning';
  const isActiveRound = phase === 'running' || phase === 'buffer';
  const isRoundInProgress = phase !== 'idle' && phase !== 'done';
  const muteLabel = isMuted ? t('buttons.unmute') : t('buttons.mute');
  const roundControlsLabel = t('controls.roundGroup', { defaultValue: 'Round controls' });
  const audioControlsLabel = t('controls.audioGroup', { defaultValue: 'Audio controls' });

  let primaryLabel = t('buttons.nextRound', { defaultValue: 'Next letter' });
  if (isSpinning) {
    primaryLabel = t('buttons.spinning');
  } else if (phase === 'idle') {
    primaryLabel = t('buttons.startRound');
  } else if (isActiveRound) {
    primaryLabel = isPaused ? t('buttons.resume') : t('buttons.pause');
  }

  // During an active round the primary button pauses/resumes; otherwise it
  // starts or advances the round.
  const primaryIcon = isActiveRound && !isPaused ? Pause : Play;
  const onPrimary = isActiveRound ? onPause : onStart;

  return (
    <div className="action-bar">
      <Button
        variant="primary"
        size="lg"
        className="action-bar__primary"
        onClick={onPrimary}
        disabled={isSpinning}
        leadingIcon={<Icon icon={primaryIcon} size={20} />}
      >
        {primaryLabel}
      </Button>

      {isRoundInProgress ? (
        <ControlGroup label={roundControlsLabel}>
          <IconButton
            label={t('buttons.skipLetter')}
            icon={<Icon icon={SkipForward} size={20} />}
            onClick={onSkip}
          />
        </ControlGroup>
      ) : null}
      <ControlGroup label={audioControlsLabel}>
        <IconButton
          label={muteLabel}
          icon={<Icon icon={isMuted ? VolumeX : Volume2} size={20} />}
          onClick={onToggleMute}
        />
      </ControlGroup>
    </div>
  );
}
