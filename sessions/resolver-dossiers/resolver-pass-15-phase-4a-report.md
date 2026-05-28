# Resolver-Pass 15 — Phase 4a (Integration / Apply) Report

> **Mechanical-task report.** Wave `ssot-hh-026..030` (HH-0251..HH-0294, 44 books).
> Phase 4a (Integration / Apply). Driver: per-phase runbook
> [`sessions/resolver-pass-runbook.md`](../resolver-pass-runbook.md) §3 Phase 4a + §7
> (Digest-Disziplin) + §10 (Verifikation). Config:
> [`scripts/resolver-pass.config.json`](../../scripts/resolver-pass.config.json).
> Dossier: [`resolver-pass-15-dossier.md`](./resolver-pass-15-dossier.md).
> One commit. **No co-author trailer**, **no brief read** (Brief 094 lean
> contract). Self-contained — Phase 4b reads this file + the committed apply digest
> (`ingest/.last-run/phase4-digest.md`), not the override files / apply scripts /
> raw per-batch apply output.

## Counts table (Pre / Per-Batch / Post)

Source: committed [`ingest/.last-run/phase4-digest.md`](../../ingest/.last-run/phase4-digest.md)
(non-destructive seed → cumulative re-apply `hh 1..30` → per-new-wave-batch snapshots).

| Snapshot | works | work_factions | work_locations | work_characters | work_collections | work_persons | work_facets | factions | locations | characters | facet_values |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **PRE-APPLY** (post-Pass-14) | 815 | 2621 | 1087 | 1911 | 196 | 745 | 16084 | 199 | 283 | 481 | 86 |
| POST-BATCH `ssot-hh-026` | 825 | 2639 | 1102 | 1929 | 196 | 755 | 16248 | 202 | 288 | 491 | 86 |
| POST-BATCH `ssot-hh-027` | 835 | 2660 | 1112 | 1944 | 196 | 765 | 16405 | 202 | 288 | 491 | 86 |
| POST-BATCH `ssot-hh-028` | 845 | 2682 | 1126 | 1958 | 196 | 775 | 16592 | 202 | 288 | 491 | 86 |
| POST-BATCH `ssot-hh-029` | 855 | 2702 | 1131 | 1976 | 196 | 785 | 16758 | 202 | 288 | 491 | 86 |
| POST-BATCH `ssot-hh-030` | 859 | 2752 | 1144 | 1992 | 196 | 785 | 16845 | 202 | 288 | 491 | 86 |
| **POST-APPLY** | 859 | 2752 | 1144 | 1992 | 196 | 785 | 16845 | 202 | 288 | 491 | 86 |
| **Δ (Pre → Post)** | **+44** | **+131** | **+57** | **+81** | **+0** | **+40** | **+761** | **+3** | **+5** | **+10** | **+0** |

The +44 works lands the **HH-domain 294-book near-final milestone** (Pass-14 ended
at 250 / 815 total works; Pass 15 carries to 294 / 859, of which 294 are HH and 565
are W40K — the W40K side stays sealed). Per dossier §1 + §7d only ~1 batch
(~10 books) of HH-domain works remains after this pass before the HH corpus closes
out at the ~304-book mark. The +3 / +5 / +10 reference-row deltas match the Phase
1 / 2 / 3 report deltas exactly (clean cross-phase handoff).

`work_collections` is **unchanged (+0)**: dossier §5 omnibus scan was empty this
wave (the HH-0291..HH-0294 artbook/scriptbook tail does **not** carry
`relatedBookIds` per the roster — reference volumes are not novel-omnibi). The
Brief-091 forward-ref Guard had no work to do this wave; clean output matches the
dossier §7d forecast.

`work_persons` jumps **+40** while `ssot-hh-030` adds zero new persons (845 →
ssot-hh-030 stays at 785). The four ssot-hh-030 books (Collected Visions /
Scripts Volume I + II / Visions of Heresy 2018 ed.) are artbook/scriptbook
reference volumes with `author: ?` per the roster → no author-person rows, which
matches the artbook/scriptbook format note in dossier §1 / §7d.

## Reference-row deltas (matches Phase 1 / 2 / 3 reports)

