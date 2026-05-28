---
pass: 12
role: implementer
date: 2026-05-27
status: complete
wave: ssot-hh-009..014
ids: HH-0081..HH-0140
branch: codex/ingest-batches-resolver-loop-hh
runbook: sessions/resolver-pass-runbook.md
config: scripts/resolver-pass.config.json
dossier: sessions/resolver-dossiers/resolver-pass-12-dossier.md
commits:
  - 50c15fc  # Resolver-Loop config prep (Welle ssot-hh-009..014)
  - 08406e1  # Phase 0 (Preflight/Dossier)
  - 8301bb9  # Phase 1 (Factions)
  - db9493f  # Phase 2 (Locations)
  - f618eff  # Phase 3 (Characters)
  - 4e4424b  # Phase 4a (Integration/Apply)
  # Phase 4b (Verify/Report) is the commit carrying this report.
---

# Resolver-Pass 12 — impl report (ssot-hh-009..014 / HH-0081..HH-0140)

## Summary

**Pass 12 is the HH past-mid-arc wave** — 60 books HH-0081..HH-0140,
picking up directly after the Pass-11 bulk wave (60 books at
HH-0021..HH-0080). The wave covers the *Sons of the Emperor* Primarchs-
Monograph bloc (HH-0100..HH-0109, including the 9-constituent anthology
*Sons of the Emperor* at HH-0090), the *Valdor / Birth of the Imperium*
trilogy of Custodes / Thunder Warrior bridge-novels, the *Cybernetica*
/ *Serpent Beneath* late-Heresy novellas, and closes on the *Visions of
Heresy* art-book at HH-0140. Brief 100 two-domain Resolver-Loop +
Cross-Era-Identitäten rules continue to apply: HH surface-forms either
alias onto an existing W40K or Pass-10/11 canonical row (`Hrend` →
`hrend` as a new fresh row, `Nurgle` → fresh row anchor for the daemon
god, …) or open a fresh HH-only canonical row where no anchor exists.

All six phases landed cleanly on the first try. The JSON reference layer
grew by **+2 factions / +11 locations / +13 characters and +1 / +2 / +3
aliases**. **Phase 4a landed the cumulative `hh 1..14` apply: works
645 → 705** (+60 — the exact 60 HH books of this wave). The Brief-101
reason-split Guard absorbed the 21 out-of-range constituent refs (down
from Pass-11's 27 — because Pass 12 brought the HH-0020 → HH-0117..0120
and HH-0022 → HH-0124..0125 edges into range) as informational —
`unknown-work=0`, no abort, no `## Needs decision`.

Phase 4b ran the **read-only** half: `verify-pass.ts --config …` confirms
the live DB matches the digest (705 HH+W40K works present, all 6 smoke
slugs carry their junction counts, 60/60 Goodreads-rated for the NEW
range, NEW + OLD audit replicas report the expected drift/gap shape for
an HH-past-mid-arc wave); `lint` + `typecheck` clean. This impl-report
is polished from the 4a status file + the committed Apply-Digest + the
Verify-Digest stdout — **without re-deriving state**, per runbook §3
Phase 4b.

**Headline:** the HH past-mid-arc wave landed end-to-end with no halts
and no re-runs, the second clean two-domain pass in a row. The HH
authority layer now carries 140 / 859 books (~16.3% of the eventual HH
corpus). The *Sons of the Emperor* anthology bloc (HH-0090) lit up the
first **`content_in_collection=15`** in any HH NEW range — 9 in-wave
constituents (HH-0101..HH-0109) + 6 Pass-11-baseline forward-refs
absorbed (HH-0020 → HH-0117..0120 + HH-0022 → HH-0124..0125). PR-ready.

## What I did

The pass is a 6-phase sequence. Phases 0–4a landed in their own commits
with full per-phase reports (Phase 4a's report is also the input to
this 4b report, per runbook §3). Phase 4b only needed (a) running
`verify-pass.ts` against the live DB for the Verify-Digest stdout,
(b) running `lint` + `typecheck` for the read-only sanity checks, and
(c) polishing this impl-report from the three input artifacts.

### Per-phase recap (detail in the phase reports)

