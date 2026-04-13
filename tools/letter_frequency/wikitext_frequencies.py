#!/usr/bin/env python3
"""Derive first-letter frequencies from Wikitext corpora for Scattergories weights."""

import argparse
import logging
import re
from collections import Counter
from pathlib import Path
from typing import TYPE_CHECKING, NamedTuple

from datasets import load_dataset

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


class LetterRow(NamedTuple):
    """One row of the letter-frequency table."""

    letter: str
    frequency: float
    count: int


def iter_dataset_texts(config_name: str) -> Iterator[str]:
    """Iterate over non-empty text rows from every Wikitext split."""
    for split_name in DATASET_SPLITS:
        split = load_dataset("Salesforce/wikitext", config_name, split=split_name)
        for row in split:
            if not isinstance(row, dict):
                continue
            text = row.get("text")
            if isinstance(text, str) and (stripped := text.strip()):
                yield stripped


def analyze_texts(texts: Iterable[str]) -> tuple[list[LetterRow], int]:
    """Analyze texts and return (sorted rows, total) of letter frequencies."""
    counts: Counter[str] = Counter()
    total = 0

    for text in texts:
        for match in WORD_INITIAL_RE.finditer(text):
            counts[match.group(0).lower()] += 1
            total += 1

    rows = [
        LetterRow(letter, (counts[letter.lower()] / total) if total else 0.0, counts[letter.lower()])
        for letter in ALPHABET
    ]
    rows.sort(key=lambda row: row.frequency, reverse=True)
    return rows, total


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


def configure_logging(*, verbose: bool) -> None:
    """Configure logging for CLI execution only."""
    logging.basicConfig(level=logging.WARNING, format="%(levelname)s: %(message)s")
    logger.setLevel(logging.DEBUG if verbose else logging.INFO)
    for noisy_logger in NOISY_LOGGERS:
        logging.getLogger(noisy_logger).setLevel(logging.WARNING)


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Derive letter frequencies from Wikitext-2 (13 MB) by default. "
        "Use --large for Wikitext-103 (540 MB).",
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
        "--verbose",
        action="store_true",
        help="Enable verbose logging.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print selected dataset and output path without downloading anything.",
    )
    return parser.parse_args()


def main() -> None:
    """Download and analyze Wikitext dataset (default: wikitext-2)."""
    args = parse_args()
    configure_logging(verbose=args.verbose)
    config_name = LARGE_DATASET if args.large else DEFAULT_DATASET
    size_note = " (large, ~540 MB)" if args.large else " (small, ~13 MB)"
    dataset_output_dir = args.output_dir / config_name

    if args.dry_run:
        logger.info("Dry run only. No download will be performed.")
        logger.info("Selected dataset: %s%s", config_name, size_note)
        logger.info("Output directory: %s", dataset_output_dir)
        return

    try:
        rows, total = analyze_texts(iter_dataset_texts(config_name))
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


if __name__ == "__main__":
    main()
