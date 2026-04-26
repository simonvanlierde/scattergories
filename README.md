# Scattergories

Scattergories is a browser-based companion for playing Scattergories without the physical timer, die, or category cards. It runs as a single-page React app and is designed for quick setup on a phone, tablet, or laptop at the table.

The app picks a letter, draws categories, tracks the round timer, and keeps custom category lists in the browser. Nothing needs a backend.

## What It Does

- Draws a standard round with 12 categories by default
- Rolls letters with locale-aware weighting so common, playable letters appear more often
- Redraws categories with each new letter by default, with an optional pinned category board
- Lets players switch between built-in and custom categories
- Works in 9 interface languages: English, German, Greek, Spanish, French, Italian, Dutch, Polish, and Portuguese
- Stores settings and custom categories locally in the browser
- Includes unit and end-to-end test coverage for the main gameplay flow

## Stack

- React 19
- TypeScript
- Vite
- i18next
- Biome
- Vitest
- Playwright

## Requirements

- Node 24 or newer
- pnpm 10 or newer
- Python 3.14 or newer for the optional `tools/` utilities

[`just`](https://github.com/casey/just) is optional, but convenient if you want shortcut commands.

## Local Development

```bash
pnpm install
pnpm dev
```

The Vite dev server starts on <http://localhost:5173>.

## Common Commands

```bash
pnpm build          # Type-check and build the production bundle
pnpm check          # Type-check, spell-check, and lint
pnpm verify         # Run the app pre-push suite
pnpm run ci         # Run app and tools checks, matching CI confidence
pnpm test           # Run unit tests
pnpm test:coverage  # Run unit tests with coverage
pnpm test:e2e       # Run Playwright tests against the built app
pnpm test:e2e:smoke # Run the Chromium smoke E2E suite
```

If you use `just`, the matching shortcuts live in [`justfile`](./justfile).

## Static Hosting

The app builds to static files and does not need a server runtime.

```bash
pnpm build
```

Deploy the generated `dist/` directory with an SPA fallback to `index.html`.

## Project Layout

```text
src/
  features/     Round, categories, and settings UI
  shared/       Shared UI primitives and browser helpers
  game/         Round logic, constants, and utility functions
  i18n/         Locale config, translations, and generated letter data
  styles/       CSS tokens, layout, and component styles
tests/          Playwright end-to-end tests
tools/          Python utilities for translation and letter-frequency generation
```

## Privacy

Custom categories and settings are stored in `localStorage` in the user's browser. The app does not require an account or a server to function.
