"""Behavior tests for weight-generation CLI commands."""

from typing import TYPE_CHECKING

from scattergories_tools import cli
from scattergories_tools.commands import weights
from scattergories_tools.shared.context import AppContext
from scattergories_tools.weights.analyze import LetterRow, LocaleAnalysis, SampleAnalysis

if TYPE_CHECKING:
    from collections.abc import Callable

    import pytest
    from typer.testing import CliRunner

    from scattergories_tools.shared.paths import RepoPaths
    from scattergories_tools.shared.registry import LocaleRegistry


def _build_sample_analysis(
    sample_analysis_builder: Callable[..., SampleAnalysis],
    dataset: str,
) -> SampleAnalysis:
    return sample_analysis_builder(
        dataset_key=dataset,
        rows=[LetterRow("A", 1.0, 1)],
        total=1,
    )


def _build_locale_analysis(
    locale_analysis_builder: Callable[..., LocaleAnalysis],
    locale: str,
    max_bytes: int,
) -> LocaleAnalysis:
    return locale_analysis_builder(
        locale=locale,
        rows=[LetterRow("A", 0.75, 3), LetterRow("B", 0.25, 1)],
        total=4,
        source_count=2,
        processed_bytes=8,
        max_bytes=max_bytes,
    )


def _resolve_two_locales(_locales: object, _registry: object) -> list[str]:
    return ["en", "es"]


def test_weights_sample_preview(
    runner: CliRunner,
    repo_context: tuple[RepoPaths, LocaleRegistry],
    sample_analysis_builder: Callable[..., SampleAnalysis],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Preview mode prints a stable sample summary without writes."""
    paths, registry = repo_context
    monkeypatch.setattr(weights, "create_context", lambda: AppContext(paths, registry))

    def analyze_sample_dataset(dataset: str, *, hf_token: str | None = None) -> SampleAnalysis:
        del hf_token
        return _build_sample_analysis(sample_analysis_builder, dataset)

    monkeypatch.setattr(weights, "analyze_sample_dataset", analyze_sample_dataset)

    result = runner.invoke(cli.app, ["weights", "sample"])

    assert result.exit_code == 0
    assert "Dataset: wikitext-2-raw-v1" in result.stdout
    assert "Preview only" in result.stdout


def test_weights_sample_rejects_unsupported_dataset(
    runner: CliRunner,
    repo_context: tuple[RepoPaths, LocaleRegistry],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Unknown datasets fail fast before analysis begins."""
    paths, registry = repo_context
    monkeypatch.setattr(weights, "create_context", lambda: AppContext(paths, registry))

    result = runner.invoke(cli.app, ["weights", "sample", "--dataset", "unknown"])

    assert result.exit_code == 2  # noqa: PLR2004
    assert str(result.exception) == "2"


def test_weights_sample_write_persists_ephemeral_outputs(
    runner: CliRunner,
    repo_context: tuple[RepoPaths, LocaleRegistry],
    sample_analysis_builder: Callable[..., SampleAnalysis],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Write mode stores TSV and TypeScript outputs under the requested directory."""
    paths, registry = repo_context
    monkeypatch.setattr(weights, "create_context", lambda: AppContext(paths, registry))

    def analyze_sample_dataset(dataset: str, *, hf_token: str | None = None) -> SampleAnalysis:
        del hf_token
        return _build_sample_analysis(sample_analysis_builder, dataset)

    monkeypatch.setattr(weights, "analyze_sample_dataset", analyze_sample_dataset)

    result = runner.invoke(cli.app, ["weights", "sample", "--write"])

    output_dir = paths.out_dir / "weights" / "wikitext-2"
    assert result.exit_code == 0
    assert (output_dir / "frequencies.tsv").exists()
    assert (output_dir / "letter_weights.ts").exists()
    assert "Wrote" in result.stdout


def test_weights_locales_preview_supports_multiple_locales(
    runner: CliRunner,
    repo_context: tuple[RepoPaths, LocaleRegistry],
    locale_analysis_builder: Callable[..., LocaleAnalysis],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Preview mode reports one summary block per selected locale."""
    paths, registry = repo_context
    monkeypatch.setattr(weights, "create_context", lambda: AppContext(paths, registry))
    monkeypatch.setattr(weights, "resolve_locales", _resolve_two_locales)

    def analyze_locale(
        locale: str,
        *,
        registry: LocaleRegistry,
        hf_token: str | None,
        max_bytes: int,
    ) -> LocaleAnalysis:
        del registry, hf_token
        return _build_locale_analysis(locale_analysis_builder, locale, max_bytes)

    monkeypatch.setattr(weights, "analyze_locale", analyze_locale)

    result = runner.invoke(cli.app, ["weights", "locales", "--locales", "en", "--locales", "es"])

    assert result.exit_code == 0
    assert f"Source dataset: {weights.WIKIPEDIA_DATASET}" in result.stdout
    assert "[en] total=4 rows=2 bytes=8" in result.stdout
    assert "[es] total=4 rows=2 bytes=8" in result.stdout
    assert "Preview only" in result.stdout


def test_weights_locales_write_updates_generated_app_file(
    runner: CliRunner,
    repo_context: tuple[RepoPaths, LocaleRegistry],
    locale_analysis_builder: Callable[..., LocaleAnalysis],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Write mode updates the generated letter-weight artifact."""
    paths, registry = repo_context
    monkeypatch.setattr(weights, "create_context", lambda: AppContext(paths, registry))
    monkeypatch.setattr(weights, "resolve_locales", _resolve_two_locales)

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
            rows=[LetterRow("A", 1.0, 1), LetterRow("B", 0.0, 0)],
            total=1,
            source_count=1,
            processed_bytes=1,
            max_bytes=max_bytes,
        )

    monkeypatch.setattr(weights, "analyze_locale", analyze_locale)

    result = runner.invoke(
        cli.app,
        ["weights", "locales", "--locales", "en", "--locales", "es", "--write-app-file"],
    )

    rendered = paths.generated_weights_path.read_text(encoding="utf-8")
    assert result.exit_code == 0
    assert paths.generated_weights_path.exists()
    assert '"en"' in rendered
    assert '"es"' in rendered
