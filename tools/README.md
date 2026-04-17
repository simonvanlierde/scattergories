# Tools

This folder contains small Python tools for Scattergories data workflows:

- locale-aware letter frequency derivation for letter weights
- category translation from `src/game/constants.ts` using Argos Translate

It also includes Python helpers for recreating locale-specific letter weights from `src/i18n/locales/*.json` and for downloading Wikitext-2 / Wikitext-103 from Hugging Face.

## What it computes

- Input: locale JSON payloads and category JSON files, or Wikitext corpora
- Match rule: first letter of each word, normalized to `A-Z`
- Output columns:
  1. `LETTER`
  2. `RELATIVE_FREQUENCY` (0 to 1)
  3. `COUNT`

## Quick start

From this folder:

```bash
chmod +x frequencies.sh
./frequencies.sh ../../texts
./frequencies.sh --ts ../../texts
```

## Recreate locale frequencies locally

### Quick start

```bash
uv sync
uv run python letter-frequency/wikitext_frequencies.py --mode locales
```

This reads `src/i18n/locales/<locale>.json` plus `src/i18n/locales/categories.<locale>.json` for every locale in `src/i18n/locales/registry.json` and writes outputs to `data/<locale>/`:

- `frequencies.tsv`
- `letter_weights.ts`

It also writes `data/locale-manifest.json` with completeness metadata.

By default, each locale stream is capped at `150 MB` of text. Override that with:

```bash
uv run python letter-frequency/wikitext_frequencies.py --mode locales --max-bytes 50000000
```

### Preview the locale run

```bash
uv run python letter-frequency/wikitext_frequencies.py --mode locales --dry-run
```

### Using just recipes

```bash
just generate-locale-weights
just dry-run-locales
just show-locale-weights en
```

## Recreate Wikitext frequencies locally

### Quick start (small dataset, ~13 MB)

```bash
uv sync
uv run python letter-frequency/wikitext_frequencies.py
```

This downloads **Wikitext-2** and writes outputs to `data/wikitext-2-raw-v1/`:

- `frequencies.tsv`
- `letter_weights.ts`

### Larger dataset (~540 MB)

To use **Wikitext-103** instead:

```bash
uv run python letter-frequency/wikitext_frequencies.py --large
```

To preview the selected dataset and output path without downloading anything:

```bash
uv run python letter-frequency/wikitext_frequencies.py --dry-run
```

### Using just recipes

```bash
just generate-weights      # Download Wikitext-2 (default)
just generate-weights large  # Download Wikitext-103
just dry-run               # Preview dataset and output path
just dry-run large         # Preview Wikitext-103 dataset and output path
just show-weights          # Display top letters
just show-weights large    # Display Wikitext-103 weights
```

## Translate categories

Install Argos dependencies once:

```bash
just install-translation
```

Preview run (no downloads, no translation):

```bash
just translate-categories-dry-run
```

Translate categories to Spanish (default):

```bash
just translate-categories
```

Translate categories to multiple locales:

```bash
just translate-categories "es fr de"
```

Outputs are written to `translation/data/categories.<locale>.json`.

Translate locale JSON payloads from `src/i18n/locales/en.json`:

```bash
just translate-locales "es fr de"
```

Dry run for locale payload translation:

```bash
just translate-locales-dry-run "es fr de"
```

Locale outputs are written to `translation/data/locale.<locale>.json`.

Normal runs suppress noisy Hugging Face and HTTP client logs so only the script's own output is shown. Use `--verbose` for extra detail from this script.

## TypeScript output for locale weights

To print a paste-ready object for a locale bundle:

```bash
uv run python letter-frequency/wikitext_frequencies.py --mode locales --locales en
```

This emits:

```ts
export const LETTER_WEIGHTS: Record<string, number> = {
  A: 0.00000000,
  ...
  Z: 0.00000000,
};
```

## One-liner (no script)

```bash
find texts -type f -print0 \
  | xargs -0 rg -o -i --no-filename '\\b[a-z]' \
  | tr '[:upper:]' '[:lower:]' \
  | awk '{c[$1]++; t++} END {for (l in c) printf "%s\t%.8f\t%d\\n", toupper(l), c[l]/t, c[l]}' \
  | sort -k2,2nr
```

## Note

If you pipe to `head`, you may see a harmless `xargs: cat: terminated with signal 13` message due to downstream early exit.
