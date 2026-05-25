---
session: 2026-05-21-089
role: implementer
date: 2026-05-21
status: complete
slug: resolver-pass-5
parent: 2026-05-21-089-arch-resolver-pass-5
links:
  - 2026-05-16-076-arch-resolver-batch-4-axis-sliced
  - 2026-05-16-077-arch-grand-alignment-junction-hygiene
  - 2026-05-19-084-arch-locations-axis-hygiene
  - 2026-05-20-087-arch-goodreads-rating-pipeline
commits:
  - ea97159  # setup: config fill + Call-3 author backfill
  - 2cac03f  # Phase 0: aggregator + dossier
  - 1b0b137  # Phase 1: factions
  - ce3aa97  # Phase 2: locations
  - 6be047e  # Phase 3: characters + cross-batch consolidation
  - 6aea33f  # Phase 4a: integration + Call 2 + apply harness
  # Phase 4b (this report + brief status) is the closing commit.
---

# Resolver-Pass 5 — impl report (ssot-w40k-021..025 / W40K-0201..0250)

## Summary

Crystallized the fifth 50-book wave into the resolver reference layer and applied all 250 W40K books to
Postgres, clearing the 250-book resolver pause. Ran **axis-sliced, manually/supervised** (not via the
`run-resolver-pass.sh` driver — maintainer chose supervised, stop-before-push; the driver config is
filled + committed and ready for a later pass). Reference rows: factions **146→154**, locations
**157→169**, characters **169→199**; aliases faction 36→37, character 26→28 (location aliases unchanged).
DB junctions PRE→POST: `work_factions 1020→1153`, `work_locations 417→455`, `work_characters 633→701`,
`work_collections 56→79`, `work_persons 189→232`. All green checks pass. The three wave-calls landed:
Call 1 (regiments), Call 2 (`commissar` facet + retag), Call 3 (author backfill verified).

**Execution note (worktree).** The session shell reported the **coordination** worktree
(`codex/session-089-resolver-pass-5`), not the batches worktree, so per the brief all work was done in
`C:\Users\Phil\chrono-lexicanum-batches` on `codex/ingest-batches-resolver-pass-5` (via absolute paths +
`cd`). The setup commit folded the Call-3 author backfill that was pre-staged there.

## What I did (per phase)

- **Setup (`ea97159`)** — filled `resolver-pass.config.json` (NNN→089, brief/dossier/report paths, added
  `facet-catalog.json` to phase-4 scope + a Call-2/3 trigger clause incl. the facet_values DB-seed note);
  committed alongside the pre-staged Call-3 backfill (`book-roster.json` + xlsx) + brief + README.
- **Phase 0 — Dossier (`2cac03f`)** — `scripts/aggregate-surface-forms-089.ts` (deterministic clone of
  `-076`) + the 7-section dossier. Key finding: the deterministic count contradicts the brief's regiment
  estimate — only **Mordian Iron Guard reaches freq≥2**; the others are freq=1 (books tag the umbrella).
- **Phase 1 — Factions (`1b0b137`)** — +8 rows (146→154): `blood_ravens` (freq6), `adeptus_astra_telepathica`
  (freq2), `mordian_iron_guard` (freq2), `deathwatch` + `vostroyan_firstborn` + `tallarn_desert_raiders`
  + `tempestus_scions` + `savlar_chem_dogs` (freq1 iconic). +1 alias (Collegia Titanica→adeptus_titanicus),
  +2 policy `specialCases`. 8 test cases.
- **Phase 2 — Locations (`ce3aa97`)** — +12 rows (157→169), all freq≥2; `sin_of_damnation` modelled as a
  space-hulk vessel (`tags:['vessel']`, null coords). 5 test cases. No alias/sector change.
- **Phase 3 — Characters (`6be047e`)** — +30 rows (169→199): 22 freq≥2, 6 freq=1 iconic, 2 cross-batch
  consolidations. **Lo Bannick** = one row (`Marken Cortein Lo Bannick` + `Lo Bannick`), **Commander
  Dante** = one row (`Dante` + `Commander Dante`). 6 test cases incl. 2 alias-consolidation. Yarrick is
  not tagged anywhere → no row (per dossier).
- **Phase 4 — Integration + Calls 2 & 3 (`6aea33f` + this report)** — see below.

