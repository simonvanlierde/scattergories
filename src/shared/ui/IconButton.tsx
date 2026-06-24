import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  icon: ReactNode;
  variant?: 'ghost' | 'solid';
  ref?: Ref<HTMLButtonElement>;
}

function joinClassNames(...tokens: Array<string | false | null | undefined>): string {
  return tokens.filter(Boolean).join(' ');
}

export function IconButton({
  label,
  icon,
  variant = 'ghost',
  className,
  type,
  title,
  ref,
  ...rest
}: IconButtonProps) {
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
}
