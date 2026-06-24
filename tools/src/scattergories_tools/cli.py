"""Typer CLI for Scattergories tooling."""

from typing import Annotated

import typer

from scattergories_tools.commands import doctor, translate, weights
from scattergories_tools.shared.logging import configure_logging

app = typer.Typer(help="Scattergories data tools")
app.command("doctor")(doctor.doctor)
app.add_typer(weights.app, name="weights")
app.add_typer(translate.app, name="translate")


@app.callback()
def main_callback(
    *,
    verbose: Annotated[bool, typer.Option("--verbose", help="Enable verbose logs.")] = False,
    debug_hf: Annotated[
        bool, typer.Option("--debug-hf", help="Show Hugging Face logs.")
    ] = False,
) -> None:
    """Configure logging before subcommands run."""
    configure_logging(verbose=verbose, debug_hf=debug_hf)


def main() -> None:
    """Run the Typer app."""
    app()


if __name__ == "__main__":
    main()
