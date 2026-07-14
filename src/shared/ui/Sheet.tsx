import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";
import { useReturnFocus } from "./useReturnFocus";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel?: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, closeLabel = "Close", children }: SheetProps) {
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
      // React's autoFocus fires at mount, while the dialog is still hidden (a
      // no-op); focus the intended target for real now that it's visible.
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    // Escape's default action already closes the dialog (which fires "close"
    // below) — no separate "cancel" handler needed, so onClose is only ever
    // called from one place regardless of how the sheet was dismissed.
    function handleClose() {
      onClose();
    }

    // A drag from the sheet body released over the backdrop produces a click
    // targeting the dialog; only dismiss when the press started on the backdrop.
    let pressedBackdrop = false;

    function handlePointerDown(event: PointerEvent) {
      pressedBackdrop = event.target === dialog;
    }

    function handleBackdropClick(event: MouseEvent) {
      if (event.target === dialog && pressedBackdrop) {
        dialog?.close();
      }
      pressedBackdrop = false;
    }

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("pointerdown", handlePointerDown);
    dialog.addEventListener("click", handleBackdropClick);

    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("pointerdown", handlePointerDown);
      dialog.removeEventListener("click", handleBackdropClick);
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
      <div className="ds-sheet__body">{open ? children : null}</div>
    </dialog>
  );
}
