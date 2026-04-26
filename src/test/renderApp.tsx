import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { App } from '@/app/App';
import { resetSettingsToStorage } from '@/features/settings/SettingsProvider';
import { HEADING_LEVEL, SCATTERGORIES_HEADING } from './constants';

export const SELECTED_CATEGORIES = 'Selected categories';
export const SOURCE_SUMMARY_PATTERN = /Source:/i;
export const DRAW_SUMMARY_PATTERN = /Draw:/i;
export const READY_SUMMARY_PATTERN = /categories ready/i;

export function resetAppTestState() {
  window.localStorage.clear();
  resetSettingsToStorage();
}

export async function renderApp() {
  const user = userEvent.setup();
  const view = render(<App />);
  await screen.findByRole('heading', { level: HEADING_LEVEL, name: SCATTERGORIES_HEADING });
  return { user, view };
}

export async function openCustomizeDeck(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Customize deck' }));
  return screen.findByRole('dialog', { name: 'Customize deck' });
}

export async function openSettings(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Settings' }));
  return screen.findByRole('dialog', { name: 'Settings' });
}

export function selectedCategoryItems() {
  return within(screen.getByRole('list', { name: SELECTED_CATEGORIES })).getAllByRole('listitem');
}
