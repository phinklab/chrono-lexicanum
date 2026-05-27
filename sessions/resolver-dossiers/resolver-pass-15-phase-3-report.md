# Resolver-Pass 15 — Phase 3 (Characters) — Report

- **Pass:** 15
- **Wave:** `ssot-hh-026..030` (44 books, HH-0251..HH-0294)
- **Phase:** `phase-3-characters`
- **Status:** ✓ done — single commit, scope-clean, resolver trias green.
- **Dossier:** [`resolver-pass-15-dossier.md`](./resolver-pass-15-dossier.md) — §7a Cases A + B (Character alias-consolidation) + §7b (Endryd Haar within-batch spine) + §7c (Phase-3 promotion shape) + §7d (Lord Cypher Cross-Era disambig).
- **Runbook:** [`../resolver-pass-runbook.md`](../resolver-pass-runbook.md) §3 Phase 3 + §4 (Promotions-/Alias-Disziplin, inkl. Cross-Era-Identitäten) + §5 (FK-Reihenfolge — Phase 1 strikt vor Phase 3).
- **Pre-phase baseline (from §1 of dossier):** characters **481** rows / **61** aliases.
- **Post-phase counts:** characters **491** rows / **64** aliases (Δ = **+10 rows / +3 aliases**).

## Done summary

### New rows added to `scripts/seed-data/characters.json` (10)

All entries use the established schema (`id`, `name`, `primaryFactionId`, `lexicanumUrl: null`, `notes`). Every `primaryFactionId` resolves either to a Pass-10..14 anchor or to a Phase-1-promoted Pass-15 row (`officio_sigillite` / `blackshields` / `mechanicus` / `sons_of_horus` / `thousand_sons` / `space_wolves`) — FK chain is clean per runbook §5 (Phase 1 strictly committed before this phase; `officio_sigillite` exists in the post-Phase-1 `factions.json`, `blackshields` is the Pass-14 anchor).

