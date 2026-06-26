import { Pause, Play, RefreshCw, SkipForward } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Phase } from '@/domain/game/roundReducer';
import { Button } from '@/shared/ui/Button';
import { Icon } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/IconButton';

interface ActionBarProps {
  phase: Phase;
  isPaused: boolean;
  onPrimary: () => void;
  onNewLetter: () => void;
  onNextRound: () => void;
}

function ControlGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="action-bar__group action-bar__group--bare">
      <legend className="sr-only">{label}</legend>
      {children}
    </fieldset>
  );
}

type Translate = ReturnType<typeof useTranslation>['t'];

function resolvePrimary(phase: Phase, isPaused: boolean, t: Translate) {
  if (phase === 'spinning') {
    return { label: t('buttons.spinning'), icon: Play };
  }
  if (phase === 'done') {
    return { label: t('buttons.nextRound', { defaultValue: 'Next round' }), icon: Play };
  }
  if (phase === 'buffer' || phase === 'running') {
    return isPaused
      ? { label: t('buttons.resume'), icon: Play }
      : { label: t('buttons.pause'), icon: Pause };
  }
  return { label: t('buttons.startRound'), icon: Play };
}

export function ActionBar({
  phase,
  isPaused,
  onPrimary,
  onNewLetter,
  onNextRound,
}: ActionBarProps) {
  const { t } = useTranslation();
  const isPausedRound = (phase === 'buffer' || phase === 'running') && isPaused;
  const roundControlsLabel = t('controls.roundGroup', { defaultValue: 'Round controls' });

  // New letter (reroll) — only while paused or in the ready state.
  const showNewLetter = phase === 'ready' || isPausedRound;
  // Next round — while actively running or paused.
  const showNextRound = phase === 'running' || isPausedRound;

  const { label: primaryLabel, icon: primaryIcon } = resolvePrimary(phase, isPaused, t);

  return (
    <div className="action-bar">
      <Button
        variant="primary"
        size="lg"
        className="action-bar__primary"
        onClick={onPrimary}
        disabled={phase === 'spinning'}
        leadingIcon={<Icon icon={primaryIcon} size={20} />}
      >
        {primaryLabel}
      </Button>

      {showNewLetter || showNextRound ? (
        <ControlGroup label={roundControlsLabel}>
          {showNewLetter ? (
            <IconButton
              label={t('buttons.newLetter', { defaultValue: 'New letter' })}
              icon={<Icon icon={RefreshCw} size={20} />}
              onClick={onNewLetter}
            />
          ) : null}
          {showNextRound ? (
            <IconButton
              label={t('buttons.nextRound', { defaultValue: 'Next round' })}
              icon={<Icon icon={SkipForward} size={20} />}
              onClick={onNextRound}
            />
          ) : null}
        </ControlGroup>
      ) : null}
    </div>
  );
}
