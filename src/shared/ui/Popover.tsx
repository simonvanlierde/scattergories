import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

interface PopoverProps {
  icon: LucideIcon;
  label: string;
  title?: string;
  /** ReactNode, or a render function receiving a `close` callback (e.g. to dismiss on select). */
  children: ReactNode | ((close: () => void) => ReactNode);
}

/**
 * A small icon-triggered popover: the trigger is an IconButton, the panel is
 * anchored just below it. Closes on outside pointerdown and Escape.
 */
export function Popover({ icon, label, title, children }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="ds-popover" ref={rootRef}>
      <IconButton
        label={label}
        title={title ?? label}
        icon={<Icon icon={icon} size={20} />}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      />
      {open ? (
        <div className="ds-popover__panel" id={panelId} role="dialog" aria-label={label}>
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      ) : null}
    </div>
  );
}
