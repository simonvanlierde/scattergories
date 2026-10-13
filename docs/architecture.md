# Architecture

Scattergories is a single-page React app with no backend. Everything runs in the browser and is saved to `localStorage`. The only build-time input from outside the app is the locale asset bundle, which the Python `tools/` package regenerates.

## Layers

The source is layered so the game rules never depend on React, and the UI never reaches past the `useGameController` boundary into feature internals.

```mermaid
flowchart TD
    App["src/app/: shell + useGameController (the boundary)"]
    Features["src/features/: round · categories · settings"]
    Domain["src/domain/game/: pure rules + roundReducer"]
    Shared["src/shared/: ui + lib"]
    I18n["src/i18n/: locales + generated weights"]
    Storage[("localStorage")]
    Tools["tools/: Python CLI"]

    App --> Features
    Features --> Domain
    Features --> Shared
    Domain --> I18n
    Features <--> Storage
    Tools -. regenerates .-> I18n
```

## Round state machine

A round runs on a `useReducer` in [`roundReducer.ts`](../src/domain/game/roundReducer.ts). The reducer is pure, so its transitions are unit-tested without rendering anything:

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> spinning: start (roll a letter)
    spinning --> buffer: letter chosen
    buffer --> running: get-ready countdown ends
    running --> done: timer ends / end round
    done --> idle: next round
    running --> idle: reset
```

## Data flow

`useGameController` combines the feature hooks and gives the shell a single typed interface. Letters are rolled with locale-aware weights from `i18n/__generated__/letterWeights`, which `tools/` produces offline. Settings and custom category packs are the only saved state. They are written to `localStorage` from `features/settings/`, through the `safeStorage` wrapper in `shared/lib`. There is no network call at runtime, and nothing leaves the device.

The reasons for the key choices live in [`adr/`](adr/).

## Deployment

Cloudflare Pages builds and publishes the site on every push to `main`. The build and preview
settings live in the Cloudflare dashboard. The repo only pins the output directory, in
[`wrangler.jsonc`](../wrangler.jsonc).

To deploy from a local checkout, run `pnpm build && pnpm dlx wrangler pages deploy dist`.
