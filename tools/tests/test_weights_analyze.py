"""Tests for weight analysis and rendering helpers."""
# spell-checker: ignore Árbol, Über

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
from scattergories_tools.weights.render import render_locale_weight_source, write_sample_output

if TYPE_CHECKING:
    import pytest

FIXTURES = Path(__file__).parent / "fixtures"


def test_analyze_texts_handles_basic_counts() -> None:
    """Counts are stable for simple ASCII input."""
    rows, total = analyze_texts(["Apple banana apple"], "ABC")
    assert total == 3  # noqa: PLR2004
    assert rows[0].letter == "A"
    assert rows[0].count == 2  # noqa: PLR2004


def test_analyze_texts_normalizes_accented_initials() -> None:
    """Diacritics are folded into the provided alphabet when possible."""
    rows, total = analyze_texts(["Árbol Über"], "AU")
    assert total == 2  # noqa: PLR2004
    assert rows[0] == LetterRow("A", 0.5, 1)
    assert rows[1] == LetterRow("U", 0.5, 1)


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


def test_render_locale_weight_source_is_deterministic() -> None:
    """Rendered locale output sorts locales and letters deterministically."""
    source = render_locale_weight_source(
        {
            "es": LocaleAnalysis(
                "es",
                [LetterRow("B", 0.1, 1), LetterRow("A", 0.9, 9)],
                10,
                1,
                10,
                20,
            ),
            "en": LocaleAnalysis(
                "en",
                [LetterRow("B", 0.4, 4), LetterRow("A", 0.6, 6)],
                10,
                2,
                12,
                20,
            ),
        }
    )
    assert source.index('"en"') < source.index('"es"')
    assert source.index('["A", 0.60000000]') < source.index('["B", 0.40000000]')


def test_write_sample_output_writes_ephemeral_files(tmp_path: Path) -> None:
    """Sample outputs are written under the requested directory."""
    analysis = SampleAnalysis("wikitext-2", "wikitext-2-raw-v1", [LetterRow("A", 1.0, 1)], 1)
    frequencies_path, weights_path = write_sample_output(tmp_path, analysis)
    assert frequencies_path.exists()
    assert weights_path.exists()
