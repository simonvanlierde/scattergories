import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { USED_LETTERS_TEXT } from './test/constants';
import { renderApp, resetAppTestState, SELECTED_CATEGORIES } from './test/renderApp';

const RESET_BUTTON = /Reset/;

beforeEach(resetAppTestState);

it('hides used letters in auto mode and shows them when categories are pinned', async () => {
  const { user } = await renderApp();

  await user.click(screen.getByRole('button', { name: 'Start Round' }));
  expect(screen.queryByText(USED_LETTERS_TEXT)).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: RESET_BUTTON }));
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

it('redraws categories on each new letter in auto mode but not while pinned', async () => {
  const { user } = await renderApp();
  const drawnList = screen.getByRole('list', { name: SELECTED_CATEGORIES });

  await waitFor(() => {
    expect(within(drawnList).getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  const initialCategories = within(drawnList)
    .getAllByRole('listitem')
    .map((item) => item.textContent);

  await user.click(screen.getByRole('button', { name: 'Start Round' }));

  await waitFor(() => {
    const afterStart = within(drawnList)
      .getAllByRole('listitem')
      .map((item) => item.textContent);
    expect(afterStart).not.toEqual(initialCategories);
  });

  await user.click(screen.getByRole('button', { name: 'Pin categories' }));
  const pinnedCategories = within(drawnList)
    .getAllByRole('listitem')
    .map((item) => item.textContent);

  await user.click(screen.getByRole('button', { name: 'Skip Letter' }));

  await waitFor(() => {
    const afterPinnedSkip = within(drawnList)
      .getAllByRole('listitem')
      .map((item) => item.textContent);
    expect(afterPinnedSkip).toEqual(pinnedCategories);
  });
});
