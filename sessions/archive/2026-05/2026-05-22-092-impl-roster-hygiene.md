---
session: 2026-05-22-092
role: implementer
date: 2026-05-22
status: complete
slug: roster-hygiene
parent: null
links: []
commits:
  - 73de889
---

# OQ (14) Roster-Excel-Hygiene-Sweep

## Summary

Applied the five-group OQ-(14) hygiene sweep to `Warhammer_Books_SSOT.xlsx` (authors, a series mistag, two format fixes, two title typos, and the missing *Architect of Fate* / *War for Armageddon Omnibus* collection edges), then regenerated `book-roster.json`. The regenerated diff is **exactly** the spec — `books[]` stays 859 with 13 field changes across 11 objects, `collections[]` grows 191 → 196 (5 new edges + 1 confidence/basis bump) — and the loader is re-run byte-stable.

This was a maintainer-authorized one-off where CC did the xlsx edits **and** the regen **and** the commit (the standing OQ-(14) rule is "Owner: Philipp, agents don't edit the xlsx"). Pure data maintenance — no code, no DB touch.

## What I did

- `scripts/seed-data/source/Warhammer_Books_SSOT.xlsx` — applied groups (a)–(e) below via a throwaway `openpyxl` script (gitignored `sessions/_drafts/oq14-apply-edits.py`, never staged). Loaded **without** `data_only`; asserted every IST cell before writing any SOLL; saved; reloaded and re-verified every target cell + sheet set + row counts.
- `scripts/seed-data/book-roster.json` — regenerated via `npm run import:ssot-roster` (loader is pure file I/O, no DB/env). Committed together with the xlsx as one atomic source+artifact unit (commit `73de889`).

### Cell-level changes (the binary xlsx git-diff is unreadable — full list)

**Sheet `Books` — loader-relevant columns (A/D/E/G/H/I/N):**

| Cell | IST | SOLL | Book |
|---|---|---|---|
| `I245` (seriesHint) | `Imperial Guard` | `Night Lords` | W40K-0244 *The Remnant Blade* |
| `E142` (author) | *(empty)* | `Mike Brooks` | W40K-0141 *Voidscarred* |
| `E143` | *(empty)* | `Jonathan D Beer` | W40K-0142 *Tomb World* |
| `E144` | *(empty)* | `Robbie MacNiven` | W40K-0143 *Vagabond Squadron* |
| `E145` | *(empty)* | `Justin D Hill` | W40K-0144 *Archmagos* |
| `E147` | *(empty)* | `Rhuairidh James` | W40K-0146 *Death Rider* |
| `E148` | *(empty)* | `Various Authors` | W40K-0147 *The Green Tide* (→ `editorialNote:"various"`) |
| `H298` (format) | `Novel` | `Collection` | W40K-0297 *Flesh Tearers* |
| `H335` (format) | `Novella` | `Collection` | W40K-0334 *Lords of Caliban* |
| `D260` (title) | `The Rose in the Anger` | `The Rose in Anger` | W40K-0259 |
| `D331` (title) | `The Hunt of Magnus` | `The Hunt for Magnus` | W40K-0330 |
| `N287` (Collects Titles) | *(empty)* | `Accursed Eternity; Endeavour of Will; Fateweaver; Sanctus` | W40K-0286 *Architect of Fate* |
| `N308` (Collects Titles) | `Helsreach` | `Helsreach; Blood and Fire` | W40K-0307 *War for Armageddon Omnibus* |

**Sheet `Books` — Excel-internal consistency only (M/J/K/L are NOT read by the loader → no effect on `book-roster.json`; edited to keep the sheet self-consistent, mirroring the existing *Helsreach* row 280):**

| Cell(s) | IST | SOLL |
|---|---|---|
| `M287` (Collects Book IDs) | *(empty)* | `W40K-0308; W40K-0309; W40K-0310; W40K-0311` |
| `M308` (Collects Book IDs) | `W40K-0279` | `W40K-0279; W40K-0316` |
| `J309`/`K309`/`L309` | `No`/∅/∅ | `Yes`/`W40K-0286`/`Architect of Fate` (Accursed Eternity) |
| `J310`/`K310`/`L310` | `No`/∅/∅ | `Yes`/`W40K-0286`/`Architect of Fate` (Endeavour of Will) |
| `J311`/`K311`/`L311` | `No`/∅/∅ | `Yes`/`W40K-0286`/`Architect of Fate` (Fateweaver) |
| `J312`/`K312`/`L312` | `No`/∅/∅ | `Yes`/`W40K-0286`/`Architect of Fate` (Sanctus) |
| `J317`/`K317`/`L317` | `No`/∅/∅ | `Yes`/`W40K-0307`/`War for Armageddon Omnibus` (Blood and Fire) |

