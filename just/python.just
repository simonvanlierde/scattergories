# Install the venv, writing uv.lock if it is missing or stale. CI uses --locked.
py-sync:
    uv --directory tools sync

# What CI runs: lint, format check, types, tests, dependency audit and licenses.
py-check:
<<<<<<< before updating
    uv --directory tools run ruff check
    uv --directory tools run ruff format --check
    uv --directory tools run ty check
    uv --directory tools run sg-tools weights verify
    uv --directory tools run pytest
=======
    uv --directory tools run --locked ruff check
    uv --directory tools run --locked ruff format --check
    uv --directory tools run --locked ty check
    uv --directory tools run --locked pytest
>>>>>>> after updating
    uv --directory tools audit --locked --preview-features audit-command
    d=$(mktemp -d) && trap 'rm -rf "$d"' EXIT && uv --directory tools export --locked --no-default-groups --no-hashes --no-annotate --no-header --no-emit-project -q -o "$d/requirements.txt" && { test ! -s "$d/requirements.txt" || uv --directory tools run --locked --with licensecheck==2026.0.8 licensecheck -r "$d/requirements.txt" --zero; }

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
