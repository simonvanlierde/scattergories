import { useTranslation } from 'react-i18next';

interface RoundEndProps {
  letter: string;
}

export function RoundEnd({ letter }: RoundEndProps) {
  const { t } = useTranslation();

  return (
    <section className="round-end" data-complete="true">
      <p className="round-end__title">{t('roundEnd.title')}</p>
      <span className="round-end__letter" aria-hidden="true">
        {letter}
      </span>
    </section>
  );
}
