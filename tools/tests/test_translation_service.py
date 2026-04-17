"""Tests for translation.service."""
# spell-checker: ignore argosmodel

import json
import logging
from pathlib import Path
from typing import TYPE_CHECKING
from unittest.mock import MagicMock, patch

import pytest

from translation.service import (
    ArgosTranslator,
    cache_key,
    load_cache,
    main,
    parse_args,
    parse_categories,
    save_cache,
    supported_locales,
    translate_categories,
    translate_locale_payload,
    validate_locales,
    write_output,
)

if TYPE_CHECKING:
    from translation.service import JSONValue

DEFAULT_CONSTANTS_PATH = Path(__file__).resolve().parents[2] / "src/game/constants.ts"


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


def test_supported_locales_reads_shared_registry() -> None:
    """The shared locale registry exposes the locale list used by translation tools."""
    locales = supported_locales()
    assert "en" in locales
    assert "fr" in locales


def test_validate_locales_rejects_unknown_locale() -> None:
    """Unsupported locale codes should fail fast."""
    with pytest.raises(RuntimeError, match="Unsupported locale code"):
        validate_locales(["zz"])


# ---------------------------------------------------------------------------
# parse_categories — real constants.ts regression
# ---------------------------------------------------------------------------


def test_parse_categories_against_real_constants_ts() -> None:
    """constants.ts parses to > 200 unique, non-empty strings — guards against regex drift."""
    categories = parse_categories(DEFAULT_CONSTANTS_PATH)
    assert len(categories) > 200
    assert all(isinstance(c, str) and c.strip() for c in categories)
    assert len(set(categories)) == len(categories), "CATEGORIES must have no duplicates"


# ---------------------------------------------------------------------------
# ArgosTranslator.ensure_pair
# ---------------------------------------------------------------------------


def _mock_translator(
    *,
    get_translation_side_effect: BaseException | None = None,
    available_packages: list[MagicMock] | None = None,
) -> tuple[ArgosTranslator, MagicMock, MagicMock]:
    """Construct an ArgosTranslator with all Argos internals mocked.

    Returns:
        (translator, mock_package_module, mock_translate_module)
    """
    mock_pkg = MagicMock(name="argos_package")
    mock_pkg.get_available_packages.return_value = available_packages or []
    mock_translate = MagicMock(name="argos_translate")
    if get_translation_side_effect is not None:
        mock_translate.get_translation_from_codes.side_effect = get_translation_side_effect
    with (
        patch("translation.service.argos_package", mock_pkg),
        patch("translation.service.argos_translate", mock_translate),
    ):
        return ArgosTranslator(), mock_pkg, mock_translate


def test_ensure_pair_succeeds_and_records_installed_pair() -> None:
    """ensure_pair adds (from, to) to installed_pairs when codes are already available."""
    translator, _pkg, mock_translate = _mock_translator()

    translator.ensure_pair("en", "es")

    mock_translate.get_translation_from_codes.assert_called_once_with("en", "es")
    assert ("en", "es") in translator.installed_pairs


def test_ensure_pair_skips_when_already_installed() -> None:
    """ensure_pair is a no-op for pairs that are already in installed_pairs."""
    translator, _pkg, mock_translate = _mock_translator()
    translator.installed_pairs.add(("en", "es"))

    translator.ensure_pair("en", "es")

    mock_translate.get_translation_from_codes.assert_not_called()


def test_ensure_pair_downloads_and_installs_package_on_lookup_error() -> None:
    """ensure_pair downloads the matching package when codes aren't found, then records the pair."""
    fake_pkg = MagicMock()
    fake_pkg.from_code = "en"
    fake_pkg.to_code = "es"
    fake_model_path = "/fake/en-es.argosmodel"
    fake_pkg.download.return_value = fake_model_path

    translator, mock_pkg, _translate = _mock_translator(
        get_translation_side_effect=LookupError("not found"),
        available_packages=[fake_pkg],
    )

    translator.ensure_pair("en", "es")

    fake_pkg.download.assert_called_once()
    mock_pkg.install_from_path.assert_called_once_with(fake_model_path)
    assert ("en", "es") in translator.installed_pairs


def test_ensure_pair_raises_when_no_package_available() -> None:
    """ensure_pair raises RuntimeError when no downloadable package matches the locale pair."""
    translator, _pkg, _translate = _mock_translator(
        get_translation_side_effect=LookupError("not found"),
        available_packages=[],
    )

    with pytest.raises(RuntimeError, match="No Argos package available for en -> es"):
        translator.ensure_pair("en", "es")


def test_ensure_pair_handles_attribute_error_from_unknown_language_code() -> None:
    """AttributeError (unknown lang code, argostranslate returns None) triggers download attempt."""
    translator, _pkg, _translate = _mock_translator(
        get_translation_side_effect=AttributeError("'NoneType' has no attribute 'code'"),
        available_packages=[],
    )

    with pytest.raises(RuntimeError, match="No Argos package available for en -> el"):
        translator.ensure_pair("en", "el")


def test_ensure_pair_error_message_lists_available_targets() -> None:
    """RuntimeError includes the list of available target languages for the source locale."""
    fake_pkg = MagicMock()
    fake_pkg.from_code = "en"
    fake_pkg.to_code = "es"

    translator, _pkg, _translate = _mock_translator(
        get_translation_side_effect=AttributeError("unknown"),
        available_packages=[fake_pkg],
    )
    fake_pkg.from_code = "en"
    fake_pkg.to_code = "es"
    # Trigger with a locale that has no package
    with pytest.raises(RuntimeError, match="Available targets from 'en': es"):
        translator.ensure_pair("en", "zz")


# ---------------------------------------------------------------------------
# parse_args — comma-separated locales
# ---------------------------------------------------------------------------


def test_parse_args_comma_separated_locales() -> None:
    """Comma-separated --target-locales are split into individual codes."""
    with patch("sys.argv", ["prog", "--target-locales", "pl,nl"]):
        args = parse_args()
    assert args.target_locales == ["pl", "nl"]


def test_parse_args_space_separated_locales() -> None:
    """Space-separated --target-locales produce a list as usual."""
    with patch("sys.argv", ["prog", "--target-locales", "es", "fr", "de"]):
        args = parse_args()
    assert args.target_locales == ["es", "fr", "de"]


# ---------------------------------------------------------------------------
# main() dry-run — categories mode
# ---------------------------------------------------------------------------


def test_main_dry_run_categories_logs_count(monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture) -> None:
    """Main --dry-run logs a non-zero category count without translating."""
    monkeypatch.setattr("sys.argv", ["prog", "--dry-run"])
    with caplog.at_level(logging.INFO, logger="translation.service"):
        main()
    assert "Dry run" in caplog.text
    assert "Category count:" in caplog.text
    # Sanity: the logged count should be a number > 0
    count_line = next(line for line in caplog.text.splitlines() if "Category count:" in line)
    count = int(count_line.split(":")[-1].strip())
    assert count > 0


def test_main_dry_run_locales_mode(monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture) -> None:
    """Main --dry-run --mode locales logs the source locale file path."""
    monkeypatch.setattr("sys.argv", ["prog", "--dry-run", "--mode", "locales"])
    with caplog.at_level(logging.INFO, logger="translation.service"):
        main()
    assert "Dry run" in caplog.text
    assert "locales" in caplog.text
