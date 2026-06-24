import { expect } from '@playwright/test';
import { test } from './fixtures';

// spell-checker: ignore Configuración, Idioma
const LANGUAGE_REGION_NAME = /Language|Idioma/i;

test('@smoke persists the timer setting across reload', async ({ app, page }) => {
  await app.openSettings();
  await expect(app.settingsDialog.getByLabel('Timer', { exact: true })).toHaveValue('90');
  await app.closeSettings();

  await app.setTimer('130');
  await page.reload();
  await app.waitUntilReady();

  await app.openSettings();
  await expect(app.settingsDialog.getByLabel('Timer', { exact: true })).toHaveValue('130');
  await app.closeSettings();
});

test('@smoke persists a non-English language selection across reload', async ({ app, page }) => {
  await app.switchLanguage('es');
  await expect(page.getByRole('button', { name: 'Empezar Ronda' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cómo Jugar' })).toBeVisible();
  await app.openSettings();
  await expect(
    app.settingsDialog.getByRole('region', { name: LANGUAGE_REGION_NAME }).getByRole('combobox'),
  ).toHaveValue('es');
  await app.closeSettings();

  await page.reload();
  await app.waitUntilReady();
  await app.openSettings();

  await expect(page.getByRole('button', { name: 'Empezar Ronda' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cómo Jugar' })).toBeVisible();
  await expect(
    app.settingsDialog.getByRole('region', { name: LANGUAGE_REGION_NAME }).getByRole('combobox'),
  ).toHaveValue('es');
  await app.closeSettings();
});
