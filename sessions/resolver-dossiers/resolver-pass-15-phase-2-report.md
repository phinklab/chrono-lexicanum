# Resolver-Pass 15 — Phase 2 (Locations) — Report

- **Pass:** 15
- **Wave:** `ssot-hh-026..030` (44 books)
- **Phase:** `phase-2-locations`
- **Status:** ✓ done — single commit, scope-clean, resolver trias green.
- **Dossier:** [`resolver-pass-15-dossier.md`](./resolver-pass-15-dossier.md) — §7c (Locations) +
  §7d (Sortiarius branch).
- **Runbook:** [`../resolver-pass-runbook.md`](../resolver-pass-runbook.md) §3 Phase 2 + §4
  (Promotions-/Alias-Disziplin, Cross-Era).
- **Pre-phase baseline (from §1 of dossier):** locations **283** rows / **22** aliases.
- **Post-phase counts:** locations **288** rows / **25** aliases (Δ = **+5 rows / +3 aliases**).

## Done summary

### New rows added to `scripts/seed-data/locations.json` (5)

All strong curated freq-1 lore-iconic per dossier §7c. Sub-locales inherit the parent world's
`sector` value (or `null` when the parent is itself `sector:null`); the existing data model has no
planet-as-sector entries, so `sectors.json` was **not touched** (no FK requirement triggered the
exception in runbook §3 Phase 2 "ggf. `sectors.json`").

| id | name | sector | gx/gy | tags | parent grain | first-hit |
| --- | --- | --- | --- | --- | --- | --- |
| `pharos` | Pharos | `null` | `null/null` | `["ultramarines"]` | sotha (Sotha-Pharos-beacon sub-locale) | HH-0278 *The Heart of the Pharos* |
| `sicarus` | Sicarus | `null` | `null/null` | `["chaos","word_bearers"]` | daemon-world (Eye of Terror) — parallel to `planet_of_the_sorcerers` | HH-0280 *Children of Sicarus* |
| `ithraca` | Ithraca | `ultima` | `null/null` | `["ultramarines","word_bearers"]` | calth (civilian sub-locale) | HH-0253 *Honour to the Dead* |
| `northwilds` | Northwilds | `obscurus` | `null/null` | `["dark_angels"]` | caliban (sub-region) | HH-0259 *Cypher: Guardian of Order* |
| `numinus` | Numinus | `ultima` | `null/null` | `["ultramarines"]` | calth-region locale | HH-0273 *Garro: Oath of Moment* |

No vessel-grain rows promoted this wave — the dossier-flagged "Riga Orbital Plate" was left
unresolved (orbital civilian platform with no cross-arc warrant beyond the single Garro audio
drama; the vessel-grain convention `tags:['vessel']`, `gx/gy:null` from runbook §3 Phase 2 stays
unused this phase).

### New aliases added to `scripts/seed-data/location-aliases.json` (3)

| surface | → canonical | rationale |
| --- | --- | --- |
| `Solar System` | `sol_system` | Dossier §7a Case L1 — spacing-variant of the canonical `Sol System` surface form (resolver is case-/spacing-sensitive per Brief 049/072). HH-0271 *Garro: Ashes of Fealty*. Identity-equivalence floor-case alias add per runbook §4 (lore-eindeutige Ziel-Canonical-ID). |
| `Planet of Sorcerers` | `planet_of_the_sorcerers` | Dossier §7c/§7d **branch (a) override.** The dossier recommended a new `sortiarius` row, but the existing canonical row `planet_of_the_sorcerers` (W40K M41-era anchor, confirmed in test-resolver.ts since Pass-4 wave) already covers this Thousand-Sons daemon-world identity. Per runbook §4 "eine kanonische Identität = eine Canonical-Row", creating a `sortiarius` row would either duplicate the identity (FK split) or require a destructive rename of an existing row. The non-destructive call — adding the missing descriptive-without-the surface variant as alias — is exactly the Pass-14 `Laer → laeran` / `House Taranis → knights_of_taranis` pattern. HH-0256 + HH-0258 strict freq-2 within-batch. |
| `Mount Pharos` | `pharos` | Companion alias to the new `pharos` row — bare `Pharos` is the lore-canonical short form (the Pharos device on Sotha); `Mount Pharos` (the mountain hosting it) is the in-this-wave surface variant from HH-0278. Per dossier §7c "Optional alias `Mount Pharos → pharos` if Phase 2 prefers the bare `pharos` row + Mount-Pharos alias mapping (recommended since both forms surface in the HH arc)". |

### New resolver test cases in `scripts/test-resolver.ts` (8, runbook target ≥ 4)

Appended directly before the `resolveCharacter` block (after the Pass-14 `Laer → laeran` case):

