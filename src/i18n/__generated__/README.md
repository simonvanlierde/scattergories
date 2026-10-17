# Letter-weight table

[`letterWeights.json`](letterWeights.json) holds how often each letter starts a distinct word in
each language. The game uses it to roll common, playable letters more often. The Python tools in
[`tools/`](../../../tools/README.md) generate the table, and the app imports it as JSON. Don't edit
it by hand.

[`letterWeights.meta.json`](letterWeights.meta.json) records where the numbers came from, how much
text each locale's numbers rest on, and the SHA-256 of `letterWeights.json`. CI runs `sg-tools weights verify` and fails when the two files
disagree, so the table cannot change without its metadata. The check reads only these two files
and never downloads the corpus.

## What is in the table

The table maps a locale code to a map of letter to weight. Keys are sorted, and each weight is
printed with at most 8 decimals and no trailing zeros, so regenerating from the same corpus gives
the same bytes.

| Field | Meaning | Unit |
|---|---|---|
| locale key | Language code from [`registry.json`](../locales/registry.json) | `en`, `el`, ... |
| letter key | One letter of that language's game alphabet | uppercase letter |
| weight | Share of counted distinct words whose initial folded to this letter | fraction from 0 to 1, 8 decimals; a locale's weights sum to about 1 |

A word is a run of letters, and each distinct word counts once, ignoring case, so frequent words
such as "the" and "of" do not inflate their letters. Accents are stripped and
stroked letters folded (`Á` counts as `A`, `Ł` as `L`), and initials that fold to no letter of the
alphabet are skipped. The game draws each letter with a chance proportional to its weight, so a
letter with twice the weight comes up about twice as often; with "avoid repeats" on, it skips the
last 12 letters drawn.

## Metadata fields

| Field | Meaning |
|---|---|
| `tableVersion` | Version of the table, `x.y.z`. Bump the major version when the method or corpus changes, the minor version when locales are added, the patch version for anything else that changes the numbers |
| `sha256` | SHA-256 of `letterWeights.json` as committed |
| `corpus` | Hugging Face dataset id, snapshot date and split. Each locale reads config `<snapshot>.<locale>` |
| `maxBytesPerLocale` | Cap on article text read per locale, in UTF-8 bytes |
| `samples` | Per locale: `sourceCount` (articles read), `total` (distinct words counted) and `processedBytes` (UTF-8 bytes of article text read). Its keys must match the table's locales |
| `generator` | Tool name, its version and the git commit it ran from |
| `generatedOn` | Date the table was generated (UTC) |

The sample is the first articles of each language's dataset, in dataset order, up to the byte
cap. It is not a random sample of Wikipedia.

## Regenerate

From `tools/`, with network access to Hugging Face (about 150 MB of text per locale):

```bash
just weights-locales-write
```

This writes the table and its metadata. Both are already in Biome's format, so the checksum holds
as written. Bump `tableVersion` in the metadata by hand when the numbers change, then commit both
files. `just weights-verify` runs the CI check locally.

## Licence

The corpus is Wikipedia article text, which is licensed under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) (and the GFDL).

The table holds only counts and ratios of first letters. No article text, word or sentence can be
recovered from it. We consider such aggregate statistics facts about the text rather than an
adaptation of it, so share-alike does not apply and the table is released under this repository's
[MIT licence](../../../LICENSE). We credit Wikipedia's contributors anyway: the weights are
derived from Wikipedia (wikimedia/wikipedia, snapshot 20231101).

This is our reading, not legal advice. Whether statistics derived from a
licensed text count as an adaptation is not settled law, and in the EU the database right in
Wikipedia's collection may also apply. If you need certainty for your own reuse, take advice or
treat the table as CC BY-SA 4.0.