| Axis | Pre | Δ | Post | Source phase |
| --- | ---: | ---: | ---: | --- |
| factions | 199 | +3 | 202 | Phase 1 report (`officio_sigillite`, `legio_praesagius`, `adeptus_administratum`) |
| locations | 283 | +5 | 288 | Phase 2 report (`pharos`, `sicarus`, `ithraca`, `northwilds`, `numinus`) |
| characters | 481 | +10 | 491 | Phase 3 report (1 7b spine `endryd_haar` + 9 strong/medium curated freq-1: `khalid_hassan`, `argonis`, `yasu_nagasena`, `sobek`, `amon`, `zagreus_kane`, `vethorel`, `bulveye`, `erud_vahn`) |
| faction_aliases | 72 | +1 | 73 | Phase 1 report (`Administratum → adeptus_administratum` short-form alias) |
| location_aliases | 22 | +3 | 25 | Phase 2 report (`Solar System → sol_system` Case L1, `Planet of Sorcerers → planet_of_the_sorcerers` branch-(a) override, `Mount Pharos → pharos` companion) |
| character_aliases | 61 | +3 | 64 | Phase 3 report (Case A `Aenoid Thiel → aeonid_thiel` typo, Case B `Bjorn the One-Handed → bjorn` honor-title, `Lord Cypher → cypher` Cross-Era disambig) |
| facet_values | 86 | +0 | 86 | unchanged — no Facet-Add required this wave |

`seed-resolver-extensions` reported `ok` (factions upserted on JSON columns;
locations / characters insert-only on new rows). `seed-facets` reported `catalog
values: 86; newly inserted (ON CONFLICT DO NOTHING): 0` — no new facet ids
needed, no `## Needs decision` Facet-Add Stop.

## Strips / Anomalien / 4a-Judgments

- **EXPECTED_RANGES re-tune (locations 1100 → 1500).** The Pass-14 4a report
  explicitly forecast this: "locations cap is now the tightest bound; future
  passes (esp. the remaining ~45 HH-domain books) will likely require a
  locations-cap re-tune". Pass-15's 44-book wave crosses the cap
  (work_locations dry post-apply **1145** vs. 1100). Bumped
  `EXPECTED_RANGES.locations.max` from `1100` to `1500` in
  `scripts/apply-override-dry.ts` (~24% headroom for the remaining ~1 HH batch
  + a margin into the next consolidation pass). Comment updated to record
  Pass-15 rationale alongside the Pass-13 faction-cap precedent. The factions
  cap (`3200`, currently `2754/3200` ≈ 14% headroom) and characters cap
  (`2200`, currently `1997/2200` ≈ 9% headroom) hold without re-tune — both
  still above the cap-bump threshold.
- **No facetId strips.** `seed-facets` upsert reports `0 newly inserted` against
  the existing 86-value catalog. All five new override files
  (`manual-overrides-ssot-hh-026..030.json`) used only existing facetIds. No
  `## Needs decision` Facet-Add Stop triggered; `facet-catalog.json` is
  intentionally out of scope (runbook §3 Phase 4a) and untouched.
- **No collection-ref blockers — forward-ref Guard idle, clean.** The dossier
  §5 omnibus scan was empty (no roster-collection omnibi in HH-0251..HH-0294
  — the four ssot-hh-030 artbook/scriptbook entries do not carry
  `relatedBookIds`), so the Brief-091 forward-ref Guard has **no work to do**.
  `apply-override-dry` confirms: forward collection refs = **53** (unchanged
  vs. Pass-14: all the historical W40K + earlier-HH cross-batch anthologies
  whose constituents are now well in-range), unresolvable constituent refs =
  **0**, `out-of-range = 0`, `unknown-work = 0`. **Exactly the dossier §7d
  forecast** ("expected `out-of-range=0, unknown-work=0`"). `work_collections`
  stays flat at 196 (matches the empty §5 scan).
- **No data_conflict / low_confidence escalations.** The dossier §6 flagged
  six advisory carry-through flags (HH-0251 `low_confidence:characters`,
  HH-0253 `low_confidence:characters`, HH-0265 `low_confidence:locations`,
  HH-0266 `data_conflict:title->Stratagem`, HH-0269
  `low_confidence:characters`, HH-0282 `low_confidence:locations`, HH-0290
  `low_confidence:locations`). The `Strategem` title typo applies as authored
  in the override (canonical BL spelling is `Stratagem`); not a Phase-4a
  gate. All seven advisory flags carry through to the audit cockpit without
  any apply-side issue.
- **No resolver-trias regressions.** All 473 resolver tests pass; all data-
  integrity checks pass (smoke-slug-coverage label bumped to `w40k-001..057 +
  hh-001..030`); coverage smoke checks pass (below-threshold rows are data
  findings carried forward from prior passes per the script's design, not
  Phase-15 regressions); collection-refs unit tests pass (10/10).
