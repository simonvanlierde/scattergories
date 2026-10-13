# Contributing

Thanks for taking a look. This is a small personal project, but issues and pull requests are welcome.

## Prerequisites

Install [Node and pnpm](https://nodejs.org/en/download), then:

```bash
pnpm install
```

Node is pinned in [`.node-version`](.node-version), which version managers such as fnm, mise and nvm read. pnpm is pinned in the `packageManager` field of [`package.json`](package.json). Node 25 and later no longer bundle Corepack, so install pnpm yourself. pnpm then switches to the pinned version on its own.

[uv](https://docs.astral.sh/uv/) manages the Python tooling in [`tools/`](tools/README.md) separately. On `uv sync` it installs the Python version pinned in [`tools/.python-version`](tools/.python-version).

## Development loop

```bash
pnpm dev          # dev server at http://localhost:5173
pnpm test         # unit / component tests (vitest, watchless)
pnpm test:e2e     # end-to-end tests (playwright)
```

## Before you open a PR

Run the same checks that CI and the pre-push hook run, and make sure they pass:

```bash
pnpm verify       # typecheck + spellcheck + lint + test + build + bundle budget
```

If you touched the Python tooling in [`tools/`](tools/README.md), run the full set instead:

```bash
pnpm run ci       # verify, then the tools' ruff, format check, ty, table check and pytest
```

Keep the `run`: a bare `pnpm ci` is pnpm's own clean-install command and skips every check.

A [Lefthook](lefthook.yml) pre-commit hook formats staged files and spell-checks them. The
pre-push hook runs `pnpm verify`. Add new project-specific words to [`.cspell.yml`](.cspell.yml).

[`docs/quality.md`](docs/quality.md) explains what each check enforces: the coverage thresholds,
the bundle budget and the accessibility checks.

## Architecture

It's a React 19 + Vite single-page app (strict TypeScript, Biome, Vitest, Playwright). The code is
layered so the game rules never depend on React. [`docs/architecture.md`](docs/architecture.md) has the layer diagram and the map. Keep two rules in mind while you work in it:

- `useGameController` is the one boundary between `src/app/` and the feature hooks. Go through it rather than reaching into feature internals.
- Round state runs on a `useReducer` (`idle → spinning → buffer → running → done`). Saved settings use hooks backed by localStorage. Keep short-lived UI state next to the component that owns it.

If you make a design decision that isn't obvious, record it as an ADR (architecture decision record) under [`docs/adr/`](docs/adr/).

## Product contract

I keep the app lean on purpose. It runs a round with a letter, a timer and prompts, and it doesn't keep score. Categories are read-only during play. Don't bring back strike-through, per-round scoring, completion counting or similar mechanics unless someone explicitly asks for them. Prefer removing state and indirection over adding nice-to-haves. Avoid new abstractions unless they remove duplication across call sites.

## Conventions

- **TypeScript**: strict mode, no `any` (use `unknown`), verbatim module syntax.
- **React**: small single-purpose components. Try plain state and props before custom hooks. Test
  the behavior a user can see.
- **Biome**: 2-space indent, single quotes, semicolons, 100-char lines. `pnpm lint:fix` fixes what it can.
- **CSS**: plain CSS only, reuse the tokens in `src/styles/`.
- **Accessibility**: semantic HTML and correct ARIA. Respect `prefers-reduced-motion`. In tests, query
  by ARIA role, label or text first.
- **Tests**: Vitest (jsdom) for unit and component tests, Playwright (Chromium) for end-to-end
  tests. Line coverage must stay at 95% in `src/domain/game/` and 60% elsewhere.
- **i18n**: when you change wording a user sees, update the tests and every locale in the same
  change. `completeness.test.ts` checks that the locales stay in step.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/).
