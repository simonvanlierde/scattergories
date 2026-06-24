"""Reusable fakes for tools tests."""

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Protocol

if TYPE_CHECKING:
    from collections.abc import Callable


class TranslationProviderLike(Protocol):
    """Subset of the fake provider interface used by the tests."""

    calls: list[tuple[str, str, str]]

    def translate(self, from_locale: str, to_locale: str, text: str) -> str:
        """Translate one value."""


class FakeProviderFactory(Protocol):
    """Factory that builds the fake translation provider used in tests."""

    def __call__(
        self, translations: dict[tuple[str, str, str], str] | None = None
    ) -> TranslationProviderLike:
        """Build a fake translation provider."""


@dataclass
class FakeTranslationProvider:
    """Small fake translation provider that records calls."""

    name: str = "fake"
    translations: dict[tuple[str, str, str], str] = field(default_factory=dict)
    calls: list[tuple[str, str, str]] = field(default_factory=list)

    def translate(self, from_locale: str, to_locale: str, text: str) -> str:
        """Record one translation call and return a deterministic value."""
        key = (from_locale, to_locale, text)
        self.calls.append(key)
        return self.translations.get(key, f"{text}-{to_locale}")


@dataclass
class FakeTranslator:
    """Small translation object returned by the fake Argos API."""

    result: str

    def translate(self, _text: str) -> str:
        """Return the configured translation result."""
        return self.result


@dataclass
class FakeArgosPackage:
    """Language package metadata used by the fake Argos API."""

    from_code: str
    to_code: str
    download_path: str

    def download(self) -> str:
        """Return a stable fake download path."""
        return self.download_path


class FakeArgosPackageApi:
    """Fake package API with basic install tracking."""

    def __init__(self, packages: list[FakeArgosPackage]) -> None:
        self._packages = packages
        self.updated = False
        self.installed_paths: list[str] = []
        self.install_hook: Callable[[str], None] | None = None

    def update_package_index(self) -> None:
        """Record one index refresh."""
        self.updated = True

    def get_available_packages(self) -> list[FakeArgosPackage]:
        """Return available packages."""
        return self._packages

    def install_from_path(self, path: str) -> None:
        """Record one package installation."""
        if self.install_hook is not None:
            self.install_hook(path)
        else:
            self.installed_paths.append(path)


class FakeArgosTranslateApi:
    """Fake translation API that can simulate missing pairs."""

    def __init__(self, translators: dict[tuple[str, str], FakeTranslator] | None = None) -> None:
        self.translators = translators or {}
        self.lookups: list[tuple[str, str]] = []

    def get_translation_from_codes(self, from_locale: str, to_locale: str) -> FakeTranslator:
        """Return a translator or raise like Argos would."""
        pair = (from_locale, to_locale)
        self.lookups.append(pair)
        if pair not in self.translators:
            raise LookupError(pair)
        return self.translators[pair]
