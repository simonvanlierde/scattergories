"""Letter-weight CLI commands."""

from pathlib import Path  # noqa: TC003 - Typer evaluates command annotations at runtime.
from typing import Annotated

import typer

from scattergories_tools.commands.options import false_default
from scattergories_tools.shared.context import create_context
from scattergories_tools.shared.registry import LocaleRegistry, parse_locale_args
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

app = typer.Typer(help="Letter-weight commands")


def resolve_locales(raw_locales: list[str] | None, registry: LocaleRegistry) -> list[str]:
    """Resolve CLI locale args."""
    return parse_locale_args(raw_locales, registry)


def print_rows_summary(rows: list[LetterRow], *, label: str) -> None:
    """Print the first few rows from an analysis result."""
    typer.echo(label)
    for row in rows[:5]:
        typer.echo(f"  {row.letter}: {row.frequency:.8f} ({row.count})")


@app.command("sample")
def sample(
    dataset: Annotated[str, typer.Option(help="Sample dataset key.")] = "wikitext-2",
    hf_token: Annotated[str | None, typer.Option(help="Optional Hugging Face token.")] = None,
    out_dir: Annotated[
        Path | None, typer.Option(help="Ephemeral output directory under tools/out/.")
    ] = None,
    *,
    write: bool = typer.Option(false_default(), help="Write output under tools/out/."),
) -> None:
    """Analyze a Wikitext corpus and optionally write ephemeral artifacts."""
    context = create_context()
    if dataset not in SAMPLE_DATASETS:
        msg = f"Unsupported dataset: {dataset}"
        raise typer.BadParameter(msg)

    analysis = analyze_sample_dataset(dataset, hf_token=hf_token)
    typer.echo(f"Dataset: {analysis.dataset_config}")
    typer.echo(f"Total initials: {analysis.total}")
    print_rows_summary(analysis.rows, label="Top letters:")

    if write:
        base_dir = out_dir or (context.paths.out_dir / "weights")
        frequencies_path, weights_path = write_sample_output(base_dir, analysis)
        typer.echo(f"Wrote {frequencies_path}")
        typer.echo(f"Wrote {weights_path}")
    else:
        typer.echo("Preview only. Re-run with --write to save output under tools/out/.")
        typer.echo(render_frequencies_tsv(analysis.rows[:5]).strip())


@app.command("locales")
def locales(
    locales_arg: Annotated[
        list[str] | None, typer.Option("--locales", help="Locale codes.")
    ] = None,
    max_bytes: Annotated[int, typer.Option(help="Byte cap per locale.")] = DEFAULT_MAX_BYTES,
    hf_token: Annotated[str | None, typer.Option(help="Optional Hugging Face token.")] = None,
    *,
    write_app_file: bool = typer.Option(
        false_default(), help="Write src/i18n/__generated__/letterWeights.ts."
    ),
) -> None:
    """Analyze locale corpora and optionally update the app weight file."""
    context = create_context()
    selected_locales = resolve_locales(locales_arg, context.registry)
    analyses = {
        locale: analyze_locale(
            locale, registry=context.registry, hf_token=hf_token, max_bytes=max_bytes
        )
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
        output_path = write_locale_app_file(context.paths.generated_weights_path, analyses)
        typer.echo(f"Wrote {output_path}")
    else:
        typer.echo("Preview only. Re-run with --write-app-file to update the app artifact.")
