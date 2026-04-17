"""Translation provider abstractions."""

import importlib
from dataclasses import dataclass
from typing import Any, Protocol


class TranslationProvider(Protocol):
    """Interface used by translation commands."""

    name: str

    def translate(self, from_locale: str, to_locale: str, text: str) -> str:
        """Translate one string."""


@dataclass
class ArgosProvider:
    """Argos-backed translation provider."""

    name: str = "argos"

    def __post_init__(self) -> None:
        try:
            package_module = importlib.import_module("argostranslate.package")
            translate_module = importlib.import_module("argostranslate.translate")
        except ImportError as error:
            msg = "Argos Translate is not installed. Run: uv sync --group translation --locked"
            raise RuntimeError(msg) from error

        self.argos_package: Any = package_module
        self.argos_translate: Any = translate_module
        self.argos_package.update_package_index()
        self.available_packages = list(self.argos_package.get_available_packages())
        self.installed_pairs: set[tuple[str, str]] = set()

    def ensure_pair(self, from_locale: str, to_locale: str) -> None:
        """Install an Argos language pair when needed."""
        if (from_locale, to_locale) in self.installed_pairs:
            return

        try:
            self.argos_translate.get_translation_from_codes(from_locale, to_locale)
        except LookupError, ValueError, AttributeError:
            for package in self.available_packages:
                if package.from_code == from_locale and package.to_code == to_locale:
                    download_path = package.download()
                    self.argos_package.install_from_path(download_path)
                    self.installed_pairs.add((from_locale, to_locale))
                    return

            available_targets = sorted(
                {
                    package.to_code
                    for package in self.available_packages
                    if package.from_code == from_locale
                }
            )
            hint = (
                f"Available targets from {from_locale!r}: {', '.join(available_targets) or 'none'}"
            )
            msg = f"No Argos package available for {from_locale} -> {to_locale}. {hint}"
            raise RuntimeError(msg) from None
        else:
            self.installed_pairs.add((from_locale, to_locale))

    def translate(self, from_locale: str, to_locale: str, text: str) -> str:
        """Translate one text value."""
        if from_locale == to_locale:
            return text
        self.ensure_pair(from_locale, to_locale)
        translator = self.argos_translate.get_translation_from_codes(from_locale, to_locale)
        result = translator.translate(text)
        return result.strip() if result else text


def build_provider(name: str) -> TranslationProvider:
    """Instantiate a configured translation provider by name."""
    if name == "argos":
        return ArgosProvider()
    msg = f"Unsupported translation provider: {name}"
    raise ValueError(msg)
