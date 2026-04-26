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

  it('calls onA when A is pressed', () => {
    const onA = vi.fn();
    renderHook(() => useKeyboardShortcuts({ onA }));
    fireKey('a');
    expect(onA).toHaveBeenCalledOnce();
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
