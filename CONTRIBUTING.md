# Contributing

This is a small personal project, but issues and pull requests are welcome.

## Prerequisites

Install [Node and pnpm](https://nodejs.org/en/download), then run `pnpm install`.

Node is pinned in [`.node-version`](.node-version), which version managers such as fnm, mise and nvm read. pnpm is pinned in the `packageManager` field of [`package.json`](package.json). Node 25 and later no longer bundle Corepack, so install pnpm yourself. pnpm then switches to the pinned version on its own.

[uv](https://docs.astral.sh/uv/) manages the Python tooling in [`tools/`](tools/README.md). On `uv sync` it installs the Python version pinned in [`tools/.python-version`](tools/.python-version). [just](https://just.systems) runs the checks, and [prek](https://github.com/j178/prek) runs the git hooks (`pnpm install` brings prek; then run `pnpm exec prek install` once per clone).

## Development loop

```bash
pnpm dev          # dev server at http://localhost:5173
pnpm test         # unit / component tests (vitest, watchless)
pnpm test:e2e     # end-to-end tests (playwright)
```

## Before you open a PR

```bash
pnpm verify       # lint + unused code + spellcheck + typecheck + tests with coverage + build + bundle budgets
just check        # what CI runs: verify plus the dependency audit, then the tools' ruff, format check, ty, table check, pytest and audit
pnpm test:e2e     # Playwright against the production build (E2E_PORT moves it off port 4173)
just hooks        # every git hook over the whole repo, as CI's hooks job runs them
```

The [prek](.pre-commit-config.yaml) pre-commit hooks format, lint and spell-check staged files, and the pre-push hook runs `pnpm verify`. Add new project-specific words to [`.cspell.yml`](.cspell.yml). [`docs/quality.md`](docs/quality.md) lists the coverage thresholds, the bundle budget and the accessibility checks.

## Architecture

[`docs/architecture.md`](docs/architecture.md) has the layer diagram. Two rules:

- `useGameController` is the one boundary between `src/app/` and the feature hooks. Go through it rather than reaching into feature internals.
- Round state runs on a `useReducer`. Saved settings use hooks backed by localStorage. Keep short-lived UI state next to the component that owns it.

Record a design decision that isn't obvious under [`docs/decisions/`](docs/decisions/README.md).

## Product contract

I keep the app lean on purpose. It runs a round with a letter, a timer and prompts, and it doesn't keep score. Categories are read-only during play. Don't bring back strike-through, per-round scoring, completion counting or similar mechanics unless someone explicitly asks for them. Prefer removing state and indirection over adding nice-to-haves. Avoid new abstractions unless they remove duplication across call sites.

## Conventions

- **TypeScript**: strict mode, no `any` (use `unknown`), verbatim module syntax.
- **React**: small single-purpose components. Try plain state and props before custom hooks. Test
  the behavior a user can see.
- **Style**: Biome (`pnpm fix` fixes what it can). Plain CSS only, reuse the tokens in `src/styles/`.
- **Accessibility**: semantic HTML and correct ARIA. Respect `prefers-reduced-motion`. In tests, query
  by ARIA role, label or text first.
- **i18n**: when you change wording a user sees, update the tests and every locale in the same
  change. `completeness.test.ts` checks that the locales stay in step.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/).

## Sign off your commits

Sign every commit with `git commit -s`. It adds a `Signed-off-by:` line, which says you wrote the
change or have the right to submit it under this project's license: the
[Developer Certificate of Origin 1.1](https://developercertificate.org/). The `dco` check refuses a
pull request from a fork that has an unsigned commit. To sign commits you already made, run
`git rebase --signoff main` and force-push the branch.
