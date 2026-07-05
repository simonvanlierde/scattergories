"""Tests for the SQLite translation cache."""

from typing import TYPE_CHECKING

from scattergories_tools.translate.cache import open_translation_cache

if TYPE_CHECKING:
    from pathlib import Path


def test_cache_commits_on_close(tmp_path: Path) -> None:
    """Values stored during a session persist after the context manager closes."""
    cache_path = tmp_path / "translation.sqlite3"

    with open_translation_cache(cache_path) as cache:
        cache.set("k", "v")
        assert cache.get("k") == "v"

    with open_translation_cache(cache_path) as reopened:
        assert reopened.get("k") == "v"
