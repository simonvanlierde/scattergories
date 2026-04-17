import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import {
  APP_MIN_TIMER_SECONDS,
  GAME_OVER,
  GET_READY,
  GO,
  HEADING_LEVEL,
  LETTER_CHANGE_TIMEOUT_MS,
  MULTI_ROUND_TEST_TIMEOUT_MS,
  PAUSE_TOGGLE_WAIT_MS,
  RESET,
  ROUND_BUTTON,
  ROUND_MESSAGE_TIMEOUT_MS,
  ROUND_ONE_OF_TWO,
  ROUND_OVER,
  ROUND_STATE_TIMEOUT_MS,
  ROUND_TWO_OF_TWO,
  SCATTERGORIES_HEADING,
  SKIP_LETTER_WAIT_MS,
  TITLE,
} from '../src/test/constants';

function drawnCategories(page: Page) {
  return page.getByRole('list', { name: 'Category board' }).getByRole('listitem');
}

function getTimerInput(page: Page) {
  return page.getByLabel('Timer', { exact: true });
}

function getRoundsInput(page: Page) {
  return page.getByLabel('Rounds', { exact: true });
}

function muteAudio(page: Page) {
  return page.getByRole('button', { name: 'Mute' }).click();
}

function startRound(page: Page, label: 'Start Round' | 'Next Round' = 'Start Round') {
  return page.getByRole('button', { name: label }).click();
}

async function waitForAppReady(page: Page) {
  await expect(
    page.getByRole('heading', { level: HEADING_LEVEL, name: SCATTERGORIES_HEADING }),
  ).toBeVisible();
}

test.describe('Accessibility', () => {
  test('should not have any detectable accessibility violations on idle screen', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForAppReady(page);

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have any detectable accessibility violations during a running round', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForAppReady(page);
    await muteAudio(page);
    await startRound(page);

    // Wait for GO state
    await expect(page.getByText(GO)).toBeVisible({ timeout: ROUND_STATE_TIMEOUT_MS });

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test('loads with the correct title and heading', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);

  await expect(page).toHaveTitle(TITLE);
  await expect(page.getByRole('heading', { level: HEADING_LEVEL })).toHaveText(
    SCATTERGORIES_HEADING,
  );
});

test('persists timer setting across reload via localStorage', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);

  const timer = getTimerInput(page);
  await expect(timer).toHaveValue('90');

  await timer.fill('130');
  await timer.blur();

  await page.reload();
  await waitForAppReady(page);
  await expect(getTimerInput(page)).toHaveValue('130');
});

test('runs a full round cycle end to end', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);

  const timer = getTimerInput(page);
  await timer.fill('5');
  await timer.blur();
  await muteAudio(page);

  await startRound(page);

  await expect(page.getByText(GET_READY)).toBeVisible({ timeout: ROUND_MESSAGE_TIMEOUT_MS });
  await expect(page.getByText(GO)).toBeVisible({ timeout: ROUND_MESSAGE_TIMEOUT_MS });
  await expect(page.getByText(ROUND_OVER)).toBeVisible({ timeout: ROUND_MESSAGE_TIMEOUT_MS });

  await page.getByRole('button', { name: RESET }).click();
  await expect(page.getByRole('button', { name: ROUND_BUTTON })).toBeVisible();
});

test('runs a multi-round game to completion', async ({ page }) => {
  test.setTimeout(MULTI_ROUND_TEST_TIMEOUT_MS);
  await page.goto('/');
  await waitForAppReady(page);

  // Setup: 2 rounds at the app's minimum timer duration.
  const roundsInput = getRoundsInput(page);
  await roundsInput.fill('2');
  await roundsInput.blur();

  const timerInput = getTimerInput(page);
  await timerInput.fill(APP_MIN_TIMER_SECONDS);
  await timerInput.blur();

  await muteAudio(page);

  // Round 1
  await startRound(page);
  await expect(page.getByText(ROUND_ONE_OF_TWO)).toBeVisible();
  await expect(page.getByText(ROUND_OVER)).toBeVisible({ timeout: ROUND_MESSAGE_TIMEOUT_MS });

  // Start Round 2
  await startRound(page, 'Next Round');
  await expect(page.getByText(ROUND_TWO_OF_TWO)).toBeVisible();

  // Wait for the full end-game message
  await expect(page.getByText(GAME_OVER)).toBeVisible({ timeout: ROUND_MESSAGE_TIMEOUT_MS });

  await expect(page.getByRole('button', { name: 'New Game' })).toBeVisible();
});

test('starts a round via the Space keyboard shortcut', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);

  await muteAudio(page);
  await page.locator('body').press('Space');

  await expect(page.getByRole('button', { name: 'Spinning...' })).toBeVisible();
});

test('skip letter via R mid-round changes letter without resetting timer', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);

  await getTimerInput(page).fill('20');
  await getTimerInput(page).blur();
  await muteAudio(page);
  await startRound(page);

  await expect(page.getByText(GO)).toBeVisible({ timeout: ROUND_STATE_TIMEOUT_MS });

  const letter = page.locator('.letter');
  const timer = page.locator('.timer.running');
  const beforeLetter = await letter.textContent();

  await page.locator('body').press('r');
  await page.waitForTimeout(SKIP_LETTER_WAIT_MS);

  await expect(letter).not.toHaveText(beforeLetter ?? '', { timeout: LETTER_CHANGE_TIMEOUT_MS });
  await expect(page.getByText(GET_READY)).not.toBeVisible();
  await expect(timer).toBeVisible();
});

test('pause and resume via P stops and restarts timer countdown', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);

  await getTimerInput(page).fill('8');
  await getTimerInput(page).blur();
  await muteAudio(page);
  await startRound(page);

  await expect(page.getByText(GO)).toBeVisible({ timeout: ROUND_STATE_TIMEOUT_MS });

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
  await waitForAppReady(page);

  const customInput = page.getByRole('textbox', { name: 'Add custom category' });
  await customInput.fill('Space Opera Titles');
  await page.getByRole('button', { name: 'Add' }).click();
  await customInput.fill('Retro Consoles');
  await page.getByRole('button', { name: 'Add' }).click();

  await page.getByLabel('Source').selectOption('custom');
  await page.getByLabel('Draw').fill('2');
  await page.getByLabel('Draw').blur();
  await page.getByRole('button', { name: 'Shuffle' }).click();

  const categoryList = drawnCategories(page);
  await expect(categoryList).toHaveCount(2);
  await expect(page.getByRole('list', { name: 'Category board' })).toContainText(
    'Space Opera Titles',
  );
  await expect(page.getByRole('list', { name: 'Category board' })).toContainText('Retro Consoles');
});

test('language selector switches copy and persists after reload', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);

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
    await page.evaluate((code) => {
      window.localStorage.setItem('scattergories.language', code);
    }, locale.code);

    await page.reload();
    await waitForAppReady(page);
    await expect(page.getByRole('button', { name: locale.startRound })).toBeVisible();
    await expect(page.getByRole('button', { name: locale.howToPlay })).toBeVisible();
  }, Promise.resolve());
});
