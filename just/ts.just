# Install node_modules, writing pnpm-lock.yaml if it is missing. CI uses --frozen-lockfile.
ts-sync:
    pnpm install

<<<<<<< before updating
# What CI runs: lint and unused code, types, tests, build, bundle budget, licenses, dependency audit.
=======
# What CI runs: lint and unused code, types, tests, build, bundle budget, dependency audit, licenses.
>>>>>>> after updating
ts-check:
    pnpm run check
    pnpm run typecheck
    pnpm run coverage
    pnpm run build
    pnpm run budget
    pnpm run licenses
    pnpm audit --prod --audit-level=moderate
    pnpm run licenses

# Fix what biome can fix, then format.
ts-fmt:
    pnpm run fix

# Tests with a coverage summary.
ts-cov:
    pnpm run coverage

# Tests only; extra arguments reach vitest (`just ts-test -t name`).
ts-test *args:
    pnpm exec vitest run {{ args }}

<<<<<<< before updating
# Playwright against the production build: the accessibility and CSP specs.
# Install browsers once: `pnpm exec playwright install chromium firefox webkit`.
=======
# Install the browser once per machine: `pnpm exec playwright install chromium`.

# Playwright against the production build: the accessibility and CSP specs.
>>>>>>> after updating
ts-e2e *args:
    pnpm run test:e2e {{ args }}

# The files go into the gitignored shots/ (`<route>-<width>-<scheme>.png`). It builds
# and serves the app like ts-e2e.

# Screenshot every route at 390 and 1440 px, light and dark.
ts-shots:
    rm -rf ./shots
    SHOTS=1 pnpm exec playwright test --project shots

# Capture the social card's dial from the app, at 3x, light and dark, into docs/og-card/.
og-card-capture:
    SHOTS=1 pnpm exec playwright test --project=shots og-card

# Render docs/og-card.html to public/og.png; `just og-card --option dark --out file` draws the dark one.
og-card *args:
    node scripts/og-card.mjs {{ args }}
