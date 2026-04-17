# Scattergories Tools

The `tools/` workspace contains the Python CLI used to inspect, preview, and regenerate
Scattergories locale assets.

## Install

```bash
cd tools
uv sync --locked
```

Optional offline translation support:

```bash
uv sync --group translation --locked
```

## CLI

All workflows go through one command:

```bash
uv run sg-tools --help
```

Supported commands:

- `sg-tools doctor`
- `sg-tools weights sample`
- `sg-tools weights locales`
- `sg-tools translate categories`
- `sg-tools translate locales`

By default commands are preview-safe. Writing back to the app requires explicit flags:

- `--write` for ephemeral output under `tools/out/`
- `--write-app-file` for locale weight generation
- `--write-app-files` for translated app JSON files

## Common workflows

Preview environment and dependency health:

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
uv run sg-tools weights locales --locales en fr de
```

Write locale weights into the app:

```bash
uv run sg-tools weights locales --locales en es fr de it nl pl pt el --write-app-file
```

Preview category translation:

```bash
uv run --group translation sg-tools translate categories --target-locales es fr
```

Write translated category files into `src/i18n/locales/`:

```bash
uv run --group translation sg-tools translate categories --target-locales es fr --write-app-files
```

Preview locale payload translation:

```bash
uv run --group translation sg-tools translate locales --target-locales es fr
```

Write translated locale payloads into `src/i18n/locales/`:

```bash
uv run --group translation sg-tools translate locales --target-locales es fr --write-app-files
```

## Task runner

From the repo root:

```bash
just tools-install
just tools-check
just tools-doctor
just tools-weights-locales
just tools-translate-categories es fr
```

From `tools/`:

```bash
just check
just doctor
just weights-locales
just translate-categories es fr
```

## Artifacts

- Ephemeral outputs live in `tools/out/`
- Runtime caches live in `tools/.cache/`
- App-consumed generated files live in `src/i18n/__generated__/` and `src/i18n/locales/`

Coverage output is reported in the terminal/CI and is not written into tracked workspace files.

## Test suite notes

- Prefer fast unit tests and narrow seam-based fakes over broader integration setups.
- Prioritize branch coverage on orchestration-heavy modules like the CLI and provider adapters.
- When behavior matters, prefer reusable fakes over ad hoc mocks and inline anonymous stubs.
- Favor one assertion-rich behavior test over several shallow smoke tests for the same path.
