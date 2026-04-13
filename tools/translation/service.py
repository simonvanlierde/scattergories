"""Translate Scattergories CATEGORIES from src/game/constants.ts using Argos."""

import argparse
import json
import logging
import re
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from collections.abc import Callable, Iterable

try:
    from argostranslate import package as argos_package
    from argostranslate import translate as argos_translate
except ImportError:  # pragma: no cover - tested via runtime guard
    argos_package: Any = None
    argos_translate: Any = None

type JSONScalar = str | int | float | bool | None
type JSONValue = JSONScalar | list["JSONValue"] | dict[str, "JSONValue"]

logger = logging.getLogger(__name__)

DEFAULT_CONSTANTS_PATH = Path(__file__).resolve().parents[2] / "src/game/constants.ts"
DEFAULT_SOURCE_LOCALE_FILE = Path(__file__).resolve().parents[2] / "src/i18n/locales/en.json"
DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent / "data"
DEFAULT_CACHE_PATH = Path(__file__).resolve().parent / ".translation-cache.json"
DEFAULT_SOURCE_LOCALE = "en"
DEFAULT_TARGET_LOCALES = ("es",)
PLACEHOLDER_RE = re.compile(r"{{\s*[^{}]+\s*}}")


def configure_logging(*, verbose: bool) -> None:
    """Configure CLI logging without third-party noise."""
    logging.basicConfig(level=logging.WARNING, format="%(levelname)s: %(message)s")
    logger.setLevel(logging.DEBUG if verbose else logging.INFO)


def parse_categories(constants_path: Path) -> list[str]:
    """Extract CATEGORIES strings from constants.ts."""
    content = constants_path.read_text(encoding="utf-8")
    match = re.search(r"export const CATEGORIES\s*=\s*\[(.*?)\];", content, re.DOTALL)
    if not match:
        msg = f"Could not find export const CATEGORIES in {constants_path}"
        raise RuntimeError(msg)

    categories_block = match.group(1)
    string_matches = re.findall(r"'([^'\\]*(?:\\.[^'\\]*)*)'|\"([^\"\\]*(?:\\.[^\"\\]*)*)\"", categories_block)

    categories: list[str] = []
    for single_quoted, double_quoted in string_matches:
        raw = single_quoted or double_quoted
        # Decode TS string escape sequences (\n, \', \", \\, \uXXXX) into Python text.
        categories.append(bytes(raw, "utf-8").decode("unicode_escape"))
    return categories


def load_cache(cache_path: Path) -> dict[str, str]:
    """Load persistent translation cache from JSON file."""
    if not cache_path.exists():
        return {}
    try:
        raw = cache_path.read_text(encoding="utf-8")
        return json.loads(raw) if raw else {}
    except OSError, json.JSONDecodeError:
        logger.warning("Failed to load cache from %s; starting with empty cache.", cache_path)
        return {}


def save_cache(cache_path: Path, cache: dict[str, str]) -> None:
    """Persist translation cache to JSON file."""
    try:
        cache_path.write_text(json.dumps(cache, indent=2, ensure_ascii=False), encoding="utf-8")
    except OSError as error:
        logger.warning("Failed to save cache to %s: %s", cache_path, error)


def cache_key(*, from_locale: str, to_locale: str, text: str) -> str:
    """Build a stable key for translation cache entries."""
    return f"{from_locale}|{to_locale}|{text}"


def mask_placeholders(text: str) -> tuple[str, dict[str, str]]:
    """Replace template placeholders with stable tokens before translation."""
    tokens: dict[str, str] = {}

    def replace(match: re.Match[str]) -> str:
        token = f"__PH_{len(tokens)}__"
        tokens[token] = match.group(0)
        return token

    masked = PLACEHOLDER_RE.sub(replace, text)
    return masked, tokens


def unmask_placeholders(text: str, tokens: dict[str, str]) -> str:
    """Restore template placeholders after translation."""
    restored = text
    for token, original in tokens.items():
        restored = restored.replace(token, original)
    return restored


def translate_string(
    text: str,
    *,
    from_locale: str,
    to_locale: str,
    translate_text: Callable[[str, str, str], str],
    cache: dict[str, str],
) -> str:
    """Translate one string while preserving placeholders and cache usage."""
    key = cache_key(from_locale=from_locale, to_locale=to_locale, text=text)
    if key in cache:
        return cache[key]

    masked, tokens = mask_placeholders(text)
    translated = translate_text(from_locale, to_locale, masked)
    value = unmask_placeholders(translated, tokens)
    cache[key] = value
    return value


