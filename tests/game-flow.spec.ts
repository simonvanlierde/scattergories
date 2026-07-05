import { expect } from '@playwright/test';
import { APP_MIN_TIMER_SECONDS, ROUND_MESSAGE_TIMEOUT_MS, ROUND_OVER } from '../src/test/constants';
import { test } from './fixtures';

const SINGLE_ROUND_TIMEOUT_MS = 25_000;

test('runs a full single-round game to completion', async ({ app, page }) => {
  test.setTimeout(SINGLE_ROUND_TIMEOUT_MS);

  await app.setTimer(APP_MIN_TIMER_SECONDS);
  await app.toggleMute();
  await app.startRound();

  await expect(app.roundStatus).toHaveText(ROUND_OVER, { timeout: ROUND_MESSAGE_TIMEOUT_MS });
  // The round-end recap replaces the hero; the primary button still advances.
  await expect(page.locator('.round-end')).toBeVisible();
  // Scope to the primary CTA; the secondary "Next round" icon button shares the name.
  await expect(
    page.getByRole('button', { name: 'Next round' }).and(page.locator('.action-bar__primary')),
  ).toBeVisible();
});
