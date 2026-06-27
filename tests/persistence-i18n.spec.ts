import { expect } from '@playwright/test';
import { test } from './fixtures';

// spell-checker: ignore Configuración, Idioma

test('@smoke persists the timer setting across reload', async ({ app, page }) => {
  await app.openTimer();
  await expect(app.timerPopover.getByLabel('Round', { exact: true })).toHaveValue('90');
  await app.closePopover();

  await app.setTimer('130');
  await page.reload();
  await app.waitUntilReady();

  await app.openTimer();
  await expect(app.timerPopover.getByLabel('Round', { exact: true })).toHaveValue('130');
  await app.closePopover();
});

test('@smoke persists a non-English language selection across reload', async ({ app, page }) => {
  await app.switchLanguage('es');
  await expect(page.getByRole('button', { name: 'Empezar Ronda' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cómo Jugar' })).toBeVisible();
  await app.openLanguage();
  await expect(app.languagePopover.locator('[data-locale="es"]')).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await app.closePopover();

  await page.reload();
  await app.waitUntilReady();
  await app.openLanguage();

  await expect(page.getByRole('button', { name: 'Empezar Ronda' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cómo Jugar' })).toBeVisible();
  await expect(app.languagePopover.locator('[data-locale="es"]')).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await app.closePopover();
});
