import { test as base, expect, type Locator, type Page } from "@playwright/test";
import { ONBOARDED_KEY } from "../src/app/WelcomeOverlay";
import { GO, ROUND_STATE_TIMEOUT_MS, SCATTERGORIES_HEADING } from "../src/test/constants";

// spell-checker: ignore Configuración, Idioma, Fijar, Idiomas

type RoundButtonLabel = RegExp | string;
const START_OR_NEXT_ROUND_BUTTON_LABEL = /Roll a letter|Next round/;
const MUTE_BUTTON_LABEL = /Mute|Unmute/;
const TIMER_NAME = /Round timer/i;
// Anchored: an unanchored /Idioma/ also matches the "Fijar Idiomas" category chip
// whenever the Languages category happens to be drawn, which is a strict-mode violation.
const LANGUAGE_NAME = /^(Language|Idioma)$/i;

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
  openHelp: () => Promise<void>;
  expectIdle: () => Promise<void>;
  expectRunning: () => Promise<void>;
  openTimer: () => Promise<void>;
  openLanguage: () => Promise<void>;
  closePopover: () => Promise<void>;
  setTimer: (value: string, getReadySeconds?: string) => Promise<void>;
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
  await page.getByRole("button", { name: triggerName }).click();
  await expect(panel).toBeVisible();
}

async function closePopover(page: Page) {
  await page.keyboard.press("Escape");
}

function createAppFixture(page: Page): AppFixture {
  const timerPopover = page.getByRole("dialog", { name: TIMER_NAME });
  const languagePopover = page.getByRole("dialog", { name: LANGUAGE_NAME });
  const readyHeading = page.getByRole("heading", { name: SCATTERGORIES_HEADING });
  const currentLetter = page.getByTestId("current-letter");
  const promptToggle = page.locator('button[aria-controls="categories-panel-content"]');
  const roundStatus = page.getByTestId("round-status");

  // The primary action button is the only `.action-bar__primary`; scoping to it
  // disambiguates from the always-rendered "Next round" secondary icon button,
  // which shares the accessible name in the done phase.
  const primaryRoundButton = (label: RoundButtonLabel = START_OR_NEXT_ROUND_BUTTON_LABEL) =>
    page.getByRole("button", { name: label }).and(page.locator(".action-bar__primary"));

  return {
    currentLetter,
    page,
    promptToggle,
    readyHeading,
    roundClock: page.getByTestId("round-clock"),
    roundStatus,
    timerPopover,
    languagePopover,
    async closePopover() {
      await closePopover(page);
    },
    async collapseCategories() {
      if ((await promptToggle.getAttribute("aria-expanded")) === "true") {
        await promptToggle.click();
      }
      await expect(promptToggle).toHaveAttribute("aria-expanded", "false");
    },
    async openHelp() {
      await page.getByRole("button", { name: /How to play/i }).click();
      await expect(page.getByRole("heading", { name: /How to play/i })).toBeVisible();
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
    async setTimer(value: string, getReadySeconds?: string) {
      await openPopover(page, timerPopover, TIMER_NAME);
      await fillNumericField(timerPopover.getByLabel("Round", { exact: true }), value);
      if (getReadySeconds !== undefined) {
        // The get-ready countdown is real wall-clock time; "0" skips it so a test
        // waiting out a full round doesn't also sit through the buffer.
        await fillNumericField(
          timerPopover.getByLabel("Get ready", { exact: true }),
          getReadySeconds,
        );
      }
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
        .getByRole("button", { name: MUTE_BUTTON_LABEL })
        .click({ position: { x: 12, y: 12 } });
    },
    async waitUntilReady() {
      await expect(readyHeading).toBeVisible();
    },
  };
}

export const test = base.extend<{ app: AppFixture; onboarded: boolean }>({
  // Default to a returning player: these suites exercise the board directly, not the
  // first-run welcome, whose modal would otherwise swallow every click. The onboarding
  // suite opts out with `test.use({ onboarded: false })`.
  onboarded: [true, { option: true }],

  app: [
    async ({ page, onboarded }, use) => {
      if (onboarded) {
        // Runs on every navigation, so the flag survives the reloads these tests do.
        await page.addInitScript(
          ([key]) => {
            window.localStorage.setItem(key, "1");
          },
          [ONBOARDED_KEY],
        );
      }
      await page.goto("/");
      const app = createAppFixture(page);
      if (onboarded) {
        // With the welcome up, the modal renders the rest of the page inert, so the
        // heading is out of the a11y tree — the onboarding suite waits on the dialog.
        await app.waitUntilReady();
      }
      await use(app);
    },
    { box: true },
  ],
});
