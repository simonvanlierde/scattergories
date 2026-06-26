import { screen, within } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { DEFAULT_DRAW_COUNT, DEFAULT_TIMER_SECONDS } from './test/gameConstants';
import {
  DRAW_SUMMARY_PATTERN,
  openCustomizeDeck,
  openTimerPopover,
  READY_SUMMARY_PATTERN,
  renderApp,
  resetAppTestState,
  SELECTED_CATEGORIES,
  SOURCE_SUMMARY_PATTERN,
} from './test/renderApp';

const SESSION_ROUND_TEXT = /session round/i;

beforeEach(resetAppTestState);

it('renders the core app shell and primary controls', async () => {
  await renderApp();

  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Scattergories');
  expect(screen.getByRole('button', { name: 'Start Round' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'How to Play' })).toBeInTheDocument();
});

it('keeps the main surface lean and categories outside the playmat', async () => {
  await renderApp();

  expect(screen.queryByTestId('onboarding-banner')).not.toBeInTheDocument();

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
});

it('groups secondary play controls by intent', async () => {
  const { user } = await renderApp();

  const playmat = screen.getByRole('region', { name: 'Game board' });

  // Idle: only audio controls are shown; round controls appear once a round is in progress.
  expect(within(playmat).getByRole('group', { name: 'Audio controls' })).toBeInTheDocument();
  expect(within(playmat).queryByRole('group', { name: 'Round controls' })).not.toBeInTheDocument();
  expect(
    within(playmat).queryByRole('group', { name: 'Session controls' }),
  ).not.toBeInTheDocument();
  expect(within(playmat).queryByText(SESSION_ROUND_TEXT)).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Start Round' }));
  expect(within(playmat).getByRole('group', { name: 'Round controls' })).toBeInTheDocument();
});

it('shows default editable settings in their owning dialogs', async () => {
  const { user } = await renderApp();

  const timerPopover = await openTimerPopover(user);
  expect(within(timerPopover).getByLabelText('Timer')).toHaveValue(DEFAULT_TIMER_SECONDS);
  expect(within(timerPopover).queryByLabelText('Rounds')).not.toBeInTheDocument();
  await user.keyboard('{Escape}');

  const customizeDialog = await openCustomizeDeck(user);
  expect(within(customizeDialog).getByLabelText('Draw')).toHaveValue(DEFAULT_DRAW_COUNT);
});

it('opens and dismisses the How To Play dialog', async () => {
  const { user } = await renderApp();

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'How to Play' }));
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  expect(await screen.findByText('How to Play Scattergories')).toBeInTheDocument();

  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
