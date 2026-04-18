import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSwipeToggle } from './useSwipeToggle';

const COMMIT_PX = 48;
const VERTICAL_CANCEL_PX = 16;
const START_X = 100;
const START_Y = 100;

interface PointerInit {
  x?: number;
  y?: number;
  pointerId?: number;
  pointerType?: 'mouse' | 'touch' | 'pen';
  button?: number;
}

function buildPointerEvent(init: PointerInit = {}) {
  const target = document.createElement('button');
  target.setPointerCapture = vi.fn();
  target.releasePointerCapture = vi.fn();
  return {
    clientX: init.x ?? START_X,
    clientY: init.y ?? START_Y,
    pointerId: init.pointerId ?? 1,
    pointerType: init.pointerType ?? 'touch',
    button: init.button ?? 0,
    currentTarget: target,
  } as unknown as React.PointerEvent<HTMLElement>;
}

describe('useSwipeToggle', () => {
  it('commits right swipe when horizontal delta exceeds threshold', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useSwipeToggle({ onCommit }));

    act(() => result.current.bindings.onPointerDown(buildPointerEvent()));
    act(() =>
      result.current.bindings.onPointerMove(buildPointerEvent({ x: START_X + COMMIT_PX + 2 })),
    );
    act(() =>
      result.current.bindings.onPointerUp(buildPointerEvent({ x: START_X + COMMIT_PX + 2 })),
    );

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('right');
  });

  it('commits left swipe when delta exceeds threshold in the opposite direction', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useSwipeToggle({ onCommit }));

    act(() => result.current.bindings.onPointerDown(buildPointerEvent()));
    act(() =>
      result.current.bindings.onPointerMove(buildPointerEvent({ x: START_X - COMMIT_PX - 2 })),
    );
    act(() =>
      result.current.bindings.onPointerUp(buildPointerEvent({ x: START_X - COMMIT_PX - 2 })),
    );

    expect(onCommit).toHaveBeenCalledWith('left');
  });

  it('does not commit when horizontal delta is below the threshold', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useSwipeToggle({ onCommit }));

    act(() => result.current.bindings.onPointerDown(buildPointerEvent()));
    act(() => result.current.bindings.onPointerMove(buildPointerEvent({ x: START_X + 20 })));
    act(() => result.current.bindings.onPointerUp(buildPointerEvent({ x: START_X + 20 })));

    expect(onCommit).not.toHaveBeenCalled();
  });

  it('cancels when vertical movement dominates (scrolling)', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useSwipeToggle({ onCommit }));

    act(() => result.current.bindings.onPointerDown(buildPointerEvent()));
    act(() =>
      result.current.bindings.onPointerMove(
        buildPointerEvent({ x: START_X + 10, y: START_Y + VERTICAL_CANCEL_PX + 8 }),
      ),
    );
    act(() =>
      result.current.bindings.onPointerUp(
        buildPointerEvent({ x: START_X + COMMIT_PX + 50, y: START_Y + VERTICAL_CANCEL_PX + 8 }),
      ),
    );

    expect(onCommit).not.toHaveBeenCalled();
  });

  it('suppresses the click that follows a committed swipe, then allows the next one', () => {
    const onCommit = vi.fn();
    const onClick = vi.fn();
    const { result } = renderHook(() => useSwipeToggle({ onCommit }));

    act(() => result.current.bindings.onPointerDown(buildPointerEvent()));
    act(() =>
      result.current.bindings.onPointerMove(buildPointerEvent({ x: START_X + COMMIT_PX + 2 })),
    );
    act(() =>
      result.current.bindings.onPointerUp(buildPointerEvent({ x: START_X + COMMIT_PX + 2 })),
    );

    // The synthetic click that browsers fire after a successful swipe should not run the callback
    act(() => result.current.guardClick(onClick));
    expect(onClick).not.toHaveBeenCalled();

    // The next real tap should fire normally
    act(() => result.current.guardClick(onClick));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('ignores non-primary mouse buttons', () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() => useSwipeToggle({ onCommit }));

    act(() =>
      result.current.bindings.onPointerDown(buildPointerEvent({ pointerType: 'mouse', button: 2 })),
    );
    act(() =>
      result.current.bindings.onPointerMove(buildPointerEvent({ x: START_X + COMMIT_PX + 10 })),
    );
    act(() =>
      result.current.bindings.onPointerUp(buildPointerEvent({ x: START_X + COMMIT_PX + 10 })),
    );

    expect(onCommit).not.toHaveBeenCalled();
  });
});
