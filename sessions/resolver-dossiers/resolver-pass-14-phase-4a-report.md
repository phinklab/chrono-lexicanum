# Resolver-Pass 14 — Phase 4a (Integration / Apply) Report

> **Mechanical-task report.** Wave `ssot-hh-021..025` (HH-0201..HH-0250, 50 books).
> Phase 4a (Integration / Apply). Driver: per-phase runbook
> [`sessions/resolver-pass-runbook.md`](../resolver-pass-runbook.md) §3 Phase 4a + §7
> (Digest-Disziplin) + §10 (Verifikation). Config:
> [`scripts/resolver-pass.config.json`](../../scripts/resolver-pass.config.json).
> Dossier: [`resolver-pass-14-dossier.md`](./resolver-pass-14-dossier.md).
> One commit. **No co-author trailer**, **no brief read** (Brief 094 lean
> contract). Self-contained — Phase 4b reads this file + the committed apply digest
> (`ingest/.last-run/phase4-digest.md`), not the override files / apply scripts /
> raw per-batch apply output.

## Counts table (Pre / Per-Batch / Post)

Source: committed [`ingest/.last-run/phase4-digest.md`](../../ingest/.last-run/phase4-digest.md)
(non-destructive seed → cumulative re-apply `hh 1..25` → per-new-wave-batch snapshots).

| Snapshot | works | work_factions | work_locations | work_characters | work_collections | work_persons | work_facets | factions | locations | characters | facet_values |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **PRE-APPLY** (post-Pass-13) | 765 | 2511 | 1031 | 1811 | 184 | 699 | 15223 | 194 | 275 | 474 | 86 |
| POST-BATCH `ssot-hh-021` | 775 | 2533 | 1038 | 1826 | 184 | 709 | 15406 | 199 | 283 | 481 | 86 |
| POST-BATCH `ssot-hh-022` | 785 | 2550 | 1049 | 1837 | 184 | 719 | 15560 | 199 | 283 | 481 | 86 |
| POST-BATCH `ssot-hh-023` | 795 | 2570 | 1058 | 1858 | 184 | 729 | 15728 | 199 | 283 | 481 | 86 |
| POST-BATCH `ssot-hh-024` | 805 | 2598 | 1076 | 1890 | 193 | 735 | 15916 | 199 | 283 | 481 | 86 |
| POST-BATCH `ssot-hh-025` | 815 | 2621 | 1087 | 1911 | 196 | 745 | 16084 | 199 | 283 | 481 | 86 |
| **POST-APPLY** | 815 | 2621 | 1087 | 1911 | 196 | 745 | 16084 | 199 | 283 | 481 | 86 |
| **Δ (Pre → Post)** | **+50** | **+110** | **+56** | **+100** | **+12** | **+46** | **+861** | **+5** | **+8** | **+7** | **+0** |

The +50 works lands the **HH-domain 250-book milestone** (Pass-13 ended at 200 / 765
total works; Pass 14 carries to 250 / 815, of which 250 are HH and 565 are W40K, the
W40K side sealed). The +5 / +8 / +7 reference-row deltas match the Phase 1 / 2 / 3
report deltas exactly (clean cross-phase handoff).

`work_collections` jumps **+12** (184 → 196), of which **+9** at `ssot-hh-024`
(the three first-three-HH omnibi HH-0231 *Crusade's End* → 4 constituents, HH-0232
*The Razing of Prospero* → 2 constituents, HH-0233 *The Last Phoenix* → 3
constituents = 9 work_collections edges) and **+3** at `ssot-hh-025` (audio-drama
anthology / cross-arc carries — primarily the post-Heresy *Lords of Terra*
anthology and similar). Matches the dossier §5 omnibus scan + Brief 101 forward-ref
guard expectation.

## Reference-row deltas (matches Phase 1 / 2 / 3 reports)

| Axis | Pre | Δ | Post | Source phase |
| --- | ---: | ---: | ---: | --- |
| factions | 194 | +5 | 199 | Phase 1 report (`ordo_sinister`, `legio_audax`, `legio_castigatra`, `legio_cybernetica`, `blackshields`) |
| locations | 275 | +8 | 283 | Phase 2 report (`chemos`, `macragges_honour`, `irkalla`, `imperial_webway`, `albia`, `illyrium`, `jupiter`, `astagar`) |
| characters | 474 | +7 | 481 | Phase 3 report (2 7b spines `macer_varren` + `helig_gallor` + 5 strong-lore-iconic `hydragyrum` / `sibel_niasta` / `crysos_morturg` / `yored_massak` / `torquill_eliphas`) |
| faction_aliases | 71 | +1 | 72 | Phase 1 report (`House Taranis → knights_of_taranis` identity-coherence override) |
| location_aliases | 20 | +2 | 22 | Phase 2 report (`Phalanx → phalanx` bare-form, `Laer → laeran` identity-coherence override) |
| character_aliases | 61 | +1 | 62 | Phase 3 report (Case A `the Emperor → the_emperor` lowercase-article variant) |
| facet_values | 86 | +0 | 86 | unchanged — no Facet-Add required this wave |

`seed-resolver-extensions` reported `ok` (factions upserted on JSON columns;
locations / characters insert-only on new rows; `phalanx.tags` merge picked up the
Phase-2 vessel-tag extension). `seed-facets` reported `catalog values: 86; newly
inserted (ON CONFLICT DO NOTHING): 0` — no new facet ids needed, no `## Needs
decision` Facet-Add Stop.

## Strips / Anomalien / 4a-Judgments

