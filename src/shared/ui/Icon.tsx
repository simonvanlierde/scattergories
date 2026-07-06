import type { LucideIcon, LucideProps } from "lucide-react";
import type { Ref } from "react";

interface IconProps extends Omit<LucideProps, "ref"> {
  icon: LucideIcon;
  ref?: Ref<SVGSVGElement>;
}

export function Icon({
  icon: LucideComponent,
  size = 20,
  strokeWidth = 1.5,
  ref,
  ...rest
}: IconProps) {
  return (
    <LucideComponent
      ref={ref}
      size={size}
      strokeWidth={strokeWidth}
      focusable={false}
      aria-hidden={true}
      {...rest}
    />
  );
}
