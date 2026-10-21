import "i18next";
import type { CategoriesResource, TranslationResource } from "./locales/resources";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: TranslationResource;
      categories: CategoriesResource;
    };
  }
}
