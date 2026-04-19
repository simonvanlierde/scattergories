import {
  catCountDefault,
  catCountMax,
  catCountMin,
  durationDefault,
  durationMax,
  durationMin,
  roundsDefault,
  roundsMax,
  roundsMin,
} from '../game/constants';
import { clampInt } from '../game/utils';
import { CLASSIC_PACK_ID, isValidPackId } from '../lib/categoryPacks';

type CategoryMode = 'default' | 'custom' | 'mixed';
type PromptDeckPreference = 'auto' | 'open' | 'collapsed';
type Theme = 'light' | 'dark';

interface Settings {
  durationInput: string;
  catCountInput: string;
  totalRoundsInput: string;
  categoryMode: CategoryMode;
  activePack: string;
  customCategories: string[];
  isMuted: boolean;
  theme: Theme;
  promptDeckPreference: PromptDeckPreference;
}

const SETTINGS_STORAGE_KEY = 'scattergories.settings.v1';

type NumericFieldName = 'durationInput' | 'catCountInput' | 'totalRoundsInput';

const NUMERIC_FIELD_BOUNDS: Record<
  NumericFieldName,
  { min: number; max: number; fallback: number }
> = {
  durationInput: { min: durationMin, max: durationMax, fallback: durationDefault },
  catCountInput: { min: catCountMin, max: catCountMax, fallback: catCountDefault },
  totalRoundsInput: { min: roundsMin, max: roundsMax, fallback: roundsDefault },
};

function sanitizeNumericField(field: NumericFieldName, value: string): string {
  const { min, max, fallback } = NUMERIC_FIELD_BOUNDS[field];
  return String(clampInt(value, min, max, fallback));
}

function getPreferredTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getDefaultSettings(): Settings {
  return {
    durationInput: String(durationDefault),
    catCountInput: String(catCountDefault),
    totalRoundsInput: String(roundsDefault),
    categoryMode: 'default',
    activePack: CLASSIC_PACK_ID,
    customCategories: [],
    isMuted: false,
    theme: getPreferredTheme(),
    promptDeckPreference: 'auto',
  };
}

function sanitizeCustomCategories(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const sanitized = value.map((entry) => String(entry).trim()).filter((entry) => entry.length > 0);

  return Array.from(new Set(sanitized));
}

function sanitizeSettings(raw: unknown): Settings {
  const fallback = getDefaultSettings();

  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const parsed = raw as Partial<Settings>;

  return {
    durationInput:
      typeof parsed.durationInput === 'string' ? parsed.durationInput : fallback.durationInput,
    catCountInput:
      typeof parsed.catCountInput === 'string' ? parsed.catCountInput : fallback.catCountInput,
    totalRoundsInput:
      typeof parsed.totalRoundsInput === 'string'
        ? parsed.totalRoundsInput
        : fallback.totalRoundsInput,
    categoryMode:
      parsed.categoryMode === 'default' ||
      parsed.categoryMode === 'custom' ||
      parsed.categoryMode === 'mixed'
        ? parsed.categoryMode
        : fallback.categoryMode,
    activePack:
      typeof parsed.activePack === 'string' && isValidPackId(parsed.activePack)
        ? parsed.activePack
        : fallback.activePack,
    customCategories: sanitizeCustomCategories(parsed.customCategories),
    isMuted: typeof parsed.isMuted === 'boolean' ? parsed.isMuted : fallback.isMuted,
    theme: parsed.theme === 'light' || parsed.theme === 'dark' ? parsed.theme : fallback.theme,
    promptDeckPreference:
      parsed.promptDeckPreference === 'open' ||
      parsed.promptDeckPreference === 'collapsed' ||
      parsed.promptDeckPreference === 'auto'
        ? parsed.promptDeckPreference
        : fallback.promptDeckPreference,
  };
}

function parseStoredSettings(raw: string | null): Settings {
  if (!raw) {
    return getDefaultSettings();
  }

  try {
    return sanitizeSettings(JSON.parse(raw));
  } catch {
    return getDefaultSettings();
  }
}

function readStoredSettings(): Settings {
  if (typeof window === 'undefined') {
    return getDefaultSettings();
  }

  return parseStoredSettings(window.localStorage.getItem(SETTINGS_STORAGE_KEY));
}

function serializeSettings(settings: Settings): string {
  return JSON.stringify(settings);
}

export type { CategoryMode, NumericFieldName, PromptDeckPreference, Settings, Theme };
export {
  getDefaultSettings,
  getPreferredTheme,
  parseStoredSettings,
  readStoredSettings,
  SETTINGS_STORAGE_KEY,
  sanitizeCustomCategories,
  sanitizeNumericField,
  sanitizeSettings,
  serializeSettings,
};
