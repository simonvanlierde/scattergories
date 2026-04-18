import { expect } from '@playwright/test';
import { test } from './fixtures';

test('@smoke persists the timer setting across reload', async ({ app, page }) => {
  await expect(page.getByLabel('Timer', { exact: true })).toHaveValue('90');

  await app.setTimer('130');
  await page.reload();
  await app.waitUntilReady();

  await expect(page.getByLabel('Timer', { exact: true })).toHaveValue('130');
});

test('@smoke persists a non-English language selection across reload', async ({ app, page }) => {
  await app.switchLanguage('es');
  await expect(page.getByRole('button', { name: 'Empezar Ronda' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cómo Jugar' })).toBeVisible();

  await page.reload();
  await app.waitUntilReady();

  await expect(page.getByRole('button', { name: 'Empezar Ronda' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cómo Jugar' })).toBeVisible();
  await expect(app.languageSelect).toHaveValue('es');
});
