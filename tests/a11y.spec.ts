import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';
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
  await app.expectRunning();
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

test('@smoke has no detectable accessibility violations with the prompt deck collapsed', async ({
  app,
  page,
}) => {
  await app.collapseCategories();

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
