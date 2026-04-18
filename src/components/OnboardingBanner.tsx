import type { LucideIcon } from 'lucide-react';
import { ArrowRight, CheckCircle2, Play, Sparkles, Timer, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { IconButton } from './ui/IconButton';

interface OnboardingBannerProps {
  onDismiss: () => void;
}

interface OnboardingStep {
  id: string;
  icon: LucideIcon;
  titleKey: string;
  fallbackTitle: string;
  bodyKey: string;
  fallbackBody: string;
}

const STEPS: readonly OnboardingStep[] = Object.freeze([
  {
    id: 'roll',
    icon: Sparkles,
    titleKey: 'onboarding.steps.roll.title',
    fallbackTitle: 'Roll a letter',
    bodyKey: 'onboarding.steps.roll.body',
    fallbackBody: 'Hit Start to spin up a random letter for the round.',
  },
  {
    id: 'beat',
    icon: Timer,
    titleKey: 'onboarding.steps.beat.title',
    fallbackTitle: 'Beat the clock',
    bodyKey: 'onboarding.steps.beat.body',
    fallbackBody: 'Call out an answer for each category before time runs out.',
  },
  {
    id: 'mark',
    icon: CheckCircle2,
    titleKey: 'onboarding.steps.mark.title',
    fallbackTitle: 'Mark what you got',
    bodyKey: 'onboarding.steps.mark.body',
    fallbackBody: 'Tap a category to strike it through as you go.',
  },
]);

export function OnboardingBanner({ onDismiss }: OnboardingBannerProps) {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const onNext = () => {
    if (isLast) {
      onDismiss();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  return (
    <section
      className="onboarding"
      aria-label={t('onboarding.label', { defaultValue: 'Getting started' })}
      data-testid="onboarding-banner"
    >
      <div className="onboarding__icon" aria-hidden="true">
        <Icon icon={step.icon} size={24} />
      </div>
      <div className="onboarding__copy">
        <h2 className="onboarding__title">
          {t(step.titleKey, { defaultValue: step.fallbackTitle })}
        </h2>
        <p className="onboarding__body">{t(step.bodyKey, { defaultValue: step.fallbackBody })}</p>
        <ol
          className="onboarding__dots"
          aria-label={t('onboarding.progress', { defaultValue: 'Progress' })}
        >
          {STEPS.map((s, i) => (
            <li
              key={s.id}
              className={
                i === stepIndex ? 'onboarding__dot onboarding__dot--active' : 'onboarding__dot'
              }
              aria-current={i === stepIndex ? 'step' : undefined}
            />
          ))}
        </ol>
      </div>
      <div className="onboarding__actions">
        <IconButton
          label={t('onboarding.dismiss', { defaultValue: 'Got it' })}
          icon={<Icon icon={X} size={18} />}
          onClick={onDismiss}
        />
        <Button
          variant="primary"
          onClick={onNext}
          trailingIcon={<Icon icon={isLast ? Play : ArrowRight} size={18} />}
        >
          {isLast
            ? t('onboarding.letsPlay', { defaultValue: "Let's play" })
            : t('onboarding.next', { defaultValue: 'Next' })}
        </Button>
      </div>
    </section>
  );
}
