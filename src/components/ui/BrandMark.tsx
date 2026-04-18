interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span className={className ? `brand-mark ${className}` : 'brand-mark'} aria-hidden="true" />
  );
}
