// biome-ignore-all lint/style/noDefaultExport: Lingui loads a default configuration export.

import { defineConfig } from "@lingui/cli";
import { formatter } from "@lingui/format-po";

import registry from "./src/i18n/locales/registry.json" with { type: "json" };

export default defineConfig({
  locales: registry.locales,
  sourceLocale: registry.fallbackLocale,
  catalogs: [{ path: "src/i18n/locales/{locale}", include: ["src"] }],
  format: formatter({ lineNumbers: false, explicitIdAsDefault: true }),
});
