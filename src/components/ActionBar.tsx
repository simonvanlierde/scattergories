import { Pause, Play, RotateCcw, SkipForward, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Phase } from '../game/roundReducer';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { IconButton } from './ui/IconButton';

interface ActionBarProps {
  phase: Phase;
  isPaused: boolean;
  isMuted: boolean;
  roundCount: number;
  hasMoreRounds: boolean;
  onStart: () => void;
  onPause: () => void;
  onSkip: () => void;
  onReset: () => void;
  onNewSession: () => void;
  onToggleMute: () => void;
}

export function ActionBar({
  phase,
  isPaused,
  isMuted,
  roundCount,
  hasMoreRounds,
  onStart,
  onPause,
  onSkip,
  onReset,
  onNewSession,
  onToggleMute,
}: ActionBarProps) {
  const { t } = useTranslation();
  const isSpinning = phase === 'spinning';
  const primaryDisabled = isSpinning || !hasMoreRounds;
  let primaryLabel = t('buttons.nextRound');
  if (isSpinning) {
    primaryLabel = t('buttons.spinning');
  } else if (roundCount === 0) {
    primaryLabel = t('buttons.startRound');
  }
  const pauseLabel = isPaused ? t('buttons.resume') : t('buttons.pause');
  const muteLabel = isMuted ? t('buttons.unmute') : t('buttons.mute');

  return (
    <div className="action-bar">
      <Button
        variant="primary"
        size="lg"
        fullWidth={true}
        onClick={onStart}
        disabled={primaryDisabled}
        leadingIcon={<Icon icon={isSpinning ? Sparkles : Play} size={20} />}
      >
        {primaryLabel}
      </Button>

      <div className="action-bar__rail">
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
        <IconButton
          label={t('buttons.newSession', { defaultValue: 'New Session' })}
          icon={<Icon icon={Sparkles} size={20} />}
          onClick={onNewSession}
        />
        <IconButton
          label={muteLabel}
          icon={<Icon icon={isMuted ? VolumeX : Volume2} size={20} />}
          onClick={onToggleMute}
        />
      </div>
    </div>
  );
}
