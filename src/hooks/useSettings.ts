import { useCallback, useEffect, useState } from 'react';

export type CategoryMode = 'default' | 'custom' | 'mixed';
export type Theme = 'light' | 'dark';

export interface Settings {
  durationInput: string;
  catCountInput: string;
  totalRoundsInput: string;
  categoryMode: CategoryMode;
  customCategories: string[];
  isMuted: boolean;
  theme: Theme;
}

const STORAGE_KEY = 'scattegories.settings.v1';

function preferredTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

const defaults = (): Settings => ({
  durationInput: '90',
  catCountInput: '12',
  totalRoundsInput: '3',
  categoryMode: 'default',
  customCategories: [],
  isMuted: false,
  theme: preferredTheme(),
});

function parseStored(raw: string | null, fallback: Settings): Settings {
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
    window.localStorage.removeItem(STORAGE_KEY);
    return fallback;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() =>
    parseStored(window.localStorage.getItem(STORAGE_KEY), defaults()),
  );

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const addCustomCategory = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return;
    }
    setSettings((prev) => {
      if (prev.customCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return { ...prev, customCategories: [...prev.customCategories, trimmed] };
    });
  }, []);

  const removeCustomCategory = useCallback((category: string) => {
    setSettings((prev) => ({
      ...prev,
      customCategories: prev.customCategories.filter((c) => c !== category),
    }));
  }, []);

  return { settings, update, addCustomCategory, removeCustomCategory };
}