**Sheet `Collection Links` — 5 rows appended (193–197), full A–J:**

| Row | A Content ID | B Content Title | C Type | D Coll ID | E Coll Title | F Coll Type | G Relation | H Conf |
|---|---|---|---|---|---|---|---|---|
| 193 | W40K-0308 | Accursed Eternity | Novella | W40K-0286 | Architect of Fate | Anthology | included_in | 0.95 |
| 194 | W40K-0309 | Endeavour of Will | Novella | W40K-0286 | Architect of Fate | Anthology | included_in | 0.95 |
| 195 | W40K-0310 | Fateweaver | Novella | W40K-0286 | Architect of Fate | Anthology | included_in | 0.95 |
| 196 | W40K-0311 | Sanctus | Novella | W40K-0286 | Architect of Fate | Anthology | included_in | 0.95 |
| 197 | W40K-0316 | Blood and Fire | Novella | W40K-0307 | War for Armageddon Omnibus | Omnibus | included_in | 0.95 |

- `I` Basis / `J` Source URL (the `J` URL is **not** carried into `book-roster.json` — loader reads A/B/D/H/I — so recorded here):
  - Rows 193–196 `I`: `Architect of Fate (Space Marine Battles anthology #10, ed. Christian Dunn, 2012) collects exactly these four novellas; contents enumerated by Lexicanum and Black Library. OQ(14)(e) / Resolver-Pass 6.`
  - Rows 193–196 `J`: `https://wh40k.lexicanum.com/wiki/Architect_of_Fate_(Anthology)`
  - Row 197 `I`: `Blood and Fire is collected in War for Armageddon: The Omnibus (Black Library, 2018) alongside Helsreach; contents enumerated by Lexicanum and Black Library. OQ(14)(e) / Resolver-Pass 6.`
  - Row 197 `J`: `https://wh40k.lexicanum.com/wiki/War_for_Armageddon:_The_Omnibus`

**Sheet `Collection Links` — existing row 106 (the W40K-0279 → W40K-0307 edge) realigned:**

| Cell | IST | SOLL |
|---|---|---|
| `H106` (Confidence) | `0.65` | `0.95` |
| `I106` (Basis) | `War for Armageddon omnibus has Helsreach as a listed Armageddon title; TLBranson does not enumerate all contents` | `Helsreach is the lead novel of War for Armageddon: The Omnibus (Black Library, 2018); contents enumerated by Lexicanum and Black Library. Updated OQ(14)(e).` |

### `book-roster.json` diff confirmation (matches spec exactly)

`books[]` length **859** (unchanged) — 11 objects / 13 field changes:

- W40K-0141 `authors` `[]` → `["Mike Brooks"]`
- W40K-0142 `authors` `[]` → `["Jonathan D Beer"]`
- W40K-0143 `authors` `[]` → `["Robbie MacNiven"]`
- W40K-0144 `authors` `[]` → `["Justin D Hill"]`
- W40K-0146 `authors` `[]` → `["Rhuairidh James"]`
- W40K-0147 `editorialNote` `null` → `"various"`
- W40K-0244 `seriesHint` `"Imperial Guard"` → `"Night Lords"`
- W40K-0259 `title` → `"The Rose in Anger"` **and** `slug` → `"the-rose-in-anger"`
- W40K-0297 `format` `"novel"` → `"collection"`
- W40K-0330 `title` → `"The Hunt for Magnus"` **and** `slug` → `"the-hunt-for-magnus"`
- W40K-0334 `format` `"novella"` → `"collection"`

`collections[]` length **191 → 196** — 5 new edges + 1 changed:

- NEW W40K-0308 → W40K-0286, `displayOrder` 0, `confidence` 0.95
- NEW W40K-0309 → W40K-0286, `displayOrder` 1, `confidence` 0.95
- NEW W40K-0310 → W40K-0286, `displayOrder` 2, `confidence` 0.95
- NEW W40K-0311 → W40K-0286, `displayOrder` 3, `confidence` 0.95
- NEW W40K-0316 → W40K-0307, `displayOrder` 1, `confidence` 0.95
- CHANGED W40K-0279 → W40K-0307: `confidence` 0.65 → 0.95, new `basis`; `displayOrder` stays 0

