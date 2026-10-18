"""Behavior tests for weight-generation CLI commands."""

import json
from dataclasses import replace
from typing import TYPE_CHECKING

from scattergories_tools import cli
from scattergories_tools.weights.analyze import WIKIPEDIA_DATASET, LetterRow

if TYPE_CHECKING:
    from collections.abc import Callable

    from typer.testing import CliRunner

    from scattergories_tools.shared.context import Deps
    from scattergories_tools.shared.paths import RepoPaths
    from scattergories_tools.shared.registry import LocaleRegistry
    from scattergories_tools.weights.analyze import LocaleAnalysis, SampleAnalysis


def _sample_deps(
    deps: Deps,
    sample_analysis_builder: Callable[..., SampleAnalysis],
) -> Deps:
    def analyze_sample_dataset(
        dataset: str, *, registry: LocaleRegistry, hf_token: str | None
    ) -> SampleAnalysis:
        del registry, hf_token
        return sample_analysis_builder(dataset_key=dataset, rows=[LetterRow("A", 1.0, 1)], total=1)

    return replace(deps, analyze_sample_dataset=analyze_sample_dataset)


def _locale_deps(
    deps: Deps,
    locale_analysis_builder: Callable[..., LocaleAnalysis],
    rows: list[LetterRow],
) -> Deps:
    def analyze_locale(
        locale: str,
        *,
        registry: LocaleRegistry,
        hf_token: str | None,
        max_bytes: int,
    ) -> LocaleAnalysis:
        del registry, hf_token
        return locale_analysis_builder(
            locale=locale,
            rows=rows,
            total=sum(row.count for row in rows),
            source_count=2,
            processed_bytes=8,
            max_bytes=max_bytes,
        )

    return replace(deps, analyze_locale=analyze_locale)


def test_weights_sample_preview(
    runner: CliRunner,
    deps: Deps,
    sample_analysis_builder: Callable[..., SampleAnalysis],
) -> None:
    """Preview mode prints a stable sample summary without writes."""
    result = runner.invoke(
        cli.app, ["weights", "sample"], obj=_sample_deps(deps, sample_analysis_builder)
    )

    assert result.exit_code == 0
    assert "Dataset: wikitext-2-raw-v1" in result.stdout
    assert "Preview only" in result.stdout


def test_weights_sample_rejects_unsupported_dataset(runner: CliRunner, deps: Deps) -> None:
    """Unknown datasets fail fast before analysis begins."""
    result = runner.invoke(cli.app, ["weights", "sample", "--dataset", "unknown"], obj=deps)

    assert result.exit_code == 2  # noqa: PLR2004
    assert str(result.exception) == "2"


def test_weights_sample_write_persists_ephemeral_outputs(
    runner: CliRunner,
    repo_context: tuple[RepoPaths, LocaleRegistry],
    deps: Deps,
    sample_analysis_builder: Callable[..., SampleAnalysis],
) -> None:
    """Write mode stores TSV and TypeScript outputs under the requested directory."""
    paths, _ = repo_context
    cli_deps = _sample_deps(deps, sample_analysis_builder)

    result = runner.invoke(cli.app, ["weights", "sample", "--write"], obj=cli_deps)

    output_dir = paths.out_dir / "weights" / "wikitext-2"
    assert result.exit_code == 0
    assert (output_dir / "frequencies.tsv").exists()
    assert (output_dir / "letter_weights.ts").exists()
    assert "Wrote" in result.stdout


def test_weights_locales_preview_supports_multiple_locales(
    runner: CliRunner,
    deps: Deps,
    locale_analysis_builder: Callable[..., LocaleAnalysis],
) -> None:
    """Preview mode reports one summary block per selected locale."""
    cli_deps = _locale_deps(
        deps, locale_analysis_builder, [LetterRow("A", 0.75, 3), LetterRow("B", 0.25, 1)]
    )

    result = runner.invoke(cli.app, ["weights", "locales", "--locales", "en,es"], obj=cli_deps)

    assert result.exit_code == 0
    assert f"Source dataset: {WIKIPEDIA_DATASET}" in result.stdout
    assert "[en] total=4 rows=2 bytes=8" in result.stdout
    assert "[es] total=4 rows=2 bytes=8" in result.stdout
    assert "Preview only" in result.stdout


def test_weights_locales_write_updates_generated_app_file(
    runner: CliRunner,
    repo_context: tuple[RepoPaths, LocaleRegistry],
    deps: Deps,
    locale_analysis_builder: Callable[..., LocaleAnalysis],
) -> None:
    """Write mode updates the generated letter-weight artifact."""
    paths, _ = repo_context
    cli_deps = _locale_deps(
        deps, locale_analysis_builder, [LetterRow("A", 1.0, 1), LetterRow("B", 0.0, 0)]
    )

    result = runner.invoke(
        cli.app,
        ["weights", "locales", "--locales", "en,es,el", "--write-app-file"],
        obj=cli_deps,
    )

    rendered = paths.generated_weights_path.read_text(encoding="utf-8")
    assert result.exit_code == 0
    assert json.loads(rendered) == {locale: {"A": 1.0, "B": 0.0} for locale in ("el", "en", "es")}


def test_weights_locales_write_rejects_partial_locale_set(
    runner: CliRunner,
    repo_context: tuple[RepoPaths, LocaleRegistry],
    deps: Deps,
    locale_analysis_builder: Callable[..., LocaleAnalysis],
) -> None:
    """A partial --write-app-file refuses rather than dropping registry locales."""
    paths, _ = repo_context
    cli_deps = _locale_deps(
        deps, locale_analysis_builder, [LetterRow("A", 0.75, 3), LetterRow("B", 0.25, 1)]
    )

    result = runner.invoke(
        cli.app,
        ["weights", "locales", "--locales", "en,es", "--write-app-file"],
        obj=cli_deps,
    )

    assert result.exit_code == 2  # noqa: PLR2004
    assert not paths.generated_weights_path.exists()
