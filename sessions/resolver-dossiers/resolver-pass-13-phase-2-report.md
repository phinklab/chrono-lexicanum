# Resolver-Pass 13 — Phase 2 (Locations) Report

> **Mechanical-task report.** Wave `ssot-hh-015..020` (HH-0141..HH-0200, 60 books).
> Phase 2 (Locations). Driver: per-phase runbook
> [`sessions/resolver-pass-runbook.md`](../resolver-pass-runbook.md) §3 Phase 2 + §4
> (Promotions/Alias-Disziplin, Vessel-Konvention `tags:['vessel']`, `gx/gy:null`).
> Config: [`scripts/resolver-pass.config.json`](../../scripts/resolver-pass.config.json).
> Dossier: [`resolver-pass-13-dossier.md`](./resolver-pass-13-dossier.md).
> One commit. **No co-author trailer**, **no brief read** (Brief 094 lean contract).

## Summary

| Metric | Pre | Δ | Post |
| --- | ---: | ---: | ---: |
| `locations.json` rows | 267 | +8 | 275 |
| `location-aliases.json` entries | 19 | +1 | 20 |
| `sectors.json` rows | 8 | 0 | 8 |
| Resolver-trias test count | 399 | +9 | 408 |

Phase-2 promotion shape lands on the **dossier's recommended-target cut** (~8 new rows):
1 strict-freq-2 new row (`terathalion`) + 7 curated-freq-1 lore-iconic new rows (the
mid-Heresy sub-locale / vessel-promotion bloc) + 1 region-vs-world alias (Case 7d
`Signus Cluster → signus_prime`). Ceiling (~18 with weak-curated long-tail) avoided —
the weak-curated freq-1 candidates (Byzanthis / Bastion / Virger-Mos II / Forty-Seven
Sixteen / Goughen / Proxima Apocryphis / Velbayne / Ardent Reef / Aegis sector /
Astagar / Dwell / Euphoros / Gorro / Kernunnos / Persephia) stay unresolved long-tail
per Phase-2 budget conservatism and runbook §4 (only promote on evidence). `sectors.json`
untouched — none of the new rows needed a sector-FK that did not already exist.

## Promotions — new canonical rows (8)

| id | name | sector | gx/gy | tags | evidence |
| --- | --- | --- | :---: | --- | --- |
| `terathalion` | Terathalion | `null` | null/null | `[]` | **freq=2 strict** — HH-0144 *Blades of the Traitor* + HH-0183 *Daemonology*. Heresy-era Mortarion / Death-Guard compliance / warp-locale (loop-log HH-0183: "Terathalion and Terra both load-bearing"). |
| `titan` | Titan | `solar` | null/null | `["imperium"]` | **freq=1 lore-iconic** — HH-0160 *The Last Remembrancer*. Saturn moon Sol-System sub-locale staging the Dorn/Qruze/Solomon-Voss execution argument. Foundational lore (the future M41 Grey-Knights homeworld). Sub-locale grain parent: implicit via `sector='solar'`. |
| `hy_brasil` | Hy Brasil | `solar` | null/null | `["imperium"]` | **freq=1 lore-iconic** — HH-0150 *Blood Games*. Terran hive site of the Dan Abnett Custodes-Heresy-debut investigation. Mythologically-named foundational Terran-civilian-scope locale. |
| `lesser_damantyne` | Lesser Damantyne | `null` | null/null | `["iron_warriors"]` | **freq=1 lore-iconic** — HH-0164 *The Iron Within*. Parent world hosting Schadenhold; the Iron-Warriors-loyalist outpost world of the Dantioch arc. |
| `schadenhold` | Schadenhold | `null` | null/null | `["iron_warriors"]` | **freq=1 lore-iconic** — HH-0164 *The Iron Within*. Iron-Warriors-loyalist fortress on Lesser Damantyne where Barabas Dantioch makes his stand; cross-arc with HH-0177 *Riven* / Crius. |
| `iron_blood` | Iron Blood | `null` | null/null | `["vessel"]` | **freq=1 lore-iconic** — HH-0194 *Black Oculus*. Perturabo's Iron-Warriors flagship throughout the Heresy + post-Heresy. **Vessel-grain** per Pass-7 convention (`tags:['vessel']`, `gx/gy:null`). |
| `molechs_enlightenment` | Molech's Enlightenment | `null` | null/null | `["vessel"]` | **freq=1 lore-iconic** — HH-0195 *Wolf Mother*. House Devine Knight-vessel staging the Alivia-Sureka + Severian counter-cult arc after the Vengeful-Spirit Molech operation. **Vessel-grain** per Pass-7 convention. |
| `ring_of_iron` | Ring of Iron | `null` | null/null | `["mechanicus"]` | **freq=1 lore-iconic** — HH-0186 *Vorax*. Mars-orbit Dark-Mechanicum installation; the Heresy-era Mars-orbit forge-belt and recurring Mechanicum-side locale. |

