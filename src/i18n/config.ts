import i18nInstance from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getBootstrapLocaleWarning, resolveLocale } from './localeHealth';
import { FALLBACK_LOCALE } from './localeRegistry';
import { loadLocaleNamespaces } from './locales/resources';

const LANGUAGE_STORAGE_KEY = 'scattergories.language';

function getSavedLanguage(): string {
  return typeof window === 'undefined'
    ? FALLBACK_LOCALE
    : window.localStorage.getItem(LANGUAGE_STORAGE_KEY) || FALLBACK_LOCALE;
}

const savedLanguage = getSavedLanguage();
const resolvedLanguage = resolveLocale(savedLanguage);
const startupLocaleWarning = getBootstrapLocaleWarning(savedLanguage);
const i18n = i18nInstance;
let initPromise: Promise<typeof i18n> | null = null;

function initI18n(): Promise<typeof i18n> {
  if (!initPromise) {
    initPromise = (async () => {
      if (!i18n.isInitialized) {
        await i18n.use(initReactI18next).init({
          resources: {},
          lng: resolvedLanguage,
          fallbackLng: FALLBACK_LOCALE,
          ns: ['translation', 'categories'],
          // biome-ignore lint/style/useNamingConvention: required by i18next config shape.
          defaultNS: 'translation',
          interpolation: {
            escapeValue: false,
          },
        });
      }

      await ensureLanguageLoaded(resolvedLanguage);

      if (typeof window !== 'undefined' && resolvedLanguage !== savedLanguage) {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, resolvedLanguage);
      }

      return i18n;
    })();
  }

  return initPromise;
}

async function ensureLanguageLoaded(language: string): Promise<string> {
  const resolved = resolveLocale(language);

  if (
    i18n.hasResourceBundle(resolved, 'translation') &&
    i18n.hasResourceBundle(resolved, 'categories')
  ) {
    return resolved;
  }

  const namespaces = await loadLocaleNamespaces(resolved);
  i18n.addResourceBundle(resolved, 'translation', namespaces.translation, true, true);
  i18n.addResourceBundle(resolved, 'categories', namespaces.categories, true, true);

  return resolved;
}

function persistLanguage(language: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export {
  ensureLanguageLoaded,
  i18n,
  initI18n,
  LANGUAGE_STORAGE_KEY,
  persistLanguage,
  resolvedLanguage,
  savedLanguage,
  startupLocaleWarning,
};
