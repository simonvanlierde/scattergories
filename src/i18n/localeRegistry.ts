import registry from './locales/registry.json';

const FALLBACK_LOCALE_VALUE = registry.fallbackLocale;
const SUPPORTED_LOCALES_VALUE = registry.locales as readonly string[];
const LETTERS_BY_LOCALE_VALUE = registry.lettersByLocale as Record<string, string>;
const NATIVE_NAMES_VALUE = registry.nativeNames as Record<string, string>;

function normalizeLocale(locale: string | null | undefined): string {
  if (!locale) {
    return FALLBACK_LOCALE_VALUE;
  }

  return locale.toLowerCase().split('-')[0];
}

/** Normalize, then fall back when the locale isn't supported. */
function resolveLocale(locale: string | null | undefined): string {
  const normalized = normalizeLocale(locale);
  return SUPPORTED_LOCALES_VALUE.includes(normalized) ? normalized : FALLBACK_LOCALE_VALUE;
}

function getLocaleLetters(locale: string | null | undefined): string[] {
  const normalized = normalizeLocale(locale);
  const letters =
    LETTERS_BY_LOCALE_VALUE[normalized] ?? LETTERS_BY_LOCALE_VALUE[FALLBACK_LOCALE_VALUE];
  return Array.from(letters ?? '');
}

function getNativeName(locale: string | null | undefined): string {
  const normalized = normalizeLocale(locale);
  return NATIVE_NAMES_VALUE[normalized] ?? normalized;
}

export const SUPPORTED_LOCALES = SUPPORTED_LOCALES_VALUE;
export const FALLBACK_LOCALE = FALLBACK_LOCALE_VALUE;

export { getLocaleLetters, getNativeName, normalizeLocale, resolveLocale };
