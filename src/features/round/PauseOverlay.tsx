import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/shared/ui/Icon';

interface PauseOverlayProps {
  onResume: () => void;
}

export function PauseOverlay({ onResume }: PauseOverlayProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className="pause-overlay"
      onClick={onResume}
      aria-label={t('pause.resumeLabel', { defaultValue: 'Paused — tap to resume' })}
    >
      <span className="pause-overlay__card" aria-hidden="true">
        <span className="pause-overlay__icon">
          <Icon icon={Play} size={40} />
        </span>
        <span className="pause-overlay__title">{t('pause.title', { defaultValue: 'Paused' })}</span>
        <span className="pause-overlay__hint">
          {t('pause.hint', { defaultValue: 'Tap anywhere to resume' })}
        </span>
      </span>
    </button>
  );
}