## Counts (Pflicht-Tabelle)

| Phase | work_factions | work_locations | work_characters | work_collections |
| --- | --- | --- | --- | --- |
| Pre-Apply (200 books) | 1020 | 417 | 633 | 56 |
| Per-Batch 021 (210) | 1055 | 430 | 648 | 64 |
| Per-Batch 022 (220) | 1089 | 440 | 676 | 67 |
| Per-Batch 023 (230) | 1108 | 450 | 689 | 70 |
| Per-Batch 024 (240) | 1134 | 455 | 697 | 76 |
| Post-Re-Apply 001..025 (250) | **1153** | **455** | **701** | **79** |
| Δ (wave 5) | +133 | +38 | +68 | +23 |

Reference: `factions=154`, `locations=169`, `characters=199`, `facet_values=85→86` (commissar),
`work_persons=189→232`. Apply: 001..020 = `inserts=0 updates=10` (drift cleanup), 021..025 =
`inserts=10 updates=0` (50 new works). DB counts match the dry-run prediction exactly.

**Coverage (dry-run, post-skip, 250 books):** factions `1153/1439` (165 grand-alignment surface forms
suppressed, Brief 077), locations `455/555` (14 umbrella suppressed, Brief 084), characters `701/903`.

## Decisions I made

- **Call 1 — freq logic.** The deterministic aggregate is authoritative over the brief's estimate: only
  `Mordian Iron Guard` is freq≥2. Promoted it + 4 freq=1 iconic regiments that are each the *principal*
  faction of a wave book (Vostroyan/Tallarn/Tempestus/Savlar), consistent with the existing ~13
  named-regiment rows under `astra_militarum`. Left `Brimlock Dragoons` (supporting, freq1) and
  `Valhallan Ice Warriors` (freq1, type-vs-existing-`valhallan_597th`) as surface-form. `Blood Ravens`
  (freq6) was the largest unresolved faction — promoted under `adeptus_astartes`.
- **Call 2 — DB-seed dependency the brief omits.** `apply-override.validateFacetIds` checks the **DB
  `facet_values` table**, not the catalog JSON. `db:seed` is destructive (truncates works) and
  `db:seed-resolver-extensions` skips facets, so I wrote `scripts/seed-facets-089.ts` (catalog upsert,
  `ON CONFLICT DO NOTHING`) and run it before apply. Retag set, determined by reading every 021..025
  book's `protagonist_class`: **W40K-0237** `inquisitor`→`commissar` (sole Vostroyan commissar POV, the
  mandated mistag fix — pure commissar, no guardsman), **W40K-0247** `guardsman`→`guardsman`+`commissar`
  (Hasp is the commissar POV of a Savlar penal unit — mixed cast keeps guardsman). **W40K-0250's
  `inquisitor` is legitimate** (Inquisitor Kalypsia, Deathwatch) → not retagged. No other 021..025
  commissar is principal/co-lead (Death World / Imperial Glory / Straken commissars are supporting).
- **Call 2 (c) — value_outside_vocabulary is a no-op against the override files.** Grep confirms the
  021..025 override JSONs contain **no** `value_outside_vocabulary` blocks (0 hits); those
  `commissar`/`tank_crew`/`penal_legion` annotations live in the **append-only `ssot-loop-log.md`**,
  which is explicitly out-of-scope / no-rewrite (Brief 076 + 089). So step (c) strips nothing from the
  override files, and I did not touch the loop-log. The loop-log entries remain as historical telemetry.
- **`tank_crew` / `penal_legion` not added** (per brief). They remain watch-items.
- **Driver not fired.** Maintainer chose supervised execution (stop before push). The driver landmine
  this would have hit — the unmentioned facet_values DB-seed — is now armed in the committed phase-4
  trigger for future runs.

## Verification

