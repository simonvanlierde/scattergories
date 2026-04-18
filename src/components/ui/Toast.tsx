import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

const DEFAULT_DISMISS_MS = 4200;

interface ToastProps {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  tone?: 'accent' | 'success' | 'warning';
  dismissAfterMs?: number;
  onDismiss: (id: string) => void;
}

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  tone?: 'accent' | 'success' | 'warning';
}

interface ToastRegionProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

function Toast({
  id,
  title,
  description,
  icon,
  tone = 'accent',
  dismissAfterMs = DEFAULT_DISMISS_MS,
  onDismiss,
}: ToastProps) {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    timerRef.current = window.setTimeout(() => onDismiss(id), dismissAfterMs);
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [id, dismissAfterMs, onDismiss]);

  return (
    <div className={`toast toast--${tone}`} role="status" aria-live="polite">
      {icon ? (
        <span className="toast__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <div className="toast__body">
        <strong className="toast__title">{title}</strong>
        {description ? <span className="toast__description">{description}</span> : null}
      </div>
      <button
        type="button"
        className="toast__dismiss"
        onClick={() => onDismiss(id)}
        aria-label={`Dismiss ${title}`}
      >
        ×
      </button>
    </div>
  );
}

function ToastRegion({ toasts, onDismiss }: ToastRegionProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <section className="toast-region" aria-label="Notifications">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          icon={toast.icon}
          tone={toast.tone}
          onDismiss={onDismiss}
        />
      ))}
    </section>
  );
}

export type { ToastItem };
export { Toast, ToastRegion };
