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
    return { label: t('buttons.nextRound'), icon: Play };
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
  const roundControlsLabel = t('controls.roundGroup');

  // New letter (reroll) — during the get-ready countdown (no answers written yet)
  // and while paused. Never mid-play, where it would wipe in-progress answers.
  const showNewLetter = phase === 'buffer' || isPausedRound;
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

      {/* Always rendered so the layout never shifts — disabled (greyed) when the
          action isn't available in the current phase. */}
      <ControlGroup label={roundControlsLabel}>
        <IconButton
          label={t('buttons.newLetter')}
          icon={<Icon icon={RefreshCw} size={20} />}
          disabled={!showNewLetter}
          onClick={onNewLetter}
        />
        <IconButton
          label={t('buttons.nextRound')}
          icon={<Icon icon={SkipForward} size={20} />}
          disabled={!showNextRound}
          onClick={onNextRound}
        />
      </ControlGroup>
    </div>
  );
}
