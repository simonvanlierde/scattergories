import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { useCallback, useRef, useState } from 'react';

const DEFAULT_COMMIT_THRESHOLD_PX = 48;
const DEFAULT_VERTICAL_CANCEL_PX = 16;
const DRAG_DAMPING = 0.6;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

type Direction = 'left' | 'right';

interface UseSwipeToggleOptions {
  onCommit: (direction: Direction) => void;
  commitThreshold?: number;
  verticalCancelThreshold?: number;
}

interface UseSwipeToggleResult {
  bindings: {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
  };
  style: CSSProperties;
  isDragging: boolean;
  direction: Direction | null;
  /* Wrap onClick to suppress the synthetic click that follows a committed swipe. */
  guardClick: (callback: () => void) => void;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  cancelled: boolean;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function useSwipeToggle(options: UseSwipeToggleOptions): UseSwipeToggleResult {
  const {
    onCommit,
    commitThreshold = DEFAULT_COMMIT_THRESHOLD_PX,
    verticalCancelThreshold = DEFAULT_VERTICAL_CANCEL_PX,
  } = options;

  const [dx, setDx] = useState(0);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);

  const reset = useCallback(() => {
    dragRef.current = null;
    setDx(0);
  }, []);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    // Ignore non-primary mouse buttons
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      cancelled: false,
    };
  }, []);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.cancelled || drag.pointerId !== event.pointerId) {
        return;
      }
      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;
      if (Math.abs(deltaY) > verticalCancelThreshold && Math.abs(deltaY) > Math.abs(deltaX)) {
        drag.cancelled = true;
        setDx(0);
        return;
      }
      // Capture the pointer only once we're confident this is a horizontal gesture
      if (Math.abs(deltaX) > verticalCancelThreshold) {
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          /* already captured or unsupported */
        }
      }
      setDx(deltaX);
    },
    [verticalCancelThreshold],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }
      const deltaX = event.clientX - drag.startX;
      if (!drag.cancelled && Math.abs(deltaX) >= commitThreshold) {
        suppressClickRef.current = true;
        onCommit(deltaX > 0 ? 'right' : 'left');
      }
      reset();
    },
    [commitThreshold, onCommit, reset],
  );

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }
      reset();
    },
    [reset],
  );

  const guardClick = useCallback((callback: () => void) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    callback();
  }, []);

  const reducedMotion = prefersReducedMotion();
  const translated = reducedMotion ? 0 : dx * DRAG_DAMPING;
  const style: CSSProperties =
    dx !== 0 && !reducedMotion
      ? { transform: `translate3d(${translated.toFixed(1)}px, 0, 0)` }
      : {};

  return {
    bindings: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
    style,
    isDragging: dx !== 0,
    direction: dx > 0 ? 'right' : dx < 0 ? 'left' : null,
    guardClick,
  };
}
