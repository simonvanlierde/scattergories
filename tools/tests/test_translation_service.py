"""Tests for translation.service."""

import json
from typing import TYPE_CHECKING
from unittest.mock import patch

from translation.service import (
    cache_key,
    load_cache,
    parse_args,
    parse_categories,
    save_cache,
    translate_categories,
    translate_locale_payload,
    write_output,
)

if TYPE_CHECKING:
    from pathlib import Path

    from translation.service import JSONValue


def test_parse_categories_extracts_only_main_categories(tmp_path: Path) -> None:
    """Extract categories from export const CATEGORIES block only."""
    constants_path = tmp_path / "constants.ts"
    constants_path.write_text(
        """
export const CATEGORIES = [
  'Animals',
  "Foods",
  'Countries',
];

const EXTRA_CATEGORIES = [
  'Ignore me',
];
""".strip(),
        encoding="utf-8",
    )

    categories = parse_categories(constants_path)
    assert categories == ["Animals", "Foods", "Countries"]


def test_cache_round_trip(tmp_path: Path) -> None:
    """Persisted cache should round-trip through disk."""
    cache_path = tmp_path / "cache.json"
    original = {"en|es|Animals": "Animales"}
    save_cache(cache_path, original)

    loaded = load_cache(cache_path)
    assert loaded == original


def test_translate_categories_uses_cache_and_provider() -> None:
    """Use cache hit when present and provider for misses."""
    calls: list[tuple[str, str, str]] = []

    def fake_translate(from_locale: str, to_locale: str, text: str) -> str:
        calls.append((from_locale, to_locale, text))
        return f"{text}-es"

    cache = {cache_key(from_locale="en", to_locale="es", text="Animals"): "Animales"}
    categories = ["Animals", "Foods"]
    output = translate_categories(
        categories,
        from_locale="en",
        to_locale="es",
        translate_text=fake_translate,
        cache=cache,
    )

    assert output["Animals"] == "Animales"
    assert output["Foods"] == "Foods-es"
    assert calls == [("en", "es", "Foods")]


def test_write_output_writes_json(tmp_path: Path) -> None:
    """Write output file as utf-8 JSON map."""
    output_path = tmp_path / "data" / "categories.es.json"
    write_output(output_path, {"Animals": "Animales", "Foods": "Comidas"})

    assert output_path.exists()
    parsed = json.loads(output_path.read_text(encoding="utf-8"))
    assert parsed["Animals"] == "Animales"
    assert parsed["Foods"] == "Comidas"


def test_translate_locale_payload_preserves_structure_and_placeholders() -> None:
    """Translate locale payload leaves while preserving template placeholders."""
    payload: dict[str, JSONValue] = {
        "title": "Scattergories",
        "roundCounter": "Round {{current}} of {{total}}",
        "nested": {
            "label": "New Game",
            "items": ["Pause", "Resume"],
        },
    }

    def fake_translate(from_locale: str, to_locale: str, text: str) -> str:
        _ = from_locale, to_locale
        return f"{text}-X"

    translated = translate_locale_payload(
        payload,
        from_locale="en",
        to_locale="es",
        translate_text=fake_translate,
        cache={},
    )

    nested = translated["nested"]
    assert isinstance(nested, dict)
    items = nested["items"]
    assert isinstance(items, list)

    assert translated["title"] == "Scattergories-X"
    assert translated["roundCounter"] == "Round {{current}} of {{total}}-X"
    assert nested["label"] == "New Game-X"
    assert items[0] == "Pause-X"


def test_parse_args_mode_locales() -> None:
    """Parse CLI mode for locale translation."""
    with patch("sys.argv", ["prog", "--mode", "locales", "--target-locales", "es", "fr"]):
        args = parse_args()
        assert args.mode == "locales"
        assert args.target_locales == ["es", "fr"]
