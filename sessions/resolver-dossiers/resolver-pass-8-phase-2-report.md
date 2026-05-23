# Resolver-Pass 8 — Phase 2 (Locations) Report

- **Wave:** `ssot-w40k-046..051` (W40K-0451..0510, 60 books).
- **Spec:** `sessions/resolver-pass-runbook.md` §3 Phase 2 + §4 (Promotions-/Alias-Disziplin).
- **Dossier input:** `sessions/resolver-dossiers/resolver-pass-8-dossier.md` §3 (location surface-form
  aggregate: 61 distinct forms / 80 occurrences) + §4 (cross-axis conflicts) + §7c–7d (per-axis promotion
  shape + needs-decision candidates).
- **Status:** Done — 13 location rows promoted, 7 new resolver test cases, all three triases (resolver
  unit / data-integrity / coverage-smoke) green, `apply-override-dry` clean.

## Promotions

13 new rows in `scripts/seed-data/locations.json` (count: 201 → **214**). Zero alias additions —
each promoted surface form matches the canonical row name exactly under the runbook §2 direct-match
contract, so no `location-aliases.json` entry is needed. `scripts/seed-data/sectors.json` untouched: all
promotions either reference existing sectors (`obscurus`, `tempestus`) or use `sector: null` per the
established pattern for non-pinned worlds.

### Hard freq ≥ 2 promotions (4)

