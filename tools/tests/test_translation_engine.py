"""Tests for translation provider construction and Argos flows."""

from __future__ import annotations

import sys
import types
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

import pytest

from scattergories_tools.translate.engine import ArgosProvider, build_provider

if TYPE_CHECKING:
    from collections.abc import Callable, Mapping, Sequence


TMP_DIR_EN_ES = "/tmp/en-es.pkg"  # noqa: S108
TMP_DIR_EN_FR = "/tmp/en-fr.pkg"  # noqa: S108


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


def install_fake_argos(
    monkeypatch: pytest.MonkeyPatch,
    *,
    package_api: FakeArgosPackageApi,
    translate_api: FakeArgosTranslateApi,
) -> None:
    """Install fake Argos modules into `sys.modules`."""
    root_module: Any = types.SimpleNamespace()
    package_module: Any = types.SimpleNamespace()
    translate_module: Any = types.SimpleNamespace()

    package_module.update_package_index = package_api.update_package_index
    package_module.get_available_packages = package_api.get_available_packages
    package_module.install_from_path = package_api.install_from_path
    translate_module.get_translation_from_codes = translate_api.get_translation_from_codes
    root_module.package = package_module
    root_module.translate = translate_module

    monkeypatch.setitem(sys.modules, "argostranslate", root_module)
    monkeypatch.setitem(sys.modules, "argostranslate.package", package_module)
    monkeypatch.setitem(sys.modules, "argostranslate.translate", translate_module)


def test_build_provider_rejects_unknown_provider_name() -> None:
    """Unsupported providers fail fast."""
    with pytest.raises(ValueError, match="Unsupported translation provider: noop"):
        build_provider("noop")


def test_argos_provider_reports_missing_optional_dependency(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A clear runtime error is raised when Argos is not installed."""
    monkeypatch.delitem(sys.modules, "argostranslate", raising=False)
    monkeypatch.delitem(sys.modules, "argostranslate.package", raising=False)
    monkeypatch.delitem(sys.modules, "argostranslate.translate", raising=False)

    import builtins  # noqa: PLC0415 # We are testing the import system here

    original_import = builtins.__import__

    def fake_import(
        name: str,
        module_globals: Mapping[str, object] | None = None,
        module_locals: Mapping[str, object] | None = None,
        fromlist: Sequence[str] | None = (),
        level: int = 0,
    ) -> types.ModuleType:
        if name == "argostranslate":
            msg = "missing optional dependency"
            raise ImportError(msg)
        return original_import(name, module_globals, module_locals, fromlist, level)

    monkeypatch.setattr(builtins, "__import__", fake_import)

    with pytest.raises(RuntimeError, match="Argos Translate is not installed"):
        ArgosProvider()


def test_argos_provider_short_circuits_same_locale(monkeypatch: pytest.MonkeyPatch) -> None:
    """Same-locale translations bypass Argos lookup entirely."""
    package_api = FakeArgosPackageApi([])
    translate_api = FakeArgosTranslateApi()
    install_fake_argos(monkeypatch, package_api=package_api, translate_api=translate_api)

    provider = ArgosProvider()

    assert provider.translate("en", "en", "Play") == "Play"
    assert translate_api.lookups == []


def test_argos_provider_uses_existing_installed_pair(monkeypatch: pytest.MonkeyPatch) -> None:
    """Available pairs are cached after the first lookup."""
    package_api = FakeArgosPackageApi([])
    translate_api = FakeArgosTranslateApi({("en", "es"): FakeTranslator(" Hola ")})
    install_fake_argos(monkeypatch, package_api=package_api, translate_api=translate_api)

    provider = ArgosProvider()

    assert provider.translate("en", "es", "Hello") == "Hola"
    provider.ensure_pair("en", "es")
    assert translate_api.lookups == [("en", "es"), ("en", "es")]
    assert package_api.installed_paths == []


def test_argos_provider_installs_missing_language_pair(monkeypatch: pytest.MonkeyPatch) -> None:
    """Missing pairs are installed from the available package index."""
    package_api = FakeArgosPackageApi([FakeArgosPackage("en", "es", TMP_DIR_EN_FR)])
    translate_api = FakeArgosTranslateApi()

    def install_from_path(path: str) -> None:
        package_api.installed_paths.append(path)
        translate_api.translators[("en", "es")] = FakeTranslator("Hola")

    package_api.install_hook = install_from_path
    install_fake_argos(monkeypatch, package_api=package_api, translate_api=translate_api)

    provider = ArgosProvider()

    assert provider.translate("en", "es", "Hello") == "Hola"
    assert package_api.installed_paths == [TMP_DIR_EN_FR]
    assert ("en", "es") in provider.installed_pairs


def test_argos_provider_reports_available_targets_for_missing_pair(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Error messages include supported targets from the same source locale."""
    package_api = FakeArgosPackageApi([FakeArgosPackage("en", "fr", TMP_DIR_EN_FR)])
    translate_api = FakeArgosTranslateApi()
    install_fake_argos(monkeypatch, package_api=package_api, translate_api=translate_api)

    provider = ArgosProvider()

    with pytest.raises(RuntimeError, match="Available targets from 'en': fr"):
        provider.ensure_pair("en", "es")
