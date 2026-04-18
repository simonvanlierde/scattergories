import { useSyncExternalStore } from 'react';
import { makeEmpty, readStats, type Stats } from '../lib/stats';

const STATS_CHANGE_EVENT = 'scattergories:stats-change';
const SERVER_SNAPSHOT: Stats = makeEmpty();

/* Cached so useSyncExternalStore's getSnapshot returns a stable reference
 * between change events — otherwise React loops. Mirrors the pattern used by
 * AchievementsSection for the unlocked set. */
let cachedSnapshot: Stats = typeof window === 'undefined' ? SERVER_SNAPSHOT : readStats();

function refreshCachedSnapshot(): void {
  cachedSnapshot = readStats();
}

function subscribeStats(onChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }
  const handler = () => {
    refreshCachedSnapshot();
    onChange();
  };
  window.addEventListener('storage', handler);
  window.addEventListener(STATS_CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener(STATS_CHANGE_EVENT, handler);
  };
}

function getSnapshot(): Stats {
  return cachedSnapshot;
}

function getServerSnapshot(): Stats {
  return SERVER_SNAPSHOT;
}

export function useStatsSnapshot(): Stats {
  return useSyncExternalStore(subscribeStats, getSnapshot, getServerSnapshot);
}
