"""Streaming corpus analysis for letter weights."""

import unicodedata
from collections import Counter
from dataclasses import dataclass
from typing import TYPE_CHECKING

from datasets import load_dataset
from tqdm.auto import tqdm

if TYPE_CHECKING:
    from collections.abc import Iterable, Iterator

    from scattergories_tools.shared.registry import LocaleRegistry

ALPHABET = tuple("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
DEFAULT_MAX_BYTES = 150_000_000
WIKIPEDIA_DATASET = "wikimedia/wikipedia"
WIKIPEDIA_DATASET_DATE = "20231101"
DATASET_SPLITS = ("train", "validation", "test")
SAMPLE_DATASETS = {
    "wikitext-2": "wikitext-2-raw-v1",
    "wikitext-103": "wikitext-103-raw-v1",
}


@dataclass(frozen=True)
class LetterRow:
    """One row in a rendered letter-weight table."""

    letter: str
    frequency: float
    count: int


@dataclass(frozen=True)
class LocaleAnalysis:
    """Locale analysis result with metadata for rendering."""

    locale: str
    rows: list[LetterRow]
    total: int
    source_count: int
    processed_bytes: int
    max_bytes: int


@dataclass(frozen=True)
class SampleAnalysis:
    """Sample dataset analysis with metadata."""

    dataset_key: str
    dataset_config: str
    rows: list[LetterRow]
    total: int


@dataclass(frozen=True)
class DatasetStreamOptions:
    """Options for streaming rows from a dataset."""

    split_names: tuple[str, ...]
    hf_token: str | None
    max_bytes: int | None = None


def iter_word_initials(text: str) -> Iterator[str]:
    """Yield the first letter of each word using Unicode-aware scanning."""
    previous_was_letter = False
    for char in text:
        is_letter = char.isalpha()
        if is_letter and not previous_was_letter:
            yield char
        previous_was_letter = is_letter


def normalize_initial(letter: str, alphabet_set: set[str]) -> str | None:
    """Fold a Unicode initial to a locale-specific alphabet symbol when possible."""
    normalized = unicodedata.normalize("NFKD", letter)
    for char in normalized:
        if unicodedata.category(char) == "Mn":
            continue
        upper = char.upper()
        if upper in alphabet_set:
            return upper
    return None


def analyze_texts(texts: Iterable[str], alphabet: Iterable[str]) -> tuple[list[LetterRow], int]:
    """Analyze texts and return rows sorted by descending frequency."""
    alphabet_list = list(alphabet)
    alphabet_set = set(alphabet_list)
    counts: Counter[str] = Counter()
    total = 0

    for text in texts:
        for initial in iter_word_initials(text):
            normalized = normalize_initial(initial, alphabet_set)
            if normalized is None:
                continue
            counts[normalized] += 1
            total += 1

    rows = [
        LetterRow(
            letter=letter,
            frequency=(counts[letter] / total) if total else 0.0,
            count=counts[letter],
        )
        for letter in alphabet_list
    ]
    rows.sort(key=lambda row: (-row.frequency, row.letter))
    return rows, total


def iter_dataset_texts(
    dataset_name: str,
    config_name: str,
    options: DatasetStreamOptions,
    stats: dict[str, int] | None = None,
) -> Iterator[str]:
    """Iterate over non-empty text rows from a streaming Hugging Face dataset."""
    processed_bytes = 0
    state = stats if stats is not None else {}
    state.setdefault("row_count", 0)
    state.setdefault("processed_bytes", 0)

    for split_name in options.split_names:
        split = load_dataset(
            dataset_name,
            config_name,
            split=split_name,
            token=options.hf_token,
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
            if (
                options.max_bytes is not None
                and options.max_bytes > 0
                and processed_bytes + encoded_length > options.max_bytes
            ):
                return

            processed_bytes += encoded_length
            state["row_count"] += 1
            state["processed_bytes"] = processed_bytes
            yield stripped


def analyze_sample_dataset(dataset_key: str, *, hf_token: str | None) -> SampleAnalysis:
    """Analyze one sample Wikitext corpus."""
    config_name = SAMPLE_DATASETS[dataset_key]
    rows, total = analyze_texts(
        iter_dataset_texts(
            "Salesforce/wikitext",
            config_name,
            DatasetStreamOptions(split_names=DATASET_SPLITS, hf_token=hf_token),
        ),
        ALPHABET,
    )
    return SampleAnalysis(
        dataset_key=dataset_key, dataset_config=config_name, rows=rows, total=total
    )


def analyze_locale(
    locale: str, *, registry: LocaleRegistry, hf_token: str | None, max_bytes: int
) -> LocaleAnalysis:
    """Analyze one locale using a capped Wikipedia stream."""
    stats: dict[str, int] = {"row_count": 0, "processed_bytes": 0}
    rows, total = analyze_texts(
        iter_dataset_texts(
            WIKIPEDIA_DATASET,
            f"{WIKIPEDIA_DATASET_DATE}.{locale}",
            DatasetStreamOptions(split_names=("train",), hf_token=hf_token, max_bytes=max_bytes),
            stats=stats,
        ),
        registry.get_letters(locale),
    )
    return LocaleAnalysis(
        locale=locale,
        rows=rows,
        total=total,
        source_count=stats["row_count"],
        processed_bytes=stats["processed_bytes"],
        max_bytes=max_bytes,
    )