- **Phase 0 — Preflight/Dossier** (`08406e1`): `scripts/aggregate-
  surface-forms.ts --config …` produced 6 of the 7 dossier sections
  deterministically for the 60-book wave; the 7th section
  (cross-batch alias-consolidation + needs-decision candidates) was
  synthesized from tail-reads of the wave's loop-log blocks, with
  Cross-Era / honor-title / cross-form consolidation cases against
  the Pass-10/11 anchor row set. No override files read in-context.
- **Phase 1 — Factions** (`8301bb9`, +2 rows / +1 alias): two new
  freq≥2 / lore-iconic faction rows: `rangdan` (xeno faction
  referenced in HH-0094 *Sons of the Selenar* / HH-0117..0120
  cluster) + `hrud` (xeno faction referenced multiple times in the
  *Valdor* / *Birth of the Imperium* spine), plus 1 cross-era
  alias. ≥ 5 new resolver-test cases. Idempotency confirmed (every
  pre-pass row already covering an HH surface-form via alias was
  left untouched).
- **Phase 2 — Locations** (`db9493f`, +11 rows / +2 aliases):
  sector / world / sub-location granularity for the HH-past-mid-arc
  through *Valdor* / *Sons of the Emperor* arc — `galaspar` plus
  the 3 Primarch-birthworlds (`olympia` Perturabo, `barbarus`
  Mortarion, `cthonia` Horus) that the Primarchs-Monograph bloc
  unlocked, plus 7 curated lore-iconic adds (`kiavahr` Corax,
  `thramas_sector` *Master of Mankind* arc, `urgall_depression`
  Isstvan V battle-site, `occluda_noctis` daemon-engine genesis,
  `deshea` Mortarion/Barbarus, `alaxxes_nebula` Iron Hands /
  Salamanders arc, `constanix_ii` Mechanicum war-world). Vessel
  convention `tags:['vessel']`, `gx/gy:null` applied where
  relevant. ≥ 4 new resolver-test cases. Idempotency confirmed.
- **Phase 3 — Characters** (`f618eff`, +13 rows / +3 aliases):
  the wave's targeted dramatis personae landed as a careful mix:
  2 freq≥2 promotions from the Calth-Underworld spine
  (`kurtha_sedd`, `steloc_aethon`) + 11 curated freq=1 entries
  (`barabas_dantioch` Iron Warriors loyalist, `sor_talgron` Word
  Bearers, `ingethel` daemon-host, `kandawire` *Master of
  Mankind*, `amar_astarte` Sisters of Silence proto, `ilya_
  ravallion` *Scars*, `hasik_khan` White Scars, `holguin` Dark
  Angels, `redloss` Sons of Horus, `hrend` daemon engine, `nurgle`
  Plague God anchor row). `primaryFactionId` of every new row
  points at the Phase-1 faction set (FK-clean, runbook §5 strictly
  observed). ≥ 5 new resolver-test cases, ≥ 2 of them for
  cross-era / cross-batch alias-consolidation.

### Phase 4a — Integration / Apply (commit `4e4424b`)

- **Trias batch-range extensions — Brief 100 Domain-+-N-Append:**
  the six new HH tuples `{domain:"hh", n:"009"}` ..
  `{domain:"hh", n:"014"}` appended to `BATCHES` in
  `scripts/apply-override-dry.ts`,
  `scripts/test-resolver-coverage.ts`, and
  `scripts/test-resolver-data-integrity.ts`. In the data-integrity
  script the hardcoded `coverage smoke slugs` label range was
  updated from `hh-001..008` to `hh-001..014` (parity to the
  Pass-11 `hh-001..002 → hh-001..008` bump).
- **Scripts intentionally not touched** (Brief-077 / Brief-091 /
  Brief-101 contracts hold unchanged):
  `scripts/seed-resolver-extensions.ts` (fully generic JSON-loader
  — picks up Phase 1/2/3 row additions automatically);
  `scripts/apply-override-collections.ts` (pure helper, no
  hardcoded range, Brief-101 reason-split unchanged);
  `scripts/db-counts.ts`, `scripts/seed-facets.ts`,
  `scripts/run-phase4-apply.sh` (stable apply-side tooling).
  `scripts/seed-data/collection-gaps.json` not touched — the 21
  out-of-range constituents are HH-Folge-Wellen / W40K-Omnibus
  deferred edges that will materialize on later waves via the
  cumulative idempotent re-apply, no roster maintenance entry
  needed.
