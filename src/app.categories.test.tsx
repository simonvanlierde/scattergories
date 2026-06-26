import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import {
  CUSTOM_CATEGORY,
  FOUR,
  KEYBOARD_CATEGORY,
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

const DECK_LABEL = 'Category deck';
const EMPTY_DECK = /deck is empty/i;
const MIN_VISIBLE_BOARD_ITEMS = 1;

beforeEach(resetAppTestState);

function deckRow(dialog: HTMLElement, name: string): HTMLElement {
  const deck = within(dialog).getByRole('list', { name: DECK_LABEL });
  const row = within(deck).getByText(name).closest('li');
  if (!row) {
    throw new Error(`No deck row for ${name}`);
  }
  return row as HTMLElement;
}

it('adds and removes a custom category from the deck', async () => {
  const { user } = await renderApp();
  const dialog = await openCustomizeDeck(user);

  const input = within(dialog).getByRole('textbox', { name: 'Add custom category' });
  await user.type(input, CUSTOM_CATEGORY);
  await user.click(within(dialog).getByRole('button', { name: 'Add' }));

  expect(within(dialog).getByRole('list', { name: DECK_LABEL })).toHaveTextContent(CUSTOM_CATEGORY);

  await user.click(
    within(deckRow(dialog, CUSTOM_CATEGORY)).getByRole('button', { name: 'Remove' }),
  );

  expect(within(dialog).getByRole('list', { name: DECK_LABEL })).not.toHaveTextContent(
    CUSTOM_CATEGORY,
  );
});

it('shows guidance when the deck is emptied and accepts a custom entry', async () => {
  const { user } = await renderApp();
  const dialog = await openCustomizeDeck(user);

  // Clearing built-ins (with no customs) empties the deck.
  await user.click(within(dialog).getByRole('button', { name: 'Remove built-in' }));
  expect(within(dialog).getByText(EMPTY_DECK)).toBeInTheDocument();

  const input = within(dialog).getByRole('textbox', { name: 'Add custom category' });
  await user.type(input, `${KEYBOARD_CATEGORY}{Enter}`);

  expect(within(dialog).getByRole('list', { name: DECK_LABEL })).toHaveTextContent(
    KEYBOARD_CATEGORY,
  );
});

it('always shows custom categories and lets built-ins be cleared and re-added', async () => {
  const { user } = await renderApp();
  const dialog = await openCustomizeDeck(user);

  await user.type(
    within(dialog).getByRole('textbox', { name: 'Add custom category' }),
    ONLY_CUSTOM_CATEGORY,
  );
  await user.click(within(dialog).getByRole('button', { name: 'Add' }));

  // The custom category appears in the drawn deck alongside built-ins.
  const drawnList = screen.getByRole('list', { name: SELECTED_CATEGORIES });
  expect(drawnList).toHaveTextContent(ONLY_CUSTOM_CATEGORY);
  expect(within(drawnList).getAllByRole('listitem').length).toBeGreaterThan(
    MIN_VISIBLE_BOARD_ITEMS,
  );

  // Clearing built-ins leaves only the custom one.
  await user.click(within(dialog).getByRole('button', { name: 'Remove built-in' }));
  expect(within(drawnList).getAllByRole('listitem')).toHaveLength(MIN_VISIBLE_BOARD_ITEMS);
  expect(drawnList).toHaveTextContent(ONLY_CUSTOM_CATEGORY);

  // Adding a pack restores built-in fill.
  await user.selectOptions(within(dialog).getByLabelText('Add a category pack'), 'foodie');
  await waitFor(() => {
    expect(selectedCategoryItems().length).toBeGreaterThan(MIN_VISIBLE_BOARD_ITEMS);
  });
});

it('updates the drawn category count', async () => {
  const { user } = await renderApp();

  await waitFor(() => expect(selectedCategoryItems()).toHaveLength(DEFAULT_DRAW_COUNT));

  const dialog = await openCustomizeDeck(user);
  const drawInput = within(dialog).getByLabelText('Draw');
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
  expect(within(remountedDialog).getByRole('list', { name: DECK_LABEL })).toHaveTextContent(
    PERSISTED_CATEGORY,
  );
});
