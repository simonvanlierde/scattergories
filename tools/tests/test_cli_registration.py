"""Smoke tests for the assembled CLI command tree."""

from typing import TYPE_CHECKING

from scattergories_tools import cli

if TYPE_CHECKING:
    from typer.testing import CliRunner


def test_cli_registers_public_command_groups(runner: CliRunner) -> None:
    """The assembled CLI exposes the documented public commands."""
    result = runner.invoke(cli.app, ["--help"])

    assert result.exit_code == 0
    assert "doctor" in result.stdout
    assert "weights" in result.stdout


def test_cli_registers_weight_subcommands(runner: CliRunner) -> None:
    """Nested command groups expose their public subcommands."""
    weights_result = runner.invoke(cli.app, ["weights", "--help"])

    assert weights_result.exit_code == 0
    assert "sample" in weights_result.stdout
    assert "locales" in weights_result.stdout
