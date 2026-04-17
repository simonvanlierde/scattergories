"""Shared repo-relative path helpers."""

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class RepoPaths:
    """Resolved paths used by the tools workspace."""

    repo_root: Path
    tools_root: Path
    cache_dir: Path
    out_dir: Path
    registry_path: Path
    generated_weights_path: Path
    locale_dir: Path
    categories_source_path: Path
    locale_payload_source_path: Path
    translation_cache_path: Path


def default_repo_paths() -> RepoPaths:
    """Build the canonical set of repo-relative paths."""
    repo_root = Path(__file__).resolve().parents[4]
    tools_root = repo_root / "tools"
    cache_dir = tools_root / ".cache"
    out_dir = tools_root / "out"
    locale_dir = repo_root / "src" / "i18n" / "locales"
    return RepoPaths(
        repo_root=repo_root,
        tools_root=tools_root,
        cache_dir=cache_dir,
        out_dir=out_dir,
        registry_path=locale_dir / "registry.json",
        generated_weights_path=repo_root / "src" / "i18n" / "__generated__" / "letterWeights.ts",
        locale_dir=locale_dir,
        categories_source_path=locale_dir / "categories.en.json",
        locale_payload_source_path=locale_dir / "en.json",
        translation_cache_path=cache_dir / "translation.sqlite3",
    )
