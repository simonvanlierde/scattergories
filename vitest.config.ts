// biome-ignore-all lint/style/noDefaultExport: Vitest config must use the default export shape.
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config.ts";

// Unit tests only: Playwright runs tests/ against the built app.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      // The customize-deck sheet renders the full built-in category list, which is
      // slow to mount in jsdom under parallel load; give integration tests headroom.
      testTimeout: 20_000,
      include: ["src/**/*.test.{ts,tsx}"],
      setupFiles: "./src/setupTests.ts",
      coverage: {
        provider: "v8",
        reporter: ["text", "lcov", "html"],
        include: ["src/**/*.ts", "src/**/*.tsx"],
        exclude: ["src/main.tsx", "src/vite-env.d.ts", "src/setupTests.ts"],
        thresholds: {
          "src/domain/**/*.ts": {
            lines: 95,
            functions: 100,
            branches: 90,
            statements: 95,
          },
          "src/**/*.{ts,tsx}": {
            lines: 60,
            functions: 60,
            branches: 60,
            statements: 60,
          },
        },
      },
    },
  }),
);
