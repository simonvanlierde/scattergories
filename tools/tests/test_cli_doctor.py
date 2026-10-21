"""Behavior tests for `sg-tools doctor`."""

from typing import TYPE_CHECKING

from scattergories_tools import cli

if TYPE_CHECKING:
    import pytest
    from typer.testing import CliRunner

    from scattergories_tools.shared.context import Deps


def test_doctor_warns_without_hf_token_but_passes(
    runner: CliRunner,
    deps: Deps,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A missing HF token is a warning, not a failure."""
    monkeypatch.delenv("HF_TOKEN", raising=False)

    result = runner.invoke(cli.app, ["doctor"], obj=deps)

    assert result.exit_code == 0
    assert "[OK] registry:" in result.stdout
    assert "[WARN] hf_token: missing" in result.stdout


def test_doctor_fails_when_repo_layout_is_broken(
    runner: CliRunner,
    deps: Deps,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Doctor exits non-zero when a required path is missing."""
    monkeypatch.setenv("HF_TOKEN", "token-for-test")
    deps.create_context().paths.registry_path.unlink()

    result = runner.invoke(cli.app, ["doctor"], obj=deps)

    assert result.exit_code == 1
    assert "[WARN] registry:" in result.stdout


def test_doctor_reports_healthy_environment(
    runner: CliRunner,
    deps: Deps,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Doctor succeeds when the repo layout is in place and the HF token is set."""
    monkeypatch.setenv("HF_TOKEN", "token-for-test")
    result = runner.invoke(cli.app, ["doctor"], obj=deps)

    assert result.exit_code == 0
    assert "[OK] hf_token: set" in result.stdout
    assert "[WARN]" not in result.stdout
