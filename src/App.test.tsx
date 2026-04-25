import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { App } from './App';
import { resetSettingsToStorage } from './settings/SettingsProvider';
import {
  ADD_AT_LEAST_ONE_CUSTOM_CATEGORY,
  CUSTOM_CATEGORY,
  FOUR,
  HEADING_LEVEL,
  KEYBOARD_CATEGORY,
  NO_CUSTOM_CATEGORIES,
  ONLY_CUSTOM_CATEGORY,
  PERSISTED_CATEGORY,
  SCATTERGORIES_HEADING,
  USED_LETTERS_NONE_YET,
  USED_LETTERS_TEXT,
} from './test/constants';
import { DEFAULT_DRAW_COUNT, DEFAULT_ROUNDS, DEFAULT_TIMER_SECONDS } from './test/gameConstants';

const MAX_DRAW_COUNT = 999;
const MIN_VISIBLE_BOARD_ITEMS = 1;
const SELECTED_CATEGORIES = 'Selected categories';
const SOURCE_SUMMARY_PATTERN = /Source:/i;
const DRAW_SUMMARY_PATTERN = /Draw:/i;
const READY_SUMMARY_PATTERN = /categories ready/i;

async function openCustomizeDeck(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Customize deck' }));
  return screen.findByRole('dialog', { name: 'Customize deck' });
}

async function openSettings(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Settings' }));
  return screen.findByRole('dialog', { name: 'Settings' });
}

async function renderApp() {
  const view = render(<App />);
  await screen.findByRole('heading', { level: HEADING_LEVEL, name: SCATTERGORIES_HEADING });
  return view;
}

beforeEach(() => {
  window.localStorage.clear();
  resetSettingsToStorage();
});

it('renders the heading and start button', async () => {
  await renderApp();

  expect(screen.getByRole('heading', { level: HEADING_LEVEL })).toHaveTextContent(
    SCATTERGORIES_HEADING,
  );
  expect(screen.getByRole('button', { name: 'Start Round' })).toBeInTheDocument();
});

it('shows default settings', async () => {
  const user = userEvent.setup();
  await renderApp();

  const settingsDialog = await openSettings(user);
  expect(within(settingsDialog).getByLabelText('Timer')).toHaveValue(DEFAULT_TIMER_SECONDS);
  expect(within(settingsDialog).getByLabelText('Rounds')).toHaveValue(DEFAULT_ROUNDS);
  await user.keyboard('{Escape}');

  const customizeDialog = await openCustomizeDeck(user);
  expect(within(customizeDialog).getByLabelText('Draw')).toHaveValue(DEFAULT_DRAW_COUNT);
  expect(screen.getByText(USED_LETTERS_NONE_YET)).toBeInTheDocument();
});

it('keeps the playmat focused on letter and timer while categories live in the panel', async () => {
  await renderApp();

  const playmat = screen.getByRole('region', { name: 'Game board' });
  const categoriesPanel = screen.getByRole('region', { name: 'Categories' });

  expect(
    within(playmat).queryByRole('list', { name: SELECTED_CATEGORIES }),
  ).not.toBeInTheDocument();
  expect(
    within(categoriesPanel).getByRole('list', { name: SELECTED_CATEGORIES }),
  ).toBeInTheDocument();
  expect(within(categoriesPanel).queryByRole('button', { pressed: true })).not.toBeInTheDocument();
  expect(within(categoriesPanel).queryByText(SOURCE_SUMMARY_PATTERN)).not.toBeInTheDocument();
  expect(within(categoriesPanel).queryByText(DRAW_SUMMARY_PATTERN)).not.toBeInTheDocument();
  expect(within(categoriesPanel).queryByText(READY_SUMMARY_PATTERN)).not.toBeInTheDocument();
  expect(within(categoriesPanel).getByRole('button', { name: 'Shuffle' })).toBeInTheDocument();
  expect(
    within(categoriesPanel).getByRole('button', { name: 'Customize deck' }),
  ).toBeInTheDocument();
});

