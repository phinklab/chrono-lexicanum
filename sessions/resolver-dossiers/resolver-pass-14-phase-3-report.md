# Resolver-Pass 14 — Phase 3 (Characters) Report

> **Wave:** `ssot-hh-021..025` (50 books, HH-0201..HH-0250). **Phase:** 3 (Characters).
> **Status:** done. Operative spec: [`sessions/resolver-pass-runbook.md`](../resolver-pass-runbook.md)
> §3 Phase 3 + §4 (Promotions-/Alias-Disziplin, Cross-Era-Identitäten) + §5 (FK-Reihenfolge —
> primaryFactionId neuer Characters zeigt auf das Phase-1-Faction-Set). Dossier:
> [`resolver-pass-14-dossier.md`](./resolver-pass-14-dossier.md).

## Done summary

Two strict-freq cross-batch spine rows (7b) + five strong-curated freq-1 lore-iconic rows (7c)
promoted + one alias add (7a Case A — `the Emperor` lowercase-article variant onto the Pass-10
`the_emperor` row). Net **+7 rows / +1 alias**. Trias green.

### Promotion set (7 new rows)

| canonical id | name | primaryFactionId | evidence (HH-N + dossier 7b/7c) |
| --- | --- | --- | --- |
| `macer_varren` | Macer Varren | `knights_errant` | **7b strict freq-3 cross-batch spine — strongest spine case of the wave.** Knights-Errant operative, ex-World-Eaters survivor of Isstvan III; HH-0228 *Eater of Dreams* (Grey-Knights redemption arc with Fel Zharost on Albia), HH-0244 *Garro: Legion of One* (Isstvan III rescue), HH-0248 *Garro: Sword of Truth* (Sol System investigation). Three independent batches (ssot-hh-023 / ssot-hh-025 / ssot-hh-025). primaryFactionId `knights_errant` (Pass-11 canonical anchor). |
| `helig_gallor` | Helig Gallor | `knights_errant` | **7b strict freq-2 cross-batch spine.** Knights-Errant agent paired with Nathaniel Garro in HH-0205 *Ghosts Speak Not & Patience* and with Amendera Kendel vs Alpha Legion in Jovian shipyards in HH-0226 *The Serpent's Dance*. Strict freq-2 across two independent batches (ssot-hh-021 / ssot-hh-023). primaryFactionId `knights_errant`. |
| `hydragyrum` | Hydragyrum | `ordo_sinister` | **7c strong freq=1 lore-iconic — Ordo Sinister namesake-audio-drama protagonist.** Female pariah-princeps protagonist defending the Imperial Webway; HH-0215 *Ordo Sinister* (John French). primaryFactionId `ordo_sinister` (the new Phase-1 row — **FK dependency on Phase 1**, runbook §5). |
| `sibel_niasta` | Sibel Niasta | `adeptus_astra_telepathica` | **7c/7d strong freq=1 lore-iconic — anthology-cascade strict freq-2 promoted on co-protagonist warrant.** Astropath co-protagonist of the Malcador two-hander audio drama HH-0235 *Malcador: First Lord of the Imperium* (L.J. Goulding); HH-0237 *The Lords of Terra* anthology aggregates HH-0235 (cascade, not strict independent). Co-protagonist carries half the script weight (loop-log HH-0235); the *Malcador: First Lord* audio is among the most-anchored Malcador works in the Heresy series. primaryFactionId `adeptus_astra_telepathica` (direct §3 — Niasta's astropath corps). |
| `crysos_morturg` | Crysos Morturg | `blackshields` | **7c strong freq=1 lore-iconic — first-named Blackshield POV, future-proof for the Endryd-Haar Blackshields sub-arc at HH-0286+.** Blackshield protagonist vs Khorak Death-Guard-renegade; HH-0208 *Blackshield* (Chris Wraight). primaryFactionId `blackshields` (the new Phase-1 row — **FK dependency on Phase 1**, runbook §5). |
| `yored_massak` | Yored Massak | `knights_errant` | **7c strong freq=1 lore-iconic — Knights-Errant Imperial-Fists Librarian recruited by Garro on the Phalanx.** HH-0247 *Burden of Duty* (James Swallow — Garro on the Phalanx recruiting librarians). Cross-arc with the Garro / Knights-Errant network and a future cross-pass confirmation HH-0272 *Garro: Burden of Duty* reissue. primaryFactionId `knights_errant`. |
| `torquill_eliphas` | Torquill Eliphas | `word_bearers` | **7c strong freq=1 lore-iconic — Word Bearers / Ark of Testimony Templum Daemonarchia constructor on Kronus.** HH-0207 *Inheritor* (Gav Thorpe). Cross-arc with the Dawn of War (game) crossover and the Word-Bearers Shadow-Crusade arc. primaryFactionId `word_bearers`. |

### Alias add (1 new — 7a Case A)

| surface form | target canonical id | rationale |
| --- | --- | --- |
| `the Emperor` | `the_emperor` | **7a Case A — bare lowercase-article variant** of the Pass-10 `the_emperor` canonical row. Surface freq 2 in `ssot-hh-023` (HH-0222 *Two Metaphysical Blades* / HH-0225 *Lantern's Light*, both within-batch). Pass-13 Case E added `The Emperor of Mankind → the_emperor` (capitalized-with-extension variant); the resolver is case-sensitive (Brief 049/072), so the lowercase-article form `the Emperor` needs its own alias entry. Same person, same row. Per runbook §4 ("eine kanonische Identität = eine Canonical-Row; Era-/Form-spezifische Surface-Forms wandern in `*-aliases.json`"), this is an alias add — not a row edit, not row creation. |

### Dossier 7c judgments not taken (deviation log)

Dossier 7c recommended target: ~9 new rows + 1 alias (floor: 2 spines + 3 strongest freq-1 +
1 alias = 5 + 1; ceiling: ~15 + 1). Final set: **7 new rows + 1 alias** — the recommended
target's strong cut: **7b (2 spines: `macer_varren` + `helig_gallor`) + 7c strong (5 rows:
`hydragyrum` + `sibel_niasta` + `crysos_morturg` + `yored_massak` + `torquill_eliphas`) + 1
alias add**. Deviations from the dossier full enumeration:

- **`gendor_skraivok` → left unresolved** (dossier 7c medium-curated, "lore-anchored Night-Lords
  sub-arc figure"). Reason: the lore-warrant beyond HH-0212 *The Painted Count* (single-novella
  Night-Lords-supporting-cast namesake) is conditional on the future post-Heresy Night-Lords arc
  + the Painted-Count daemon-weapon thread — a future-pass first-cross-arc-confirmation surface
  is the right time to promote, not this pass. Budget conservatism, no FK dependency. (Future
  passes may revisit.)
- **`lycus` / `jorin_bloodhowl` / `gunnar_thorolfsson` / `ammon` / `tarasha_euten` /
  `captain_shang`** → left unresolved (dossier 7c medium-curated freq-1 long tail; Phase-3
  judgment per dossier). All single-novella POVs without strong cross-arc warrant in the
  current wave; advisory carry-through (resolver returns null, apply skips silently per Brief
  084 pattern, no apply-side failure).
- **`iacton_cruze` ↔ `iacton_qruze` (7d disambig)** → left unresolved + flagged. HH-0246 *Grey
  Angel* surfaces `Iacton Cruze` (note: "Cruze", not "Qruze") as a Dark-Angels figure tested by
  Loken on Caliban. The existing Pass-? `iacton_qruze` row is the Sons-of-Horus "Half-heard"
  veteran. Same-surface-family different-identity case per dossier 7d. Phase 3 does **not** read
  override files (runbook §1), so the Cruze-vs-Qruze identity question (typo / variant /
  distinct character) rests on source-coverage re-verification a future pass can do. **Not a
  hard block per dossier 7d** — flag for future-pass clarification. No alias / row edit this
  phase.
- **Weak-curated freq-1 long-tail rows left unresolved** per dossier 7c judgment:
  `aveth_vairon` (HH-0224 *Abyssal* civilian POV), `hakeem` (HH-0248 *Garro: Sword of Truth*
  supporting cast), `ahrem_gallikus` (HH-0218 *Immortal Duty* Iron-Hands POV),
  `arcatus_vindix_centurio` / `balsar_kurthuri` / `noriz` (HH-0211 *The Grey Raven* supporting
  cast), `balthus_voltemand` (HH-0216 *The Ember Wolves* Titan-duel supporting cast), `nicanor`
  (HH-0210 *Into Exile* Imperial Fists officer), `raf_maven` (HH-0227 *The Lightning Hall*
  House-Taranis Knight scion POV), `the_exalted` (HH-0221 *Massacre* generic Night-Lords epithet
  — not a personal name), `borealis_thoon` (HH-0215 *Ordo Sinister* supporting cast), `khorak`
  (HH-0208 *Blackshield* antagonist), `gabriel_santar` (HH-0203 *The Phoenician* vantage
  character), `nivalus` (HH-0236 / HH-0237 anthology-cascade iterator supporting cast — per
  dossier 7d "leave unresolved for budget conservatism; the Sibel-Niasta promotion is the
  priority anthology-cascade case").

### Cross-Era / cross-batch alias confirmations (no Phase-3 edits — listed for traceability)

Pass-10/11/12/13 character aliases that re-surface in Pass 14 and continue to resolve cleanly
via the existing chain (per dossier 7a "Confirmations only"):

- `Horus Lupercal → horus` (Pass-11 alias) — 2 hits (HH-0231 omnibus / HH-0249 *Warmaster*).
- `Lorgar Aurelian → lorgar` (Pass-11 alias) — 2 hits (HH-0231 omnibus / HH-0239 *The Revelation
  of the Word*).
- `Branne → branne_nev` (Pass-13 Case-D-companion alias) — 1 hit (HH-0243 *Raven's Flight* —
  the **namesake debut** for the Pass-13 alias).
- `Calas Typhon → typhus` (pre-Pass-10 alias) — 1 hit (HH-0213 *Exocytosis*).
- `Lucius → lucius_the_eternal` (pre-Pass-10 alias) — 1 hit (HH-0233 *The Last Phoenix* omnibus).
- `Maloghurst → maloghurst_the_twisted` (Pass-13 Case-B alias) — 1 hit (HH-0231 omnibus — **first
  cross-pass confirmation** of the Pass-13 alias).
- `Typhon → typhus` (pre-Pass-10 alias) — 1 hit (HH-0201 *By the Lion's Command*).
- `The Emperor of Mankind → the_emperor` (Pass-13 Case-E alias) — confirmation paired with the
  new Pass-14 Case-A `the Emperor` lowercase-article variant on the same canonical row.

The Cross-Era / honor-title-split alias chain on the character axis catches every re-surface in
this wave; only the **Case-A `the Emperor` lowercase-article variant** required a new alias add.

## Idempotency check

`grep` confirmed none of `macer_varren`, `helig_gallor`, `hydragyrum`, `sibel_niasta`,
`crysos_morturg`, `yored_massak`, `torquill_eliphas` previously existed in `characters.json`;
the alias key `the Emperor` (lowercase article) was not previously in `character-aliases.json`
(the existing `The Emperor of Mankind` and `Emperor of Mankind` entries cover the capitalized /
extended forms, not the bare lowercase-article form — resolver is case-sensitive per Brief
049/072). Each promotion is a first-time row/alias creation.

## FK validation (runbook §5)

Each new character's `primaryFactionId` resolves to a canonical faction row that exists in
`factions.json` after Phase 1's commit:

| character | primaryFactionId | row source |
| --- | --- | --- |
| `macer_varren` | `knights_errant` | Pass-11 canonical row (long-established Knights-Errant anchor) |
| `helig_gallor` | `knights_errant` | Pass-11 canonical row |
| `hydragyrum` | `ordo_sinister` | **Phase-1 new row** (Resolver-Pass 14 Phase 1, factions.json) |
| `sibel_niasta` | `adeptus_astra_telepathica` | Pre-existing canonical row |
| `crysos_morturg` | `blackshields` | **Phase-1 new row** (Resolver-Pass 14 Phase 1, factions.json) |
| `yored_massak` | `knights_errant` | Pass-11 canonical row |
| `torquill_eliphas` | `word_bearers` | Pre-existing canonical row |

Two new rows depend on Phase-1 new rows (`hydragyrum → ordo_sinister`, `crysos_morturg →
blackshields`) — runbook §5 strict-order requirement holds (Phase 1 committed before Phase 3,
verified via `git log --oneline` showing `560cfd3 Resolver-Pass 14 Phase 1 (Factions)` before
the in-progress Phase-3 commit). The Phase-2 commit (`c9734aa`) is between Phase 1 and Phase 3
on the branch but does not factor into the character-axis FK chain (locations have no FK
dependency from characters per runbook §5 and Phase-2 report's "Forward-look to Phase 3").

`test:resolver-data` (`scripts/test-resolver-data-integrity.ts`) verifies the chain
mechanically: `ok - character primaryFactionIds point at existing factions or null`.

## Resolver test cases added (9 new — runbook §3 Phase 3 threshold: ≥5, davon ≥2 Alias-Konsolidierung)

In `scripts/test-resolver.ts` (appended at the end of the `resolveCharacter` section, just
before `console.log("\nnormalizeCharacterRole")`):

**Direct match (7):**

1. `direct match - Resolver-Pass 14 Macer Varren` → `macer_varren` (7b strict freq-3 cross-batch
   spine).
2. `direct match - Resolver-Pass 14 Helig Gallor` → `helig_gallor` (7b strict freq-2 cross-batch
   spine).
3. `direct match - Resolver-Pass 14 Hydragyrum` → `hydragyrum` (7c strong freq=1 + new Phase-1
   FK `ordo_sinister`).
4. `direct match - Resolver-Pass 14 Sibel Niasta` → `sibel_niasta` (7c/7d strong freq=1
   anthology-cascade promoted on co-protagonist warrant).
5. `direct match - Resolver-Pass 14 Crysos Morturg` → `crysos_morturg` (7c strong freq=1 + new
   Phase-1 FK `blackshields`).
6. `direct match - Resolver-Pass 14 Yored Massak` → `yored_massak` (7c strong freq=1).
7. `direct match - Resolver-Pass 14 Torquill Eliphas` → `torquill_eliphas` (7c strong freq=1).

**Alias-consolidation (2 — runbook ≥2 requirement met):**

8. `alias-consolidation - Resolver-Pass 14 'the Emperor' lowercase-article variant routes to
   the_emperor` (the new 7a Case-A alias — bare lowercase-article surface form HH-0222 +
   HH-0225; same canonical identity per runbook §4).
9. `alias-consolidation - Resolver-Pass 14 confirmation 'The Emperor of Mankind' capitalized
   variant still routes to the_emperor` (Pass-13 Case-E alias holds; paired with the new Pass-14
   `the Emperor` lowercase-article variant on the same canonical row — both surface forms
   resolve to the same Pass-10 canonical row).

## Verification

Resolver trias (runbook §10):

- `npm run test:resolver` → **449 passed, 0 failed** (+9 new Pass-14 character test-cases over
  the post-Phase-2 baseline of 440).
- `npm run test:resolver-data` → all integrity checks ok (`ok - character primaryFactionIds
  point at existing factions or null` validates the new rows' FK chain to Phase-1
  `ordo_sinister` + `blackshields`).
- `npm run test:resolver-coverage` → exit 0; smoke totals factions=2512/2855, locations=1033/1328,
  characters=**1817**/2299 (characters up by 1 from Phase-2's 1816 — the new character surface
  forms catch additional coverage on the smoke-slug list; locations identical to Phase 2, factions
  identical to Phase 1/2). Below-threshold rows are data findings, not failures — unchanged
  trajectory.
- `npm run test:apply-override-dry` → exit 0 (`[apply-override-dry] ok`). The dry-run reports
  `forward collection refs: 50` / `unresolvable constituent refs: 3` / `by reason:
  out-of-range=3, unknown-work=0`. The 3 out-of-range refs are the new HH-0231/HH-0232/HH-0233
  omnibi pointing at HH-0001..HH-0044 constituents that **will be in range** once Phase 4a
  expands the trias `batchRange` to include the new `{ domain: "hh", n: "021".."025" }`
  tuples. **Phase-3 state, not a Phase-3 concern** (carry-through from Phase 1/2).

## Files touched (Phase-3 write-scope subset only)

- `scripts/seed-data/characters.json` — appended 7 rows (`macer_varren`, `helig_gallor`,
  `hydragyrum`, `sibel_niasta`, `crysos_morturg`, `yored_massak`, `torquill_eliphas`).
- `scripts/seed-data/character-aliases.json` — appended 1 alias entry (`the Emperor →
  the_emperor`).
- `scripts/test-resolver.ts` — 9 new test cases (7 direct + 2 alias-consolidation) appended at
  the end of the `resolveCharacter` block.
- `sessions/resolver-dossiers/resolver-pass-14-phase-3-report.md` — this file.

## Forward-look to Phase 4a

- **Phase 4a (Integration/Apply)** will seed the 7 new character rows + the 1 new alias via
  `scripts/seed-resolver-extensions.ts` and re-apply the cumulative HH 001..025 range. The
  Phase-3 surface-form coverage means the dry-trio's `missing resolved FK targets` counter is
  expected to remain at 0 for character-axis after Phase 4a expands the apply range; the
  long-tail `null`-FK character surfaces (Gendor Skraivok, Lycus, Jorin Bloodhowl, the
  weak-curated tail, the Cruze-vs-Qruze disambig) are advisory carry-through (resolver returns
  null, apply skips silently per Brief 084 pattern; no apply-side failure).
- **Phase 4a forward-ref Guard:** dossier 7d expects `out-of-range=0, unknown-work=0` for the
  three roster-collection omnibi (HH-0231 / HH-0232 / HH-0233) once Phase 4a extends the apply
  range to include 021..025. The current Phase-3-stage dry-run (on the pre-existing 001..020
  range) shows `out-of-range=3, unknown-work=0` — these are pre-Phase-4a baseline
  carry-through (Phase 4a will re-verify the clean Guard outcome per Brief 101 + Pass-11/12/13
  experience).

Trias green; ready for Phase 4a (Integration/Apply).
