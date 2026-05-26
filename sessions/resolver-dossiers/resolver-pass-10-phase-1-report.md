# Resolver-Pass 10 — Phase 1 (Factions) Status

- **Wave:** `ssot-hh-001..002` (HH bootstrap, 20 books HH-0001..HH-0020).
- **Phase:** `phase-1-factions`.
- **Dossier:** [`resolver-pass-10-dossier.md`](./resolver-pass-10-dossier.md) §7a (Cross-Era aliases) + §7c (freq-driven promotion shape).
- **Runbook:** [`../resolver-pass-runbook.md`](../resolver-pass-runbook.md) §3 Phase 1 + §4 (Promotions-/Alias-Disziplin, inkl. Cross-Era-Identitäten).
- **Status:** done. No `## Needs decision` block.

## Done summary

Phase-1 promotion shape executed exactly as the dossier flagged it. The HH-bootstrap wave is dominated by **Cross-Era aliasing** onto already-existing W40K-side canonical rows — no new faction rows were created where a W40K anchor already carries the canonical identity, per runbook §4 ("Eine kanonische Identität = eine Canonical-Row").

### Alias adds — `scripts/seed-data/faction-aliases.json` (+4 rows)

| surface form | target canonical id | type | dossier ref | reason |
| --- | --- | --- | --- | --- |
| `Luna Wolves` | `sons_of_horus` | Cross-Era faction-rename | §7a Case A | Pre-Heresy → Heresy organizational rename (one identity, two era-specific names); rename happens on-page in HH-0002 *False Gods*. freq=2 (HH-0001, HH-0002). Anchor `sons_of_horus` exists at `factions.json:17`. |
| `Mechanicum` | `mechanicus` | Cross-Era pre-reformation name | §7a Case B | Pre-Imperial-reformation form of the Martian tech-priesthood (post-Heresy reformed into Adeptus Mechanicus). freq=4 (HH-0001, HH-0009 *Mechanicum*, HH-0018). Anchor `mechanicus` exists at `factions.json:101`. |
| `Imperial Army` | `astra_militarum` | Cross-Era pre-reformation name | §7a Case C | Pre-Imperial-reformation form of the standing Imperial human-soldiery (post-Heresy → Imperial Guard / Astra Militarum). freq=2 (HH-0001, HH-0007 *Legion*). Anchor `astra_militarum` exists at `factions.json:141`. Existing aliases `Imperial Guard` / `Astra Militarum` prove the grain. |
| `Custodes` | `custodes` | Alias-confirmation (short form) | §7c | Plain "Custodes" surface (freq=4: HH-0012, HH-0014, HH-0017, others) was unresolved; the canonical row name is "Adeptus Custodes" (direct match, freq=2). The short form is the dominant HH-era surface and routes to the same canonical row. No new row. |

### New row adds — `scripts/seed-data/factions.json` (+6 rows)

All six are curated freq=1 lore-iconic HH-specific promotions (runbook §4 Promotion-Schwelle: "freq ≥ 2 strict + eine kuratierte Liste lore-ikonischer freq=1-Promotionen"). Each carries a `specialCases` note in `faction-policy.json`.

