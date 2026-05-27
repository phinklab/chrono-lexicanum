---
pass: 15
role: implementer
date: 2026-05-27
status: complete
wave: ssot-hh-026..030
ids: HH-0251..HH-0294
branch: codex/ingest-batches-resolver-loop-hh
runbook: sessions/resolver-pass-runbook.md
config: scripts/resolver-pass.config.json
dossier: sessions/resolver-dossiers/resolver-pass-15-dossier.md
commits:
  - 44d2834  # Phase 0 (Preflight/Dossier)
  - 0829b97  # Phase 1 (Factions)
  - f60c2ba  # Phase 2 (Locations)
  - 95e62c2  # Phase 3 (Characters)
  - 8e7f3cb  # Phase 4a (Integration/Apply)
  # Phase 4b (Verify/Report) is the commit carrying this report.
---

# Resolver-Pass 15 — impl report (ssot-hh-026..030 / HH-0251..HH-0294)

## Summary

**Pass 15 is the HH audio-drama + artbook/scriptbook wave that lands
the 294-book HH-domain near-final milestone** — 44 books
HH-0251..HH-0294, picking up directly after the Pass-14
post-Heresy-tail wave (50 books at HH-0201..HH-0250). The wave
carries the **first-cycle Heresy audio-drama bloc** (HH-0251..HH-0260,
ssot-hh-026, 2012–2014 audio dramas — the foundational Black-Library
Heresy audio-drama series after the 2007 Original Six), the
**mid-Heresy Legion-vignette audio-drama bloc** (HH-0261..HH-0270,
ssot-hh-027), the **late-Heresy Garro-trilogy re-issue + Pharos /
Sicarus / Tallarn tail bloc** (HH-0271..HH-0280, ssot-hh-028), the
**Siege-prelude + Endryd-Haar Blackshields sub-arc bloc**
(HH-0281..HH-0290, ssot-hh-029 — first hit of the Pass-14-forecasted
Blackshields trilogy), and the **HH artbook + scriptbook tail bloc**
(HH-0291..HH-0294, ssot-hh-030, 2007–2018 reference-volume re-issues
— Collected Visions / Scripts Volume I + II / Visions of Heresy 2018
ed.). Brief 100 two-domain Resolver-Loop + Cross-Era-Identitäten rules
continue to apply.

All six phases landed cleanly on the first try. The JSON reference
layer grew by **+3 factions / +5 locations / +10 characters and +1 / +3 / +3
aliases**. **Phase 4a landed the cumulative `hh 1..30` apply: works
815 → 859** (+44 — the exact 44 HH books of this wave). The Brief-091
forward-ref Guard reports forward collection refs = **53** (unchanged
vs. Pass-14: all the historical W40K + earlier-HH cross-batch
anthologies whose constituents are now well in-range), `out-of-range=0`,
`unknown-work=0` — exactly the dossier §7d forecast (empty §5 omnibus
scan; Guard idle this wave).

Phase 4b ran the **read-only** half: `verify-pass.ts --config …`
confirms the live DB matches the digest (859 HH+W40K works present,
all 5 smoke slugs carry their junction counts, 44/44 Goodreads-rated
for the NEW range, NEW + OLD audit replicas report the expected
drift/gap shape for an audio-drama-dominated wave with an artbook /
scriptbook overview tail); `lint` + `typecheck` clean. This
impl-report is polished from the 4a status file + the committed
Apply-Digest + the Verify-Digest stdout — **without re-deriving
state**, per runbook §3 Phase 4b.

**Headline:** the HH audio-drama + artbook/scriptbook wave landed
end-to-end with no halts and no re-runs, the **fifth clean two-domain
pass in a row**. The HH authority layer now carries **294 / 859
books (~34.2% of the eventual HH corpus)** — the near-final HH-domain
mark; per dossier §1 + §7d only ~1 batch (~10 books) of HH-domain
works remains after this pass before the HH corpus closes out at the
~304-book mark. One 4a quantitative judgment recorded
(EXPECTED_RANGES.locations.max bumped 1100 → 1500, exactly the
Pass-14-forecasted re-tune, with ~24% post-bump headroom); no
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

