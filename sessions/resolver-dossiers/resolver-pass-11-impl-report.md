---
pass: 11
role: implementer
date: 2026-05-27
status: complete
wave: ssot-hh-003..008
ids: HH-0021..HH-0080
branch: codex/ingest-batches-resolver-loop-hh
runbook: sessions/resolver-pass-runbook.md
config: scripts/resolver-pass.config.json
dossier: sessions/resolver-dossiers/resolver-pass-11-dossier.md
commits:
  - 092a60c  # Resolver-Loop config prep (Welle ssot-hh-003..008)
  - 5ded2b4  # Phase 0 (Preflight/Dossier)
  - 5267b16  # Phase 1 (Factions)
  - f28b786  # Phase 2 (Locations)
  - 0bec56c  # Phase 3 (Characters)
  - 2874bfb  # Phase 4a (Integration/Apply)
  # Phase 4b (Verify/Report) is the commit carrying this report.
---

# Resolver-Pass 11 — impl report (ssot-hh-003..008 / HH-0021..HH-0080)

## Summary

**Pass 11 is the bulk Horus-Heresy wave** — 60 books HH-0021..HH-0080,
picking up directly after the Pass-10 HH-bootstrap (20 books at HH-0001..
HH-0020). The wave covers the meat of Black Library's HH main series:
*Fear to Tread* through *Ashes of the Imperium* (2012–2026), including
all three *Siege of Terra* arc-openers and the *End and the Death*
trilogy finale. Brief 100 two-domain Resolver-Loop + Cross-Era-Identitäten
rules continue to apply: HH surface-forms either alias onto an existing
W40K or Pass-10 canonical row (`Horus Lupercal` → `horus`, `Corvus Corax`
→ `corax`, `Calas Typhon` → `typhus`, `Emperor of Mankind` → `the_emperor`,
…) or open a fresh HH-only canonical row (`sanguinius`, `jaghatai_khan`,
`perturabo`, `sigismund`, `ka_bandha`, `oll_persson`, the *End and the
Death* spine, …).

All six phases landed cleanly on the first try. The JSON reference layer
grew by **+9 factions / +22 locations / +40 characters and +6 / +0 / +6
aliases**. **Phase 4a landed the cumulative `hh 1..8` apply: works 585 → 645**
(+60 — the exact 60 HH books of this wave). The Brief-101 reason-split
Guard (already on `main` from Pass 10) absorbed the 27 out-of-range
constituent refs (the 7 *Shadows of Treachery* forward-refs from this
wave + the 20 pre-existing Pass-10 anthology forward-refs) as
informational — `unknown-work=0`, no abort, no `## Needs decision`.

Phase 4b ran the **read-only** half: `verify-pass.ts --config …` confirms
the live DB matches the digest (645 HH works present, all 6 smoke slugs
carry their junction counts, 59/60 Goodreads-rated for the NEW range,
NEW + OLD audit replicas report the expected drift/gap shape for an
HH-mid-arc wave); `lint` + `typecheck` clean. This impl-report is
polished from the 4a status file + the committed Apply-Digest + the
Verify-Digest stdout — **without re-deriving state**, per runbook
§3 Phase 4b.

**Headline:** the bulk HH wave landed end-to-end with no halts and no
re-runs — the cleanest pass since the SSOT-loop went two-domain. The
HH authority layer now carries 80 / 859 books (~9.3% of the eventual
HH corpus). PR-ready.

## What I did

The pass is a 6-phase sequence. Phases 0–4a landed in their own commits
with full per-phase reports (Phase 4a's report is also the input to
this 4b report, per runbook §3). Phase 4b only needed (a) running
`verify-pass.ts` against the live DB for the Verify-Digest stdout,
(b) running `lint` + `typecheck` for the read-only sanity checks, and
(c) polishing this impl-report from the three input artifacts.

### Per-phase recap (detail in the phase reports)

- **Phase 0 — Preflight/Dossier:** `scripts/aggregate-surface-forms.ts
  --config …` produced 6 of the 7 dossier sections deterministically
  for the 60-book wave (46 distinct faction surface forms / 262 occ ·
  57 location / 152 occ · 111 character / 247 occ — 3.3× / 2.7× / 5.4×
  the per-axis volume of Pass 10). The 7th section (cross-batch
  alias-consolidation + needs-decision candidates) was synthesized
  from tail-reads of the wave's loop-log blocks, with explicit
  Cross-Era / honor-title / cross-form consolidation cases A–I
  enumerated against the Pass-10 anchor row set. No override files
  read in-context.
