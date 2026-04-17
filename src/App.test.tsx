import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { settingsStore } from './hooks/useSettings';

describe('Scattergories App', () => {
  beforeEach(() => {
    window.localStorage.clear();
    settingsStore.reset();
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

  it('toggles mute button label between Mute and Unmute', async () => {
    const user = userEvent.setup();
    render(<App />);

    const muteButton = screen.getByRole('button', { name: 'Mute' });
    expect(muteButton).toBeInTheDocument();

    await user.click(muteButton);
    expect(screen.getByRole('button', { name: 'Unmute' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Unmute' }));
    expect(screen.getByRole('button', { name: 'Mute' })).toBeInTheDocument();
  });

  it('opens and closes the How To Play modal via footer button and Escape key', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'How to Play' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('new game resets round count and clears used letters', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Start Round' }));
    await screen.findByText(/Used letters:/i);

    expect(screen.getByText(/Used letters:/i)).not.toHaveTextContent('None yet');

    await user.click(screen.getByRole('button', { name: 'New Game' }));

    expect(screen.getByText('Round 1 of 3')).toBeInTheDocument();
    expect(screen.getByText(/Used letters: None yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Round' })).toBeInTheDocument();
  });

  it('switching Source between default, custom, and mixed updates visible categories', async () => {
    const user = userEvent.setup();
    render(<App />);

    const source = screen.getByLabelText('Source');
    const addInput = screen.getByRole('textbox', { name: 'Add custom category' });
    await user.type(addInput, 'Only Custom Category');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    const drawInput = screen.getByLabelText('Draw');
    await user.clear(drawInput);
    await user.type(drawInput, '999');
    await user.tab();

    await user.selectOptions(source, 'custom');
    expect(document.querySelectorAll('#catList li')).toHaveLength(1);
    expect(
      Array.from(document.querySelectorAll('#catList li')).some((item) =>
        item.textContent?.includes('Only Custom Category'),
      ),
    ).toBe(true);

    await user.selectOptions(source, 'default');
    expect(document.querySelectorAll('#catList li').length).toBeGreaterThan(1);
    expect(
      Array.from(document.querySelectorAll('#catList li')).some((item) =>
        item.textContent?.includes('Only Custom Category'),
      ),
    ).toBe(false);

    await user.selectOptions(source, 'mixed');
    expect(document.querySelectorAll('#catList li').length).toBeGreaterThan(1);
  });

  it('changing Draw count shuffles a new slice with the expected length', async () => {
    const user = userEvent.setup();
    render(<App />);

    const categoriesBefore = screen.getAllByRole('listitem').length;
    expect(categoriesBefore).toBe(12);

    const drawInput = screen.getByLabelText('Draw');
    await user.clear(drawInput);
    await user.type(drawInput, '4');
    await user.tab();

    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('persists custom categories across remount with the same localStorage', async () => {
    const user = userEvent.setup();
    const first = render(<App />);

    await user.type(screen.getByRole('textbox', { name: 'Add custom category' }), 'Persisted Cat');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByRole('list', { name: 'Custom categories' })).toHaveTextContent(
      'Persisted Cat',
    );

    first.unmount();

    render(<App />);
    expect(screen.getByRole('list', { name: 'Custom categories' })).toHaveTextContent(
      'Persisted Cat',
    );
  });
});
