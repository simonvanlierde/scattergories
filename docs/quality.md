# Reproducibility & quality

## Reproducible builds

Every dependency is locked (`../pnpm-lock.yaml`, [`tools/uv.lock`](../tools/uv.lock)) and every tool version is pinned ([`.node-version`](../.node-version), the `packageManager` field in [`package.json`](../package.json), and [`tools/.python-version`](../tools/.python-version)). The same checks run locally (`just check`) and in CI: [`ts.yml`](../.github/workflows/ts.yml) for the app, [`python.yml`](../.github/workflows/python.yml) for `tools/`, and [`checks.yml`](../.github/workflows/checks.yml) for the git hooks and dependency review. Both stacks audit their dependencies: `pnpm audit --prod` and `uv audit`. The commands are in [CONTRIBUTING](../CONTRIBUTING.md#before-you-open-a-pr).

## Enforced gates

The core game logic in `src/domain/` must keep 95%+ line coverage and 100% function coverage, and the rest of `src/` 60% line coverage (see [`vitest.config.ts`](../vitest.config.ts)). Each chunk loaded at startup has its own gzip budget: 80 KiB for the main entry, 64 KiB for the React vendor chunk and 24 KiB for the i18n vendor chunk. No image asset may be over 80 KiB ([`scripts/check-bundle-budgets.mjs`](../scripts/check-bundle-budgets.mjs)). On top of those, no JavaScript file, lazy chunks included, may be over 68 KiB gzipped ([`scripts/checkBundleBudget.mjs`](../scripts/checkBundleBudget.mjs)).

## Accessibility

- **Static lint**: Biome's `a11y` rule group is enabled ([`biome.json`](../biome.json)), so it runs as part of `pnpm check`.
- **Runtime scan**: [`tests/a11y.spec.ts`](../tests/a11y.spec.ts) runs [axe-core](https://github.com/dequelabs/axe-core) against the live app through `@axe-core/playwright`. It fails on any violation on the idle screen, during an active round, with the prompt deck collapsed, and with the settings sheet or the how-to-play modal open. Run it with `pnpm test:e2e:smoke` (Chromium) or the full `pnpm test:e2e` matrix.
- **Every route, both color schemes**: [`tests/e2e/a11y.spec.ts`](../tests/e2e/a11y.spec.ts) checks each route in [`tests/e2e/routes.ts`](../tests/e2e/routes.ts) in light and dark mode against WCAG 2.0, 2.1 and 2.2 levels A and AA and axe's best-practice rules. [`tests/e2e/reflow.spec.ts`](../tests/e2e/reflow.spec.ts) checks that no route scrolls sideways at 320 px, and [`tests/e2e/csp.spec.ts`](../tests/e2e/csp.spec.ts) runs the built app under the Content-Security-Policy in [`public/_headers`](../public/_headers).

In CI, every pull request to `main` runs all of these in Chromium, and the `@smoke` tests in Firefox, WebKit and the two mobile projects. These checks catch only some issues automatically. They are not a claim of WCAG conformance.
