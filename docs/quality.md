# Reproducibility & quality

## Reproducible builds

Every dependency is locked (`../pnpm-lock.yaml`, [`tools/uv.lock`](../tools/uv.lock)) and every tool version is pinned ([`.node-version`](../.node-version), the `packageManager` field in [`package.json`](../package.json), and [`tools/.python-version`](../tools/.python-version)). The same checks run locally and in [CI](../.github/workflows/ci.yml). CI runs each one as its own step and also runs `pnpm audit`. The commands are in [CONTRIBUTING](../CONTRIBUTING.md#before-you-open-a-pr).

## Enforced gates

The core game logic in `src/domain/` must keep 95%+ line coverage and 100% function coverage, and the rest of `src/` 60% line coverage (see [`vite.config.ts`](../vite.config.ts)). Each chunk loaded at startup has its own gzip budget: 80 KiB for the main entry, 64 KiB for the React vendor chunk and 24 KiB for the i18n vendor chunk. No image asset may be over 80 KiB ([`scripts/check-bundle-budgets.mjs`](../scripts/check-bundle-budgets.mjs)).

## Accessibility

- **Static lint**: Biome's `a11y` rule group is enabled ([`biome.json`](../biome.json)), so it runs as part of `pnpm lint`.
- **Runtime scan**: [`tests/a11y.spec.ts`](../tests/a11y.spec.ts) runs [axe-core](https://github.com/dequelabs/axe-core) against the live app through `@axe-core/playwright`. It fails on any violation on the idle screen, during an active round, with the prompt deck collapsed, and with the settings sheet or the how-to-play modal open. Run it with `pnpm test:e2e:smoke` (Chromium) or the full `pnpm test:e2e` matrix.

In CI, the axe checks run in Chromium on every pull request to `main`. The full browser matrix runs on the monthly schedule or on a manual run. These checks catch only some issues automatically. They are not a claim of WCAG conformance.
