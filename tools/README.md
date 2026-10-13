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

Everything goes through `uv run sg-tools --help`. By default, commands only preview. To write back,
pass one of these flags:

- `--write` for temporary output under `tools/out/`
- `--write-app-file` for locale weight generation
- `--write-app-files` for translated app JSON files

```bash
uv run sg-tools doctor                                     # check the environment and dependencies
uv run sg-tools weights sample --dataset wikitext-2        # preview sample corpus weights
uv run sg-tools weights sample --dataset wikitext-103 --write   # write them to tools/out/weights/
uv run sg-tools weights locales --locales en,fr,de         # preview locale weights
uv run sg-tools weights locales --locales en,es,fr,de,it,nl,pl,pt,el --write-app-file  # write them into the app
uv run sg-tools weights verify                             # check the table against its metadata and checksum
uv run sg-tools weights stamp                              # refresh the checksum after a deliberate edit of the table
uv run --group translation sg-tools translate categories --target-locales es,fr --write-app-files
uv run --group translation sg-tools translate locales --target-locales es,fr --write-app-files
```

Drop `--write-app-files` from the translate commands to preview. Both write into `src/i18n/locales/`.

There is no `justfile` at the repo root. [`tools/justfile`](justfile) has recipes such as
`just doctor`, `just audit`, `just weights-locales` and `just translate-categories es,fr`; run them
from `tools/`.

## Artifacts

- Temporary outputs live in `tools/out/`
- Runtime caches live in `tools/.cache/`
- Generated files that the app reads live in `src/i18n/__generated__/` and `src/i18n/locales/`
- The letter-weight table's provenance, checks and licence are described in
  [`src/i18n/__generated__/README.md`](../src/i18n/__generated__/README.md)

## Tests

Prefer fast unit tests with small fakes at module boundaries, reusable fakes over one-off mocks,
and one behavior test with many assertions over several shallow smoke tests. Put branch coverage
first in modules that mostly coordinate other code, like the CLI and the provider adapters.
