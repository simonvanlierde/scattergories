import { setupI18n } from "@lingui/core";
import { safeStorage } from "@/shared/lib/safeStorage";
import { FALLBACK_LOCALE, resolveLocale } from "./localeRegistry";
import { loadLocaleMessages } from "./locales/resources";

const LANGUAGE_STORAGE_KEY = "scattergories.language";

function getSavedLanguage(): string {
  const stored = safeStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored) {
    return stored;
  }
  return typeof navigator === "undefined" ? FALLBACK_LOCALE : resolveLocale(navigator.language);
}

const savedLanguage = getSavedLanguage();
const resolvedLanguage = resolveLocale(savedLanguage);
const i18n = setupI18n();
const loadedLanguages = new Set<string>();
let initPromise: Promise<typeof i18n> | null = null;

i18n.on("change", () => {
  document.documentElement.lang = i18n.locale;
});

function initI18n(): Promise<typeof i18n> {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await ensureLanguageLoaded(resolvedLanguage);
        i18n.activate(resolvedLanguage);
        if (resolvedLanguage !== savedLanguage) {
          persistLanguage(resolvedLanguage);
        }
      } catch {
        // Keep the saved choice after a failed locale download so the next launch retries it.
        await ensureLanguageLoaded(FALLBACK_LOCALE);
        i18n.activate(FALLBACK_LOCALE);
      }
      return i18n;
    })();
  }
  return initPromise;
}

async function ensureLanguageLoaded(language: string): Promise<string> {
  const resolved = resolveLocale(language);
  if (!loadedLanguages.has(resolved)) {
    i18n.load(resolved, await loadLocaleMessages(resolved));
    loadedLanguages.add(resolved);
  }
  return resolved;
}

function persistLanguage(language: string): void {
  safeStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export { ensureLanguageLoaded, i18n, initI18n, persistLanguage, resolvedLanguage as bootLanguage };
