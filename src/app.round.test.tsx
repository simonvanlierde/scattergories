import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { renderApp, resetAppTestState, SELECTED_CATEGORIES } from './test/renderApp';

beforeEach(resetAppTestState);

it('persists the category panel preference across remount with the same localStorage', async () => {
  const first = await renderApp();

  await first.user.click(screen.getByRole('button', { name: 'Hide categories' }));
  expect(screen.getByRole('button', { name: 'Open categories' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );

  first.view.unmount();

  await renderApp();
  expect(screen.getByRole('button', { name: 'Open categories' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
});

it('redraws categories on a fresh round but keeps them when rerolling the letter', async () => {
  // Make category redraws instant (skip the roll animation) for deterministic assertions.
  window.matchMedia = ((query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;

  const { user } = await renderApp();
  const drawnList = screen.getByRole('list', { name: SELECTED_CATEGORIES });
  const items = () =>
    within(drawnList)
      .getAllByRole('listitem')
      .map((item) => item.textContent);

  await waitFor(() => {
    expect(items().length).toBeGreaterThan(0);
  });
  const initialCategories = items();

  // Starting a fresh round reshuffles the (unpinned) categories.
  await user.click(screen.getByRole('button', { name: 'Start round' }));
  await waitFor(() => {
    expect(items()).not.toEqual(initialCategories);
  });
  const afterStart = items();

  // Pause, then reroll the letter — categories stay the same.
  await user.click(screen.getByRole('button', { name: 'Pause' }));
  await user.click(screen.getByRole('button', { name: 'New letter' }));
  await waitFor(() => {
    expect(items()).toEqual(afterStart);
  });
});
