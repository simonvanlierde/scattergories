import {
  bufferSecondsDefault,
  bufferSecondsMax,
  bufferSecondsMin,
  catCountDefault,
  catCountMax,
  catCountMin,
  categories,
  durationDefault,
  durationMax,
  durationMin,
} from '@/domain/game/constants';
import { clampInt } from '@/domain/game/utils';
import { CLASSIC_PACK_ID, getPackCategories } from '@/shared/lib/categoryPacks';

type PromptDeckPreference = 'auto' | 'open' | 'collapsed';
type Theme = 'light' | 'dark';

interface Settings {
  durationInput: string;
  catCountInput: string;
  bufferSecondsInput: string;
  /** Built-in category keys currently in the deck. */
  deckBuiltins: string[];
  /** Custom categories — always in the deck, shown on top. */
  customCategories: string[];
  /** Pinned category names (custom or built-in) — always drawn each round. */
  pinned: string[];
  isMuted: boolean;
  theme: Theme;
  promptDeckPreference: PromptDeckPreference;
}

const SETTINGS_STORAGE_KEY = 'scattergories.settings.v1';

type NumericFieldName = 'durationInput' | 'catCountInput' | 'bufferSecondsInput';

const NUMERIC_FIELD_BOUNDS: Record<
  NumericFieldName,
  { min: number; max: number; fallback: number }
> = {
  durationInput: { min: durationMin, max: durationMax, fallback: durationDefault },
  catCountInput: { min: catCountMin, max: catCountMax, fallback: catCountDefault },
  bufferSecondsInput: {
    min: bufferSecondsMin,
    max: bufferSecondsMax,
    fallback: bufferSecondsDefault,
  },
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
    bufferSecondsInput: String(bufferSecondsDefault),
    deckBuiltins: [...categories],
    customCategories: [],
    pinned: [],
    isMuted: false,
    theme: getPreferredTheme(),
    promptDeckPreference: 'auto',
  };
}

function sanitizeStrings(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const sanitized = value.map((entry) => String(entry).trim()).filter((entry) => entry.length > 0);

  return Array.from(new Set(sanitized));
}

/** Back-compat alias used by SettingsProvider. */
const sanitizeCustomCategories = sanitizeStrings;

/** Keep only built-in keys that actually exist in the current category set. */
function sanitizeBuiltins(value: unknown): string[] {
  const known = new Set(categories);
  return sanitizeStrings(value).filter((name) => known.has(name));
}

interface LegacySettings {
  includePackCategories?: unknown;
  activePack?: unknown;
}

function migrateDeckBuiltins(parsed: Partial<Settings> & LegacySettings): string[] {
  if (Array.isArray(parsed.deckBuiltins)) {
    return sanitizeBuiltins(parsed.deckBuiltins);
  }
  // Migrate from the old activePack + includePackCategories model.
  if (typeof parsed.includePackCategories === 'boolean') {
    if (!parsed.includePackCategories) {
      return [];
    }
    const packId = typeof parsed.activePack === 'string' ? parsed.activePack : CLASSIC_PACK_ID;
    return sanitizeBuiltins(getPackCategories(packId, categories));
  }
  return [...categories];
}

function sanitizeSettings(raw: unknown): Settings {
  const fallback = getDefaultSettings();

  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const parsed = raw as Partial<Settings> & LegacySettings;
  const customCategories = sanitizeStrings(parsed.customCategories);
  const deckBuiltins = migrateDeckBuiltins(parsed);
  const inDeck = new Set<string>([...customCategories, ...deckBuiltins]);
  // Old model pinned customs implicitly; new model persists an explicit pin list.
  const pinned = (
    Array.isArray(parsed.pinned) ? sanitizeStrings(parsed.pinned) : customCategories
  ).filter((name) => inDeck.has(name));

  return {
    durationInput:
      typeof parsed.durationInput === 'string' ? parsed.durationInput : fallback.durationInput,
    catCountInput:
      typeof parsed.catCountInput === 'string' ? parsed.catCountInput : fallback.catCountInput,
    bufferSecondsInput:
      typeof parsed.bufferSecondsInput === 'string'
        ? parsed.bufferSecondsInput
        : fallback.bufferSecondsInput,
    deckBuiltins,
    customCategories,
    pinned,
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

export type { NumericFieldName, PromptDeckPreference, Settings, Theme };
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
