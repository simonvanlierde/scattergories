import { useTranslation } from 'react-i18next';

interface RoundEndProps {
  letter: string;
  categoriesCount: number;
  roundsPlayed: number;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="round-end__stat">
      <span className="round-end__stat-label">{label}</span>
      <span className="round-end__stat-value">{value}</span>
    </div>
  );
}

export function RoundEnd({ letter, categoriesCount, roundsPlayed }: RoundEndProps) {
  const { t } = useTranslation();

  return (
    <section className="round-end" data-complete="true">
      <p className="round-end__title">{t('roundEnd.title', { defaultValue: 'Round over' })}</p>
      <span className="round-end__letter" aria-hidden="true">
        {letter}
      </span>
      <div className="round-end__stats">
        <Stat
          label={t('roundEnd.categories', { defaultValue: 'Categories' })}
          value={categoriesCount}
        />
        <Stat label={t('roundEnd.rounds', { defaultValue: 'Rounds' })} value={roundsPlayed} />
      </div>
    </section>
  );
}
