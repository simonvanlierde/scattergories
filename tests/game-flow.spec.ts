import { expect } from '@playwright/test';
import {
  APP_MIN_TIMER_SECONDS,
  ROUND_MESSAGE_TIMEOUT_MS,
  SESSION_OVER,
} from '../src/test/constants';
import { test } from './fixtures';

const SINGLE_ROUND_TIMEOUT_MS = 25_000;

test('runs a full single-round game to completion', async ({ app, page }) => {
  test.setTimeout(SINGLE_ROUND_TIMEOUT_MS);

  await app.setRounds('1');
  await app.setTimer(APP_MIN_TIMER_SECONDS);
  await app.toggleMute();
  await app.startRound();

  await expect(app.roundStatus).toHaveText(SESSION_OVER, { timeout: ROUND_MESSAGE_TIMEOUT_MS });
  await expect(
    page.getByTestId('round-end-screen').getByRole('button', { name: 'New session' }),
  ).toBeVisible();
});
