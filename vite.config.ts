// biome-ignore-all lint/style/noDefaultExport: Vite config must use the default export shape.
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/react-dom') || id.includes('/node_modules/react/')) {
            return 'react';
          }

          if (id.includes('/node_modules/i18next') || id.includes('/node_modules/react-i18next')) {
            return 'i18n';
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: [...configDefaults.exclude, 'tests/**'],
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts', 'src/setupTests.ts'],
      thresholds: {
        'src/game/**/*.ts': {
          lines: 95,
          functions: 100,
          branches: 90,
          statements: 95,
        },
        'src/**/*.{ts,tsx}': {
          lines: 60,
          functions: 60,
          branches: 60,
          statements: 60,
        },
      },
    },
  },
});
