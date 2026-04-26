"""Behavior tests for `sg-tools doctor`."""

from typing import TYPE_CHECKING

from scattergories_tools import cli
from scattergories_tools.commands import doctor
from scattergories_tools.shared.context import AppContext

if TYPE_CHECKING:
    import pytest
    from typer.testing import CliRunner

    from scattergories_tools.shared.paths import RepoPaths
    from scattergories_tools.shared.registry import LocaleRegistry

    from .fakes import FakeProviderFactory


def test_doctor_reports_missing_optional_bits(
    runner: CliRunner,
    repo_context: tuple[RepoPaths, LocaleRegistry],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Doctor exits non-zero when optional runtime pieces are missing."""
    paths, registry = repo_context
    monkeypatch.setattr(doctor, "create_context", lambda: AppContext(paths, registry))
    monkeypatch.delenv("HF_TOKEN", raising=False)

    def fail_provider(_name: str) -> object:
        msg = "Argos missing for test"
        raise RuntimeError(msg)

    monkeypatch.setattr(doctor, "build_provider", fail_provider)

    result = runner.invoke(cli.app, ["doctor"])

    assert result.exit_code == 1
    assert "[OK] registry:" in result.stdout
    assert "[WARN] hf_token: missing" in result.stdout
    assert "[WARN] argos: Argos missing for test" in result.stdout


def test_doctor_reports_healthy_environment(
    runner: CliRunner,
    repo_context: tuple[RepoPaths, LocaleRegistry],
    fake_provider_factory: FakeProviderFactory,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Doctor succeeds when the repo layout and optional dependencies are ready."""
    paths, registry = repo_context
    monkeypatch.setattr(doctor, "create_context", lambda: AppContext(paths, registry))
    monkeypatch.setattr(doctor, "build_provider", lambda _name: fake_provider_factory())
    monkeypatch.setenv("HF_TOKEN", "token-for-test")

    result = runner.invoke(cli.app, ["doctor"])

    assert result.exit_code == 0
    assert "[OK] hf_token: set" in result.stdout
    assert "[OK] argos: available" in result.stdout
    assert "[WARN]" not in result.stdout
