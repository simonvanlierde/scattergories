interface BrandMarkProps {
  className?: string;
  size?: number;
  title?: string;
}

export function BrandMark({ className, size = 24, title }: BrandMarkProps) {
  const hasTitle = Boolean(title);
  return (
    <svg
      className={className ? `brand-mark ${className}` : 'brand-mark'}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={hasTitle ? 'img' : undefined}
      aria-hidden={hasTitle ? undefined : true}
      aria-label={hasTitle ? title : undefined}
      focusable="false"
    >
      {/* Isometric die — three faces rendered via opacity stepping so the mark
          inherits currentColor and reads in both light and dark themes */}
      <polygon points="12,3 21,8 12,13 3,8" fill="currentColor" />
      <polygon points="3,8 12,13 12,22 3,17" fill="currentColor" fillOpacity="0.72" />
      <polygon points="21,8 12,13 12,22 21,17" fill="currentColor" fillOpacity="0.5" />
      {/* Simplified 'S' inscribed on the top face — kept as a compact glyph
          so it remains legible at 24px and recognizable at 96px watermarks */}
      <path
        d="M13.4 6.35c-0.9-0.45-1.95-0.45-2.6-0.1c-0.55 0.3-0.75 0.85-0.25 1.2c0.45 0.3 1.45 0.4 2.3 0.75c0.95 0.4 1.25 1.05 0.55 1.55c-0.75 0.55-2.3 0.5-3.3-0.05"
        stroke="var(--paper-0, #fff)"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
