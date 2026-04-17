"""Tests for translation parsing and payload helpers."""
# spell-checker: ignore Listo

from typing import TYPE_CHECKING

import pytest

from scattergories_tools.translate.cache import TranslationCache, cache_key
from scattergories_tools.translate.parse import (
    load_category_names,
    load_locale_payload,
    mask_placeholders,
    render_json,
    translate_categories,
    translate_locale_payload,
    translate_string,
    unmask_placeholders,
)

if TYPE_CHECKING:
    from pathlib import Path

    from .conftest import FakeProviderFactory


def test_load_category_names_uses_json_keys(tmp_path: Path) -> None:
    """English category source is loaded from JSON keys."""
    source = tmp_path / "categories.en.json"
    source.write_text('{"Animals":"Animals","Foods":"Foods"}', encoding="utf-8")
    assert load_category_names(source) == ["Animals", "Foods"]


def test_load_category_names_rejects_non_identity_english_values(tmp_path: Path) -> None:
    """English source must map each category to itself."""
    source = tmp_path / "categories.en.json"
    source.write_text('{"Animals":"Animales"}', encoding="utf-8")
    with pytest.raises(ValueError, match="must map every category to itself"):
        load_category_names(source)


def test_load_category_names_rejects_non_string_payloads(tmp_path: Path) -> None:
    """Category payloads must be flat string maps."""
    source = tmp_path / "categories.en.json"
    source.write_text('{"Animals":1}', encoding="utf-8")
    with pytest.raises(TypeError, match="Invalid category payload"):
        load_category_names(source)


def test_load_locale_payload_rejects_non_object_roots(tmp_path: Path) -> None:
    """Locale payloads must deserialize into JSON objects."""
    source = tmp_path / "es.json"
    source.write_text('["Play"]', encoding="utf-8")
    with pytest.raises(TypeError, match="Invalid locale payload"):
        load_locale_payload(source)


def test_translation_cache_round_trip(tmp_path: Path) -> None:
    """SQLite cache persists translations."""
    cache = TranslationCache(tmp_path / "translation.sqlite3")
    key = cache_key(from_locale="en", to_locale="es", text="Animals")
    cache.set(key, "Animales")
    assert cache.get(key) == "Animales"
    cache.close()


def test_mask_and_unmask_placeholders_restore_multiple_tokens() -> None:
    """Placeholder masking is reversible and preserves order."""
    masked, tokens = mask_placeholders("Round {{current}} of {{total}}")
    assert masked == "Round __PH_0__ of __PH_1__"
    assert unmask_placeholders("Ronda __PH_0__ de __PH_1__", tokens) == (
        "Ronda {{current}} de {{total}}"
    )


def test_translate_string_uses_cache_before_calling_provider(
    tmp_path: Path,
    fake_provider_factory: FakeProviderFactory,
) -> None:
    """Cached translations skip provider work on repeat calls."""
    cache = TranslationCache(tmp_path / "translation.sqlite3")
    provider = fake_provider_factory({("en", "es", "Animals"): "Animales"})

    first = translate_string(
        "Animals",
        from_locale="en",
        to_locale="es",
        translate_text=provider.translate,
        cache=cache,
    )
    second = translate_string(
        "Animals",
        from_locale="en",
        to_locale="es",
        translate_text=provider.translate,
        cache=cache,
    )

    assert first == "Animales"
    assert second == "Animales"
    assert provider.calls == [("en", "es", "Animals")]
    cache.close()


def test_translate_categories_uses_cache_and_provider(
    tmp_path: Path,
    fake_provider_factory: FakeProviderFactory,
) -> None:
    """Cache hits skip provider calls and misses populate cache."""
    cache = TranslationCache(tmp_path / "translation.sqlite3")
    cache.set(cache_key(from_locale="en", to_locale="es", text="Animals"), "Animales")
    provider = fake_provider_factory()

    translated = translate_categories(
        ["Animals", "Foods"],
        from_locale="en",
        to_locale="es",
        translate_text=provider.translate,
        cache=cache,
    )

    assert translated == {"Animals": "Animales", "Foods": "Foods-es"}
    assert provider.calls == [("en", "es", "Foods")]
    cache.close()


def test_translate_locale_payload_preserves_lists_scalars_and_placeholders(
    tmp_path: Path,
    fake_provider_factory: FakeProviderFactory,
) -> None:
    """Only string leaves are translated during recursive traversal."""
    cache = TranslationCache(tmp_path / "translation.sqlite3")
    provider = fake_provider_factory(
        {
            ("en", "es", "Play"): "Jugar",
            ("en", "es", "Ready"): "Listo",
            ("en", "es", "Go __PH_0__"): "Ir __PH_0__",
        }
    )

    translated = translate_locale_payload(
        {
            "title": "Play",
            "count": 3,
            "items": ["Ready", {"nested": "Go {{value}}"}],
        },
        from_locale="en",
        to_locale="es",
        translate_text=provider.translate,
        cache=cache,
    )

    assert translated == {
        "title": "Jugar",
        "count": 3,
        "items": ["Listo", {"nested": "Ir {{value}}"}],
    }
    cache.close()


def test_render_json_appends_newline() -> None:
    """JSON rendering is stable and newline-terminated."""
    rendered = render_json({"Animals": "Animales"})
    assert rendered.endswith("\n")
    assert '"Animals": "Animales"' in rendered
