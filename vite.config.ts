// biome-ignore-all lint/style/noDefaultExport: Vite config must use the default export shape.

// biome-ignore lint/correctness/noNodejsModules: Vite plugins run in Node at build time.
import { readdir, readFile } from "node:fs/promises";
// biome-ignore lint/correctness/noNodejsModules: Vite plugins run in Node at build time.
import { relative } from "node:path";
// biome-ignore lint/correctness/noNodejsModules: Vite plugins run in Node at build time.
import { fileURLToPath } from "node:url";
import { lingui } from "@lingui/vite-plugin";
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

// Cache the complete build before the worker takes control, including unused locale chunks.
const offline = (): Plugin => ({
  name: "offline-precache",
  async generateBundle(_options, bundle) {
    const publicDir = new URL("./public/", import.meta.url);
    const publicFiles = (await readdir(publicDir, { recursive: true, withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .map((entry) => relative(fileURLToPath(publicDir), `${entry.parentPath}/${entry.name}`))
      .filter((path) => path !== "sw.js" && !path.startsWith("_") && !path.startsWith("."));
    const paths = ["/", ...new Set([...Object.keys(bundle), ...publicFiles].map((path) => `/${path}`))].sort();
    const worker = await readFile(new URL("sw.js", publicDir), "utf8");
    this.emitFile({
      type: "asset",
      fileName: "sw.js",
      source: worker.replace("/* PRECACHE */ []", JSON.stringify(paths)),
    });
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
    lingui(),
    offline(),
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

          if (id.includes("/@lingui/")) {
            return "i18n";
          }
        },
      },
    },
  },
});
