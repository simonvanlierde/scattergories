# Product

## Platform

web

## Users

A group of friends or family playing Scattergories in person, around one table. One player's
phone, tablet or laptop runs the app and lies flat in the middle, so everyone reads it from across
the table, at an angle, mid-game. The person holding it rolls the letter, starts and pauses the
round, and edits the deck between rounds; everyone else only reads the letter, the clock and the
categories.

## Product Purpose

An unofficial, browser-based companion that replaces the physical die, timer and category cards.
It rolls a letter, draws a board of categories and runs the round clock, so a group can play with
pen and paper and nothing else. Success is a round that starts in one tap and that every player can
follow from their seat.

## Positioning

- Letters are rolled from each language's own alphabet, weighted by that language's letter
  frequencies, so playable letters come up more often.
- 9 fully translated languages (English, Spanish, French, German, Italian, Dutch, Polish,
  Portuguese, Greek), with translated built-in categories.
- No account, no server, no network at runtime: it works offline after one visit and nothing leaves
  the device.

## Operating Context

- A round runs `idle → spinning → buffer → running → done`: roll a letter, a get-ready countdown
  (3 s by default), the round clock (90 s by default), then "Time's up".
- Players write answers on paper. Scoring happens at the table, by the house rules in the How to
  play sheet, not in the app.
- Players can follow and run a round without looking at the screen: a tick sounds in the last
  10 s and an alarm at the end, the phone vibrates at 15 s and 5 s left and at the end, and
  keyboard shortcuts (Space, R, P, C, ?) cover the controls.
- Installed as a PWA or opened in a browser tab; light and dark themes follow the system unless set.

## Capabilities and Constraints

- Round length 10–600 s, get-ready 0–10 s, 1–25 categories per board (12 by default).
- Pin categories to keep them across rounds; redraw the rest; add custom categories and built-in
  packs. Settings and custom categories persist in `localStorage` only.
- Categories are read-only during a round. The app is not a scorekeeper: no answer entry,
  strike-through, per-round scoring or completion counting (see `CONTRIBUTING.md`).
- No backend by decision ([ADR 0001](docs/adr/0001-local-first-no-backend.md)): no cross-device
  sync, no online multiplayer.
- Every user-visible string ships in all 9 locales in the same change.

## Brand Commitments

- Name "Scattergories" with an explicit non-affiliation line: Scattergories is a Hasbro game, and
  this project is not affiliated with or endorsed by Hasbro. Links go to the official game, the
  source code and the MIT license.
- Brand mark: an isometric die with three glyphs (`assets/brand/mark.svg`), also the favicon and
  app icons.
- Voice: short, plain and friendly; English copy is direct ("Roll a letter", "Time's up!").

## Evidence on Hand

- Live app at <https://scattergories.duinlab.nl>; screenshots in `docs/screenshots/`.
- No testimonials, usage data or user research exist in the repo. Do not invent any.

## Product Principles

1. Readable from across the table beats dense: the letter, clock and categories come first.
2. A companion, not a platform: remove state and steps before adding features.
3. One tap to start a round; settings stay out of the way of play.
4. Local-first and private by construction.
5. Every language is first class, from the letter odds to the category names.

## Accessibility & Inclusion

- Biome's a11y lint and axe-core scans run in CI (idle, running round, collapsed deck, open sheets).
- Timer urgency changes shape as well as colour (a beat in the last 5 s), for colour-blind players
  and for reading at a distance; `prefers-reduced-motion` turns animation off.
- Touch targets are at least 44 px; text and icons hold WCAG AA and 3:1 non-text contrast in both
  themes (`tests/contrast.spec.ts`).
