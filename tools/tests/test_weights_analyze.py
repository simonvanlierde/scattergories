"""Tests for weight analysis and rendering helpers."""

import json

# spell-checker: ignore Árbol, Über, Łatwy, ACDET
from pathlib import Path
from typing import TYPE_CHECKING

from scattergories_tools.shared.registry import load_locale_registry
from scattergories_tools.weights.analyze import (
    DatasetStreamOptions,
    LetterRow,
    LocaleAnalysis,
    SampleAnalysis,
    analyze_locale,
    analyze_texts,
    iter_dataset_texts,
)
from scattergories_tools.weights.render import render_letter_weights_json, write_sample_output

if TYPE_CHECKING:
    import pytest

FIXTURES = Path(__file__).parent / "fixtures"


def test_analyze_texts_handles_basic_counts() -> None:
    """Counts are stable for simple ASCII input."""
    rows, total = analyze_texts(["Apple banana avocado"], "ABC")
    assert total == 3  # noqa: PLR2004
    assert rows[0].letter == "A"
    assert rows[0].count == 2  # noqa: PLR2004


def test_analyze_texts_counts_each_distinct_word_once() -> None:
    """Repeated words, in any case and across texts, count once."""
    rows, total = analyze_texts(["The cat and the dog", "THE end, the end"], "ACDET")
    assert total == 5  # noqa: PLR2004
    assert {row.letter: row.count for row in rows} == dict.fromkeys("ACDET", 1)


def test_analyze_texts_normalizes_accented_initials() -> None:
    """Diacritics are folded into the provided alphabet when possible."""
    rows, total = analyze_texts(["Árbol Über"], "AU")
    assert total == 2  # noqa: PLR2004
    assert rows[0] == LetterRow("A", 0.5, 1)
    assert rows[1] == LetterRow("U", 0.5, 1)


def test_analyze_texts_folds_stroked_latin_initials() -> None:
    """Stroked letters (Ł) NFKD cannot decompose still count toward their base letter."""
    rows, total = analyze_texts(["Łatwy"], "ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    letter_row = next(row for row in rows if row.letter == "L")
    assert total == 1
    assert letter_row.count == 1


def test_analyze_texts_returns_zero_frequency_rows_when_no_letters_match() -> None:
    """An empty match set still renders the whole alphabet."""
    rows, total = analyze_texts(["123 !!!"], "ABC")
    assert total == 0
    assert rows == [
        LetterRow("A", 0.0, 0),
        LetterRow("B", 0.0, 0),
        LetterRow("C", 0.0, 0),
    ]


def test_iter_dataset_texts_skips_invalid_rows(monkeypatch: pytest.MonkeyPatch) -> None:
    """Only stripped string rows are yielded."""
    rows: list[dict[str, str | None]] = [{"text": " hello "}, {"text": None}, {"text": " "}]

    def load_dataset_stub(*_args: object, **_kwargs: object) -> list[dict[str, str | None]]:
        return rows

    def tqdm_stub(items: object, **_kwargs: object) -> object:
        return items

    monkeypatch.setattr("scattergories_tools.weights.analyze.load_dataset", load_dataset_stub)
    monkeypatch.setattr("scattergories_tools.weights.analyze.tqdm", tqdm_stub)

    texts = list(
        iter_dataset_texts(
            "Salesforce/wikitext",
            "wikitext-2-raw-v1",
            DatasetStreamOptions(split_names=("train",), hf_token=None),
        )
    )

    assert texts == ["hello"]


def test_iter_dataset_texts_tracks_stats_and_respects_byte_cap(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Byte caps stop iteration before overrun and keep stats in sync."""
    splits = {
        "train": [{"text": "ab"}, {"text": "cde"}],
        "validation": [{"text": "ignored"}],
    }

    def load_dataset_stub(
        _dataset_name: object,
        _config_name: object,
        *,
        split: str,
        token: object,
        streaming: object,
    ) -> list[dict[str, str]]:
        del token, streaming
        return splits[split]

    def tqdm_stub(items: object, **_kwargs: object) -> object:
        return items

    monkeypatch.setattr("scattergories_tools.weights.analyze.load_dataset", load_dataset_stub)
    monkeypatch.setattr("scattergories_tools.weights.analyze.tqdm", tqdm_stub)

    stats = {"row_count": 0, "processed_bytes": 0}
    texts = list(
        iter_dataset_texts(
            "dataset",
            "config",
            DatasetStreamOptions(
                split_names=("train", "validation"),
                hf_token="token",  # noqa: S106
                max_bytes=4,
            ),
            stats=stats,
        )
    )

    assert texts == ["ab"]
    assert stats == {"row_count": 1, "processed_bytes": 2}


def test_analyze_locale_uses_registry_letters(monkeypatch: pytest.MonkeyPatch) -> None:
    """Locale analysis respects the locale alphabet."""
    registry = load_locale_registry(FIXTURES / "registry.json")
    rows: list[dict[str, str]] = [{"text": "Α"}, {"text": "Β"}]  # noqa: RUF001 # Greek letters

    def load_dataset_stub(*_args: object, **_kwargs: object) -> list[dict[str, str]]:
        return rows

    def tqdm_stub(items: object, **_kwargs: object) -> object:
        return items

    monkeypatch.setattr("scattergories_tools.weights.analyze.load_dataset", load_dataset_stub)
    monkeypatch.setattr("scattergories_tools.weights.analyze.tqdm", tqdm_stub)

    analysis = analyze_locale("el", registry=registry, hf_token=None, max_bytes=2)

    alpha_row = next(row for row in analysis.rows if row.letter == "Α")  # noqa: RUF001 # Greek letter alpha, not A
    assert analysis.total == 1
    assert alpha_row.count == 1


def test_render_letter_weights_json_is_sorted_and_byte_stable() -> None:
    """The JSON table sorts locales and letters and prints weights the way Biome does."""
    analyses = {
        "es": LocaleAnalysis("es", [LetterRow("B", 0.1, 1), LetterRow("A", 0.9, 9)], 10, 1, 10, 20),
        "en": LocaleAnalysis(
            "en",
            [LetterRow("\u0391", 1 / 3, 1), LetterRow("B", 0.0, 0), LetterRow("A", 1.0, 2)],
            3,
            2,
            12,
            20,
        ),
    }
    source = render_letter_weights_json(analyses)

    assert source == (
        "{\n"
        '  "en": {\n'
        '    "A": 1.0,\n'
        '    "B": 0.0,\n'
        '    "\\u0391": 0.33333333\n'
        "  },\n"
        '  "es": {\n'
        '    "A": 0.9,\n'
        '    "B": 0.1\n'
        "  }\n"
        "}\n"
    )
    assert json.loads(source) == {
        "en": {"A": 1.0, "B": 0.0, "\u0391": 0.33333333},
        "es": {"A": 0.9, "B": 0.1},
    }
    assert render_letter_weights_json(dict(reversed(analyses.items()))) == source


def test_write_sample_output_writes_ephemeral_files(tmp_path: Path) -> None:
    """Sample outputs are written under the requested directory."""
    analysis = SampleAnalysis("wikitext-2", "wikitext-2-raw-v1", [LetterRow("A", 1.0, 1)], 1)
    frequencies_path, weights_path = write_sample_output(tmp_path, analysis)
    assert frequencies_path.exists()
    assert weights_path.exists()
