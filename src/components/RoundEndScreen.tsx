import { ArrowRight, Flame, Share2, Trophy } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { recordNewlyUnlocked } from '../lib/achievements';
import { vibrate } from '../lib/haptics';
import { shareScore } from '../lib/share';
import {
  projectNextStats,
  readStats,
  recordGameComplete,
  recordRound,
  type Stats,
} from '../lib/stats';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';

const CONFETTI_COUNT = 14;
const CONFETTI_PALETTE = ['lime', 'violet', 'magenta', 'lime', 'magenta', 'violet'] as const;

/* Deterministic fan-out pattern — golden angle gives natural-looking spread. */
const GOLDEN_ANGLE_DEG = 137.5;
const FULL_CIRCLE_DEG = 360;
const HALF_CIRCLE_DEG = 180;
const DEG_TO_RAD = Math.PI / HALF_CIRCLE_DEG;
const CONFETTI_BASE_DIST_PX = 72;
const CONFETTI_DIST_JITTER_PX = 56;
const CONFETTI_DIST_STEP = 31;
const CONFETTI_Y_OFFSET_PX = 12;
const CONFETTI_ROT_STEP_DEG = 71;
const CONFETTI_ROT_MOD = 540;
const CONFETTI_DELAY_STEP_MS = 22;
const CONFETTI_DELAY_BUCKETS = 5;

interface RoundEndScreenProps {
  letter: string;
  roundCount: number;
  totalRounds: number;
  hasMoreRounds: boolean;
  categoriesStruck: number;
  categoriesTotal: number;
  onAdvance: () => void;
  onAchievementsUnlocked?: (ids: string[]) => void;
}

interface StatProps {
  label: string;
  value: string;
  emphasis?: boolean;
}

interface ConfettiPiece {
  id: string;
  color: (typeof CONFETTI_PALETTE)[number];
  style: React.CSSProperties;
}

function buildConfettiStyle(i: number): React.CSSProperties {
  const angleRad = ((i * GOLDEN_ANGLE_DEG) % FULL_CIRCLE_DEG) * DEG_TO_RAD;
  const dist = CONFETTI_BASE_DIST_PX + ((i * CONFETTI_DIST_STEP) % CONFETTI_DIST_JITTER_PX);
  const tx = Math.cos(angleRad) * dist;
  const ty = Math.sin(angleRad) * dist - CONFETTI_Y_OFFSET_PX;
  const rot = (i * CONFETTI_ROT_STEP_DEG) % CONFETTI_ROT_MOD;
  const delay = (i % CONFETTI_DELAY_BUCKETS) * CONFETTI_DELAY_STEP_MS;
  return {
    '--confetti-tx': `${tx.toFixed(1)}px`,
    '--confetti-ty': `${ty.toFixed(1)}px`,
    '--confetti-rot': `${rot}deg`,
    '--confetti-delay': `${delay}ms`,
  } as React.CSSProperties;
}

const CONFETTI_PIECES: readonly ConfettiPiece[] = Array.from(
  { length: CONFETTI_COUNT },
  (_, i) => ({
    id: `confetti-${i}`,
    color: CONFETTI_PALETTE[i % CONFETTI_PALETTE.length],
    style: buildConfettiStyle(i),
  }),
);

function Stat({ label, value, emphasis }: StatProps) {
  return (
    <div className={emphasis ? 'round-end__stat round-end__stat--emphasis' : 'round-end__stat'}>
      <span className="round-end__stat-label">{label}</span>
      <span className="round-end__stat-value">{value}</span>
    </div>
  );
}

function ConfettiBurst() {
  return (
    <div className="round-end__confetti" aria-hidden="true">
      {CONFETTI_PIECES.map((piece) => (
        <span
          key={piece.id}
          className={`round-end__confetti-piece round-end__confetti-piece--${piece.color}`}
          style={piece.style}
        />
      ))}
    </div>
  );
}

interface StatsRecordingOptions {
  letter: string;
  struck: number;
  total: number;
  isGameComplete: boolean;
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
  const { letter, struck, total, isGameComplete, onAchievementsUnlocked } = options;
  /* Projection captured once on mount: shows the stats the just-played round
   * produces, without the strict-mode double-invoke problem of setState-in-effect. */
  const [displayStats] = useState<Stats>(() =>
    projectNextStats(readStats(), { letter, struck, total }, isGameComplete),
  );
  const hasRecordedRef = useRef(false);

  useEffect(() => {
    if (hasRecordedRef.current) {
      return;
    }
    hasRecordedRef.current = true;
    vibrate(isGameComplete ? 'strong' : 'success');
    let latest = recordRound({ letter, struck, total });
    if (isGameComplete) {
      latest = recordGameComplete();
    }
    const unlocked = recordNewlyUnlocked(latest, { struck, total, isGameComplete });
    if (unlocked.length > 0 && onAchievementsUnlocked) {
      onAchievementsUnlocked(unlocked);
    }
  }, [isGameComplete, letter, struck, total, onAchievementsUnlocked]);

  return displayStats;
}

export function RoundEndScreen({
  letter,
  roundCount,
  totalRounds,
  hasMoreRounds,
  categoriesStruck,
  categoriesTotal,
  onAdvance,
  onAchievementsUnlocked,
}: RoundEndScreenProps) {
  const { t } = useTranslation();
  const isGameComplete = !hasMoreRounds;
  const stats = useStatsRecording({
    letter,
    struck: categoriesStruck,
    total: categoriesTotal,
    isGameComplete,
    onAchievementsUnlocked,
  });
  const streak = stats.currentStreakDays;

  return (
    <section
      className="round-end"
      data-complete={isGameComplete}
      aria-label={t('roundEnd.label', { defaultValue: 'Round summary' })}
      data-testid="round-end-screen"
    >
      <ConfettiBurst />
      <div className="round-end__trophy" aria-hidden="true">
        <Icon icon={Trophy} size={32} />
      </div>
      <h2 className="round-end__title">
        {isGameComplete
          ? t('roundEnd.gameComplete', { defaultValue: 'Game complete!' })
          : t('roundEnd.title', { defaultValue: "Time's up!" })}
      </h2>
      <div className="round-end__letter">{letter}</div>
      <div className="round-end__stats">
        <Stat
          label={t('roundEnd.stats.marked', { defaultValue: 'Marked' })}
          value={`${categoriesStruck}/${categoriesTotal}`}
          emphasis={true}
        />
        <Stat
          label={t('roundEnd.stats.round', { defaultValue: 'Round' })}
          value={`${roundCount}/${totalRounds}`}
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
          {isGameComplete
            ? t('roundEnd.playAgain', { defaultValue: 'Play again' })
            : t('roundEnd.nextRound', { defaultValue: 'Next round' })}
        </Button>
        <ShareButton
          label={t('roundEnd.share', { defaultValue: 'Share' })}
          copiedLabel={t('roundEnd.shareCopied', { defaultValue: 'Copied!' })}
          body={t('roundEnd.shareBody', {
            defaultValue: 'Scattergories — letter {{letter}}, {{struck}}/{{total}} marked.',
            letter,
            struck: categoriesStruck,
            total: categoriesTotal,
          })}
        />
      </div>
    </section>
  );
}
