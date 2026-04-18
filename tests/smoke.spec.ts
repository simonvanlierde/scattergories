import { expect } from '@playwright/test';
import { GO, ROUND_STATE_TIMEOUT_MS, TITLE } from '../src/test/constants';
import { test } from './fixtures';

const MOBILE_VIEWPORT_MAX_WIDTH = 832;
const MOBILE_ALLOWED_OVERFLOW_PX = 4;
const DESKTOP_ALLOWED_OVERFLOW_PX = 0;
const SOURCE_LABEL_PATTERN = /Source:/i;
const ROUND_CLOCK_PATTERN = /\d+:\d{2}/;

test('@smoke loads with the correct title and primary controls', async ({ app, page }) => {
  await expect(page).toHaveTitle(TITLE);
  await expect(app.readyHeading).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Round' })).toBeVisible();
  await expect(page.getByLabel('Timer', { exact: true })).toHaveValue('90');
  await expect(page.getByLabel('Rounds', { exact: true })).toHaveValue('3');
  await expect(page.getByRole('button', { name: 'How to Play' })).toBeVisible();
  await expect(app.languageSelect).toHaveValue('en');
});

test('@smoke fits the first screen and uses the expected prompt deck default', async ({
  app,
  page,
}) => {
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  const verticalOverflow = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  const maxAllowedOverflow =
    viewportWidth <= MOBILE_VIEWPORT_MAX_WIDTH
      ? MOBILE_ALLOWED_OVERFLOW_PX
      : DESKTOP_ALLOWED_OVERFLOW_PX;

  expect(verticalOverflow).toBeLessThanOrEqual(maxAllowedOverflow);

  if (viewportWidth <= MOBILE_VIEWPORT_MAX_WIDTH) {
    await expect(app.promptToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByText(SOURCE_LABEL_PATTERN)).toBeVisible();
  } else {
    await expect(app.promptToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('combobox', { name: 'Source' })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: 'Draw' })).toBeVisible();
  }
});

test('@smoke starts a round and reaches a stable running state', async ({ app }) => {
  await app.toggleMute();
  await app.startRound();

  await expect(app.roundStatus).toHaveText(GO, { timeout: ROUND_STATE_TIMEOUT_MS });
  await expect(app.currentLetter).toBeVisible();
  await expect(app.roundClock).toHaveText(ROUND_CLOCK_PATTERN);
});
