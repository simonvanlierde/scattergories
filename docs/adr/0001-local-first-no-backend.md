# 1. Local-first, no backend

- Status: accepted
- Date: 2025-06-27

## Context

Scattergories is a companion for in-person play: it rolls a letter, runs a timer, and draws
category prompts for people sitting around one table. It needs to remember a player's settings and
custom category packs between sessions, and be reachable from a phone without setup.

The obvious "app" shape would add a backend: accounts, a database and a sync service. That would
keep data across devices and give a base for online or multiplayer play later.

## Decision

We ship a single-page app with **no backend**. All state lives in the browser and is saved to
`localStorage`. The app is deployed as static files behind an SPA fallback, and you can install it
as a PWA.

## Consequences

### Good

- Nothing to host, secure or pay for beyond serving static files. A clean checkout builds a
  deployable artifact with `pnpm build`.
- Private by design: settings and custom categories never leave the device, so there is no
  personal data to store or protect.
- No auth, no network error states and no merging of offline and online changes. Bugs from state
  spread across machines can't happen.
- The game rules stay pure and framework-free (see [`architecture.md`](../architecture.md)), which
  keeps them easy to unit-test.

### Bad / accepted limits

- No cross-device sync: your packs live on the browser that created them.
- Clearing site data resets everything. There is no backup on a server.
- Real online or multiplayer play would mean revisiting this decision. It is not a small add-on to
  this design.

These limits fit the product's scope (a table-side aid, not a platform), so we accept them rather
than build a backend we may never need.
