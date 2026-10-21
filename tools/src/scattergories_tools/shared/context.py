"""Runtime context shared by CLI commands."""

from dataclasses import dataclass
from typing import TYPE_CHECKING

from scattergories_tools.shared.paths import RepoPaths, default_repo_paths
from scattergories_tools.shared.registry import LocaleRegistry, load_locale_registry
from scattergories_tools.weights.analyze import (
    LocaleAnalysis,
    SampleAnalysis,
    analyze_locale,
    analyze_sample_dataset,
)

if TYPE_CHECKING:
    from collections.abc import Callable


@dataclass(frozen=True)
class AppContext:
    """Resolved repo paths and locale registry for one command invocation."""

    paths: RepoPaths
    registry: LocaleRegistry


def create_context() -> AppContext:
    """Load the canonical CLI context from the current repo layout."""
    paths = default_repo_paths()
    return AppContext(paths=paths, registry=load_locale_registry(paths.registry_path))


@dataclass(frozen=True)
class Deps:
    """What the commands reach outside the process for, passed as the Typer context object.

    Tests pass their own through `CliRunner.invoke(..., obj=Deps(...))`.
    """

    create_context: Callable[[], AppContext] = create_context
    analyze_locale: Callable[..., LocaleAnalysis] = analyze_locale
    analyze_sample_dataset: Callable[..., SampleAnalysis] = analyze_sample_dataset
