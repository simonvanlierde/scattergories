import { useTranslation } from 'react-i18next';

interface HowToPlayModalProps {
  onClose: () => void;
}

export function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  const { t } = useTranslation();
  const gameplayPoints = t('modal.gameplayPoints', { returnObjects: true }) as string[];
  const scoringPoints = t('modal.scoringPoints', { returnObjects: true }) as string[];
  const featuresList = t('modal.featuresList', { returnObjects: true }) as string[];

  return (
    <div className="modal-overlay">
      <button
        type="button"
        className="modal-backdrop"
        aria-label={t('buttons.close')}
        onClick={onClose}
      />
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-play-title"
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label={t('buttons.close')}
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
    </div>
  );
}
