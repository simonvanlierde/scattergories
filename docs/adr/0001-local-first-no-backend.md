# 1. Local-first, no backend

- Status: accepted
- Date: 2025-06-27

## Context

Scattergories is a companion for in-person play — it rolls a letter, runs a timer, and draws
category prompts for people sitting around one table. It needs to remember a player's settings and
custom category packs between sessions, and be reachable from a phone without setup.

The obvious "app" shape would add a backend: accounts, a database, and a sync service. That buys
cross-device persistence and a foundation for future online/multiplayer play.

## Decision

Ship a single-page app with **no backend**. All state lives in the browser and persists to
`localStorage`; the app is deployed as static files behind an SPA fallback and installable as a PWA.

## Consequences

### Good

- Nothing to host, secure, or pay for beyond static file serving — a clean checkout builds a
  deployable artifact with `pnpm build`.
- Privacy by construction: settings and custom categories never leave the device, so there is no
  personal data to store or protect.
- No auth, no network error states, no offline/online reconciliation — the whole class of
  distributed-state bugs simply does not exist.
- The game rules stay pure and framework-free (see [`architecture.md`](../architecture.md)), which
  keeps them trivially unit-testable.

### Bad / accepted limits

- No cross-device sync: your packs live on the browser that created them.
- Clearing site data resets everything; there is no server-side backup.
- Genuinely online/multiplayer play would require revisiting this decision — it is not a small
  add-on to this design.

These limits are consistent with the product's scope (a table-side aid, not a platform), so we
accept them rather than pre-building a backend we may never need.
