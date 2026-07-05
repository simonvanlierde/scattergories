import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

function fireKey(key: string, code?: string, target?: Partial<HTMLElement>) {
  const event = new KeyboardEvent('keydown', {
    key,
    code: code ?? key,
    bubbles: true,
  });
  if (target) {
    Object.defineProperty(event, 'target', { value: target });
  }
  window.dispatchEvent(event);
}

describe('useKeyboardShortcuts', () => {
  it('calls onSpace when Space is pressed', () => {
    const onSpace = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSpace }));
    fireKey(' ', 'Space');
    expect(onSpace).toHaveBeenCalledOnce();
  });

  it('calls onR when R is pressed', () => {
    const onR = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onR }));
    fireKey('r');
    expect(onR).toHaveBeenCalledOnce();
  });

  it('calls onP when P is pressed', () => {
    const onP = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onP }));
    fireKey('p');
    expect(onP).toHaveBeenCalledOnce();
  });

  it('calls onC when C is pressed', () => {
    const onC = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onC }));
    fireKey('c');
    expect(onC).toHaveBeenCalledOnce();
  });

  it('ignores browser chords with a modifier held', () => {
    const onR = vi.fn();
    const onC = vi.fn();
    const onP = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onR, onC, onP }));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', ctrlKey: true, bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', metaKey: true, bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', altKey: true, bubbles: true }));

    expect(onR).not.toHaveBeenCalled();
    expect(onC).not.toHaveBeenCalled();
    expect(onP).not.toHaveBeenCalled();
  });

  it('ignores keys when an INPUT is focused', () => {
    const onSpace = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSpace }));

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true });
    input.dispatchEvent(event);

    expect(onSpace).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('ignores keys when a TEXTAREA is focused', () => {
    const onR = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onR }));

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();

    const event = new KeyboardEvent('keydown', { key: 'r', bubbles: true });
    textarea.dispatchEvent(event);

    expect(onR).not.toHaveBeenCalled();
    document.body.removeChild(textarea);
  });

  it('lets a focused button handle its own Space activation', () => {
    const onSpace = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSpace }));

    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();

    const event = new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true });
    button.dispatchEvent(event);

    expect(onSpace).not.toHaveBeenCalled();
    document.body.removeChild(button);
  });

  it('ignores shortcuts while a <dialog> is open', () => {
    const onSpace = vi.fn();
    const onR = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onSpace, onR }));

    const dialog = document.createElement('dialog');
    document.body.appendChild(dialog);
    dialog.setAttribute('open', '');

    fireKey(' ', 'Space');
    fireKey('r');

    expect(onSpace).not.toHaveBeenCalled();
    expect(onR).not.toHaveBeenCalled();
    document.body.removeChild(dialog);
  });

  it('removes the listener on unmount', () => {
    const onC = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcuts({ onC }));
    unmount();
    fireKey('c');
    expect(onC).not.toHaveBeenCalled();
  });

  it('does not throw when no handlers are provided for a key', () => {
    renderHook(() => useKeyboardShortcuts({}));
    expect(() => fireKey('r')).not.toThrow();
  });
});
