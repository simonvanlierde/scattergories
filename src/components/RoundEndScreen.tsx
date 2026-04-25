import { ArrowRight, Flame, Share2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { recordNewlyUnlocked } from '../lib/achievements';
import { vibrate } from '../lib/haptics';
import { shareScore } from '../lib/share';
import { projectNextStats, readStats, recordRound, type Stats } from '../lib/stats';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';

interface RoundEndScreenProps {
  letter: string;
  roundCount: number;
  totalRounds: number;
  hasMoreRounds: boolean;
  onAdvance: () => void;
  onAchievementsUnlocked?: (ids: string[]) => void;
}

interface StatProps {
  label: string;
  value: string;
  emphasis?: boolean;
}

function Stat({ label, value, emphasis }: StatProps) {
  return (
    <div className={emphasis ? 'round-end__stat round-end__stat--emphasis' : 'round-end__stat'}>
      <span className="round-end__stat-label">{label}</span>
      <span className="round-end__stat-value">{value}</span>
    </div>
  );
}

interface StatsRecordingOptions {
  letter: string;
  isSessionComplete: boolean;
  onAchievementsUnlocked?: (ids: string[]) => void;
}

const SHARE_STATUS_RESET_MS = 2200;

interface ShareButtonProps {
  label: string;
  copiedLabel: string;
  body: string;
}

function ShareButton({ label, copiedLabel, body }: ShareButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  const onClick = useCallback(() => {
    const shareUrl = typeof window === 'undefined' ? undefined : window.location.href;
    shareScore({ title: 'Scattergories', text: body, url: shareUrl })
      .then((result) => {
        if (!result.ok) {
          setStatus('failed');
          window.setTimeout(() => setStatus('idle'), SHARE_STATUS_RESET_MS);
          return;
        }
        if (result.method === 'clipboard') {
          setStatus('copied');
          window.setTimeout(() => setStatus('idle'), SHARE_STATUS_RESET_MS);
        }
      })
      .catch(() => setStatus('failed'));
  }, [body]);

  return (
    <Button
      variant="secondary"
      size="lg"
      fullWidth={true}
      onClick={onClick}
      leadingIcon={<Icon icon={Share2} size={18} />}
      aria-live="polite"
    >
      {status === 'copied' ? copiedLabel : label}
    </Button>
  );
}

function useStatsRecording(options: StatsRecordingOptions): Stats {
  const { letter, isSessionComplete, onAchievementsUnlocked } = options;
  /* Projection captured once on mount: shows the stats the just-played round
   * produces, without the strict-mode double-invoke problem of setState-in-effect. */
  const [displayStats] = useState<Stats>(() =>
    projectNextStats(readStats(), { letter }, isSessionComplete),
  );
  const hasRecordedRef = useRef(false);

  useEffect(() => {
    if (hasRecordedRef.current) {
      return;
    }
    hasRecordedRef.current = true;
    vibrate(isSessionComplete ? 'strong' : 'success');
    const latest = recordRound({ letter }, isSessionComplete);
    const unlocked = recordNewlyUnlocked(latest, { isSessionComplete });
    if (unlocked.length > 0 && onAchievementsUnlocked) {
      onAchievementsUnlocked(unlocked);
    }
  }, [isSessionComplete, letter, onAchievementsUnlocked]);

  return displayStats;
}

export function RoundEndScreen({
  letter,
  roundCount,
  totalRounds,
  hasMoreRounds,
  onAdvance,
  onAchievementsUnlocked,
}: RoundEndScreenProps) {
  const { t } = useTranslation();
  const isSessionComplete = !hasMoreRounds;
  const stats = useStatsRecording({
    letter,
    isSessionComplete,
    onAchievementsUnlocked,
  });
  const streak = stats.currentStreakDays;

  return (
    <section
      className="round-end"
      data-complete={isSessionComplete}
      aria-label={t('roundEnd.label', { defaultValue: 'Round summary' })}
      data-testid="round-end-screen"
    >
      <h2 className="round-end__title">
        {isSessionComplete
          ? t('roundEnd.gameComplete', { defaultValue: 'Session complete' })
          : t('roundEnd.title', { defaultValue: 'Time is up' })}
      </h2>
      <div className="round-end__letter">{letter}</div>
      <div className="round-end__stats">
        <Stat
          label={t('roundEnd.stats.round', { defaultValue: 'Round' })}
          value={`${roundCount}/${totalRounds}`}
          emphasis={true}
        />
        <Stat
          label={t('roundEnd.stats.sessions', { defaultValue: 'Sessions' })}
          value={String(stats.sessionsPlayed)}
        />
        {streak > 1 ? (
          <div className="round-end__stat round-end__stat--streak">
            <span className="round-end__stat-label">
              <Icon icon={Flame} size={12} />
              {t('roundEnd.stats.streak', { defaultValue: 'Streak' })}
            </span>
            <span className="round-end__stat-value">{streak}</span>
          </div>
        ) : null}
      </div>
      <div className="round-end__actions">
        <Button
          variant="primary"
          size="lg"
          fullWidth={true}
          onClick={onAdvance}
          trailingIcon={<Icon icon={ArrowRight} size={20} />}
        >
          {isSessionComplete
            ? t('roundEnd.playAgain', { defaultValue: 'New session' })
            : t('roundEnd.nextRound', { defaultValue: 'Next round' })}
        </Button>
        <ShareButton
          label={t('roundEnd.share', { defaultValue: 'Share' })}
          copiedLabel={t('roundEnd.shareCopied', { defaultValue: 'Copied' })}
          body={t('roundEnd.shareBody', {
            defaultValue: 'Scattergories — letter {{letter}}, round {{round}} of {{totalRounds}}.',
            letter,
            round: roundCount,
            totalRounds,
          })}
        />
      </div>
    </section>
  );
}
