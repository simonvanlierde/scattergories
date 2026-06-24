import 'react-i18next';
import type { CategoriesResource, TranslationResource } from './locales/resources';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    // biome-ignore lint/style/useNamingConvention: required by react-i18next
    defaultNS: 'translation';
    resources: {
      translation: TranslationResource;
      categories: CategoriesResource;
    };
  }
}