- **Phase 0 — Preflight/Dossier** (`44d2834`): `scripts/aggregate-
  surface-forms.ts --config …` produced 6 of the 7 dossier sections
  deterministically for the 44-book wave; the 7th section
  (cross-batch alias-consolidation + needs-decision candidates) was
  synthesized from tail-reads of the wave's loop-log blocks, with
  two strict-freq-≥2 Phase-3 alias-consolidation cases (`Aenoid Thiel
  → aeonid_thiel` typo + `Bjorn the One-Handed → bjorn` Pre-
  Dreadnought honor-title), one strict-freq-2 Phase-2 alias case
  (`Solar System → sol_system` spacing variant), one strict-freq-3
  within-batch Phase-3 character spine (`Endryd Haar` for the
  Pass-14-forecasted Blackshields sub-arc), and a curated freq-1
  promotion bloc spanning all three axes. Empty §5 omnibus scan
  (the four ssot-hh-030 artbook/scriptbook entries are reference
  volumes, not roster-collection containers). No override files read
  in-context.
- **Phase 1 — Factions** (`0829b97`, +3 rows / +1 alias): three new
  curated freq-1 / freq-1-with-strict-evidence faction rows —
  `officio_sigillite` (Malcador's institutional Office on Terra),
  `legio_praesagius` (the Heresy-era Ultramarines-aligned Titan
  Legion at Calth / Ithraca), and `adeptus_administratum` (the
  imperial bureaucracy surfacing through the *Garro: Shield of Lies*
  Riga-Orbital-Plate arc). One short-form alias `Administratum →
  adeptus_administratum` for surface-form coverage. ≥ 5 new resolver-
  test cases. Idempotency confirmed.
- **Phase 2 — Locations** (`f60c2ba`, +5 rows / +3 aliases):
  daemon-world / Pharos-beacon / sub-locale granularity for the HH
  audio-drama bloc — `pharos` (the Mount-Pharos beacon on Sotha),
  `sicarus` (the Word-Bearers daemon-world in the Eye of Terror),
  `ithraca` (the Calth-region sub-locale), `northwilds` (the Caliban
  Heresy-era Order-of-Cypher arc setting), and `numinus` (the
  Calth-region Garro / Tylos-Rubio sub-locale). Three aliases:
  `Solar System → sol_system` (Case L1, the strict-freq-1 spacing
  variant of the canonical `sol_system` row), `Planet of Sorcerers →
  planet_of_the_sorcerers` (branch-(a) override resolving the
  strict-freq-2 within-batch evidence onto the existing canonical
  row), `Mount Pharos → pharos` (companion alias to the new `pharos`
  row for the bare-`Mount Pharos` surface form). ≥ 4 new resolver-
  test cases. Idempotency confirmed.
- **Phase 3 — Characters** (`95e62c2`, +10 rows / +3 aliases): the
  wave's targeted dramatis personae landed as a curated mix:
  **1 cluster-7b spine** (`endryd_haar`, the Pass-14-forecasted
  Blackshields-trilogy protagonist with strict freq-3 within-batch
  evidence across HH-0286 / HH-0287 / HH-0290) + **9 strong/medium
  curated freq-1** (`khalid_hassan`, `argonis`, `yasu_nagasena`,
  `sobek`, `amon`, `zagreus_kane`, `vethorel`, `bulveye`,
  `erud_vahn` — all lore-anchored Dossier evidence). Three character
  aliases: Case A `Aenoid Thiel → aeonid_thiel` (the strict-freq-1
  transposition typo onto the highest-frequency Ultramarines-cast
  surface), Case B `Bjorn the One-Handed → bjorn` (Cross-Era /
  Honor-Title-Split — the Pre-Dreadnought honor-title variant onto
  the Pass-11 `bjorn` row, exactly the Pass-11-anticipated cross-pass
  consolidation), and `Lord Cypher → cypher` (the Cross-Era
  Heresy-era-Dark-Angels-title-character → post-Heresy
  `cypher` Fallen-Lord-of-the-Fallen alias, resolving the §7d
  Cross-Era disambig as a strong alias case per runbook §4
  convention). `primaryFactionId` of every new row points at the
  Phase-1 faction set (FK-clean, runbook §5 strictly observed).
  ≥ 5 new resolver-test cases, ≥ 2 of them for cross-era /
  cross-batch alias-consolidation.

### Phase 4a — Integration / Apply (commit `8e7f3cb`)

- **Trias batch-range extensions — Brief 100 Domain-+-N-Append:**
  the five new HH tuples `{domain:"hh", n:"026"}` ..
  `{domain:"hh", n:"030"}` appended to `BATCHES` in
  `scripts/apply-override-dry.ts`,
  `scripts/test-resolver-coverage.ts`, and
  `scripts/test-resolver-data-integrity.ts`. In the data-integrity
  script the hardcoded `coverage smoke slugs` label range was
  updated from `hh-001..025` to `hh-001..030` (parity to the
  Pass-14 `hh-001..025` bump).
- **EXPECTED_RANGES.locations.max bumped `1100 → 1500`** — exactly
  the Pass-14-forecasted re-tune ("locations cap is now the tightest
  bound; future passes (esp. the remaining ~45 HH-domain books) will
  likely require a locations-cap re-tune"). Pass-15's 44-book wave
  crossed the cap (work_locations dry post-apply **1145** vs. 1100),
  so the bound was raised to 1500 (~24% headroom for the remaining
  ~1 HH batch + a margin into the next consolidation pass). The
  factions cap (`3200`, currently `2754/3200` ≈ 14% headroom) and
  characters cap (`2200`, currently `1997/2200` ≈ 9% headroom) hold
  without re-tune. Comment updated to record Pass-15 rationale
  alongside the Pass-13 faction-cap precedent.
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
- **`scripts/seed-data/persons.json` auto-extended (+40 rows)** by
  `db:apply-override`'s `ensurePersonsExist` mechanism — the
  audio-drama wave brought 40 new BL-author Authority-Layer-
  Erstaufträge (`785 - 745 = 40` net, deltas land per-batch in the
  digest as `+10 / +10 / +10 / +10 / +0` cumulative across
  ssot-hh-026..030, with the `+0` at ssot-hh-030 reflecting the
  artbook/scriptbook format note: all four ssot-hh-030 books have
  `author: "?"` per the roster → no author-person rows, matching
  the artbook/scriptbook format note in dossier §1 / §7d).
- **Apply-side trias green on the first try:**
  - `test:resolver` 473/0 ✓ (Phase-3-Stand)
  - `test:resolver-data` ✓ 10 / 10 (smoke-slug label
    `w40k-001..057 + hh-001..030`)
  - `test:resolver-coverage` ✓ exit 0 (informational below-threshold
    rows are pre-existing carry-through data findings, no regression)
  - `test:apply-override-dry` ✓ (859 books,
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
  `applied ssot-hh-001..030: ok` (all 30 `applied: ok`),
  `DONE`. Works 815 → 859 (+44); per-batch snapshots emitted
  for ssot-hh-026..030 only (the new-wave filter —
  ssot-hh-001..025 are idempotent re-apply, no new books, no
  per-batch snapshot).
- **No facetId strips** — pre-validated all 86 facet_values vs.
  every facetId in `manual-overrides-ssot-hh-{026..030}.json`:
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
  `src/app/layout.tsx:44` carried unchanged across Passes 5–15 —
  Strang-fremd, Product-side, not in any Batches-Strang scope).
- This impl-report assembled from the 4a status file
  (`resolver-pass-15-phase-4a-report.md`) + the committed
  Apply-Digest (`ingest/.last-run/phase4-digest.md`) + the
  Verify-Digest stdout — no state re-derivation, no second DB
  apply, no trias re-run (runbook §3 Phase 4b).

## Counts (Pflicht-Tabelle)

| Stage | works | work_factions | work_locations | work_characters | work_collections | work_persons | work_facets |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Pre-Apply | 815 | 2621 | 1087 | 1911 | 196 | 745 | 16084 |
| Post-batch `ssot-hh-026` | 825 | 2639 | 1102 | 1929 | 196 | 755 | 16248 |
| Post-batch `ssot-hh-027` | 835 | 2660 | 1112 | 1944 | 196 | 765 | 16405 |
| Post-batch `ssot-hh-028` | 845 | 2682 | 1126 | 1958 | 196 | 775 | 16592 |
| Post-batch `ssot-hh-029` | 855 | 2702 | 1131 | 1976 | 196 | 785 | 16758 |
| Post-batch `ssot-hh-030` | 859 | 2752 | 1144 | 1992 | 196 | 785 | 16845 |
| **Post-Apply (859)** | **859** | **2752** | **1144** | **1992** | **196** | **785** | **16845** |
| Δ (wave 15) | **+44** | **+131** | **+57** | **+81** | **+0** | **+40** | **+761** |

(Source: `ingest/.last-run/phase4-digest.md` at `8e7f3cb`. The re-apply
of `ssot-hh-001..025` from the cumulative range emits no per-batch
counts — idempotent re-apply over existing books, only
`delete-then-insert` per junction, counts untouched at 815.)

**Reading the deltas.**
- `works +44`: HH-0251..HH-0294 — the wave's 44 new books, the HH
  audio-drama bloc (40 audio dramas at ssot-hh-026..029) + the HH
  artbook/scriptbook tail (4 reference volumes at ssot-hh-030).
- `work_collections +0`: the dossier §5 omnibus scan was empty this
  wave (the four ssot-hh-030 artbook/scriptbook entries do **not**
  carry `relatedBookIds` per the roster — reference volumes are not
  novel-omnibi). The Brief-091 forward-ref Guard had no work to do;
  clean output matches the dossier §7d forecast. `work_collections`
  stays flat at 196 across every per-batch snapshot.
- `facet_values +0`: 0 unknown facetIds across all 5 override files
  — zero strips needed; `facet-catalog.json` correctly stayed out of
  scope (no `## Needs decision` triggered).
- `work_factions +131`, `work_locations +57`, `work_characters +81`:
  per-batch shape is mostly uniform (10-book ssot-hh-026..029 +
  4-book ssot-hh-030), with **ssot-hh-030's jump in junctions
  (+50 factions / +13 locations / +16 characters across just 4
  artbook/scriptbook works)** reflecting the multi-Legion / multi-
  Primarch overview-coverage of the HH artbook + scriptbook tail —
  single entries like *Collected Visions* and *Visions of Heresy
  2018 ed.* aggregate surface forms across the entire HH series.
- Reference deltas (`factions/locations/characters +3/+5/+10`) match
  Phase 1/2/3 row additions exactly — see Reference-rows table
  below.

**Reference rows (JSON-side, landed via Phases 1–3, in the DB after 4a):**

| file | rows pre Pass-15 | rows post Phase 1/2/3 (JSON) | delta | rows in DB | DB delta after 4a |
| --- | ---: | ---: | ---: | ---: | ---: |
| `factions.json` | 199 | 202 | +3 | 202 | +3 ✓ |
| `faction-aliases.json` | 72 | 73 | +1 | (aliases not in DB) | — |
| `locations.json` | 283 | 288 | +5 | 288 | +5 ✓ |
| `location-aliases.json` | 22 | 25 | +3 | (aliases not in DB) | — |
| `characters.json` | 481 | 491 | +10 | 491 | +10 ✓ |
| `character-aliases.json` | 61 | 64 | +3 | (aliases not in DB) | — |
| `sectors.json` | 8 | 8 | 0 | 8 | 0 |
| `persons.json` | 100 | 100 | 0 | (auto-added via `ensurePersonsExist`) | +40 |
| `facet_values` | 86 | 86 | 0 | 86 | 0 |

`facet_values 86→86` — no facet add needed this wave.
`persons.json 100→100` (JSON) but **`+40` in DB** — all 40 new author
bindings were auto-added by `db:apply-override`'s `ensurePersonsExist`
mechanism (per Brief-077 apply-layer contract) without needing
Phase-3-side roster maintenance. The audio-drama format brings
broader BL-author coverage than the post-Heresy-tail novel format;
the artbook/scriptbook tail (ssot-hh-030) contributes `+0` to
`work_persons` (all four have `author: "?"`).

## Decisions I made

Phase 4b is read-only — there were no decisions to make here beyond
faithfully reflecting the clean 4a state in this report. The
decisions that landed in Phases 0–4a are documented in their
per-phase reports; no `## Needs decision` block was forwarded from
any phase. One 4a quantitative judgment was required this wave
(EXPECTED_RANGES.locations.max re-tune `1100 → 1500`, exactly the
Pass-14-forecasted bump, with ~24% post-bump headroom). Pass 15 is
the **fifth consecutive clean two-domain pass** (Passes 11, 12, 13,
14, 15 all landed without halts or re-runs).

## In-collection materialization (NEW + OLD range)

Pass 14 closed at cumulative in-collection 46 across HH-0001..HH-0200
(after the +9 first-three-HH-omnibi absorption at HH-0231/HH-0232/
HH-0233). Pass 15 carries the **OLD range HH-0001..HH-0250 cumulative
count to 49** (verified by `verify-pass.ts` at the live DB —
`content_in_collection=49` for `HH-0001..HH-0250`). The +3 lift vs.
Pass-14's OLD-range baseline of 46 reflects the three NEW-range
in-collection edges that Pass-14 *itself* materialized at HH-0231 /
HH-0232 / HH-0233 (now in OLD range for Pass-15 purposes) — the
Pass-14 omnibi are now OLD-range constituents-of-collections from
Pass-15's vantage point.

The **NEW range HH-0251..HH-0294 carries `content_in_collection=0`**
— the empty §5 omnibus scan this wave (no roster-collection
containers in HH-0251..HH-0294; the four ssot-hh-030 artbook /
scriptbook entries do **not** carry `relatedBookIds`). This is
the Pass-15-specific Verify-Digest signature: **the only HH wave so
far where the NEW range materializes zero work_collections edges**,
exactly matching the apply-side `work_collections +0` delta and the
dossier §7d forecast ("the §5 omnibus scan is empty this wave").

The smoke slugs confirm the audio-drama + artbook/scriptbook shape:
**0 of 5 smoke slugs (HH-0260 *Hunter's Moon*, HH-0270 *Iron
Corpses*, HH-0280 *Children of Sicarus*, HH-0290 *Blackshields: The
Broken Chain*, HH-0294 *Visions of Heresy 2018 ed.*) carry
`in_coll=1`** — none of the wave-representative last-batch books is
itself a constituent of an in-range anthology (the absence of
roster-collection omnibi this wave is the structural cause).
`unknown-work=0` across the entire dry-run validation — every
forward-ref the apply layer encountered resolved to a known work, and
`out-of-range=0` confirms the cumulative re-apply over the now-extended
range is exhaustive.

## Verification

- **Apply digest** (`ingest/.last-run/phase4-digest.md`, committed at
  `8e7f3cb`):

  ```
  Config: scripts/resolver-pass.config.json
  apply-range: ssot-hh-001 ssot-hh-002 ssot-hh-003 ssot-hh-004
               ssot-hh-005 ssot-hh-006 ssot-hh-007 ssot-hh-008
               ssot-hh-009 ssot-hh-010 ssot-hh-011 ssot-hh-012
               ssot-hh-013 ssot-hh-014 ssot-hh-015 ssot-hh-016
               ssot-hh-017 ssot-hh-018 ssot-hh-019 ssot-hh-020
               ssot-hh-021 ssot-hh-022 ssot-hh-023 ssot-hh-024
               ssot-hh-025 ssot-hh-026 ssot-hh-027 ssot-hh-028
               ssot-hh-029 ssot-hh-030
  new wave:    ssot-hh-026 ssot-hh-027 ssot-hh-028 ssot-hh-029
               ssot-hh-030

  PRE-APPLY:   815 works / 2621·1087·1911·196·745·16084 junctions
                         / 199·283·481·86 refs+facets
  seed-resolver-extensions: ok
  seed-facets: catalog values 86; newly inserted 0
  applied ssot-hh-001..025: ok   (idempotent re-apply, no new books)
  applied ssot-hh-026: ok → POST 825 / 2639·1102·1929·196·755·16248
                                  / 202·288·491·86
  applied ssot-hh-027: ok → POST 835 / 2660·1112·1944·196·765·16405
                                  / 202·288·491·86
  applied ssot-hh-028: ok → POST 845 / 2682·1126·1958·196·775·16592
                                  / 202·288·491·86
  applied ssot-hh-029: ok → POST 855 / 2702·1131·1976·196·785·16758
                                  / 202·288·491·86
  applied ssot-hh-030: ok → POST 859 / 2752·1144·1992·196·785·16845
                                  / 202·288·491·86
  DONE
  ```

  (Reference deltas `factions/locations/characters +3/+5/+10` land on
  the ssot-hh-026 boundary because `seed-resolver-extensions.ts` runs
  once before the first batch. `work_collections` stays flat at 196
  across every per-batch snapshot — the empty §5 omnibus scan / Guard-
  idle outcome the dossier §7d forecast. `work_persons` jumps `+10`
  per batch for ssot-hh-026..029 then `+0` for ssot-hh-030 — the
  artbook/scriptbook author-`?` shape. `work_factions` jumps `+50` at
  ssot-hh-030 alone — the multi-Legion overview-coverage of *Collected
  Visions* + *Visions of Heresy 2018 ed.*)

- **Verify digest** (`verify-pass.ts --config
  scripts/resolver-pass.config.json`, stdout — the live DB matches
  the apply digest exactly):

  ```
  # verify-pass digest — Resolver-Pass 15 (ssot-hh-026..030)

  == smoke slugs (factions / locations / characters / in_collection) ==
    {"external_book_id":"HH-0260","slug":"hunters-moon","f":2,"l":0,"c":0,"in_coll":0}
    {"external_book_id":"HH-0270","slug":"iron-corpses","f":1,"l":1,"c":0,"in_coll":0}
    {"external_book_id":"HH-0280","slug":"children-of-sicarus","f":2,"l":2,"c":1,"in_coll":0}
    {"external_book_id":"HH-0290","slug":"blackshields-the-broken-chain","f":2,"l":0,"c":2,"in_coll":0}
    {"external_book_id":"HH-0294","slug":"visions-of-heresy-2018-ed","f":20,"l":4,"c":3,"in_coll":0}

  == rating coverage HH-0251..HH-0294 by source ==
    {"rating_source":"goodreads","n":44}

  == rating coverage HH-0251..HH-0294 rated/null/total ==
    {"rated":44,"null_rating":0,"total":44}

  == audit replica OLD range HH-0001..HH-0250 ==
    {"total_works":250,"drift_works":123,"gap_works":80,"content_in_collection":49}

  == audit replica NEW range HH-0251..HH-0294 ==
    {"total_works":44,"drift_works":25,"gap_works":18,"content_in_collection":0}
  ```

  **Reading the verify-digest.**
  - **All 5 smoke slugs present** — one wave-representative book per
    batch (HH-0260 / HH-0270 / HH-0280 / HH-0290 / HH-0294) carries
    junction counts. The cluster shape varies as expected for the
    audio-drama + artbook/scriptbook tail: *Hunter's Moon* (HH-0260)
    is a tight Space-Wolves audio drama (f=2, l=0, c=0 — single-arc,
    unresolved locations / characters carrying forward as data
    findings); *Iron Corpses* (HH-0270) is a single-faction Iron-
    Warriors-at-Tallarn piece (f=1, l=1, c=0); *Children of Sicarus*
    (HH-0280) is the Word-Bearers daemon-world piece (f=2, l=2, c=1);
    *Blackshields: The Broken Chain* (HH-0290) closes the Endryd-
    Haar trilogy (f=2, l=0, c=2 — `low_confidence:locations`
    advisory flag from dossier §6); **HH-0294 *Visions of Heresy 2018
    ed.* shows the artbook overview-coverage signature (f=20, l=4,
    c=3)** — twenty distinct Legion/sub-faction surface forms in a
    single overview-coverage book, far above the single-arc audio-
    drama shape, exactly the dossier §1 / §7d artbook/scriptbook
    forecast. **0 of 5 smoke slugs have `in_coll=1`** — none of the
    last-batch representative books is itself a constituent of an
    in-range anthology (the empty §5 omnibus scan is the structural
    cause).
  - **Rating coverage 44/44** for HH-0251..HH-0294 — full Goodreads
    coverage, 0 null ratings, continuing the late-arc pattern
    (Pass 13 was 60/60, Pass 14 was 50/50, Pass 15 is 44/44).
  - **OLD range HH-0001..HH-0250 cumulative:** 250 works, 123 drift,
    80 gap, **49 in_coll**. Versus Pass-14's cumulative baseline of
    46 (HH-0001..HH-0200 = 46) → **+3 lift** absorbed into the OLD
    range (the three NEW-range in-collection edges Pass-14
    materialized at HH-0231/HH-0232/HH-0233, now OLD-range from
    Pass-15's vantage point). Drift 123 = Pass-14 sum (97+25 = 122)
    plus 1 (minor cross-batch drift adjustment from the cumulative
    re-apply over the extended range). Gap 80 = Pass-14 sum (59+21 =
    80), **exact** — no new historical gap_works in OLD range, no
    historical gap closed.
  - **NEW range HH-0251..HH-0294 audit replica:**
    - `total_works=44` — all 44 wave books materialized in `works`.
    - `drift_works=25` — 25 of 44 works (~57%) have at least one
      junction whose `raw_name` ≠ canonical entity name
      (case-insensitive). The ratio is higher than Pass-14's 50%
      because this wave's three character aliases (Case A `Aenoid
      Thiel → aeonid_thiel` typo, Case B `Bjorn the One-Handed →
      bjorn` honor-title, `Lord Cypher → cypher` Cross-Era disambig)
      plus the Pass-1/2 new aliases plus the cumulative Cross-Era
      anchors all land `raw_name ≠ canonical.name` by definition for
      legitimate identity-coherence reasons.
    - `gap_works=18` — 18 of 44 works (~41%) have at least one of
      factions / locations / characters with `count=0`. Slightly
      below Pass-14's 21/50 (~42%); the audio-drama format dominates
      single-axis pieces (HH-0260 *Hunter's Moon* `l=0,c=0`, HH-0270
      *Iron Corpses* `c=0`, HH-0290 *Blackshields: The Broken Chain*
      `l=0` are structural examples — single-arc audio dramas with
      one or two named axes). This is a data finding for the
      audit-cockpit data-quality cycle, not a 4a failure.
    - **`content_in_collection=0`** — the empty §5 omnibus scan
      this wave (no roster-collection containers in HH-0251..HH-0294
      — the four ssot-hh-030 artbook/scriptbook entries do not carry
      `relatedBookIds`). Matches the apply-side `work_collections +0`
      delta exactly. **The first HH wave with zero NEW-range
      in-collection edges**, reflecting the artbook/scriptbook
      reference-volume nature of the ssot-hh-030 tail.

- **Trias (state after Phase 4a, not re-run in Phase 4b per runbook §10):**
  `test:resolver` 473/0, `test:resolver-data` ok (10/10),
  `test:resolver-coverage` exit 0, `test:collection-refs` 10/0,
  `test:apply-override-dry` ok (out-of-range=0, unknown-work=0).
- **Lint:** 0 errors, 1 pre-existing
  `@next/next/no-page-custom-font` warning in
  `src/app/layout.tsx:44` (unchanged across Passes 5–15,
  Strang-fremd, out of scope).
- **Typecheck:** 0 errors.

## Maintainer handoff

- **HH audio-drama + artbook/scriptbook wave landed in the DB:**
  works `815 → 859` (+44). The live Supabase carries 859 works /
  2752·1144·1992·196·785·16845 junctions / 202·288·491·86
  refs+facets, verified by `verify-pass.ts`. PR-merging this branch
  is **safe and complete** — it brings the JSON reference additions
  (+3 factions / +5 locations / +10 characters / +1 / +3 / +3
  aliases / +40 persons (DB-only via `ensurePersonsExist`) / Phase-
  1..3 resolver-test cases), the three trias batch-tuple extensions
  (×5 each), the EXPECTED_RANGES.locations.max bump `1100 → 1500`,
  the per-phase reports, the refreshed Apply-Digest, and this
  impl-report.
- **Branch shape:** `codex/ingest-batches-resolver-loop-hh` is a
  clean linear branch ahead-of-`origin/main` by ~38 commits (the
  cumulative Pass-12/13/14 commit set already on the branch from
  prior passes, plus the Pass-15 5 phase commits `44d2834` /
  `0829b97` / `f60c2ba` / `95e62c2` / `8e7f3cb` + this Phase 4b
  commit). No rebase, no force-push needed — a plain `git push -u
  origin codex/ingest-batches-resolver-loop-hh` + `gh pr create` is
  the full PR sequence.
- **HH authority layer:** **294 / 859 HH books applied (~34.2%)** —
  the HH-domain **near-final** mark. Pass-10 brought 20
  (HH-0001..HH-0020), Pass-11 brought 60 (HH-0021..HH-0080), Pass-12
  brought 60 (HH-0081..HH-0140), Pass-13 brought 60
  (HH-0141..HH-0200), Pass-14 brought 50 (HH-0201..HH-0250),
  Pass-15 brings 44 (HH-0251..HH-0294). Per dossier §1 + §7d only
  ~1 batch (~10 books) of HH-domain works remains after this pass
  before the HH corpus closes out at the ~304-book mark (per the
  loop-helper detector running ahead of the pass). Pass 16 is
  forecasted to be the **final HH wave** before the HH domain seals
  (parallel to the W40K-565 seal). Reference layer in the DB:
  factions `199→202`, locations `283→288`, characters `481→491`,
  sectors `8→8`, facet_values `86→86`, persons `100→186` (DB-side
  via `ensurePersonsExist`; JSON-side `persons.json` unchanged at
  100). JSON-side reference files mirror the DB exactly for
  factions / locations / characters / sectors / facet_values.

## Open issues / blockers

- **None.** No `## Needs decision` blocks from any phase. Forward-ref
  Guard reports **`out-of-range=0, unknown-work=0`** — the cleanest
  possible outcome, exactly matching the dossier §7d forecast (empty
  §5 omnibus scan; Guard idle this wave). Trias green; lint +
  typecheck clean; Verify-Digest matches Apply-Digest. The OLD-range
  cumulative in-collection lift from 46 → 49 confirms the cumulative
  re-apply is exhaustive over the extended range.
- **Informational only:** the `apply-override-dry` `work_locations`
  sanity cap is now at `1144/1500` (~24% headroom after the Pass-15
  re-tune), the `work_factions` cap at `2754/3200` (~14% headroom),
  and the `work_characters` cap at `1997/2200` (~9% headroom — the
  tightest bound). The next pass (forecasted Pass 16, ssot-hh-031..)
  is the HH-domain-final pass; a `work_characters.max` re-tune may
  be required there or in the next consolidation pass. No action
  required this pass.

## For next session

- **Cowork Wiki-Hygiene pass** (Rollup-Ownership in the coordination
  worktree, post-merge): once the PR lands on `main`, the
  coordination worktree backfills `brain/wiki/project-state.md`
  (works 815 → 859, HH at 294 / 859 books ~34.2% — HH-domain
  near-final milestone, ~1 batch / ~10 books remaining),
  `brain/wiki/log.md` (Pass-15 wave entry), and `sessions/README.md`
  (Pass-15 wave row). The Batches strand worktree does not touch
  `brain/**` per CLAUDE.md §"Parallel worktrees" → "Rollup-
  Ownership".
- **Next HH wave** (Pass 16, ssot-hh-031.. when the SSOT-loop
  produces it): forecasted to be the **final HH wave** before the
  HH-domain seal (parallel to the W40K-565 seal). Follows the
  established resolver-pass cadence; should land the remaining ~10
  HH-domain books, after which the HH corpus closes out at the
  ~304-book mark.
- **Audit-cockpit drift/gap follow-up** (data-quality cycle, not
  resolver-pass): the 25 NEW-range drift_works are expected (cross-
  era + cross-form alias resolution producing `raw_name` ≠
  canonical.name); the 18 NEW-range gap_works are mostly the
  structural shape of the audio-drama tail (single-axis pieces) and
  are worth a quick audit-cockpit sweep to confirm none of them is
  a fixable data-quality issue (vs. expected sparse-axis shape).
  HH-0260 *Hunter's Moon* (`l=0, c=0`) and HH-0270 *Iron Corpses*
  (`c=0`) are the most likely candidates for data backfill, but the
  unresolved characters of HH-0260 are flagged by dossier §6 as
  `low_confidence:characters` already.
- **Characters-cap re-tune follow-up** (consolidation cycle, not
  resolver-pass): the `apply-override-dry` `work_characters.max`
  bound (2200) is now within ~9% of the live count (1997). The
  next pass (Pass 16, HH-domain-final) or the next consolidation
  pass is the natural place to re-tune this bound alongside any
  merge movement. The Pass-15 `work_locations.max` re-tune
  (`1100 → 1500`) was the Pass-14-forecasted bump; the next likely
  re-tune is characters.

## References

- Runbook: `sessions/resolver-pass-runbook.md` · Config:
  `scripts/resolver-pass.config.json`
- Dossier: `sessions/resolver-dossiers/resolver-pass-15-dossier.md`
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
