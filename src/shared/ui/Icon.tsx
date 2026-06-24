import type { LucideIcon, LucideProps } from 'lucide-react';
import type { Ref } from 'react';

interface IconProps extends Omit<LucideProps, 'ref'> {
  icon: LucideIcon;
  label?: string;
  ref?: Ref<SVGSVGElement>;
}

export function Icon({
  icon: LucideComponent,
  label,
  size = 20,
  strokeWidth = 1.5,
  ref,
  ...rest
}: IconProps) {
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
}