1. `Solar System → sol_system` (alias, Case L1)
2. `Planet of Sorcerers → planet_of_the_sorcerers` (alias, branch-(a) override)
3. `Pharos` (direct, new row)
4. `Mount Pharos → pharos` (alias, companion)
5. `Sicarus` (direct, new row)
6. `Ithraca` (direct, new row)
7. `Northwilds` (direct, new row)
8. `Numinus` (direct, new row)

### Idempotenz

Pre-edit grep for the new ids/surface-form keys returned zero hits in `locations.json` /
`location-aliases.json` (the existing `planet_of_the_sorcerers` row was the only matching prior
state, intentionally re-used; the new alias key `Planet of Sorcerers` did not exist before).
Re-running this phase against the post-edit files is a no-op — no row would be re-added, no alias
would be re-added.

### Deferred / not-promoted (Phase-2 budget-conservative judgments)

Per dossier §7c "weak-curated long-tail" / "Phase-2 judgment — recommendation: leave unresolved":

- `Accazzar-Beta` (HH-0285) — single-novella compliance world, weak cross-arc warrant.
- `Andrioch` (HH-0281) — single-novella Perpetuals-arc world.
- `Bael` (HH-0289) — Salamanders-arc world, single audio drama.
- `Dwell` (HH-0277) — Shattered-Legions audio drama world.
- `Duat` (HH-0287) — Blackshields-trilogy middle locale; medium-promotion candidate per dossier
  but trimmed for budget conservatism this wave (the Blackshields trilogy is character-spine
  promotion-heavy via `endryd_haar` in Phase 3, not locale-promotion-heavy).
- `Ghaslakh` (HH-0288) — single-novella Imperial-Fists Ork-skirmish world.
- `Gyptus` (HH-0252) — single-novella Terran sub-region.
- `Oran` (HH-0276) — Ultramar sub-locale; could be promoted with parent `ultramar` if a future
  wave surfaces it again, but freq-1 single-audio-drama evidence this wave is below the curated
  freq-1 lore-iconic threshold.
- `Pelago` (HH-0260) — single-audio-drama Space Wolves world.
- `Riga Orbital Plate` (HH-0263) — orbital civilian platform from *Garro: Shield of Lies*; no
  cross-arc warrant beyond the single Garro audio drama.
- `Xana-Tisiphone` (HH-0286) — Mechanicum forge-world from *Blackshields: The False War*;
  medium-promotion candidate per dossier but trimmed for budget conservatism (parallel to Duat —
  trilogy locale coverage deferred while the trilogy-protagonist spine carries the Blackshields
  arc identity in Phase 3).

All deferred forms remain `unresolved` per resolver semantics and stay surface-only in the
overrides; future waves with cross-arc re-surfacing can revisit per the cumulative-cross-pass
pattern (parallel to Pass-15's own `Adeptus Administratum` promotion on cumulative Pass-14 +
Pass-15 evidence).

### Cross-Era / dossier §7d items not in scope for Phase 2

- **`Lord Cypher` Cross-Era disambig** — character-axis case, **Phase 3** judgment, not Phase 2.
- **`data_conflict:title->Stratagem` (HH-0266)** — Phase 4a advisory carry-through.
- **`Astagar` cumulative-cross-pass Pass-14 case** — verified absent from §3 surface aggregate
  this wave; Pass-14 already promoted `astagar` (test-resolver.ts:1102), so the carry-over is
  closed and no Phase-2 work is needed.

## Verification

Resolver trias run pre-commit (runbook §10):

| script | result |
| --- | --- |
| `npm run test:resolver` | **464 passed, 0 failed** (8 new Pass-15 location cases included) |
| `npm run test:resolver-data` | **resolver data integrity ok** (no duplicate ids/names, location sectors point at existing sectors or null, alias targets point at canonical ids, coverage smoke slugs exist) |
| `npm run test:resolver-coverage` | exit 0; below-threshold rows are data findings, not failures (totals: factions=2624/2967, locations=1089/1391, characters=1916/2422) |
| `npm run test:apply-override-dry` | **ok** (by reason: out-of-range=0, unknown-work=0) |

`npm run lint` / `npm run typecheck` not required for a Phase-2 JSON-+-test-data change per
runbook §10 (Phase 4a-only requirement when scripts change); none of `src/lib/resolver/index.ts`
or other code paths were modified.

## Write-Scope discipline (runbook §3 / §11)

Diff strictly ⊆ Phase-2 scope listed in `scripts/resolver-pass.config.json` →
`phases[2].scope`:

- `scripts/seed-data/locations.json` — appended 5 new rows.
- `scripts/seed-data/location-aliases.json` — appended 3 new aliases.
- `scripts/seed-data/sectors.json` — **untouched** (no FK requirement triggered).
- `scripts/test-resolver.ts` — appended 8 new test cases in the `resolveLocation` block.
- `sessions/resolver-dossiers/resolver-pass-15-phase-2-report.md` — this report.

One commit, no co-author trailer (per runbook §9).
