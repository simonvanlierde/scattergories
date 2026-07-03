import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { cx } from './cx';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  icon: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export function IconButton({ label, icon, className, type, title, ref, ...rest }: IconButtonProps) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      aria-label={label}
      title={title ?? label}
      className={cx('ds-icon-button', className)}
      {...rest}
    >
      {icon}
    </button>
  );
}
