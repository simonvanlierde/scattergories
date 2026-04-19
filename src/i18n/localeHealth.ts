import { getLocaleWeightManifest } from '../game/localeWeights';
import { FALLBACK_LOCALE, normalizeLocale, SUPPORTED_LOCALES } from './localeRegistry';
import { hasLocaleResources } from './locales/resources';

interface LocaleHealth {
  locale: string;
  normalizedLocale: string;
  isSupported: boolean;
  hasResources: boolean;
  hasLetterWeights: boolean;
  isComplete: boolean;
  disabledReason: string | null;
}

function buildHealth(locale: string): LocaleHealth {
  const normalizedLocale = normalizeLocale(locale);
  const isSupported = SUPPORTED_LOCALES.includes(normalizedLocale);
  const hasResources = hasLocaleResources(normalizedLocale);
  const hasLetterWeights = Boolean(getLocaleWeightManifest(normalizedLocale).hasWeights);
  const isComplete = isSupported && hasResources && hasLetterWeights;
  let disabledReason: string | null = null;

  if (!isSupported) {
    disabledReason = `Unsupported locale: ${locale}`;
  } else if (!hasResources) {
    disabledReason = `Missing resources for ${normalizedLocale}`;
  } else if (!hasLetterWeights) {
    disabledReason = `Missing letter weights for ${normalizedLocale}`;
  }

  return {
    locale,
    normalizedLocale,
    isSupported,
    hasResources,
    hasLetterWeights,
    isComplete,
    disabledReason,
  };
}

export const LOCALE_HEALTH: Record<string, LocaleHealth> = Object.fromEntries(
  SUPPORTED_LOCALES.map((locale) => [locale, buildHealth(locale)]),
) as Record<string, LocaleHealth>;

export function getLocaleHealth(locale: string | null | undefined): LocaleHealth {
  const normalized = normalizeLocale(locale);
  if (LOCALE_HEALTH[normalized]) {
    return LOCALE_HEALTH[normalized];
  }
  return buildHealth(locale ?? FALLBACK_LOCALE);
}

export function getEnabledLocales(): string[] {
  return SUPPORTED_LOCALES.filter((locale) => LOCALE_HEALTH[locale]?.isComplete);
}

export function isLocaleEnabled(locale: string | null | undefined): boolean {
  return getLocaleHealth(locale).isComplete;
}

export function resolveLocale(locale: string | null | undefined): string {
  const health = getLocaleHealth(locale);
  return health.isComplete ? health.normalizedLocale : FALLBACK_LOCALE;
}

export function getBootstrapLocaleWarning(
  requestedLocale: string | null | undefined,
): string | null {
  const health = getLocaleHealth(requestedLocale);
  if (health.isComplete) {
    return null;
  }

  return `${health.disabledReason ?? 'Locale unavailable'}; using ${FALLBACK_LOCALE} instead.`;
}
