import { test as base, expect, type Locator, type Page } from '@playwright/test';
import { HEADING_LEVEL, SCATTERGORIES_HEADING } from '../src/test/constants';

type RoundButtonLabel = RegExp | string;

interface AppFixture {
  currentLetter: Locator;
  languageSelect: Locator;
  page: Page;
  readyHeading: Locator;
  roundClock: Locator;
  roundStatus: Locator;
  setRounds: (value: string) => Promise<void>;
  setTimer: (value: string) => Promise<void>;
  startRound: (label?: RoundButtonLabel) => Promise<void>;
  switchLanguage: (language: string) => Promise<void>;
  toggleMute: () => Promise<void>;
  waitUntilReady: () => Promise<void>;
}

async function fillNumericField(field: Locator, value: string) {
  await field.fill(value);
  await field.blur();
}

function createAppFixture(page: Page): AppFixture {
  const readyHeading = page.getByRole('heading', {
    level: HEADING_LEVEL,
    name: SCATTERGORIES_HEADING,
  });

  return {
    currentLetter: page.getByTestId('current-letter'),
    languageSelect: page.locator('footer').getByRole('combobox'),
    page,
    readyHeading,
    roundClock: page.getByTestId('round-clock'),
    roundStatus: page.getByTestId('round-status'),
    async setRounds(value: string) {
      await fillNumericField(page.getByLabel('Rounds', { exact: true }), value);
    },
    async setTimer(value: string) {
      await fillNumericField(page.getByLabel('Timer', { exact: true }), value);
    },
    async startRound(label: RoundButtonLabel = /Start Round|Next Round/) {
      await page.getByRole('button', { name: label }).click();
    },
    async switchLanguage(language: string) {
      await this.languageSelect.selectOption(language);
    },
    async toggleMute() {
      await page.getByRole('button', { name: /Mute|Unmute/ }).click();
    },
    async waitUntilReady() {
      await expect(readyHeading).toBeVisible();
    },
  };
}

export const test = base.extend<{ app: AppFixture }>({
  app: [
    async ({ page }, use) => {
      await page.goto('/');
      const app = createAppFixture(page);
      await app.waitUntilReady();
      await use(app);
    },
    { box: true },
  ],
});

export { expect } from '@playwright/test';