## Aliases — new entries (1)

| surface form | → canonical id | rationale |
| --- | --- | --- |
| `Signus Cluster` | `signus_prime` | Dossier §7d region-vs-world grain — flat alias-to-world per dossier-recommended budget-conservatism (parallel to Pass-11/12 cluster/sector flat-grain handling for *Beta-Garmon*). The `signus_prime` row conceptually carries the Signus-Campaign region; no other partition surfaces in this wave. Phase 2 chose option (a) over option (b) separate `signus_cluster` row, which would be unmotivated by current evidence. HH-0169 *Lost Sons* (Blood Angels + Tylos Rubio errant-knight visit). |

## Phase-2 judgments (cases the dossier flagged for the phase)

- **`Signus Cluster` region-vs-world grain (7c+7d).** Phase-2 adopted dossier
  recommendation **alias** to `signus_prime` over option (b) `## Needs decision` or
  option (c) separate `signus_cluster` sector-grain row. Rationale: the
  `signus_prime` row already conceptually carries the Signus-Campaign region, and
  promoting a second row would split junction-counts between region and world for the
  same lore arc. Pattern-parallel to existing flat-grain region/world pairs in the
  resolver layer (e.g. Beta-Garmon on the world axis without a separate sector row).
  Net: +1 alias, no new row.
- **`Terathalion` parent / sector choice.** Adopted `sector=null` (no Heresy-era
  sector-FK exists for this locale; the lore evidence in HH-0144 / HH-0183 is
  warp-locale-grain, not Imperial-sector-cartography-grain). `tags=[]` — no single
  faction owns the locale (Mortarion / Death-Guard operate there, but the
  compliance / warp-locale framing predates the Heresy-fall, so a `death_guard` tag
  would be misleading).
- **`Titan` sub-locale grain (7c).** Adopted `sector='solar'` (sub-locale of the
  Sol-System per the Pass-11 `lions_gate_spaceport` precedent — sub-locales of Sol
  carry the `solar` segmentum-FK directly, no separate parent-world FK). `gx/gy=null`
  intentional — Titan is a Saturn-moon sub-locale, not a galactic-map pinned world.
- **`Hy Brasil` Terran-hive grain (7c).** Adopted `sector='solar'` + `gx/gy=null`
  (parent-world Terra is at `(500,320)`, but Hy Brasil is a hive on Terra — sub-locale
  grain, not a separate map pin). Pattern-parallel to Pass-11's `lions_gate_spaceport`
  (Terra-sub-locale carrying `sector='solar'`).
- **`Lesser Damantyne` + `Schadenhold` paired promotion (7c).** Adopted dossier's
  recommended both-row promotion (parent world + fortress sub-locale) rather than
  collapsing Schadenhold into Lesser Damantyne supporting-only. Rationale:
  Schadenhold is the **lore-load-bearing site** (Dantioch's stand is the Schadenhold
  defense, not just "Lesser Damantyne defense"); the Iron-Within / Riven cross-arc
  references Schadenhold by name. Pattern-parallel to Pass-? worlds carrying separate
  rows for their world + their citadel / hive (`fenris` + `fang`, `caliban` + `rock`).
- **`Iron Blood` + `Molech's Enlightenment` vessel-grain (7c).** Adopted vessel
  convention per runbook §3 Phase 2: `tags:['vessel']`, `gx/gy:null` (Welt-Geographie
  schreibt sie nicht auf die Karte). `sector=null` — vessels are not sector-bound.
  Pattern-parallel to existing vessel rows (`casus_belli`, `solace`, `ithracas_vengeance`,
  `steel_tread`, `sin_of_damnation`, `vengeful_spirit`).
- **`Ring of Iron` parent / sector choice.** Adopted `sector=null` + `tags=['mechanicus']`.
  The Ring of Iron is Mars-orbit Dark-Mechanicum installation, but Mars itself carries
  `sector='solar'` + `tags=['mechanicus']`; the Ring of Iron is a Mars-orbital sub-locale
  rather than a separately-pinned segmentum entity. `tags=['mechanicus']` keeps the
  lore-affiliation visible without forcing the `dark_mechanicum` tag (the installation
  is Dark Mechanicum in Vorax HH-0186 but the row anchor is the broader Mars-orbit
  forge-belt that recurs across Mechanicum-side locales).
