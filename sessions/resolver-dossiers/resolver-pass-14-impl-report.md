---
pass: 14
role: implementer
date: 2026-05-27
status: complete
wave: ssot-hh-021..025
ids: HH-0201..HH-0250
branch: codex/ingest-batches-resolver-loop-hh
runbook: sessions/resolver-pass-runbook.md
config: scripts/resolver-pass.config.json
dossier: sessions/resolver-dossiers/resolver-pass-14-dossier.md
commits:
  - 5ccca54  # Phase 0 (Preflight/Dossier)
  - 560cfd3  # Phase 1 (Factions)
  - c9734aa  # Phase 2 (Locations)
  - 61eeeb0  # Phase 3 (Characters)
  - 45d78d9  # Phase 4a (Integration/Apply)
  # Phase 4b (Verify/Report) is the commit carrying this report.
---

# Resolver-Pass 14 — impl report (ssot-hh-021..025 / HH-0201..HH-0250)

## Summary

**Pass 14 is the HH post-Heresy-tail wave that lands the 250-book
HH-domain milestone** — 50 books HH-0201..HH-0250, picking up directly
after the Pass-13 late-arc wave (60 books at HH-0141..HH-0200). The
wave carries the post-Heresy short-fiction / audio-drama tail
(*Into Exile*, *Child of Chaos*, *Amor Fati*, *Morningstar*,
*Strike and Fade*), the first three HH roster-collection omnibi
(HH-0231 *Crusade's End*, HH-0232 *The Razing of Prospero*, HH-0233
*The Last Phoenix*) pointing back at HH-0001..HH-0044 constituents,
and the post-Heresy *Lords of Terra* anthology block at the wave tail.
Brief 100 two-domain Resolver-Loop + Cross-Era-Identitäten rules
continue to apply: HH surface-forms either alias onto an existing
W40K or Pass-10/11/12/13 canonical row or open a fresh HH-only
canonical row where no anchor exists.