`git diff --stat` = `60 insertions(+), 15 deletions(-)`; no other books, no other fields, no count drift.

## Decisions I made

- **Tool = Python `openpyxl`** (per the work-order's tool decision). Installed to the user Python (`pip install openpyxl` → openpyxl 3.1.5 + et-xmlfile), so `package.json`/lock are untouched and the commit stays exactly two data files. Loaded **without** `data_only` (no formulas exist in any of the 6 sheets, so this is safe and preserves formula text if any ever appear).
- **Assert-then-write-then-reload-verify.** The edit script asserted every IST cell before writing a single SOLL value (so a stale assumption aborts with nothing written), then re-opened the saved file and re-checked every target cell, the 6-sheet set, and the last-data-row counts (Books 860, Collection Links 197).
- **`confidence` written as a numeric `0.95`** (not the string `"0.95"`), matching the existing numeric confidence cells; the loader's `toConfidence` rounds to 2 dp regardless.
- **Commit message via `git commit -F <file>`** (a gitignored draft) rather than `-m`, to guarantee the em-dash in the subject lands as correct UTF-8 (the Windows console mangled em-dashes in stdout during this session).
- **No DB touch** — no `db:apply` / `apply-override` / resolver run, per scope. `collection-gaps.json` left untouched (that retire is Resolver-Pass 7 Phase 4a).

## Verification

- **Edit-script IST asserts** — all passed (nothing would have been written otherwise).
- **Reload-verify** — 6 sheets present (`Books`, `Collection Links`, `Source Comparison`, `Unmapped Collections`, `Sources`, `README`); `Books` last data row 860 (859 books + header); `Collection Links` last data row 197 (196 + header); every target cell holds SOLL.
- **`npm run import:ssot-roster`** — exit 0; `books: 859`, `collections: 196`; one expected pre-existing warning (`W40K-0307 "War for Armageddon Omnibus"` missing Release Year → null). No errors.
- **`git diff scripts/seed-data/book-roster.json`** — matches the spec exactly (see confirmation above).
- **Determinism** — staged run-1 output, re-ran the loader; `git diff` against the staged copy was empty (byte-identical re-run).
- **`npm run lint`** — exit 0, 0 errors (1 pre-existing warning: `@next/next/no-page-custom-font` in `src/app/layout.tsx`, unrelated to this data change).
- **`npm run typecheck`** (`tsc --noEmit`) — exit 0, clean.

## Slug-delta note (for Resolver-Pass 7)

Group (d)'s two title fixes change the title-derived slugs in `book-roster.json`:

- W40K-0259 `the-rose-in-the-anger` → `the-rose-in-anger`
- W40K-0330 `the-hunt-of-magnus` → `the-hunt-for-magnus`

Both new slugs are correct and collision-free. **This session does no DB-apply**, so the already-applied `works.slug` for W40K-0259 / W40K-0330 stay on the old values until a future cumulative Resolver-Pass (RP7, axes `ssot-w40k-026` / `ssot-w40k-033`) re-applies them. Not a blocker — flagging it so RP7 expects the slug move.

## Open issues / blockers

None. Branch `codex/ingest-batches-roster-hygiene`, ready for PR. PR not merged (Philipp merges manually).

## For next session

- **Close OQ (14)** in `brain/wiki/open-questions.md` once this PR merges (bundle into the Pass-7-setup Brain-Hygiene-Pass), carrying the slug-delta note above into RP7's expectations.
- **Deliberately out of scope** (left as-is, per the work-order):
  - `collection-gaps.json` retire of the W40K-0286 / W40K-0307 entries → Resolver-Pass 7 Phase 4a.
  - W40K-0293 *Overfiend* — 0 edges, constituents not unambiguously enumerable; Pass 6 deliberately skipped it.
  - W40K-0147 *The Green Tide* constituents — its contents aren't roster entries yet (different gap type); only the author cell was touched here.
  - *War for Armageddon: The Omnibus* contains further short stories beyond Helsreach + Blood and Fire that aren't roster entries.

## References

- `sessions/_drafts/oq14-roster-checklist.md` — the CC work-order (gitignored, not committed).
- Lexicanum: `Architect_of_Fate_(Anthology)`, `War_for_Armageddon:_The_Omnibus` (the basis Source-URLs above).
- `scripts/import-ssot-roster.ts` — loader (column mapping A/D/E/G/H/I/N/O/P for Books, A/B/D/H/I for Collection Links; `displayOrder` from parent `Collects Titles`).