- **Weak-curated freq-1 long-tail (7c).** Phase-2 left the entire weak-curated set
  unresolved long-tail per runbook §4 + dossier-recommended budget conservatism: 15
  surfaces (Byzanthis HH-0154, Bastion HH-0159, Virger-Mos II HH-0158, Forty-Seven
  Sixteen HH-0152, Goughen HH-0185, Proxima Apocryphis HH-0166, Velbayne HH-0178,
  Ardent Reef HH-0173, Aegis sector HH-0165, Astagar HH-0141, Atlas HH-0147 — disambig
  risk, Dwell HH-0163, Euphoros HH-0199, Gorro HH-0179, Kernunnos HH-0151, Persephia
  HH-0159). All freq=1 single-novella surfaces below the curated lore-iconic threshold;
  a future cross-batch freq-2 surface re-promotes any that hit the strict bar.
- **No Cross-Era / era-rename alias work this wave.** All resolved location surfaces
  catch on existing rows direct or via existing Pass-N aliases (Isstvan V / Isstvan III
  via the long-established Istvaan aliases — verified by `alias` status in dossier §3).
  Pass-10/11/12 location alias chain is exhaustively anchored for this wave; no new
  era-rename or longer-variant alias surfaces above noise.

## Idempotency check

- All 8 new ids (`terathalion`, `titan`, `hy_brasil`, `lesser_damantyne`, `schadenhold`,
  `iron_blood`, `molechs_enlightenment`, `ring_of_iron`) were absent from baseline
  `locations.json` per pre-edit grep on canonical-id field (267 rows pre, 275 rows post
  — Δ=+8 clean).
- The new alias key `Signus Cluster` was absent from baseline `location-aliases.json`
  (19 entries pre, 20 entries post — Δ=+1 clean).
- `sectors.json` not modified; all new rows carry `sector='solar'` (existing) or
  `sector=null`, no new sector-FK needed.
- No row or alias was renamed or removed; all edits are append-only.

## Tests added (9 — exceeds the runbook §3 Phase 2 floor of 4)

1. `direct match — Resolver-Pass 13 Terathalion` (strict freq=2)
2. `direct match — Resolver-Pass 13 Titan` (freq=1 lore-iconic Sol-System sub-locale)
3. `direct match — Resolver-Pass 13 Hy Brasil` (freq=1 lore-iconic Terran hive)
4. `direct match — Resolver-Pass 13 Schadenhold` (freq=1 lore-iconic Iron-Warriors
   loyalist fortress)
5. `direct match — Resolver-Pass 13 Lesser Damantyne` (freq=1 lore-iconic parent
   world)
6. `direct match — Resolver-Pass 13 Iron Blood` (freq=1 lore-iconic vessel-grain)
7. `direct match — Resolver-Pass 13 Molech's Enlightenment` (freq=1 lore-iconic
   vessel-grain)
8. `direct match — Resolver-Pass 13 Ring of Iron` (freq=1 lore-iconic Mars-orbit
   sub-locale)
9. `alias — Resolver-Pass 13 Signus Cluster → signus_prime` (Case 7d region-vs-world
   grain alias)

## Verification

Resolver-trias green (runbook §10 — Phase 2 is code-touching, must hold the trias):

- `npm run test:resolver` — **408 passed, 0 failed** (399 → 408; +9 new Pass-13 cases)
- `npm run test:resolver-data` — **ok** (no duplicate ids/names, all parents/FKs
  consistent, all alias targets canonical, location sectors point at existing sectors
  or null, location coordinates paired)
- `npm run test:resolver-coverage` — **exit 0** (smoke coverage holds; below-threshold
  rows are data findings, not regressions)
- `npm run test:apply-override-dry` — **ok** (`out-of-range=21, unknown-work=0`; the
  new ids unused in current overrides — Phase 2 prepares the seed; Phase 4a will
  exercise them through `ssot-hh-015..020` overrides plus extension via
  `seed-resolver-extensions.ts`)

JSON validity (runbook §3 halt): all three in-scope JSONs parse cleanly via `JSON.parse`
post-edit.

Write-scope adherence (runbook §3): edits limited to the config-scoped paths:
- `scripts/seed-data/locations.json`
- `scripts/seed-data/location-aliases.json`
- `scripts/seed-data/sectors.json` (unmodified — within scope but no edits needed)
- `scripts/test-resolver.ts`
- `sessions/resolver-dossiers/resolver-pass-13-phase-2-report.md`

## Ready for Phase 3

Phase 2 is complete. Phase 3 (Characters) may proceed; no `## Needs decision`
blockers, no architectural concern surfaced. The Phase-3 character rows
`marcus_valerius` (parent `astra_militarum` / `therion_cohort` from Phase 1),
`alivia_sureka` / `severian` (direct, existing), and the rest of the dossier §7c
character promotion shape can reference the new Phase-2 locations as supporting
context (e.g. Schadenhold for `barabas_dantioch` direct surface in HH-0164,
Iron Blood as Perturabo's flagship, Molech's Enlightenment as `alivia_sureka` /
`severian` setting in HH-0195) without FK trap.
