"""Doctor command for runtime and repo health checks."""

import os
import sys

import typer

from scattergories_tools.shared.context import create_context
from scattergories_tools.translate.engine import build_provider


def doctor() -> None:
    """Validate runtime, optional dependencies, and repo path health."""
    context = create_context()
    paths = context.paths
    hf_token = os.environ.get("HF_TOKEN")

    checks: list[tuple[str, bool, str]] = []
    checks.append(
        (
            "python",
            sys.version_info >= (3, 14),
            f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        )
    )
    checks.append(("registry", paths.registry_path.is_file(), str(paths.registry_path)))
    checks.append(
        (
            "generated_weights_parent",
            paths.generated_weights_path.parent.is_dir(),
            str(paths.generated_weights_path.parent),
        )
    )
    checks.append(("locale_dir", paths.locale_dir.is_dir(), str(paths.locale_dir)))
    checks.append(
        (
            "category_source",
            paths.categories_source_path.is_file(),
            str(paths.categories_source_path),
        )
    )
    checks.append(
        (
            "locale_source",
            paths.locale_payload_source_path.is_file(),
            str(paths.locale_payload_source_path),
        )
    )
    checks.append(
        (
            "hf_token",
            bool(hf_token),
            "set" if hf_token else "missing",
        )
    )

    try:
        build_provider("argos")
    except RuntimeError as error:
        checks.append(("argos", False, str(error)))
    else:  # pragma: no cover - exercised only when optional deps are installed
        checks.append(("argos", True, "available"))

    overall_ok = True
    for name, ok, detail in checks:
        overall_ok = overall_ok and ok if name != "hf_token" else overall_ok
        status = "OK" if ok else "WARN"
        typer.echo(f"[{status}] {name}: {detail}")

    if not overall_ok:
        raise typer.Exit(code=1)
