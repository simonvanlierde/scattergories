import { expect } from '@playwright/test';
import { TITLE } from '../src/test/constants';
import { test } from './fixtures';

const MOBILE_VIEWPORT_MAX_WIDTH = 832;
const ROUND_CLOCK_PATTERN = /\d+:\d{2}/;
const SELECTED_CATEGORIES_PATTERN = /Selected categories/i;
const SOURCE_SUMMARY_PATTERN = /Source:/i;
const DRAW_SUMMARY_PATTERN = /Draw:/i;
const READY_SUMMARY_PATTERN = /categories ready/i;

test('@smoke loads with the correct title and primary controls', async ({ app, page }) => {
  await expect(page).toHaveTitle(TITLE);
  await expect(app.readyHeading).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Round' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'How to Play' })).toBeVisible();
  await app.openSettings();
  await expect(app.settingsDialog.getByLabel('Timer', { exact: true })).toHaveValue('90');
  await expect(app.settingsDialog.getByLabel('Rounds', { exact: true })).toHaveCount(0);
  await app.closeSettings();
});

test('@smoke keeps prompts in the categories panel and uses the expected prompt deck default', async ({
  app,
  page,
}) => {
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  const playmat = page.getByRole('region', { name: 'Game board' });
  const categoriesPanel = page.getByRole('region', { name: 'Categories' });

  await expect(playmat.getByRole('list', { name: SELECTED_CATEGORIES_PATTERN })).toHaveCount(0);

  if (viewportWidth <= MOBILE_VIEWPORT_MAX_WIDTH) {
    await expect(app.promptToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(
      categoriesPanel.getByRole('list', { name: SELECTED_CATEGORIES_PATTERN }),
    ).toHaveCount(0);
    await app.promptToggle.click();
    await expect(app.promptToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(
      categoriesPanel.getByRole('list', { name: SELECTED_CATEGORIES_PATTERN }),
    ).toBeVisible();
  } else {
    await expect(app.promptToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(
      categoriesPanel.getByRole('list', { name: SELECTED_CATEGORIES_PATTERN }),
    ).toBeVisible();
  }

  await expect(categoriesPanel.getByRole('button', { name: 'Shuffle' })).toBeVisible();
  await expect(categoriesPanel.getByRole('button', { name: 'Pin categories' })).toBeVisible();
  await expect(categoriesPanel.getByRole('button', { name: 'Customize deck' })).toBeVisible();
  await expect(categoriesPanel.getByText(SOURCE_SUMMARY_PATTERN)).toHaveCount(0);
  await expect(categoriesPanel.getByText(DRAW_SUMMARY_PATTERN)).toHaveCount(0);
  await expect(categoriesPanel.getByText(READY_SUMMARY_PATTERN)).toHaveCount(0);
});

test('@smoke starts a round and reaches a stable running state', async ({ app }) => {
  await app.toggleMute();
  await app.startRound();

  await app.expectRunning();
  await expect(app.roundClock).toHaveText(ROUND_CLOCK_PATTERN);
});
