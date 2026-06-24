"""Logging helpers for CLI commands."""

import logging

NOISY_LOGGERS = (
    "datasets",
    "datasets.packaged_modules",
    "huggingface_hub",
    "httpx",
    "httpcore",
)


def configure_logging(*, verbose: bool, debug_hf: bool = False) -> None:
    """Configure CLI logging and suppress noisy third-party logs by default."""
    logging.basicConfig(level=logging.WARNING, format="%(levelname)s: %(message)s")
    root_logger = logging.getLogger("scattergories_tools")
    root_logger.setLevel(logging.DEBUG if verbose else logging.INFO)
    if not debug_hf:
        for noisy_logger in NOISY_LOGGERS:
            logging.getLogger(noisy_logger).setLevel(logging.WARNING)
