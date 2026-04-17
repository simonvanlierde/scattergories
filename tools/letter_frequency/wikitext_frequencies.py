#!/usr/bin/env python3
"""Derive first-letter frequencies from Wikitext corpora for Scattergories weights."""

import argparse
import json
import logging
import os
import re
import unicodedata
from collections import Counter
from pathlib import Path
from typing import TYPE_CHECKING, NamedTuple, TypedDict, cast

from datasets import load_dataset
from tqdm.auto import tqdm

if TYPE_CHECKING:
    from collections.abc import Iterable, Iterator

logger = logging.getLogger(__name__)
NOISY_LOGGERS = (
    "datasets",
    "datasets.packaged_modules",
    "huggingface_hub",
    "httpx",
    "httpcore",
)

WORD_INITIAL_RE = re.compile(r"\b[a-z]", re.IGNORECASE)
ALPHABET = tuple("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
DEFAULT_DATASET = "wikitext-2-raw-v1"
LARGE_DATASET = "wikitext-103-raw-v1"
DATASET_SPLITS = ("train", "validation", "test")
WIKIPEDIA_DATASET = "wikimedia/wikipedia"
WIKIPEDIA_DATASET_DATE = "20231101"
DEFAULT_MAX_BYTES = 150_000_000
DEFAULT_LOCALE_REGISTRY = Path(__file__).resolve().parents[2] / "src/i18n/locales/registry.json"
DEFAULT_SOURCE_OUTPUT = Path(__file__).resolve().parents[2] / "src/i18n/locales/letterWeights.generated.ts"
DEFAULT_WIKIPEDIA_MAX_BYTES = DEFAULT_MAX_BYTES


class LetterRow(NamedTuple):
    """One row of the letter-frequency table."""

    letter: str
    frequency: float
    count: int


class LocaleAnalysis(NamedTuple):
    """Locale-level analysis data used to render generated source output."""

    locale: str
    rows: list[LetterRow]
    total: int
    source_count: int
    processed_bytes: int
    max_bytes: int


class LocaleManifestEntry(TypedDict, total=False):
    """Manifest entry for one locale, used to track completeness and coverage of locale-specific payloads."""

    locale: str
    sourceCount: int
    total: int
    hasWeights: bool
    hasLocalePayload: bool
    hasCategoryPayload: bool
    processedBytes: int
    maxBytes: int


def load_locale_registry(registry_path: Path = DEFAULT_LOCALE_REGISTRY) -> dict[str, object]:
    """Load the shared locale registry used by the app and tools."""
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    if not isinstance(registry, dict):
        msg = f"Invalid locale registry at {registry_path}"
        raise TypeError(msg)
    return registry


def supported_locales(registry_path: Path = DEFAULT_LOCALE_REGISTRY) -> list[str]:
    """Return the canonical locale list from the shared registry."""
    registry = load_locale_registry(registry_path)
    locales = registry.get("locales")
    if not isinstance(locales, list) or not all(isinstance(locale, str) for locale in locales):
        msg = f"Invalid locale list in {registry_path}"
        raise TypeError(msg)
    return cast("list[str]", list(locales))


def validate_requested_locales(locales: Iterable[str], registry_path: Path = DEFAULT_LOCALE_REGISTRY) -> None:
    """Ensure requested locales all exist in the shared registry."""
    allowed = set(supported_locales(registry_path))
    invalid = sorted({locale for locale in locales if locale not in allowed})
    if invalid:
        msg = f"Unsupported locale code(s): {', '.join(invalid)}"
        raise ValueError(msg)


def get_locale_letters(locale: str, registry_path: Path = DEFAULT_LOCALE_REGISTRY) -> list[str]:
    """Return the locale-specific alphabet from the shared registry."""
    registry = load_locale_registry(registry_path)
    letters_by_locale = registry.get("lettersByLocale")
    if not isinstance(letters_by_locale, dict):
        msg = f"Invalid lettersByLocale map in {registry_path}"
        raise TypeError(msg)

    normalized = locale.lower().split("-")[0]
    fallback_locale = cast("str", registry.get("fallbackLocale", "en"))
    typed_letters_by_locale = cast("dict[str, str]", letters_by_locale)
    letters = typed_letters_by_locale.get(normalized) or typed_letters_by_locale.get(fallback_locale)
    if not isinstance(letters, str):
        msg = f"Invalid letter set for locale {locale!r}"
        raise TypeError(msg)
    return list(letters)


def _iter_word_initials(text: str) -> Iterator[str]:
    """Yield the first letter of each word using Unicode-aware scanning."""
    previous_was_letter = False
    for char in text:
        is_letter = char.isalpha()
        if is_letter and not previous_was_letter:
            yield char
        previous_was_letter = is_letter


def _normalize_initial(letter: str, alphabet_set: set[str]) -> str | None:
    """Fold a Unicode initial to a locale letter when possible."""
    normalized = unicodedata.normalize("NFKD", letter)
    for char in normalized:
        if unicodedata.category(char) == "Mn":
            continue
        upper = char.upper()
        if upper in alphabet_set:
            return upper
    return None


def analyze_texts(texts: Iterable[str], alphabet: Iterable[str] = ALPHABET) -> tuple[list[LetterRow], int]:
    """Analyze texts and return sorted rows plus total count."""
    alphabet_list = list(alphabet)
    alphabet_set = set(alphabet_list)
    counts: Counter[str] = Counter()
    total = 0
    for text in texts:
        for initial in _iter_word_initials(text):
            letter = _normalize_initial(initial, alphabet_set)
            if letter is None:
                continue
            counts[letter] += 1
            total += 1

    rows = [LetterRow(letter, (counts[letter] / total) if total else 0.0, counts[letter]) for letter in alphabet_list]
    rows.sort(key=lambda row: row.frequency, reverse=True)
    return rows, total


def iter_dataset_texts(  # noqa: PLR0913 # Allow 6 parameters
    dataset_name: str,
    config_name: str,
    *,
    split_names: Iterable[str] = DATASET_SPLITS,
    hf_token: str | None = None,
    max_bytes: int | None = None,
    stats: dict[str, int] | None = None,
) -> Iterator[str]:
    """Iterate over non-empty text rows from a dataset, optionally capping bytes processed."""
    processed_bytes = 0
    if stats is None:
        stats = {}
    stats.setdefault("row_count", 0)
    stats.setdefault("processed_bytes", 0)
    for split_name in split_names:
        split = load_dataset(
            dataset_name,
            config_name,
            split=split_name,
            token=hf_token,
            streaming=True,
        )
        for row in tqdm(split, desc=f"{config_name}/{split_name}", unit=" rows"):
            if not isinstance(row, dict):
                continue
            text = row.get("text")
            if not isinstance(text, str):
                continue

            stripped = text.strip()
            if not stripped:
                continue

            encoded_length = len(stripped.encode("utf-8"))
            if max_bytes is not None and max_bytes > 0 and processed_bytes + encoded_length > max_bytes:
                return

            processed_bytes += encoded_length
            stats["row_count"] += 1
            stats["processed_bytes"] = processed_bytes
            yield stripped


def analyze_wikipedia_locale(
    locale: str,
    *,
    hf_token: str | None = None,
    max_bytes: int = DEFAULT_WIKIPEDIA_MAX_BYTES,
    registry_path: Path = DEFAULT_LOCALE_REGISTRY,
) -> LocaleAnalysis:
    """Analyze the capped Wikipedia stream for one locale."""
    stats: dict[str, int] = {"row_count": 0, "processed_bytes": 0}
    rows, total = analyze_texts(
        iter_dataset_texts(
            WIKIPEDIA_DATASET,
            f"{WIKIPEDIA_DATASET_DATE}.{locale}",
            split_names=("train",),
            hf_token=hf_token,
            max_bytes=max_bytes,
            stats=stats,
        ),
        get_locale_letters(locale, registry_path),
    )
    return LocaleAnalysis(
        locale=locale,
        rows=rows,
        total=total,
        source_count=stats["row_count"],
        processed_bytes=stats["processed_bytes"],
        max_bytes=max_bytes,
    )


def render_locale_weight_source(
    analyses: dict[str, LocaleAnalysis],
) -> str:
    """Render a committed TypeScript module containing locale weight tables."""
    lines: list[str] = [
        "import type { LocaleCode } from './resources';",
        "",
        "export interface LocaleWeightManifest {",
        "  locale: LocaleCode;",
        "  sourceCount: number;",
        "  total: number;",
        "  hasWeights: boolean;",
        "  hasLocalePayload: boolean;",
        "  hasCategoryPayload: boolean;",
        "  processedBytes: number;",
        "  maxBytes: number;",
        "}",
        "",
        "export const LETTER_WEIGHTS_BY_LOCALE: Record<LocaleCode, Record<string, number>> = Object.fromEntries([",
    ]

    for locale, analysis in analyses.items():
        lines.append(f"  [{json.dumps(locale)}, {{")
        lines.extend(
            f"      [{json.dumps(row.letter)}, Number({json.dumps(f'{row.frequency:.8f}')})],"
            for row in sorted(analysis.rows, key=lambda item: item.letter)
        )
        lines.append("  }],")
    lines.append("]) as Record<LocaleCode, Record<string, number>>;")
    lines.append("")
    lines.append("export const LOCALE_WEIGHT_MANIFEST: Record<LocaleCode, LocaleWeightManifest> = Object.fromEntries([")
    for locale, analysis in analyses.items():
        lines.append(f"  [{json.dumps(locale)}, {{")
        lines.append(f"    locale: {json.dumps(locale)} as LocaleCode,")
        lines.append(f"    sourceCount: Number({json.dumps(str(analysis.source_count))}),")
        lines.append(f"    total: Number({json.dumps(str(analysis.total))}),")
        lines.append(f"    hasWeights: {analysis.total > 0},")
        lines.append("    hasLocalePayload: true,")
        lines.append("    hasCategoryPayload: true,")
        lines.append(f"    processedBytes: Number({json.dumps(str(analysis.processed_bytes))}),")
        lines.append(f"    maxBytes: Number({json.dumps(str(analysis.max_bytes))}),")
        lines.append("  }],")
    lines.append("]) as Record<LocaleCode, LocaleWeightManifest>;")
    return "\n".join(lines) + "\n"


def write_outputs(output_dir: Path, rows: list[LetterRow]) -> None:
    """Write frequency analysis outputs to TSV and TypeScript files."""
    output_dir.mkdir(parents=True, exist_ok=True)

    frequencies_path = output_dir / "frequencies.tsv"
    frequencies_lines = ["LETTER\tRELATIVE_FREQUENCY\tCOUNT"]
    frequencies_lines.extend(f"{row.letter}\t{row.frequency:.8f}\t{row.count}" for row in rows)
    frequencies_path.write_text("\n".join(frequencies_lines) + "\n", encoding="utf-8")

    weights_path = output_dir / "letter_weights.ts"
    weights_lines = ["export const LETTER_WEIGHTS: Record<string, number> = {"]
    weights_lines.extend(f"  {row.letter}: {row.frequency:.8f}," for row in sorted(rows, key=lambda r: r.letter))
    weights_lines.append("};")
    weights_path.write_text("\n".join(weights_lines) + "\n", encoding="utf-8")


def write_locale_outputs(  # noqa: PLR0913 # Allow 7 parameters
    output_dir: Path,
    locale: str,
    rows: list[LetterRow],
    *,
    total: int,
    source_count: int,
    processed_bytes: int | None = None,
    max_bytes: int | None = None,
) -> None:
    """Write locale-specific outputs and a summary manifest."""
    locale_output_dir = output_dir / locale
    write_outputs(locale_output_dir, rows)

    manifest_path = output_dir / "locale-manifest.json"
    manifest = load_manifest(manifest_path)
    manifest[locale] = {
        "locale": locale,
        "sourceCount": source_count,
        "total": total,
        "hasWeights": total > 0,
        "hasLocalePayload": True,
        "hasCategoryPayload": True,
    }
    if processed_bytes is not None:
        manifest[locale]["processedBytes"] = processed_bytes
    if max_bytes is not None:
        manifest[locale]["maxBytes"] = max_bytes
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_locale_weight_source(
    output_path: Path,
    analyses: dict[str, LocaleAnalysis],
) -> None:
    """Write the committed TypeScript source module for locale weights."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(render_locale_weight_source(analyses), encoding="utf-8")


def load_manifest(manifest_path: Path) -> dict[str, LocaleManifestEntry]:
    """Load the locale completeness manifest if it already exists."""
    if not manifest_path.exists():
        return {}
    try:
        raw = manifest_path.read_text(encoding="utf-8")
        return cast("dict[str, LocaleManifestEntry]", json.loads(raw) if raw else {})
    except OSError, json.JSONDecodeError:
        logger.warning("Failed to load manifest from %s; starting with empty manifest.", manifest_path)
        return {}


def configure_logging(*, verbose: bool, debug_hf: bool = False) -> None:
    """Configure logging for CLI execution only."""
    logging.basicConfig(level=logging.WARNING, format="%(levelname)s: %(message)s")
    logger.setLevel(logging.DEBUG if verbose else logging.INFO)
    if not debug_hf:
        for noisy_logger in NOISY_LOGGERS:
            logging.getLogger(noisy_logger).setLevel(logging.WARNING)


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Derive letter frequencies from Wikitext or locale assets.",
    )
    parser.add_argument(
        "--mode",
        choices=["wikitext", "locales"],
        default="wikitext",
        help="Choose Wikitext corpora or locale asset files as the source text.",
    )
    parser.add_argument(
        "--large",
        action="store_true",
        help="Download Wikitext-103 (540 MB) instead of default Wikitext-2 (13 MB).",
    )
    parser.add_argument(
        "--output-dir",
        default=Path(__file__).resolve().parent / "data",
        type=Path,
        help="Directory for recreated local artifacts.",
    )
    parser.add_argument(
        "--registry-path",
        type=Path,
        default=DEFAULT_LOCALE_REGISTRY,
        help="Path to the shared locale registry JSON.",
    )
    parser.add_argument(
        "--locales",
        nargs="+",
        default=None,
        help="Locale codes to process in --mode locales (defaults to registry locales).",
    )
    parser.add_argument(
        "--max-bytes",
        type=int,
        default=DEFAULT_MAX_BYTES,
        help="Maximum text bytes to process per locale in --mode locales (0 disables the cap).",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print selected dataset and output path without downloading anything.",
    )
    parser.add_argument(
        "--debug-hf",
        action="store_true",
        help="Show HuggingFace / datasets library log output (suppressed by default).",
    )
    parser.add_argument(
        "--hf-token",
        default=os.environ.get("HF_TOKEN"),
        metavar="TOKEN",
        help="HuggingFace API token (defaults to $HF_TOKEN env var). Enables higher rate limits.",
    )
    args = parser.parse_args()
    args.locales = args.locales or supported_locales(args.registry_path)
    args.locales = [loc for item in args.locales for loc in item.split(",") if loc]
    return args


def main() -> None:
    """Derive letter frequencies from Wikitext datasets or locale corpora."""
    args = parse_args()
    configure_logging(verbose=args.verbose, debug_hf=args.debug_hf)
    if args.mode == "wikitext":
        config_name = LARGE_DATASET if args.large else DEFAULT_DATASET
        size_note = " (large, ~540 MB)" if args.large else " (small, ~13 MB)"
        dataset_output_dir = args.output_dir / config_name

        if args.dry_run:
            logger.info("Dry run only. No download will be performed.")
            logger.info("Selected dataset: %s%s", config_name, size_note)
            logger.info("Output directory: %s", dataset_output_dir)
            return

        try:
            rows, total = analyze_texts(iter_dataset_texts("Salesforce/wikitext", config_name, hf_token=args.hf_token))
        except (OSError, ConnectionError) as error:
            logger.exception(
                "Dataset loading failed for %s. Check internet access or local Hugging Face cache.",
                config_name,
            )
            raise SystemExit(1) from error

        write_outputs(dataset_output_dir, rows)

        logger.info("[%s%s] wrote outputs to %s", config_name, size_note, dataset_output_dir)
        logger.info("Processed %d word-initial letters.", total)
        logger.info("Top 10 letters:")
        for letter, frequency, count in rows[:10]:
            logger.info("  %s\t%.8f\t%d", letter, frequency, count)
        return

    validate_requested_locales(args.locales, args.registry_path)
    logger.info("Processing locale corpora for: %s", ", ".join(args.locales))
    if args.dry_run:
        logger.info("Dry run only. No files will be written.")
        logger.info("Source dataset: %s", WIKIPEDIA_DATASET)
        logger.info("Dataset date: %s", WIKIPEDIA_DATASET_DATE)
        logger.info(
            "Byte cap: %s",
            "unlimited" if args.max_bytes <= 0 else f"{args.max_bytes:,} bytes",
        )
        logger.info("Output directory: %s", args.output_dir)
        return

    analyses: dict[str, LocaleAnalysis] = {}
    for locale in args.locales:
        analysis = analyze_wikipedia_locale(
            locale,
            hf_token=args.hf_token,
            max_bytes=args.max_bytes,
            registry_path=args.registry_path,
        )
        analyses[locale] = analysis
        write_locale_outputs(
            args.output_dir,
            locale,
            analysis.rows,
            total=analysis.total,
            source_count=analysis.source_count,
            processed_bytes=analysis.processed_bytes,
            max_bytes=analysis.max_bytes,
        )
        logger.info("[%s] wrote outputs to %s/%s", locale, args.output_dir, locale)
        logger.info(
            "Processed %d word-initial letters from %d strings (%s bytes).",
            analysis.total,
            analysis.source_count,
            analysis.processed_bytes,
        )
        logger.info("Top 10 letters:")
        for letter, frequency, count in analysis.rows[:10]:
            logger.info("  %s\t%.8f\t%d", letter, frequency, count)

    write_locale_weight_source(DEFAULT_SOURCE_OUTPUT, analyses)
    logger.info("Wrote committed locale weights to %s", DEFAULT_SOURCE_OUTPUT)


if __name__ == "__main__":
    main()