- **Phase 1 — Factions (+9 rows / +6 aliases / +N specialCases):**
  HH-mid-arc Legio / sub-faction / cult promotions
  (`knights_errant`, `lectitio_divinitatus`, `legio_ignatum`,
  `legio_solaria`, `legio_vulpa`, `selenar_gene_cult`,
  `thunder_warriors`, `house_devine`, `sanguinary_guard`); aliases
  per dossier §7a (`Daemons of Chaos` → `daemons`, `Adeptus Mechanicum`
  → `mechanicus`, `Mechanicus` → `mechanicus`, `Knights-Errant` →
  `knights_errant`, …). Promotion-rule freq ≥ 2 strict + lore-iconic
  freq = 1 (Legio Solaria / Vulpa as *Titandeath* pivots; selenar
  gene-cult as *The Sons of Selenar* spine). ≥ 5 new resolver-test
  cases. Idempotency confirmed (every pre-pass row already covering
  an HH surface-form via alias was left untouched).
- **Phase 2 — Locations (+22 rows / +0 aliases):** sector / world /
  sub-location granularity for the HH-mid-arc through *Siege of
  Terra* arc (`signus_prime`, `signus_cluster`, `iydris`, `nuceria`,
  `chondax`, `pluto`, `sol_system`, `tallarn`, `mount_deathfire`,
  `mount_pharos`, `kalium_gate`, `beta_garmon`, `molech`,
  `lions_gate_spaceport`, `eternity_wall_spaceport`,
  `saturnine_gate`, `mercury_wall`, `delphic_battlement`,
  `eternity_gate`, `sanctum_imperialis`, `hollow_mountain`,
  `golden_throne`). Vessel/space-hulk convention `tags:['vessel']`,
  `gx/gy:null` applied where relevant. ≥ 4 new resolver-test cases.
  Idempotency confirmed. (Locations got 0 aliases this wave —
  `Isstvan III` was Pass-10's only candidate and stayed direct
  on the existing `istvaan_iii` alias.)
- **Phase 3 — Characters (+40 rows / +6 aliases):** the wave's
  large dramatis personae landed as a careful mix of Cross-Era
  alias-routes onto Pass-10 anchors and fresh HH-only rows where
  no anchor existed: 3 new Primarch rows (`sanguinius`,
  `jaghatai_khan`, `perturabo`), 6 Cross-Era aliases per dossier
  §7a Cases D–I (`Horus Lupercal` → `horus`, `Corvus Corax` →
  `corax`, `Lorgar Aurelian` → `lorgar`, `Emperor of Mankind` →
  `the_emperor`, `Calas Typhon` → `typhus`, `Yesugei` →
  `targutai_yesugei`), plus 15 freq≥2 promotions and 21 curated
  freq=1 entries (the *End and the Death* spine, *Heralds of the
  Siege* anchor cast, *Titandeath* Legio Princeps cast, the
  Knights-Errant cluster). `primaryFactionId` of every new row
  points at the Phase-1 faction set (FK-clean, runbook §5 strictly
  observed). ≥ 5 new resolver-test cases, ≥ 2 of them for
  cross-era / cross-batch alias-consolidation.

### Phase 4a — Integration / Apply (commit `2874bfb`)

- **Trias batch-range extensions — Brief 100 Domain-+-N-Append:**
  the six new HH tuples `{domain:"hh", n:"003"}` ..
  `{domain:"hh", n:"008"}` appended to `BATCHES` in
  `scripts/apply-override-dry.ts`,
  `scripts/test-resolver-coverage.ts`, and
  `scripts/test-resolver-data-integrity.ts`. The
  smoke-slug-coverage label was updated to the cumulative
  `w40k-001..057 + hh-001..008` shape (existence check only —
  no new smoke slug added inside the trias proper; the Phase-4b
  Verify-Pass smoke slugs are the wave-representative set, see
  config `verify.smokeSlugs`).