- **Green:** `test:resolver` **173/0**, `test:resolver-data` integrity all-pass (FKs, no dup ids/names,
  alias targets), `test:resolver-coverage` (250 books), `test:apply-override-dry` **ok** (250 books;
  `missing facet ids: 0` — commissar validates; all FK/role/range asserts pass; synopsis-lint "by label:
  none"), `lint` 0 errors (1 pre-existing font warning), `typecheck` 0, `brain:lint --no-write` 0 blocking.
- **Rating coverage 021..025:** 49 rated (all `goodreads`) + 1 null = 50; W40K-0205 carries the unrated
  marker (`rating=null`, `rating_source='goodreads'`). Matches the briefed ~49/50.
- **Call 2 (DB):** `work_facets.commissar` on W40K-0237 + W40K-0247; W40K-0237 protagonist_class facets =
  `{commissar}` only — `inquisitor` gone.
- **Call 3 (DB):** `work_persons` author rows W40K-0206→Steven B. Fischer, W40K-0244→Mike Vincent; both in
  `persons.json` (Fischer pre-existing, Vincent among the 8 auto-synced).
- **W40K-0244:** resolves `night_lords` (primary), not Imperial Guard. The freq-1 `Blades of Atrocity`
  warband stays surface-form (unresolved), as decided.
- **Smoke slugs (10; f/l/c/in_coll):** the-anarch `8/3/11/0`, the-green-tide `5/1/0/0` (Green-Tide gap,
  regression), inquisitor-draco `10/0/4/1` · blind `2/1/1/1`, grey-knights `3/0/3/1`, gunheads `2/1/1/1`,
  commissar `1/0/1/1`, baneblade `2/0/1/0`, the-remnant-blade `1/0/1/0`, warrior-brood `3/0/0/0`.
- **Audit-cockpit replica:** OLD 0001..0150 = 150 works / 83 drift / 60 gap / 30 in-collection; NEW
  0151..0250 = 100 works / 30 drift / 38 gap / 41 in-collection (crystallization drift + dense omnibus
  membership in the new range, as expected).
- **work_collections spotcheck:** Grey Knights Omnibus (W40K-0216) → W40K-0213/0214/0215. All 8 wave omnibi
  carry full roster constituents → **no `collection-gaps.json` entry needed** this wave.
- Apply log: `ingest/.last-run/phase4-apply-089.log` (gitignored).

## Maintainer handoff

- **W40K-0244 *The Remnant Blade* `seriesHint` mistag — NOT fixed (your call).** The roster carries
  `seriesHint: "Imperial Guard"` but the book is Night Lords (Chaos). The override + faction axis already
  resolve it correctly to `night_lords` (+ `data_conflict` flag). Fixing the roster `seriesHint` changes
  Series grouping — a maintainer Excel-SSOT edit, deliberately out of scope here.
- **Call-3 author backfill — done & verified.** W40K-0206 → Steven B. Fischer, W40K-0244 → Mike Vincent
  (Excel cells + `book-roster.json` regen via `import:ssot-roster`); both produce `work_persons` author
  rows post-apply.
- **Stop-before-push:** branch `codex/ingest-batches-resolver-pass-5` is committed (7 commits) but **not
  pushed** and no PR opened, per your instruction. Say "fertig" / "PR erstellen" to push + open the PR.

## Open issues / blockers

- None blocking. The brief's smoke-slug IDs were approximate (e.g. `the-anarch` is W40K-0038, not 0094;
  `crossfire`/`lasgun-wedding`/`wanted-dead` are wave-020 slugs) — I used the actual current slugs.

## For next session

- After merge: Loop-Re-Trigger `ssot-w40k-026..030` (the committed 250-pause block is advisory; the loop
  resumes automatically — do not re-trigger before this merges).
- Cowork Wiki-Hygiene pass (project-state counts → 250 books / 1153/455/701/79; reference 154/169/199;
  faction-policy +deathwatch/tempestus_scions notes; new ADR-worthy note: `commissar` protagonist_class).
- Candidate: backfill-retag earlier `guardsman`-workaround commissar POVs (Cain, Gaunt, Minka Lesk, …) to
  `commissar` now that the vocab exists (out of scope here — 089 retag was 021..025 only).
- `protagonist_class` watch-items still open: `tank_crew`, `penal_legion`, `psyker`/`sanctioned_psyker`.

## References

- Dossier: `sessions/resolver-dossiers/2026-05-21-089-resolver-pass-5-dossier.md`
- Phase reports: `…-phase-1-report.md` (factions), `…-phase-2-report.md` (locations), `…-phase-3-report.md` (characters)
- Brief: `sessions/2026-05-21-089-arch-resolver-pass-5.md`; Runbook: `docs/resolver-apply-runbook.md`; canonical workflow: Brief 076.
