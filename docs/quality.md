# Reproducibility & quality

## Reproducible builds

Every dependency is locked (`../pnpm-lock.yaml`, [`tools/uv.lock`](../tools/uv.lock)) and every tool version is pinned ([`.node-version`](../.node-version), the `packageManager` field in [`package.json`](../package.json), and [`tools/.python-version`](../tools/.python-version)), so a clean checkout builds identically. The same gates run locally, in pre-push hooks ([`lefthook.yml`](../lefthook.yml)), and in [CI](../.github/workflows/ci.yml):

```bash
pnpm check        # typecheck (tsc) + spellcheck (cspell) + lint (biome)
pnpm test         # unit / component tests (vitest)
pnpm test:e2e     # end-to-end tests (playwright)
pnpm verify       # check + test + build + bundle-size budget
pnpm run ci       # verify, then the Python tools' ruff, format check, ty, table check and pytest
```

## Enforced gates

Quality is enforced, not just encouraged: the core game logic in `src/domain/game/` is held to 95%+ line and 100% function coverage (see [`vite.config.ts`](../vite.config.ts)), and each chunk loaded at startup has its own gzip budget: 80 KiB for the main entry, 64 KiB for the React vendor chunk and 24 KiB for the i18n vendor chunk, with no image asset over 80 KiB ([`scripts/check-bundle-budgets.mjs`](../scripts/check-bundle-budgets.mjs)).

## Accessibility

Two automated checks run, both wired into CI:

- **Static lint**: Biome's `a11y` rule group is enabled ([`biome.json`](../biome.json)), so accessibility lint rules run as part of `pnpm lint`.
- **Runtime scan**: [`tests/a11y.spec.ts`](../tests/a11y.spec.ts) runs [axe-core](https://github.com/dequelabs/axe-core) against the live app via `@axe-core/playwright`, asserting no violations on the idle screen, during an active round, with the prompt deck collapsed, and with the settings sheet or the how-to-play modal open. Run it with `pnpm test:e2e:smoke` (Chromium) or the full `pnpm test:e2e` matrix.

In CI, the axe checks run in Chromium on every pull request to `main`; the full browser matrix runs on the monthly schedule or a manual dispatch. These catch a subset of issues automatically, they are not a claim of WCAG conformance.
