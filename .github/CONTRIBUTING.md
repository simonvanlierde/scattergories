# Contributing

Bug reports, feature requests and pull requests are welcome. Read the
[Code of Conduct](CODE_OF_CONDUCT.md) first, and report vulnerabilities as
[SECURITY.md](SECURITY.md) describes, not in a public issue.

## Report a bug or ask for a feature

Open an [issue](https://github.com/simonvanlierde/scattergories/issues) with the bug or
feature form. For a bug, say what you did, what you expected and what happened, and
which browser you used. If the README and docs don't answer a question, open a feature request for it.

## Suggest a category

Use the [category form](https://github.com/simonvanlierde/scattergories/issues/new?template=category.yml),
also linked from How to play in the app. Give the wording, its language, the audience and
difficulty, example answers for at least three letters, and where the idea comes from.

I review each suggestion: the wording, whether it suits the pack's audience, whether most
letters have answers, and whether we may share it. Only reviewed categories go into a built-in
pack. Once we agree on the issue, you can open a pull request that adds the category to every
locale in `src/i18n/locales/` and to a pack in [`src/domain/deck.ts`](../src/domain/deck.ts).

## Scope and response

I maintain scattergories in my own time. Expect a reply to an issue or pull request
within about two weeks.

Before a large pull request, such as a new feature, open an issue and agree on the change
there first. A small fix needs no issue. I close a pull request outside the project's scope
with a link to this section.

## Set up and check

[Prerequisites](#prerequisites) installs the tools, the dependencies and the git hooks.
`just check` runs the checks CI runs, and `just fmt` fixes and formats.

uv and pnpm lock only releases at least a week old. If `just check` fails on
a security fix newer than that, add the package to `exclude-newer-package` under `[tool.uv]` in `tools/pyproject.toml` or `minimumReleaseAgeExclude` in `pnpm-workspace.yaml`,
and remove it a week later ([how](https://github.com/simonvanlierde/project-templates/blob/main/docs/tooling.md#dependencies)).

## Prerequisites

Install [Node and pnpm](https://nodejs.org/en/download), then run `pnpm install`.

Before running browser tests, install their browsers with `pnpm exec playwright install chromium firefox webkit`.
On Linux, use `pnpm exec playwright install --with-deps chromium firefox webkit` if browser system libraries are missing.

Node is pinned in [`.node-version`](../.node-version), which fnm, mise and nvm read. pnpm is pinned in the `packageManager` field of [`package.json`](../package.json). Node 25 and later no longer bundle Corepack, so install pnpm yourself. It then switches to the pinned version on its own.

[uv](https://docs.astral.sh/uv/) manages the Python tooling in [`tools/`](../tools/README.md). On `uv sync` it installs the Python version pinned in [`tools/.python-version`](../tools/.python-version). [just](https://just.systems) runs the checks, and [prek](https://github.com/j178/prek) runs the git hooks (`pnpm install` brings prek; then run `pnpm exec prek install` once per clone).

## Development loop

```bash
pnpm dev          # dev server at http://localhost:5173
pnpm test         # unit / component tests (vitest, watchless)
pnpm test:e2e     # end-to-end tests (playwright)
```

Run `just ts-shots` to refresh route captures in `shots/` and the README images in
`docs/screenshots/`. The README captures use the same draw and running clock in both themes.

## Before you open a PR

```bash
pnpm verify       # lint + unused code + spellcheck + typecheck + tests with coverage + build + bundle budgets
just check        # what CI runs: verify plus the dependency audit, then the tools' ruff, format check, ty, table check, pytest and audit
pnpm test:e2e     # Playwright against the production build (E2E_PORT moves it off port 4173)
just hooks        # every git hook over the whole repo, as CI's hooks job runs them
```

The [prek](../.pre-commit-config.yaml) pre-commit hooks format, lint and spell-check staged files, and the pre-push hook runs `pnpm verify`. Add new project-specific words to [`.cspell.yml`](../.cspell.yml). [`docs/quality.md`](../docs/quality.md) lists the coverage thresholds, the bundle budget and the accessibility checks.

## Architecture

[`docs/architecture.md`](../docs/architecture.md) has the layer diagram. Two rules:

- The game screen reaches the feature hooks only through `useGameController`, and renders each feature through its public component. Keep feature logic in `src/features/`, not in the shell.
- Round state runs on a `useReducer`. Saved settings use hooks backed by localStorage. Keep short-lived UI state next to the component that owns it.

Record a design decision that isn't obvious as an ADR under [`docs/adr/`](../docs/adr/).

## Product contract

The app runs a round with a letter, a timer and categories, and it doesn't keep score. Categories are read-only during play. Don't bring back strike-through, per-round scoring, completion counting or similar mechanics unless someone asks for them. Remove state and indirection before you add extras. Add an abstraction only when it removes duplication across call sites.

## Conventions

- **TypeScript**: strict mode, no `any` (use `unknown`), verbatim module syntax.
- **React**: small single-purpose components. Try plain state and props before custom hooks. Test
  the behavior a user can see.
- **Style**: Biome (`pnpm fix` fixes what it can). Plain CSS only, reuse the tokens in `src/styles/`.
- **Accessibility**: semantic HTML and correct ARIA. Respect `prefers-reduced-motion`. In tests, query
  by ARIA role, label or text first.
- **i18n**: when you change wording a user sees, update the tests and every locale in the same
  change. `completeness.test.ts` checks that the locales stay in step.

## Write commits and pull requests

- **Commits** follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/):
  `type(scope): summary`, in the imperative, lower case, with no period. Add a body only
  when the change needs one, with a bullet per logical chunk.
- **The pull request title** becomes the squash commit subject, so it follows the same rule.
- **Both are checked** against [`committed.toml`](../committed.toml). A commit-msg
  hook (installed by `prek install`) refuses a commit message that breaks the rule. The
  `pull request title` check fails a pull request whose title does. Lower case isn't
  checked. Title a revert `revert: <original subject>`: rename the `Revert "..."` title
  that GitHub's Revert button writes.
- **The pull request body** has the shape of
  [the pull request template](pull_request_template.md): what it fixes and why, three or
  four bullets, and a `Tested:` line with the proof (the command and its result, or a test
  that fails without the change). A `Not checked:` line lists what did not run and why, and
  any design choice or security path that only a person can judge. "Nothing" is fine.
- **The changelog** ([CHANGELOG.md](../CHANGELOG.md)) follows
  [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/). Write each entry for
  the people who use the project, not as a commit subject. Mark breaking changes
  **Breaking**, and put upgrade steps first under the version.
- **The release notes** are that version's changelog section.

## Make a release

The maintainer runs `just release X.Y.Z` twice:

1. The first run sets the version in `package.json`, adds the dated changelog section and commits
   both files. Merge that commit through a pull request.
2. On an up-to-date `main`, the second run checks the version in `package.json`, then signs and
   pushes the version tag.

The release workflow verifies the tag signature and publishes that version's changelog section.
[Publishing](https://github.com/simonvanlierde/project-templates/blob/main/docs/setup.md#publishing)
has the one-time setup.

### Repository setup

`just repo-settings` applies the repository rulesets, creates the GitHub deployment environments
and turns on security features. Read the recipe before you run it.
[Deployment](../docs/architecture.md#deployment) lists the Cloudflare secrets and the checks after a deploy.

## Sign off your commits

Every commit in a pull request carries a `Signed-off-by:` line, which says you wrote the
change or have the right to submit it under this project's license: the
[Developer Certificate of Origin 1.1](https://developercertificate.org/). `git commit -s`
adds the line, and the commit-msg hook refuses a commit without it.

To add it to commits you already made, run `git fetch origin`, then
`git rebase --signoff origin/main`. In a fork, use the remote that points at this repository
(often `upstream`) in place of `origin`. If you pushed the branch already, update it with
`git push --force-with-lease`. Do not use a plain `git push --force`.

The `dco` workflow checks every pull request from a fork and fails on a commit without the line. Pull requests from a branch in this repository skip it: pushing that branch already needed write access.

## Who maintains this

Simon van Lierde maintains scattergories: reviews pull requests, merges them and
makes releases. The repository belongs to [simonvanlierde](https://github.com/simonvanlierde)
on GitHub. Only maintainers can merge to `main`. An existing maintainer adds a new one by name in this section.
If no maintainer can continue, the repository is archived with a note in the README,
and anyone may fork it under its license.
