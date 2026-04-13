import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';

describe('Scattergories App', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders the heading and start button', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Scattergories');
    expect(screen.getByRole('button', { name: 'Start Round' })).toBeInTheDocument();
  });

  it('shows default settings', () => {
    render(<App />);

    expect(screen.getByLabelText('Timer')).toHaveValue(90);
    expect(screen.getByLabelText('Rounds')).toHaveValue(3);
    expect(screen.getByLabelText('Draw')).toHaveValue(12);
    expect(screen.getByText(/Used letters: None yet/i)).toBeInTheDocument();
  });

  it('adds and removes a custom category', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByRole('textbox', { name: 'Add custom category' });
    await user.type(input, 'My Custom Category');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    const list = screen.getByRole('list', { name: 'Custom categories' });
    expect(list).toHaveTextContent('My Custom Category');

    await user.click(screen.getByRole('button', { name: 'Remove My Custom Category' }));

    expect(screen.queryByRole('list', { name: 'Custom categories' })).not.toBeInTheDocument();
    expect(screen.getByText(/no custom categories yet/i)).toBeInTheDocument();
  });

  it('warns when switching to Custom mode with no custom categories', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText('Source'), 'custom');

    expect(screen.getByText(/add at least one custom category/i)).toBeInTheDocument();
  });

  it('adds a custom category by pressing Enter', async () => {
    const user = userEvent.setup();
    render(<App />);

    const input = screen.getByRole('textbox', { name: 'Add custom category' });
    await user.type(input, 'Keyboard Enter Add{Enter}');

    const list = screen.getByRole('list', { name: 'Custom categories' });
    expect(list).toHaveTextContent('Keyboard Enter Add');
  });

  it('focuses the custom category input via the "a" shortcut', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard('a');

    expect(screen.getByRole('textbox', { name: 'Add custom category' })).toHaveFocus();
  });
});
