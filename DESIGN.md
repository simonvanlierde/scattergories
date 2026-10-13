---
name: Scattergories
description: A table-side companion set like a printed page, with one serif letter at its center.
colors:
  paper: "oklch(98.5% 0.008 85)"
  paper-card: "oklch(96.5% 0.01 85)"
  paper-sunken: "oklch(93.5% 0.011 85)"
  rule: "oklch(85% 0.012 85)"
  ink: "oklch(18% 0.015 255)"
  ink-secondary: "oklch(35% 0.02 255)"
  ink-muted: "oklch(46% 0.02 255)"
  ink-meta: "oklch(60% 0.018 255)"
  ink-navy: "oklch(34% 0.11 260)"
  ink-navy-strong: "oklch(26% 0.13 260)"
  navy-wash: "oklch(94% 0.035 260)"
  warning: "oklch(62% 0.14 70)"
  danger: "oklch(45% 0.17 25)"
  danger-wash: "oklch(94% 0.06 25)"
  night-paper: "oklch(14% 0.015 70)"
  night-card: "oklch(18% 0.015 70)"
  night-rule: "oklch(32% 0.015 70)"
  night-ink: "oklch(93% 0.011 85)"
  night-ink-muted: "oklch(58% 0.015 85)"
  periwinkle: "oklch(76% 0.11 258)"
  periwinkle-strong: "oklch(84% 0.13 258)"
typography:
  display:
    fontFamily: "Fraunces Variable, Fraunces, Iowan Old Style, Georgia, serif"
    fontSize: "clamp(6rem, 32cqi, 11rem)"
    fontWeight: 500
    lineHeight: 0.85
    letterSpacing: "-0.02em"
    fontFeature: "\"ss01\" 1"
    fontVariation: "\"opsz\" 144"
  headline:
    fontFamily: "Fraunces Variable, Fraunces, Georgia, serif"
    fontSize: "clamp(1.75rem, 1.58rem + 0.82vw, 2rem)"
    fontWeight: 500
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Fraunces Variable, Fraunces, Georgia, serif"
    fontSize: "clamp(1.125rem, 1.08rem + 0.22vw, 1.1875rem)"
    fontWeight: 500
    letterSpacing: "-0.02em"
  clock:
    fontFamily: "Geist Variable, Geist, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 1.94rem + 1.55vw, 2.75rem)"
    fontWeight: 600
    letterSpacing: "-0.02em"
    fontFeature: "\"tnum\" 1"
  body:
    fontFamily: "Geist Variable, Geist, system-ui, sans-serif"
    fontSize: "clamp(1rem, 0.96rem + 0.18vw, 1.0625rem)"
    fontWeight: 400
    lineHeight: 1.3
  label:
    fontFamily: "Geist Variable, Geist, system-ui, sans-serif"
    fontSize: "clamp(0.75rem, 0.72rem + 0.12vw, 0.8125rem)"
    fontWeight: 600
    letterSpacing: "0.14em"
  button:
    fontFamily: "Geist Variable, Geist, system-ui, sans-serif"
    fontSize: "clamp(1.125rem, 1.08rem + 0.22vw, 1.1875rem)"
    fontWeight: 500
    letterSpacing: "0.02em"
rounded:
  xs: "0.125rem"
  sm: "0.25rem"
  md: "0.5rem"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.ink-navy}"
    textColor: "{colors.paper}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    padding: "0 1.25rem"
    height: "3.25rem"
  button-primary-hover:
    backgroundColor: "{colors.ink-navy-strong}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 1rem"
    height: "2.75rem"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.sm}"
    size: "2.75rem"
  category-chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    height: "2.75rem"
  category-chip-pinned:
    backgroundColor: "{colors.navy-wash}"
    textColor: "{colors.ink}"
  field:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 0.75rem"
    height: "2.75rem"
  sheet:
    backgroundColor: "{colors.paper-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
---

# Design System: Scattergories

The CSS in `src/styles/` (tokens in `tokens.css`) is the source of truth. When this file disagrees,
the CSS wins and this file needs an update.

## Overview

**Creative North Star: "The Printed Game Card"**

The app should read like a printed page on the table: warm cream paper, deep ink, hairline rules,
and one large serif letter as a drop cap. Everything is flat and quiet except the letter. The dark
theme is designed, not inverted: warm dark paper, off-white ink and a lighter periwinkle accent.

Players read the screen from across a table, so the order is: the letter, the clock, the
categories, and the controls last.

**Key Characteristics:**

- One serif (Fraunces at its display optical size) for the letter, titles and the end of a round.
  One geometric sans (Geist) for everything you operate.
- Paper and rules instead of cards and shadows.
- One accent, ink navy (periwinkle at night), for the primary action, the pinned state and focus.
- Urgency changes shape as well as color.

## Colors

Warm cream paper with cool blue-gray ink. The warm/cool contrast does the work, so colors stay
muted (low chroma).

### Primary

- **Ink Navy** (`ink-navy`): the primary button, focus rings, pinned categories, the custom-category
  star, and the ring during get-ready and when done. On hover it darkens to **Pressed Navy**
  (`ink-navy-strong`).
- **Navy Wash** (`navy-wash`): the fill of a pinned category chip and of selected rows.
- **Periwinkle** (`periwinkle`, `periwinkle-strong`): the same roles in the dark theme.

### Neutral

- **Cream Paper** (`paper`): the page. **Card Paper** (`paper-card`) for sheets, **Sunken Paper**
  (`paper-sunken`) for recessed areas.
