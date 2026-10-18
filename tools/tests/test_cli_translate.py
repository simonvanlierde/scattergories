"""Behavior tests for translation CLI commands."""
# spell-checker: ignore Listo

import json
from dataclasses import replace
from typing import TYPE_CHECKING

from scattergories_tools import cli

if TYPE_CHECKING:
    from typer.testing import CliRunner

    from scattergories_tools.shared.context import Deps
    from scattergories_tools.shared.paths import RepoPaths
    from scattergories_tools.shared.registry import LocaleRegistry

    from .fakes import FakeProviderFactory


def test_translate_categories_preview_uses_fake_provider(
    runner: CliRunner,
    repo_context: tuple[RepoPaths, LocaleRegistry],
    fake_provider_factory: FakeProviderFactory,
    deps: Deps,
) -> None:
    """Preview mode shows translated category samples without writing files."""
    paths, _ = repo_context
    provider = fake_provider_factory({("en", "es", "Animals"): "Animales"})
    cli_deps = replace(deps, translator=lambda: provider.translate)

    result = runner.invoke(
        cli.app,
        obj=cli_deps,
        args=["translate", "categories", "--target-locales", "es"],
    )

    assert result.exit_code == 0
    assert "[es] translated 2 categories" in result.stdout
    assert "Animals -> Animales" in result.stdout
    assert "Preview only" in result.stdout
    assert not (paths.locale_dir / "categories.es.json").exists()
    assert provider.calls == [("en", "es", "Animals"), ("en", "es", "Foods")]


def test_translate_categories_accepts_comma_separated_locales(
    runner: CliRunner,
    fake_provider_factory: FakeProviderFactory,
    deps: Deps,
) -> None:
    """A single comma-separated value expands into multiple target locales."""
    provider = fake_provider_factory()
    cli_deps = replace(deps, translator=lambda: provider.translate)

    result = runner.invoke(
        cli.app,
        obj=cli_deps,
        args=["translate", "categories", "--target-locales", "es,el"],
    )

    assert result.exit_code == 0
    assert "[es] translated 2 categories" in result.stdout
    assert "[el] translated 2 categories" in result.stdout


def test_translate_categories_write_updates_app_files(
    runner: CliRunner,
    repo_context: tuple[RepoPaths, LocaleRegistry],
    fake_provider_factory: FakeProviderFactory,
    deps: Deps,
) -> None:
    """Write mode persists translated category JSON files."""
    paths, _ = repo_context
    provider = fake_provider_factory(
        {
            ("en", "es", "Animals"): "Animales",
            ("en", "es", "Foods"): "Comidas",
        }
    )
    cli_deps = replace(deps, translator=lambda: provider.translate)

    result = runner.invoke(
        cli.app,
        obj=cli_deps,
        args=["translate", "categories", "--target-locales", "es", "--write-app-files"],
    )

    output_path = paths.locale_dir / "categories.es.json"
    assert result.exit_code == 0
    assert f"Wrote {output_path}" in result.stdout
    assert json.loads(output_path.read_text(encoding="utf-8")) == {
        "Animals": "Animales",
        "Foods": "Comidas",
    }


def test_translate_locales_preview_preserves_non_string_values(
    runner: CliRunner,
    repo_context: tuple[RepoPaths, LocaleRegistry],
    fake_provider_factory: FakeProviderFactory,
    deps: Deps,
) -> None:
    """Preview mode translates string leaves and leaves structure intact."""
    paths, _ = repo_context
    paths.locale_payload_source_path.write_text(
        json.dumps(
            {
                "title": "Play",
                "count": 3,
                "items": ["Ready", {"nested": "Go {{value}}"}],
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    provider = fake_provider_factory(
        {
            ("en", "es", "Play"): "Jugar",
            ("en", "es", "Ready"): "Listo",
            ("en", "es", "Go __PH_0__"): "Ir __PH_0__",
        }
    )
    cli_deps = replace(deps, translator=lambda: provider.translate)

    result = runner.invoke(
        cli.app,
        obj=cli_deps,
        args=["translate", "locales", "--target-locales", "es"],
    )

    assert result.exit_code == 0
    assert "[es] translated locale payload with 3 top-level keys" in result.stdout
    assert "Preview only" in result.stdout
    assert not (paths.locale_dir / "es.json").exists()


def test_translate_locales_write_updates_app_files(
    runner: CliRunner,
    repo_context: tuple[RepoPaths, LocaleRegistry],
    fake_provider_factory: FakeProviderFactory,
    deps: Deps,
) -> None:
    """Write mode persists translated locale JSON files."""
    paths, _ = repo_context
    provider = fake_provider_factory(
        {
            ("en", "es", "Play"): "Jugar",
            ("en", "es", "Round __PH_0__ of __PH_1__"): "Ronda __PH_0__ de __PH_1__",
        }
    )
    cli_deps = replace(deps, translator=lambda: provider.translate)

    result = runner.invoke(
        cli.app,
        obj=cli_deps,
        args=["translate", "locales", "--target-locales", "es", "--write-app-files"],
    )

    output_path = paths.locale_dir / "es.json"
    assert result.exit_code == 0
    assert f"Wrote {output_path}" in result.stdout
    assert json.loads(output_path.read_text(encoding="utf-8")) == {
        "title": "Jugar",
        "roundCounter": "Ronda {{current}} de {{total}}",
    }
