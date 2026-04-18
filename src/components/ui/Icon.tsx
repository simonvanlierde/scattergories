import type { LucideIcon, LucideProps } from 'lucide-react';
import { forwardRef } from 'react';

interface IconProps extends Omit<LucideProps, 'ref'> {
  icon: LucideIcon;
  label?: string;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { icon: LucideComponent, label, size = 20, strokeWidth = 2, ...rest },
  ref,
) {
  const ariaProps = label ? { 'aria-label': label, role: 'img' as const } : { 'aria-hidden': true };

  return (
    <LucideComponent
      ref={ref}
      size={size}
      strokeWidth={strokeWidth}
      focusable={false}
      {...ariaProps}
      {...rest}
    />
  );
});
