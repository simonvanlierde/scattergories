# WCAG 2.2 assessment record

Assessed on 15 November 2026 by the maintainer, against the code at commit `81fee71`, for WCAG 2.2 levels A and AA. Success criterion 4.1.1 is obsolete in 2.2 and is left out. Level AAA is out of scope.

Result: 4 criteria fail, 4 are not assessed, the rest pass or do not apply. Conformance is partial. No independent audit has been done, and no assistive technology was used.

## How the results were found

- **Automated runs**, in Chromium on 15 November 2026: `E2E_PORT=<port> pnpm exec playwright test tests/a11y.spec.ts tests/e2e/a11y.spec.ts tests/e2e/reflow.spec.ts tests/contrast.spec.ts tests/layout.spec.ts tests/e2e/accessibility-statement.spec.ts tests/game-flow.spec.ts tests/onboarding.spec.ts --project=chromium`. All 40 tests passed.
- **Contrast probe**, same day: a throwaway Playwright script measured the rendered text and field-border colors on the idle screen, the settings sheet and the how-to-play sheet, in both themes. It is not in the repository.
- **Keyboard probe**, same day: a throwaway Playwright script tabbed through the idle screen, opened and closed the settings sheet by keyboard and started a round with Space. It is not in the repository.
- **Code reading** for everything else. A code reading is the only evidence for a Pass marked "code".

Passing axe-core is not a conformance claim: it detects only some barriers, and the existing axe specs scan the dark theme only on the three document routes.

## Results

