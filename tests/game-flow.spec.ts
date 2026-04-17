import { APP_MIN_TIMER_SECONDS, GAME_OVER, ROUND_MESSAGE_TIMEOUT_MS } from '../src/test/constants';
import { expect, test } from './fixtures';

test('runs a full single-round game to completion', async ({ app, page }) => {
  test.setTimeout(25_000);

  await app.setRounds('1');
  await app.setTimer(APP_MIN_TIMER_SECONDS);
  await app.toggleMute();
  await app.startRound();

  await expect(app.roundStatus).toHaveText(GAME_OVER, { timeout: ROUND_MESSAGE_TIMEOUT_MS });
  await expect(page.getByRole('button', { name: 'New Game' })).toBeVisible();
});
