# Product

## Mission and Vision

Let a mixed-age group at one table start a round of a category game in one tap and follow it
from their seats. Today the app runs on one device. Online rooms would mean revisiting
[ADR 0001](docs/adr/0001-local-first-no-backend.md).

## Platform

web

## Users

Families and friends playing Scattergories in person, around one table. One player's phone or
tablet runs the app and lies flat in the middle. Everyone reads it from across the table, at an
angle. Landscape and laptops work, but the layout is designed for a phone or tablet.
The person holding it rolls the letter, runs the round and edits the deck between rounds.
Everyone else only reads the letter, the clock and the categories.

The default deck should suit a family table. Categories meant for adults, such as "Offensive
Words", live in the Grown-ups pack, which players add to the deck themselves.

## Product Purpose

An unofficial browser app that rolls the letter, runs the timer and draws the categories. Players
bring pen and paper.

## Positioning

- Each language rolls letters from its own alphabet. A letter that starts more words in that
  language comes up more often.
- 9 languages (English, Spanish, French, German, Italian, Dutch, Polish, Portuguese, Greek), with
  the built-in categories translated too.
- No account or backend. After one visit it works offline. Settings and categories stay on the device.

## Operating Context

- A round: roll a letter, count down to get ready (3 s by default), run the round clock (90 s by
  default), then "Time's up".
- Players write their answers on paper. They score at the table, by the house rules in the How to
  play sheet. The app doesn't score.
- A group with its own categories folds the panel with its chevron or C. The panel starts open
  and remembers the last choice. Folding keeps the saved deck and works during a round.
- Players can follow a round without looking at the screen. A tick sounds on each get-ready second
  after the first and in the last 10 s, and an alarm at the end. The phone vibrates at 15 s and
  5 s left and at the end. Keyboard shortcuts (Space, R, P, C, ?) cover the controls. Settings can turn them off.
- It runs installed as a PWA or in a browser tab. Light and dark themes follow the system unless
  you set one.

## Capabilities and Constraints

- Round length 10–600 s, get-ready 0–10 s, 1–25 categories per board (12 by default).
- Pinned categories stay across rounds while the rest are redrawn. Players can add their own
  categories and built-in packs. Settings and custom categories are saved in `localStorage` only.
- Categories are read-only during a round, and there is no answer entry or scoring (see the
  product contract in `.github/CONTRIBUTING.md`).
- There is no backend ([ADR 0001](docs/adr/0001-local-first-no-backend.md)), so no sync between
  devices and no online multiplayer.
- Every string a user sees ships in all 9 locales in the same change.

## Brand Commitments

- The name is "Scattergories", always with a line saying that Scattergories is a Hasbro game and
  this project is not affiliated with or endorsed by Hasbro. Links go to the official game, the
  source code and the MIT license.
- The brand mark is an isometric die with three glyphs (`assets/brand/mark.svg`). It's also the
  favicon and the app icons.
- Voice: short, plain and friendly. English copy is direct ("Roll a letter", "Time's up!") and uses
  American spelling.

## Evidence on Hand

- The live app is at <https://scattergories.duinlab.nl>, and screenshots are in
  `docs/screenshots/`.
- The repo has no testimonials, usage data or user research. Don't invent any.

## Product Principles

1. Readable from across the table beats dense. The letter, clock and categories come first.
2. A companion, not a platform. Remove state and steps before adding features.
3. One tap starts a round. Settings stay out of the way of play.
4. Local-first: settings and categories stay on the device.
5. Every language gets the same care, from the letter odds to the category names.

## Accessibility & Inclusion

- CI runs Biome's a11y lint and axe-core scans (see `docs/quality.md`).
- Timer urgency changes shape as well as color: a thicker arc and heavier type in the last 5 s.
  Color-blind players and distant readers can still see it. `prefers-reduced-motion` turns
  animation off.
- Touch targets are at least 44 px. `tests/layout.spec.ts` fails on any shorter control in the
  settings and deck sheets. axe-core checks text contrast on the screens and the sheets, in both themes.
  `tests/contrast.spec.ts` checks the dark-theme categories heading, and the pin icon's 3:1
  non-text contrast in both themes.

## Design Success

A first-time player can start a round without explanation. Everyone can read the letter, time and
categories from their seat. These are targets: no usability test backs them yet.