- **`scripts/seed-data/persons.json` auto-extended (+2 rows)** by
  `db:apply-override`'s `ensurePersonsExist` mechanism —
  `brandon_easton` (HH-0109 *Ember of Extinction*, new BL-author
  Authority-Layer-Erstauftritt) + `alan_merrett` (HH-0140
  *Visions of Heresy*, art-book author Authority-Layer-
  Erstauftritt). Anthology editors with `author: "?"` in the
  roster (*Sons of the Emperor*, *Scions of the Emperor*,
  *Blood of the Emperor*) correctly created no Persons row
  (multi-author-anthology convention).
- **Apply-side trias green on the first try:**
  - `test:resolver` 392/0 ✓ (Phase-3-Stand)
  - `test:resolver-data` ✓ (smoke-slug label `hh-001..014`)
  - `test:resolver-coverage` ✓ (705 books; informational
    below-threshold rows are pre-existing W40K data findings,
    no HH regression)
  - `test:apply-override-dry` ✓ (705 books,
    `forward collection refs: 30; unresolvable constituent refs:
    21; by reason: out-of-range=21, unknown-work=0`)
  - `test:collection-refs` 10/0 ✓ (Brief-091 range-aware Guard +
    Brief-101 reason-split helper suite)
  - `lint` 0 errors, 1 pre-existing warning;
    `typecheck` 0 errors
- **Digest-only apply ran clean:** `bash
  scripts/run-phase4-apply.sh scripts/resolver-pass.config.json`
  refreshed `ingest/.last-run/phase4-digest.md`:
  `seed-resolver-extensions: ok`, `seed-facets: 0 new`,
  `applied ssot-hh-001..014: ok` (all 14 `applied: ok`),
  `DONE`. Works 645 → 705 (+60); per-batch snapshots emitted
  for ssot-hh-009..014 only (the new-wave filter — ssot-hh-001..008
  are idempotent re-apply, no new books, no per-batch snapshot).

### Phase 4b — Verify / Report (read-only, this commit)

- `scripts/verify-pass.ts --config scripts/resolver-pass.config.json`
  ran read-only against the live Supabase; stdout (Verify-Digest)
  below in §Verification.
- `npm run lint` + `npm run typecheck` clean (0 errors; same
  pre-existing `@next/next/no-page-custom-font` warning in
  `src/app/layout.tsx:44` carried unchanged across Passes 5–12 —
  Strang-fremd, Product-side, not in any Batches-Strang scope).
- This impl-report assembled from the 4a status file
  (`resolver-pass-12-phase-4a-report.md`) + the committed
  Apply-Digest (`ingest/.last-run/phase4-digest.md`) + the
  Verify-Digest stdout — no state re-derivation, no second DB
  apply, no trias re-run (runbook §3 Phase 4b).

## Counts (Pflicht-Tabelle)

| Stage | works | work_factions | work_locations | work_characters | work_collections | work_persons | work_facets |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Pre-Apply | 645 | 2243 | 916 | 1549 | 147 | 592 | 12920 |
| Post-batch `ssot-hh-009` | 655 | 2267 | 923 | 1578 | 147 | 601 | 13133 |
| Post-batch `ssot-hh-010` | 665 | 2292 | 938 | 1605 | 147 | 609 | 13341 |
| Post-batch `ssot-hh-011` | 675 | 2311 | 942 | 1628 | 156 | 619 | 13529 |
| Post-batch `ssot-hh-012` | 685 | 2334 | 949 | 1654 | 160 | 629 | 13715 |
| Post-batch `ssot-hh-013` | 695 | 2359 | 960 | 1672 | 162 | 639 | 13914 |
| Post-batch `ssot-hh-014` | 705 | 2380 | 972 | 1692 | 162 | 647 | 14096 |
| **Post-Apply (705)** | **705** | **2380** | **972** | **1692** | **162** | **647** | **14096** |
| Δ (wave 12) | **+60** | **+137** | **+56** | **+143** | **+15** | **+55** | **+1176** |

