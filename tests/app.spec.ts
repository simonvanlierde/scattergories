import { expect, test } from '@playwright/test';

const TITLE = /scattergories/i;
const GET_READY = /get ready/i;
const GO = /^go!$/i;
const ROUND_OVER = /round over/i;
const RESET = /reset/i;
const ROUND_BUTTON = /next round|start round/i;

test('loads with the correct title and heading', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(TITLE);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Scattergories');
});

test('persists timer setting across reload via localStorage', async ({ page }) => {
  await page.goto('/');

  const timer = page.getByLabel('Timer', { exact: true });
  await expect(timer).toHaveValue('90');

  await timer.fill('130');
  await timer.blur();

  await page.reload();
  await expect(page.getByLabel('Timer', { exact: true })).toHaveValue('130');
});

test('runs a full round cycle end to end', async ({ page }) => {
  await page.goto('/');

  const timer = page.getByLabel('Timer', { exact: true });
  await timer.fill('5');
  await timer.blur();
  await page.getByRole('button', { name: 'Mute' }).click();

  await page.getByRole('button', { name: 'Start Round' }).click();

  await expect(page.getByText(GET_READY)).toBeVisible({ timeout: 5000 });
  await expect(page.getByText(GO)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(ROUND_OVER)).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: RESET }).click();
  await expect(page.getByRole('button', { name: ROUND_BUTTON })).toBeVisible();
});

test('starts a round via the Space keyboard shortcut', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Mute' }).click();
  await page.locator('body').press('Space');

  await expect(page.getByRole('button', { name: 'Spinning...' })).toBeVisible();
});
