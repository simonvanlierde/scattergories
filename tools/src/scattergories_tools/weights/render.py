"""Renderers and writers for weight outputs."""

import json
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from pathlib import Path

    from scattergories_tools.weights.analyze import LetterRow, LocaleAnalysis, SampleAnalysis


def render_frequencies_tsv(rows: list[LetterRow]) -> str:
    """Render rows as a TSV string."""
    lines = ["LETTER\tRELATIVE_FREQUENCY\tCOUNT"]
    lines.extend(f"{row.letter}\t{row.frequency:.8f}\t{row.count}" for row in rows)
    return "\n".join(lines) + "\n"


def render_letter_weights_module(rows: list[LetterRow]) -> str:
    """Render one alphabet table as a small TypeScript module."""
    lines = ["export const LETTER_WEIGHTS: Record<string, number> = {"]
    lines.extend(
        f"  {row.letter}: {row.frequency:.8f}," for row in sorted(rows, key=lambda row: row.letter)
    )
    lines.append("};")
    return "\n".join(lines) + "\n"


def _format_weight(value: float) -> str:
    # Eight decimals without trailing zeros, the way Biome prints JSON numbers, so the
    # formatter never rewrites the generated file.
    text = f"{value:.8f}".rstrip("0")
    return f"{text}0" if text.endswith(".") else text


def render_letter_weights_json(analyses: dict[str, LocaleAnalysis]) -> str:
    """Render the app's letter-weight table as JSON: locale to letter to weight, keys sorted."""
    locales = []
    for locale, analysis in sorted(analyses.items()):
        letters = ",\n".join(
            f"    {json.dumps(row.letter)}: {_format_weight(row.frequency)}"
            for row in sorted(analysis.rows, key=lambda row: row.letter)
        )
        locales.append(f"  {json.dumps(locale)}: {{\n{letters}\n  }}")
    return "{\n" + ",\n".join(locales) + "\n}\n"


def write_sample_output(base_dir: Path, analysis: SampleAnalysis) -> tuple[Path, Path]:
    """Write sample dataset artifacts under an ephemeral output directory."""
    output_dir = base_dir / analysis.dataset_key
    output_dir.mkdir(parents=True, exist_ok=True)
    frequencies_path = output_dir / "frequencies.tsv"
    weights_path = output_dir / "letter_weights.ts"
    frequencies_path.write_text(render_frequencies_tsv(analysis.rows), encoding="utf-8")
    weights_path.write_text(render_letter_weights_module(analysis.rows), encoding="utf-8")
    return frequencies_path, weights_path


def write_locale_app_file(output_path: Path, analyses: dict[str, LocaleAnalysis]) -> Path:
    """Write the app-consumed locale weights file."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(render_letter_weights_json(analyses), encoding="utf-8")
    return output_path
