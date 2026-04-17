// biome-ignore-all lint/correctness/noNodejsModules : Playwright config reads CI from Node's process env.

import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;
// biome-ignore lint/style/noProcessEnv: Playwright config reads CI from Node's process env.
const isCi = Boolean(process.env.CI);

// biome-ignore lint/style/noDefaultExport: Playwright config must use the default export shape.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : undefined,
  reporter: isCi
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['html', { open: 'never' }], ['list']],
  use: {
    // biome-ignore lint/style/useNamingConvention: Playwright config uses the upstream `baseURL` key.
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm preview --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !isCi,
    timeout: 120_000,
  },
});
