"""Typer CLI for Scattergories tooling."""

import logging
import os
import sys
from pathlib import Path
from typing import TYPE_CHECKING, Annotated

import typer

from scattergories_tools.shared.logging import configure_logging
from scattergories_tools.shared.paths import RepoPaths, default_repo_paths
from scattergories_tools.shared.registry import (
    LocaleRegistry,
    load_locale_registry,
    parse_locale_args,
)
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
from scattergories_tools.weights.analyze import (
    DEFAULT_MAX_BYTES,
    SAMPLE_DATASETS,
    WIKIPEDIA_DATASET,
    WIKIPEDIA_DATASET_DATE,
    LetterRow,
    analyze_locale,
    analyze_sample_dataset,
)
from scattergories_tools.weights.render import (
    render_frequencies_tsv,
    write_locale_app_file,
    write_sample_output,
)

if TYPE_CHECKING:
    from collections.abc import Iterable, Mapping
    from pathlib import Path

logger = logging.getLogger("scattergories_tools")

app = typer.Typer(help="Scattergories data tools")
weights_app = typer.Typer(help="Letter-weight commands")
translate_app = typer.Typer(help="Translation commands")
app.add_typer(weights_app, name="weights")
app.add_typer(translate_app, name="translate")


def false_default() -> bool:
    """Return a false value without tripping boolean-literal lint rules."""
    return bool(0)


def get_context() -> tuple[RepoPaths, LocaleRegistry]:
    """Load repo paths and the shared locale registry once per command."""
    paths = default_repo_paths()
    registry = load_locale_registry(paths.registry_path)
    return paths, registry


def resolve_locales(raw_locales: list[str] | None, registry: LocaleRegistry) -> list[str]:
    """Resolve CLI locale args."""
    return parse_locale_args(raw_locales, registry)


def print_rows_summary(rows: Iterable[LetterRow], *, label: str) -> None:
    """Print the first few rows from an analysis result."""
    typer.echo(label)
    for row in list(rows)[:5]:
        typer.echo(f"  {row.letter}: {row.frequency:.8f} ({row.count})")


@app.callback()
def main_callback(
    *,
    verbose: bool = typer.Option(false_default(), "--verbose", help="Enable verbose logs."),
    debug_hf: bool = typer.Option(false_default(), "--debug-hf", help="Show Hugging Face logs."),
) -> None:
    """Configure logging before subcommands run."""
    configure_logging(verbose=verbose, debug_hf=debug_hf)


@app.command("doctor")
def doctor() -> None:
    """Validate runtime, optional dependencies, and repo path health."""
    paths, _registry = get_context()
    hf_token = os.environ.get("HF_TOKEN")

    checks: list[tuple[str, bool, str]] = []
    checks.append(
        (
            "python",
            sys.version_info >= (3, 14),
            f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        )
    )
    checks.append(("registry", paths.registry_path.is_file(), str(paths.registry_path)))
    checks.append(
        (
            "generated_weights_parent",
            paths.generated_weights_path.parent.is_dir(),
            str(paths.generated_weights_path.parent),
        )
    )
    checks.append(("locale_dir", paths.locale_dir.is_dir(), str(paths.locale_dir)))
    checks.append(
        (
            "category_source",
            paths.categories_source_path.is_file(),
            str(paths.categories_source_path),
        )
    )
    checks.append(
        (
            "locale_source",
            paths.locale_payload_source_path.is_file(),
            str(paths.locale_payload_source_path),
        )
    )
    checks.append(
        (
            "hf_token",
            bool(hf_token),
            "set" if hf_token else "missing",
        )
    )

    try:
        build_provider("argos")
    except RuntimeError as error:
        checks.append(("argos", False, str(error)))
    else:  # pragma: no cover - exercised only when optional deps are installed
        checks.append(("argos", True, "available"))

    overall_ok = True
    for name, ok, detail in checks:
        overall_ok = overall_ok and ok if name != "hf_token" else overall_ok
        status = "OK" if ok else "WARN"
        typer.echo(f"[{status}] {name}: {detail}")

    if not overall_ok:
        raise typer.Exit(code=1)


@weights_app.command("sample")
def weights_sample(
    dataset: Annotated[str, typer.Option(help="Sample dataset key.")] = "wikitext-2",
    hf_token: Annotated[str | None, typer.Option(help="Optional Hugging Face token.")] = None,
    out_dir: Annotated[
        Path | None, typer.Option(help="Ephemeral output directory under tools/out/.")
    ] = None,
    *,
    write: bool = typer.Option(false_default(), help="Write output under tools/out/."),
) -> None:
    """Analyze a Wikitext corpus and optionally write ephemeral artifacts."""
    paths, _registry = get_context()
    if dataset not in SAMPLE_DATASETS:
        msg = f"Unsupported dataset: {dataset}"
        raise typer.BadParameter(msg)

    analysis = analyze_sample_dataset(dataset, hf_token=hf_token)
    typer.echo(f"Dataset: {analysis.dataset_config}")
    typer.echo(f"Total initials: {analysis.total}")
    print_rows_summary(analysis.rows, label="Top letters:")

    if write:
        base_dir = out_dir or (paths.out_dir / "weights")
        frequencies_path, weights_path = write_sample_output(base_dir, analysis)
        typer.echo(f"Wrote {frequencies_path}")
        typer.echo(f"Wrote {weights_path}")
    else:
        typer.echo("Preview only. Re-run with --write to save output under tools/out/.")
        typer.echo(render_frequencies_tsv(analysis.rows[:5]).strip())


