# Resolver-Pass 13 — Phase 1 (Factions) Report

> **Mechanical-task report.** Wave `ssot-hh-015..020` (HH-0141..HH-0200, 60 books).
> Phase 1 (Factions). Driver: per-phase runbook
> [`sessions/resolver-pass-runbook.md`](../resolver-pass-runbook.md) §3 Phase 1 + §4
> (Promotions/Alias-Disziplin, Cross-Era-Identitäten). Config:
> [`scripts/resolver-pass.config.json`](../../scripts/resolver-pass.config.json).
> Dossier: [`resolver-pass-13-dossier.md`](./resolver-pass-13-dossier.md).
> One commit. **No co-author trailer**, **no brief read** (Brief 094 lean contract).

## Summary

| Metric | Pre | Δ | Post |
| --- | ---: | ---: | ---: |
| `factions.json` rows | 190 | +4 | 194 |
| `faction-aliases.json` entries | 70 | +1 | 71 |
| `faction-policy.json` `specialCases` | 47 | +4 | 51 |
| Resolver-trias test count | 392 | +7 | 399 |

Phase-1 promotion shape lands on the **dossier's recommended-target cut**: 2 strict-freq-2
new rows + 1 curated-freq-1 lore-iconic new row + 1 Case-A new row (combined Davinite-Lodge
grain) + 1 alias for the Case-A surface-form variant. Floor (2 rows) avoided in favor of
the recommended target (3 rows) plus the Case-A row, because both Case-A surface forms have
unambiguous lore-evidence (the same Davin cult Erebus uses for Horus's corruption in
HH-0002 *False Gods*) and the dossier explicitly recommends option (a) over leaving the
forms unresolved long-tail.

## Promotions — new canonical rows (4)

