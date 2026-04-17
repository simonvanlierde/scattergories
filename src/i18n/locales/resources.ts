import { FALLBACK_LOCALE, normalizeLocale, type SUPPORTED_LOCALES } from '../localeRegistry';
import categoriesResourceEn from './categories.en.json';
import enTranslation from './en.json';

interface LocaleNamespaces {
  translation: TranslationResource;
  categories: CategoriesResource;
}

type TranslationResource = typeof enTranslation;
type CategoriesResource = typeof categoriesResourceEn;
type LocaleCode = (typeof SUPPORTED_LOCALES)[number];
type LocaleLoader = () => Promise<LocaleNamespaces>;

const translationResourceEn = enTranslation;
const categoriesResourceEnValue = categoriesResourceEn;

const localeLoaders: Record<LocaleCode, LocaleLoader> = {
  de: async () => {
    const [translation, categories] = await Promise.all([
      import('./de.json'),
      import('./categories.de.json'),
    ]);
    return { translation: translation.default, categories: categories.default };
  },
  el: async () => {
    const [translation, categories] = await Promise.all([
      import('./el.json'),
      import('./categories.el.json'),
    ]);
    return { translation: translation.default, categories: categories.default };
  },
  en: async () => ({
    translation: translationResourceEn,
    categories: categoriesResourceEnValue,
  }),
  es: async () => {
    const [translation, categories] = await Promise.all([
      import('./es.json'),
      import('./categories.es.json'),
    ]);
    return { translation: translation.default, categories: categories.default };
  },
  fr: async () => {
    const [translation, categories] = await Promise.all([
      import('./fr.json'),
      import('./categories.fr.json'),
    ]);
    return { translation: translation.default, categories: categories.default };
  },
  it: async () => {
    const [translation, categories] = await Promise.all([
      import('./it.json'),
      import('./categories.it.json'),
    ]);
    return { translation: translation.default, categories: categories.default };
  },
  nl: async () => {
    const [translation, categories] = await Promise.all([
      import('./nl.json'),
      import('./categories.nl.json'),
    ]);
    return { translation: translation.default, categories: categories.default };
  },
  pl: async () => {
    const [translation, categories] = await Promise.all([
      import('./pl.json'),
      import('./categories.pl.json'),
    ]);
    return { translation: translation.default, categories: categories.default };
  },
  pt: async () => {
    const [translation, categories] = await Promise.all([
      import('./pt.json'),
      import('./categories.pt.json'),
    ]);
    return { translation: translation.default, categories: categories.default };
  },
};

function hasLocaleResources(locale: string): boolean {
  const normalized = normalizeLocale(locale) as LocaleCode;
  return normalized in localeLoaders;
}

function loadLocaleNamespaces(locale: string): Promise<LocaleNamespaces> {
  const normalized = normalizeLocale(locale) as LocaleCode;
  const loader = localeLoaders[normalized] ?? localeLoaders[FALLBACK_LOCALE as LocaleCode];
  return loader();
}

export type { CategoriesResource, LocaleCode, LocaleNamespaces, TranslationResource };
export {
  categoriesResourceEnValue as categoriesResourceEn,
  hasLocaleResources,
  loadLocaleNamespaces,
  translationResourceEn,
};
