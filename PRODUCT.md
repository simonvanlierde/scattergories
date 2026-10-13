# Product

## Platform

web

## Users

Families and friends playing Scattergories in person, around one table. One player's phone or
tablet runs the app and lies flat in the middle. Landscape and laptops work, but the layout is
designed for a phone or tablet. Everyone reads it from across the table, at an
angle, mid-game. The person holding it rolls the letter, starts and pauses the round, and edits the
deck between rounds. Everyone else only reads the letter, the clock and the categories.

The default deck should suit a family table. Categories meant for adults, such as "Offensive
Words", belong in a pack players opt into. "Offensive Words" is still in the default deck.

## Product Purpose

The app replaces the die, the timer and the category cards. It's an unofficial companion that runs
in the browser. It rolls a letter, draws a board of categories and runs the round clock, so a group
needs only pen and paper. It works when a round starts in one tap and every player can follow it
from their seat.

## Positioning

- Each language rolls letters from its own alphabet, weighted by how often each letter is used in
  that language, so playable letters come up more often.
- 9 fully translated languages (English, Spanish, French, German, Italian, Dutch, Polish,
  Portuguese, Greek), and the built-in categories are translated too.
- No account, no server, no network while it runs. After one visit it works offline, and nothing
  leaves the device.

## Operating Context

- A round runs `idle → spinning → buffer → running → done`: roll a letter, count down to get ready
  (3 s by default), run the round clock (90 s by default), then "Time's up".
- Players write their answers on paper. They score at the table, by the house rules in the How to
  play sheet. The app doesn't score.
- Players can follow and run a round without looking at the screen. A tick sounds in the last 10 s
  and an alarm at the end. The phone vibrates at 15 s and 5 s left and at the end. Keyboard
  shortcuts (Space, R, P, C, ?) cover the controls.
- It runs installed as a PWA or in a browser tab. Light and dark themes follow the system unless
  you set one.

## Capabilities and Constraints

- Round length 10–600 s, get-ready 0–10 s, 1–25 categories per board (12 by default).
- You can pin categories to keep them across rounds and redraw the rest. You can add your own
  categories and built-in packs. Settings and custom categories are saved in `localStorage` only.
- Categories are read-only during a round. The app doesn't keep score: no answer entry, no
  strike-through, no per-round scoring, no completion counting (see `CONTRIBUTING.md`).
- We decided on no backend ([ADR 0001](docs/adr/0001-local-first-no-backend.md)), so there's no
  sync between devices and no online multiplayer.
- Every string a user sees ships in all 9 locales in the same change.

## Brand Commitments

- The name is "Scattergories", with a clear line saying we're not affiliated: Scattergories is a
  Hasbro game, and this project is not affiliated with or endorsed by Hasbro. Links go to the
  official game, the source code and the MIT license.
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
4. Local-first, and private because nothing leaves the device.
5. Every language gets the same care, from the letter odds to the category names.

## Accessibility & Inclusion

- CI runs Biome's a11y lint and axe-core scans (idle, running round, collapsed deck, open sheets).
- Timer urgency changes shape as well as color (a beat in the last 5 s). That helps color-blind
  players and anyone reading from a distance. `prefers-reduced-motion` turns animation off.
- Touch targets are at least 44 px. `tests/layout.spec.ts` fails on any shorter control in the
  settings and deck sheets. axe-core checks text contrast in the light theme.
  `tests/contrast.spec.ts` checks the dark-theme categories heading, and the pin icon's 3:1
  non-text contrast in both themes.