(Source: `ingest/.last-run/phase4-digest.md` at `4e4424b`. The re-apply
of `ssot-hh-001..008` from the cumulative range emits no per-batch
counts — idempotent re-apply over existing books, only
`delete-then-insert` per junction, counts untouched at 645.)

**Reading the deltas.**
- `works +60`: HH-0081..HH-0140 — the wave's 60 new books, the
  HH past-mid-arc + Primarchs-Monograph + Valdor-trilogy +
  late-Heresy-novella wave.
- `work_collections +15`: the *Sons of the Emperor* anthology
  (HH-0090) absorbed its 9 constituents (HH-0101..HH-0109) into
  the collection junction layer — the first in-wave anthology
  bloc to fully materialize in an HH wave. The remaining 6 land
  via the cumulative re-apply absorbing the Pass-11-baseline
  Pass-10/11 out-of-range edges (HH-0020 → HH-0117..0120 = 4 +
  HH-0022 → HH-0124..0125 = 2) — now in-range. The 4 in-range
  forward refs from this wave (the same 4 of HH-0020 → HH-0117..
  0120 set, counted in the dry's 30 forward refs) are the
  cross-batch edges the ascending sweep resolves cleanly.
- `facet_values +0`: 0 unknown facetIds across all 6 override
  files — zero strips needed; `facet-catalog.json` correctly
  stayed out of scope (no `## Needs decision` triggered).
- Reference deltas (`factions/locations/characters +2/+11/+13`)
  match Phase 1/2/3 row additions exactly — see Reference-rows
  table below.

**Reference rows (JSON-side, landed via Phases 1–3, in the DB after 4a):**

| file | rows pre Pass-12 | rows post Phase 1/2/3 (JSON) | delta | rows in DB | DB delta after 4a |
| --- | ---: | ---: | ---: | ---: | ---: |
| `factions.json` | 188 | 190 | +2 | 190 | +2 ✓ |
| `faction-aliases.json` | 69 | 70 | +1 | (aliases not in DB) | — |
| `locations.json` | 256 | 267 | +11 | 267 | +11 ✓ |
| `location-aliases.json` | 17 | 19 | +2 | (aliases not in DB) | — |
| `characters.json` | 444 | 457 | +13 | 457 | +13 ✓ |
| `character-aliases.json` | 53 | 56 | +3 | (aliases not in DB) | — |
| `sectors.json` | 8 | 8 | 0 | 8 | 0 |
| `persons.json` | 98 | 100 | +2 | (auto-added via `ensurePersonsExist`) | +2 |

`facet_values 86→86` — no facet add needed this wave.
`persons.json 98→100` — the auto-add of `brandon_easton` +
`alan_merrett` via `db:apply-override`'s `ensurePersonsExist` (per
Brief-077 apply-layer contract).

## Decisions I made

Phase 4b is read-only — there were no decisions to make here beyond
faithfully reflecting the clean 4a state in this report. The decisions
that landed in Phases 0–4a are documented in their per-phase reports;
no `## Needs decision` block was forwarded from any phase. Pass 12 is
the second consecutive clean two-domain pass (Pass 11 was the first).

## Sons of the Emperor anthology bloc (in_coll lights up)

Dossier §1 forecast the *Sons of the Emperor* anthology (HH-0090) as
the wave's structural highlight: a 9-constituent Primarchs-Monograph
collection whose constituents land **inside the same wave**
(HH-0101..HH-0109). The Verify-Digest confirms the apply landed all 9
forward refs cleanly via the ascending sweep, materializing
**`content_in_collection=15`** for the NEW range HH-0081..HH-0140 —
the first HH wave to register *any* in-collection content (Passes 10
and 11 both had `content_in_collection=0` in their NEW range, because
their anthologies' constituents were either out-of-range or never
rostered).

The 15 breaks down as:
- 9 in-wave: HH-0090 → HH-0101..HH-0109 (*Sons of the Emperor*
  constituents, all in HH-0081..HH-0140)
