# 🎲 Scattergories Helper

[![CI](https://github.com/simonvanlierde/scattergories/actions/workflows/ci.yml/badge.svg)](https://github.com/simonvanlierde/scattergories/actions/workflows/ci.yml)
[![Tools Validate](https://github.com/simonvanlierde/scattergories/actions/workflows/tools.yml/badge.svg)](https://github.com/simonvanlierde/scattergories/actions/workflows/tools.yml)

A beautiful, responsive, digital companion for the classic game of Scattergories. This app completely replaces the physical 20-sided letter die, the sand timer, and the paper category cards, letting you play effortlessly with just paper and a pen.

## 🌟 Features

- **Draw 12 Mechanics**: Generates a perfect standard 12-category round by default.
- **Smart Randomization**: A satisfying animated letter roller that uses natural language frequency weights. You'll get playable letters more often, but every letter (A-Z) is still possible! It uses a perfect Fisher-Yates shuffle under the hood to ensure you never roll the same letter twice in a game.
- **Configurable Timer**: An urgent, pulsing timer with an alarm built right in.
- **Progressive Round Engine**: Click "Next Round" to automatically increment the round, reroll the letter, and preserve your existing categories!
- **Fully Responsive & Local**: Works seamlessly on mobile and desktop, stores all custom data privately locally via `localStorage`, and functions fully offline if installed as a PWA.

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript + Vite 8
- **Package manager:** pnpm
- **Lint & format:** Biome
- **Unit tests:** Vitest
- **E2E tests:** Playwright (chromium, against the built `vite preview` bundle)
- **Runtime image:** Caddy serving a static SPA bundle

## 🚀 Getting started

Requirements: **Node ≥ 24** and **pnpm ≥ 10**. [`just`](https://github.com/casey/just) is recommended as a thin command runner.

### Local development

```bash
pnpm install
pnpm dev
```

Open <http://localhost:5173> in your browser.

### Local quality gate

Run the full local pipeline in one command:

```bash
just verify   # or: pnpm run verify
```

This runs typecheck → full spellcheck → biome → unit tests → production build.
Use `just spellcheck` for a full-repo spelling pass, or `just spellcheck-changed <files...>` for a targeted run.

### End-to-end tests

Playwright boots `vite preview` against the production build and exercises the app in chromium:

```bash
pnpm test:e2e
```

### Git hooks

Pre-commit hooks (via [lefthook](https://github.com/evilmartians/lefthook)) run Biome and targeted cspell on staged files plus ruff/ty on `tools/**`. A pre-push hook runs the full `pnpm run verify` pipeline so regressions never reach `origin`.

## 🐳 Self-hosting with Docker

No registry image is published — build locally and run. The runtime image is Caddy serving the static bundle with SPA fallback, long-cache headers on hashed assets, and a hardened runtime (read-only filesystem, no new privileges, all caps dropped).

```bash
just up       # build and start (http://localhost:8080)
just logs     # tail logs
just down     # stop
```

To expose the app over a Cloudflare Tunnel, set `TUNNEL_TOKEN` in a `.env` file next to `docker-compose.yml` and run:

```bash
just up-tunnel
```

## 🤖 CI

GitHub Actions runs on every pull request and push to `main`:

1. **`Validate`** — install, typecheck, changed-file spellcheck on PRs, full spellcheck on manual dispatch, biome, Vitest, production build.
2. **`e2e`** — Playwright against the built bundle (chromium, with browser cache).

Dependabot opens grouped weekly PRs for npm, GitHub Actions, Docker, and the `tools/` uv environment.

## 🔒 Privacy

Custom categories are stored entirely in your browser's `localStorage`. Nothing ever leaves the device.
