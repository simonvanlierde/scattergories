"""Locale registry loading and validation."""

import json
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from pathlib import Path


@dataclass(frozen=True)
class LocaleRegistry:
    """Typed view over the shared locale registry JSON."""

    fallback_locale: str
    locales: tuple[str, ...]
    letters_by_locale: dict[str, str]
    native_names: dict[str, str]

    def normalize_locale(self, locale: str | None) -> str:
        """Normalize locale input to the repo's canonical short code."""
        if not locale:
            return self.fallback_locale
        return locale.lower().split("-")[0]

    def get_letters(self, locale: str | None) -> list[str]:
        """Return the locale-specific alphabet, with fallback handling."""
        normalized = self.normalize_locale(locale)
        letters = self.letters_by_locale.get(normalized) or self.letters_by_locale.get(
            self.fallback_locale
        )
        if letters is None:
            msg = f"No letters configured for locale {locale!r}"
            raise ValueError(msg)
        return list(letters)

    def validate_locales(self, locales: list[str]) -> list[str]:
        """Normalize and validate a list of locale codes."""
        normalized = [self.normalize_locale(locale) for locale in locales]
        invalid = sorted({locale for locale in normalized if locale not in self.locales})
        if invalid:
            msg = f"Unsupported locale code(s): {', '.join(invalid)}"
            raise ValueError(msg)
        return normalized


def load_locale_registry(registry_path: Path) -> LocaleRegistry:
    """Load the repo locale registry from JSON."""
    data = json.loads(registry_path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        msg = f"Invalid locale registry at {registry_path}"
        raise TypeError(msg)

    fallback_locale = data.get("fallbackLocale")
    locales = data.get("locales")
    letters_by_locale = data.get("lettersByLocale")
    native_names = data.get("nativeNames")

    if not isinstance(fallback_locale, str):
        msg = "registry fallbackLocale must be a string"
        raise TypeError(msg)
    if not isinstance(locales, list) or not all(isinstance(locale, str) for locale in locales):
        msg = "registry locales must be a list of strings"
        raise TypeError(msg)
    if not isinstance(letters_by_locale, dict) or not all(
        isinstance(key, str) and isinstance(value, str) for key, value in letters_by_locale.items()
    ):
        msg = "registry lettersByLocale must be a string map"
        raise TypeError(msg)
    if not isinstance(native_names, dict) or not all(
        isinstance(key, str) and isinstance(value, str) for key, value in native_names.items()
    ):
        msg = "registry nativeNames must be a string map"
        raise TypeError(msg)

    return LocaleRegistry(
        fallback_locale=fallback_locale,
        locales=tuple(locales),
        letters_by_locale=dict(letters_by_locale),
        native_names=dict(native_names),
    )


def split_locale_csv(raw: str) -> list[str]:
    """Split a comma-separated locale string, trimming blanks."""
    return [item.strip() for item in raw.split(",") if item.strip()]


def parse_locale_args(raw_locales: str | None, registry: LocaleRegistry) -> list[str]:
    """Parse a comma-separated locale arg using the shared registry."""
    if raw_locales is None:
        return list(registry.locales)
    return registry.validate_locales(split_locale_csv(raw_locales))
