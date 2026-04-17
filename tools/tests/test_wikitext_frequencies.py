"""Tests for wikitext_frequencies module."""

import json
import logging
from pathlib import Path
from typing import TYPE_CHECKING
from unittest.mock import patch

if TYPE_CHECKING:
    import pytest

from letter_frequency.wikitext_frequencies import (
    NOISY_LOGGERS,
    WORD_INITIAL_RE,
    LetterRow,
    LocaleAnalysis,
    analyze_texts,
    analyze_wikipedia_locale,
    configure_logging,
    iter_dataset_texts,
    main,
    parse_args,
    render_locale_weight_source,
    supported_locales,
    write_locale_outputs,
    write_locale_weight_source,
    write_outputs,
)

FIRST_LETTER = "A"
SECOND_LETTER = "B"

# ---------------------------------------------------------------------------
# --hf-token / HF_TOKEN
# ---------------------------------------------------------------------------


def test_parse_args_hf_token_from_cli() -> None:
    """--hf-token is stored in args.hf_token."""
    with patch("sys.argv", ["prog", "--hf-token", "abc123"]):
        args = parse_args()
    assert args.hf_token == "abc123"


def test_parse_args_hf_token_defaults_to_env_var(monkeypatch: pytest.MonkeyPatch) -> None:
    """HF_TOKEN env var is used as the default when --hf-token is not supplied."""
    monkeypatch.setenv("HF_TOKEN", "env_token")
    with patch("sys.argv", ["prog"]):
        args = parse_args()
    assert args.hf_token == "env_token"


def test_parse_args_hf_token_defaults_none_when_unset(monkeypatch: pytest.MonkeyPatch) -> None:
    """args.hf_token is None when neither --hf-token nor HF_TOKEN env var is set."""
    monkeypatch.delenv("HF_TOKEN", raising=False)
    with patch("sys.argv", ["prog"]):
        args = parse_args()
    assert args.hf_token is None


def test_iter_dataset_texts_passes_token_to_load_dataset() -> None:
    """iter_dataset_texts forwards hf_token to each load_dataset call."""
    with patch("letter_frequency.wikitext_frequencies.load_dataset", return_value=[]) as mock_load:
        list(
            iter_dataset_texts(
                "Salesforce/wikitext",
                "wikitext-2-raw-v1",
                hf_token="test-token",
            )
        )
    for call in mock_load.call_args_list:
        assert call.kwargs.get("token") == "test-token"
        assert call.kwargs.get("streaming") is True


FREQUENCY_TOLERANCE = 0.001


def test_word_initial_regex() -> None:
    """Test WORD_INITIAL_RE correctly matches word-initial letters."""
    text = "Hello world, this is a test."
    matches = [m.group(0) for m in WORD_INITIAL_RE.finditer(text)]
    assert matches == ["H", "w", "t", "i", "a", "t"]


def test_word_initial_regex_case_insensitive() -> None:
    """Test WORD_INITIAL_RE works with mixed case."""
    text = "HELLO hello hElLo"
    matches = [m.group(0) for m in WORD_INITIAL_RE.finditer(text)]
    # Should match first letter of each word
    assert len(matches) == 3


def test_analyze_texts_simple() -> None:
    """Test analyze_texts with simple example."""
    texts = ["Apple banana cherry"]
    rows, total = analyze_texts(texts)

    # Should have entries for all A-Z
    assert len(rows) == 26

    # Total should be 3 (A, B, C)
    assert total == 3

    # A should be most frequent (1/3 ≈ 0.333)
    assert rows[0].letter == FIRST_LETTER
    assert abs(rows[0].frequency - (1 / 3)) < FREQUENCY_TOLERANCE


def test_analyze_texts_empty() -> None:
    """Test analyze_texts with empty texts."""
    texts: list[str] = []
    rows, total = analyze_texts(texts)

    assert total == 0
    assert len(rows) == 26
    assert all(row.frequency == 0.0 for row in rows)


def test_analyze_texts_counts() -> None:
    """Test that counts are correct."""
    texts = ["apple apple apple banana"]
    rows, total = analyze_texts(texts)

    a_row = next(r for r in rows if r.letter == FIRST_LETTER)
    b_row = next(r for r in rows if r.letter == SECOND_LETTER)

    assert a_row.count == 3  # "apple" appears 3 times
    assert b_row.count == 1  # "banana" appears 1 time
    assert total == 4


def test_analyze_texts_normalization() -> None:
    """Test that frequencies sum to approximately 1.0."""
    texts = ["The quick brown fox jumps over the lazy dog"]
    rows, _total = analyze_texts(texts)

    freq_sum = sum(row.frequency for row in rows)
    assert abs(freq_sum - 1.0) < FREQUENCY_TOLERANCE


def test_parse_args_default() -> None:
    """Test that default args select wikitext-2."""
    with patch("sys.argv", ["prog"]):
        args = parse_args()
        assert args.large is False


