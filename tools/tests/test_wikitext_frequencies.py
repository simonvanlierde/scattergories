"""Tests for wikitext_frequencies module."""

from pathlib import Path
from unittest.mock import patch

from letter_frequency.wikitext_frequencies import (
    WORD_INITIAL_RE,
    LetterRow,
    analyze_texts,
    parse_args,
    write_outputs,
)

FIRST_LETTER = "A"
SECOND_LETTER = "B"

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
