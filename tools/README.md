# Scattergories Tools

The `tools/` workspace holds the Python CLI that inspects, previews and regenerates the
Scattergories locale assets.

## Install

```bash
cd tools
uv sync --locked
```

For offline translation, also install the optional group:

```bash
uv sync --group translation --locked
```

## CLI

Everything goes through one command:

```bash
uv run sg-tools --help
```

The commands are:

- `sg-tools doctor`
- `sg-tools weights sample`
- `sg-tools weights locales`
- `sg-tools weights verify`
- `sg-tools weights stamp`
- `sg-tools translate categories`
- `sg-tools translate locales`

By default, commands only preview. To write back to the app, pass one of these flags:

- `--write` for temporary output under `tools/out/`
- `--write-app-file` for locale weight generation
- `--write-app-files` for translated app JSON files

## Common workflows

Check the environment and dependencies:

```bash
uv run sg-tools doctor
```

Preview sample corpus weights:

```bash
uv run sg-tools weights sample --dataset wikitext-2
```

Write sample corpus output to `tools/out/weights/`:

```bash
uv run sg-tools weights sample --dataset wikitext-103 --write
```

Preview locale weights:

```bash
uv run sg-tools weights locales --locales en,fr,de
```

Write locale weights into the app:

```bash
uv run sg-tools weights locales --locales en,es,fr,de,it,nl,pl,pt,el --write-app-file
```

Preview category translation:

```bash
uv run --group translation sg-tools translate categories --target-locales es,fr
```

Write translated category files into `src/i18n/locales/`:

```bash
uv run --group translation sg-tools translate categories --target-locales es,fr --write-app-files
```

Preview locale payload translation:

```bash
uv run --group translation sg-tools translate locales --target-locales es,fr
```

Write translated locale payloads into `src/i18n/locales/`:

```bash
uv run --group translation sg-tools translate locales --target-locales es,fr --write-app-files
```

## Task runner

There is no `justfile` at the repo root. Run the recipes from `tools/`:

```bash
cd tools && just doctor
cd tools && just audit
cd tools && just weights-locales
cd tools && just translate-categories es,fr
```

See [`tools/justfile`](justfile) for the full recipe list.

## Artifacts

- Temporary outputs live in `tools/out/`
- Runtime caches live in `tools/.cache/`
- Generated files that the app reads live in `src/i18n/__generated__/` and `src/i18n/locales/`
- The letter-weight table's provenance, checks and licence are described in
  [`src/i18n/__generated__/README.md`](../src/i18n/__generated__/README.md)

Coverage is reported in the terminal and in CI. It is not written to any tracked file.

## Test suite notes

- Prefer fast unit tests with small fakes at module boundaries over larger integration setups.
- Put branch coverage first in modules that mostly coordinate other code, like the CLI and the
  provider adapters.
- When behavior matters, prefer reusable fakes over one-off mocks and inline stubs.
- For one code path, prefer one behavior test with many assertions over several shallow smoke
  tests.