- **Cross-Era alias chain confirms exhaustively in apply.** Per dossier §7a
  "Confirmations only" the Pass-10/11/12/13/14 era-rename / honor-title chain
  (Mechanicum → mechanicus, Knights-Errant → knights_errant, Luna Wolves →
  sons_of_horus, Imperial Army → astra_militarum, Horus Lupercal → horus,
  Kharn → kharn_the_betrayer, Khârn → kharn_the_betrayer, Lucius →
  lucius_the_eternal, Corvus Corax → corax) all resolve through `apply-
  override-dry` without missing-FK-target or unresolved-surface findings; the
  Phase 1 / 2 / 3 new aliases (`Administratum`, `Solar System`, `Planet of
  Sorcerers`, `Mount Pharos`, `Aenoid Thiel`, `Bjorn the One-Handed`, `Lord
  Cypher`) all route to existing post-Phase-1-3 canonical rows.

## Verification (runbook §10 — Phase 4a is code-touching, must hold the trias + collection-refs + lint + typecheck)

- `bash scripts/run-phase4-apply.sh scripts/resolver-pass.config.json` — **ok**
  (digest written + ready for commit; no `FAILED` markers in the digest, exit
  0).
- `npm run test:resolver` — **473 passed, 0 failed**.
- `npm run test:resolver-data` — **ok** (10 / 10 checks; smoke-slug label
  bumped to `w40k-001..057 + hh-001..030`).
- `npm run test:resolver-coverage` — **exit 0** (totals: factions=2754/3101,
  locations=1145/1458, characters=1997/2524; below-threshold smoke axes are
  carry-through data findings, not regressions; the script flags but does not
  fail on them).
- `npm run test:apply-override-dry` — **ok** (validation: missing roster ids
  0, missing facet ids 0, invalid roles 0, invalid ratings 0, missing FK
  targets 0, dangling JSON FK/alias refs 0, forward collection refs 53,
  unresolvable constituent refs 0 / out-of-range=0 / unknown-work=0).
- `npm run test:collection-refs` — **10 pass / 0 fail**.
- `npm run lint` — **0 errors** (1 pre-existing warning about Next.js custom
  fonts in `src/app/layout.tsx`, unrelated to this pass).
- `npm run typecheck` — **clean** (no diagnostics).

## Write-scope adherence (runbook §3 + Driver-Halt-Check)

Edits limited to the config-scoped paths for `phase-4a-integration`:

- `scripts/apply-override-dry.ts` (BATCHES `+5` HH tuples `hh-026..030`;
  EXPECTED_RANGES.locations.max `1100 → 1500` with Pass-15 rationale)
- `scripts/test-resolver-coverage.ts` (BATCHES `+5` HH tuples `hh-026..030`)
- `scripts/test-resolver-data-integrity.ts` (OVERRIDE_BATCHES `+5` HH tuples
  `hh-026..030`; smoke-slug-coverage label `hh-025 → hh-030`)
- `ingest/.last-run/phase4-digest.md` (rewritten by `run-phase4-apply.sh`)
- `sessions/resolver-dossiers/resolver-pass-15-phase-4a-report.md` (this file)

Not edited (within scope, no edit needed): `scripts/seed-resolver-extensions.ts`
(loads `*.json` automatically — Phase 1 / 2 / 3 JSON additions already pick up
via the existing seed code path), `scripts/apply-override-collections.ts` (pure
analysis helper, no batch list to extend), `scripts/db-counts.ts`,
`scripts/seed-facets.ts`, `scripts/run-phase4-apply.sh`,
`scripts/seed-data/collection-gaps.json`, `scripts/seed-data/persons.json`,
`scripts/seed-data/manual-overrides-ssot-hh-{026..030}.json` (read-only here —
the Phase-4a script applies them via `db:apply-override`; the Phase did not
mutate any override file).

## Ready for Phase 4b

Phase 4a is complete. Phase 4b (Verify / Report) may proceed; the apply-side
mutations have settled cleanly across the cumulative `hh 1..30` range, the
apply-side trias holds green, the committed apply digest is the canonical
input. No `## Needs decision` blockers. One quantitative 4a-judgment recorded
(EXPECTED_RANGES.locations.max bump 1100 → 1500, Pass-14-forecasted, with
~24% post-bump headroom); no facetId strip. Dossier §7d forecast met exactly
(`out-of-range=0, unknown-work=0`; empty §5 omnibus scan; Brief-091 Guard
idle). Cumulative milestone — **HH-domain 294-book near-final mark** — flagged
for the Phase 4b impl-report (per dossier §7d: "next pass (Pass 16, expected
ssot-hh-031..03N) is forecasted to be the **final HH wave** before the HH
domain seals (parallel to W40K-565 seal)").

**Ready for 4b.**