- 4 absorbed Pass-10-baseline: HH-0020 → HH-0117..HH-0120 (an HH-0020
  anthology's constituents now in range as of this wave)
- 2 absorbed Pass-11-baseline: HH-0022 → HH-0124..HH-0125
  (*Shadows of Treachery* constituents now in range as of this wave)

The dossier-§7d Phase-4b verify concern ("does the *Sons of the
Emperor* bloc resolve cleanly without forward-ref leakage?") is
**resolved positively** — `unknown-work=0`, all 15 forward-ref edges
landed in `work_collections`, no `## Needs decision`.

## Verification

- **Apply digest** (`ingest/.last-run/phase4-digest.md`, committed at
  `4e4424b`):

  ```
  Config: scripts/resolver-pass.config.json
  apply-range: ssot-hh-001 ssot-hh-002 ssot-hh-003 ssot-hh-004
               ssot-hh-005 ssot-hh-006 ssot-hh-007 ssot-hh-008
               ssot-hh-009 ssot-hh-010 ssot-hh-011 ssot-hh-012
               ssot-hh-013 ssot-hh-014
  new wave:    ssot-hh-009 ssot-hh-010 ssot-hh-011 ssot-hh-012
               ssot-hh-013 ssot-hh-014

  PRE-APPLY:   645 works / 2243·916·1549·147·592·12920 junctions
                         / 188·256·444·86 refs+facets
  seed-resolver-extensions: ok
  seed-facets: catalog values 86; newly inserted 0
  applied ssot-hh-001..008: ok   (idempotent re-apply, no new books)
  applied ssot-hh-009: ok → POST 655 / 2267·923·1578·147·601·13133
                                  / 190·267·457·86
  applied ssot-hh-010: ok → POST 665 / 2292·938·1605·147·609·13341
                                  / 190·267·457·86
  applied ssot-hh-011: ok → POST 675 / 2311·942·1628·156·619·13529
                                  / 190·267·457·86
  applied ssot-hh-012: ok → POST 685 / 2334·949·1654·160·629·13715
                                  / 190·267·457·86
  applied ssot-hh-013: ok → POST 695 / 2359·960·1672·162·639·13914
                                  / 190·267·457·86
  applied ssot-hh-014: ok → POST 705 / 2380·972·1692·162·647·14096
                                  / 190·267·457·86
  DONE
  ```

  (Reference deltas `factions/locations/characters +2/+11/+13` land on
  the ssot-hh-009 boundary because `seed-resolver-extensions.ts` runs
  once before the first batch. `work_collections` ticks up on
  ssot-hh-011 (+9, *Sons of the Emperor* bloc) and ssot-hh-012/013
  (+4 + +2, the absorbed Pass-10/11 baseline edges) — exactly the
  Sons-of-the-Emperor + baseline-absorption shape.)

- **Verify digest** (`verify-pass.ts --config
  scripts/resolver-pass.config.json`, stdout — the live DB matches
  the apply digest exactly):

  ```
  # verify-pass digest — Resolver-Pass 12 (ssot-hh-009..014)

  == smoke slugs (factions / locations / characters / in_collection) ==
    {"external_book_id":"HH-0090","slug":"sons-of-the-emperor","f":8,"l":0,"c":6,"in_coll":0}
    {"external_book_id":"HH-0100","slug":"sanguinius-the-great-angel","f":1,"l":0,"c":1,"in_coll":0}
    {"external_book_id":"HH-0110","slug":"valdor-birth-of-the-imperium","f":3,"l":1,"c":4,"in_coll":0}
    {"external_book_id":"HH-0120","slug":"the-serpent-beneath","f":1,"l":1,"c":2,"in_coll":1}
    {"external_book_id":"HH-0130","slug":"cybernetica","f":3,"l":1,"c":2,"in_coll":0}
    {"external_book_id":"HH-0140","slug":"visions-of-heresy","f":0,"l":0,"c":0,"in_coll":0}

  == rating coverage HH-0081..HH-0140 by source ==
    {"rating_source":"goodreads","n":60}

  == rating coverage HH-0081..HH-0140 rated/null/total ==
    {"rated":60,"null_rating":0,"total":60}

  == audit replica OLD range HH-0001..HH-0080 ==
    {"total_works":80,"drift_works":49,"gap_works":9,"content_in_collection":0}

  == audit replica NEW range HH-0081..HH-0140 ==
    {"total_works":60,"drift_works":22,"gap_works":23,"content_in_collection":15}
  ```

  **Reading the verify-digest.**
  - **All 6 smoke slugs present** — one wave-representative book per
    batch (HH-0090 / HH-0100 / HH-0110 / HH-0120 / HH-0130 / HH-0140)
    carries junction counts. The cluster shape varies as expected:
    *Sons of the Emperor* (HH-0090, anthology) leans heavily on
    factions (f=8 — Primarch-faction roll-call) with zero locations
    (anthology container, abstract scope); *Sanguinius the Great
    Angel* (HH-0100, Primarchs-Monograph) carries minimal junctions
    (f=1, l=0, c=1) consistent with a single-Primarch character
    portrait; *Valdor* (HH-0110) shows the richest mid-wave cast
    (c=4); *The Serpent Beneath* (HH-0120) **ticks `in_coll=1`** —
    it is itself a constituent of the in-range HH-0020 anthology
    (absorbed Pass-10 forward-ref now resolved); *Cybernetica*
    (HH-0130) is the typical late-Heresy novella shape (f=3, l=1,
    c=2); *Visions of Heresy* (HH-0140) is a non-fiction art-book
    with no in-universe surface forms (f=l=c=0 — expected, the row
    exists in `works` with author binding `alan_merrett` only).
  - **Rating coverage 60/60** for HH-0081..HH-0140 — full Goodreads
    coverage, 0 null ratings (better than Pass-11's 59/60, suggesting
    the past-mid-arc wave's books are all well-established with
    ratings by now).
  - **OLD range HH-0001..HH-0080 unchanged in shape** — 80 works, 49
    drift, 9 gap, 0 in_coll: exactly `Pass-10 + Pass-11` sum
    (15+34=49 drift ✓, 2+7=9 gap ✓, 0+0=0 in_coll ✓). The idempotent
    re-apply of ssot-hh-001..008 (over the cumulative range)
    preserved the historical state byte-for-byte — no drift
    introduced, no gap closed.
  - **NEW range HH-0081..HH-0140 audit replica:**
    - `total_works=60` — all 60 wave books materialized in `works`.
    - `drift_works=22` — 22 of 60 works have at least one junction
      whose `raw_name` ≠ canonical entity name (case-insensitive).
      22/60 (~37%) drift is consistent with — slightly lower than
      — Pass-11's 34/60 (57%): the past-mid-arc wave needs less
      cross-era anchoring because most Primarchs / HH-anchors
      already exist from Pass-10/11; the wave's promotions mostly
      open fresh HH-only rows (rangdan, hrud, hrend, nurgle,
      kurtha_sedd, …) where `raw_name == canonical.name`.
    - `gap_works=23` — 23 of 60 works have at least one of
      factions / locations / characters with `count=0`. Higher
      than Pass-11's 7 because the wave includes the *Sons of the
      Emperor* Primarchs-Monograph bloc (HH-0100..HH-0109, 10
      single-Primarch portraits where locations and most factions
      naturally count zero) + the *Cybernetica* / *Serpent Beneath*
      / *Visions of Heresy* novella + art-book tail. This is a
      data finding for the audit-cockpit data-quality cycle, not
      a 4a failure — smoke slug HH-0140 (`f=0, l=0, c=0` — art
      book) and HH-0100 (`l=0` — Primarch portrait) are the
      structural examples.
    - **`content_in_collection=15`** — the first HH wave with
      non-zero in-collection content. See §"Sons of the Emperor
      anthology bloc" above for the 9 + 4 + 2 breakdown.

- **Trias (state after Phase 4a, not re-run in Phase 4b per runbook §10):**
  `test:resolver` 392/0, `test:resolver-data` ok,
  `test:resolver-coverage` exit 0, `test:collection-refs` 10/0,
  `test:apply-override-dry` ok (out-of-range=21, unknown-work=0).
- **Lint:** 0 errors, 1 pre-existing
  `@next/next/no-page-custom-font` warning in
  `src/app/layout.tsx:44` (unchanged across Passes 5–12,
  Strang-fremd, out of scope).
- **Typecheck:** 0 errors.

## Maintainer handoff

- **HH past-mid-arc wave landed in the DB:** works `645 → 705` (+60).
  The live Supabase carries 705 works / 2380·972·1692·162·647·14096
  junctions / 190·267·457·86 refs+facets, verified by
  `verify-pass.ts`. PR-merging this branch is **safe and complete**
  — it brings the JSON reference additions (+2 factions / +11
  locations / +13 characters / +1 / +2 / +3 aliases / +2 persons /
  Phase-1..3 resolver-test cases), the three trias batch-tuple
  extensions (×6 each), the per-phase reports, the refreshed
  Apply-Digest, and this impl-report.
- **Branch shape:** `codex/ingest-batches-resolver-loop-hh` is a
  clean linear branch ahead-of-`origin/main` by 14 commits (the
  cumulative Pass-11 7-commit set already on the branch from the
  prior pass, plus the Pass-12 loop-config-prep commit `50c15fc` +
  the 5 phase commits `08406e1` / `8301bb9` / `db9493f` / `f618eff`
  / `4e4424b` + this Phase 4b commit). No rebase, no force-push
  needed — a plain `git push -u origin
  codex/ingest-batches-resolver-loop-hh` + `gh pr create` is the
  full PR sequence.
- **HH authority layer:** 140 / 859 HH books applied (~16.3%).
  Pass-10 brought 20 (HH-0001..HH-0020), Pass-11 brought 60
  (HH-0021..HH-0080), Pass-12 brings 60 (HH-0081..HH-0140).
  Subsequent HH waves continue the bulk ingestion via the
  SSOT-loop's wave-detector. Reference layer in the DB: factions
  `188→190`, locations `256→267`, characters `444→457`, sectors
  `8→8`, facet_values `86→86`, persons `98→100`. JSON-side files
  mirror the DB exactly.

## Open issues / blockers

- **None.** No `## Needs decision` blocks from any phase. Forward-ref
  Guard absorbed the 21 out-of-range constituent refs as informational
  (Brief-101 reason-split working as designed). Trias green; lint
  + typecheck clean; Verify-Digest matches Apply-Digest. The
  *Sons of the Emperor* in-collection materialization confirms the
  ascending-sweep + cumulative-re-apply pattern handles in-wave
  anthology blocs cleanly.

## For next session

- **Cowork Wiki-Hygiene pass** (Rollup-Ownership in the coordination
  worktree, post-merge): once the PR lands on `main`, the
  coordination worktree backfills `brain/wiki/project-state.md`
  (works 645 → 705, HH at 140 / 859 books ~16.3%),
  `brain/wiki/log.md` (Pass-12 wave entry), and
  `sessions/README.md` (Pass-12 wave row). The Batches strand
  worktree does not touch `brain/**` per CLAUDE.md §"Parallel
  worktrees" → "Rollup-Ownership".
- **Next HH wave** (ssot-hh-015.. when the SSOT-loop produces it):
  follows the established resolver-pass cadence. Subsequent waves
  that apply the *Shadows of Treachery* tail-constituent novels
  (HH-0170 / HH-0172 / HH-0241 / HH-0242 / +1) and the HH-0117..0120
  anthology cluster's late constituents will continue absorbing the
  21 currently-out-of-range collection edges via the cumulative
  idempotent re-apply.
- **Audit-cockpit drift/gap follow-up** (data-quality cycle, not
  resolver-pass): the 22 drift_works are expected (cross-era alias
  resolution producing `raw_name` ≠ canonical.name); the 23
  gap_works are mostly the structural shape of the Primarchs-
  Monograph bloc + art-book tail (HH-0100..HH-0109 + HH-0140) and
  are worth a quick audit-cockpit sweep to confirm none of them is
  a fixable data-quality issue (vs. expected sparse-axis shape).

## References

- Runbook: `sessions/resolver-pass-runbook.md` · Config:
  `scripts/resolver-pass.config.json`
- Dossier: `sessions/resolver-dossiers/resolver-pass-12-dossier.md`
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
