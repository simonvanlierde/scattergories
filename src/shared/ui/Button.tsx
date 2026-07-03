import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { cx } from './cx';

type Variant = 'primary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  className,
  type,
  children,
  ref,
  ...rest
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={cx('ds-button', `ds-button--${variant}`, `ds-button--${size}`, className)}
      {...rest}
    >
      {leadingIcon ? <span className="ds-button__icon">{leadingIcon}</span> : null}
      {children}
      {trailingIcon ? <span className="ds-button__icon">{trailingIcon}</span> : null}
    </button>
  );
}
