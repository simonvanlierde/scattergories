# 1. Local-first, no backend

- Status: accepted
- Date: 2025-06-27

## Context

Scattergories is a companion for in-person play: it rolls a letter, runs a timer, and draws
category prompts for people sitting around one table. It needs to remember a player's settings and
custom category packs between sessions, and be reachable from a phone without setup.

A typical app would add a backend: accounts, a database and a sync service. That would keep data
across devices and give a base for online or multiplayer play later.

## Decision

We ship a single-page app with **no backend**. All state lives in the browser.
Settings and the deck are saved in `localStorage`. The current round and the session's round count stay in memory.
The app is deployed as static files behind an SPA fallback, and you can install it as a PWA.

## Consequences

### Good

- Nothing to host, secure or pay for beyond serving static files. A clean checkout builds a
  deployable artifact with `pnpm build`.
- Settings and custom categories never leave the device, so there is no personal data to store or
  protect.
- No login, no network error states, no merging of offline and online changes, and no bugs from
  state split across machines.
- The game rules stay pure functions with no framework (see [`architecture.md`](../architecture.md)),
  so unit tests cover them without rendering anything.

### Bad / accepted limits

- No cross-device sync: your packs live on the browser that created them.
- Clearing site data resets everything. There is no backup on a server.
- Real online or multiplayer play would mean revisiting this decision. It is not a small add-on to
  this design.

These limits fit an app for players at one table, so we accept them and build no backend until
online play needs one.
