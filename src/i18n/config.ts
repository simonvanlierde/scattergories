import i18nInstance from "i18next";
import { initReactI18next } from "react-i18next";
import { safeStorage } from "@/shared/lib/safeStorage";
import { FALLBACK_LOCALE, resolveLocale } from "./localeRegistry";
import { loadLocaleNamespaces } from "./locales/resources";

const LANGUAGE_STORAGE_KEY = "scattergories.language";

function getSavedLanguage(): string {
  const stored = safeStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored) {
    return stored;
  }
  // Nothing chosen yet: start from the browser's language when it is one we ship.
  return typeof navigator === "undefined" ? FALLBACK_LOCALE : resolveLocale(navigator.language);
}

const savedLanguage = getSavedLanguage();
const resolvedLanguage = resolveLocale(savedLanguage);
const i18n = i18nInstance;
let initPromise: Promise<typeof i18n> | null = null;

function initI18n(): Promise<typeof i18n> {
  if (!initPromise) {
    initPromise = (async () => {
      if (!i18n.isInitialized) {
        // Keep <html lang> in sync so screen readers pronounce category words
        // in the active locale, not always English. Fires on init and on every
        // changeLanguage, so all callers are covered from one place.
        i18n.on("languageChanged", (lng) => {
          document.documentElement.lang = lng;
        });
        await i18n.use(initReactI18next).init({
          resources: {},
          lng: resolvedLanguage,
          fallbackLng: FALLBACK_LOCALE,
          ns: ["translation", "categories"],
          defaultNS: "translation",
          interpolation: {
            escapeValue: false,
          },
        });
      }

      let activeLanguage = resolvedLanguage;
      try {
        await ensureLanguageLoaded(resolvedLanguage);
      } catch {
        // A missing locale chunk must not boot into a blank UI: fall back to
        // English and overwrite the stored choice so the next launch is clean.
        activeLanguage = FALLBACK_LOCALE;
        await i18n.changeLanguage(FALLBACK_LOCALE);
      }

      if (activeLanguage !== savedLanguage) {
        safeStorage.setItem(LANGUAGE_STORAGE_KEY, activeLanguage);
      }

      return i18n;
    })();
  }

  return initPromise;
}

async function ensureLanguageLoaded(language: string): Promise<string> {
  const resolved = resolveLocale(language);

  if (
    i18n.hasResourceBundle(resolved, "translation") &&
    i18n.hasResourceBundle(resolved, "categories")
  ) {
    return resolved;
  }

  const namespaces = await loadLocaleNamespaces(resolved);
  i18n.addResourceBundle(resolved, "translation", namespaces.translation, true, true);
  i18n.addResourceBundle(resolved, "categories", namespaces.categories, true, true);

  return resolved;
}

function persistLanguage(language: string): void {
  safeStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export { ensureLanguageLoaded, i18n, initI18n, persistLanguage };
