import { test as base, expect, type Locator, type Page } from '@playwright/test';
import { GO, ROUND_STATE_TIMEOUT_MS, SCATTERGORIES_HEADING } from '../src/test/constants';

// spell-checker: ignore Configuración, Idioma

type RoundButtonLabel = RegExp | string;
const START_OR_NEXT_ROUND_BUTTON_LABEL = /Start Round|Next round/;
const MUTE_BUTTON_LABEL = /Mute|Unmute/;
const TIMER_NAME = /Round timer/i;
const LANGUAGE_NAME = /Language|Idioma/i;

interface AppFixture {
  currentLetter: Locator;
  page: Page;
  promptToggle: Locator;
  readyHeading: Locator;
  roundClock: Locator;
  roundStatus: Locator;
  timerPopover: Locator;
  languagePopover: Locator;
  collapseCategories: () => Promise<void>;
  expectIdle: () => Promise<void>;
  expectRunning: () => Promise<void>;
  openTimer: () => Promise<void>;
  openLanguage: () => Promise<void>;
  closePopover: () => Promise<void>;
  setTimer: (value: string) => Promise<void>;
  startRound: (label?: RoundButtonLabel) => Promise<void>;
  startRoundSafely: (label?: RoundButtonLabel) => Promise<void>;
  switchLanguage: (language: string) => Promise<void>;
  toggleMute: () => Promise<void>;
  waitUntilReady: () => Promise<void>;
}

async function fillNumericField(field: Locator, value: string) {
  await field.fill(value);
  await field.blur();
}

async function openPopover(page: Page, panel: Locator, triggerName: RegExp) {
  if (await panel.isVisible()) {
    return;
  }
  await page.getByRole('button', { name: triggerName }).click();
  await expect(panel).toBeVisible();
}

async function closePopover(page: Page) {
  await page.keyboard.press('Escape');
}

function createAppFixture(page: Page): AppFixture {
  const timerPopover = page.getByRole('dialog', { name: TIMER_NAME });
  const languagePopover = page.getByRole('dialog', { name: LANGUAGE_NAME });
  const readyHeading = page.getByRole('heading', { name: SCATTERGORIES_HEADING });
  const currentLetter = page.getByTestId('current-letter');
  const promptToggle = page.locator('button[aria-controls="categories-panel-content"]');
  const roundStatus = page.getByTestId('round-status');

  // The primary action button is the only `.action-bar__primary`; scoping to it
  // disambiguates from the always-rendered "Next round" secondary icon button,
  // which shares the accessible name in the done phase.
  const primaryRoundButton = (label: RoundButtonLabel = START_OR_NEXT_ROUND_BUTTON_LABEL) =>
    page.getByRole('button', { name: label }).and(page.locator('.action-bar__primary'));

  return {
    currentLetter,
    page,
    promptToggle,
    readyHeading,
    roundClock: page.getByTestId('round-clock'),
    roundStatus,
    timerPopover,
    languagePopover,
    async closePopover() {
      await closePopover(page);
    },
    async collapseCategories() {
      if ((await promptToggle.getAttribute('aria-expanded')) === 'true') {
        await promptToggle.click();
      }
      await expect(promptToggle).toHaveAttribute('aria-expanded', 'false');
    },
    async expectIdle() {
      await expect(primaryRoundButton()).toBeVisible();
    },
    async expectRunning() {
      await expect(roundStatus).toHaveText(GO, { timeout: ROUND_STATE_TIMEOUT_MS });
      await expect(currentLetter).toBeVisible();
    },
    async openTimer() {
      await openPopover(page, timerPopover, TIMER_NAME);
    },
    async openLanguage() {
      await openPopover(page, languagePopover, LANGUAGE_NAME);
    },
    async setTimer(value: string) {
      await openPopover(page, timerPopover, TIMER_NAME);
      await fillNumericField(timerPopover.getByLabel('Round', { exact: true }), value);
      await closePopover(page);
    },
    async startRound(label: RoundButtonLabel = START_OR_NEXT_ROUND_BUTTON_LABEL) {
      const startButton = primaryRoundButton(label);
      await startButton.scrollIntoViewIfNeeded();
      await startButton.click();
    },
    async startRoundSafely(label: RoundButtonLabel = START_OR_NEXT_ROUND_BUTTON_LABEL) {
      const startButton = primaryRoundButton(label);
      await startButton.scrollIntoViewIfNeeded();
      await startButton.click();
    },
    async switchLanguage(language: string) {
      await openPopover(page, languagePopover, LANGUAGE_NAME);
      // Selecting a language applies it and closes the popover.
      await languagePopover.locator(`[data-locale="${language}"]`).click();
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
