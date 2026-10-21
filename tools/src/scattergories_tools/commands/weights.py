"""Letter-weight CLI commands."""

from pathlib import Path  # noqa: TC003 - Typer evaluates command annotations at runtime.
from typing import Annotated

import typer

from scattergories_tools.shared.context import Deps
from scattergories_tools.shared.registry import parse_locale_args
from scattergories_tools.weights.analyze import (
    DEFAULT_MAX_BYTES,
    SAMPLE_DATASETS,
    WIKIPEDIA_DATASET,
    WIKIPEDIA_DATASET_DATE,
    LetterRow,
)
from scattergories_tools.weights.provenance import (
    check_metadata,
    metadata_path_for,
    write_metadata,
)
from scattergories_tools.weights.render import (
    render_frequencies_tsv,
    write_locale_app_file,
    write_sample_output,
)

app = typer.Typer(help="Letter-weight commands")


def print_rows_summary(rows: list[LetterRow], *, label: str) -> None:
    """Print the first few rows from an analysis result."""
    typer.echo(label)
    for row in rows[:5]:
        typer.echo(f"  {row.letter}: {row.frequency:.8f} ({row.count})")


@app.command("sample")
def sample(
    ctx: typer.Context,
    dataset: Annotated[str, typer.Option(help="Sample dataset key.")] = "wikitext-2",
    hf_token: Annotated[
        str | None,
        typer.Option(
            envvar="HF_TOKEN",
            help="Hugging Face token. Prefer setting the HF_TOKEN env var over this flag.",
        ),
    ] = None,
    out_dir: Annotated[Path | None, typer.Option(help="Ephemeral output directory under tools/out/.")] = None,
    *,
    write: Annotated[bool, typer.Option(help="Write output under tools/out/.")] = False,
) -> None:
    """Analyze a Wikitext corpus and optionally write ephemeral artifacts."""
    deps = ctx.ensure_object(Deps)
    context = deps.create_context()
    if dataset not in SAMPLE_DATASETS:
        msg = f"Unsupported dataset: {dataset}"
        raise typer.BadParameter(msg)

    analysis = deps.analyze_sample_dataset(dataset, registry=context.registry, hf_token=hf_token)
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
    ctx: typer.Context,
    locales_arg: Annotated[str | None, typer.Option("--locales", help="Comma-separated locale codes.")] = None,
    max_bytes: Annotated[int, typer.Option(help="Byte cap per locale.")] = DEFAULT_MAX_BYTES,
    hf_token: Annotated[
        str | None,
        typer.Option(
            envvar="HF_TOKEN",
            help="Hugging Face token. Prefer setting the HF_TOKEN env var over this flag.",
        ),
    ] = None,
    *,
    write_app_file: Annotated[bool, typer.Option(help="Write src/i18n/__generated__/letterWeights.json.")] = False,
) -> None:
    """Analyze locale corpora and optionally update the app weight file."""
    deps = ctx.ensure_object(Deps)
    context = deps.create_context()
    selected_locales = parse_locale_args(locales_arg, context.registry)
    analyses = {
        locale: deps.analyze_locale(locale, registry=context.registry, hf_token=hf_token, max_bytes=max_bytes)
        for locale in selected_locales
    }

    typer.echo(f"Source dataset: {WIKIPEDIA_DATASET}")
    typer.echo(f"Dataset date: {WIKIPEDIA_DATASET_DATE}")
    for locale in selected_locales:
        analysis = analyses[locale]
        typer.echo(f"[{locale}] total={analysis.total} rows={analysis.source_count} bytes={analysis.processed_bytes}")
        print_rows_summary(analysis.rows, label=f"[{locale}] top letters:")

    if write_app_file:
        missing = sorted(set(context.registry.locales) - analyses.keys())
        if missing:
            msg = f"--write-app-file requires every registry locale; missing: {', '.join(missing)}"
            raise typer.BadParameter(msg)
        output_path = write_locale_app_file(context.paths.generated_weights_path, analyses)
        typer.echo(f"Wrote {output_path}")
        typer.echo(f"Wrote {write_metadata(output_path, analyses)}")
    else:
        typer.echo("Preview only. Re-run with --write-app-file to update the app artifact.")


@app.command("verify")
def verify(ctx: typer.Context) -> None:
    """Check the shipped table against its metadata and checksum. Needs no corpus access."""
    table_path = ctx.ensure_object(Deps).create_context().paths.generated_weights_path
    problems = check_metadata(table_path)
    for problem in problems:
        typer.echo(problem, err=True)
    if problems:
        typer.echo("Regenerate the table with `sg-tools weights locales --write-app-file`.", err=True)
        raise typer.Exit(1)
    typer.echo(f"OK: {table_path.name} matches {metadata_path_for(table_path).name}")
