import type { HTMLAttributes, ReactNode } from 'react';

type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  children: ReactNode;
}

function joinClassNames(...tokens: Array<string | false | null | undefined>): string {
  return tokens.filter(Boolean).join(' ');
}

export function Badge({ tone = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span className={joinClassNames('ds-badge', `ds-badge--${tone}`, className)} {...rest}>
      {children}
    </span>
  );
}
