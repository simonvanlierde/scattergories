"""Tests for locale registry helpers."""

import json
from pathlib import Path
from typing import TYPE_CHECKING

import pytest

from scattergories_tools.shared.paths import default_repo_paths
from scattergories_tools.shared.registry import (
    LocaleRegistry,
    load_locale_registry,
    parse_locale_args,
)

if TYPE_CHECKING:
    from .conftest import RegistryFixture

FIXTURES = Path(__file__).parent / "fixtures"


def test_default_repo_paths_resolve_repo_layout() -> None:
    """Default paths point at the repo's real layout."""
    paths = default_repo_paths()
    assert paths.repo_root.name == "scattegories"
    assert paths.registry_path.name == "registry.json"
    assert paths.generated_weights_path.name == "letterWeights.ts"
    assert paths.translation_cache_path.name == "translation.sqlite3"


def test_load_locale_registry_reads_fixture() -> None:
    """Registry fixture loads into a typed helper."""
    registry = load_locale_registry(FIXTURES / "registry.json")
    assert registry.fallback_locale == "en"
    assert registry.get_letters("el") == ["Α", "Β", "Γ"]  # noqa: RUF001 # Greek letters


def test_normalize_locale_and_fallback_letter_lookup(
    write_registry: RegistryFixture,
) -> None:
    """Normalization uses the fallback locale for empty and region-qualified codes."""
    registry = write_registry()
    assert registry.normalize_locale(None) == "en"
    assert registry.normalize_locale("ES-MX") == "es"
    assert registry.get_letters("fr") == ["A", "B", "C"]


def test_get_letters_requires_at_least_one_fallback_alphabet() -> None:
    """Missing fallback letters raise a clear error."""
    registry = LocaleRegistry(
        fallback_locale="en",
        locales=("en",),
        letters_by_locale={},
        native_names={"en": "English"},
    )
    with pytest.raises(ValueError, match="No letters configured for locale 'en'"):
        registry.get_letters("en")


def test_validate_locales_normalizes_and_preserves_duplicates(
    write_registry: RegistryFixture,
) -> None:
    """Locale validation normalizes region codes without de-duplicating input."""
    registry = write_registry()
    assert registry.validate_locales(["EN-US", "es", "es-ES"]) == ["en", "es", "es"]


@pytest.mark.parametrize(
    ("payload", "message"),
    [
        ([], "Invalid locale registry"),
        (
            {"fallbackLocale": 1, "locales": ["en"], "lettersByLocale": {}, "nativeNames": {}},
            "registry fallbackLocale must be a string",
        ),
        (
            {"fallbackLocale": "en", "locales": [1], "lettersByLocale": {}, "nativeNames": {}},
            "registry locales must be a list of strings",
        ),
        (
            {
                "fallbackLocale": "en",
                "locales": ["en"],
                "lettersByLocale": {"en": ["A"]},
                "nativeNames": {},
            },
            "registry lettersByLocale must be a string map",
        ),
        (
            {
                "fallbackLocale": "en",
                "locales": ["en"],
                "lettersByLocale": {"en": "ABC"},
                "nativeNames": {"en": 1},
            },
            "registry nativeNames must be a string map",
        ),
    ],
)
def test_load_locale_registry_rejects_malformed_top_level_fields(
    tmp_path: Path,
    payload: object,
    message: str,
) -> None:
    """Malformed registry payloads fail with targeted errors."""
    registry_path = tmp_path / "registry.json"
    registry_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")

    with pytest.raises(TypeError, match=message):
        load_locale_registry(registry_path)


def test_parse_locale_args_defaults_to_all_locales(
    write_registry: RegistryFixture,
) -> None:
    """Omitting locale args selects the whole registry."""
    registry = write_registry()
    assert parse_locale_args(None, registry) == ["en", "es", "el"]


def test_parse_locale_args_splits_and_validates(
    write_registry: RegistryFixture,
) -> None:
    """Locale args accept comma-separated input."""
    registry = write_registry()
    assert parse_locale_args(["en,es", "el"], registry) == ["en", "es", "el"]


def test_parse_locale_args_rejects_unknown_locale(
    write_registry: RegistryFixture,
) -> None:
    """Unknown locales fail fast."""
    registry = write_registry()
    with pytest.raises(ValueError, match="Unsupported locale code"):
        parse_locale_args(["zz"], registry)