def test_parse_args_large_flag() -> None:
    """Test that --large flag is recognized."""
    with patch("sys.argv", ["prog", "--large"]):
        args = parse_args()
        assert args.large is True


def test_parse_args_output_dir() -> None:
    """Test that output-dir argument is accepted."""
    with patch("sys.argv", ["prog", "--output-dir", "test-output"]):
        args = parse_args()
        assert args.output_dir == Path("test-output")


def test_parse_args_verbose_flag() -> None:
    """Test that --verbose flag is recognized."""
    with patch("sys.argv", ["prog", "--verbose"]):
        args = parse_args()
        assert args.verbose is True


def test_parse_args_dry_run_flag() -> None:
    """Test that --dry-run flag is recognized."""
    with patch("sys.argv", ["prog", "--dry-run"]):
        args = parse_args()
        assert args.dry_run is True


def test_parse_args_locales_mode_and_locale_list() -> None:
    """Test that locale mode parses locale lists from the CLI."""
    with patch("sys.argv", ["prog", "--mode", "locales", "--locales", "en,fr", "de"]):
        args = parse_args()
        assert args.mode == "locales"
        assert args.locales == ["en", "fr", "de"]


def test_parse_args_max_bytes_override() -> None:
    """Test that locale byte cap can be overridden."""
    with patch("sys.argv", ["prog", "--mode", "locales", "--max-bytes", "42"]):
        args = parse_args()
        assert args.max_bytes == 42


def test_parse_args_max_bytes_default() -> None:
    """Locale mode defaults to a 150 MB byte cap."""
    with patch("sys.argv", ["prog", "--mode", "locales"]):
        args = parse_args()
        assert args.max_bytes == 150_000_000


def test_write_outputs_contract(tmp_path: Path) -> None:
    """Test that write_outputs writes expected files and does not write corpus.txt."""
    rows = [
        LetterRow("B", 0.4, 4),
        LetterRow("A", 0.6, 6),
        LetterRow("C", 0.0, 0),
    ]

    write_outputs(tmp_path, rows)

    frequencies_path = tmp_path / "frequencies.tsv"
    weights_path = tmp_path / "letter_weights.ts"
    corpus_path = tmp_path / "corpus.txt"

    assert frequencies_path.exists()
    assert weights_path.exists()
    assert not corpus_path.exists()

    frequencies_lines = frequencies_path.read_text(encoding="utf-8").splitlines()
    assert frequencies_lines[0] == "LETTER\tRELATIVE_FREQUENCY\tCOUNT"
    assert frequencies_lines[1] == "B\t0.40000000\t4"
    assert frequencies_lines[2] == "A\t0.60000000\t6"

    weights_text = weights_path.read_text(encoding="utf-8")
    assert "export const LETTER_WEIGHTS: Record<string, number> = {" in weights_text
    assert "  A: 0.60000000," in weights_text
    assert "  B: 0.40000000," in weights_text


def test_write_locale_outputs_contract(tmp_path: Path) -> None:
    """Locale output mode writes a per-locale directory and manifest entry."""
    rows = [
        LetterRow("A", 0.5, 5),
        LetterRow("B", 0.5, 5),
    ]

    write_locale_outputs(tmp_path, "en", rows, total=10, source_count=2)

    weights_path = tmp_path / "en" / "letter_weights.ts"
    manifest_path = tmp_path / "locale-manifest.json"
    assert weights_path.exists()
    assert manifest_path.exists()

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    assert manifest["en"]["locale"] == "en"
    assert manifest["en"]["total"] == 10
    assert manifest["en"]["hasWeights"] is True


def test_render_locale_weight_source_includes_manifests() -> None:
    """Generated source output should include per-locale tables and manifests."""
    analyses = {
        "en": LocaleAnalysis("en", [LetterRow("A", 0.6, 6), LetterRow("B", 0.4, 4)], 10, 2, 10, 150),
        "el": LocaleAnalysis("el", [LetterRow("Α", 1.0, 1)], 1, 1, 2, 150),  # noqa: RUF001 # Intentionally using Greek letter for test
    }

    source = render_locale_weight_source(analyses)

    assert "export const LETTER_WEIGHTS_BY_LOCALE" in source
    assert '["en", {' in source
    assert '["el", {' in source
    assert '["\\u0391", Number("1.00000000")],' in source
    assert "export interface LocaleWeightManifest" in source


def test_write_locale_weight_source(tmp_path: Path) -> None:
    """Generated source file is written to the requested path."""
    analyses = {
        "en": LocaleAnalysis("en", [LetterRow("A", 1.0, 1)], 1, 1, 1, 150),
    }

    output_path = tmp_path / "src/i18n/locales/letterWeights.generated.ts"
    write_locale_weight_source(output_path, analyses)

    assert output_path.exists()
    text = output_path.read_text(encoding="utf-8")
    assert "LETTER_WEIGHTS_BY_LOCALE" in text


