import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getBootstrapLocaleWarning, resolveLocale } from './localeHealth';
import { FALLBACK_LOCALE } from './localeRegistry';
import { loadLocaleNamespaces } from './locales/resources';

const savedLanguage = window.localStorage.getItem('scattergories.language') || FALLBACK_LOCALE;
const resolvedLanguage = resolveLocale(savedLanguage);
const startupLocaleWarning = getBootstrapLocaleWarning(savedLanguage);

await i18n.use(initReactI18next).init({
  resources: {},
  lng: resolvedLanguage,
  fallbackLng: FALLBACK_LOCALE,
  ns: ['translation', 'categories'],
  defaultNS: 'translation',
  interpolation: {
    escapeValue: false,
  },
});

await ensureLanguageLoaded(resolvedLanguage);

if (resolvedLanguage !== savedLanguage) {
  window.localStorage.setItem('scattergories.language', resolvedLanguage);
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

export default i18n;
export { ensureLanguageLoaded, resolvedLanguage, savedLanguage, startupLocaleWarning };
