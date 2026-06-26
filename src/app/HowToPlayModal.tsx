import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/shared/ui/Icon';
import { Sheet } from '@/shared/ui/Sheet';

interface HowToPlayModalProps {
  onClose: () => void;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

export function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  const { t } = useTranslation();
  const gameplayPoints = toStringArray(t('modal.gameplayPoints', { returnObjects: true }));
  const scoringPoints = toStringArray(t('modal.scoringPoints', { returnObjects: true }));
  const featuresList = toStringArray(t('modal.featuresList', { returnObjects: true }));

  return (
    <Sheet
      open={true}
      onClose={onClose}
      title={t('modal.title')}
      closeLabel={t('buttons.closeTooltip', { defaultValue: t('buttons.close') })}
    >
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

      <h3>{t('modal.about')}</h3>
      <ul className="about-links">
        <li>
          <a
            href="https://hasbrogames.com/scattergories"
            target="_blank"
            rel="noopener noreferrer"
            className="about-link"
          >
            <Icon icon={ExternalLink} size={16} />
            {t('modal.officialGame')}
            <span className="sr-only"> {t('modal.opensInNewTab')}</span>
          </a>
        </li>
        <li>
          <a
            href="https://github.com/simonvanlierde/scattergories"
            target="_blank"
            rel="noopener noreferrer"
            className="about-link"
          >
            <Icon icon={ExternalLink} size={16} />
            {t('modal.sourceCode')}
            <span className="sr-only"> {t('modal.opensInNewTab')}</span>
          </a>
        </li>
      </ul>
      <p className="modal-privacy">{t('modal.privacy')}</p>
      <p className="modal-version">{t('modal.version', { version: __APP_VERSION__ })}</p>

      <p className="modal-footer-text">{t('modal.footer')}</p>
    </Sheet>
  );
}