it('adds and removes a custom category', async () => {
  const user = userEvent.setup();
  await renderApp();

  const dialog = await openCustomizeDeck(user);
  const input = within(dialog).getByRole('textbox', { name: 'Add custom category' });
  await user.type(input, CUSTOM_CATEGORY);
  await user.click(within(dialog).getByRole('button', { name: 'Add' }));

  const list = within(dialog).getByRole('list', { name: 'Custom categories' });
  expect(list).toHaveTextContent(CUSTOM_CATEGORY);

  await user.click(within(dialog).getByRole('button', { name: `Remove ${CUSTOM_CATEGORY}` }));

  expect(within(dialog).queryByRole('list', { name: 'Custom categories' })).not.toBeInTheDocument();
  expect(within(dialog).getByText(NO_CUSTOM_CATEGORIES)).toBeInTheDocument();
});

it('warns when switching to Custom mode with no custom categories', async () => {
  const user = userEvent.setup();
  await renderApp();

  const dialog = await openCustomizeDeck(user);
  await user.selectOptions(within(dialog).getByRole('combobox', { name: 'Source' }), 'custom');

  expect(screen.getByText(ADD_AT_LEAST_ONE_CUSTOM_CATEGORY)).toBeInTheDocument();
});

it('adds a custom category by pressing Enter', async () => {
  const user = userEvent.setup();
  await renderApp();

  const dialog = await openCustomizeDeck(user);
  const input = within(dialog).getByRole('textbox', { name: 'Add custom category' });
  await user.type(input, `${KEYBOARD_CATEGORY}{Enter}`);

  const list = within(dialog).getByRole('list', { name: 'Custom categories' });
  expect(list).toHaveTextContent(KEYBOARD_CATEGORY);
});