# ---------------------------------------------------------------------------
# iter_dataset_texts
# ---------------------------------------------------------------------------


def test_iter_dataset_texts_skips_none_and_non_string_text() -> None:
    """None, non-string, and integer text fields must never be yielded — not even as 'None'."""
    bad_rows = [{"text": None}, {"text": 42}, {"text": True}, "not-a-dict"]
    with patch("letter_frequency.wikitext_frequencies.load_dataset", return_value=bad_rows):
        texts = list(iter_dataset_texts("Salesforce/wikitext", "wikitext-2-raw-v1"))
    assert texts == []


def test_iter_dataset_texts_skips_empty_and_whitespace_text() -> None:
    """Empty and whitespace-only text rows must not be yielded."""
    blank_rows = [{"text": ""}, {"text": "   "}, {"text": "\t\n"}]
    with patch("letter_frequency.wikitext_frequencies.load_dataset", return_value=blank_rows):
        texts = list(iter_dataset_texts("Salesforce/wikitext", "wikitext-2-raw-v1"))
    assert texts == []


def test_iter_dataset_texts_yields_stripped_text() -> None:
    """Valid text rows are yielded with leading/trailing whitespace stripped."""
    rows = [{"text": "  hello  "}, {"text": "world\n"}]
    with patch("letter_frequency.wikitext_frequencies.load_dataset", return_value=rows) as mock_load:
        texts = list(iter_dataset_texts("Salesforce/wikitext", "wikitext-2-raw-v1"))
    assert "hello" in texts
    assert "world" in texts
    assert mock_load.call_count == len(("train", "validation", "test"))


def test_analyze_wikipedia_locale_uses_locale_letters_and_byte_cap() -> None:
    """Locale analysis reads the wiki stream and respects the byte cap."""
    rows = [{"text": "Α"}, {"text": "Β"}]  # noqa: RUF001 # Intentionally using Greek letter for test
    with patch("letter_frequency.wikitext_frequencies.load_dataset", return_value=rows):
        analysis = analyze_wikipedia_locale("el", max_bytes=2)

    alpha_row = next(row for row in analysis.rows if row.letter == "Α")  # noqa: RUF001 # Intentionally using Greek letter for test
    beta_row = next(row for row in analysis.rows if row.letter == "Β")  # noqa: RUF001 # Intentionally using Greek letter for test

    assert analysis.total == 1
    assert analysis.source_count == 1
    assert alpha_row.count == 1
    assert beta_row.count == 0


def test_supported_locales_reads_registry() -> None:
    """The shared registry exposes the supported locale list."""
    locales = supported_locales()
    assert "en" in locales
    assert "fr" in locales


# ---------------------------------------------------------------------------
# configure_logging / --debug-hf
# ---------------------------------------------------------------------------


def test_parse_args_debug_hf_defaults_false() -> None:
    """--debug-hf flag defaults to False when not supplied."""
    with patch("sys.argv", ["prog"]):
        args = parse_args()
    assert args.debug_hf is False


def test_parse_args_debug_hf_flag() -> None:
    """--debug-hf flag is accepted and sets debug_hf to True."""
    with patch("sys.argv", ["prog", "--debug-hf"]):
        args = parse_args()
    assert args.debug_hf is True


def test_configure_logging_silences_noisy_loggers_by_default() -> None:
    """By default, all NOISY_LOGGERS are clamped to WARNING."""
    configure_logging(verbose=False, debug_hf=False)
    for name in NOISY_LOGGERS:
        assert logging.getLogger(name).level == logging.WARNING


def test_configure_logging_preserves_noisy_logger_levels_when_debug_hf() -> None:
    """With debug_hf=True, NOISY_LOGGERS are left at their inherited level (not forced to WARNING)."""
    # Reset any previously clamped levels so the test starts clean.
    for name in NOISY_LOGGERS:
        logging.getLogger(name).setLevel(logging.NOTSET)

    configure_logging(verbose=False, debug_hf=True)

    for name in NOISY_LOGGERS:
        assert logging.getLogger(name).level == logging.NOTSET


# ---------------------------------------------------------------------------
# main() dry-run
# ---------------------------------------------------------------------------


def test_main_dry_run_logs_dataset_and_output_path(
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Main --dry-run logs the chosen dataset name and output path without downloading."""
    monkeypatch.setattr("sys.argv", ["prog", "--dry-run"])
    with caplog.at_level(logging.INFO, logger="letter_frequency.wikitext_frequencies"):
        main()
    assert "wikitext-2-raw-v1" in caplog.text
    assert "Dry run" in caplog.text


def test_main_dry_run_large_flag(
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    """Main --dry-run --large logs the wikitext-103 dataset name."""
    monkeypatch.setattr("sys.argv", ["prog", "--dry-run", "--large"])
    with caplog.at_level(logging.INFO, logger="letter_frequency.wikitext_frequencies"):
        main()
    assert "wikitext-103-raw-v1" in caplog.text
