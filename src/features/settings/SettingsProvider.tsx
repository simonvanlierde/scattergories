import { createContext, type PropsWithChildren, useContext, useEffect, useReducer } from 'react';
import { categories } from '@/domain/game/constants';
import { getPackCategories } from '@/shared/lib/categoryPacks';
import { safeStorage } from '@/shared/lib/safeStorage';
import {
  DARK_SCHEME_QUERY,
  readStoredSettings,
  SETTINGS_STORAGE_KEY,
  type Settings,
  sanitizeCustomCategories,
  type Theme,
} from './schema';

type SettingsAction =
  | { type: 'hydrate'; settings: Settings }
  | { type: 'update'; key: keyof Settings; value: Settings[keyof Settings] }
  | { type: 'syncSystemTheme'; theme: Theme }
  | { type: 'addCustom'; value: string }
  | { type: 'removeCustom'; value: string }
  | { type: 'togglePin'; name: string }
  | { type: 'togglePinAll'; names: string[] }
  | { type: 'addPack'; packId: string }
  | { type: 'removeBuiltin'; name: string }
  | { type: 'removeAllCustom' }
  | { type: 'removeAllBuiltins' };

interface SettingsContextValue {
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  addCustom: (raw: string) => void;
  removeCustom: (category: string) => void;
  togglePin: (name: string) => void;
  togglePinAll: (names: string[]) => void;
  addPack: (packId: string) => void;
  removeBuiltin: (name: string) => void;
  removeAllCustom: () => void;
  removeAllBuiltins: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/** Pin every drawn name, or unpin them all if they are already pinned. */
function applyTogglePinAll(state: Settings, names: string[]): Settings {
  const inDeck = names.filter(
    (name) => state.customCategories.includes(name) || state.deckBuiltins.includes(name),
  );
  if (inDeck.length === 0) {
    return state;
  }
  if (inDeck.every((name) => state.pinned.includes(name))) {
    const removal = new Set(inDeck);
    return { ...state, pinned: state.pinned.filter((entry) => !removal.has(entry)) };
  }
  return { ...state, pinned: [...new Set([...state.pinned, ...inDeck])] };
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: a reducer switch over the action types; the cases are already flat and per-case extraction would scatter the state logic.
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: same reason — a flat switch reads as one table, not nested control flow.
function settingsReducer(state: Settings, action: SettingsAction): Settings {
  switch (action.type) {
    case 'hydrate':
      return action.settings;

    case 'update': {
      const next = { ...state, [action.key]: action.value };
      // An explicit theme pick stops the app from following the OS afterward.
      return action.key === 'theme' ? { ...next, themeSource: 'user' } : next;
    }

    case 'syncSystemTheme':
      // Only follow the OS while the user hasn't overridden the theme.
      return state.themeSource === 'system' ? { ...state, theme: action.theme } : state;

    case 'addCustom': {
      const trimmed = action.value.trim();
      if (!trimmed) {
        return state;
      }
      if (state.customCategories.some((entry) => entry.toLowerCase() === trimmed.toLowerCase())) {
        return state;
      }
      return {
        ...state,
        customCategories: sanitizeCustomCategories([...state.customCategories, trimmed]),
        // Custom categories are pinned by default.
        pinned: state.pinned.includes(trimmed) ? state.pinned : [...state.pinned, trimmed],
      };
    }

    case 'removeCustom':
      return {
        ...state,
        customCategories: state.customCategories.filter((entry) => entry !== action.value),
        pinned: state.pinned.filter((entry) => entry !== action.value),
      };

    case 'togglePin': {
      const inDeck =
        state.customCategories.includes(action.name) || state.deckBuiltins.includes(action.name);
      if (!inDeck) {
        return state;
      }
      return {
        ...state,
        pinned: state.pinned.includes(action.name)
          ? state.pinned.filter((entry) => entry !== action.name)
          : [...state.pinned, action.name],
      };
    }

    case 'togglePinAll':
      return applyTogglePinAll(state, action.names);

    case 'addPack': {
      const packKeys = getPackCategories(action.packId, categories);
      const merged = Array.from(new Set([...state.deckBuiltins, ...packKeys]));
      return { ...state, deckBuiltins: merged };
    }

    case 'removeBuiltin':
      return {
        ...state,
        deckBuiltins: state.deckBuiltins.filter((entry) => entry !== action.name),
        pinned: state.pinned.filter((entry) => entry !== action.name),
      };

    case 'removeAllCustom': {
      const customSet = new Set(state.customCategories);
      return {
        ...state,
        customCategories: [],
        pinned: state.pinned.filter((entry) => !customSet.has(entry)),
      };
    }

    case 'removeAllBuiltins': {
      const builtinSet = new Set(state.deckBuiltins);
      return {
        ...state,
        deckBuiltins: [],
        pinned: state.pinned.filter((entry) => !builtinSet.has(entry)),
      };
    }

    default:
      return state;
  }
}

function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, dispatch] = useReducer(settingsReducer, undefined, readStoredSettings);

  useEffect(() => {
    safeStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== SETTINGS_STORAGE_KEY) {
        return;
      }

      dispatch({ type: 'hydrate', settings: readStoredSettings() });
    }

    function onThemeChange(event: MediaQueryListEvent) {
      // The reducer ignores this while the user has picked a theme explicitly.
      dispatch({ type: 'syncSystemTheme', theme: event.matches ? 'dark' : 'light' });
    }

    const mediaQuery = window.matchMedia(DARK_SCHEME_QUERY);

    window.addEventListener('storage', onStorage);
    mediaQuery.addEventListener('change', onThemeChange);

    return () => {
      window.removeEventListener('storage', onStorage);
      mediaQuery.removeEventListener('change', onThemeChange);
    };
  }, []);

  const value: SettingsContextValue = {
    settings,
    update: (key, actionValue) => {
      dispatch({ type: 'update', key, value: actionValue });
    },
    addCustom: (raw) => dispatch({ type: 'addCustom', value: raw }),
    removeCustom: (category) => dispatch({ type: 'removeCustom', value: category }),
    togglePin: (name) => dispatch({ type: 'togglePin', name }),
    togglePinAll: (names) => dispatch({ type: 'togglePinAll', names }),
    addPack: (packId) => dispatch({ type: 'addPack', packId }),
    removeBuiltin: (name) => dispatch({ type: 'removeBuiltin', name }),
    removeAllCustom: () => dispatch({ type: 'removeAllCustom' }),
    removeAllBuiltins: () => dispatch({ type: 'removeAllBuiltins' }),
  };

  return <SettingsContext value={value}>{children}</SettingsContext>;
}

function useSettings() {
  const value = useContext(SettingsContext);

  if (!value) {
    throw new Error('useSettings must be used inside SettingsProvider');
  }

  return value;
}

function resetSettingsToStorage(): Settings {
  return readStoredSettings();
}

export { resetSettingsToStorage, SettingsProvider, useSettings };
