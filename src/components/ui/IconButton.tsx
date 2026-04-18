import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  icon: ReactNode;
  variant?: 'ghost' | 'solid';
}

function joinClassNames(...tokens: Array<string | false | null | undefined>): string {
  return tokens.filter(Boolean).join(' ');
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, variant = 'ghost', className, type, title, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      aria-label={label}
      title={title ?? label}
      className={joinClassNames(
        'ds-icon-button',
        variant === 'solid' && 'ds-icon-button--solid',
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
});
