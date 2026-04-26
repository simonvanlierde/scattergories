"""Typer CLI for Scattergories tooling."""

import typer

from scattergories_tools.commands import doctor, translate, weights
from scattergories_tools.commands.options import false_default
from scattergories_tools.shared.logging import configure_logging

app = typer.Typer(help="Scattergories data tools")
app.command("doctor")(doctor.doctor)
app.add_typer(weights.app, name="weights")
app.add_typer(translate.app, name="translate")


@app.callback()
def main_callback(
    *,
    verbose: bool = typer.Option(false_default(), "--verbose", help="Enable verbose logs."),
    debug_hf: bool = typer.Option(false_default(), "--debug-hf", help="Show Hugging Face logs."),
) -> None:
    """Configure logging before subcommands run."""
    configure_logging(verbose=verbose, debug_hf=debug_hf)


def main() -> None:
    """Run the Typer app."""
    app()


if __name__ == "__main__":
    main()
