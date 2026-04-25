import { test as base, expect, type Locator, type Page } from '@playwright/test';
import { SCATTERGORIES_HEADING } from '../src/test/constants';

// spell-checker: ignore Configuración, Idioma

type RoundButtonLabel = RegExp | string;
const START_OR_NEXT_ROUND_BUTTON_LABEL = /Start Round|Next Round/;
const MUTE_BUTTON_LABEL = /Mute|Unmute/;
const SETTINGS_DIALOG_NAME = /Settings|Configuración/i;
const LANGUAGE_REGION_NAME = /Language|Idioma/i;

interface AppFixture {
  currentLetter: Locator;
  page: Page;
  promptToggle: Locator;
  readyHeading: Locator;
  roundClock: Locator;
  roundStatus: Locator;
  settingsDialog: Locator;
  closeSettings: () => Promise<void>;
  openSettings: () => Promise<void>;
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

async function openSettings(page: Page, label = 'Settings') {
  const dialog = page.getByRole('dialog', { name: SETTINGS_DIALOG_NAME });
  if (await dialog.isVisible()) {
    return;
  }

  await page.getByRole('button', { name: label }).click();
  await expect(dialog).toBeVisible();
}

async function closeSettings(page: Page) {
  const dialog = page.getByRole('dialog', { name: SETTINGS_DIALOG_NAME });
  if (!(await dialog.isVisible())) {
    return;
  }

  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
}

function createAppFixture(page: Page): AppFixture {
  const settingsDialog = page.getByRole('dialog', { name: SETTINGS_DIALOG_NAME });
  const readyHeading = page
    .locator('h1, .app-rail__brand-wordmark')
    .filter({ hasText: SCATTERGORIES_HEADING })
    .first();

  return {
    currentLetter: page.getByTestId('current-letter'),
    page,
    promptToggle: page.locator('button[aria-controls="categories-panel-content"]'),
    readyHeading,
    roundClock: page.getByTestId('round-clock'),
    roundStatus: page.getByTestId('round-status'),
    settingsDialog,
    async closeSettings() {
      await closeSettings(page);
    },
    async openSettings() {
      await openSettings(page);
    },
    async setRounds(value: string) {
      await openSettings(page);
      await fillNumericField(settingsDialog.getByLabel('Rounds', { exact: true }), value);
      await closeSettings(page);
    },
    async setTimer(value: string) {
      await openSettings(page);
      await fillNumericField(settingsDialog.getByLabel('Timer', { exact: true }), value);
      await closeSettings(page);
    },
    async startRound(label: RoundButtonLabel = START_OR_NEXT_ROUND_BUTTON_LABEL) {
      await page.getByRole('button', { name: label }).click();
    },
    async switchLanguage(language: string) {
      await openSettings(page);
      await settingsDialog
        .getByRole('region', { name: LANGUAGE_REGION_NAME })
        .getByRole('combobox')
        .selectOption(language);
      await closeSettings(page);
    },
    async toggleMute() {
      await page
        .getByRole('button', { name: MUTE_BUTTON_LABEL })
        .click({ position: { x: 12, y: 12 } });
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
