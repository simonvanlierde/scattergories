import { test as base, expect, type Locator, type Page } from "@playwright/test";
import { ONBOARDED_KEY } from "../src/app/useOnboarding";
import { GO, ROUND_STATE_TIMEOUT_MS, SCATTERGORIES_HEADING } from "../src/test/constants";

// spell-checker: ignore Ajustes, Fijar, Idiomas

type RoundButtonLabel = RegExp | string;
const START_OR_NEXT_ROUND_BUTTON_LABEL = /Roll a letter|Next round/;
const MUTE_BUTTON_LABEL = /Mute|Unmute/;
// The timer, language, and theme controls now live in one settings sheet.
const SETTINGS_NAME = /^(Settings|Ajustes)$/i;

interface AppFixture {
  currentLetter: Locator;
  page: Page;
  promptToggle: Locator;
  readyHeading: Locator;
  roundClock: Locator;
  roundStatus: Locator;
  settingsSheet: Locator;
  collapseCategories: () => Promise<void>;
  openHelp: () => Promise<void>;
  expectIdle: () => Promise<void>;
  expectRunning: () => Promise<void>;
  openSettings: () => Promise<void>;
  closeSettings: () => Promise<void>;
  switchTheme: (mode: "Light" | "Dark") => Promise<void>;
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

async function openSheet(page: Page, panel: Locator, triggerName: RegExp) {
  if (await panel.isVisible()) {
    return;
  }
  await page.getByRole("button", { name: triggerName }).click();
  await expect(panel).toBeVisible();
  // The sheet fades in over --duration-slow. `toBeVisible` resolves as soon as it
  // is painted, so anything reading pixels (axe's contrast check) would sample a
  // half-faded blend and report phantom contrast failures. Wait it out.
  await panel.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
}

async function closeSheet(page: Page, panel: Locator) {
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
}

function createAppFixture(page: Page): AppFixture {
  const settingsSheet = page.getByRole("dialog", { name: SETTINGS_NAME });
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
    settingsSheet,
    async closeSettings() {
      await closeSheet(page, settingsSheet);
    },
    async collapseCategories() {
      if ((await promptToggle.getAttribute("aria-expanded")) === "true") {
        await promptToggle.click();
      }
      await expect(promptToggle).toHaveAttribute("aria-expanded", "false");
    },
    async openHelp() {
      const help = page.getByRole("dialog", { name: /How to play/i });
      await page.getByRole("button", { name: /How to play/i }).click();
      await expect(page.getByRole("heading", { name: /How to play/i })).toBeVisible();
      await help.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
    },
    async expectIdle() {
      await expect(primaryRoundButton()).toBeVisible();
    },
    async expectRunning() {
      await expect(roundStatus).toHaveText(GO, { timeout: ROUND_STATE_TIMEOUT_MS });
      await expect(currentLetter).toBeVisible();
    },
    async openSettings() {
      await openSheet(page, settingsSheet, SETTINGS_NAME);
    },
    async setTimer(value: string, getReadySeconds?: string) {
      await openSheet(page, settingsSheet, SETTINGS_NAME);
      await fillNumericField(settingsSheet.getByLabel("Round", { exact: true }), value);
      if (getReadySeconds !== undefined) {
        // The get-ready countdown is real wall-clock time; "0" skips it so a test
        // waiting out a full round doesn't also sit through the buffer.
        await fillNumericField(
          settingsSheet.getByLabel("Get ready", { exact: true }),
          getReadySeconds,
        );
      }
      await closeSheet(page, settingsSheet);
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
    async switchTheme(mode: "Light" | "Dark") {
      await openSheet(page, settingsSheet, SETTINGS_NAME);
      await settingsSheet.getByRole("radio", { name: mode, exact: true }).click();
      await closeSheet(page, settingsSheet);
    },
    async switchLanguage(language: string) {
      await openSheet(page, settingsSheet, SETTINGS_NAME);
      await settingsSheet.locator("select.settings-select").selectOption(language);
      await closeSheet(page, settingsSheet);
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
