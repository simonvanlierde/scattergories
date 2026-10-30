<!--
Keep this page true. The app serves it at /accessibility, without this note.
https://github.com/simonvanlierde/project-templates/blob/main/docs/web-legal.md
says how to fill it in, and how the template builds and tests it.
Say "partially conformant" only once docs/accessibility-assessment.md has a result for every
criterion, and link it from the status sentence.
-->

# Accessibility statement

This page covers scattergories at [scattergories.duinlab.nl](https://scattergories.duinlab.nl).
Simon van Lierde builds scattergories and is responsible for this page.

## Using scattergories

You can:

- play on a screen 320 px wide without scrolling sideways, which is the same as zooming in to
  400% on a laptop;
- choose a dark theme in the settings, or let the game follow your device;
- play in English, Spanish, French, German, Italian, Dutch, Polish, Portuguese or Greek;
- turn off animations with your device's reduced-motion setting;
- use dialogs with a keyboard: focus stays inside while a dialog is open and goes back where it
  was when it closes.

## How accessible scattergories is

scattergories aims to meet [WCAG 2.2](https://www.w3.org/TR/WCAG22/) at level AA, the usual
standard for accessible websites.

Its conformance is **not assessed**: nobody has checked scattergories against every WCAG 2.2 rule
yet. Simon runs the checks below himself. No outside expert has tested it.

## Known problems

None that we know of yet.

## Tell us about a problem

If any part of scattergories is hard or impossible for you to use, email
[code@duinlab.nl](mailto:code@duinlab.nl). Tell us what you tried to do, what happened, and which
browser and assistive technology you use, if any. If you have a GitHub account, you can also
[open an issue](https://github.com/simonvanlierde/scattergories/issues/new).

We'll reply within 10 working days. If you need something from scattergories in another format,
ask and we'll send it.

## How we check

These automatic checks run on every proposed change to scattergories:

- [axe-core](https://github.com/dequelabs/axe-core) scans every page, in the light and the dark
  theme, for WCAG 2.0, 2.1 and 2.2 level A and AA problems and axe's best practices.
- Every page loads 320 px wide, and the test fails if it scrolls sideways.
- [Biome's accessibility rules](https://biomejs.dev/linter/javascript/rules/#a11y) check the code
  for mistakes such as missing alt text, invalid ARIA, or click handlers that don't work with a
  keyboard.
- A test fails if this page loses a section or its email contact, claims a status it hasn't
  earned, or goes more than 400 days without a review.

Automatic tools find only some problems, so passing them doesn't mean there are none. The tests
are in [tests/e2e](https://github.com/simonvanlierde/scattergories/tree/main/tests/e2e).

## Tested with

- Chromium, with axe-core, on every proposed change.

Nobody has tested scattergories by hand yet, with only a keyboard or with a screen reader.
scattergories needs HTML, CSS and JavaScript to work.

## About this statement

Prepared: 29 October 2026

Last reviewed: 29 October 2026

Next review: within 12 months of the last review, or at the next major release if that comes first.

Method: self-assessment, using the checks under How we check.
