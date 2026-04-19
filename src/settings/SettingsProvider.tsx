import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import {
  readStoredSettings,
  SETTINGS_STORAGE_KEY,
  type Settings,
  sanitizeCustomCategories,
  serializeSettings,
} from './schema';

type SettingsAction =
  | { type: 'hydrate'; settings: Settings }
  | { type: 'update'; key: keyof Settings; value: Settings[keyof Settings] }
  | { type: 'addCustomCategory'; value: string }
  | { type: 'removeCustomCategory'; value: string };

interface SettingsContextValue {
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  addCustomCategory: (raw: string) => void;
  removeCustomCategory: (category: string) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function settingsReducer(state: Settings, action: SettingsAction): Settings {
  switch (action.type) {
    case 'hydrate':
      return action.settings;

    case 'update':
      return { ...state, [action.key]: action.value };

    case 'addCustomCategory': {
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
      };
    }

    case 'removeCustomCategory':
      return {
        ...state,
        customCategories: state.customCategories.filter((entry) => entry !== action.value),
      };

    default:
      return state;
  }
}

function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, dispatch] = useReducer(settingsReducer, undefined, readStoredSettings);

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, serializeSettings(settings));
  }, [settings]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== SETTINGS_STORAGE_KEY) {
        return;
      }

      dispatch({ type: 'hydrate', settings: readStoredSettings() });
    }

    function onThemeChange(event: MediaQueryListEvent) {
      const nextTheme = event.matches ? 'dark' : 'light';
      const previousSystemTheme = nextTheme === 'dark' ? 'light' : 'dark';

      if (settings.theme === previousSystemTheme) {
        dispatch({ type: 'update', key: 'theme', value: nextTheme });
      }
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    window.addEventListener('storage', onStorage);
    mediaQuery.addEventListener('change', onThemeChange);

    return () => {
      window.removeEventListener('storage', onStorage);
      mediaQuery.removeEventListener('change', onThemeChange);
    };
  }, [settings.theme]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      update: (key, actionValue) => {
        dispatch({ type: 'update', key, value: actionValue });
      },
      addCustomCategory: (raw) => {
        dispatch({ type: 'addCustomCategory', value: raw });
      },
      removeCustomCategory: (category) => {
        dispatch({ type: 'removeCustomCategory', value: category });
      },
    }),
    [settings],
  );

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
  const stored = readStoredSettings();

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, serializeSettings(stored));
  }

  return stored;
}

export { resetSettingsToStorage, SettingsProvider, useSettings };