| id | name | parent | alignment | tone | evidence |
| --- | --- | --- | --- | --- | --- |
| `crusader_host` | Crusader Host | `imperium` | `imperium` | `imperial` | **freq=2 strict** — HH-0176 *Luna Mendax* (Loken's Terran arc) + HH-0177 *Riven* (Crius / Iron Hands + Imperial Fists); cross-Legion Imperial-loyalist Terra-delegation organ under Malcador/Dorn during the Heresy. |
| `serpent_cult` | Serpent Cult | `house_devine` | `chaos` | `chaos` | **freq=2 strict** — HH-0182 *The Devine Adoratrice* (Devine-family Cult setup) + HH-0195 *Wolf Mother* (Alivia Sureka / Severian counter the Cult aboard Molech's Enlightenment); House Devine's hidden-allegiance Slaaneshi sub-cult on Molech. |
| `therion_cohort` | Therion Cohort | `astra_militarum` | `imperium` | `imperial` | **freq=1 lore-iconic** — HH-0171 *The Divine Word* (Marcus-Valerius-POV); Imperial-Army-elite-regiment-Tier recurring across Heresy-era Imperial-Army shorts. Promotion motivated by the spine character `marcus_valerius` (dossier §7b cross-batch HH-0149 / HH-0171), not by raw surface frequency — Phase 3 will use `therion_cohort` as `primaryFactionId` for that new character row. |
| `davinite_lodge` | Davinite Lodge | `chaos` | `chaos` | `chaos` | **freq=2-via-alias-consolidation** (dossier §7a Case A option (a)) — HH-0175 *Serpent* (`Davinite Serpent Lodge` surface, Thoros-priest vignette) + HH-0196 *Twisted* (`Davinite Lodge` bare-form, Maloghurst counter-plot); same Davin cult, two surface-form variants. Foundational to the early Heresy (Erebus uses the lodge for Horus's corruption in HH-0002 *False Gods*). |

## Aliases — new entries (1)

| surface form | → canonical id | rationale |
| --- | --- | --- |
| `Davinite Serpent Lodge` | `davinite_lodge` | Dossier §7a Case A — single-row + alias per runbook §4 Surface-Form-Treue. Same Davin chaos cult as `Davinite Lodge`; the `Serpent`-qualifier surface form is the *Serpent* HH-0175 author's framing, the bare-form `Davinite Lodge` is HH-0196 *Twisted*. Two surface forms → one canonical row + one alias (simpler grain), per dossier recommendation (a) over option (b) leave-both-unresolved or option (c) two-rows-unmotivated. |

## Phase-1 judgments (cases the dossier flagged for the phase)

- **Case A — Davinite Lodge ↔ Davinite Serpent Lodge (7a).** Phase-1 adopted dossier
  recommendation (a): single row `davinite_lodge` + alias `Davinite Serpent Lodge →
  davinite_lodge`. Both surface forms reference the **same Davin cult** (Erebus's
  Heresy-foundational corruption instrument); the `Serpent`-qualifier is an
  author-framing variant, not a sub-Lodge of an umbrella Davinite-Lodge organization.
  Option (b) leave-both-unresolved would have left freq-2-via-alias-consolidation
  evidence on the floor; option (c) two rows is unmotivated by current evidence. Net:
  +1 row, +1 alias.
- **Case `therion_cohort` regiment-grain (7c+7d).** Phase-1 adopted dossier
  recommendation **promote**, citing the spine-character link to `marcus_valerius`
  (Phase-3 will create the row with `primaryFactionId='therion_cohort'`). Sub-faction
  regiment-grain under `astra_militarum` is consistent with the named-regiment-Tier
  convention (parity with `cadian_shock_troops`, `tanith_first`, `volpone_bluebloods`,
  `kasrkin`, `last_chancers`). Net: +1 row.
- **`Signus Cluster` Phase-2 region-vs-world grain (7c+7d).** Phase-1 out-of-scope —
  deferred to Phase 2. Recommendation stands at alias `Signus Cluster → signus_prime`.
- **`Davinite Lodge` parent choice.** Adopted `parent='chaos'` (not
  `parent='heretic_astartes'`, which would be wrong-grain — the cult is mortal-Davinite,
  not Astartes-Tier; not `parent=null` either, because the cult is in-Chaos-Umbrella,
  not a top-level xenos / historical-canon-layer category). Pattern-parallel to existing
  chaos-cultist rows under the `chaos` umbrella.
- **`Crusader Host` parent choice.** Adopted `parent='imperium'` (not
  `parent='adeptus_astartes'`, which would be wrong-grain — the Crusader Host is
  Legion-übergreifend Cross-Legion, not Astartes-Sub-Tier of one Legion; not
  `parent='knights_errant'`, which would invert the Heresy-lore hierarchy —
  Knights-Errant is Malcador's later cadre after the Heresy-Bruch, the Crusader Host
  predates and runs in parallel). Pattern-parallel to `knights_errant` (same
  Malcador-Direkt-Rahmen, `parent='imperium'`).
- **`Serpent Cult` parent choice.** Adopted `parent='house_devine'` (sub-tier
  convention analog to `sanguinary_guard` under `blood_angels` — named Sub-Formation
  under parent-faction). The `house_devine` row already has `alignment='chaos'`, so the
  Cult's `alignment='chaos'` inherits the same lore-framing without introducing a new
  chaos-cult-grain root.
- **No new aliases for Cross-Era confirmations.** The dossier-listed
  `Luna Wolves → sons_of_horus`, `Imperial Army → astra_militarum`,
  `Mechanicum → mechanicus`, `Sisters of Silence → talons_of_the_emperor`,
  `Dark Eldar → eldar` chains all hold from Pass-10/11 (verified by the `alias` status
  in dossier §3); no Pass-13 edit needed. The two new confirmation test cases added
  (Luna Wolves + Imperial Army) lock the chain against accidental regressions in
  future passes.

## Idempotency check

- All 4 new ids (`crusader_host`, `serpent_cult`, `therion_cohort`, `davinite_lodge`)
  were absent from baseline `factions.json` per pre-edit `grep "id"` scan (190 rows
  pre, 194 rows post — Δ=+4 clean).
- The new alias key `Davinite Serpent Lodge` was absent from baseline
  `faction-aliases.json` (70 entries pre, 71 entries post — Δ=+1 clean).
- The new `specialCases` keys for all 4 new rows were absent from baseline (47 entries
  pre, 51 entries post — Δ=+4 clean).
- No row or alias was renamed or removed; all edits are append-only.

## Tests added (7 — exceeds the runbook §3 Phase 1 floor of 5)

1. `direct match — Resolver-Pass 13 Crusader Host` (freq=2 strict)
2. `direct match — Resolver-Pass 13 Serpent Cult` (freq=2 strict)
3. `direct match — Resolver-Pass 13 Therion Cohort` (freq=1 lore-iconic + spine
   character link)
4. `direct match — Resolver-Pass 13 Davinite Lodge` (Case A canonical)
5. `alias — Resolver-Pass 13 Davinite Serpent Lodge → davinite_lodge` (Case A alias)
6. `alias — Resolver-Pass 13 confirmation Luna Wolves → sons_of_horus` (Pass-10
   Cross-Era chain re-confirmed for HH-0179 + HH-0188)
7. `alias — Resolver-Pass 13 confirmation Imperial Army → astra_militarum` (Pass-10
   alias chain re-confirmed for HH-0149 + HH-0198)

## Verification

Resolver-trias green (runbook §10 — Phase 1 is code-touching, must hold the trias):

- `npm run test:resolver` — **399 passed, 0 failed** (392 → 399; +7 new Pass-13 cases)
- `npm run test:resolver-data` — **ok** (no duplicate ids/names, all parents/FKs
  consistent, all alias targets canonical)
- `npm run test:resolver-coverage` — **exit 0** (smoke coverage holds; below-threshold
  rows are data findings, not regressions)
- `npm run test:apply-override-dry` — **ok** (all 4 new ids unused in current overrides
  — Phase 1 prepares the seed; Phase 4a will exercise them through `ssot-hh-015..020`
  overrides plus extension via `seed-resolver-extensions.ts`)

JSON validity (runbook §3 halt): all three in-scope JSONs parse cleanly via `JSON.parse`
post-edit.

Write-scope adherence (runbook §3): edits limited to the config-scoped paths:
- `scripts/seed-data/factions.json`
- `scripts/seed-data/faction-aliases.json`
- `scripts/seed-data/faction-policy.json`
- `scripts/test-resolver.ts`
- `sessions/resolver-dossiers/resolver-pass-13-phase-1-report.md`

## Ready for Phase 2

Phase 1 is complete. Phase 2 (Locations) may proceed; the `serpent_cult` parent
`house_devine` and the `therion_cohort` parent `astra_militarum` are wired correctly,
so Phase 3 (Characters) can later use them as `primaryFactionId` targets without FK
trap. No `## Needs decision` blockers; no architectural concern surfaced this phase.
