"""SQLite-backed translation cache."""

import sqlite3
from contextlib import contextmanager
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from collections.abc import Iterator
    from pathlib import Path


def cache_key(*, from_locale: str, to_locale: str, text: str) -> str:
    """Build a stable cache key."""
    return f"{from_locale}|{to_locale}|{text}"


class TranslationCache:
    """Small SQLite cache for translated strings."""

    def __init__(self, cache_path: Path) -> None:
        self.cache_path = cache_path
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        self.connection = sqlite3.connect(self.cache_path)
        self.connection.execute(
            """
            CREATE TABLE IF NOT EXISTS translations (
              cache_key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            )
            """
        )
        self.connection.commit()

    def get(self, key: str) -> str | None:
        """Return a cached value if present."""
        row = self.connection.execute(
            "SELECT value FROM translations WHERE cache_key = ?",
            (key,),
        ).fetchone()
        return None if row is None else str(row[0])

    def set(self, key: str, value: str) -> None:
        """Store or replace a cached value."""
        self.connection.execute(
            "INSERT OR REPLACE INTO translations (cache_key, value) VALUES (?, ?)",
            (key, value),
        )
        self.connection.commit()

    def close(self) -> None:
        """Close the SQLite connection."""
        self.connection.close()


@contextmanager
def open_translation_cache(cache_path: Path) -> Iterator[TranslationCache]:
    """Context manager for the translation cache."""
    cache = TranslationCache(cache_path)
    try:
        yield cache
    finally:
        cache.close()
