import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
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

async function renderApp() {
  const view = render(<App />);
  await screen.findByRole('heading', { level: HEADING_LEVEL, name: SCATTERGORIES_HEADING });
  return view;
}

describe('Scattergories App', () => {
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
    await renderApp();

    expect(screen.getByLabelText('Timer')).toHaveValue(DEFAULT_TIMER_SECONDS);
    expect(screen.getByLabelText('Rounds')).toHaveValue(DEFAULT_ROUNDS);
    expect(screen.getByLabelText('Draw')).toHaveValue(DEFAULT_DRAW_COUNT);
    expect(screen.getByText(USED_LETTERS_NONE_YET)).toBeInTheDocument();
  });

  it('adds and removes a custom category', async () => {
    const user = userEvent.setup();
    await renderApp();

    const input = screen.getByRole('textbox', { name: 'Add custom category' });
    await user.type(input, CUSTOM_CATEGORY);
    await user.click(screen.getByRole('button', { name: 'Add' }));

    const list = screen.getByRole('list', { name: 'Custom categories' });
    expect(list).toHaveTextContent(CUSTOM_CATEGORY);

    await user.click(screen.getByRole('button', { name: `Remove ${CUSTOM_CATEGORY}` }));

    expect(screen.queryByRole('list', { name: 'Custom categories' })).not.toBeInTheDocument();
    expect(screen.getByText(NO_CUSTOM_CATEGORIES)).toBeInTheDocument();
  });

  it('warns when switching to Custom mode with no custom categories', async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.selectOptions(screen.getByLabelText('Source'), 'custom');

    expect(screen.getByText(ADD_AT_LEAST_ONE_CUSTOM_CATEGORY)).toBeInTheDocument();
  });

  it('adds a custom category by pressing Enter', async () => {
    const user = userEvent.setup();
    await renderApp();

    const input = screen.getByRole('textbox', { name: 'Add custom category' });
    await user.type(input, `${KEYBOARD_CATEGORY}{Enter}`);

    const list = screen.getByRole('list', { name: 'Custom categories' });
    expect(list).toHaveTextContent(KEYBOARD_CATEGORY);
  });

  it('focuses the custom category input via the "a" shortcut', async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.keyboard('a');

    expect(screen.getByRole('textbox', { name: 'Add custom category' })).toHaveFocus();
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

  it('opens and closes the How To Play modal via footer button and Escape key', async () => {
    const user = userEvent.setup();
    await renderApp();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'How to Play' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('new game resets round count and clears used letters', async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByRole('button', { name: 'Start Round' }));
    await screen.findByText(USED_LETTERS_TEXT);

    expect(screen.getByText(USED_LETTERS_TEXT)).not.toHaveTextContent('None yet');

    await user.click(screen.getByRole('button', { name: 'New Game' }));

    expect(screen.getByText('Round 1 of 3')).toBeInTheDocument();
    expect(screen.getByText(USED_LETTERS_NONE_YET)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Round' })).toBeInTheDocument();
  });

  it('switching Source between default, custom, and mixed updates visible categories', async () => {
    const user = userEvent.setup();
    await renderApp();

    const source = screen.getByLabelText('Source');
    const addInput = screen.getByRole('textbox', { name: 'Add custom category' });
    await user.type(addInput, 'Only Custom Category');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    const drawInput = screen.getByLabelText('Draw');
    await user.clear(drawInput);
    await user.type(drawInput, String(MAX_DRAW_COUNT));
    await user.tab();

    await user.selectOptions(source, 'custom');
    const drawnList = screen.getByRole('list', { name: 'Category board' });
    expect(within(drawnList).getAllByRole('listitem')).toHaveLength(MIN_VISIBLE_BOARD_ITEMS);
    expect(drawnList).toHaveTextContent(ONLY_CUSTOM_CATEGORY);

    await user.selectOptions(source, 'default');
    expect(
      within(screen.getByRole('list', { name: 'Category board' })).getAllByRole('listitem').length,
    ).toBeGreaterThan(MIN_VISIBLE_BOARD_ITEMS);
    expect(screen.getByRole('list', { name: 'Category board' })).not.toHaveTextContent(
      ONLY_CUSTOM_CATEGORY,
    );

    await user.selectOptions(source, 'mixed');
    expect(
      within(screen.getByRole('list', { name: 'Category board' })).getAllByRole('listitem').length,
    ).toBeGreaterThan(MIN_VISIBLE_BOARD_ITEMS);
  });

  it('changing Draw count shuffles a new slice with the expected length', async () => {
    const user = userEvent.setup();
    await renderApp();

    await waitFor(() => {
      expect(
        within(screen.getByRole('list', { name: 'Category board' })).getAllByRole('listitem'),
      ).toHaveLength(DEFAULT_DRAW_COUNT);
    });

    const categoriesBefore = within(
      screen.getByRole('list', { name: 'Category board' }),
    ).getAllByRole('listitem').length;
    expect(categoriesBefore).toBe(DEFAULT_DRAW_COUNT);

    const drawInput = screen.getByLabelText('Draw');
    await user.clear(drawInput);
    await user.type(drawInput, String(FOUR));
    await user.tab();

    expect(
      within(screen.getByRole('list', { name: 'Category board' })).getAllByRole('listitem'),
    ).toHaveLength(FOUR);
  });

  it('persists custom categories across remount with the same localStorage', async () => {
    const user = userEvent.setup();
    const first = await renderApp();

    await user.type(
      screen.getByRole('textbox', { name: 'Add custom category' }),
      PERSISTED_CATEGORY,
    );
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByRole('list', { name: 'Custom categories' })).toHaveTextContent(
      PERSISTED_CATEGORY,
    );

    first.unmount();

    await renderApp();
    expect(screen.getByRole('list', { name: 'Custom categories' })).toHaveTextContent(
      PERSISTED_CATEGORY,
    );
  });
});