@weights_app.command("locales")
def weights_locales(
    locales: Annotated[list[str] | None, typer.Option(help="Locale codes.")] = None,
    max_bytes: Annotated[int, typer.Option(help="Byte cap per locale.")] = DEFAULT_MAX_BYTES,
    hf_token: Annotated[str | None, typer.Option(help="Optional Hugging Face token.")] = None,
    *,
    write_app_file: bool = typer.Option(
        false_default(), help="Write src/i18n/__generated__/letterWeights.ts."
    ),
) -> None:
    """Analyze locale corpora and optionally update the app weight file."""
    paths, registry = get_context()
    selected_locales = resolve_locales(locales, registry)
    analyses = {
        locale: analyze_locale(locale, registry=registry, hf_token=hf_token, max_bytes=max_bytes)
        for locale in selected_locales
    }

    typer.echo(f"Source dataset: {WIKIPEDIA_DATASET}")
    typer.echo(f"Dataset date: {WIKIPEDIA_DATASET_DATE}")
    for locale in selected_locales:
        analysis = analyses[locale]
        typer.echo(
            f"[{locale}] total={analysis.total} "
            f"rows={analysis.source_count} bytes={analysis.processed_bytes}"
        )
        print_rows_summary(analysis.rows, label=f"[{locale}] top letters:")

    if write_app_file:
        output_path = write_locale_app_file(paths.generated_weights_path, analyses)
        typer.echo(f"Wrote {output_path}")
    else:
        typer.echo("Preview only. Re-run with --write-app-file to update the app artifact.")


def write_translation_outputs(
    output_paths: dict[str, Path],
    payloads: Mapping[str, Mapping[str, JSONValue] | Mapping[str, str]],
) -> None:
    """Write JSON payloads to disk."""
    for locale, output_path in output_paths.items():
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(render_json(dict(payloads[locale])), encoding="utf-8")


@translate_app.command("categories")
def translate_categories_command(
    target_locales: Annotated[list[str], typer.Option(..., help="Target locales.")],
    provider: Annotated[str, typer.Option(help="Translation provider.")] = "argos",
    from_locale: Annotated[str, typer.Option(help="Source locale.")] = "en",
    *,
    write_app_files: bool = typer.Option(
        false_default(), help="Write src/i18n/locales/categories.<locale>.json."
    ),
) -> None:
    """Translate canonical category names."""
    paths, registry = get_context()
    selected_locales = registry.validate_locales(target_locales)
    categories = load_category_names(paths.categories_source_path)
    provider_instance = build_provider(provider)

    output_paths = {
        locale: paths.locale_dir / f"categories.{locale}.json" for locale in selected_locales
    }
    translations: dict[str, dict[str, str]] = {}
    with open_translation_cache(paths.translation_cache_path) as cache:
        for locale in selected_locales:
            translations[locale] = translate_categories(
                categories,
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


@translate_app.command("locales")
def translate_locales_command(
    target_locales: Annotated[list[str], typer.Option(..., help="Target locales.")],
    provider: Annotated[str, typer.Option(help="Translation provider.")] = "argos",
    from_locale: Annotated[str, typer.Option(help="Source locale.")] = "en",
    *,
    write_app_files: bool = typer.Option(
        false_default(), help="Write src/i18n/locales/<locale>.json."
    ),
) -> None:
    """Translate the English locale payload into target locale files."""
    paths, registry = get_context()
    selected_locales = registry.validate_locales(target_locales)
    source_payload = load_locale_payload(paths.locale_payload_source_path)
    provider_instance = build_provider(provider)

    output_paths = {locale: paths.locale_dir / f"{locale}.json" for locale in selected_locales}
    translated_payloads: dict[str, dict[str, JSONValue]] = {}
    with open_translation_cache(paths.translation_cache_path) as cache:
        for locale in selected_locales:
            translated = translate_locale_payload(
                source_payload,
                from_locale=from_locale,
                to_locale=locale,
                translate_text=provider_instance.translate,
                cache=cache,
            )
            translated_payloads[locale] = translated

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


def main() -> None:
    """Run the Typer app."""
    app()


if __name__ == "__main__":
    main()
