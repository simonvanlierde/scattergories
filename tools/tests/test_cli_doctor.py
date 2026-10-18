"""Behavior tests for `sg-tools doctor`."""

from dataclasses import replace
from typing import TYPE_CHECKING

from scattergories_tools import cli

if TYPE_CHECKING:
    from collections.abc import Callable

    import pytest
    from typer.testing import CliRunner

    from scattergories_tools.shared.context import Deps

    from .fakes import FakeProviderFactory


def test_doctor_reports_missing_optional_bits(
    runner: CliRunner,
    deps: Deps,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Doctor exits non-zero when optional runtime pieces are missing."""
    monkeypatch.delenv("HF_TOKEN", raising=False)

    def fail_translator() -> Callable[[str, str, str], str]:
        msg = "Argos missing for test"
        raise RuntimeError(msg)

    result = runner.invoke(cli.app, ["doctor"], obj=replace(deps, translator=fail_translator))

    assert result.exit_code == 1
    assert "[OK] registry:" in result.stdout
    assert "[WARN] hf_token: missing" in result.stdout
    assert "[WARN] argos: Argos missing for test" in result.stdout


def test_doctor_reports_healthy_environment(
    runner: CliRunner,
    deps: Deps,
    fake_provider_factory: FakeProviderFactory,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Doctor succeeds when the repo layout and optional dependencies are ready."""
    monkeypatch.setenv("HF_TOKEN", "token-for-test")
    cli_deps = replace(deps, translator=lambda: fake_provider_factory().translate)

    result = runner.invoke(cli.app, ["doctor"], obj=cli_deps)

    assert result.exit_code == 0
    assert "[OK] hf_token: set" in result.stdout
    assert "[OK] argos: available" in result.stdout
    assert "[WARN]" not in result.stdout
