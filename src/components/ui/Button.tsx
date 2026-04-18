import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

function joinClassNames(...tokens: Array<string | false | null | undefined>): string {
  return tokens.filter(Boolean).join(' ');
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    leadingIcon,
    trailingIcon,
    fullWidth = false,
    className,
    type,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={joinClassNames(
        'ds-button',
        `ds-button--${variant}`,
        `ds-button--${size}`,
        fullWidth && 'ds-button--full',
        className,
      )}
      style={fullWidth ? { width: '100%' } : undefined}
      {...rest}
    >
      {leadingIcon ? <span className="ds-button__icon">{leadingIcon}</span> : null}
      {children}
      {trailingIcon ? <span className="ds-button__icon">{trailingIcon}</span> : null}
    </button>
  );
});
