import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { USED_LETTERS_TEXT } from './test/constants';
import { renderApp, resetAppTestState, SELECTED_CATEGORIES } from './test/renderApp';

beforeEach(resetAppTestState);

it('hides used letters in auto mode', async () => {
  const { user } = await renderApp();

  await user.click(screen.getByRole('button', { name: 'Start Round' }));
  expect(screen.queryByText(USED_LETTERS_TEXT)).not.toBeInTheDocument();
});

it('shows used letters when categories are pinned', async () => {
  const { user } = await renderApp();

  await user.click(screen.getByRole('button', { name: 'Pin categories' }));
  await user.click(screen.getByRole('button', { name: 'Start Round' }));
  expect(await screen.findByText(USED_LETTERS_TEXT)).not.toHaveTextContent('None yet');
});

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

it('persists pinned category mode across remount with the same localStorage', async () => {
  const first = await renderApp();

  await first.user.click(screen.getByRole('button', { name: 'Pin categories' }));
  expect(screen.getByRole('button', { name: 'Unpin categories' })).toBeInTheDocument();

  first.view.unmount();

  await renderApp();
  expect(screen.getByRole('button', { name: 'Unpin categories' })).toBeInTheDocument();
});

it('redraws categories on a fresh round in auto mode but keeps them on skip', async () => {
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

  // Auto mode: starting a fresh round reshuffles the pack categories.
  await user.click(screen.getByRole('button', { name: 'Start Round' }));
  await waitFor(() => {
    expect(items()).not.toEqual(initialCategories);
  });
  const afterStart = items();

  // Skip keeps the same categories (here, with the deck pinned).
  await user.click(screen.getByRole('button', { name: 'Pin categories' }));
  await user.click(screen.getByRole('button', { name: 'Skip Letter' }));
  await waitFor(() => {
    expect(items()).toEqual(afterStart);
  });
});