| SC | Level | Result | Evidence |
| --- | --- | --- | --- |
| 1.1.1 Non-text content | A | Pass | Icons are `aria-hidden` and icon buttons carry a label (`src/shared/ui/IconButton.tsx`); axe in `tests/a11y.spec.ts`. |
| 1.2.1 to 1.2.5 Time-based media | A, AA | Not applicable | No recorded audio or video. The tick and alarm tones are generated. |
| 1.3.1 Info and relationships | A | Pass | Fieldsets with legends, lists, labelled sheets and `aria-pressed` toggles; axe in `tests/a11y.spec.ts`. |
| 1.3.2 Meaningful sequence | A | Pass | Code: DOM order matches reading order; tab order in the keyboard probe followed it. |
| 1.3.3 Sensory characteristics | A | Pass | Code: instructions name controls by label, not by shape or position. |
| 1.3.4 Orientation | AA | Pass | No `orientation` in `public/manifest.json`; landscape in `tests/layout.spec.ts`. |
| 1.3.5 Identify input purpose | AA | Not applicable | No fields collect personal data. |
| 1.4.1 Use of color | A | Pass | Code: ring urgency also changes stroke width (`src/styles/playmat.css`) and is announced as text. |
| 1.4.2 Audio control | A | Pass | Sounds are short; the mute button is in the footer. |
| 1.4.3 Contrast (minimum) | AA | **Fail** | Dark theme `--text-muted` measures 4.41:1 on the raised surface (`src/styles/tokens.css`, used by hints and section titles in the settings and how-to-play sheets). Light theme passes. |
| 1.4.4 Resize text | AA | Not assessed | Code uses rem units and the viewport allows zoom (`index.html`). Needs a 200% check on a device. |
| 1.4.5 Images of text | AA | Pass | All text is live text. |
| 1.4.10 Reflow | AA | Pass | `tests/e2e/reflow.spec.ts` at 320 px; `tests/layout.spec.ts` at 320 px in three languages. 400% browser zoom is covered by the open manual checks. |
| 1.4.11 Non-text contrast | AA | **Fail** | Text field and select borders measure 1.4:1 in light and 1.5:1 in dark (`--border-default`, `.ds-field__control` in `src/styles/primitives.css`). The pin icon passes (`tests/contrast.spec.ts`). |
| 1.4.12 Text spacing | AA | Not assessed | Needs the spacing overrides on a device. |
| 1.4.13 Content on hover or focus | AA | Pass | Only native `title` tooltips. |
| 2.1.1 Keyboard | A | Pass | Keyboard probe: every control is reachable and operable; controls are native elements. |
| 2.1.2 No keyboard trap | A | Pass | Keyboard probe: Escape closes the settings sheet and focus returns to its button. |
| 2.1.4 Character key shortcuts | A | Pass | Shortcuts can be turned off in settings (`src/app/useKeyboardShortcuts.ts`, `src/features/settings/SettingsCluster.tsx`). |
| 2.2.1 Timing adjustable | A | Pass | Round length and countdown are set by the player. The 3 second skip confirmation lapses without loss. |
| 2.2.2 Pause, stop, hide | A | Pass | The round pauses with the button or P. The alarm flash plays once. |
| 2.3.1 Three flashes | A | Pass | One 520 ms flash (`alarm-flash` in `src/styles/components.css`). |
| 2.4.1 Bypass blocks | A | Pass | One `main` landmark and a short tab path; no repeated blocks. |
| 2.4.2 Page titled | A | Pass | `index.html`; titles for the document pages in `src/app/LegalPages.tsx`. |
| 2.4.3 Focus order | A | Pass | Keyboard probe: tab order is action, categories, footer. Sheets return focus on close. |
| 2.4.4 Link purpose | A | Pass | Link text describes the target. |
| 2.4.5 Multiple ways | AA | Not applicable | One screen and two linked documents. |
| 2.4.6 Headings and labels | AA | Pass | Headings and labels describe their content; one `h1` first in `main`. |
| 2.4.7 Focus visible | AA | Pass | Keyboard probe: a 2 px outline on every control; rules in `src/styles/base.css`. |
| 2.4.11 Focus not obscured (minimum) | AA | Not assessed | The sticky start button on the first-run sheet (`.howto__start`) may cover a focused element. |
| 2.5.1 Pointer gestures | A | Not applicable | Taps only. |
| 2.5.2 Pointer cancellation | A | Pass | Actions run on `click`; the sheet backdrop needs press and release on the backdrop (`src/shared/ui/Sheet.tsx`). |
| 2.5.3 Label in name | A | Pass | Code: category chips are named by their visible text, with state in `aria-pressed` (`src/features/categories/CategoryChecklist.tsx`). |
| 2.5.4 Motion actuation | A | Not applicable | No motion input. |
| 2.5.7 Dragging movements | AA | Not applicable | No dragging. |
| 2.5.8 Target size (minimum) | AA | Pass | `tests/layout.spec.ts` checks the sheet controls at 44 px or more. |
| 3.1.1 Language of page | A | Pass | `tests/a11y.spec.ts` checks the document language follows the locale. |
| 3.1.2 Language of parts | AA | Pass | Language options carry `lang` (`src/features/settings/SettingsCluster.tsx`). |
| 3.2.1 On focus | A | Pass | Nothing changes on focus. |
| 3.2.2 On input | A | Pass | Language and theme apply at once, as the control's label says; no change of context. |
| 3.2.3 Consistent navigation | AA | Pass | The footer controls keep one place. |
| 3.2.4 Consistent identification | AA | Pass | Shared icon-button component and labels. |
| 3.2.6 Consistent help | A | Pass | The how-to-play button is always last in the footer. |
| 3.3.1 Error identification | A | **Fail** | A custom category that repeats a name, or exceeds the cap, is dropped and the field clears with no message (`addCustom` in `src/features/settings/SettingsProvider.tsx`). |
| 3.3.2 Labels or instructions | A | Pass | Fields have labels and hints linked by `aria-describedby`. |
| 3.3.3 Error suggestion | AA | **Fail** | Same cause as 3.3.1: nothing tells the player why the entry was refused. |
| 3.3.4 Error prevention | AA | Not applicable | No legal, financial or stored-account submissions. |
| 3.3.7 Redundant entry | A | Not applicable | No multi-step entry. |
| 3.3.8 Accessible authentication (minimum) | AA | Not applicable | No authentication. |
| 4.1.2 Name, role, value | A | Pass | Native controls; toggles keep a stable name and set `aria-pressed`; axe in `tests/a11y.spec.ts`. |
| 4.1.3 Status messages | AA | Not assessed | Polite and assertive live regions are in place (`src/features/round/Playmat.tsx`, `ActionBar.tsx`). Whether a screen reader announces them as intended is untested. |

## Manual checks still open

These need a person with the right setup. Until they are done the criteria stay "Not assessed".

- Screen reader (VoiceOver on iOS, NVDA or TalkBack): a full round, the thresholds and the end of round (4.1.3), and the names and states of toggles (4.1.2).
- 200% browser zoom and 400% zoom on a real device, for 1.4.4 and 1.4.10.
- Text spacing overrides (line height 1.5, paragraph 2 times, letter 0.12 em, word 0.16 em) in each language (1.4.12).
- Keyboard focus against the sticky start button on the first-run sheet at a small height (2.4.11).
- Forced colors and high-contrast modes, which no check here covers.
