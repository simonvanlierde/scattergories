import process from "node:process";
import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const HOST = "localhost";
const BASE_URL = `http://${HOST}:${PORT}`;
const smokeTag = /@smoke/;
const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : 2,
  reporter: isCi
    ? [["github"], ["html", { open: "never" }], ["list"]]
    : [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      grep: smokeTag,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      grep: smokeTag,
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile-chrome",
      grep: smokeTag,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "mobile-safari",
      grep: smokeTag,
      use: { ...devices["iPhone 13"] },
    },
  ],
  webServer: {
    command: `pnpm preview --host ${HOST} --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !isCi,
    timeout: 120_000,
  },
});
