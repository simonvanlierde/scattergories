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
} from "@/domain/game/constants";
import { clampInt } from "@/domain/game/utils";
import { CLASSIC_PACK_ID, getPackCategories } from "@/shared/lib/categoryPacks";
import { safeStorage } from "@/shared/lib/safeStorage";

type PromptDeckPreference = "auto" | "open" | "collapsed";
type Theme = "light" | "dark";
/** Whether the current theme follows the OS ('system') or was picked explicitly ('user'). */
type ThemeSource = "system" | "user";

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
  /** When true, letters are drawn without repeats until the alphabet is exhausted. */
  avoidRepeats: boolean;
  theme: Theme;
  themeSource: ThemeSource;
  promptDeckPreference: PromptDeckPreference;
}

const SETTINGS_STORAGE_KEY = "scattergories.settings.v1";
const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

function getPreferredTheme(): Theme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }

  return window.matchMedia(DARK_SCHEME_QUERY).matches ? "dark" : "light";
}

/** Clamp a stored numeric-input string into range so a bad value from another tab can't slip through. */
function sanitizeNumericInput(value: unknown, min: number, max: number, fallback: number): string {
  return typeof value === "string" ? String(clampInt(value, min, max, fallback)) : String(fallback);
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
    avoidRepeats: true,
    theme: getPreferredTheme(),
    themeSource: "system",
    promptDeckPreference: "auto",
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
  if (typeof parsed.includePackCategories === "boolean") {
    if (!parsed.includePackCategories) {
      return [];
    }
    const packId = typeof parsed.activePack === "string" ? parsed.activePack : CLASSIC_PACK_ID;
    return sanitizeBuiltins(getPackCategories(packId, categories));
  }
  return [...categories];
}

function sanitizeSettings(raw: unknown): Settings {
  const fallback = getDefaultSettings();

  if (!raw || typeof raw !== "object") {
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
    durationInput: sanitizeNumericInput(
      parsed.durationInput,
      durationMin,
      durationMax,
      durationDefault,
    ),
    catCountInput: sanitizeNumericInput(
      parsed.catCountInput,
      catCountMin,
      catCountMax,
      catCountDefault,
    ),
    bufferSecondsInput: sanitizeNumericInput(
      parsed.bufferSecondsInput,
      bufferSecondsMin,
      bufferSecondsMax,
      bufferSecondsDefault,
    ),
    deckBuiltins,
    customCategories,
    pinned,
    isMuted: typeof parsed.isMuted === "boolean" ? parsed.isMuted : fallback.isMuted,
    avoidRepeats:
      typeof parsed.avoidRepeats === "boolean" ? parsed.avoidRepeats : fallback.avoidRepeats,
    theme: parsed.theme === "light" || parsed.theme === "dark" ? parsed.theme : fallback.theme,
    themeSource: parsed.themeSource === "user" ? "user" : "system",
    promptDeckPreference:
      parsed.promptDeckPreference === "open" ||
      parsed.promptDeckPreference === "collapsed" ||
      parsed.promptDeckPreference === "auto"
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
  return parseStoredSettings(safeStorage.getItem(SETTINGS_STORAGE_KEY));
}

export type { PromptDeckPreference, Settings, Theme, ThemeSource };
export {
  DARK_SCHEME_QUERY,
  getDefaultSettings,
  getPreferredTheme,
  parseStoredSettings,
  readStoredSettings,
  SETTINGS_STORAGE_KEY,
  sanitizeCustomCategories,
  sanitizeSettings,
};
