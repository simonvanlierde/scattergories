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

Requirements: **Node 24.x**, **pnpm 10.x**, and **Python 3.14** for `tools/`. [`just`](https://github.com/casey/just) is recommended as a thin command runner, and [`mise`](https://mise.jdx.dev/) is the preferred way to keep the toolchain aligned.

### Install toolchain

Preferred:

```bash
mise install
```

Fallback: install Node 24, pnpm 10, and Python 3.14 manually.

### Local development

```bash
pnpm install
pnpm dev
```

Open <http://localhost:5173> in your browser.

### Local quality gate

Run the standard app-only pipeline in one command:

```bash
just verify   # or: pnpm run verify
```

This runs typecheck → full spellcheck → biome → unit tests → production build.
Use `just spellcheck` for the app-focused spelling pass, or `just spellcheck-changed <files...>` for a targeted run.

For higher-risk changes that touch CI, Docker, or Python tooling, run the full local validation pass:

```bash
just verify-full
```

This runs app checks, `tools/` checks, and infrastructure validation.

To validate deployment-related config only:

```bash
just infra-check
```

### End-to-end tests

Playwright boots `vite preview` against the production build and exercises the app in chromium:

```bash
pnpm test:e2e
```

### Git hooks

Pre-commit hooks (via [lefthook](https://github.com/evilmartians/lefthook)) keep staged frontend files formatted and spell-checked, and run `ruff` on staged `tools/**` Python files. The pre-push hook runs frontend typechecking only; full validation stays explicit via `just verify` or `just verify-full`.

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

GitHub Actions stays intentionally cheap for a solo-maintained repo:

1. **`Validate`** — app checks on pull requests and pushes to `main` for frontend/runtime changes.
2. **`Tools Validate`** — Python tooling checks only when `tools/**` changes.
3. **`Infra Validate`** — Docker/Compose/Caddy validation only when deployment or CI infrastructure changes.
4. **`Security`** — dependency-file pull requests and manual dependency audits.
5. **`E2E`** — pushes to `main` and manual dispatch only, so Playwright does not run on every pull request.

Dependabot opens grouped weekly PRs for npm, GitHub Actions, Docker, and the `tools/` uv environment.

## 🔒 Privacy

Custom categories are stored entirely in your browser's `localStorage`. Nothing ever leaves the device.
