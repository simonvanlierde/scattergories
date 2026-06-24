"""Runtime context shared by CLI commands."""

from dataclasses import dataclass

from scattergories_tools.shared.paths import RepoPaths, default_repo_paths
from scattergories_tools.shared.registry import LocaleRegistry, load_locale_registry


@dataclass(frozen=True)
class AppContext:
    """Resolved repo paths and locale registry for one command invocation."""

    paths: RepoPaths
    registry: LocaleRegistry


def create_context() -> AppContext:
    """Load the canonical CLI context from the current repo layout."""
    paths = default_repo_paths()
    return AppContext(paths=paths, registry=load_locale_registry(paths.registry_path))
