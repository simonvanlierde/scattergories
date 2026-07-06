import { FALLBACK_LOCALE, resolveLocale, type SUPPORTED_LOCALES } from "../localeRegistry";
import categoriesResourceEn from "./categories.en.json";
import enTranslation from "./en.json";

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
  ["./*.json", "!./categories.*.json", "!./registry.json", "!./en.json"],
  { import: "default" },
);
const categoryLoaders = import.meta.glob<CategoriesResource>(
  ["./categories.*.json", "!./categories.en.json"],
  { import: "default" },
);

async function loadLocaleNamespaces(locale: string): Promise<LocaleNamespaces> {
  const loc = resolveLocale(locale) as LocaleCode;

  // The default locale is bundled synchronously; no async chunk needed.
  if (loc === FALLBACK_LOCALE) {
    return { translation: translationResourceEn, categories: categoriesResourceEnValue };
  }

  const translationLoader = translationLoaders[`./${loc}.json`];
  const categoryLoader = categoryLoaders[`./categories.${loc}.json`];
  if (!(translationLoader && categoryLoader)) {
    // Unreachable for a resolved locale; fall back to the bundled English resources.
    return { translation: translationResourceEn, categories: categoriesResourceEnValue };
  }

  const [translation, categories] = await Promise.all([translationLoader(), categoryLoader()]);
  return { translation, categories };
}

export type { CategoriesResource, LocaleCode, LocaleNamespaces, TranslationResource };
export {
  categoriesResourceEnValue as categoriesResourceEn,
  loadLocaleNamespaces,
  translationResourceEn,
};
