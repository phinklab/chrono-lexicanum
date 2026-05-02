---
session: 2026-05-02-022
role: implementer
date: 2026-05-02
status: complete
slug: rich-seed-2b
parent: 2026-05-01-021
links:
  - 2026-05-01-019
  - 2026-05-01-020
  - 2026-05-01-021
commits:
  - 2df6dd2
  - 694340d
  - d5afa16
---

# Stufe 2b — Rich Seed (26 Bücher) + Hub-Revalidate

## Summary

Pumped Cowork's hand-curated 23 new books into the DB on top of the 3-book
Sanity-Fixture (26 works total, all fully annotated) and switched the Hub's
novel-count footer to ISR with a 1-hour revalidate window. One thing Cowork
needs to know: the Era-bucketing logic between Overview (strict midpoint) and
EraDetail (midpoint ±5) doesn't match the brief's per-era count expectation
for `time_ending`/`indomitus` — it's a long-standing algorithm quirk surfaced
by the new data, not a data bug. Details below in "Open issues."

## What I did

- `scripts/seed-data/{books,factions,persons,series}.json` + `README.md` —
  staged Cowork's prepared data; only edited line 46 of `README.md` to flip
  the table row from "3 books" to "26 books" (body text was already updated).
- `docs/data/2b-book-roster.md` — added Cowork's audit doc to the repo
  (sources, confidence map, per-book editorial rationale).
- `sessions/2026-05-01-021-arch-rich-seed-2b.md` — committed the brief alongside
  the data; flipped its frontmatter `status: open → implemented` and populated
  `commits:` in the docs commit at the end of the session.
- `src/app/page.tsx` — added `export const revalidate = 3600`. Build output
  confirms: Route `/` is now `Revalidate 1h Expire 1y`.
- `src/app/globals.css` — `.bm-tooltip` rule: `max-width: 260px` + `white-space:
  normal` + `line-height: 1.3` + `text-align: center` so 41-char titles wrap
  to two lines instead of overflowing the era surface.
- `ROADMAP.md` — Stufe 2b checkbox ticked; line 62 also corrected from "20
  hand-curated books" to "26".
- `sessions/README.md` — Active-Threads-Tabelle: 021 → `implemented`, 022 row
  added at the top. Carry-over verified: "Hub novel-count freshness" and "2b
  Facet-Fillrate" were already absent (Cowork folded them into 021); added one
  new bullet on the era-bucketing discrepancy noted below.
- `sessions/2026-05-02-022-impl-rich-seed-2b.md` — this report.

## Decisions I made

- **Picked `revalidate = 3600` over `86400`**. Brief noted catalog growth is
  weekly so 86400 is also defensible; I went hourly because the cache cost on
  a single COUNT(*) query is negligible at either window and 3600 closes the
  manual-Drizzle-Studio-edit-then-refresh loop in an ergonomic time. Easy
  knob to bump later if writes truly flatline.
- **Tooltip fix Option A (wrap) over Option B (ellipsis)**. Wrap preserves
  the full title — a Warhammer reader scanning for "Vaults of Terra: The
  Carrion Throne" cares about the subtitle. Truncation would cost information
  that's reasonable to fit in two lines. `max-width: 260px` (≈ 32 characters
  at 11.5px) keeps Ghazghkull's split between "Thraka:" and "Prophet" rather
  than mid-word. Verified the CSS via build — could not browser-confirm
  visually in this autonomous session; recommend Philipp do a final hover pass
  on `/timeline?era=time_ending` before merging the PR.
- **Did not adjust `mf01` startY or `id01` startY/endY** even though both fall
  outside the brief's expected era buckets — Constraint 1 is explicit that
  data fixes are Cowork's call. See Open issues.
- **Did not run Drizzle Studio for the verification bullet.** Used a
  one-shot `npx tsx` script instead (created and removed `scripts/_discriminator
  _check.ts` outside the commits) because Studio needs a TTY in this
  environment. The script ran the discriminator-sanity SQL plus the brief
  Note C primary-faction breakdown — both clean.

## Verification

- `npm run db:seed` (twice) — idempotent. Counts both runs:
  7 eras · 29 factions · 21 series · 5 sectors · 28 locations · 0 characters ·
  18 services · 12 facet_categories · 85 facet_values · 12 persons ·
  **26 works · 26 book_details · 60 work_factions · 26 work_persons · 413
  work_facets · 26 external_links**.
- Discriminator-sanity SQL on all 4 detail tables (book/film/channel/video):
  0 bad rows everywhere.
- Primary-faction breakdown matches brief Note C exactly: 21 factions total,
  `ultramarines=3`, `inquisition=3`, `mechanicus=2`, all others `=1`,
  Σprimary = 26.
- `npm run lint` — clean (1 pre-existing layout.tsx warning, unrelated).
- `npm run typecheck` — clean.
- `npm run build` — clean. Static routes prerendered, `/` confirmed as
  `Revalidate 1h Expire 1y`.