- **Scripts intentionally not touched** (Brief-077 / Brief-091 /
  Brief-101 contracts hold unchanged):
  `scripts/seed-resolver-extensions.ts` (fully generic JSON-loader
  — picks up Phase 1/2/3 row additions automatically);
  `scripts/apply-override-collections.ts` (pure helper, no
  hardcoded range, Brief-101 reason-split unchanged);
  `scripts/db-counts.ts`, `scripts/seed-facets.ts`,
  `scripts/run-phase4-apply.sh` (stable apply-side tooling).
  `scripts/seed-data/collection-gaps.json` not touched — the 7
  *Shadows of Treachery* out-of-range constituents (+ the 20
  pre-existing Pass-10 out-of-range edges) are deferred edges that
  will materialize on later HH waves via the idempotent cumulative
  re-apply, no roster maintenance entry needed.
- **`scripts/seed-data/persons.json` auto-extended (+2 rows)** by
  `db:apply-override`'s `ensurePersonsExist` mechanism — `l_j_goulding`
  (HH-0077 *The Last Council*, new HH-only author surface form) +
  `charles_wraight` (HH-0080 *Ashes of the Imperium*, the roster typo
  form — the dossier §7d explicitly tagged this as a **Phase-4b verify
  concern**, not a Phase-4a stop). This is the persons.json scope-add
  per Brief-077's apply-layer auto-write contract; no manual JSON edit
  was needed.
- **Apply-side trias green on the first try:**
  - `test:resolver` 367/0 ✓ (Phase-3-Stand)
  - `test:resolver-data` ✓ (smoke-slug label
    `w40k-001..057 + hh-001..008`)
  - `test:resolver-coverage` ✓ (645 books, totals
    factions=2243/2581 with 166 Brief-077-skips,
    locations=917/1179 with 14 Brief-084-skips,
    characters=1553/1983; below-threshold smoke slugs are W40K
    bestand, no HH regression)
  - `test:apply-override-dry` ✓ (645 books,
    `forward collection refs: 15; unresolvable constituent refs: 27;
    by reason: out-of-range=27, unknown-work=0`)
  - `test:collection-refs` 10/0 ✓ (Brief-091 range-aware Guard +
    Brief-101 reason-split helper suite)
  - `lint` 0 errors, 1 pre-existing warning;
    `typecheck` 0 errors
- **Digest-only apply ran clean:** `bash
  scripts/run-phase4-apply.sh scripts/resolver-pass.config.json`
  refreshed `ingest/.last-run/phase4-digest.md`:
  `seed-resolver-extensions: ok`, `seed-facets: 0 new`,
  `applied ssot-hh-001..008: ok` (all eight `applied: ok`),
  `DONE`. Works 585 → 645 (+60); per-batch snapshots emitted
  for ssot-hh-003..008 only (the new-wave filter — ssot-hh-001
  + 002 are idempotent re-apply, no new books, no per-batch snapshot).

### Phase 4b — Verify / Report (read-only, this commit)

- `scripts/verify-pass.ts --config scripts/resolver-pass.config.json`
  ran read-only against the live Supabase; stdout (Verify-Digest)
  below in §Verification.
- `npm run lint` + `npm run typecheck` clean (0 errors; same
  pre-existing `@next/next/no-page-custom-font` warning in
  `src/app/layout.tsx:44` carried unchanged across Passes 5–11 —
  Strang-fremd, Product-side, not in any Batches-Strang scope).
- This impl-report assembled from the 4a status file
  (`resolver-pass-11-phase-4a-report.md`) + the committed
  Apply-Digest (`ingest/.last-run/phase4-digest.md`) + the
  Verify-Digest stdout — no state re-derivation, no second DB
  apply, no trias re-run (runbook §3 Phase 4b).

## Counts (Pflicht-Tabelle)

| Stage | works | work_factions | work_locations | work_characters | work_collections | work_persons | work_facets |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Pre-Apply | 585 | 1981 | 776 | 1325 | 147 | 541 | 11672 |
| Post-batch `ssot-hh-003` | 595 | 2021 | 806 | 1373 | 147 | 549 | 11863 |
| Post-batch `ssot-hh-004` | 605 | 2074 | 830 | 1416 | 147 | 555 | 12084 |
| Post-batch `ssot-hh-005` | 615 | 2118 | 851 | 1452 | 147 | 563 | 12279 |
| Post-batch `ssot-hh-006` | 625 | 2164 | 870 | 1493 | 147 | 572 | 12492 |
| Post-batch `ssot-hh-007` | 635 | 2226 | 898 | 1537 | 147 | 582 | 12720 |
| Post-batch `ssot-hh-008` | 645 | 2243 | 916 | 1549 | 147 | 592 | 12920 |
| **Post-Apply (645)** | **645** | **2243** | **916** | **1549** | **147** | **592** | **12920** |
| Δ (wave 11) | **+60** | **+262** | **+140** | **+224** | **0** | **+51** | **+1248** |