- **Hairline Rule** (`rule`): every border and divider.
- **Ink** (`ink`): main text and the letter. **Secondary Ink**, **Muted Ink** and **Meta Ink** step
  down for secondary text, hints and quiet icons. Meta Ink is the lightest allowed for non-text UI
  (3:1).
- **Night Paper**, **Night Card**, **Night Rule**, **Night Ink** and **Night Muted Ink**: the same
  roles in the dark theme.

### Semantic

- **Amber** (`warning`): the ring and readout from 15 s left.
- **Brick** (`danger`, `danger-wash`): the ring and readout from 5 s left, destructive confirms and
  error banners.

**The One Accent Rule.** Navy is the only accent color. Amber and brick only show round urgency or
danger, never decoration.

**The Two Themes Rule.** Every color role has a light and a dark value, set on `.app-shell` and
`.app-shell[data-theme="dark"]`. Components use the semantic names (`--text-primary`,
`--accent-primary`, `--rule`), never a raw value.

## Typography

### Hierarchy

- **Display**: only the drawn letter. On a phone with the categories open, the letter and the clock
  scale with the ring instead.
- **Headline**: sheet titles, and the italic "Time's up!" readout.
- **Title**: the Categories heading.
- **Clock**: the round readout.
- **Body**: category names and settings.
- **Button**: `--text-lg` on the primary button, `--text-md` on the others.
- **Label** (uppercase): field labels. The footer wordmark uses Fraunces uppercase with the same
  letter spacing.

The type scale is fluid (minor third, `--text-xs` to `--text-hero`). Category numerals are
Fraunces italic.

**The Serif Is a Moment Rule.** Fraunces marks a moment or a heading: the letter, the end of a
round, titles, the How to play lead and the italic numerals. Anything you tap, and every name in a
list, is Geist.

## Layout

- One screen, no page scroll. The app is a `100dvh` column with the play grid and the footer
  control bar. Long lists scroll inside their panel.
- Below 52rem, the playmat (ring, letter, controls) sits above the categories. With the categories
  open, they take the height their list needs and the ring gets the rest. While that row is under
  19rem tall, the ring sits next to the controls and never gets smaller than `min(36vw, 9rem)`.
  From 19rem up, it sits above them and grows to 20rem. With the categories collapsed, the ring is
  full size (20rem) with the controls below. Categories flow in columns at least 11.5rem wide.
- From 52rem, there are two columns: playmat on the left, categories on the right, with a hairline
  between them. Collapsing the categories centers the playmat. From 64rem the ring grows to 26rem.
- Spacing uses a 4px scale (`--space-1` = 0.25rem). The playmat and grid gaps are 1rem, except
  0.75rem between the playmat and the categories below 52rem.
- Safe-area insets pad the column for installed PWAs.

## Elevation & Depth

Flat by default. Depth comes from hairline rules (`--elevation-1` is a 1px rule) and from slightly
darker paper, not from shadows. The only real shadow is `--elevation-4` under modal sheets, over a
scrim (warm in the light theme, black in the dark one).

**The Paper Rule.** If it sits on the page, it gets a hairline, not a shadow.

## Shapes

Small, paper-like corners: 0.25rem on buttons, chips and fields, 0.5rem on sheets and banners. The
timer is a thin circle (stroke 3, up to 6 when critical) with a butt cap and a gap at the bottom for
the readout. Panels and the playmat have no corners at all. Rules separate them.

## Components

### Buttons

- **Primary:** holds the round's next step: Roll a letter, Pause or Resume, Next round.
- **Ghost and icon buttons:** transparent, in ink or secondary ink, with a 6% ink wash on hover.
  Icon buttons are at least 44px square. Ghost buttons are 44px tall at both sizes. Pressing scales
  them to 0.97 (0.92 for icons).
- **Armed confirm:** a destructive icon button turns brick with a brick wash and needs a second tap.
- **Focus:** a 2px navy outline, offset 2–3px.

### Category chips

- **Style:** a row with a hairline border, an italic serif numeral, the name and a pin icon. On
  phones the numeral becomes a superscript and the pin is hidden.
- **State:** pinned chips get a navy border and navy wash. Custom categories are semibold with a
  navy star. During a round the chips are read-only but not dimmed.
- **Motion:** a new board is dealt, each chip landing 35ms after the one before.

### Timer ring and letter (signature)

- The letter sits inside the ring as a drop cap. Before the first roll, a "?" at 12% opacity
  stands in for it.
- The ring drains while the round runs: secondary ink, then amber at 15 s, then brick at 5 s. The
  stroke gets thicker at each step (3, 4, 6), and from 5 s the readout also beats once a second.
  When paused, the track is dashed.
- The letter lands with a spring (640ms) and settles once when time is up.

### Sheets

- Centred modal dialogs on card paper, with 0.5rem corners and a serif title over a hairline. They
  carry the only shadow in the system. They spring in and leave fast.

### Fields

- Transparent with a hairline border. On focus the border turns navy with a soft navy halo. Labels
  are small uppercase Geist, with a muted hint below.

## Do's and Don'ts

### Do:

- **Do** use the semantic tokens in `tokens.css`. Add a token before you add a raw color.
- **Do** keep the letter the largest thing on screen in every layout.
- **Do** give every state change a shape cue as well as a color (dash, stroke width, beat, border).
- **Do** keep touch targets at 44px (`2.75rem`) or more.
- **Do** respect `prefers-reduced-motion`: animations shrink to nothing.

### Don't:

- **Don't** add shadows or cards to set content apart on the page. Use a rule.
- **Don't** add a second accent color, gradients or decorative color.
- **Don't** set controls or lists in Fraunces, or the letter in Geist.
- **Don't** dim the categories during a round. They must stay fully readable.
