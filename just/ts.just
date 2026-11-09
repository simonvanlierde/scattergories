# Install node_modules, writing pnpm-lock.yaml if it is missing. CI uses --frozen-lockfile.
ts-sync:
    pnpm install

# What CI runs: lint and unused code, types, tests, build, bundle budget, dependency audit.
ts-check:
    pnpm run check
    pnpm run typecheck
    pnpm run coverage
    pnpm run build
    pnpm run budget
    pnpm audit --prod --audit-level=moderate

# Fix what biome can fix, then format.
ts-fmt:
    pnpm run fix

# Tests with a coverage summary.
ts-cov:
    pnpm run coverage

# Tests only; extra arguments reach vitest (`just ts-test -t name`).
ts-test *args:
    pnpm exec vitest run {{ args }}

# Playwright against the production build: the accessibility and CSP specs.
# Install the browser once per machine: `pnpm exec playwright install chromium`.
ts-e2e *args:
    pnpm run test:e2e {{ args }}

# Screenshot every route at 390 and 1440 px, light and dark, into the gitignored
# shots/ (`<route>-<width>-<scheme>.png`). Builds and serves the app like ts-e2e.
ts-shots:
    rm -rf ./shots
    SHOTS=1 pnpm exec playwright test --project shots
