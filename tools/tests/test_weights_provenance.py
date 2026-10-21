"""Tests for the letter-weight table's provenance metadata and drift check."""

import json
from typing import TYPE_CHECKING

from scattergories_tools import cli
from scattergories_tools.shared.paths import default_repo_paths
from scattergories_tools.weights.analyze import LetterRow, LocaleAnalysis
from scattergories_tools.weights.provenance import (
    check_metadata,
    metadata_path_for,
    sha256_file,
    write_metadata,
)
from scattergories_tools.weights.render import write_locale_app_file

if TYPE_CHECKING:
    from pathlib import Path

    from typer.testing import CliRunner

    from scattergories_tools.shared.context import Deps
    from scattergories_tools.shared.paths import RepoPaths
    from scattergories_tools.shared.registry import LocaleRegistry


def _analysis(locale: str) -> LocaleAnalysis:
    return LocaleAnalysis(locale, [LetterRow("A", 0.75, 3), LetterRow("B", 0.25, 1)], 4, 2, 8, 100)


def _write_table(table_path: Path) -> None:
    analyses = {locale: _analysis(locale) for locale in ("en", "es")}
    write_locale_app_file(table_path, analyses)
    write_metadata(table_path, analyses)


def test_committed_table_matches_its_metadata() -> None:
    """The shipped table and its metadata agree, so drift fails locally as well as in CI."""
    assert check_metadata(default_repo_paths().generated_weights_path) == []


def test_written_metadata_records_provenance(tmp_path: Path) -> None:
    """Generating the table writes a consistent metadata file next to it."""
    table_path = tmp_path / "letterWeights.json"
    _write_table(table_path)

    meta = json.loads(metadata_path_for(table_path).read_text(encoding="utf-8"))
    assert meta["sha256"] == sha256_file(table_path)
    assert meta["corpus"]["id"] == "wikimedia/wikipedia"
    assert meta["samples"] == {locale: {"sourceCount": 2, "total": 4, "processedBytes": 8} for locale in ("en", "es")}
    assert meta["maxBytesPerLocale"] == 100  # noqa: PLR2004
    assert meta["tableVersion"] == "1.0.0"
    assert check_metadata(table_path) == []


def test_check_flags_edited_table(tmp_path: Path) -> None:
    """A changed table fails on its checksum until it is regenerated."""
    table_path = tmp_path / "letterWeights.json"
    _write_table(table_path)
    table_path.write_text(
        table_path.read_text(encoding="utf-8").replace("0.75", "0.7"),
        encoding="utf-8",
    )

    problems = check_metadata(table_path)
    assert len(problems) == 1
    assert problems[0].startswith("sha256 mismatch")

    _write_table(table_path)
    assert check_metadata(table_path) == []


def test_check_flags_metadata_that_disagrees_with_table(tmp_path: Path) -> None:
    """The locale list and version are checked against the table, not just trusted."""
    table_path = tmp_path / "letterWeights.json"
    _write_table(table_path)
    meta_path = metadata_path_for(table_path)
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    del meta["samples"]["es"]
    meta.update(tableVersion="v1")
    meta_path.write_text(json.dumps(meta), encoding="utf-8")

    problems = " | ".join(check_metadata(table_path))
    assert "locales mismatch" in problems
    assert "tableVersion" in problems


def test_check_reports_a_table_that_is_not_json(tmp_path: Path) -> None:
    """A table that does not parse is reported, not raised."""
    table_path = tmp_path / "letterWeights.json"
    _write_table(table_path)
    table_path.write_text("export {};\n", encoding="utf-8")

    assert check_metadata(table_path)[-1].startswith("table is not valid JSON")


def test_check_reports_missing_metadata(tmp_path: Path) -> None:
    """A table without metadata is a failure, not a pass."""
    table_path = tmp_path / "letterWeights.json"
    table_path.write_text("{}\n", encoding="utf-8")
    assert check_metadata(table_path) == [f"missing metadata: {metadata_path_for(table_path)}"]


def test_verify_command_exit_codes(
    runner: CliRunner,
    repo_context: tuple[RepoPaths, LocaleRegistry],
    deps: Deps,
) -> None:
    """`weights verify` exits 0 on a consistent table and 1 after drift."""
    paths, _ = repo_context
    _write_table(paths.generated_weights_path)

    assert runner.invoke(cli.app, ["weights", "verify"], obj=deps).exit_code == 0

    with paths.generated_weights_path.open("a", encoding="utf-8") as table:
        table.write("\n")
    result = runner.invoke(cli.app, ["weights", "verify"], obj=deps)
    assert result.exit_code == 1
    assert "sha256 mismatch" in result.stderr
