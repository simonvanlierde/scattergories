// biome-ignore-all lint/style/noDefaultExport: Vite config must use the default export shape.

import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { marked } from "marked";
import { defineConfig, type Plugin } from "vite";
import pkg from "./package.json" with { type: "json" };

/**
 * Turns an imported .md file into its HTML at build time, so the pages in docs/
 * ship as HTML and no Markdown code reaches the browser. GitHub shows the same files.
 * HTML comments are notes for the author, so they are dropped before visitors see them.
 */
const markdown = (): Plugin => ({
  name: "markdown-html",
  transform(code, id) {
    if (id.endsWith(".md")) {
      const text = code.replace(/<!--[\s\S]*?-->/g, "").replace(/<!--/g, "");
      // The second pass drops a "<!--" the first one leaves, as in "<!<!---->--".
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
