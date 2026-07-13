/**
 * In-app version of the brand mark in assets/brand/mark.svg — same geometry, but
 * monochrome so it inherits currentColor and works on either theme's paper.
 * Keep the two in sync by hand; the SVG is the source the icons are built from.
 */

/** Below this the side-face glyphs are mud, so the mark drops to the plain die. */
const GLYPH_FLOOR = 28;

export function BrandMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={true}
      focusable="false"
    >
      {/* The faces hold still and keep their shading — light comes from above, so
          the lit face stays lit. It's the glyphs that travel from face to face
          while the die rolls (see .brand-mark--rolling), which is what a turning
          cube actually looks like. */}
      <path d="M12 2 21 7 12 12 3 7Z" fill="currentColor" />
      <path d="M3 7 12 12 12 22 3 17Z" fill="currentColor" fillOpacity="0.72" />
      <path d="M21 7 12 12 12 22 21 17Z" fill="currentColor" fillOpacity="0.5" />

      <g fill="var(--paper-0)" stroke="var(--paper-0)">
        {/* S — starts on the top face, drawn upright and flattened onto its plane */}
        <g
          className="brand-mark__glyph brand-mark__glyph--mark"
          transform="matrix(0.55 0 0 0.32 12 7)"
        >
          <path
            d="M4.6 -5.4C2.4 -7.4 -4.8 -7.4 -4.8 -3.2C-4.8 0.6 4.8 0.4 4.8 4.2C4.8 8.4 -2.4 8.4 -4.8 6.2"
            fill="none"
            strokeWidth="2.7"
            strokeLinecap="round"
          />
        </g>

        {size >= GLYPH_FLOOR && (
          <>
            {/* the prompt — starts on the left face */}
            <g
              className="brand-mark__glyph brand-mark__glyph--ask"
              transform="matrix(0.36 0.2 0 0.4 7.5 14.5)"
            >
              <path
                d="M-3.4 -3.6C-3.4 -7.4 3.8 -7.6 3.8 -3.4C3.8 -0.4 0 -0.2 0 2.8"
                fill="none"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <circle cx="0" cy="6.6" r="1.4" stroke="none" />
            </g>

            {/* the roll — starts on the right face */}
            <g
              className="brand-mark__glyph brand-mark__glyph--go"
              transform="matrix(0.36 -0.2 0 0.4 16.5 14.5)"
            >
              <path d="M-3.2 -6.2 5.6 0 -3.2 6.2Z" strokeWidth="1.8" strokeLinejoin="round" />
            </g>
          </>
        )}
      </g>
    </svg>
  );
}
