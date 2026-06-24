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

## Conventions

Architecture, the lean-by-design product contract, and coding standards (TypeScript, React, CSS,
testing, accessibility) live in [`AGENTS.md`](AGENTS.md) — please skim it before making changes.
Commits follow [Conventional Commits](https://www.conventionalcommits.org/).
