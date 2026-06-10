# Resolver-Pass 16 — Phase 2 (Locations) Report — ssot-w40k-058..060

**Status:** done — ready for Phase 3 (Characters).
**Wave:** `ssot-w40k-058..060` (W40K-0571..W40K-0592, 22 books).
**Phase:** phase-2-locations. One commit. Trias green. No `## Needs decision`.

## Summary

This wave has **no freq ≥ 2 unresolved location** — `Phaedra` (freq 2) already
resolves direct (confirmation). All genuine resolver work is the **curated freq-1
bloc** named in the dossier §7c: the Siege-of-Vraks campaign-world cluster, a
Leagues-of-Votann Hold-ship vessel, plus four lore-notable single worlds/sectors.
Promoted **7 new `locations.json` rows**, all curated freq-1 lore-iconic (dossier
§7c evidence). **No `location-aliases.json` edit** (dossier §7a: no clean
cross-batch alias-consolidation case this wave) and **no `sectors.json` edit** (no
new location takes a sector FK — every new row is `sector: null`). Added **7 new
resolver test cases** (runbook floor ≥ 4). Idempotent: none of the 7 ids/names
pre-existed.

## New rows (`scripts/seed-data/locations.json`, 289 → 296)

| id | name | sector | gx/gy | tags | source book | rationale |
| --- | --- | --- | --- | --- | --- | --- |
| `vraks_prime` | Vraks Prime | null | null | `['death_korps_of_krieg']` | W40K-0588 *Siege of Vraks* | The iconic Imperial-Armour armoury world; lore-major campaign locale. |
| `citadel_of_vraks` | Citadel of Vraks | null | null | `[]` | W40K-0588 *Siege of Vraks* | The fortress at the heart of the siege — a **distinct identity** from the planet (see grain decision). |
| `eternal_starforge_hold` | Kindred of the Eternal Starforge Hold ship | null | null | `['vessel']` | W40K-0580 *The High Kâhl's Oath* | Leagues-of-Votann Hold-ship — **vessel convention** per runbook §3 Phase 2 (`tags:['vessel']`, `gx/gy:null`, not pinned to the map). |
| `gryphonne_iv` | Gryphonne IV | null | null | `['mechanicus']` | W40K-0584 *Dominion Genesis* | Forge World consumed by Hive Fleet Leviathan; lore-notable. |
| `ras_shakeh` | Ras Shakeh | null | null | `[]` | W40K-0586 *Legends of the Wolf: The Omnibus* | Wraight Space Wolves shrine world. |
| `formosa_sector` | Formosa Sector | null | null | `['region']` | W40K-0581 *Daemonhammer* | Sector-grain locale of Coteaz's hunt; `region` tag parity with `gothic_sector`/`thramas_sector`. |
| `fortuna_minor` | Fortuna Minor | null | null | `[]` | W40K-0590 *Leontus* | Lord Solar Leontus vs a Speed Waaagh! warzone. |

## Grain decision — Vraks (dossier §7d #4)

Modelled the Vraks cluster as **two rows**, not one-row-plus-alias. `Vraks Prime`
(the planet) and `Citadel of Vraks` (the fortress on it) are **distinct
identities**, not variant surface forms of one identity. Per runbook §4 an alias is
reserved for variant surface forms of the *same* canonical identity; a planet and a
named fortress sub-location on it are two identities → two rows. This also matches
the established sub-location-as-own-row precedent in the corpus (Lion's Gate
Spaceport / Saturnine Gate as Imperial-Palace sub-locales, Urgall Depression on
Istvaan V). No speculative `Vraks` short-form alias was added — that surface form
does **not** appear in the wave (runbook §4 over-broad-alias guard: alias only when
the surface form concretely occurs).

## Left unresolved (thin freq-1 long-tail, dossier §7c)

Dasht i-Kevar, Fidem IV, Great Grass Plains, Hive Prome, Katerah, Kiros, Legitur,
Lentonia, Malpertuis, Oblazt, Redemption, Sarastus, Serrine, Severitas, Traitor
Rock, Visage, Vytarn — no lore-unambiguous canonical target worth a row this pass;
left open per the "lieber Long-Tail offen lassen" discipline (runbook §2/§4).

## Confirmations (already resolve direct, no edit)

Armageddon, Cadia, Fenris, Mistral, Ophelia VII, **Phaedra (freq 2)**, Rogar III,
Terra.

## Test cases added (`scripts/test-resolver.ts`, +7, runbook floor ≥ 4)

All direct-match, one per new row, appended after the Pass-15 Numinus case in the
`resolveLocation` block:

1. `Vraks Prime` → `vraks_prime`
2. `Citadel of Vraks` → `citadel_of_vraks` (distinct-identity note)
3. `Kindred of the Eternal Starforge Hold ship` → `eternal_starforge_hold` (vessel)
4. `Gryphonne IV` → `gryphonne_iv`
5. `Ras Shakeh` → `ras_shakeh`
6. `Formosa Sector` → `formosa_sector`
7. `Fortuna Minor` → `fortuna_minor`

## Verification (runbook §10)

- `npm run test:resolver` → **486 passed, 0 failed** (exit 0).
- `npm run test:resolver-data` → **resolver data integrity ok** (exit 0).
- `npm run test:resolver-coverage` → exit 0 (below-threshold rows are data findings,
  not failures).
- `npm run test:apply-override-dry` → **ok** (exit 0): missing FK targets 0, dangling
  refs 0, forward collection refs 53 with `out-of-range=0, unknown-work=0` — the
  Brief-091 forward-ref Guard is clean (consistent with dossier §7d #6: omnibus
  collection-gaps are a future-pass note, not a Pass-16 concern).
- JSON validity: `locations.json` parses, 296 rows, **no duplicate ids**;
  `location-aliases.json` (26) and `sectors.json` (8) unchanged.

## Write-scope adherence

Touched only `scripts/seed-data/locations.json`, `scripts/test-resolver.ts`, and
this report. `location-aliases.json` and `sectors.json` deliberately untouched
(within the allowed scope as a subset). No `## Needs decision`.
