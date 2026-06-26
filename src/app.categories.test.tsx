import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import {
  ADD_AT_LEAST_ONE_CUSTOM_CATEGORY,
  CUSTOM_CATEGORY,
  FOUR,
  KEYBOARD_CATEGORY,
  NO_CUSTOM_CATEGORIES,
  ONLY_CUSTOM_CATEGORY,
  PERSISTED_CATEGORY,
} from './test/constants';
import { DEFAULT_DRAW_COUNT } from './test/gameConstants';
import {
  openCustomizeDeck,
  renderApp,
  resetAppTestState,
  SELECTED_CATEGORIES,
  selectedCategoryItems,
} from './test/renderApp';

const MIN_VISIBLE_BOARD_ITEMS = 1;

beforeEach(resetAppTestState);

it('adds and removes a custom category', async () => {
  const { user } = await renderApp();
  const dialog = await openCustomizeDeck(user);

  const input = within(dialog).getByRole('textbox', { name: 'Add custom category' });
  await user.type(input, CUSTOM_CATEGORY);
  await user.click(within(dialog).getByRole('button', { name: 'Add' }));

  expect(within(dialog).getByRole('list', { name: 'Custom categories' })).toHaveTextContent(
    CUSTOM_CATEGORY,
  );

  await user.click(within(dialog).getByRole('button', { name: `Remove ${CUSTOM_CATEGORY}` }));

  expect(within(dialog).queryByRole('list', { name: 'Custom categories' })).not.toBeInTheDocument();
  expect(within(dialog).getByText(NO_CUSTOM_CATEGORIES)).toBeInTheDocument();
});

it('shows guidance when the deck would be empty and accepts a custom entry', async () => {
  const { user } = await renderApp();
  const dialog = await openCustomizeDeck(user);

  // With pack categories off and no customs yet, the deck is empty.
  await user.click(within(dialog).getByRole('checkbox', { name: 'Include pack categories' }));
  expect(screen.getByText(ADD_AT_LEAST_ONE_CUSTOM_CATEGORY)).toBeInTheDocument();

  const input = within(dialog).getByRole('textbox', { name: 'Add custom category' });
  await user.type(input, `${KEYBOARD_CATEGORY}{Enter}`);

  expect(within(dialog).getByRole('list', { name: 'Custom categories' })).toHaveTextContent(
    KEYBOARD_CATEGORY,
  );
});

it('always shows custom categories and lets pack categories be toggled off', async () => {
  const { user } = await renderApp();
  const dialog = await openCustomizeDeck(user);

  await user.type(
    within(dialog).getByRole('textbox', { name: 'Add custom category' }),
    ONLY_CUSTOM_CATEGORY,
  );
  await user.click(within(dialog).getByRole('button', { name: 'Add' }));

  // The custom category always appears in the deck, alongside pack categories.
  const drawnList = screen.getByRole('list', { name: SELECTED_CATEGORIES });
  expect(drawnList).toHaveTextContent(ONLY_CUSTOM_CATEGORY);
  expect(within(drawnList).getAllByRole('listitem').length).toBeGreaterThan(
    MIN_VISIBLE_BOARD_ITEMS,
  );

  // Turning off pack categories leaves only the custom one.
  const includePack = within(dialog).getByRole('checkbox', { name: 'Include pack categories' });
  await user.click(includePack);
  expect(within(drawnList).getAllByRole('listitem')).toHaveLength(MIN_VISIBLE_BOARD_ITEMS);
  expect(drawnList).toHaveTextContent(ONLY_CUSTOM_CATEGORY);

  // Turning it back on restores the pack fill.
  await user.click(includePack);
  expect(selectedCategoryItems().length).toBeGreaterThan(MIN_VISIBLE_BOARD_ITEMS);
});

it('updates the drawn category count', async () => {
  const { user } = await renderApp();

  await waitFor(() => expect(selectedCategoryItems()).toHaveLength(DEFAULT_DRAW_COUNT));

  const dialog = await openCustomizeDeck(user);
  const drawInput = within(dialog).getAllByRole('spinbutton')[0];
  await user.clear(drawInput);
  await user.type(drawInput, String(FOUR));
  await user.tab();

  expect(selectedCategoryItems()).toHaveLength(FOUR);
});

it('persists custom categories across remount with the same localStorage', async () => {
  const first = await renderApp();
  const dialog = await openCustomizeDeck(first.user);

  await first.user.type(
    within(dialog).getByRole('textbox', { name: 'Add custom category' }),
    PERSISTED_CATEGORY,
  );
  await first.user.click(within(dialog).getByRole('button', { name: 'Add' }));

  first.view.unmount();

  const second = await renderApp();
  const remountedDialog = await openCustomizeDeck(second.user);
  expect(
    within(remountedDialog).getByRole('list', { name: 'Custom categories' }),
  ).toHaveTextContent(PERSISTED_CATEGORY);
});