- **No facetId strips.** Pre-validated all 86 facet_values vs. every facetId in
  `manual-overrides-ssot-hh-{021..025}.json` (inline `node` against
  `facet-catalog.json`). Result: **zero unknown facetIds across all five new
  override files**. `facet-catalog.json` deliberately out of scope (runbook §3
  Phase 4a) and untouched — no `## Needs decision` Facet-Add Stop triggered.
- **No collection-ref blockers — forward-ref Guard clean.** `apply-override-dry`
  reports forward collection refs = **53** (all in-range, applied by the
  ascending sweep — Brief 091 / Brief 101 semantics), unresolvable constituent
  refs = **0**, `out-of-range = 0`, `unknown-work = 0`. **Exactly the dossier
  §7d forecast** ("expected `out-of-range=0, unknown-work=0`" — the cleanest
  possible outcome). The three Pass-14 roster-collection omnibi (HH-0231
  *Crusade's End* → HH-0001..HH-0004, HH-0232 *The Razing of Prospero* → HH-0012
  + HH-0015, HH-0233 *The Last Phoenix* → HH-0005 + HH-0023 + HH-0044) all point
  to in-range constituents on the cumulative HH-0001..HH-0250 sweep; Brief 101
  reason-split + range-aware guard handles them cleanly. The Pass-13 carry-
  through of 3 `out-of-range` constituents (from ssot-hh-001..014 anthologies
  pointing at HH-021+ books) is **now resolved** — those constituents are
  in-range as of this pass.
- **No EXPECTED_RANGES re-tune needed.** Dry-run sanity caps (post-Pass-13 bump:
  factions max 3200, locations max 1100, characters max 2200) all hold this
  pass: `work_factions=2622/3200` (~18% headroom), `work_locations=1088/1100`
  (~1% headroom — tightest cap), `work_characters=1916/2200` (~13% headroom).
  The locations cap is now the tightest bound; future passes (esp. the remaining
  ~45 HH-domain books) will likely require a locations-cap re-tune, but that is
  a next-pass concern, not this pass.
- **No resolver-trias regressions.** All 449 resolver tests pass; all data-
  integrity checks pass (smoke-slug-coverage label bumped to `w40k-001..057 +
  hh-001..025`); coverage smoke checks pass (below-threshold rows are data
  findings carried forward from prior passes per the script's design, not
  Phase-14 regressions); collection-refs unit tests pass (10/10).

## Verification (runbook §10 — Phase 4a is code-touching, must hold the trias + collection-refs + lint + typecheck)

- `bash scripts/run-phase4-apply.sh scripts/resolver-pass.config.json` — **ok**
  (digest written + committed; no `FAILED` markers, exit 0).
- `npm run test:resolver` — **449 passed, 0 failed**.
- `npm run test:resolver-data` — **ok** (10 / 10 checks; smoke-slug label bumped
  to `w40k-001..057 + hh-001..025`).
- `npm run test:resolver-coverage` — **exit 0** (below-threshold smoke axes are
  carry-through data findings, not regressions; the script flags but does not
  fail on them).
- `npm run test:apply-override-dry` — **ok** (validation: missing roster ids 0,
  missing facet ids 0, invalid roles 0, invalid ratings 0, missing FK targets
  0, dangling JSON FK/alias refs 0, forward collection refs 53, unresolvable
  constituent refs 0 / out-of-range=0 / unknown-work=0).
- `npm run test:collection-refs` — **10 pass / 0 fail**.
- `npm run lint` — **0 errors** (1 pre-existing warning about Next.js custom
  fonts in `src/app/layout.tsx`, unrelated to this pass).
- `npm run typecheck` — **clean** (no diagnostics).

## Write-scope adherence (runbook §3 + Driver-Halt-Check)

Edits limited to the config-scoped paths for `phase-4a-integration`:

- `scripts/apply-override-dry.ts` (BATCHES `+5` HH tuples `hh-021..025`)
- `scripts/test-resolver-coverage.ts` (BATCHES `+5` HH tuples `hh-021..025`)
- `scripts/test-resolver-data-integrity.ts` (OVERRIDE_BATCHES `+5` HH tuples
  `hh-021..025`; smoke-slug-coverage label hh-020 → hh-025)
- `ingest/.last-run/phase4-digest.md` (rewritten by `run-phase4-apply.sh`)
- `sessions/resolver-dossiers/resolver-pass-14-phase-4a-report.md` (this file)

Not edited (within scope, no edit needed): `scripts/seed-resolver-extensions.ts`
(loads `*.json` automatically — Phase 1 / 2 / 3 JSON additions already pick up
via the existing seed code path), `scripts/apply-override-collections.ts` (pure
analysis helper, no batch list to extend), `scripts/db-counts.ts`,
`scripts/seed-facets.ts`, `scripts/run-phase4-apply.sh`,
`scripts/seed-data/collection-gaps.json`, `scripts/seed-data/persons.json`,
`scripts/seed-data/manual-overrides-ssot-hh-{021..025}.json` (read-only here —
the Phase-4a script applies them via `db:apply-override`; the Phase did not
mutate any override file).

## Ready for Phase 4b

Phase 4a is complete. Phase 4b (Verify / Report) may proceed; the apply-side
mutations have settled cleanly across the cumulative `hh 1..25` range, the
apply-side trias holds green, the committed apply digest is the canonical
input. No `## Needs decision` blockers; no quantitative 4a-judgments (no
EXPECTED_RANGES re-tune, no facetId strip). Dossier §7d forecast met exactly
(`out-of-range=0, unknown-work=0`).

**Ready for 4b.**