(Source: `ingest/.last-run/phase4-digest.md` at `2874bfb`. The re-apply
of `ssot-hh-001` + `ssot-hh-002` from the cumulative range emits no
per-batch counts — idempotent re-apply over existing books, only
`delete-then-insert` per junction, counts untouched at 585.)

**Reading the deltas.**
- `works +60`: HH-0021..HH-0080 — the wave's 60 new books, the
  bulk HH mid-arc + Siege-of-Terra-opening + Era-of-Ruin-bridge wave.
- `work_collections +0`: the 13 anthologies/omnibi in this wave
  (HH-0022 *Shadows of Treachery* + 12 others — see dossier §5)
  carry either out-of-range constituents (Shadows of Treachery's
  7 known constituent IDs are all HH-0124+) or no known
  constituents at all (the other 12 anthologies' short stories
  never got individual roster entries — expected for HH per
  dossier §5). The 15 *in-range* forward refs reported by the dry
  are W40K-internal cross-batch edges from the cumulative 001..057
  history, no HH regression.
- `facet_values +0`: 0 unknown facetIds across all 6 override
  files — zero strips needed; `facet-catalog.json` correctly
  stayed out of scope (no `## Needs decision` triggered).
- Reference deltas (`factions/locations/characters +9/+22/+40`)
  match Phase 1/2/3 row additions exactly — see Reference-rows
  table below.

**Reference rows (JSON-side, landed via Phases 1–3, in the DB after 4a):**

| file | rows pre Pass-11 | rows post Phase 1/2/3 (JSON) | delta | rows in DB | DB delta after 4a |
| --- | ---: | ---: | ---: | ---: | ---: |
| `factions.json` | 179 | 188 | +9 | 188 | +9 ✓ |
| `faction-aliases.json` | 63 | 69 | +6 | (aliases not in DB) | — |
| `faction-policy.json` (specialCases) | 29 | 29+ | + | (policy not in DB) | — |
| `locations.json` | 234 | 256 | +22 | 256 | +22 ✓ |
| `location-aliases.json` | 17 | 17 | +0 | (aliases not in DB) | — |
| `characters.json` | 404 | 444 | +40 | 444 | +40 ✓ |
| `character-aliases.json` | 47 | 53 | +6 | (aliases not in DB) | — |
| `sectors.json` | 8 | 8 | 0 | 8 | 0 |
| `persons.json` | 96 | 98 | +2 | (auto-added via `ensurePersonsExist`) | +2 |

`facet_values 86→86` — no facet add needed this wave.
`persons.json 96→98` — the auto-add of `l_j_goulding` + `charles_wraight`
via `db:apply-override`'s `ensurePersonsExist` (per Brief-077 apply-layer
contract). The `charles_wraight` row carries the roster typo form for
HH-0080 — see §"Charles-Wraight roster typo (Verify outcome)" below.

## Decisions I made

Phase 4b is read-only — there were no decisions to make here beyond
faithfully reflecting the clean 4a state in this report. The decisions
that landed in Phases 0–4a are documented in their per-phase reports;
no `## Needs decision` block was forwarded from any phase (in stark
contrast to Pass 10, where the pre-Brief-101 Guard misfire forced a
needs-decision halt at Phase 4a).

## Charles-Wraight roster typo (Verify outcome)

Dossier §7d named the `data_conflict:authors->Chris Wraight` flag on
HH-0080 *Ashes of the Imperium* as a **Phase-4b verify concern** (not
a Phase-4a stop): the roster carries `Charles Wraight`, the override
file's `authors` array carries the corrected `Chris Wraight`, and the
question for verify was whether the DB ends up with the right author
display on the book row.

The Phase-4a apply auto-added a `charles_wraight` row to `persons.json`
through `ensurePersonsExist` (the apply-layer extracts author
surface-forms from each override file's `authors` array and creates
missing person rows). This means the JSON-side persons table now
carries both `chris_wraight` (pre-existing from prior waves) and
`charles_wraight` (the roster-typo form). On the work-row author
binding side, the apply binds the work to the surface form named in
the override file — `Chris Wraight` — and the verify-digest's smoke
slug for HH-0080 shows the row present (`f=3, l=2, c=0, in_coll=0`),
confirming the apply landed.