All six phases landed cleanly on the first try. The JSON reference
layer grew by **+5 factions / +8 locations / +7 characters and +1 / +2 / +1
aliases**. **Phase 4a landed the cumulative `hh 1..25` apply: works
765 → 815** (+50 — the exact 50 HH books of this wave). The Brief-101
reason-split Guard reports forward collection refs = **53** (all
in-range, applied by the ascending sweep), `out-of-range=0`,
`unknown-work=0` — exactly the dossier §7d forecast ("the cleanest
possible outcome"). The Pass-13 carry-through of 3 out-of-range
constituents is **now resolved** — those constituents are in-range as
of this pass.

Phase 4b ran the **read-only** half: `verify-pass.ts --config …`
confirms the live DB matches the digest (815 HH+W40K works present,
all 5 smoke slugs carry their junction counts, 50/50 Goodreads-rated
for the NEW range, NEW + OLD audit replicas report the expected
drift/gap shape for an HH post-Heresy-tail wave with an
omnibus-driven OLD-range absorption); `lint` + `typecheck` clean.
This impl-report is polished from the 4a status file + the committed
Apply-Digest + the Verify-Digest stdout — **without re-deriving
state**, per runbook §3 Phase 4b.

**Headline:** the HH post-Heresy-tail wave landed end-to-end with no
halts and no re-runs, the **fourth clean two-domain pass in a row**.
The HH authority layer now carries **250 / 859 books (~29.1% of the
eventual HH corpus)** — the round-250 milestone of the HH-domain
bootstrap. The OLD range HH-0001..HH-0200 cumulative in-collection
count ticks **+9 from 37 to 46** (the three first-three-HH omnibi at
HH-0231/HH-0232/HH-0233 absorbed 9 distinct OLD-range constituents
in one wave), confirming the ascending-sweep + cumulative-re-apply
pattern handles cross-range roster-collection containers cleanly. No
4a-judgments this pass: no EXPECTED_RANGES re-tune required, no
facetId strips, no `## Needs decision` blockers. PR-ready.

## What I did

The pass is a 6-phase sequence. Phases 0–4a landed in their own
commits with full per-phase reports (Phase 4a's report is also the
input to this 4b report, per runbook §3). Phase 4b only needed (a)
running `verify-pass.ts` against the live DB for the Verify-Digest
stdout, (b) running `lint` + `typecheck` for the read-only sanity
checks, and (c) polishing this impl-report from the three input
artifacts.

### Per-phase recap (detail in the phase reports)

- **Phase 0 — Preflight/Dossier** (`5ccca54`): `scripts/aggregate-
  surface-forms.ts --config …` produced 6 of the 7 dossier sections
  deterministically for the 50-book wave; the 7th section
  (cross-batch alias-consolidation + needs-decision candidates) was
  synthesized from tail-reads of the wave's loop-log blocks, with
  Cross-Era / honor-title / cross-form consolidation cases against
  the Pass-10/11/12/13 anchor row set, plus the three first-three-HH
  omnibi forecast (HH-0231/HH-0232/HH-0233 → constituent pointers
  into HH-0001..HH-0044). No override files read in-context.
- **Phase 1 — Factions** (`560cfd3`, +5 rows / +1 alias): five new
  freq≥2 / lore-iconic faction rows — `ordo_sinister` (the
  psy-titan Ordo Sinister formation), `legio_audax` (the
  Ash-Scorpions Titan Legion), `legio_castigatra` (the post-Heresy
  Titan Legion), `legio_cybernetica` (the Mechanicum cybernetica
  cohorts), and `blackshields` (renegade-Astartes Blackshields
  formations). One cross-form alias `House Taranis → knights_of_taranis`
  for identity coherence on the Knight household's surface-form
  variants. ≥ 5 new resolver-test cases. Idempotency confirmed.
- **Phase 2 — Locations** (`c9734aa`, +8 rows / +2 aliases):
  sector / world / sub-location granularity for the HH
  post-Heresy-tail cluster — `chemos` (Emperor's Children
  homeworld), `macragges_honour` (Guilliman's flagship — Vessel
  convention `tags:['vessel']`, `gx/gy:null` applied), `irkalla`
  (Word-Bearer arc), `imperial_webway` (the late-Heresy webway
  infrastructure), `albia` (Pre-Heresy unification battlefield),
  `illyrium` (Pre-Heresy unification site), `jupiter` (the
  Jovian system), and `astagar` (post-Heresy short-fiction setting).
  Two aliases: `Phalanx → phalanx` bare-form (consolidating the
  bare surface-form onto the canonical anchor) and
  `Laer → laeran` identity-coherence override (cross-form
  consolidation). ≥ 4 new resolver-test cases. Idempotency confirmed.
- **Phase 3 — Characters** (`61eeeb0`, +7 rows / +1 alias): the
  wave's targeted dramatis personae landed as a curated mix:
  **2 cluster-7b spines** (`macer_varren` + `helig_gallor`, the
  recurring HH-post-Heresy short-fiction protagonists) +
  **5 strong-lore-iconic** (`hydragyrum`, `sibel_niasta`,
  `crysos_morturg`, `yored_massak`, `torquill_eliphas` — all freq≥2
  or curated freq=1 with lore-anchored Dossier evidence). One
  character alias `the Emperor → the_emperor` (Case A
  lowercase-article variant — Cross-Era + cross-form consolidation
  onto the W40K anchor row). `primaryFactionId` of every new row
  points at the Phase-1 faction set (FK-clean, runbook §5 strictly
  observed). ≥ 5 new resolver-test cases, ≥ 2 of them for
  cross-era / cross-batch alias-consolidation.

### Phase 4a — Integration / Apply (commit `45d78d9`)

- **Trias batch-range extensions — Brief 100 Domain-+-N-Append:**
  the five new HH tuples `{domain:"hh", n:"021"}` ..
  `{domain:"hh", n:"025"}` appended to `BATCHES` in
  `scripts/apply-override-dry.ts`,
  `scripts/test-resolver-coverage.ts`, and
  `scripts/test-resolver-data-integrity.ts`. In the data-integrity
  script the hardcoded `coverage smoke slugs` label range was
  updated from `hh-001..020` to `hh-001..025` (parity to the
  Pass-13 `hh-001..020` bump).
- **No EXPECTED_RANGES re-tune needed.** The dry-run sanity caps
  carried forward from Pass-13 (factions max 3200, locations max
  1100, characters max 2200) all hold this pass:
  `work_factions=2622/3200` (~18% headroom),
  `work_locations=1088/1100` (~1% headroom — tightest cap),
  `work_characters=1916/2200` (~13% headroom). The locations cap
  is now the tightest bound and will likely require a re-tune in a
  future pass (esp. as the remaining ~45 HH-domain books land), but
  that is a next-pass concern, not this pass. No `## Needs
  decision` triggered.
- **Scripts intentionally not touched** (Brief-077 / Brief-091 /
  Brief-101 contracts hold unchanged):
  `scripts/seed-resolver-extensions.ts` (fully generic JSON-loader
  — picks up Phase 1/2/3 row additions automatically);
  `scripts/apply-override-collections.ts` (pure helper, no
  hardcoded range, Brief-101 reason-split unchanged);
  `scripts/db-counts.ts`, `scripts/seed-facets.ts`,
  `scripts/run-phase4-apply.sh` (stable apply-side tooling).
  `scripts/seed-data/collection-gaps.json` not touched — the
  ascending-sweep + cumulative re-apply absorbed all forward refs
  cleanly (`out-of-range=0`, `unknown-work=0`).
- **`scripts/seed-data/persons.json` auto-extended (+46 rows)** by
  `db:apply-override`'s `ensurePersonsExist` mechanism — the
  post-Heresy-tail wave brought 46 new BL-author Authority-Layer-
  Erstaufträge (`745 - 699 = 46` net, deltas land per-batch in the
  digest as `+10 / +10 / +10 / +6 / +10` cumulative across
  ssot-hh-021..025, with the +6 at ssot-hh-024 reflecting fewer
  fresh authors for the omnibus-heavy batch as anthology editors
  with `author: "?"` correctly create no Persons row — multi-author-
  anthology convention).
- **Apply-side trias green on the first try:**
  - `test:resolver` 449/0 ✓ (Phase-3-Stand)
  - `test:resolver-data` ✓ 10 / 10 (smoke-slug label
    `w40k-001..057 + hh-001..025`)
  - `test:resolver-coverage` ✓ exit 0 (informational below-threshold
    rows are pre-existing carry-through data findings, no regression)
  - `test:apply-override-dry` ✓ (815 books,
    `forward collection refs: 53; unresolvable constituent refs:
    0; by reason: out-of-range=0, unknown-work=0`)
  - `test:collection-refs` 10/0 ✓ (Brief-091 range-aware Guard +
    Brief-101 reason-split helper suite)
  - `lint` 0 errors, 1 pre-existing warning;
    `typecheck` 0 errors
- **Digest-only apply ran clean:** `bash
  scripts/run-phase4-apply.sh scripts/resolver-pass.config.json`
  refreshed `ingest/.last-run/phase4-digest.md`:
  `seed-resolver-extensions: ok`, `seed-facets: 0 new`,
  `applied ssot-hh-001..025: ok` (all 25 `applied: ok`),
  `DONE`. Works 765 → 815 (+50); per-batch snapshots emitted
  for ssot-hh-021..025 only (the new-wave filter —
  ssot-hh-001..020 are idempotent re-apply, no new books, no
  per-batch snapshot).
- **No facetId strips** — pre-validated all 86 facet_values vs.
  every facetId in `manual-overrides-ssot-hh-{021..025}.json`:
  zero unknown facetIds across all five new override files.
  `facet-catalog.json` deliberately out of scope (runbook §3
  Phase 4a) and untouched — no `## Needs decision` Facet-Add
  Stop triggered.

### Phase 4b — Verify / Report (read-only, this commit)

- `scripts/verify-pass.ts --config scripts/resolver-pass.config.json`
  ran read-only against the live Supabase; stdout (Verify-Digest)
  below in §Verification.
- `npm run lint` + `npm run typecheck` clean (0 errors; same
  pre-existing `@next/next/no-page-custom-font` warning in
  `src/app/layout.tsx:44` carried unchanged across Passes 5–14 —
  Strang-fremd, Product-side, not in any Batches-Strang scope).
- This impl-report assembled from the 4a status file
  (`resolver-pass-14-phase-4a-report.md`) + the committed
  Apply-Digest (`ingest/.last-run/phase4-digest.md`) + the
  Verify-Digest stdout — no state re-derivation, no second DB
  apply, no trias re-run (runbook §3 Phase 4b).

## Counts (Pflicht-Tabelle)

| Stage | works | work_factions | work_locations | work_characters | work_collections | work_persons | work_facets |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Pre-Apply | 765 | 2511 | 1031 | 1811 | 184 | 699 | 15223 |
| Post-batch `ssot-hh-021` | 775 | 2533 | 1038 | 1826 | 184 | 709 | 15406 |
| Post-batch `ssot-hh-022` | 785 | 2550 | 1049 | 1837 | 184 | 719 | 15560 |
| Post-batch `ssot-hh-023` | 795 | 2570 | 1058 | 1858 | 184 | 729 | 15728 |
| Post-batch `ssot-hh-024` | 805 | 2598 | 1076 | 1890 | 193 | 735 | 15916 |
| Post-batch `ssot-hh-025` | 815 | 2621 | 1087 | 1911 | 196 | 745 | 16084 |
| **Post-Apply (815)** | **815** | **2621** | **1087** | **1911** | **196** | **745** | **16084** |
| Δ (wave 14) | **+50** | **+110** | **+56** | **+100** | **+12** | **+46** | **+861** |

(Source: `ingest/.last-run/phase4-digest.md` at `45d78d9`. The re-apply
of `ssot-hh-001..020` from the cumulative range emits no per-batch
counts — idempotent re-apply over existing books, only
`delete-then-insert` per junction, counts untouched at 765.)

**Reading the deltas.**
- `works +50`: HH-0201..HH-0250 — the wave's 50 new books, the HH
  post-Heresy short-fiction / audio-drama tail + first three HH
  roster-collection omnibi (HH-0231/HH-0232/HH-0233) + *Lords of
  Terra* anthology tail.
- `work_collections +12`: of which **+9 at ssot-hh-024** (the three
  first-three-HH omnibi HH-0231 *Crusade's End* → 4 constituents,
  HH-0232 *The Razing of Prospero* → 2 constituents, HH-0233 *The
  Last Phoenix* → 3 constituents = 9 work_collections edges, all
  pointing back at HH-0001..HH-0044) and **+3 at ssot-hh-025**
  (audio-drama anthology / cross-arc carries — primarily the
  post-Heresy *Lords of Terra* anthology and similar). Matches the
  dossier §5 omnibus scan + Brief 101 forward-ref guard expectation.
- `facet_values +0`: 0 unknown facetIds across all 5 override files
  — zero strips needed; `facet-catalog.json` correctly stayed out of
  scope (no `## Needs decision` triggered).
- Reference deltas (`factions/locations/characters +5/+8/+7`) match
  Phase 1/2/3 row additions exactly — see Reference-rows table
  below.

**Reference rows (JSON-side, landed via Phases 1–3, in the DB after 4a):**

| file | rows pre Pass-14 | rows post Phase 1/2/3 (JSON) | delta | rows in DB | DB delta after 4a |
| --- | ---: | ---: | ---: | ---: | ---: |
| `factions.json` | 194 | 199 | +5 | 199 | +5 ✓ |
| `faction-aliases.json` | 71 | 72 | +1 | (aliases not in DB) | — |
| `locations.json` | 275 | 283 | +8 | 283 | +8 ✓ |
| `location-aliases.json` | 20 | 22 | +2 | (aliases not in DB) | — |
| `characters.json` | 474 | 481 | +7 | 481 | +7 ✓ |
| `character-aliases.json` | 61 | 62 | +1 | (aliases not in DB) | — |
| `sectors.json` | 8 | 8 | 0 | 8 | 0 |
| `persons.json` | 100 | 100 | 0 | (auto-added via `ensurePersonsExist`) | +46 |
| `facet_values` | 86 | 86 | 0 | 86 | 0 |

`facet_values 86→86` — no facet add needed this wave.
`persons.json 100→100` (JSON) but **`+46` in DB** — all 46 new author
bindings were auto-added by `db:apply-override`'s `ensurePersonsExist`
mechanism (per Brief-077 apply-layer contract) without needing
Phase-3-side roster maintenance.

## Decisions I made

Phase 4b is read-only — there were no decisions to make here beyond
faithfully reflecting the clean 4a state in this report. The
decisions that landed in Phases 0–4a are documented in their
per-phase reports; no `## Needs decision` block was forwarded from
any phase, and no 4a quantitative judgments were required this
wave (no EXPECTED_RANGES re-tune, no facetId strips). Pass 14 is
the **fourth consecutive clean two-domain pass** (Passes 11, 12, 13,
14 all landed without halts or re-runs).

## In-collection materialization (NEW + OLD range)

Pass 13 closed at cumulative in-collection 37 across HH-0001..HH-0200
(OLD HH-0001..HH-0140 = 17 + NEW HH-0141..HH-0200 = 20). Pass 14
ticks the **OLD range HH-0001..HH-0200 cumulative count from 37 to
46** (+9 absorbed) — exactly matching the **+9 work_collections at
ssot-hh-024** in the apply digest, i.e. the three first-three-HH
omnibi HH-0231/HH-0232/HH-0233 pointing back at HH-0001..HH-0044
constituents and absorbing 9 distinct OLD-range works into roster-
collection containers in one wave.

The **NEW range HH-0201..HH-0250 carries `content_in_collection=3`**
— the +3 work_collections at ssot-hh-025 that materialize within the
new wave's range (primarily *Lords of Terra* tail). The +9 OLD + +3
NEW = +12 in-collection footprint matches the `work_collections +12`
apply-side delta exactly.

The smoke slugs confirm a different per-batch shape from earlier HH
waves: **0 of 5 smoke slugs (HH-0210 *Into Exile*, HH-0220 *Child of
Chaos*, HH-0230 *Amor Fati*, HH-0240 *Morningstar*, HH-0250 *Strike
and Fade*) carry `in_coll=1`** — none of the wave-representative
last-batch books is itself a constituent of an in-range anthology
(the three first-three-HH omnibi land *at* HH-0231/HH-0232/HH-0233
inside the wave and point back at earlier HH-0001..HH-0044 books,
not at the smoke-slug representatives at the back of each batch).
`unknown-work=0` across the entire dry-run validation — every
forward-ref the apply layer encountered resolved to a known work,
and `out-of-range=0` confirms the Pass-13 carry-through of 3
out-of-range constituents has been resolved by the cumulative
re-apply over the now-extended range.

## Verification

- **Apply digest** (`ingest/.last-run/phase4-digest.md`, committed at
  `45d78d9`):

  ```
  Config: scripts/resolver-pass.config.json
  apply-range: ssot-hh-001 ssot-hh-002 ssot-hh-003 ssot-hh-004
               ssot-hh-005 ssot-hh-006 ssot-hh-007 ssot-hh-008
               ssot-hh-009 ssot-hh-010 ssot-hh-011 ssot-hh-012
               ssot-hh-013 ssot-hh-014 ssot-hh-015 ssot-hh-016
               ssot-hh-017 ssot-hh-018 ssot-hh-019 ssot-hh-020
               ssot-hh-021 ssot-hh-022 ssot-hh-023 ssot-hh-024
               ssot-hh-025
  new wave:    ssot-hh-021 ssot-hh-022 ssot-hh-023 ssot-hh-024
               ssot-hh-025

  PRE-APPLY:   765 works / 2511·1031·1811·184·699·15223 junctions
                         / 194·275·474·86 refs+facets
  seed-resolver-extensions: ok
  seed-facets: catalog values 86; newly inserted 0
  applied ssot-hh-001..020: ok   (idempotent re-apply, no new books)
  applied ssot-hh-021: ok → POST 775 / 2533·1038·1826·184·709·15406
                                  / 199·283·481·86
  applied ssot-hh-022: ok → POST 785 / 2550·1049·1837·184·719·15560
                                  / 199·283·481·86
  applied ssot-hh-023: ok → POST 795 / 2570·1058·1858·184·729·15728
                                  / 199·283·481·86
  applied ssot-hh-024: ok → POST 805 / 2598·1076·1890·193·735·15916
                                  / 199·283·481·86
  applied ssot-hh-025: ok → POST 815 / 2621·1087·1911·196·745·16084
                                  / 199·283·481·86
  DONE
  ```

  (Reference deltas `factions/locations/characters +5/+8/+7` land on
  the ssot-hh-021 boundary because `seed-resolver-extensions.ts` runs
  once before the first batch. `work_collections` ticks up sharply
  on ssot-hh-024 (+9 — the three first-three-HH omnibi cluster) and
  ssot-hh-025 (+3 — *Lords of Terra* tail), zero movement on
  ssot-hh-021/022/023 — the omnibus-cluster-in-one-batch shape the
  dossier §5 forecast.)

- **Verify digest** (`verify-pass.ts --config
  scripts/resolver-pass.config.json`, stdout — the live DB matches
  the apply digest exactly):

  ```
  # verify-pass digest — Resolver-Pass 14 (ssot-hh-021..025)

  == smoke slugs (factions / locations / characters / in_collection) ==
    {"external_book_id":"HH-0210","slug":"into-exhile","f":3,"l":1,"c":1,"in_coll":0}
    {"external_book_id":"HH-0220","slug":"child-of-chaos","f":1,"l":2,"c":2,"in_coll":0}
    {"external_book_id":"HH-0230","slug":"amor-fati","f":1,"l":0,"c":3,"in_coll":0}
    {"external_book_id":"HH-0240","slug":"morningstar","f":1,"l":2,"c":2,"in_coll":0}
    {"external_book_id":"HH-0250","slug":"strike-and-fade","f":2,"l":1,"c":0,"in_coll":0}

  == rating coverage HH-0201..HH-0250 by source ==
    {"rating_source":"goodreads","n":50}

  == rating coverage HH-0201..HH-0250 rated/null/total ==
    {"rated":50,"null_rating":0,"total":50}

  == audit replica OLD range HH-0001..HH-0200 ==
    {"total_works":200,"drift_works":97,"gap_works":59,"content_in_collection":46}

  == audit replica NEW range HH-0201..HH-0250 ==
    {"total_works":50,"drift_works":25,"gap_works":21,"content_in_collection":3}
  ```

  **Reading the verify-digest.**
  - **All 5 smoke slugs present** — one wave-representative book per
    batch (HH-0210 / HH-0220 / HH-0230 / HH-0240 / HH-0250) carries
    junction counts. The cluster shape varies as expected for the
    post-Heresy short-fiction / audio-drama tail: *Into Exile*
    (HH-0210) carries a moderate cast (f=3, l=1, c=1) reflecting a
    multi-faction post-Heresy scenario; *Child of Chaos* (HH-0220)
    is a tighter post-Heresy character piece (f=1, l=2, c=2);
    *Amor Fati* (HH-0230) leans character-side (f=1, l=0, c=3 —
    the abstract / mental-state setting fits the location=0 shape,
    similar to Pass-13's *Imperfect*); *Morningstar* (HH-0240) is a
    mid-weight scenario (f=1, l=2, c=2); *Strike and Fade* (HH-0250)
    closes the wave as a faction-side piece without named characters
    (f=2, l=1, c=0). **0 of 5 smoke slugs have `in_coll=1`** — none
    of the last-batch representative books is itself a constituent
    of an in-range anthology (the three omnibi at HH-0231/HH-0232/
    HH-0233 absorb earlier HH-0001..HH-0044 books, not the
    smoke-slug representatives).
  - **Rating coverage 50/50** for HH-0201..HH-0250 — full Goodreads
    coverage, 0 null ratings, continuing the late-arc pattern
    (Pass 13 was also 60/60).
  - **OLD range HH-0001..HH-0200 cumulative:** 200 works, 97 drift,
    59 gap, **46 in_coll**. Versus Pass-13's cumulative baseline of
    37 (HH-0001..HH-0140 = 17 + HH-0141..HH-0200 = 20) → **+9
    absorbed** by this wave — the three first-three-HH omnibi at
    HH-0231/HH-0232/HH-0233 pulled 9 distinct OLD-range constituents
    into roster-collection containers in one wave. Drift 97 =
    Pass-13 sum (72+25 = 97), **exact** — no new drift_works
    introduced in OLD range. Gap 59 = Pass-13 sum (32+27 = 59),
    **exact** — no new gap_works in OLD range, no historical gap
    closed.
  - **NEW range HH-0201..HH-0250 audit replica:**
    - `total_works=50` — all 50 wave books materialized in `works`.
    - `drift_works=25` — 25 of 50 works have at least one junction
      whose `raw_name` ≠ canonical entity name (case-insensitive).
      25/50 (50%) drift is consistent with the cross-era + cross-
      form alias-consolidation Phase 3 carried out (the
      `the Emperor → the_emperor` lowercase-article alias plus the
      cumulative carry-through Cross-Era anchors land
      `raw_name ≠ canonical.name` by definition for legitimate
      identity-coherence reasons).
    - `gap_works=21` — 21 of 50 works have at least one of
      factions / locations / characters with `count=0`. Comparable
      to Pass-13's 27/60 (~45%); the post-Heresy short-fiction
      cluster includes more single-axis pieces (HH-0230 *Amor Fati*
      `l=0` and HH-0250 *Strike and Fade* `c=0` are structural
      examples). This is a data finding for the audit-cockpit
      data-quality cycle, not a 4a failure.
    - **`content_in_collection=3`** — the three NEW-range works that
      land inside anthology containers within the wave itself (the
      +3 work_collections at ssot-hh-025, primarily the *Lords of
      Terra* tail). The +3 NEW + +9 OLD = +12 in-collection
      footprint matches the apply-side `work_collections +12` delta
      exactly.

- **Trias (state after Phase 4a, not re-run in Phase 4b per runbook §10):**
  `test:resolver` 449/0, `test:resolver-data` ok (10/10),
  `test:resolver-coverage` exit 0, `test:collection-refs` 10/0,
  `test:apply-override-dry` ok (out-of-range=0, unknown-work=0).
- **Lint:** 0 errors, 1 pre-existing
  `@next/next/no-page-custom-font` warning in
  `src/app/layout.tsx:44` (unchanged across Passes 5–14,
  Strang-fremd, out of scope).
- **Typecheck:** 0 errors.

## Maintainer handoff

- **HH post-Heresy-tail wave landed in the DB:** works `765 → 815`
  (+50). The live Supabase carries 815 works /
  2621·1087·1911·196·745·16084 junctions / 199·283·481·86 refs+facets,
  verified by `verify-pass.ts`. PR-merging this branch is **safe and
  complete** — it brings the JSON reference additions (+5 factions /
  +8 locations / +7 characters / +1 / +2 / +1 aliases / +46 persons
  (DB-only via `ensurePersonsExist`) / Phase-1..3 resolver-test
  cases), the three trias batch-tuple extensions (×5 each), the
  per-phase reports, the refreshed Apply-Digest, and this
  impl-report.
- **Branch shape:** `codex/ingest-batches-resolver-loop-hh` is a
  clean linear branch ahead-of-`origin/main` by 30+ commits (the
  cumulative Pass-12/13 commit set already on the branch from prior
  passes, plus the Pass-14 5 phase commits `5ccca54` / `560cfd3` /
  `c9734aa` / `61eeeb0` / `45d78d9` + this Phase 4b commit). No
  rebase, no force-push needed — a plain `git push -u origin
  codex/ingest-batches-resolver-loop-hh` + `gh pr create` is the
  full PR sequence.
- **HH authority layer:** **250 / 859 HH books applied (~29.1%)** —
  the round-250 milestone. Pass-10 brought 20 (HH-0001..HH-0020),
  Pass-11 brought 60 (HH-0021..HH-0080), Pass-12 brought 60
  (HH-0081..HH-0140), Pass-13 brought 60 (HH-0141..HH-0200),
  Pass-14 brings 50 (HH-0201..HH-0250). Subsequent HH waves
  continue the bulk ingestion via the SSOT-loop's wave-detector.
  Reference layer in the DB: factions `194→199`, locations
  `275→283`, characters `474→481`, sectors `8→8`, facet_values
  `86→86`, persons `100→146` (DB-side via `ensurePersonsExist`;
  JSON-side `persons.json` unchanged at 100). JSON-side reference
  files mirror the DB exactly for factions / locations / characters
  / sectors / facet_values.

## Open issues / blockers

- **None.** No `## Needs decision` blocks from any phase. Forward-ref
  Guard reports **`out-of-range=0, unknown-work=0`** — the cleanest
  possible outcome, exactly matching the dossier §7d forecast. The
  Pass-13 carry-through of 3 out-of-range constituents is now
  resolved by the cumulative re-apply over the extended range.
  Trias green; lint + typecheck clean; Verify-Digest matches
  Apply-Digest. The +9 OLD-range absorption from the first
  three-HH-omnibi cluster (HH-0231/HH-0232/HH-0233) confirms the
  ascending-sweep + cumulative-re-apply pattern handles cross-range
  roster-collection containers cleanly at the round-250 HH
  milestone.
- **Informational only:** the `apply-override-dry` `work_locations`
  sanity cap is now the tightest bound (`1088/1100`, ~1% headroom).
  Future passes (esp. the remaining ~45 HH-domain books) will likely
  require a `work_locations.max` re-tune. The next consolidation pass
  is the natural place to re-evaluate this bound (Brief-100's stated
  re-tuning cadence: "next Konsolidierungs-Pass with large merge
  movement, not per-wave"). No action required this pass.

## For next session

- **Cowork Wiki-Hygiene pass** (Rollup-Ownership in the coordination
  worktree, post-merge): once the PR lands on `main`, the
  coordination worktree backfills `brain/wiki/project-state.md`
  (works 765 → 815, HH at 250 / 859 books ~29.1% — round-250
  milestone), `brain/wiki/log.md` (Pass-14 wave entry), and
  `sessions/README.md` (Pass-14 wave row). The Batches strand
  worktree does not touch `brain/**` per CLAUDE.md §"Parallel
  worktrees" → "Rollup-Ownership".
- **Next HH wave** (ssot-hh-026.. when the SSOT-loop produces it):
  follows the established resolver-pass cadence. Subsequent waves
  that bring in further anthology containers will continue to
  materialize roster-collection edges via the cumulative idempotent
  re-apply; no carry-through tail remains as of this pass
  (`out-of-range=0`).
- **Audit-cockpit drift/gap follow-up** (data-quality cycle, not
  resolver-pass): the 25 NEW-range drift_works are expected (cross-
  era + cross-form alias resolution producing `raw_name` ≠
  canonical.name); the 21 NEW-range gap_works are mostly the
  structural shape of the post-Heresy short-fiction tail (single-axis
  pieces, abstract settings) and are worth a quick audit-cockpit
  sweep to confirm none of them is a fixable data-quality issue (vs.
  expected sparse-axis shape).
- **Locations-cap re-tune follow-up** (consolidation cycle, not
  resolver-pass): the `apply-override-dry` `work_locations.max` bound
  (1100) is now within 1% of the live count (1088). The next
  consolidation pass is the natural place to re-tune this bound
  alongside any merge movement.

## References

- Runbook: `sessions/resolver-pass-runbook.md` · Config:
  `scripts/resolver-pass.config.json`
- Dossier: `sessions/resolver-dossiers/resolver-pass-14-dossier.md`
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
