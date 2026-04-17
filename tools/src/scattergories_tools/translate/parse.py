"""Category and locale translation helpers."""

import json
import re
from typing import TYPE_CHECKING, cast

from scattergories_tools.translate.cache import TranslationCache, cache_key

if TYPE_CHECKING:
    from collections.abc import Callable
    from pathlib import Path

type JSONScalar = str | int | float | bool | None
type JSONValue = JSONScalar | list["JSONValue"] | dict[str, "JSONValue"]

PLACEHOLDER_RE = re.compile(r"{{\s*[^{}]+\s*}}")


def load_category_names(categories_path: Path) -> list[str]:
    """Load canonical English category names from the shared locale JSON."""
    payload = json.loads(categories_path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict) or not all(
        isinstance(key, str) and isinstance(value, str) for key, value in payload.items()
    ):
        msg = f"Invalid category payload at {categories_path}"
        raise TypeError(msg)

    categories = cast("list[str]", list(payload))
    if len(categories) != len(set(categories)):
        msg = "Category source contains duplicates"
        raise ValueError(msg)
    if any(payload[category] != category for category in categories):
        msg = "English category source must map every category to itself"
        raise ValueError(msg)
    return categories


def load_locale_payload(locale_path: Path) -> dict[str, JSONValue]:
    """Load a locale payload JSON file."""
    payload = json.loads(locale_path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        msg = f"Invalid locale payload at {locale_path}"
        raise TypeError(msg)
    return payload


def mask_placeholders(text: str) -> tuple[str, dict[str, str]]:
    """Replace template placeholders with temporary tokens."""
    tokens: dict[str, str] = {}

    def replace(match: re.Match[str]) -> str:
        token = f"__PH_{len(tokens)}__"
        tokens[token] = match.group(0)
        return token

    return PLACEHOLDER_RE.sub(replace, text), tokens


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
    cache: TranslationCache,
) -> str:
    """Translate one string with placeholder preservation and cache reuse."""
    key = cache_key(from_locale=from_locale, to_locale=to_locale, text=text)
    cached = cache.get(key)
    if cached is not None:
        return cached

    masked, tokens = mask_placeholders(text)
    translated = translate_text(from_locale, to_locale, masked)
    value = unmask_placeholders(translated, tokens)
    cache.set(key, value)
    return value


def translate_categories(
    categories: list[str],
    *,
    from_locale: str,
    to_locale: str,
    translate_text: Callable[[str, str, str], str],
    cache: TranslationCache,
) -> dict[str, str]:
    """Translate a flat category list into a JSON map."""
    return {
        category: translate_string(
            category,
            from_locale=from_locale,
            to_locale=to_locale,
            translate_text=translate_text,
            cache=cache,
        )
        for category in categories
    }


def translate_locale_payload(
    payload: dict[str, JSONValue],
    *,
    from_locale: str,
    to_locale: str,
    translate_text: Callable[[str, str, str], str],
    cache: TranslationCache,
) -> dict[str, JSONValue]:
    """Translate all string leaves in a locale payload."""

    def walk(value: JSONValue) -> JSONValue:
        if isinstance(value, dict):
            return {key: walk(item) for key, item in value.items()}
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


def render_json(value: dict[str, JSONValue] | dict[str, str]) -> str:
    """Render a JSON payload with stable formatting."""
    return json.dumps(value, indent=2, ensure_ascii=False) + "\n"