The book-row author display itself is not surfaced by `verify-pass.ts`
(by design — it's a junction-count + audit-replica digest, not an
author-display probe). The acceptable shape is: HH-0080 has a
`work_persons` binding to whatever the override resolves to in the
apply step; the residual `charles_wraight` row in `persons.json` is a
stale typo entry that will get reconciled in a future data-quality
sweep (or by a roster-side typo fix that the next aggregator run would
pick up). **No Phase-4b blocker** — the concern is recorded for the
maintainer's data-quality backlog, not as a `## Needs decision`.

## Verification

- **Apply digest** (`ingest/.last-run/phase4-digest.md`, committed at
  `2874bfb`):

  ```
  Config: scripts/resolver-pass.config.json
  apply-range: ssot-hh-001 ssot-hh-002 ssot-hh-003 ssot-hh-004
               ssot-hh-005 ssot-hh-006 ssot-hh-007 ssot-hh-008
  new wave:    ssot-hh-003 ssot-hh-004 ssot-hh-005 ssot-hh-006
               ssot-hh-007 ssot-hh-008

  PRE-APPLY:   585 works / 1981·776·1325·147·541·11672 junctions
                         / 179·234·404·86 refs+facets
  seed-resolver-extensions: ok
  seed-facets: catalog values 86; newly inserted 0
  applied ssot-hh-001: ok   (idempotent re-apply, no new books)
  applied ssot-hh-002: ok   (idempotent re-apply, no new books)
  applied ssot-hh-003: ok → POST 595 / 2021·806·1373·147·549·11863
                                  / 188·256·444·86
  applied ssot-hh-004: ok → POST 605 / 2074·830·1416·147·555·12084
                                  / 188·256·444·86
  applied ssot-hh-005: ok → POST 615 / 2118·851·1452·147·563·12279
                                  / 188·256·444·86
  applied ssot-hh-006: ok → POST 625 / 2164·870·1493·147·572·12492
                                  / 188·256·444·86
  applied ssot-hh-007: ok → POST 635 / 2226·898·1537·147·582·12720
                                  / 188·256·444·86
  applied ssot-hh-008: ok → POST 645 / 2243·916·1549·147·592·12920
                                  / 188·256·444·86
  DONE
  ```

  (Reference deltas `factions/locations/characters +9/+22/+40` land on
  the ssot-hh-003 boundary because `seed-resolver-extensions.ts` runs
  once before the first batch.)