it('reveals the category tools via the "a" shortcut', async () => {
  const user = userEvent.setup();
  await renderApp();

  await user.click(screen.getByRole('button', { name: 'Hide categories' }));
  expect(screen.getByRole('button', { name: 'Open categories' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );

  await user.keyboard('a');

  expect(screen.getByRole('button', { name: 'Hide categories' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  expect(screen.getByRole('button', { name: 'Customize deck' })).toBeVisible();
});

it('toggles the prompt deck with the "c" shortcut', async () => {
  const user = userEvent.setup();
  await renderApp();

  await user.keyboard('c');
  expect(screen.getByRole('button', { name: 'Open categories' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );

  await user.keyboard('c');
  expect(screen.getByRole('button', { name: 'Hide categories' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
});

it('toggles mute button label between Mute and Unmute', async () => {
  const user = userEvent.setup();
  await renderApp();

  const muteButton = screen.getByRole('button', { name: 'Mute' });
  expect(muteButton).toBeInTheDocument();

  await user.click(muteButton);
  expect(screen.getByRole('button', { name: 'Unmute' })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Unmute' }));
  expect(screen.getByRole('button', { name: 'Mute' })).toBeInTheDocument();
});

it('opens and keeps the How To Play modal visible until it is dismissed', async () => {
  const user = userEvent.setup();
  await renderApp();

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'How to Play' }));
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  expect(await screen.findByText('How to Play Scattergories')).toBeInTheDocument();

  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('new session resets session progress and clears used letters', async () => {
  const user = userEvent.setup();
  await renderApp();

  await user.click(screen.getByRole('button', { name: 'Start Round' }));
  await screen.findByText(USED_LETTERS_TEXT);

  expect(screen.getByText(USED_LETTERS_TEXT)).not.toHaveTextContent('None yet');

  await user.click(screen.getByRole('button', { name: 'New Session' }));

  expect(screen.getByText('Session round 1 of 3')).toBeInTheDocument();
  expect(screen.getByText(USED_LETTERS_NONE_YET)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Start Round' })).toBeInTheDocument();
});

it('switching Source between default, custom, and mixed updates visible categories', async () => {
  const user = userEvent.setup();
  await renderApp();

  const dialog = await openCustomizeDeck(user);
  const source = within(dialog).getByLabelText('Source');
  const addInput = within(dialog).getByRole('textbox', { name: 'Add custom category' });
  await user.type(addInput, 'Only Custom Category');
  await user.click(within(dialog).getByRole('button', { name: 'Add' }));

  const drawInput = within(dialog).getAllByRole('spinbutton')[0];
  await user.clear(drawInput);
  await user.type(drawInput, String(MAX_DRAW_COUNT));
  await user.tab();

  await user.selectOptions(source, 'custom');
  const drawnList = screen.getByRole('list', { name: SELECTED_CATEGORIES });
  expect(within(drawnList).getAllByRole('listitem')).toHaveLength(MIN_VISIBLE_BOARD_ITEMS);
  expect(drawnList).toHaveTextContent(ONLY_CUSTOM_CATEGORY);

  await user.selectOptions(source, 'default');
  expect(
    within(screen.getByRole('list', { name: SELECTED_CATEGORIES })).getAllByRole('listitem').length,
  ).toBeGreaterThan(MIN_VISIBLE_BOARD_ITEMS);
  expect(screen.getByRole('list', { name: SELECTED_CATEGORIES })).not.toHaveTextContent(
    ONLY_CUSTOM_CATEGORY,
  );

  await user.selectOptions(source, 'mixed');
  expect(
    within(screen.getByRole('list', { name: SELECTED_CATEGORIES })).getAllByRole('listitem').length,
  ).toBeGreaterThan(MIN_VISIBLE_BOARD_ITEMS);
});

it('changing Draw count shuffles a new slice with the expected length', async () => {
  const user = userEvent.setup();
  await renderApp();

  await waitFor(() => {
    expect(
      within(screen.getByRole('list', { name: SELECTED_CATEGORIES })).getAllByRole('listitem'),
    ).toHaveLength(DEFAULT_DRAW_COUNT);
  });

  const categoriesBefore = within(
    screen.getByRole('list', { name: SELECTED_CATEGORIES }),
  ).getAllByRole('listitem').length;
  expect(categoriesBefore).toBe(DEFAULT_DRAW_COUNT);

  const dialog = await openCustomizeDeck(user);
  const drawInput = within(dialog).getAllByRole('spinbutton')[0];
  await user.clear(drawInput);
  await user.type(drawInput, String(FOUR));
  await user.tab();

  expect(
    within(screen.getByRole('list', { name: SELECTED_CATEGORIES })).getAllByRole('listitem'),
  ).toHaveLength(FOUR);
});

it('persists custom categories across remount with the same localStorage', async () => {
  const user = userEvent.setup();
  const first = await renderApp();

  const dialog = await openCustomizeDeck(user);
  await user.type(
    within(dialog).getByRole('textbox', { name: 'Add custom category' }),
    PERSISTED_CATEGORY,
  );
  await user.click(within(dialog).getByRole('button', { name: 'Add' }));
  expect(within(dialog).getByRole('list', { name: 'Custom categories' })).toHaveTextContent(
    PERSISTED_CATEGORY,
  );

  first.unmount();

  await renderApp();
  const remountedDialog = await openCustomizeDeck(user);
  expect(
    within(remountedDialog).getByRole('list', { name: 'Custom categories' }),
  ).toHaveTextContent(PERSISTED_CATEGORY);
});

it('persists the prompt deck preference across remount with the same localStorage', async () => {
  const user = userEvent.setup();
  const first = await renderApp();

  await user.click(screen.getByRole('button', { name: 'Hide categories' }));
  expect(screen.getByRole('button', { name: 'Open categories' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );

  first.unmount();

  await renderApp();
  expect(screen.getByRole('button', { name: 'Open categories' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
});
