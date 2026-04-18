import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
import { GO, ROUND_STATE_TIMEOUT_MS } from '../src/test/constants';
import { test } from './fixtures';

const MINUTE_TO_MS = 60_000;
test.setTimeout(MINUTE_TO_MS);

test('@smoke has no detectable accessibility violations on the idle screen', async ({
  app,
  page,
}) => {
  await expect(app.readyHeading).toBeVisible();

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

test('@smoke has no detectable accessibility violations during an active round', async ({
  app,
  page,
}) => {
  await app.toggleMute();
  await app.startRound();
  await expect(app.roundStatus).toHaveText(GO, { timeout: ROUND_STATE_TIMEOUT_MS });
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

test('@smoke has no detectable accessibility violations with the prompt deck collapsed', async ({
  app,
  page,
}) => {
  if ((await app.promptToggle.getAttribute('aria-expanded')) === 'true') {
    await app.promptToggle.click();
  }

  await expect(app.promptToggle).toHaveAttribute('aria-expanded', 'false');

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
