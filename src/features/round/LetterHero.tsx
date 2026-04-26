import { useTranslation } from 'react-i18next';

interface LetterHeroProps {
  letter: string;
  visible: boolean;
  landing: boolean;
}

function joinClassNames(...tokens: (string | false | null | undefined)[]): string {
  return tokens.filter(Boolean).join(' ');
}

export function LetterHero({ letter, visible, landing }: LetterHeroProps) {
  const { t } = useTranslation();
  return (
    <div
      className={joinClassNames('letter-hero', landing && 'letter-hero--landing')}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="sr-only">{t('round.letterLabel', { defaultValue: 'Current letter' })}</span>
      <span
        data-testid="current-letter"
        aria-hidden={visible ? undefined : true}
        className={joinClassNames(
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