class ArgosTranslator:
    """Minimal Argos wrapper for translating category names."""

    def __init__(self) -> None:
        """Initialize Argos APIs and package index."""
        if argos_package is None or argos_translate is None:
            msg = "Argos Translate is not installed. Run: uv sync"
            raise RuntimeError(msg)

        self.argos_package = argos_package
        self.argos_translate = argos_translate
        self.argos_package.update_package_index()
        self.available_packages = list(self.argos_package.get_available_packages())
        self.installed_pairs: set[tuple[str, str]] = set()

    def ensure_pair(self, from_locale: str, to_locale: str) -> None:
        """Install model for locale pair when needed."""
        if (from_locale, to_locale) in self.installed_pairs:
            return

        try:
            self.argos_translate.get_translation_from_codes(from_locale, to_locale)
        except LookupError, ValueError:
            for package in self.available_packages:
                if package.from_code == from_locale and package.to_code == to_locale:
                    download_path = package.download()
                    self.argos_package.install_from_path(download_path)
                    self.installed_pairs.add((from_locale, to_locale))
                    return

            msg = f"No Argos package available for {from_locale} -> {to_locale}"
            raise RuntimeError(msg) from None
        else:
            self.installed_pairs.add((from_locale, to_locale))

    def translate(self, from_locale: str, to_locale: str, text: str) -> str:
        """Translate text for a locale pair."""
        if from_locale == to_locale:
            return text
        self.ensure_pair(from_locale, to_locale)
        translator = self.argos_translate.get_translation_from_codes(from_locale, to_locale)
        result = translator.translate(text)
        return result.strip() if result else text


def translate_categories(
    categories: Iterable[str],
    *,
    from_locale: str,
    to_locale: str,
    translate_text: Callable[[str, str, str], str],
    cache: dict[str, str],
) -> dict[str, str]:
    """Translate categories using cache first, then provider."""
    translated: dict[str, str] = {}
    for category in categories:
        value = translate_string(
            category,
            from_locale=from_locale,
            to_locale=to_locale,
            translate_text=translate_text,
            cache=cache,
        )
        translated[category] = value
    return translated


def translate_locale_payload(
    payload: dict[str, JSONValue],
    *,
    from_locale: str,
    to_locale: str,
    translate_text: Callable[[str, str, str], str],
    cache: dict[str, str],
) -> dict[str, JSONValue]:
    """Translate all string leaves in a locale JSON payload."""

    def walk(value: JSONValue) -> JSONValue:
        if isinstance(value, dict):
            return {k: walk(v) for k, v in value.items()}
        if isinstance(value, list):
            return [walk(item) for item in value]
        if isinstance(value, str):
            return translate_string(
                value,
                from_locale=from_locale,
                to_locale=to_locale,
                translate_text=translate_text,
                cache=cache,
            )
        return value

    return {key: walk(value) for key, value in payload.items()}


def write_output(output_path: Path, translations: dict[str, str]) -> None:
    """Write translated category map to JSON file."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(translations, indent=2, ensure_ascii=False), encoding="utf-8")


def read_locale_payload(source_locale_file: Path) -> dict[str, JSONValue]:
    """Read locale JSON payload from disk."""
    return json.loads(source_locale_file.read_text(encoding="utf-8"))


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(
        description="Translate CATEGORIES or locale JSON files from this project with Argos.",
    )
    parser.add_argument("--mode", choices=["categories", "locales"], default="categories")
    parser.add_argument("--constants-path", type=Path, default=DEFAULT_CONSTANTS_PATH)
    parser.add_argument("--source-locale-file", type=Path, default=DEFAULT_SOURCE_LOCALE_FILE)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--cache-path", type=Path, default=DEFAULT_CACHE_PATH)
    parser.add_argument("--from-locale", default=DEFAULT_SOURCE_LOCALE)
    parser.add_argument(
        "--target-locales",
        nargs="+",
        default=list(DEFAULT_TARGET_LOCALES),
        help="Locale codes like: es fr de",
    )
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--verbose", action="store_true")
    return parser.parse_args()


def main() -> None:
    """Translate categories list and write one JSON output per locale."""
    args = parse_args()
    configure_logging(verbose=args.verbose)

    cache = load_cache(args.cache_path)

    if args.dry_run:
        logger.info("Dry run only. No translation performed.")
        logger.info("Mode: %s", args.mode)
        if args.mode == "categories":
            categories = parse_categories(args.constants_path)
            logger.info("Constants path: %s", args.constants_path)
            logger.info("Category count: %d", len(categories))
        else:
            logger.info("Source locale file: %s", args.source_locale_file)
        logger.info("Target locales: %s", ", ".join(args.target_locales))
        logger.info("Output dir: %s", args.output_dir)
        return

    translator = ArgosTranslator()
    if args.mode == "categories":
        categories = parse_categories(args.constants_path)
        for to_locale in args.target_locales:
            mapping = translate_categories(
                categories,
                from_locale=args.from_locale,
                to_locale=to_locale,
                translate_text=translator.translate,
                cache=cache,
            )
            output_path = args.output_dir / f"categories.{to_locale}.json"
            write_output(output_path, mapping)
            logger.info("Wrote %d translated categories to %s", len(mapping), output_path)
    else:
        source_payload = read_locale_payload(args.source_locale_file)
        for to_locale in args.target_locales:
            translated_payload = translate_locale_payload(
                source_payload,
                from_locale=args.from_locale,
                to_locale=to_locale,
                translate_text=translator.translate,
                cache=cache,
            )
            output_path = args.output_dir / f"locale.{to_locale}.json"
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(
                json.dumps(translated_payload, indent=2, ensure_ascii=False),
                encoding="utf-8",
            )
            logger.info("Wrote translated locale payload to %s", output_path)

    save_cache(args.cache_path, cache)


if __name__ == "__main__":
    main()
