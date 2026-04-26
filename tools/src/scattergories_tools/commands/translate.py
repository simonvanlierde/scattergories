"""Translation CLI commands."""

from pathlib import Path  # noqa: TC003 - annotations may be evaluated by CLI tooling.
from typing import TYPE_CHECKING, Annotated

import typer

from scattergories_tools.commands.options import false_default
from scattergories_tools.shared.context import create_context
from scattergories_tools.translate.cache import open_translation_cache
from scattergories_tools.translate.engine import build_provider
from scattergories_tools.translate.parse import (
    JSONValue,
    load_category_names,
    load_locale_payload,
    render_json,
    translate_categories,
    translate_locale_payload,
)

if TYPE_CHECKING:
    from collections.abc import Mapping

app = typer.Typer(help="Translation commands")


def write_translation_outputs(
    output_paths: dict[str, Path],
    payloads: Mapping[str, Mapping[str, JSONValue] | Mapping[str, str]],
) -> None:
    """Write JSON payloads to disk."""
    for locale, output_path in output_paths.items():
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(render_json(dict(payloads[locale])), encoding="utf-8")


@app.command("categories")
def categories(
    target_locales: Annotated[list[str], typer.Option(..., help="Target locales.")],
    provider: Annotated[str, typer.Option(help="Translation provider.")] = "argos",
    from_locale: Annotated[str, typer.Option(help="Source locale.")] = "en",
    *,
    write_app_files: bool = typer.Option(
        false_default(), help="Write src/i18n/locales/categories.<locale>.json."
    ),
) -> None:
    """Translate canonical category names."""
    context = create_context()
    selected_locales = context.registry.validate_locales(target_locales)
    category_names = load_category_names(context.paths.categories_source_path)
    provider_instance = build_provider(provider)

    output_paths = {
        locale: context.paths.locale_dir / f"categories.{locale}.json"
        for locale in selected_locales
    }
    translations: dict[str, dict[str, str]] = {}
    with open_translation_cache(context.paths.translation_cache_path) as cache:
        for locale in selected_locales:
            translations[locale] = translate_categories(
                category_names,
                from_locale=from_locale,
                to_locale=locale,
                translate_text=provider_instance.translate,
                cache=cache,
            )

    for locale in selected_locales:
        typer.echo(f"[{locale}] translated {len(translations[locale])} categories")
        sample_items = list(translations[locale].items())[:3]
        for source, translated in sample_items:
            typer.echo(f"  {source} -> {translated}")

    if write_app_files:
        write_translation_outputs(output_paths, translations)
        for locale in selected_locales:
            typer.echo(f"Wrote {output_paths[locale]}")
    else:
        typer.echo("Preview only. Re-run with --write-app-files to update app locale files.")


@app.command("locales")
def locales(
    target_locales: Annotated[list[str], typer.Option(..., help="Target locales.")],
    provider: Annotated[str, typer.Option(help="Translation provider.")] = "argos",
    from_locale: Annotated[str, typer.Option(help="Source locale.")] = "en",
    *,
    write_app_files: bool = typer.Option(
        false_default(), help="Write src/i18n/locales/<locale>.json."
    ),
) -> None:
    """Translate the English locale payload into target locale files."""
    context = create_context()
    selected_locales = context.registry.validate_locales(target_locales)
    source_payload = load_locale_payload(context.paths.locale_payload_source_path)
    provider_instance = build_provider(provider)

    output_paths = {
        locale: context.paths.locale_dir / f"{locale}.json" for locale in selected_locales
    }
    translated_payloads: dict[str, dict[str, JSONValue]] = {}
    with open_translation_cache(context.paths.translation_cache_path) as cache:
        for locale in selected_locales:
            translated_payloads[locale] = translate_locale_payload(
                source_payload,
                from_locale=from_locale,
                to_locale=locale,
                translate_text=provider_instance.translate,
                cache=cache,
            )

    for locale in selected_locales:
        typer.echo(
            f"[{locale}] translated locale payload with "
            f"{len(translated_payloads[locale])} top-level keys"
        )

    if write_app_files:
        write_translation_outputs(output_paths, translated_payloads)
        for locale in selected_locales:
            typer.echo(f"Wrote {output_paths[locale]}")
    else:
        typer.echo("Preview only. Re-run with --write-app-files to update app locale files.")