| id | name | freq | source | sector | tags | rationale |
| --- | --- | --- | --- | --- | --- | --- |
| `blackstone_fortress` | Blackstone Fortress | 3 | Hinks duology + Vaults-of-Obsidian anthology (W40K-0483/0484/0485) | `null` | `[]` | Eponymous artefact-fortress. Vessel-edge case but dossier §7c default = **not** `vessel`-tagged (stationary in the Western Reaches across the duology; it's a fortress with rooms, Precipice docks to it). `gx/gy:null` matches the long-tail pattern. |
| `precipice` | Precipice | 3 | same Hinks cluster | `null` | `[]` | Free-trade outpost docked to Blackstone Fortress. Sub-location grain is consistent with `hive_primus`/`underhive`/`asaheim` precedent (flat row, no parent FK — the schema models location ↔ sector, not location ↔ location). |
| `crannog_mons` | Crannog Mons | 2 | Hill Cadian Saga (W40K-0471, W40K-0473) | `obscurus` | `[]` | Cadian surface feature. Parent world `cadia` (already a row, `sector: obscurus`); the new row inherits the segmentum directly. |
| `malouri` | Malouri | 2 | Hill Cadian Saga (W40K-0471, W40K-0473) | `obscurus` | `[]` | Cadian surface feature; same cluster, same segmentum assignment. |

### Lore-iconic freq = 1 promotions (9)

The dossier §7c explicitly enumerates 9 freq=1 candidates as "Phase 2's discretion" (Dominicus Prime,
Almace, Caradryad Sector, Tizca, Thennos, Vansen Falls, Grayloc Manor, Malveil, Theotokos) and §7d adds
the cross-axis Aeldari case Saim-Hann. I promote 9 of these 10, omitting only `caradryad_sector`
(mentioned-in-passing in *Resurrection*, not a central setting — too thin for a row this pass).

| id | name | source | sector | tags | rationale |
| --- | --- | --- | --- | --- | --- |
| `almace` | Almace | *Apocalypse* (W40K-0478) | `null` | `[]` | M42 Cardinal world; primary target of the Charadon Crusade. Lore-iconic across the broader Black-Library M42 corpus, useful long-term anchor. |
| `tizca` | Tizca | *The Ashes of Prospero* (W40K-0475) | `obscurus` | `["thousand_sons"]` | The City of Light, capital of Prospero (Thousand Sons home). Dossier §7c offered "could alias to `prospero` or be its own sub-row" — I chose own-row for parity with the Hive Primus (vs Necromunda) / Asaheim (vs Fenris) precedent: distinct city/continent rows live alongside their parent worlds. Tagged `thousand_sons` matching `prospero`'s tag. |
| `thennos` | Thennos | *The Eye of Medusa* (W40K-0460) | `tempestus` | `["iron_hands"]` | Iron Hands forge moon, the central conflict locus of Eye of Medusa. Segmentum mirrors `medusa` (`tempestus`); tag mirrors. |
| `saim_hann` | Saim-Hann | *Wild Rider* (W40K-0482) | `null` | `["eldar"]` | Aeldari craftworld (location axis). Dossier §4 cross-axis conflict: Phase 1 added `Saim-Hann` → `eldar` as a faction-side alias (Iyanden craftworld pattern); Phase 2 adds the location-side row. Tagged `eldar` mirroring `alaitoc`/`ulthwe` rather than empty mirroring `iyanden` — the more recent additions are the cleaner pattern. |
| `dominicus_prime` | Dominicus Prime | *The Hollow Mountain* (W40K-0457) | `null` | `[]` | Eponymous setting of the second Vaults-of-Terra novel. |
| `malveil` | Malveil | *The House of the Night and Chain* (W40K-0499) | `null` | `[]` | Eponymous setting; Annandale's Warhammer-Horror anchor. |
| `theotokos` | Theotokos | *The Deacon of Wounds* (W40K-0509) | `null` | `[]` | Direct setting of Annandale's second Warhammer-Horror novel. |
| `vansen_falls` | Vansen Falls | *The Colonel's Monograph* (W40K-0500) | `null` | `[]` | Primary setting of McNeill's Warhammer-Horror novella. Paired with `grayloc_manor`. |
| `grayloc_manor` | Grayloc Manor | *The Colonel's Monograph* (W40K-0500) | `null` | `[]` | Paired estate within the Vansen Falls setting. |

### Deliberately NOT promoted

The dossier flagged 9 further unresolved location surface forms in the wave that I deliberately leave
unresolved this pass:

- **`Shyish` (freq 2)** + **`Aqshy` / `Realm of Ghur` / `Ghyre` (freq 1 each)** — Age-of-Sigmar realms;
  the books carrying them are §6 flagged `data_conflict:setting->age_of_sigmar`. Dossier §7c default =
  leave unresolved (the resolver doesn't act on setting; the flag carries through to the audit cockpit).
- **`Ziasuthra` (cross-axis, freq 1+1)** — dossier §7d "judgment call in-phase, leave unresolved" (the
  identity is genuinely murky in *Ghost Warrior*; both faction and location axes stay null).
- **`Caradryad Sector` (freq 1)** — mentioned in *Resurrection*, not a central setting. Too thin.
- **Long-tail freq=1 locations** without lore-iconic justification: `Agarimethea`, `Aparitus`,
  `Ballard's Run`, `Blackgeist`, `Carceri Hive`, `Ceocan`, `Durgov`, `Eremus`, `Fabris Calivant`, `Free
  City of Everyth`, `Gallows Cluster`, `Hinterland`, `Lubentina`, `Mhurghast`, `Parmenio`, `Perdition`,
  `Pilgrim Drift`, `Potence`, `Quradim`, `Redemption`, `Saltire Vex`, `Sarastus`, `Silence`, `Targian`,
  `Telken's Rest`, `The Reverie`, `The Spike`, `Vardan IV`, `Weald`, `Western Reaches`. Long-tail per
  runbook §2 ("lieber Long-Tail offen lassen als eine falsche Canonical-Kante schreiben").
- **`Iyanden` (cross-axis)** — both axes already resolved (faction → alias `eldar`, location → direct
  `iyanden`); §7d explicit no-action.

## Aliases

No additions to `scripts/seed-data/location-aliases.json` this phase. The existing `Cryptus System` →
`cryptus` alias (Pass 6) is the only wave-relevant alias and it already pays off. Saim-Hann is added as
a direct-name row, not an alias.

## Sectors

`scripts/seed-data/sectors.json` untouched. No new segmentum/sector needed: `obscurus` / `tempestus`
already exist, and uncertain placements take `sector: null` per established pattern.

## Tests

7 new resolver test cases appended to `scripts/test-resolver.ts` (the `resolveLocation` block), one per
hard promotion + three lore-iconic anchors covering distinct sub-patterns:

1. `Blackstone Fortress` — freq=3 hard promotion (eponymous artefact-fortress).
2. `Precipice` — freq=3 hard promotion (sub-location grain).
3. `Crannog Mons` — freq=2 hard promotion (Cadian feature, `obscurus`).
4. `Malouri` — freq=2 hard promotion (Cadian feature, `obscurus`).
5. `Almace` — freq=1 lore-iconic (Cardinal world).
6. `Thennos` — freq=1 lore-iconic (Iron Hands forge moon, `tempestus` + `iron_hands` tag).
7. `Saim-Hann` — freq=1 lore-iconic + cross-axis split (Aeldari craftworld location-axis row; faction
   axis aliases to `eldar` via Phase 1).

Runbook §3 Phase 2 mandates ≥ 4 new test cases — 7 delivered. Total resolver assertions: 248 → **255**.

## Idempotence

Re-checked: each of the 13 new `id` strings is unique against the pre-phase 201 rows in
`locations.json` (`blackstone_fortress`, `precipice`, `crannog_mons`, `malouri`, `almace`, `tizca`,
`thennos`, `saim_hann`, `dominicus_prime`, `malveil`, `theotokos`, `vansen_falls`, `grayloc_manor` —
none collide). Each `name` is unique against the pre-phase name set. Re-running this phase on the
post-commit state would emit a no-op (rows skipped as already-present); the data-integrity check `no
duplicate ids or names in resolver reference JSONs` is part of the trias and passes.

## Verifikation (runbook §10)

Code-berührende Phase 2 hält die Trias grün:

- `npm run test:resolver` → **255 passed, 0 failed** (+7 from baseline 248).
- `npm run test:resolver-data` → all 10 checks green (`no duplicate ids or names`, `location sectors
  point at existing sectors or null`, `sector surface forms resolve as non-pinned locations`, etc.).
- `npm run test:resolver-coverage` → script exits 0; the below-threshold smoke axes are pre-existing
  data findings, not failures (the script explicitly states "below-threshold rows are data findings,
  not automatic failures").
- `npm run test:apply-override-dry` → `[apply-override-dry] ok`. 0 missing roster externalBookIds, 0
  missing facet ids, 0 invalid normalized roles, 0 invalid rating overrides, 0 missing resolved FK
  targets, 0 dangling JSON FK/alias refs, 15 forward collection refs (pre-existing Pass-6/7 carry-
  through under the Brief-091 range-aware Guard, expected and within `applyRange` 001..051), 0
  unresolvable constituent refs.

No `lint`/`typecheck` run — Phase 2 only edits JSON data files + `test-resolver.ts` (test data, not
production code).

## Commit

Single phase commit, scope-clean (diff ⊆ Phase-2 `scope[]`):

- `scripts/seed-data/locations.json` (13 new rows appended at array tail)
- `scripts/test-resolver.ts` (7 new `check(...)` calls in the `resolveLocation` block)
- `sessions/resolver-dossiers/resolver-pass-8-phase-2-report.md` (this file)

`scripts/seed-data/location-aliases.json` and `scripts/seed-data/sectors.json` are in the Phase-2
scope but **not** touched this pass (no aliases needed; no new sectors needed). That's expected — the
runbook scope is an upper bound on what a phase **may** write, not a list of files it **must** write.
