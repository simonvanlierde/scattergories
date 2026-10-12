"""Provenance metadata for the shipped letter-weight table.

The metadata file sits next to the table and records where the numbers came from and the
SHA-256 of the table, so CI can catch a table that changed without its metadata.
"""

import hashlib
import json
import re
import subprocess
from datetime import UTC, datetime
from importlib.metadata import version
from typing import TYPE_CHECKING

from scattergories_tools.weights.analyze import WIKIPEDIA_DATASET, WIKIPEDIA_DATASET_DATE

if TYPE_CHECKING:
    from pathlib import Path

    from scattergories_tools.weights.analyze import LocaleAnalysis

INITIAL_TABLE_VERSION = "1.0.0"
_SEMVER_RE = re.compile(r"^\d+\.\d+\.\d+$")
# Match both the generator's `locale: "en" as ...` and plain formatted output.
_LOCALE_RE = re.compile(r'\blocale:\s*"([^"]+)"')
# Biome may rewrite `maxBytes: 150000000` as `maxBytes: Number("150000000")`.
_MAX_BYTES_RE = re.compile(r'\bmaxBytes:\s*(?:Number\(")?(\d+)')


def metadata_path_for(table_path: Path) -> Path:
    """Return the metadata path that belongs to a table file."""
    return table_path.with_name(f"{table_path.stem}.meta.json")


def sha256_file(path: Path) -> str:
    """Return the hex SHA-256 of a file's bytes."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _git_commit(cwd: Path) -> str:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],  # noqa: S607 - git from PATH is the point.
            cwd=cwd,
            capture_output=True,
            text=True,
            check=True,
        )
    except OSError, subprocess.CalledProcessError:
        return "unknown"
    return result.stdout.strip()


def _write_json(path: Path, payload: dict[str, object]) -> None:
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_metadata(table_path: Path, analyses: dict[str, LocaleAnalysis]) -> Path:
    """Write fresh provenance for a just-generated table, keeping its table version."""
    meta_path = metadata_path_for(table_path)
    table_version = INITIAL_TABLE_VERSION
    if meta_path.exists():
        table_version = json.loads(meta_path.read_text(encoding="utf-8")).get(
            "tableVersion", INITIAL_TABLE_VERSION
        )
    # The CLI applies one --max-bytes to every locale.
    max_bytes = next(iter(analyses.values())).max_bytes
    payload: dict[str, object] = {
        "tableVersion": table_version,
        "file": table_path.name,
        "sha256": sha256_file(table_path),
        "corpus": {
            "id": WIKIPEDIA_DATASET,
            "snapshot": WIKIPEDIA_DATASET_DATE,
            "split": "train",
            "url": f"https://huggingface.co/datasets/{WIKIPEDIA_DATASET}",
        },
        "locales": sorted(analyses),
        "maxBytesPerLocale": max_bytes,
        "generator": {
            "tool": "scattergories-tools",
            "version": version("scattergories-tools"),
            "commit": _git_commit(table_path.parent),
        },
        "generatedOn": datetime.now(UTC).date().isoformat(),
    }
    _write_json(meta_path, payload)
    return meta_path


def stamp_checksum(table_path: Path) -> str:
    """Refresh only the checksum, for a table reformatted after generation."""
    meta_path = metadata_path_for(table_path)
    payload = json.loads(meta_path.read_text(encoding="utf-8"))
    payload["sha256"] = sha256_file(table_path)
    _write_json(meta_path, payload)
    return payload["sha256"]


def check_metadata(table_path: Path) -> list[str]:
    """Return every way the table and its metadata disagree; empty means consistent."""
    meta_path = metadata_path_for(table_path)
    if not table_path.exists():
        return [f"missing table: {table_path}"]
    if not meta_path.exists():
        return [f"missing metadata: {meta_path}"]

    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    table = table_path.read_text(encoding="utf-8")
    problems: list[str] = []

    actual = sha256_file(table_path)
    if meta.get("sha256") != actual:
        problems.append(f"sha256 mismatch: metadata has {meta.get('sha256')}, table is {actual}")
    if meta.get("file") != table_path.name:
        problems.append(
            f"file mismatch: metadata names {meta.get('file')}, table is {table_path.name}"
        )
    if not _SEMVER_RE.match(str(meta.get("tableVersion", ""))):
        problems.append(f"tableVersion is not x.y.z: {meta.get('tableVersion')}")

    table_locales = sorted(_LOCALE_RE.findall(table))
    if sorted(meta.get("locales", [])) != table_locales:
        problems.append(f"locales mismatch: metadata {meta.get('locales')}, table {table_locales}")

    cap = meta.get("maxBytesPerLocale")
    table_caps = {int(value) for value in _MAX_BYTES_RE.findall(table)}
    if table_caps != {cap}:
        problems.append(f"byte cap mismatch: metadata {cap}, table {sorted(table_caps)}")

    return problems
