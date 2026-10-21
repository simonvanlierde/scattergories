# Install the venv, writing uv.lock if it is missing or stale. CI uses --locked.
py-sync:
    uv --directory tools sync

# What CI runs: lint, format check, types, tests, dependency audit.
py-check:
    uv --directory tools run ruff check
    uv --directory tools run ruff format --check
    uv --directory tools run ty check
    uv --directory tools run sg-tools weights verify
    uv --directory tools run pytest
    # stanza 1.10.1 (PYSEC-2026-3075): argostranslate pins it, and only the opt-in
    # translation group installs it. Drop the ignore once argostranslate allows 1.12.2.
    uv --directory tools audit --locked --preview-features audit-command --ignore PYSEC-2026-3075

# Fix what ruff can fix, then format.
py-fmt:
    uv --directory tools run ruff check --fix
    uv --directory tools run ruff format

# Tests with a coverage summary.
py-cov:
    uv --directory tools run pytest --cov --cov-report=term-missing

# Tests only; extra arguments reach pytest (`just py-test -k name`).
py-test *args:
    uv --directory tools run pytest {{ args }}
