import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const TITLE = /scattergories/i;
const GET_READY = /get ready/i;
const GO = /^go!$/i;
const ROUND_OVER = /round over/i;
const GAME_OVER = /game complete/i;
const ROUND_ONE_OF_TWO = /Round 1 of 2/i;
const ROUND_TWO_OF_TWO = /Round 2 of 2/i;
const RESET = /reset/i;
const ROUND_BUTTON = /next round|start round/i;
const SKIP_LETTER_WAIT_MS = 2500;
const PAUSE_TOGGLE_WAIT_MS = 1500;
const MULTI_ROUND_TEST_TIMEOUT_MS = 70_000;
const APP_MIN_TIMER_SECONDS = '10';

test.describe('Accessibility', () => {
  test('should not have any detectable accessibility violations on idle screen', async ({
    page,
  }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have any detectable accessibility violations during a running round', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Mute' }).click();
    await page.getByRole('button', { name: 'Start Round' }).click();

    // Wait for GO state
    await expect(page.getByText(GO)).toBeVisible({ timeout: 10_000 });

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

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

  await expect(page.getByText(GET_READY)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(GO)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(ROUND_OVER)).toBeVisible({ timeout: 30_000 });

  await page.getByRole('button', { name: RESET }).click();
  await expect(page.getByRole('button', { name: ROUND_BUTTON })).toBeVisible();
});

test('runs a multi-round game to completion', async ({ page }) => {
  test.setTimeout(MULTI_ROUND_TEST_TIMEOUT_MS);
  await page.goto('/');

  // Setup: 2 rounds at the app's minimum timer duration.
  const roundsInput = page.getByLabel('Rounds', { exact: true });
  await roundsInput.fill('2');
  await roundsInput.blur();

  const timerInput = page.getByLabel('Timer', { exact: true });
  await timerInput.fill(APP_MIN_TIMER_SECONDS);
  await timerInput.blur();

  await page.getByRole('button', { name: 'Mute' }).click();

  // Round 1
  await page.getByRole('button', { name: 'Start Round' }).click();
  await expect(page.getByText(ROUND_ONE_OF_TWO)).toBeVisible();
  await expect(page.getByText(ROUND_OVER)).toBeVisible({ timeout: 30_000 });

  // Start Round 2
  await page.getByRole('button', { name: 'Next Round' }).click();
  await expect(page.getByText(ROUND_TWO_OF_TWO)).toBeVisible();

  // Wait for the full end-game message
  await expect(page.getByText(GAME_OVER)).toBeVisible({ timeout: 30_000 });

  await expect(page.getByRole('button', { name: 'New Game' })).toBeVisible();
});

test('starts a round via the Space keyboard shortcut', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Mute' }).click();
  await page.locator('body').press('Space');

  await expect(page.getByRole('button', { name: 'Spinning...' })).toBeVisible();
});

test('skip letter via R mid-round changes letter without resetting timer', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Timer', { exact: true }).fill('20');
  await page.getByLabel('Timer', { exact: true }).blur();
  await page.getByRole('button', { name: 'Mute' }).click();
  await page.getByRole('button', { name: 'Start Round' }).click();

  await expect(page.getByText(GO)).toBeVisible({ timeout: 10_000 });

  const letter = page.locator('.letter');
  const timer = page.locator('.timer.running');
  const beforeLetter = await letter.textContent();

  await page.locator('body').press('r');
  await page.waitForTimeout(SKIP_LETTER_WAIT_MS);

  await expect(letter).not.toHaveText(beforeLetter ?? '', { timeout: 5000 });
  await expect(page.getByText(GET_READY)).not.toBeVisible();
  await expect(timer).toBeVisible();
});

test('pause and resume via P stops and restarts timer countdown', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Timer', { exact: true }).fill('8');
  await page.getByLabel('Timer', { exact: true }).blur();
  await page.getByRole('button', { name: 'Mute' }).click();
  await page.getByRole('button', { name: 'Start Round' }).click();

  await expect(page.getByText(GO)).toBeVisible({ timeout: 10_000 });

  const timer = page.locator('.timer.running');
  const beforePause = await timer.textContent();

  await page.locator('body').press('p');
  await page.waitForTimeout(PAUSE_TOGGLE_WAIT_MS);

  await expect(timer).toHaveText(beforePause ?? '');

  await page.locator('body').press('p');
  await page.waitForTimeout(PAUSE_TOGGLE_WAIT_MS);

  await expect(timer).not.toHaveText(beforePause ?? '');
});

test('custom categories in Custom source mode populate drawn list', async ({ page }) => {
  await page.goto('/');

  const customInput = page.getByRole('textbox', { name: 'Add custom category' });
  await customInput.fill('Space Opera Titles');
  await page.getByRole('button', { name: 'Add' }).click();
  await customInput.fill('Retro Consoles');
  await page.getByRole('button', { name: 'Add' }).click();

  await page.getByLabel('Source').selectOption('custom');
  await page.getByLabel('Draw').fill('2');
  await page.getByLabel('Draw').blur();
  await page.getByRole('button', { name: 'Shuffle' }).click();

  const categoryList = page.locator('#catList li');
  await expect(categoryList).toHaveCount(2);
  await expect(page.locator('#catList')).toContainText('Space Opera Titles');
  await expect(page.locator('#catList')).toContainText('Retro Consoles');
});

test('language selector switches copy and persists after reload', async ({ page }) => {
  await page.goto('/');

  const languageSelector = page.locator('select.language-selector');

  const locales = [
    { code: 'es', startRound: 'Empezar Ronda', howToPlay: 'Cómo Jugar' },
    { code: 'fr', startRound: 'Démarrer la manche', howToPlay: 'Comment jouer' },
    { code: 'de', startRound: 'Runde Starten', howToPlay: 'Spielanleitung' },
    { code: 'it', startRound: 'Inizia Round', howToPlay: 'Come Giocare' },
  ];

  await locales.reduce(async (previous, locale) => {
    await previous;
    await languageSelector.selectOption(locale.code);
    await expect(page.getByRole('button', { name: locale.startRound })).toBeVisible();
    await expect(page.getByRole('button', { name: locale.howToPlay })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: locale.startRound })).toBeVisible();
    await expect(page.getByRole('button', { name: locale.howToPlay })).toBeVisible();
  }, Promise.resolve());
});
