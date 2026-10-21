"""Doctor command for runtime and repo health checks."""

import os
import sys

import typer

from scattergories_tools.shared.context import Deps


def doctor(ctx: typer.Context) -> None:
    """Validate the runtime, the HF token, and repo path health."""
    deps = ctx.ensure_object(Deps)
    context = deps.create_context()
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

    overall_ok = True
    for name, ok, detail in checks:
        if not ok and name != "hf_token":  # hf_token is non-gating
            overall_ok = False
        status = "OK" if ok else "WARN"
        typer.echo(f"[{status}] {name}: {detail}")

    if not overall_ok:
        raise typer.Exit(code=1)
