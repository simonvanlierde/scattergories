import { useSyncExternalStore } from 'react';
import { readUnlocked } from '../lib/achievements';

const ACHIEVEMENTS_CHANGE_EVENT = 'scattergories:achievements-change';
const SERVER_SNAPSHOT: ReadonlySet<string> = new Set();

/* Cached so useSyncExternalStore's getSnapshot returns a stable reference
 * between change events. Shared between AchievementsSection and the
 * desktop AppRail so both views stay in sync without polling. */
let cachedUnlocked: ReadonlySet<string> =
  typeof window === 'undefined' ? SERVER_SNAPSHOT : readUnlocked();

function refreshCachedUnlocked(): void {
  cachedUnlocked = readUnlocked();
}

function subscribeUnlocked(onChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }
  const handler = () => {
    refreshCachedUnlocked();
    onChange();
  };
  window.addEventListener('storage', handler);
  window.addEventListener(ACHIEVEMENTS_CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener(ACHIEVEMENTS_CHANGE_EVENT, handler);
  };
}

function getSnapshot(): ReadonlySet<string> {
  return cachedUnlocked;
}

function getServerSnapshot(): ReadonlySet<string> {
  return SERVER_SNAPSHOT;
}

export function useUnlockedAchievements(): ReadonlySet<string> {
  return useSyncExternalStore(subscribeUnlocked, getSnapshot, getServerSnapshot);
}
