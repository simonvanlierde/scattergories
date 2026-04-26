import { screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { renderApp, resetAppTestState } from './test/renderApp';

beforeEach(resetAppTestState);

it('reveals category tools with the category shortcut', async () => {
  const { user } = await renderApp();

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

it('toggles categories and mute from user controls', async () => {
  const { user } = await renderApp();

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

  await user.click(screen.getByRole('button', { name: 'Mute' }));
  expect(screen.getByRole('button', { name: 'Unmute' })).toBeInTheDocument();
});
