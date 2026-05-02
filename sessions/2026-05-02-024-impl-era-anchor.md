---
session: 2026-05-02-024
role: implementer
date: 2026-05-02
status: complete
slug: era-anchor
parent: 2026-05-02-023
links:
  - 2026-05-01-019
  - 2026-05-01-020
  - 2026-05-01-021
  - 2026-05-02-022
commits: []
---

# Stufe 2c.0 — Era-Anchor (`primaryEraId`)

## Summary

Replaced the two algorithmic Era-bucketing paths (Overview strict-midpoint,
EraDetail midpoint ±5) with an explicit editorial `book_details.primary_era_id`
column. All 26 books in `scripts/seed-data/books.json` now carry a
`primaryEraId` field; seed validates strictly; `npm run check:eras` exits 0
with the canonical 1·5·1·1·0·15·3 distribution. The single fact Cowork most
needs to know: both editorial questions (`hh14 The First Heretic` and
`mf01 Mark of Faith`) were closed by Philipp before implementation, so this
report carries no open decisions back.

## What I did

- `src/db/schema.ts` — `bookDetails`: added `primaryEraId varchar(64)
  references eras(id)` after `seriesIndex`. Nullable on the DB side; seed-side
  validation makes it effectively required.
- `src/db/migrations/0004_great_firelord.sql` — generated migration: a single
  `ALTER TABLE … ADD COLUMN` plus FK constraint. No TTY interaction needed
  (pure additive change, drizzle-kit's rename-resolver did not trigger).
- `scripts/seed-data/books.json` — 26 in-place edits, one new
  `"primaryEraId": "<era_id>"` property per book, slotted between `endY` and
  `synopsis`. Editorial-decided values (Philipp): `hh14 → horus_heresy`,
  `mf01 → indomitus`. Other 24 follow the Cowork brief table.
- `scripts/seed.ts` — `RawBook.primaryEraId: string` (required, no `?`); a
  `knownEraIds` set built from `RAW.eras`; per-book preflight that throws on
  missing or unknown values; `bookDetails` insert writes the field.
- `src/lib/timeline.ts` — `TimelineBook.primaryEraId: string` with JSDoc
  explaining the editorial-anchor semantics and the empty-string sentinel.
- `src/app/timeline/page.tsx` — Drizzle mapping picks up
  `w.bookDetails?.primaryEraId ?? ""`; the `??` is defensive (the
  `bookDetails`-relation is always present for `kind='book'`, but TS-strict
  needs the fallback).
- `src/components/timeline/Overview.tsx` — `eraCounts` rewritten as a direct
  `b.primaryEraId` lookup with a `counts[id] !== undefined` guard against
  unknown ids. No midpoint, no `era.start/end` reference.
- `src/components/timeline/EraDetail.tsx` — `eraBooks` rewritten as
  `books.filter((b) => b.primaryEraId === era.id)`. Previous comment block
  about ±5/±50 slack replaced.
- `scripts/check-eras.ts` (new) — pure JSON-linting guardrail; prints a
  per-era distribution table; exits 1 on missing/unknown ids; emits a
  non-fatal warning when a book's `endY` is more than 5000 years outside its
  assigned era.
- `package.json` — `"check:eras": "tsx scripts/check-eras.ts"` added next to
  the `db:*` scripts.
- `docs/data/2b-book-roster.md` — Verteilung table corrected to the new
  reality (1·5·1·1·0·15·3) plus a note pointing readers at `primaryEraId` and
  listing the three editorial calls.
- `sessions/2026-05-02-023-arch-era-anchor.md` — frontmatter
  `status: open → implemented`, `commits:` populated alongside this report.
- `sessions/README.md` — Active-Threads row 023 → `implemented`; new row 024
  added at the top.

## Decisions I made

- **Picked `primaryEraId` nullable on the DB column** with seed-side strict
  validation (Constraint 4) over `NOT NULL`. ALTER TABLE ADD COLUMN NOT NULL
  requires either a backfill default or an empty table; production Supabase
  carries the 26 2b rows, so the safe path is to keep the column nullable
  and let `scripts/seed.ts` (today's only insert path) be the editorial
  gatekeeper. Phase-4 ingestion can pre-fill the field; if it doesn't, the
  seed throws with a clear per-book error. The cost is one defensive `?? ""`
  in the page.tsx mapping; benefit is a forward-migratable nullable column
  that never blocks a future re-run on a partially-populated table.
- **Single migration `0004_great_firelord.sql`** (drizzle-kit auto-naming).
  No TTY workaround needed because the diff is purely additive: one ADD
  COLUMN + one FK constraint. Two-step generate would have been overkill.
- **Column position: after `seriesIndex`** in the schema. Drizzle generates
  DDL in field-declaration order; logical "this book in context" grouping.
- **`check:eras` plain ASCII output** — no color libs. The `padEnd`/`padStart`
  layout self-aligns to the widest era id/name. Goal is legibility on the
  default Windows PowerShell console plus future CI logs, not eye-candy.
- **Did not touch `gg01 Gaunt's Ghosts: First and Only` startY.** The brief's
  Vorbefüllungs-Tabelle lists `41745–41745` but books.json (via 2b) carries
  `41760–41760`. Constraint 16 is explicit: `startY/endY` remain unchanged
  in 2c.0. The era assignment (`time_ending`) is unaffected either way; flag
  only — Cowork can decide whether to align the brief table or the seed in
  a follow-up.

## Verification

- `npm run db:generate` — produced `src/db/migrations/0004_great_firelord.sql`
  with one ADD COLUMN + FK constraint. No interactive prompt.
- `npm run db:migrate` — applied to Supabase in 351ms.
- `npm run db:seed` — clean run. Counts: 7 eras · 29 factions · 21 series ·
  5 sectors · 28 locations · 0 characters · 18 services · 12 facet_categories
  · 85 facet_values · 12 persons · **26 works · 26 book_details** ·
  60 work_factions · 26 work_persons · 413 work_facets · 26 external_links.
  No `primaryEraId`-validation errors thrown.
- `npm run check:eras` — exit 0.

  ```
  Era distribution:
  ────────────────────────────────────────
    great_crusade    1  Great Crusade
    horus_heresy     5  Horus Heresy
    age_rebirth      1  Age of Rebirth
    long_war         1  The Long War
    age_apostasy     0  Age of Apostasy
    time_ending     15  Time of Ending
    indomitus        3  Indomitus Era
  ────────────────────────────────────────
    TOTAL           26

  OK — all 26 books carry a valid primaryEraId.
  ```

- `npm run lint` — 0 errors, 1 pre-existing layout.tsx warning (unchanged).
- `npm run typecheck` — clean.
- `npm run build` — clean. `/timeline` is `(Dynamic) ƒ`, `/` stays
  `Revalidate 1h`.
- DB-side `SELECT primary_era_id, COUNT(*) FROM book_details GROUP BY 1`
  (one-shot tsx script, removed after verification): same 1·5·1·3·1·15
  shape, missing row = `age_apostasy` 0 (expected — no books in that era).
- Local curl smoke tests against `next dev` (port 3000):
  - `/timeline` → 200, six `NNN VOLUMES` badges in era order: `001 / 005 /
    001 / 001 / 015 / 003`. `age_apostasy` correctly skips its badge (count
    0).
  - `/timeline?era=time_ending` → 15 `bm-dot` markers; rendered tooltip
    titles include Infinite & Divine and exclude Mark of Faith.
  - `/timeline?era=indomitus` → 3 `bm-dot` markers (Avenging Son, Mark of
    Faith, Dark Imperium); `vt01`/`hr01`/`db01` are not present.
  - `/timeline?era=horus_heresy` → 5 markers (Horus Rising, Mechanicum,
    The First Heretic, Know No Fear, Master of Mankind).
  - `/timeline?era=great_crusade` → 1 marker (Legion only).
  - `/timeline?era=age_apostasy` → 0 markers; cogitator empty-state
    `// EXCERPTUM CLEAR — NO VOLUMES CATALOGUED FOR THIS EPOCH` renders.
  - `/healthz` → `{"ok":true,"db":"up",...}`.
- Visual confirmation in a browser: not done in this session. Cowork
  verifies on the Vercel-Preview at PR review.

## Decisions to note for the report (per Acceptance §last bullet)

- (a) **`primary_era_id` chosen nullable + seed-strict** — see decision
  above. Trade-off accepted; pragmatic for current state and Phase-4
  forward-compat.
- (b) **`npm run check:eras` output** — quoted verbatim above; exit 0.
- (c) **No discrepancy from the Cowork Vorbefüllungs-Tabelle.** Both
  editorial questions were closed by Philipp before implementation:
  `hh14 → horus_heresy` and `mf01 → indomitus`. The remaining 24 entries
  follow the brief's table 1:1.

## Open issues / blockers

None. All Acceptance criteria met. The branch is ready for PR/CI/Vercel-
Preview review.

Note (not blocking): the brief's Vorbefüllungs-Tabelle lists `gg01 Gaunt's
Ghosts: First and Only` as `41745–41745`, but `books.json` (since 2b) carries
`41760–41760`. Constraint 16 freezes startY/endY for 2c.0, so this report
flags but does not fix it. Era assignment (`time_ending`) is identical either
way.

## For next session

- **`secondary_era_ids`** if/when Multi-Era visibility surfaces concrete UX
  needs (`id01` is the obvious driver — it does plausibly belong in
  `age_apostasy`/`long_war` as well as `time_ending`). Out of scope per
  brief; flag only.
- **`check:eras` in CI** — the script is CI-tauglich (no DB), would slot
  into `.github/workflows/ci.yml` next to lint + typecheck. Tiny hygiene
  task; out of scope per brief.
- **2c.1 — DetailPanel + Deep-Linking** is the natural follow-up
  (rewrite of session 018 against the post-2c.0 schema, with `primaryEraId`
  as the era-resolution source for deep links). Carry-over Punkt 1 in
  `sessions/README.md` already flags this.

## References

- Brief 023: `sessions/2026-05-02-023-arch-era-anchor.md`
- Report 022 (Stufe 2b shipped, surfaced the bucketing inconsistency):
  `sessions/2026-05-02-022-impl-rich-seed-2b.md` § "Open issues"
- 2a Schema-Foundation: `sessions/2026-05-01-019-arch-schema-foundation.md`
  / `sessions/2026-05-01-020-impl-schema-foundation.md`
- Roster doc: `docs/data/2b-book-roster.md` (Verteilung table updated in this
  session)
