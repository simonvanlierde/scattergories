"""Translation CLI commands."""

import json
from pathlib import Path  # noqa: TC003 - annotations may be evaluated by CLI tooling.
from typing import TYPE_CHECKING, Annotated

import typer

from scattergories_tools.shared.context import create_context
from scattergories_tools.shared.registry import split_locale_csv
from scattergories_tools.translate.cache import open_translation_cache
from scattergories_tools.translate.engine import ArgosProvider
from scattergories_tools.translate.parse import (
    JSONValue,
    load_category_names,
    load_locale_payload,
    translate_categories,
    translate_locale_payload,
)

if TYPE_CHECKING:
    from collections.abc import Callable, Mapping

    from scattergories_tools.shared.context import AppContext

type TranslationSource = list[str] | dict[str, JSONValue]
type TranslationResult = dict[str, str] | dict[str, JSONValue]

app = typer.Typer(help="Translation commands")


def write_translation_outputs(
    output_paths: dict[str, Path],
    payloads: Mapping[str, Mapping[str, JSONValue] | Mapping[str, str]],
) -> None:
    """Write JSON payloads to disk."""
    for locale, output_path in output_paths.items():
        output_path.parent.mkdir(parents=True, exist_ok=True)
        rendered = json.dumps(dict(payloads[locale]), indent=2, ensure_ascii=False) + "\n"
        output_path.write_text(rendered, encoding="utf-8")


def _run_translation(  # noqa: PLR0913 - cohesive per-command hooks for one shared flow.
    *,
    target_locales: str,
    from_locale: str,
    write_app_files: bool,
    load_source: Callable[[AppContext], TranslationSource],
    translate_fn: Callable[..., TranslationResult],
    output_name: Callable[[str], str],
    summarize: Callable[[str, TranslationResult], None],
) -> None:
    """Shared translate flow for the category and locale commands."""
    context = create_context()
    selected_locales = context.registry.validate_locales(split_locale_csv(target_locales))
    source = load_source(context)
    provider_instance = ArgosProvider()

    output_paths = {
        locale: context.paths.locale_dir / output_name(locale) for locale in selected_locales
    }
    results: dict[str, TranslationResult] = {}
    with open_translation_cache(context.paths.translation_cache_path) as cache:
        for locale in selected_locales:
            results[locale] = translate_fn(
                source,
                from_locale=from_locale,
                to_locale=locale,
                translate_text=provider_instance.translate,
                cache=cache,
            )

    for locale in selected_locales:
        summarize(locale, results[locale])

    if write_app_files:
        write_translation_outputs(output_paths, results)
        for locale in selected_locales:
            typer.echo(f"Wrote {output_paths[locale]}")
    else:
        typer.echo("Preview only. Re-run with --write-app-files to update app locale files.")


def _summarize_categories(locale: str, result: TranslationResult) -> None:
    typer.echo(f"[{locale}] translated {len(result)} categories")
    for source, translated in list(result.items())[:3]:
        typer.echo(f"  {source} -> {translated}")


def _summarize_locale(locale: str, result: TranslationResult) -> None:
    typer.echo(f"[{locale}] translated locale payload with {len(result)} top-level keys")


@app.command("categories")
def categories(
    target_locales: Annotated[str, typer.Option(..., help="Comma-separated target locales.")],
    from_locale: Annotated[str, typer.Option(help="Source locale.")] = "en",
    *,
    write_app_files: Annotated[
        bool, typer.Option(help="Write src/i18n/locales/categories.<locale>.json.")
    ] = False,
) -> None:
    """Translate canonical category names."""
    _run_translation(
        target_locales=target_locales,
        from_locale=from_locale,
        write_app_files=write_app_files,
        load_source=lambda context: load_category_names(context.paths.categories_source_path),
        translate_fn=translate_categories,
        output_name=lambda locale: f"categories.{locale}.json",
        summarize=_summarize_categories,
    )


@app.command("locales")
def locales(
    target_locales: Annotated[str, typer.Option(..., help="Comma-separated target locales.")],
    from_locale: Annotated[str, typer.Option(help="Source locale.")] = "en",
    *,
    write_app_files: Annotated[
        bool, typer.Option(help="Write src/i18n/locales/<locale>.json.")
    ] = False,
) -> None:
    """Translate the English locale payload into target locale files."""
    _run_translation(
        target_locales=target_locales,
        from_locale=from_locale,
        write_app_files=write_app_files,
        load_source=lambda context: load_locale_payload(context.paths.locale_payload_source_path),
        translate_fn=translate_locale_payload,
        output_name=lambda locale: f"{locale}.json",
        summarize=_summarize_locale,
    )
