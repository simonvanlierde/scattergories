import { useCallback, useSyncExternalStore } from 'react';
import { CAT_COUNT_DEFAULT, DURATION_DEFAULT, ROUNDS_DEFAULT } from '../game/constants';

type CategoryMode = 'default' | 'custom' | 'mixed';
type Theme = 'light' | 'dark';

interface Settings {
  durationInput: string;
  catCountInput: string;
  totalRoundsInput: string;
  categoryMode: CategoryMode;
  customCategories: string[];
  isMuted: boolean;
  theme: Theme;
}

const STORAGE_KEY = 'scattergories.settings.v1';

function preferredTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

const defaults = (): Settings => ({
  durationInput: String(DURATION_DEFAULT),
  catCountInput: String(CAT_COUNT_DEFAULT),
  totalRoundsInput: String(ROUNDS_DEFAULT),
  categoryMode: 'default',
  customCategories: [],
  isMuted: false,
  theme: preferredTheme(),
});

function parseStored(raw: string | null): Settings {
  const fallback = defaults();
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const merged: Settings = { ...fallback };

    if (typeof parsed.durationInput === 'string') {
      merged.durationInput = parsed.durationInput;
    }
    if (typeof parsed.catCountInput === 'string') {
      merged.catCountInput = parsed.catCountInput;
    }
    if (typeof parsed.totalRoundsInput === 'string') {
      merged.totalRoundsInput = parsed.totalRoundsInput;
    }
    if (
      parsed.categoryMode === 'default' ||
      parsed.categoryMode === 'custom' ||
      parsed.categoryMode === 'mixed'
    ) {
      merged.categoryMode = parsed.categoryMode;
    }
    if (Array.isArray(parsed.customCategories)) {
      const sanitized = parsed.customCategories
        .map((entry) => String(entry).trim())
        .filter((entry) => entry.length > 0);
      merged.customCategories = Array.from(new Set(sanitized));
    }
    if (typeof parsed.isMuted === 'boolean') {
      merged.isMuted = parsed.isMuted;
    }
    if (parsed.theme === 'light' || parsed.theme === 'dark') {
      merged.theme = parsed.theme;
    }

    return merged;
  } catch {
    return fallback;
  }
}

// External store for settings
let currentSettings = parseStored(
  typeof window === 'undefined' ? null : window.localStorage.getItem(STORAGE_KEY),
);

const listeners = new Set<() => void>();

const settingsStore = {
  subscribe(onStoreChange: () => void) {
    listeners.add(onStoreChange);
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageEvent);
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', this.handleThemeEvent);
    }
    return () => {
      listeners.delete(onStoreChange);
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', this.handleStorageEvent);
        window
          .matchMedia('(prefers-color-scheme: dark)')
          .removeEventListener('change', this.handleThemeEvent);
      }
    };
  },

  getSnapshot() {
    return currentSettings;
  },

  getServerSnapshot() {
    return defaults();
  },

  handleStorageEvent(event: StorageEvent) {
    if (event.key === STORAGE_KEY) {
      currentSettings = parseStored(event.newValue);
      for (const listener of listeners) {
        listener();
      }
    }
  },

  handleThemeEvent(event: MediaQueryListEvent) {
    const newTheme: Theme = event.matches ? 'dark' : 'light';
    const prevOsTheme: Theme = event.matches ? 'light' : 'dark';
    if (currentSettings.theme === prevOsTheme) {
      settingsStore.updateSettings({ ...currentSettings, theme: newTheme });
    }
  },

  updateSettings(next: Settings) {
    if (next === currentSettings) {
      return;
    }
    currentSettings = next;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    for (const listener of listeners) {
      listener();
    }
  },

  reset() {
    currentSettings = parseStored(
      typeof window === 'undefined' ? null : window.localStorage.getItem(STORAGE_KEY),
    );
    for (const listener of listeners) {
      listener();
    }
  },
};

function useSettings() {
  const settings = useSyncExternalStore(
    settingsStore.subscribe.bind(settingsStore),
    settingsStore.getSnapshot,
    settingsStore.getServerSnapshot,
  );

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    settingsStore.updateSettings({ ...currentSettings, [key]: value });
  }, []);

  const addCustomCategory = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return;
    }
    if (currentSettings.customCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }
    settingsStore.updateSettings({
      ...currentSettings,
      customCategories: [...currentSettings.customCategories, trimmed],
    });
  }, []);

  const removeCustomCategory = useCallback((category: string) => {
    settingsStore.updateSettings({
      ...currentSettings,
      customCategories: currentSettings.customCategories.filter((c) => c !== category),
    });
  }, []);

  return { settings, update, addCustomCategory, removeCustomCategory };
}

export type { CategoryMode, Settings, Theme };
export { settingsStore, useSettings };
