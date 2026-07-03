import { useTranslation } from 'react-i18next';
import { cx } from '@/shared/ui/cx';

interface LetterHeroProps {
  letter: string;
  visible: boolean;
  landing: boolean;
}

export function LetterHero({ letter, visible, landing }: LetterHeroProps) {
  const { t } = useTranslation();
  return (
    <div
      className={cx('letter-hero', landing && 'letter-hero--landing')}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="sr-only">{t('round.letterLabel', { defaultValue: 'Current letter' })}</span>
      <span
        data-testid="current-letter"
        aria-hidden={visible ? undefined : true}
        className={cx(
          'letter-hero__glyph',
          !visible && 'letter-hero__glyph--hidden',
          landing && 'letter-hero__glyph--landing',
        )}
        style={{ viewTransitionName: 'letter-hero' }}
      >
        {letter}
      </span>
    </div>
  );
}
