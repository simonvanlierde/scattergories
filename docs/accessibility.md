# Accessibility statement

This page covers [Scattergories](https://scattergories.duinlab.nl), an unofficial companion for playing the game around a table. Simon van Lierde builds it and is responsible for this page.

## Using scattergories

You can:

- use light or dark colors, following your device's setting or choosing a theme yourself;
- operate the round with buttons or keyboard shortcuts: Space, R and P; open categories with C and help with ?;
- turn sound off and use the visible timer instead;
- use your device's reduced-motion setting to shorten animations;
- choose from nine interface languages. These privacy and accessibility pages are in English.

Players write answers on paper and score them together. The app does not offer answer entry or scoring.

## How accessible scattergories is

Scattergories aims to meet [WCAG 2.2](https://www.w3.org/TR/WCAG22/) at level AA.

Its conformance is **not assessed**: a complete check against every criterion has not been done. The [assessment record](https://github.com/simonvanlierde/scattergories/blob/main/docs/accessibility-assessment.md) lists the evidence and remaining checks. There has been no independent audit.

## Known problems

None that we know of yet. Automated checks do not cover every barrier. Screen-reader use, browser zoom and the full keyboard flow still need manual assessment.

## Tell us about a problem

Email [code@duinlab.nl](mailto:code@duinlab.nl), or [open an issue](https://github.com/simonvanlierde/scattergories/issues/new). Tell us what you tried, what happened, and which browser or assistive technology you used.

We'll reply within 10 working days. You can also ask for this information in another format.

## How we check

The repository has automated checks for:

- axe-core accessibility rules on the game and both documents, in light and dark themes;
- sideways scrolling at a screen width of 320 CSS pixels;
- keyboard shortcuts, dialog focus, touch-target sizes and selected color contrasts;
- common accessibility mistakes in React markup, using Biome;
- this statement's sections, contact address and conformance wording.

The browser checks run in Chromium. Passing them does not establish WCAG conformance. See the [tests](https://github.com/simonvanlierde/scattergories/tree/main/tests) for their scope.

No manual screen-reader or assistive-technology test is recorded. Automated keyboard tests do not replace testing the whole app with a keyboard. Scattergories needs HTML, CSS and JavaScript.

## About this statement

Prepared: 7 November 2026.

Last reviewed: 7 November 2026.

Next review: within 12 months, or at the next major release if sooner.

Method: self-assessment of the repository's automated checks; the full WCAG assessment remains open.
