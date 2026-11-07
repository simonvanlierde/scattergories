# WCAG 2.2 assessment record

Status: not assessed. Updated 7 November 2026.

This is an evidence inventory, not a completed WCAG evaluation. No criterion is marked Pass on the strength of an automated scan alone. No independent audit or manual assistive-technology session is recorded.

## Evidence available

| Check | Evidence in the repository | Limit |
| --- | --- | --- |
| Automated accessibility scans | `tests/e2e/a11y.spec.ts`, `tests/a11y.spec.ts` | axe-core detects only some barriers. |
| Reflow | `tests/e2e/reflow.spec.ts`, `tests/layout.spec.ts` | A 320 CSS pixel viewport does not establish browser-zoom behavior. |
| Keyboard and dialog behavior | `tests/game-flow.spec.ts`, `tests/onboarding.spec.ts` | Scripted flows do not establish complete keyboard or screen-reader use. |
| Contrast | `tests/contrast.spec.ts` and axe-core | Selected states and rendered colors only. |
| Touch targets | `tests/layout.spec.ts` | Selected controls and viewport sizes only. |
| Reduced motion | `src/styles/base.css` | Implementation evidence; manual usability assessment remains open. |

## Remaining assessment

Every applicable WCAG 2.2 level A and AA criterion still needs an explicit result with supporting evidence. Record Pass, Fail or Not applicable, the browser and assistive technology where relevant, and the date of each check.

The manual assessment must include keyboard-only use, focus visibility and order, screen-reader announcements during a round, zoom and text-spacing changes, orientation, touch controls and all error states. Record any confirmed barriers in the [accessibility statement](accessibility.md).