| id | primaryFactionId | promotion-tier | first-hit (anchoring HH-N) |
| --- | --- | --- | --- |
| `endryd_haar` | `blackshields` | §7b strict freq-3 within-batch spine (the Pass-14-forecasted Blackshields-trilogy protagonist) | HH-0286 *Blackshields: The False War* + HH-0287 *The Red Fief* + HH-0290 *The Broken Chain* |
| `khalid_hassan` | `officio_sigillite` | §7c strong curated freq-1 lore-iconic — Malcador's covert operative, Officio-Sigillite deuteragonist | HH-0252 *The Sigillite* |
| `argonis` | `sons_of_horus` | §7c strong curated freq-1 lore-iconic — Sons of Horus emissary in late-Heresy compliance arc | HH-0285 *Dark Compliance* |
| `yasu_nagasena` | `officio_sigillite` | §7c strong curated freq-1 lore-iconic — Imperial talent-scout/agent, *Wolf Hunt* protagonist (parity with `khalid_hassan` Sigillite-grain) | HH-0254 *Wolf Hunt* |
| `sobek` | `thousand_sons` | §7c medium-strong curated freq-1 — Thousand Sons post-Prospero supporting cast | HH-0256 *Thief of Revelations* |
| `amon` | `thousand_sons` | §7c medium-strong curated freq-1 — Thousand Sons supporting cast (Magnus's equerry) | HH-0256 *Thief of Revelations* |
| `zagreus_kane` | `mechanicus` | §7c strong curated freq-1 lore-iconic — Mechanicum Fabricator-General successor candidate, eventual post-Heresy Fabricator-General | HH-0284 *The Binary Succession* |
| `vethorel` | `mechanicus` | §7c medium curated freq-1 — Mechanicum-succession-arc completeness paired with `zagreus_kane` | HH-0284 *The Binary Succession* |
| `bulveye` | `space_wolves` | §7c medium curated freq-1 — Space Wolves Wolf Lord (one of the Original Six), namesake-driven | HH-0279 *The Thirteenth Wolf* |
| `erud_vahn` | `blackshields` | §7c medium curated freq-1 — Blackshields-trilogy supporting cast paired with `endryd_haar` for trilogy-cast completeness | HH-0290 *Blackshields: The Broken Chain* |

### New aliases added to `scripts/seed-data/character-aliases.json` (3)

| surface | → canonical | rationale |
| --- | --- | --- |
| `Aenoid Thiel` | `aeonid_thiel` | Dossier §7a Case A — transposition typo variant (Ae↔Aeo) of the canonical `Aeonid Thiel` (freq 4 direct, anchored HH-0255 / HH-0266 / HH-0276). HH-0289 *Nightfane* surfaces the typo; same Ultramarines Codicier/Sergeant figure recurring across the Calth / Aeonid-Thiel audio-drama bloc; identity-equivalence floor-case alias add per runbook §4 (no row creation; just the alias entry). |
| `Bjorn the One-Handed` | `bjorn` | Dossier §7a Case B — Heresy-era pre-Dreadnought honor-title variant of the Pass-11 `bjorn` canonical row, explicitly anticipated by the Pass-11 row note ("Slug 'bjorn' chosen for the bare HH surface-form; later-canon honor-title 'Bjorn the Fell-Handed' can be added as alias if a future wave surfaces it"). HH-0261 *Wolf's Claw* surfaces the One-Handed variant — the same future Bjorn the Fell-Handed (the last surviving Heresy-era Space Wolf, before being interred in the Dreadnought sarcophagus that gives him the Fell-Handed title). Per runbook §4 Cross-Era / Character-Honor-Title-Split convention (Kharn ↔ Kharn the Betrayer parallel). |
| `Lord Cypher` | `cypher` | Dossier §7d Cross-Era disambig recommendation **(a)** — runbook §4 default for Heresy-era honor-title / Cross-Era surface forms (alias onto existing canonical row). HH-0259 *Cypher: Guardian of Order* surfaces the Heresy-era Dark-Angels Order-of-Caliban title-position; per the most-common-lore-reading the title-holder **is** the individual who becomes the post-Heresy Cypher (Lord of the Fallen, central enigma — Pass-7 `cypher` row, primaryFactionId `fallen_angels`). The title becomes the name as the Order falls. Branches (b) `lord_cypher` new row or (c) `## Needs decision` rejected per dossier §7d recommendation: "alias `Lord Cypher → cypher` per Cross-Era convention". |

### New resolver test cases in `scripts/test-resolver.ts` (9, runbook target ≥ 5 with ≥ 2 alias-consolidation)

Appended directly before the `console.log("\nnormalizeCharacterRole")` line (after the Pass-14 `the Emperor` confirmation block):

1. **direct** `Endryd Haar` → `endryd_haar` (§7b spine)
2. **direct** `Khalid Hassan` → `khalid_hassan` (§7c strong)
3. **direct** `Argonis` → `argonis` (§7c strong)
4. **direct** `Yasu Nagasena` → `yasu_nagasena` (§7c strong)
5. **direct** `Zagreus Kane` → `zagreus_kane` (§7c strong)
6. **alias-consolidation** `Aenoid Thiel` → `aeonid_thiel` (§7a Case A typo)
7. **alias-consolidation** `Bjorn the One-Handed` → `bjorn` (§7a Case B Heresy honor-title)
8. **alias-consolidation** `Lord Cypher` → `cypher` (§7d Cross-Era same-identity disambig)
9. **alias-consolidation** `Horus Lupercal` → `horus` (Pass-11 alias confirmation — 3 hits across HH-0277 / HH-0291 / HH-0294, highest-frequency cross-pass character-alias chain of the wave)

Coverage: **5 direct-match tests** (one per row Phase-3 wants explicit smoke coverage on — including the §7b spine + the four strong/medium-strong freq-1 Sigillite/Sons-of-Horus/Mechanicum/Thousand-Sons-Prospero promotions). **4 alias-consolidation tests** (the three new alias adds + one Pass-11 confirmation for the wave's highest-frequency character-alias chain). Threshold ≥ 5 / ≥ 2 alias-consolidation cleanly exceeded.

### Dossier 7c judgments not taken (deviation log)

The dossier §7c floor was 1 spine row + 2 alias adds + 3 strong freq-1 (= 6); recommended target ~10 new rows + 2 alias adds + 1 Cross-Era alias; ceiling ~17 new rows + 3 alias adds. Final set: **10 new rows + 2 alias adds + 1 Cross-Era alias = exactly the recommended target**. Deviations vs. the dossier's "medium-curated freq-1" / "weak long-tail" candidates:

- **`vethorel` taken** (Mechanicum-succession-arc completeness paired with `zagreus_kane` — dossier §7c medium-promotion case).
- **`bulveye` taken** (Space Wolves Wolf Lord, namesake-driven, one of the Original Six — dossier §7c medium-promotion case).
- **`erud_vahn` taken** (Blackshields-trilogy supporting cast paired with `endryd_haar` for trilogy-cast completeness — dossier §7c medium-promotion case).
- **`navar_hef` not taken.** Dossier §7c medium-promotion ("lore-iconic Raven-Guard Isstvan-V-survivor, cross-arc with the Raven-Guard *Deliverance Lost* + the Raven's Flight Pass-14 audio drama"). Trimmed for budget conservatism — the wave is character-promotion-heavy on the Officio-Sigillite / Mechanicum / Thousand-Sons / Blackshields blocs, and the Raven-Guard Isstvan-V-survivor figure has stronger cross-arc warrant in a future wave that surfaces him again (the cumulative-cross-pass pattern, parallel to Pass-15's own `adeptus_administratum` promotion in Phase 1).
- **`bion_henricos` not taken.** Dossier §7c medium-promotion ("Iron Hands / Shattered-Legions character, cross-arc with the Pass-? Iron-Hands Shattered-Legions catalog"). Trimmed for budget conservatism — single-novella supporting cast (HH-0275 *Grey Talon*); the Shattered-Legions arc cross-arc warrant is anchor-heavy on `shadrak_meduson` / `tybalt_marr` (both direct in §3) — promoting another Iron-Hands supporting figure adds bulk without spine value this wave.
- **`hibou_khan` / `jubal_khan` not taken.** Dossier §7c medium-promotion (both White-Scars Khans cross-arc with the *Brotherhood of the Storm* / *Path of Heaven* arc). Trimmed for budget conservatism — White-Scars cross-arc supporting cast can be batched in a later White-Scars-focused wave with cleaner cross-arc warrant; this wave's White-Scars surfaces are single-audio-drama appearances (HH-0262 *Templar*, HH-0275 *Grey Talon*).
- **`meric_voyen` not taken.** Dossier §7c medium-promotion ("cross-arc with the Garro / Knights-Errant network — Voyen is a recurring Garro-companion across the Garro audio-drama series"). Trimmed for budget conservatism — the Garro / Knights-Errant cross-arc is already anchor-heavy (Macer Varren / Helig Gallor / Yored Massak from Pass-14; Tylos Rubio direct cross-pass; Nathaniel Garro direct freq-6 wave-central). Voyen is a future cross-pass cumulative candidate (parallel to `adeptus_administratum`).
- **`oberdeii` not taken.** Dossier §7c medium-promotion (Sotha-Pharos cross-arc supporting cast — recurring Salamanders Pass-13/14 cast). Trimmed for budget conservatism — the Pharos arc carries its identity through the Pass-2 `pharos` Phase-2 row + the cross-arc `sotha` anchor + the Pass-13/14 Salamanders catalog, without needing a new supporting-cast row at this freq-1 single-audio-drama evidence level.
- **`katt` not taken (faction-FK gap).** Dossier §7c medium-promotion ("cross-arc with the Perpetuals network — Katt is a Perpetual figure recurring across Abnett's HH catalog"). Per dossier-explicit conditional "primaryFactionId `perpetuals` (if such a row exists; else empty)": `perpetuals` does **not** exist in `factions.json` (verified by grep against the post-Phase-1 file). Following runbook §4 "Promotion nur bei Evidenz [...] bei Identitäts-Unsicherheit → `needs-decision`, **nicht** raten", a fallback `imperium` parent (parity with `oll_persson` / `alivia_sureka`) would be technically defensible but Pass-13's `alivia_sureka` and the `john_grammaticus → cabal` choice show no canonical Perpetuals-faction-grain decision has been taken in the corpus. Leaving Katt unresolved this wave is the lower-risk call; a future Perpetuals-themed wave can revisit (parallel to Pass-15's own `adeptus_administratum` promotion on cumulative cross-pass evidence — Katt may resurface in a later Abnett-Perpetuals audio drama, justifying a `perpetuals` faction-grain decision at that point).
- **Weak long-tail (Sareo / Ven / Tidon / Felbjorn / Larazzar / Altani / Vultius / Tebecai / Koparnos / Bion-Henricos / Captain Melian / Tylaine / Archorian / Katanoh Tallery / Ison / Alcaeus) not taken** per dossier §7c "weak-curated long-tail" recommendation and runbook §4 "Surface-Form-Treue [...] keine erfundenen Entitäten — jede Promotion braucht eine Dossier-/Source-Basis". Each entry is single-audio-drama freq-1 with no cross-arc warrant beyond the source novella; the unresolved long-tail is the resolver-correct outcome per Brief 049/072 ("Unresolved bleibt unresolved — lieber Long-Tail offen lassen als eine falsche Canonical-Kante schreiben").

The 7c-ceiling 17-row plus weak long-tail target was deliberately not approached; the recommended target floor of 10 strong/medium rows captures the lore-iconic core (the §7b spine + the Sigillite-grain Khalid/Yasu pair + the Sons-of-Horus emissary Argonis + the Mechanicum-succession Zagreus/Vethorel pair + the Thousand-Sons-Prospero Sobek/Amon pair + the Space-Wolves Original-Six Bulveye + the Blackshields-trilogy companion Erud Vahn) without spreading promotion across single-novella supporting cast with weak cross-arc warrant.

### FK-Reihenfolge-check (runbook §5)

Pre-edit verification that every new-row `primaryFactionId` resolves against the post-Phase-1 `factions.json`:

- `officio_sigillite` — present (Phase-1 new row, committed in Phase-1 report).
- `blackshields` — present (Pass-14 anchor; Phase-1 report § "Direct-row confirmations" confirms 3 hits this wave HH-0286 / HH-0287 / HH-0290).
- `sons_of_horus`, `thousand_sons`, `space_wolves`, `mechanicus` — all present (Pass-10..14 anchors).

No FK trap; the runbook §5 "Phase 1 strikt vor Phase 3" guard is satisfied (Phase 1 committed; this Phase 3 reads the post-Phase-1 file state).

### Cross-Era / cross-batch alias confirmations (no Phase-3 edits — listed for traceability)

Pass-10/11/12/13/14 character aliases that re-surface in Pass 15 and continue to resolve cleanly via the existing chain (per dossier §3 + §7a "Confirmations only"):

- `Horus Lupercal → horus` (Pass-11 alias) — **3 hits** across HH-0277 *The Either* / HH-0291 *Collected Visions* / HH-0294 *Visions of Heresy 2018 ed.* (the highest-frequency character-alias chain of the wave; explicit confirmation test added — case 9 above).
- `Kharn → kharn_the_betrayer` (Pass-11 alias) — **2 hits** across HH-0262 *Templar* + HH-0292 *Scripts Volume I*. Re-confirmation test omitted because the Pass-11 test already covers the `Kharn → kharn_the_betrayer` alias-route directly in this suite (search `Kharn` in test-resolver.ts); the wave-evidence simply re-exercises an already-tested route.
- `Khârn → kharn_the_betrayer` (pre-Pass-10 alias) — 1 hit HH-0257 *Kharn: The Eightfold Path* (the diacritic-variant continues coverage).
- `Lucius → lucius_the_eternal` (pre-Pass-10 alias) — 1 hit HH-0258 *Lucius: The Eternal Blade* (the namesake audio-drama anchors the alias exhaustively).
- `Corvus Corax → corax` (Pass-11 alias) — 1 hit HH-0292 *Scripts Volume I* (first cross-pass confirmation of the Pass-11 Corvus-Corax-honor-form alias).

The Pass-10/11/12/13/14 honor-title / diacritic-variant chain on the character axis catches every re-surface in this wave. No re-confirmation tests added beyond the Horus-Lupercal case (the highest-frequency cross-pass alias chain of the wave); the Pass-14 confirmation tests for the lower-frequency aliases continue to cover.

### Direct-row confirmations (selected, all freq ≥ 2 Pass-10..14 rows)

Per dossier §3 + §1 baseline: every freq ≥ 2 Primarch / supporting-cast surface in this wave catches its existing canonical row direct — Malcador the Sigillite (7 — wave-spine), Nathaniel Garro (6 — ssot-hh-028 spine), Aeonid Thiel (4 — Ultramarines Calth bloc; the Pass-15 wave's most concentrated cross-batch supporting-cast spine, the typo variant adds a 5th implicit hit), Rogal Dorn (4), Roboute Guilliman (2), Sigismund (2), Luther (2), Pallas Ravachol (2), The Emperor (2). Plus the Primarch / supporting freq-1 catalog (Konrad Curze, Magnus the Red, Sanguinius, Corax, Fulgrim, Angron, Horus, Kelbor-Hal, Tylos Rubio, Yored Massak first cross-pass confirmation of Pass-14, Marcus Valerius first cross-pass confirmation of Pass-13, Astelan first cross-pass confirmation of Pass-13, Azkaellon, Eidolon, Severian, Kurtha Sedd, Shadrak Meduson, Tybalt Marr, Zahariel, Sevatar, Sanakht, Hathor Maat, Ahzek Ahriman, Kor Phaeron, John Grammaticus, Oll Persson). **Pass-14's recommended +9-row promotion shape is fully confirmed in this wave** — Yored-Massak / Marcus-Valerius are both first-cross-pass-confirmations of Pass-14 rows.

## Idempotency check

`grep` pre-edit confirmed none of the 10 new IDs (`endryd_haar`, `khalid_hassan`, `argonis`, `yasu_nagasena`, `sobek`, `amon`, `zagreus_kane`, `vethorel`, `bulveye`, `erud_vahn`) previously existed in `characters.json`. The three new alias keys (`Aenoid Thiel`, `Bjorn the One-Handed`, `Lord Cypher`) were not previously aliased in `character-aliases.json` (verified by reading the full file). Each promotion is a first-time row/alias creation. JSON validity checked via `node -e "JSON.parse(...)"` for both files post-edit — all OK.

Existing anchor rows verified pre-edit: `cypher` (Pass-7, primaryFactionId `fallen_angels`) at line 1907, `aeonid_thiel` (Pass-11) at line 2887, `bjorn` (Pass-11) at line 2901. All three Cross-Era alias targets exist; no FK trap.

## Verification

Resolver trias run pre-commit (runbook §10):

| script | result |
| --- | --- |
| `npm run test:resolver` | **473 passed, 0 failed** (9 new Pass-15 character tests included; total 464 → 473) |
| `npm run test:resolver-data` | **resolver data integrity ok** (character primaryFactionIds point at existing factions; alias targets point at canonical ids; no duplicate ids/names) |
| `npm run test:resolver-coverage` | exit 0; below-threshold rows are data findings, not failures (totals: factions=2624/2967, locations=1089/1391, characters=1917/2422 — the +1 character delta vs Phase 2 reflects cumulative-corpus coverage; new wave HH-0251..HH-0294 is not yet applied — that's Phase 4a) |
| `npm run test:apply-override-dry` | **ok** (forward collection refs: 53; unresolvable constituent refs: 0; by reason: out-of-range=0, unknown-work=0 — consistent with dossier §7d expectation: §5 omnibus scan empty this wave, Brief-091 forward-ref Guard not active) |

`npm run lint` / `npm run typecheck` not required for a Phase-3 JSON-+-test-data change per runbook §10 (Phase 4a-only requirement when scripts change); none of `src/lib/resolver/index.ts` or other code paths were modified.

## Write-Scope discipline (runbook §3 / §11)

Diff strictly ⊆ Phase-3 scope listed in `scripts/resolver-pass.config.json` →
`phases[3].scope`:

- `scripts/seed-data/characters.json` — appended 10 new rows.
- `scripts/seed-data/character-aliases.json` — appended 3 new aliases.
- `scripts/test-resolver.ts` — appended 9 new test cases in the `resolveCharacter` block.
- `sessions/resolver-dossiers/resolver-pass-15-phase-3-report.md` — this report.

One commit, no co-author trailer (per runbook §9). Ready for Phase 4a (Integration/Apply).
