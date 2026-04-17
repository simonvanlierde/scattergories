import { GO, ROUND_STATE_TIMEOUT_MS, TITLE } from '../src/test/constants';
import { expect, test } from './fixtures';

test('@smoke loads with the correct title and primary controls', async ({ app, page }) => {
  await expect(page).toHaveTitle(TITLE);
  await expect(app.readyHeading).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Round' })).toBeVisible();
  await expect(page.getByLabel('Timer', { exact: true })).toHaveValue('90');
  await expect(page.getByLabel('Rounds', { exact: true })).toHaveValue('3');
  await expect(page.getByRole('button', { name: 'How to Play' })).toBeVisible();
  await expect(app.languageSelect).toHaveValue('en');
});

test('@smoke starts a round and reaches a stable running state', async ({ app }) => {
  await app.toggleMute();
  await app.startRound();

  await expect(app.roundStatus).toHaveText(GO, { timeout: ROUND_STATE_TIMEOUT_MS });
  await expect(app.currentLetter).toBeVisible();
  await expect(app.roundClock).toHaveText(/\d+:\d{2}/);
});