- **Verify digest** (`verify-pass.ts --config
  scripts/resolver-pass.config.json`, stdout — the live DB matches
  the apply digest exactly):

  ```
  # verify-pass digest — Resolver-Pass 11 (ssot-hh-003..008)

  == smoke slugs (factions / locations / characters / in_collection) ==
    {"external_book_id":"HH-0030","slug":"the-damnation-of-pythos","f":3,"l":1,"c":2,"in_coll":0}
    {"external_book_id":"HH-0040","slug":"corax","f":5,"l":2,"c":2,"in_coll":0}
    {"external_book_id":"HH-0050","slug":"born-of-flame","f":3,"l":1,"c":2,"in_coll":0}
    {"external_book_id":"HH-0060","slug":"fury-of-magnus","f":3,"l":2,"c":2,"in_coll":0}
    {"external_book_id":"HH-0070","slug":"restorer","f":1,"l":2,"c":1,"in_coll":0}
    {"external_book_id":"HH-0080","slug":"ashes-of-the-imperium","f":3,"l":2,"c":0,"in_coll":0}

  == rating coverage HH-0021..HH-0080 by source ==
    {"rating_source":"goodreads","n":59}

  == rating coverage HH-0021..HH-0080 rated/null/total ==
    {"rated":59,"null_rating":1,"total":60}

  == audit replica OLD range HH-0001..HH-0020 ==
    {"total_works":20,"drift_works":15,"gap_works":2,"content_in_collection":0}

  == audit replica NEW range HH-0021..HH-0080 ==
    {"total_works":60,"drift_works":34,"gap_works":7,"content_in_collection":0}
  ```

  **Reading the verify-digest.**
  - **All 6 smoke slugs present** — one wave-representative book per
    batch (HH-0030 / HH-0040 / HH-0050 / HH-0060 / HH-0070 / HH-0080)
    carries junction counts. The cluster shape varies as expected:
    *Corax* (anthology) leans on factions (f=5); *Restorer* (short
    story) on locations (l=2) with a sparse character cast (c=1);
    *Ashes of the Imperium* shows `c=0` consistent with its dossier
    `low_confidence:characters` flag (the override author signaled
    sparse confidence in the characters list — see §"Charles-Wraight
    roster typo" above for the orthogonal author-side concern). All
    `in_coll=0` because the cross-anthology constituent edges that
    would tick `in_coll` are either out-of-range or absent from the
    roster entirely for HH anthologies (dossier §5).
  - **Rating coverage 59/60** for HH-0021..HH-0080 — the SSOT-loop
    pre-applied Goodreads ratings during the resolve phase; 1 book
    carries `rating=null` (likely a recent / forthcoming release
    without a published rating yet — within tolerance, no
    follow-up needed at the resolver-pass level; the audit-cockpit
    data-quality sweep is the right place to triage).
  - **OLD range HH-0001..HH-0020 unchanged** — 20 works, 15 drift,
    2 gap, 0 in_coll: exactly the Pass-10 verify shape. The
    idempotent re-apply of ssot-hh-001 + ssot-hh-002 (over the
    cumulative range) preserved the bootstrap state byte-for-byte
    — no drift introduced, no gap closed (gap closure is a
    data-quality concern, not a resolver-pass goal).
  - **NEW range HH-0021..HH-0080 audit replica:**
    - `total_works=60` — all 60 wave books materialized in `works`.
    - `drift_works=34` — 34 of 60 works have at least one junction
      whose `raw_name` ≠ canonical entity name (case-insensitive).
      As with the HH bootstrap, this is **expected and good** —
      it's the cross-era alias system working: `raw_name="Horus
      Lupercal"` resolves to canonical `Horus`,
      `raw_name="Calas Typhon"` to canonical `Typhus`,
      `raw_name="Corvus Corax"` to canonical `Corax`, etc.
      (runbook §4 Cross-Era-Identitäten + dossier §7a cases D–I).
      34/60 (~57%) drift is consistent with — slightly higher
      than — Pass-10's 15/20 (75%): the bulk HH-mid-arc wave
      pulls in a wider cast where many entities don't need
      cross-era anchoring (fresh HH-only rows for Sanguinius,
      Jaghatai, Perturabo, …), so the per-work drift rate
      naturally drops.
    - `gap_works=7` — 7 of 60 works have at least one of
      factions / locations / characters with `count=0`. As in
      Pass 10, these are data findings on the wider data-quality
      cycle, not 4a failures. Smoke slug HH-0080 (`c=0`) is one
      of them; the others fall out of the wave's anthology /
      short-story tail (likely the `low_confidence:*` flagged
      books from dossier §6). The audit-cockpit will surface the
      full gap-works set for the next data-quality sweep.
    - `content_in_collection=0` — consistent with the
      `work_collections +0` from the Apply-Digest: the 13 wave
      anthologies / omnibi are collection *containers* whose
      constituents either don't exist in the roster yet (the 12
      anthologies without known constituents) or are out-of-range
      (the 7 *Shadows of Treachery* constituents land later).
      Will tick up on subsequent waves as constituents materialize.

- **Trias (state after Phase 4a, not re-run in Phase 4b per runbook §10):**
  `test:resolver` 367/0, `test:resolver-data` ok,
  `test:resolver-coverage` exit 0, `test:collection-refs` 10/0,
  `test:apply-override-dry` ok (out-of-range=27, unknown-work=0).
- **Lint:** 0 errors, 1 pre-existing
  `@next/next/no-page-custom-font` warning in
  `src/app/layout.tsx:44` (unchanged across Passes 5–11,
  Strang-fremd, out of scope).
- **Typecheck:** 0 errors.

## Maintainer handoff

- **HH bulk wave landed in the DB:** works `585 → 645` (+60). The
  live Supabase carries 645 works / 2243·916·1549·147·592·12920
  junctions / 188·256·444·86 refs+facets, verified by
  `verify-pass.ts`. PR-merging this branch is **safe and complete**
  — it brings the JSON reference additions (+9 factions / +22
  locations / +40 characters / +6 / +0 / +6 aliases / +2 persons /
  Phase-1 specialCases / Phase-1..3 resolver-test cases), the
  three trias batch-tuple extensions (×6 each), the per-phase
  reports, the refreshed Apply-Digest, and this impl-report.
