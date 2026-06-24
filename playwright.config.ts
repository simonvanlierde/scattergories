// biome-ignore-all lint/correctness/noNodejsModules : Playwright config reads CI from Node's process env.

import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const HOST = 'localhost';
const BASE_URL = `http://${HOST}:${PORT}`;
const smokeTag = /@smoke/;
// biome-ignore lint/style/noProcessEnv: Playwright config reads CI from Node's process env.
const isCi = Boolean(process.env.CI);

// biome-ignore lint/style/noDefaultExport: Playwright config must use the default export shape.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : 2,
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
    {
      name: 'firefox',
      grep: smokeTag,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      grep: smokeTag,
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      grep: smokeTag,
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-safari',
      grep: smokeTag,
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: `pnpm preview --host ${HOST} --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !isCi,
    timeout: 120_000,
  },
});
