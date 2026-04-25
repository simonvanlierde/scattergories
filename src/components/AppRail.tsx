import type { LucideIcon } from 'lucide-react';
import {
  Award,
  Flame,
  Gamepad2,
  HelpCircle,
  RotateCcw,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStatsSnapshot } from '../hooks/useStatsSnapshot';
import { useUnlockedAchievements } from '../hooks/useUnlockedAchievements';
import { ACHIEVEMENTS } from '../lib/achievements';
import { BrandMark } from './ui/BrandMark';
import { Icon } from './ui/Icon';
import { IconButton } from './ui/IconButton';

interface AppRailProps {
  onOpenSettings: () => void;
  onOpenAchievements: () => void;
  onOpenHowToPlay: () => void;
  onOpenShortcuts: () => void;
}

interface StatTileProps {
  label: string;
  value: string;
  icon: LucideIcon;
}

function StatTile({ label, value, icon }: StatTileProps) {
  return (
    <div className="rail-stat">
      <span className="rail-stat__icon" aria-hidden="true">
        <Icon icon={icon} size={16} />
      </span>
      <span className="rail-stat__label">{label}</span>
      <span className="rail-stat__value">{value}</span>
    </div>
  );
}

function RailStats() {
  const { t } = useTranslation();
  const stats = useStatsSnapshot();

  return (
    <section className="app-rail__section" aria-labelledby="rail-stats-title">
      <h2 id="rail-stats-title" className="app-rail__section-title">
        {t('rail.stats.title', { defaultValue: 'Your stats' })}
      </h2>
      <div className="app-rail__stats">
        <StatTile
          icon={Gamepad2}
          label={t('rail.stats.sessions', { defaultValue: 'Sessions' })}
          value={String(stats.sessionsPlayed)}
        />
        <StatTile
          icon={Flame}
          label={t('rail.stats.streak', { defaultValue: 'Streak' })}
          value={String(stats.currentStreakDays)}
        />
        <StatTile
          icon={RotateCcw}
          label={t('rail.stats.rounds', { defaultValue: 'Rounds' })}
          value={String(stats.roundsPlayed)}
        />
      </div>
    </section>
  );
}

interface AchievementsTileProps {
  onOpenAchievements: () => void;
}

function AchievementsTile({ onOpenAchievements }: AchievementsTileProps) {
  const { t } = useTranslation();
  const unlocked = useUnlockedAchievements();
  const total = ACHIEVEMENTS.length;

  return (
    <button
      type="button"
      className="rail-tile rail-tile--achievements"
      onClick={onOpenAchievements}
    >
      <span className="rail-tile__icon" aria-hidden="true">
        <Icon icon={Award} size={18} />
      </span>
      <span className="rail-tile__label">
        {t('rail.achievements.title', { defaultValue: 'Achievements' })}
      </span>
      <span className="rail-tile__badge" aria-live="polite">
        {`${unlocked.size}/${total}`}
      </span>
    </button>
  );
}

export function AppRail({
  onOpenSettings,
  onOpenAchievements,
  onOpenHowToPlay,
  onOpenShortcuts,
}: AppRailProps) {
  const { t } = useTranslation();

  return (
    <aside className="app-rail" aria-label={t('rail.label', { defaultValue: 'Side rail' })}>
      <div className="app-rail__brand">
        <BrandMark size={32} title={t('title')} />
        <h1 className="app-rail__brand-wordmark">{t('title')}</h1>
      </div>

      <RailStats />

      <AchievementsTile onOpenAchievements={onOpenAchievements} />

      <div className="app-rail__actions">
        <IconButton
          label={t('settings.openLabel', { defaultValue: 'Settings' })}
          icon={<Icon icon={SettingsIcon} size={20} />}
          onClick={onOpenSettings}
        />
        <IconButton
          label={t('footer.howToPlay', { defaultValue: 'How to Play' })}
          icon={<Icon icon={HelpCircle} size={20} />}
          onClick={onOpenHowToPlay}
        />
      </div>

      <button type="button" className="app-rail__shortcuts-trigger" onClick={onOpenShortcuts}>
        {t('rail.shortcuts.hint', { defaultValue: 'Keyboard shortcuts · ?' })}
      </button>
    </aside>
  );
}