| id | name | parent | alignment | tone | dossier ref | basis |
| --- | --- | --- | --- | --- | --- | --- |
| `cabal` | Cabal | `null` | — | `alien` | §7c | Xenos conspiracy from Abnett's *Legion* (HH-0007); Plot-Anchor of the Heresy-Cabal-prophecy arc; needed as primaryFactionId target for `john_grammaticus` in Phase 3. Top-level xenos parent=null analog `tau` / `necrons` / `eldar` / `tyranids` / `orks` (xenos umbrellas typically carry no alignment field). |
| `interex` | Interex | `null` | — | `historical_canon_layer` | §7c | Pre-Imperial human civilization from *Horus Rising* (HH-0001); xenos-tolerant human polity destroyed at Heresy-prelude. Tone `historical_canon_layer` analog `squats` pattern. parent=null + no alignment because Interex are neither Imperial nor Chaos nor strictly Xenos. |
| `laer` | Laer | `null` | — | `alien` | §7c | Slaaneshi-tainted coral-world Xenos race from *Fulgrim* (HH-0005); the Laer-coil corruption seeds the Emperor's Children fall to Slaanesh. Top-level Xenos parent=null. Distinct from the `laeran` Phase-2 location row (race-axis vs world-axis, no cross-axis collision because surface forms differ). |
| `knights_of_taranis` | Knights of Taranis | `imperial_knights` | `imperium` | `imperial` | §7c | Mars-based Imperial Knight House from McNeill's *Mechanicum* (HH-0009). Parity with the existing `house_chimaeros` / `house_draconis` named-House-Tier under `imperial_knights`. |
| `legio_mortis` | Legio Mortis | `adeptus_titanicus` | `chaos` | `engine` | §7c | Traitor Titan Legion (Horus's loyal Titans who fall mid-HH in HH-0009 *Mechanicum*). Parity with `legio_tempestus` / `legio_metalica` / `pallidus_mor` / `imperial_hunters` (Titan-Legion sub-tier under `adeptus_titanicus`). Alignment=chaos for majority-lifespan despite imperial-parent — Authority-Layer-Pragmatik analog `soul_drinkers` (parent=heretic_astartes + alignment=chaos, one row for coexistent phases). |
| `order_of_caliban` | The Order of Caliban | `dark_angels` | `imperium` | `imperial` | §7c | Pre-Imperial Caliban knightly order from *Descent of Angels* (HH-0006) + *Fallen Angels* (HH-0011); Lion El'Jonson's mentor-structure, eventually absorbed into the Dark Angels Legion. Parent=`dark_angels` reflects organizational continuity post-Imperial-Contact. Phase-3 will point `luther` / `sar_daviel` / `zahariel` primaryFactionId at this row; back-trace via single-parent schema lands on `dark_angels`. |

### `faction-policy.json` updates

Added six `specialCases` notes documenting the modeling rationale for each new row (Cross-Era anchor pattern, parent-choice reasoning, Authority-Layer-Pragmatik for `legio_mortis` / `order_of_caliban`). **No new `browseRoots` entries** — runbook §3 Phase 1 explicitly bars new browse-roots without a Maintainer-Decision; the six new rows are all sub-tier or HH-specific xenos and stay out of the index top-level.

### Promotion-discipline notes (runbook §4)

- **Cross-Era aliases on already-stable anchors.** All four alias targets (`sons_of_horus`, `mechanicus`, `astra_militarum`, `custodes`) exist in the pre-Pass-10 baseline (dossier §1: factions baseline 173 rows / 59 aliases). Alias semantics is exact-string direct match → exact-string alias lookup (resolver-stage 2); no fuzzy match, no slug match.
- **No over-broad aliases.** Each Cross-Era alias has (a) concrete wave occurrence (dossier §3 frequencies), (b) lore-eindeutiges target (canonical Black-Library Cross-Era identity per runbook §4 worked-examples), (c) no Cross-Axis-Disambig-Falle (no §4 cross-axis surface-form conflict — dossier §4 is empty).
- **Idempotence per row checked.** Each added row's id is new vs. baseline (`cabal`, `interex`, `laer`, `knights_of_taranis`, `legio_mortis`, `order_of_caliban` — none previously present). Each added alias key is new vs. baseline (no overwrite). The four alias keys (`Luna Wolves`, `Mechanicum`, `Imperial Army`, `Custodes`) were not previously in `faction-aliases.json`.
- **Cross-Era-Identitäten respected (runbook §4 / Brief 100).** No second canonical row was created for `Luna Wolves`, `Mechanicum`, or `Imperial Army` — those are HH-era surface forms of identities already canonicalized in the W40K layer. The Cross-Axis-Disambig exception (true gleichnamigkeit, different identity) was not triggered in this wave.
- **FK-safety for Phase 3.** The post-Phase-1 `factions.json` contains every primaryFactionId target Phase 3 will need for new character rows: every Legion (incl. `sons_of_horus`, `world_eaters`, `thousand_sons`, `emperors_children`, `death_guard`, `iron_warriors`, `alpha_legion`, `night_lords`, `word_bearers`, `space_wolves`, `dark_angels`, `salamanders`, `raven_guard`, `iron_hands`, `ultramarines`, `imperial_fists`) + `custodes` + `mechanicus` + `astra_militarum` + `officio_assassinorum` + `adeptus_astra_telepathica` + `imperial_knights` + `talons_of_the_emperor` + `adeptus_arbites` + the new `cabal` + `order_of_caliban` rows for the Phase-3 dependent characters (John Grammaticus, Luther / Sar Daviel / Zahariel respectively).

## New resolver test cases — `scripts/test-resolver.ts` (10 added, ≥5 required)

All ten added in the "tenth wave" block immediately after the ninth-wave faction tests (just before `console.log("\nresolveLocation")`). Trias-Run vor commit confirms all green.

| # | name | type | what it locks down |
| --- | --- | --- | --- |
| 1 | alias - tenth wave Luna Wolves routes to Sons of Horus | Cross-Era alias | §7a Case A |
| 2 | alias - tenth wave Mechanicum routes to Adeptus Mechanicus | Cross-Era alias | §7a Case B |
| 3 | alias - tenth wave Imperial Army routes to Astra Militarum | Cross-Era alias | §7a Case C |
| 4 | alias - tenth wave Custodes (short form) routes to custodes | alias confirmation | §7c |
| 5 | direct match - tenth wave Cabal | new row | §7c |
| 6 | direct match - tenth wave Interex | new row | §7c |
| 7 | direct match - tenth wave Laer | new row | §7c |
| 8 | direct match - tenth wave Knights of Taranis | new row | §7c |
| 9 | direct match - tenth wave Legio Mortis | new row | §7c |
| 10 | direct match - tenth wave The Order of Caliban | new row | §7c |

## Verification

Resolver-Trias green vor commit (runbook §10):

- `npm run test:resolver` → **297 passed, 0 failed**.
- `npm run test:resolver-data` → all integrity checks ok (faction parents resolve, alias targets resolve, alignment values within enum, no duplicate ids / names).
- `npm run test:resolver-coverage` → totals factions=1903/2240, locations=733/971, characters=1220/1629; exit 0.
- `npm run test:apply-override-dry` → ok; 0 missing FK targets, 0 dangling JSON refs, 0 invalid normalized roles, 0 unresolvable constituents.

## Counts delta (Phase-1 only, vs. pre-Pass-10 baseline)

| file | rows pre | rows post | delta |
| --- | --- | --- | --- |
| `factions.json` | 173 | 179 | +6 (`cabal`, `interex`, `laer`, `knights_of_taranis`, `legio_mortis`, `order_of_caliban`) |
| `faction-aliases.json` | 59 | 63 | +4 (`Luna Wolves`, `Mechanicum`, `Imperial Army`, `Custodes`) |
| `faction-policy.json` `specialCases` | 21 | 27 | +6 (one note per new row) |
| `test-resolver.ts` resolveFaction checks | (ninth-wave-end) | +10 | tenth-wave block |

## Carry-forward into Phase 2 / 3 / 4

- **Phase 2 (Locations)** is independent of Phase-1 row-set and proceeds normally. Note the Cross-Axis awareness: the new `laer` faction row (Slaaneshi xenos race) is distinct from the to-be-promoted `laeran` location row (coral world) — surface forms differ, no resolver-stage collision.
- **Phase 3 (Characters)** reads the freshly-committed post-Phase-1 `factions.json` for FK-safety (runbook §5). Phase-3 primaryFactionId-targets needed beyond the W40K baseline anchors: `cabal` (→ `john_grammaticus`), `order_of_caliban` (→ `luther` / `sar_daviel` / `zahariel`). Both targets are now present.
- **Phase 4a (Integration)** — the new rows + aliases are picked up by `seed-resolver-extensions.ts` (which Phase 4a will extend with the HH wave's new reference rows); no special handling beyond the runbook §3 Phase 4a checklist (domain-aware Trias-Batch-Range append + digest-only apply). The `legio_mortis` `alignment=chaos`-but-`parent=adeptus_titanicus` combination passes the `test-resolver-data-integrity.ts` enum check (verified above) — no Brief-077 grand-alignment-skip concern (legio_mortis is sub-tier under adeptus_titanicus, not under chaos directly).

## Halt-Discipline checklist (driver post-phase verification)

- One commit on this phase: ✅ (this report + the four edited files in a single commit).
- `git diff --name-only HEAD~..HEAD` ⊆ Phase-1 Write-Scope: ✅ (only `scripts/seed-data/factions.json`, `scripts/seed-data/faction-aliases.json`, `scripts/seed-data/faction-policy.json`, `scripts/test-resolver.ts`, `sessions/resolver-dossiers/resolver-pass-10-phase-1-report.md`).
- JSON files syntactically valid: ✅ (parsed-and-validated pre-commit).
- No `## Needs decision` block: phase is `done`.
- No Co-Author trailer: commit message is imperative-only.
