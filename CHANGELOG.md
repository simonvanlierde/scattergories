# Changelog

All notable changes to Scattergories are listed here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the
project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0] - 2026-11-15

### Added

- A "Keyboard shortcuts" switch in Settings turns off the single-key shortcuts (Space, R, P, C
  and ?). It is on by default and remembered.
- A security policy and a `/.well-known/security.txt` say how to report a vulnerability.
- A "Suggest a category" link in How to play opens a form for proposing a category. The
  contributor guide explains how suggestions are reviewed.

### Changed

- The offline cache keeps the last two builds instead of growing with every release, and a first
  visit stores only the shell, English, your browser's language and the fonts for Latin text,
  plus the Polish or Greek font subset when your browser asks for one of those. Other languages
  are stored when you first use them.
- Hashed files are served from the cache without a refresh, and a slow connection falls back to
  the installed app after 3.5 seconds.
- The social card shown in link previews is redrawn from a live round.
- The page declares its canonical address, so search results and link previews use one URL.
- The pack picker names each pack's audience or difficulty, such as "Kids · young players",
  in every language.
- Category names on a phone are a size larger, for reading from across the table. A name that
  wraps to two lines still fits its row, so twelve categories still fit on screen.
- Greek text uses Noto Serif Display for the letter and titles and Inter for the rest, instead
  of whatever fonts the device has. Only the Greek parts of these fonts are downloaded.
- The second round control is now called "Skip round", so the end of a round no longer shows
  two "Next round" buttons, one of them greyed out.

### Fixed

- A custom category that is already in the deck, that matches a built-in's name in your
  language, or that would pass the limit now says why it was refused and keeps what you typed,
  instead of clearing the field.
- The R, P and C shortcuts follow the letter you type on layouts such as Dvorak, where the key
  labelled R is not in the QWERTY position.
- The screen stays awake for the whole round after you switch to another app and back.
- Editing the deck while the categories roll no longer cancels the roll.
- Screen readers no longer announce toggles as contradictions such as "Unmute, pressed". The
  mute button keeps its changing name, and the pin and category toggles keep a fixed name with
  their state. Pin chips are named by their visible text, for example "1 Birds".
- After the first-run rules close, focus lands on the main button instead of the page top.
  The language list marks each language for screen readers, and the page heading now comes
  first.
- The deck list sorts by your language's alphabet, and a custom category is checked for
  duplicates with that language's capitalization rules.
- The R, P and C shortcuts now work on non-Latin keyboard layouts such as Greek.
- The service worker no longer stores an HTML error page returned for a font or unknown file.
- The pink alarm wash at "Time's up!" is one brief flash again, instead of staying on for
  about 3 seconds. With reduced motion it shows as a still half-second tint.
- On a portrait tablet, and with the categories folded on a phone, the ring and letter grow to
  fill the free space instead of stopping at 20rem. The folded categories bar sits at the bottom.
- At 200% text size on a phone, the category tools wrap onto their own row instead of going off
  screen, and the round controls stack so the main button stays in view.
- Text fields and menus have a darker edge (3:1), and hints and labels in the dark theme's
  sheets are lighter, so both meet WCAG AA contrast.
- The add-a-pack menu in the deck sheet has one border instead of a box inside a box.
- On a slow first load the page shows the die and the name on the app's paper, in light or dark,
  instead of a blank white page.
- An empty deck now shows a "Customize deck" button under its message, which opens the deck
  sheet.
- The "Avoid letter repeats" checkbox is larger (20 px), and its whole row is at least 44 px tall.

## [0.4.0] - 2026-11-11

### Added

- Privacy and accessibility statements, linked from How to play in every language.
- A "Letter odds" section in How to play shows each letter's chance of being drawn in your
  language, with where the numbers come from.
- Polish rounds can now land on Ł, Ś and Ż. Rarer Polish initials such as Ć and Ź still
  count toward C and Z.
- A Grown-ups category pack. Add it to your deck for Offensive Words, Swear Words,
  Bar Things, Beers, Crimes, Weapons, Deadly Things and Medicine/Drugs.
- While a skip is armed, "Tap again" now shows as text under the controls, so it is
  visible on touch screens too.
- A quiet round count ("Round 4") inside the timer ring, so the table knows where it is. It
  counts the rounds started since the app was opened and starts again at 1 on reload.

### Changed

- Bolder letters, stronger category text and numbered ruled rows make the board easier to scan.
  The final seconds use a steady, thicker timer arc; time's up gives one brief screen cue.
- The adult categories listed above are no longer in the Classic pack or the default
  deck. A deck you already saved keeps them. The pack that was labelled "All" is now
  called "Classic".
- Letter draws follow how often each letter starts a word, and with "avoid repeats" on
  they skip the last 8 letters drawn. Before, every letter came up exactly once per
  cycle, so rare letters such as Q, X and Z bunched up at the end.
- On a phone, the letter and its ring grow to fill the space the categories leave.
- New letter and Next round now have visible labels as well as icons.
- Every control in the settings and deck sheets is at least 44 px tall, so it is easier
  to tap.
- The timer uses the app's own font with even-width digits.
- "Time's up!" now lands as one clear beat you can catch from across the table: the ring
  closes thick and "Time's up!" stamps down while the letter settles. With reduced motion
  turned on, it simply appears.
- The letter roll and the get-ready countdown read from every seat: each letter drops in
  like a reel stopping, and the ring fills once per get-ready second with a tick.

### Fixed

- Reopening the app follows the current system theme unless you chose a theme yourself.
- Cache read failures no longer block online assets, and an interrupted update keeps the last complete offline build.
- Pausing a round now announces "Paused" to screen readers.
- Deck actions stay inside the sheet when a translated heading or button wraps.
- Changing languages during a letter roll no longer leaves the game stuck spinning.
- Twelve categories fit without scrolling on a landscape tablet.
- The complete category deck and all valid pins now survive a reload.
- Offline play works after the first visit, including the privacy and accessibility pages.
- Online play continues when the browser cannot write to its offline file cache.
- French now addresses you with the informal "tu" throughout.
- More translation fixes after a second review in all eight languages: how-to-play text, timer labels with a space before the unit ("10 s"), and category names that read naturally.
- Translation fixes after a review in Dutch, Greek, Italian, Polish and
  Portuguese, mostly category names that now read as a list item.
- A language that fails to load once no longer switches you to English for good.
- Pins are locked while the round clock runs, like Redraw.
- The first-run rules open at their intro instead of scrolled down to the start button.
- The unpinned pin icon has enough contrast to see in both themes.
- Long button labels wrap instead of being cut off on narrow phones.
- On a 320 px phone the board no longer runs past the right edge of the screen, and a long
  "Time's up!", as in German or Portuguese, fits inside the small timer ring.

### Security

- The site now sends stricter response headers: HSTS, a ban on being framed, cross-origin
  isolation for windows and files, and a content policy that also blocks inline styles and
  form submissions.

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

[Unreleased]: https://github.com/simonvanlierde/scattergories/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/simonvanlierde/scattergories/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/simonvanlierde/scattergories/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/simonvanlierde/scattergories/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/simonvanlierde/scattergories/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/simonvanlierde/scattergories/releases/tag/v0.1.0
