// biome-ignore-all lint/style/noDefaultExport: Vite config must use the default export shape.

import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { marked } from "marked";
import { defineConfig, type Plugin } from "vite";
import pkg from "./package.json" with { type: "json" };

// Convert trusted repository documents at build time so Markdown stays out of the browser.
const markdown = (): Plugin => ({
  name: "markdown-html",
  transform(code, id) {
    if (id.endsWith(".md")) {
      let text = code;
      for (let before = ""; before !== text; ) {
        before = text;
        text = text.replace(/<!--[\s\S]*?-->/g, "");
      }
      const html = marked.parse(text, { async: false });
      return { code: `export default ${JSON.stringify(html)};`, map: null };
    }
  },
});

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    markdown(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/react-dom") || id.includes("/node_modules/react/")) {
            return "react";
          }

          if (id.includes("/node_modules/i18next") || id.includes("/node_modules/react-i18next")) {
            return "i18n";
          }
        },
      },
    },
  },
});
