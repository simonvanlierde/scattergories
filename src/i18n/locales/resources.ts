import { FALLBACK_LOCALE, normalizeLocale, SUPPORTED_LOCALES } from '../localeRegistry';
import categoriesResourceEn from './categories.en.json';
import enTranslation from './en.json';

interface LocaleNamespaces {
  translation: TranslationResource;
  categories: CategoriesResource;
}

type TranslationResource = Record<string, unknown>;
type CategoriesResource = Record<string, string>;
type LocaleCode = (typeof SUPPORTED_LOCALES)[number];

const translationResourceEn: TranslationResource = enTranslation;
const categoriesResourceEnValue: CategoriesResource = categoriesResourceEn;

// en + registry are statically imported (bundled in main); exclude them so the
// glob only owns the async per-locale chunks and Vite doesn't warn.
const translationLoaders = import.meta.glob<TranslationResource>(
  ['./*.json', '!./categories.*.json', '!./registry.json', '!./en.json'],
  { import: 'default' },
);
const categoryLoaders = import.meta.glob<CategoriesResource>(
  ['./categories.*.json', '!./categories.en.json'],
  { import: 'default' },
);

async function loadLocaleNamespaces(locale: string): Promise<LocaleNamespaces> {
  const normalized = normalizeLocale(locale);
  const loc = (SUPPORTED_LOCALES.includes(normalized) ? normalized : FALLBACK_LOCALE) as LocaleCode;

  // The default locale is bundled synchronously; no async chunk needed.
  if (loc === FALLBACK_LOCALE) {
    return { translation: translationResourceEn, categories: categoriesResourceEnValue };
  }

  const [translation, categories] = await Promise.all([
    translationLoaders[`./${loc}.json`](),
    categoryLoaders[`./categories.${loc}.json`](),
  ]);
  return { translation, categories };
}

export type { CategoriesResource, LocaleCode, LocaleNamespaces, TranslationResource };
export {
  categoriesResourceEnValue as categoriesResourceEn,
  loadLocaleNamespaces,
  translationResourceEn,
};
