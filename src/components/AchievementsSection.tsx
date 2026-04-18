import type { LucideIcon } from 'lucide-react';
import { Award, Flame, Keyboard, Sparkles, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUnlockedAchievements } from '../hooks/useUnlockedAchievements';
import { ACHIEVEMENTS } from '../lib/achievements';
import { Icon } from './ui/Icon';

const ICON_BY_ID: Record<string, LucideIcon> = {
  'first-round': Sparkles,
  'full-sweep': Trophy,
  'week-warrior': Flame,
  'alphabet-hunter': Keyboard,
  veteran: Award,
};

export function AchievementsSection() {
  const { t } = useTranslation();
  const unlocked = useUnlockedAchievements();
  const total = ACHIEVEMENTS.length;
  const unlockedCount = ACHIEVEMENTS.reduce(
    (count, achievement) => (unlocked.has(achievement.id) ? count + 1 : count),
    0,
  );

  return (
    <section className="settings-section" aria-labelledby="settings-achievements">
      <div className="settings-section__header">
        <h3 id="settings-achievements" className="settings-section__title">
          {t('settings.achievementsTitle', { defaultValue: 'Achievements' })}
        </h3>
        <span className="settings-section__count" aria-hidden="true">
          {`${unlockedCount}/${total}`}
        </span>
      </div>
      <ul className="achievements-list">
        {ACHIEVEMENTS.map((achievement) => {
          const isUnlocked = unlocked.has(achievement.id);
          const LucideIconComponent = ICON_BY_ID[achievement.id] ?? Award;
          return (
            <li
              key={achievement.id}
              className={`achievement${isUnlocked ? ' achievement--unlocked' : ' achievement--locked'}`}
            >
              <span className="achievement__icon" aria-hidden="true">
                <Icon icon={LucideIconComponent} size={20} />
              </span>
              <span className="achievement__body">
                <span className="achievement__title">
                  {t(achievement.labelKey, { defaultValue: achievement.fallbackLabel })}
                </span>
                <span className="achievement__description">
                  {t(achievement.descriptionKey, { defaultValue: achievement.fallbackDescription })}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