- Local curl smoke-tests on `next dev` (port 3000):
  - `/` → 200, footer renders `<strong>26</strong> Novels Indexed`.
  - `/timeline` → 200, all 7 era badges render via the SVG `padStart(3,"0")
    VOLUMES` template.
  - `/timeline?era=horus_heresy` → 200, 4 BookDots (Horus Rising, Mechanicum,
    Know No Fear, Master of Mankind) — exact brief expectation.
  - `/timeline?era=age_apostasy` → 200, empty-state cogitator
    "// EXCERPTUM CLEAR — NO VOLUMES CATALOGUED FOR THIS EPOCH".
  - `/timeline?era=time_ending` → 200, **14 BookDots** (brief expected 16; see
    Open issues).
  - `/timeline?era=indomitus` → 200, 6 BookDots (brief expected 2; the +4 are
    the EraDetail ±5-year leak pulling vt01/hr01/db01 across the boundary,
    plus mf01 — see Open issues).
  - `/map`, `/ask`, `/buch/horus-rising`, `/fraktion/ultramarines`,
    `/welt/macragge`, `/charakter/foo` → all 200.
  - `/healthz` → `{"ok":true,"db":"up",...}`.
- PR-CI and Vercel-Preview: not yet — opened in the same push as this report.

## Open issues / blockers

Two book-vs-era discrepancies surfaced when comparing the brief's per-era
counts (Note C) against the rendered Overview / EraDetail. Both are
data-vs-algorithm questions, not data-integrity bugs. Per Constraint 1 I did
NOT touch books.json:

- **`id01` "The Infinite and the Divine"** spans `startY=35000 endY=41999`
  (the book's premise is a 60-millennia Necron buddy story). Midpoint =
  38499.5 falls into the gap between `age_apostasy` (ends 37999) and
  `time_ending` (starts 40997). Result: it appears in **no era** in either
  Overview or EraDetail. Brief Note C counted it in `time_ending`.
- **`mf01` "Mark of Faith"** has `startY=42010 endY=42010`. Midpoint = 42010
  is squarely in `indomitus` per both Overview (strict) and EraDetail (±5 leak).
  Brief Note C counted it in `time_ending`.
- Combined effect: brief expected `time_ending`=16 / `indomitus`=2; rendered
  Overview shows 14 / 3, EraDetail shows 14 / 6 (the extra 4 in indomitus are
  the ±5-year leak from `vt01`/`hr01`/`db01` whose mids are 41997-41999).
- Cowork picks how to resolve: re-anchor `mf01` to M41, broaden the era
  boundaries, allow multi-era assignment, or a different bucketing rule. None
  of these is a 2b deliverable.

Other minor:

- Brief acceptance bullet "`works WHERE kind='book' AND startY<31000` listet
  die 6 Pre/Heresy-Era-Bücher" returns 5, not 6. `Master of Mankind`
  (`startY=31010`) is in `horus_heresy` per `eras.json` (era extends to
  31014) but the example SQL is too tight. Brief said `z.B.` — illustrative,
  not contractual. Worth tightening the brief's example next time.

## For next session (Stufe 2c candidates)

- **Era-bucketing rule.** Pick a canonical algorithm and use the same one in
  Overview and EraDetail. Options: midpoint-strict (current Overview),
  midpoint+slack (current EraDetail), endY-based, or explicit per-book
  `eraId` column on `book_details`. The last is the most honest with the
  data — books that span eras (id01) can be assigned where they "belong"
  editorially, without algorithmic guesswork. Carries into how the count
  badges and EraDetail filtering will agree.
- **`mf01` and `id01` editorial review.** With the era-bucketing decision
  above, also revisit whether these two books' `startY`/`endY` reflect the
  in-universe anchor Cowork wanted. The `2b-book-roster.md` confidence-map
  flags id01 (entry `id01 → 0.7`) but not mf01 — worth a second look.
- **Confidence-map activation.** Roster has 0.6–0.8 values for 7 books that
  the seed currently ignores (hardcodes `confidence: 1.00`). Stays in
  carry-over for Phase 4 ingestion as before.
- **Density polish for `time_ending` / EraDetail.** 14 BookDots per era surface
  is dense but the existing track-packing and standalone-spine handle it
  without structural break (verified via curl-rendered HTML; recommend final
  visual confirmation). If clustering ever becomes useful the FilterRail /
  cluster-collapse work in 2c is the natural home.
- **Tooltip wrap visual confirmation.** I changed `.bm-tooltip` based on the
  CSS-and-HTML analysis and the title-length math, but did not visually
  inspect a hover. Worth a 30-second pass when reviewing the PR; if the wrap
  point lands awkwardly on any title, dropping `max-width` from 260 to 240 or
  280 is the lever.
- **Brief-vs-data audit cadence.** The two `time_ending`/`indomitus`
  discrepancies show that hand-counting books per era during brief drafting is
  fragile. A small `npm run check:eras` script (count books per era using the
  same algorithm Overview uses) would catch these before the brief ships.
  3-line script; could land in 2c or as standalone hygiene.

## References

- Brief: `sessions/2026-05-01-021-arch-rich-seed-2b.md`
- Stufe 2a foundation: sessions/2026-05-01-019 (architect) and 2026-05-01-020
  (implementer).
- Roster doc: `docs/data/2b-book-roster.md`
- EraDetail bucketing logic: `src/components/timeline/EraDetail.tsx:77-84`
- Tooltip CSS: `src/app/globals.css:1183-1218`
- Build output for ISR confirmation: see commit `694340d` discussion.
