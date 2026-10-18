# Changelog

All notable changes to Scattergories are listed here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the
project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Polish rounds can now land on Ł, Ś and Ż. Rarer Polish initials such as Ć and Ź still
  count toward C and Z.
- A Grown-ups category pack. Add it to your deck for Offensive Words, 4-Letter Words,
  Bar Things, Beers, Crimes, Weapons, Deadly Things and Medicine/Drugs.
- While a skip is armed, "Tap again" now shows as text under the controls, so it is
  visible on touch screens too.

### Changed

- The adult categories listed above are no longer in the Classic pack or the default
  deck. A deck you already saved keeps them. The pack that was labelled "All" is now
  called "Classic".
- Letter draws follow how often each letter starts a word, and with "avoid repeats" on
  they skip the last 8 letters drawn. Before, every letter came up exactly once per
  cycle, so rare letters such as Q, X and Z bunched up at the end.
- On a phone, the letter and its ring grow to fill the space the categories leave.
- Every control in the settings and deck sheets is at least 44 px tall, so it is easier
  to tap.
- The timer uses the app's own font with even-width digits.
- Saved settings store the round length, get-ready time and category count as numbers.
  Settings saved by an earlier version still load.

### Fixed

- A language that fails to load once no longer switches you to English for good.
- Pins are locked while the round clock runs, like Redraw.
- The first-run rules open at their intro instead of scrolled down to the start button.
- The unpinned pin icon has enough contrast to see in both themes.
- Long button labels wrap instead of being cut off on narrow phones.

## [0.3.0] - 2026-08-24

### Added

- A confirmation tap before destructive actions.
- A notice when a newer version of the app is available.

### Changed

- Reworked the playmat and category board layout. Drawn cards are sized so a category
  name fits on one line.

### Fixed

- Rounds no longer get stuck or skip ahead because of a stale timer or an out-of-order
  step.
- A language that fails to load shows a working app instead of an empty screen.
- Settings restored from storage are kept within their allowed range.
- The offline cache no longer stores failed responses.
- Keyboard shortcuts no longer fire while a popover is open.
- Text cut off at first load is readable again.

### Security

- The site sends a content security policy.

## [0.2.0] - 2026-07-14

### Changed

- New app icon and favicon: one die in the app's navy and cream. The die in the footer
  rolls whenever a letter is drawn or the categories are redrawn.
- The footer has three controls instead of five: sound, settings and help. Round length,
  the get-ready countdown and letter repeats sit together under Gameplay, each with a
  short explanation. Language is a dropdown, and the light/dark switch shows which one is
  active.
- The first-run welcome and the how-to-play screen are now one dialog, with shorter
  rules. The settings walkthrough is gone.

## [0.1.0] - 2026-07-06

### Added

- Letter rolls that follow the chosen language, so common letters come up more often.
- A round timer with pause and an end-of-round recap.
- Redraw the categories for each letter, or pin a fixed board.
- Built-in and custom category packs, saved in your browser.
- Nine languages: English, Spanish, French, German, Italian, Dutch, Polish, Portuguese and
  Greek.
- Install it as an app and play offline. No account or server needed.

[Unreleased]: https://github.com/simonvanlierde/scattergories/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/simonvanlierde/scattergories/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/simonvanlierde/scattergories/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/simonvanlierde/scattergories/releases/tag/v0.1.0
