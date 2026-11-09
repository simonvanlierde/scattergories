# Contributing

This is a small personal project, but issues and pull requests are welcome.
Read the [Code of Conduct](.github/CODE_OF_CONDUCT.md). Report vulnerabilities through
[the security policy](.github/SECURITY.md), rather than in a public issue.

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

Record a design decision that isn't obvious as an ADR under [`docs/adr/`](docs/adr/).

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

## Commits and pull requests

Commits and pull request titles follow [Conventional Commits](https://www.conventionalcommits.org/):
`type(scope): summary`, in the imperative, with no trailing period.
Use the [pull request template](.github/pull_request_template.md) to describe the change and its checks.

Sign off each commit with `git commit -s`. The `Signed-off-by:` line confirms that you have the
right to submit the change under the [Developer Certificate of Origin](https://developercertificate.org/).
The commit-msg hook requires it. CI also checks commits in pull requests from forks.

To sign off existing commits, fetch the upstream repository and run `git rebase --signoff origin/main`.
In a fork, replace `origin` with the remote that points to this repository, often `upstream`.
If you already pushed the branch, update it with `git push --force-with-lease`.

## Repository setup and releases

The maintainer can run `just repo-settings` to apply the repository rulesets and create the
GitHub deployment environments. It also configures security features; review the recipe before running it.
[Deployment](docs/architecture.md#deployment) lists the Cloudflare secrets and migration checks.

Run `just release X.Y.Z` to prepare a release. The first run updates the version in `package.json`
and prepares the dated changelog section. It commits both files. Review and merge that commit through a pull request.
On an up-to-date `main`, run the same command again. It checks the manifest version, then signs and pushes the version tag.
The release workflow verifies the tag signature and publishes that version's changelog section.