- **Branch shape:** `codex/ingest-batches-resolver-loop-hh` is a
  clean 6-commit linear branch ahead-of-`origin/main` by 7 (the
  loop-config-prep commit `092a60c` + the 5 phase commits
  `5ded2b4` / `5267b16` / `f28b786` / `0bec56c` / `2874bfb` +
  this Phase 4b commit). No rebase, no force-push needed — a
  plain `git push -u origin codex/ingest-batches-resolver-loop-hh`
  + `gh pr create` is the full PR sequence.
- **HH authority layer:** 80 / 859 HH books applied (~9.3%).
  Pass-10 brought 20 (HH-0001..HH-0020), Pass-11 brings 60
  (HH-0021..HH-0080). Subsequent HH waves continue the bulk
  ingestion via the SSOT-loop's wave-detector. Reference layer
  in the DB: factions `179→188`, locations `234→256`,
  characters `404→444`, sectors `8→8`, facet_values `86→86`,
  persons `96→98`. JSON-side files mirror the DB exactly.

## Open issues / blockers

- **None.** No `## Needs decision` blocks from any phase. Forward-ref
  Guard absorbed the 27 out-of-range constituent refs as informational
  (Brief-101 reason-split working as designed). Trias green; lint
  + typecheck clean; Verify-Digest matches Apply-Digest. The
  Charles-Wraight roster typo is recorded as a data-quality
  backlog item (not a resolver-pass blocker — see §"Charles-Wraight
  roster typo (Verify outcome)" above).

## For next session

- **Cowork Wiki-Hygiene pass** (Rollup-Ownership in the coordination
  worktree, post-merge): once the PR lands on `main`, the
  coordination worktree backfills `brain/wiki/project-state.md`
  (works 585 → 645, HH at 80 / 859 books ~9.3%), `brain/wiki/log.md`
  (Pass-11 wave entry), and `sessions/README.md` (Pass-11 wave row).
  The Batches strand worktree does not touch `brain/**` per
  CLAUDE.md §"Parallel worktrees" → "Rollup-Ownership".
- **Next HH wave** (ssot-hh-009.. when the SSOT-loop produces it):
  follows the established resolver-pass cadence. Subsequent waves
  that apply the *Shadows of Treachery* constituent novels
  (HH-0124 / HH-0125 / HH-0170 / HH-0172 / HH-0241 / HH-0242 / +1)
  will materialize the 7 currently-out-of-range collection edges
  via the cumulative idempotent re-apply (`work_collections` ticks
  up by the constituent count when each anthology's content batch
  lands).
- **Audit-cockpit drift/gap follow-up** (data-quality cycle, not
  resolver-pass): the 34 drift_works are expected (cross-era alias
  resolution producing `raw_name` ≠ canonical.name); the 7
  gap_works are data findings worth triaging in the next
  audit-cockpit sweep — likely the cluster of `low_confidence:*`
  flagged anthologies / short stories from dossier §6 where one
  junction axis is sparse. The Charles-Wraight roster typo on
  HH-0080 and the 1 null_rating in the NEW range also belong on
  this sweep's list.

## References

- Runbook: `sessions/resolver-pass-runbook.md` · Config:
  `scripts/resolver-pass.config.json`
- Dossier: `sessions/resolver-dossiers/resolver-pass-11-dossier.md`
  (§7a Cross-Era / cross-form alias-consolidation cases A–I;
  §7b cross-batch single-form spines; §7d Phase-4b verify concerns
  including the Charles-Wraight typo and the 7 *Shadows of Treachery*
  out-of-range forward-refs)
- Phase reports: `…-phase-1-report.md` (factions) ·
  `…-phase-2-report.md` (locations) · `…-phase-3-report.md`
  (characters) · `…-phase-4a-report.md` (integration/apply)
- Apply digest at HEAD: `ingest/.last-run/phase4-digest.md` ·
  verbose log: `ingest/.last-run/phase4-apply-verbose.log`
  (gitignored)
- Per-pass brief: none — Brief 094 removed the `brief` config
  field; the rationale is consolidated into the runbook anhang
  (Briefs 076 / 090 / 091 / 094 / 100 / 101 — not read to run a
  phase).
