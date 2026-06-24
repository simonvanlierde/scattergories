import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useId, useRef } from 'react';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { useReturnFocus } from './useReturnFocus';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel?: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, closeLabel = 'Close', children }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useReturnFocus(open);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    function handleCancel(event: Event) {
      event.preventDefault();
      onClose();
    }

    function handleClose() {
      onClose();
    }

    function handleBackdropClick(event: MouseEvent) {
      if (event.target === dialog) {
        onClose();
      }
    }

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('click', handleBackdropClick);

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('click', handleBackdropClick);
    };
  }, [onClose]);

  return (
    <dialog ref={dialogRef} className="ds-sheet" aria-labelledby={titleId} aria-modal="true">
      <div className="ds-sheet__grip" aria-hidden="true" />
      <header className="ds-sheet__header">
        <h2 id={titleId} className="ds-sheet__title">
          {title}
        </h2>
        <IconButton label={closeLabel} icon={<Icon icon={X} size={22} />} onClick={onClose} />
      </header>
      <div className="ds-sheet__body">{children}</div>
    </dialog>
  );
}
