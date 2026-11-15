# Accessibility statement

This page covers [Scattergories](https://scattergories.duinlab.nl), an unofficial app for playing the game around a table. Simon van Lierde builds it and is responsible for this page.

## Using Scattergories

You can:

- use light or dark colors, following your device's setting or choosing a theme yourself;
- run the round with buttons or with the Space, R and P keys, show or hide the categories with C, and open help with ? (Settings can turn the shortcuts off);
- turn sound off and use the visible timer instead;
- use your device's reduced-motion setting to shorten animations;
- choose from nine interface languages. The privacy and accessibility statements are in English; the links and buttons around them follow your language.

Players write answers on paper and score them together. The app does not offer answer entry or scoring.

## How accessible Scattergories is

Scattergories aims to meet [WCAG 2.2](https://www.w3.org/TR/WCAG22/) at level AA.

Its conformance is **partially conformant**: we know of no failing criterion, but a few criteria still need a manual check. The [assessment record](https://github.com/simonvanlierde/scattergories/blob/main/docs/accessibility-assessment.md) gives a result for every level A and AA criterion. There has been no independent audit.

## Known problems

None found so far. Screen-reader use, browser zoom, text spacing and forced colors still need manual assessment.

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

No manual test with a screen reader or other assistive technology is recorded. Scattergories relies on HTML, CSS and JavaScript.

## About this statement

Prepared: 7 November 2026.

Last reviewed: 15 November 2026.

Next review: within 12 months, or at the next major release if sooner.

Method: self-assessment of every level A and AA criterion, using automated browser checks, a scripted keyboard run and a reading of the code. No assistive technology was used.
