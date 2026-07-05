# Contributing

Thanks for taking a look. This is a small personal project, but issues and pull requests are welcome.

## Prerequisites

Tool versions are pinned in [`mise.toml`](mise.toml). With [mise](https://mise.jdx.dev):

```bash
mise install     # Node 24.13.0, pnpm 10.33.2, Python 3.14
pnpm install
```

Without mise, install Node 24+ and pnpm 10+ yourself.

## Development loop

```bash
pnpm dev          # dev server at http://localhost:5173
pnpm test         # unit / component tests (vitest, watchless)
pnpm test:e2e     # end-to-end tests (playwright)
```

## Before you open a PR

Run the same gate that CI and the pre-push hook run, and make sure it's green:

```bash
pnpm verify       # typecheck + spellcheck + lint + test + build + bundle budget
```

If you touched the Python tooling in [`tools/`](tools/README.md), run the full gate instead:

```bash
pnpm ci           # verify, then the tools' ruff + ty + pytest
```

A [Lefthook](lefthook.yml) pre-commit hook auto-formats staged files and spell-checks them; the
pre-push hook runs `pnpm verify`. New project-specific words go in [`.cspell.yml`](.cspell.yml).

## Architecture

A React 19 + Vite SPA (TypeScript strict, Biome, Vitest, Playwright). Source is layered:

- `src/app/` — shell, layout, and orchestration hooks (`useGameController` is the boundary).
- `src/features/` — `round/` (playmat, timer, letter roller), `categories/`, and `settings/`.
- `src/domain/game/` — framework-free round state machine (`roundReducer`), constants, and letter-weight helpers.
- `src/shared/` — reusable UI primitives (`ui/`) and libraries (`lib/`): category packs, storage, haptics.
- `src/i18n/` — i18next config plus per-locale UI strings, categories, and generated letter weights for
  `en`, `de`, `el`, `es`, `fr`, `it`, `nl`, `pl`, `pt`.

Round state runs on `useReducer` (`idle → spinning → buffer → running → done`); persisted settings use
localStorage-backed hooks. Keep ephemeral UI state next to the component that owns it.

## Product contract

Lean by design: a round companion for letter, timer, and prompts — not a scorekeeper. Categories are
read-only during play. Don't reintroduce strike-through, per-round scoring, completion counting, or
similar mechanics unless explicitly asked. Prefer removing state and indirection over adding
nice-to-haves; avoid new abstractions unless they remove duplication across call sites.

## Conventions

- **TypeScript** — strict mode, no `any` (use `unknown`), verbatim module syntax.
- **React** — small single-purpose components; prefer plain state/props before custom hooks; test
  user-visible behavior.
- **Biome** — 2-space indent, single quotes, semicolons, 100-char lines; `pnpm lint:fix` to auto-fix.
- **CSS** — plain CSS only, reuse the tokens in `src/styles/`.
- **Accessibility** — semantic HTML and correct ARIA; respect `prefers-reduced-motion`; query tests by
  ARIA role/label/text first.
- **Tests** — Vitest (jsdom) for unit/component, Playwright (Chromium) for E2E; 95% line coverage in
  `src/domain/game/`, 60% elsewhere.
- **i18n** — when changing user-visible wording, update tests and every locale in the same change;
  `completeness.test.ts` enforces parity.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/).
