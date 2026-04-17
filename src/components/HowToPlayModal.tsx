import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface HowToPlayModalProps {
  onClose: () => void;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

// biome-ignore lint/style/noDefaultExport: required for React.lazy
export default function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  const { t } = useTranslation();
  const gameplayPoints = toStringArray(t('modal.gameplayPoints', { returnObjects: true }));
  const scoringPoints = toStringArray(t('modal.scoringPoints', { returnObjects: true }));
  const featuresList = toStringArray(t('modal.featuresList', { returnObjects: true }));
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    dialog.showModal();

    function onBackdropClick(event: MouseEvent) {
      if (event.target === dialog && dialog) {
        dialog.close();
      }
    }

    dialog.addEventListener('click', onBackdropClick);
    return () => {
      dialog.removeEventListener('click', onBackdropClick);
      dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="modal-dialog"
      aria-labelledby="how-to-play-title"
      onClose={onClose}
    >
      <div className="modal-content">
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label={t('buttons.close')}
          title={t('buttons.closeTooltip', { defaultValue: t('buttons.close') })}
        >
          {t('buttons.close')}
        </button>
        <h2 id="how-to-play-title">{t('modal.title')}</h2>

        <h3>{t('modal.objective')}</h3>
        <p>{t('modal.objectiveText')}</p>

        <h3>{t('modal.gameplay')}</h3>
        <ol>
          {gameplayPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ol>

        <h3>{t('modal.scoring')}</h3>
        <ul>
          {scoringPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>

        <h3>{t('modal.categories')}</h3>
        <p>{t('modal.categoriesText')}</p>

        <h3>{t('modal.features')}</h3>
        <ul>
          {featuresList.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>

        <p className="modal-footer-text">{t('modal.footer')}</p>
      </div>
    </dialog>
  );
}
