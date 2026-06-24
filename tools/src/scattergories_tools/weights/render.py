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


def _render_letter_weight_entries(rows: list[LetterRow]) -> str:
    return "\n".join(
        f"      [{json.dumps(row.letter)}, {row.frequency:.8f}],"
        for row in sorted(rows, key=lambda row: row.letter)
    )


def _render_locale_manifest_entries(analyses: dict[str, LocaleAnalysis]) -> str:
    return "\n".join(
        "\n".join(
            [
                f"  [{json.dumps(locale)}, {{",
                f"    locale: {json.dumps(locale)} as LocaleCode,",
                f"    sourceCount: {analysis.source_count},",
                f"    total: {analysis.total},",
                f"    hasWeights: {analysis.total > 0},",
                "    hasLocalePayload: true,",
                "    hasCategoryPayload: true,",
                f"    processedBytes: {analysis.processed_bytes},",
                f"    maxBytes: {analysis.max_bytes},",
                "  }],",
            ]
        )
        for locale, analysis in sorted(analyses.items())
    )


def render_locale_weight_source(analyses: dict[str, LocaleAnalysis]) -> str:
    """Render the committed locale weight module used by the app."""
    letter_weights_lines = "\n".join(
        "\n".join(
            [
                f"  [{json.dumps(locale)}, Object.fromEntries([",
                _render_letter_weight_entries(analysis.rows),
                "    ])],",
            ]
        )
        for locale, analysis in sorted(analyses.items())
    )
    manifest_entries = _render_locale_manifest_entries(analyses)

    return (
        "import type { LocaleCode } from '../locales/resources';\n\n"
        "export interface LocaleWeightManifest {\n"
        "  locale: LocaleCode;\n"
        "  sourceCount: number;\n"
        "  total: number;\n"
        "  hasWeights: boolean;\n"
        "  hasLocalePayload: boolean;\n"
        "  hasCategoryPayload: boolean;\n"
        "  processedBytes: number;\n"
        "  maxBytes: number;\n"
        "}\n\n"
        "export const LETTER_WEIGHTS_BY_LOCALE: Record<LocaleCode, Record<string, number>> =\n"
        "  Object.fromEntries([\n"
        f"{letter_weights_lines}\n"
        "  ]) as Record<LocaleCode, Record<string, number>>;\n\n"
        "export const LOCALE_WEIGHT_MANIFEST: Record<LocaleCode, LocaleWeightManifest> =\n"
        "  Object.fromEntries([\n"
        f"{manifest_entries}\n"
        "  ]) as Record<LocaleCode, LocaleWeightManifest>;\n"
    )


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
    output_path.write_text(render_locale_weight_source(analyses), encoding="utf-8")
    return output_path
