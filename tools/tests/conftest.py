"""Shared fixtures and builders for the tools test suite."""

import json
from typing import TYPE_CHECKING, Protocol, cast

import pytest
from typer.testing import CliRunner

from scattergories_tools.shared.paths import RepoPaths
from scattergories_tools.shared.registry import LocaleRegistry, load_locale_registry
from scattergories_tools.weights.analyze import LetterRow, LocaleAnalysis, SampleAnalysis
from tests.fakes import FakeProviderFactory, FakeTranslationProvider

if TYPE_CHECKING:
    from collections.abc import Callable
    from pathlib import Path

type RegistryPayload = dict[str, str | list[str] | dict[str, str]]


class RegistryFixture(Protocol):
    """Typed helper that writes and loads a registry payload."""

    def __call__(self, payload: RegistryPayload | None = None) -> LocaleRegistry: ...  # noqa: D102 # Simple override of the full registry fixture interface


@pytest.fixture
def runner() -> CliRunner:
    """Return a Typer CLI test runner."""
    return CliRunner()


@pytest.fixture
def registry_payload() -> Callable[..., RegistryPayload]:
    """Build registry payloads for JSON fixtures."""

    def build(
        *,
        fallback_locale: str = "en",
        locales: tuple[str, ...] = ("en", "es", "el"),
        letters_by_locale: dict[str, str] | None = None,
        native_names: dict[str, str] | None = None,
    ) -> RegistryPayload:
        return {
            "fallbackLocale": fallback_locale,
            "locales": list(locales),
            "lettersByLocale": letters_by_locale or {"en": "ABC", "es": "ABC", "el": "ΑΒΓ"},
            "nativeNames": native_names or {"en": "English", "es": "Español", "el": "Ελληνικά"},
        }

    return build


@pytest.fixture
def write_registry(
    tmp_path: Path,
    registry_payload: Callable[..., RegistryPayload],
) -> RegistryFixture:
    """Write a registry file and load it as a typed helper."""

    def write(payload: RegistryPayload | None = None) -> LocaleRegistry:
        registry_path = tmp_path / "registry.json"
        registry_path.write_text(
            json.dumps(payload or registry_payload(), ensure_ascii=False),
            encoding="utf-8",
        )
        return load_locale_registry(registry_path)

    return write


@pytest.fixture
def repo_context(
    tmp_path: Path,
    registry_payload: Callable[..., RegistryPayload],
) -> tuple[RepoPaths, LocaleRegistry]:
    """Create a temporary repo layout for CLI tests."""
    repo_root = tmp_path / "repo"
    tools_root = repo_root / "tools"
    cache_dir = tools_root / ".cache"
    out_dir = tools_root / "out"
    locale_dir = repo_root / "src" / "i18n" / "locales"
    generated_dir = repo_root / "src" / "i18n" / "__generated__"

    cache_dir.mkdir(parents=True)
    out_dir.mkdir(parents=True)
    locale_dir.mkdir(parents=True)
    generated_dir.mkdir(parents=True)

    registry_path = locale_dir / "registry.json"
    registry_path.write_text(
        json.dumps(registry_payload(), ensure_ascii=False),
        encoding="utf-8",
    )
    (locale_dir / "categories.en.json").write_text(
        json.dumps({"Animals": "Animals", "Foods": "Foods"}, ensure_ascii=False),
        encoding="utf-8",
    )
    (locale_dir / "en.json").write_text(
        json.dumps(
            {"title": "Play", "roundCounter": "Round {{current}} of {{total}}"},
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    paths = RepoPaths(
        repo_root=repo_root,
        tools_root=tools_root,
        cache_dir=cache_dir,
        out_dir=out_dir,
        registry_path=registry_path,
        generated_weights_path=generated_dir / "letterWeights.ts",
        locale_dir=locale_dir,
        categories_source_path=locale_dir / "categories.en.json",
        locale_payload_source_path=locale_dir / "en.json",
        translation_cache_path=cache_dir / "translation.sqlite3",
    )
    return paths, load_locale_registry(registry_path)


@pytest.fixture
def fake_provider_factory() -> FakeProviderFactory:
    """Build fake translation providers with optional overrides."""

    def build(
        translations: dict[tuple[str, str, str], str] | None = None,
    ) -> FakeTranslationProvider:
        return FakeTranslationProvider(translations=translations or {})

    return build


@pytest.fixture
def sample_analysis_builder() -> Callable[..., SampleAnalysis]:
    """Build sample analyses with sensible defaults."""

    def coerce_rows(rows: object) -> list[LetterRow]:
        if isinstance(rows, list) and all(isinstance(row, LetterRow) for row in rows):
            return cast("list[LetterRow]", rows)
        return [LetterRow("A", 1.0, 1)]

    def build(**overrides: object) -> SampleAnalysis:
        dataset_key = overrides.get("dataset_key", "wikitext-2")
        dataset_config = overrides.get("dataset_config", "wikitext-2-raw-v1")
        rows = overrides.get("rows")
        total = overrides.get("total")
        sample_rows = coerce_rows(rows)
        return SampleAnalysis(
            dataset_key=dataset_key if isinstance(dataset_key, str) else "wikitext-2",
            dataset_config=(
                dataset_config if isinstance(dataset_config, str) else "wikitext-2-raw-v1"
            ),
            rows=sample_rows,
            total=total if isinstance(total, int) else sum(row.count for row in sample_rows),
        )

    return build


@pytest.fixture
def locale_analysis_builder() -> Callable[..., LocaleAnalysis]:
    """Build locale analyses with sensible defaults."""

    def coerce_rows(rows: object) -> list[LetterRow]:
        if isinstance(rows, list) and all(isinstance(row, LetterRow) for row in rows):
            return cast("list[LetterRow]", rows)
        return [LetterRow("A", 1.0, 1)]

    def build(**overrides: object) -> LocaleAnalysis:
        locale = overrides.get("locale", "en")
        rows = overrides.get("rows")
        total = overrides.get("total")
        source_count = overrides.get("source_count", 1)
        processed_bytes = overrides.get("processed_bytes", 1)
        max_bytes = overrides.get("max_bytes", 10)
        analysis_rows = coerce_rows(rows)
        return LocaleAnalysis(
            locale=locale if isinstance(locale, str) else "en",
            rows=analysis_rows,
            total=total if isinstance(total, int) else sum(row.count for row in analysis_rows),
            source_count=source_count if isinstance(source_count, int) else 1,
            processed_bytes=processed_bytes if isinstance(processed_bytes, int) else 1,
            max_bytes=max_bytes if isinstance(max_bytes, int) else 10,
        )

    return build
