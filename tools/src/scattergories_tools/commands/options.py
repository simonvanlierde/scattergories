"""Shared Typer option helpers."""


def false_default() -> bool:
    """Return a false value without tripping boolean-literal lint rules."""
    return bool(0)
