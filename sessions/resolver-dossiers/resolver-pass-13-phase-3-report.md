# Resolver-Pass 13 — Phase 3 (Characters) Report

> **Mechanical-task report.** Wave `ssot-hh-015..020` (HH-0141..HH-0200, 60 books).
> Phase 3 (Characters). Driver: per-phase runbook
> [`sessions/resolver-pass-runbook.md`](../resolver-pass-runbook.md) §3 Phase 3 + §4
> (Promotions/Alias-Disziplin, Cross-Era-Identitäten) + §5 (FK-Reihenfolge — Phase 1
> strict before Phase 3). Config:
> [`scripts/resolver-pass.config.json`](../../scripts/resolver-pass.config.json).
> Dossier: [`resolver-pass-13-dossier.md`](./resolver-pass-13-dossier.md).
> One commit. **No co-author trailer**, **no brief read** (Brief 094 lean contract).

## Summary

| Metric | Pre | Δ | Post |
| --- | ---: | ---: | ---: |
| `characters.json` rows | 457 | +17 | 474 |
| `character-aliases.json` entries | 57 | +4 | 61 |
| Resolver-trias test count | 408 | +14 | 422 |

Phase-3 promotion shape lands on the **dossier's recommended-target cut** (~14 new rows
+ 1 Case-D row + 3 alias adds + 1 paired alias). The 17 new rows = 2 7b cross-batch
spine rows + 1 7a Case-D longer-form-canonical row + 5 7c strong-lore-iconic rows + 9
7c medium freq=1 rows for which the dossier explicitly recommended "promote". Floor
(4 rows) avoided in favor of the recommended target because every promoted row carries
either strict freq≥2 evidence (Cases B/C/D/E + 7b spines), strong-lore-iconic
cross-arc anchor (Solomon Voss / Corswain / Hastur Sejanus / Merir Astelan / Crius),
or explicit Phase-3-promote recommendation in the dossier (Menes Kalliston / Heka'tan
/ Dreagher / Pallas Ravachol / Mendacs / Nykona Sharrowkyn / Sabik Wayland / Susada
Syn / Fel Zharost). Ceiling (~25 with weak-curated long tail) avoided — the
weak-curated freq-1 candidates (Devine family minus heads-of-house, Alajos / Sheng /
Henricos / Grael Noctua / Chamell / Dallon Prael / Leon Kyyter / Silas Cincade /
Letae / Lermenta / Arkad / Vorkellen / Persephia / Leilani Mollitas / Murnau / Ashel /
Nisha Andrasta / Bulveye / Andras / Belath / Amon Tauromachian / Enobar Stentonox /
Kargir / Torghun Khan / Thoros / Mayder Oquin / Lukas Chrom / Kaban Machine /
Cyprian / Raeven / Abelard / Cebella / Lyx Devine) stay unresolved long-tail per
runbook §4 (only promote on evidence). A future cross-batch freq-2 surface
re-promotes any that hit the strict bar.

## Aliases — new entries (4)

| surface form | → canonical id | rationale |
| --- | --- | --- |
| `Maloghurst` | `maloghurst_the_twisted` | **Case B (dossier §7a)** — short-form bare-name of the Pass-10-anchored equerry; cross-batch freq=2 (HH-0144 *Blades of the Traitor* + HH-0196 *Twisted*). Pattern-parallel to Pass-12 `Typhon → typhus` short-form-onto-long-canonical chain. No row edit. |
| `Nassir Amit` | `amit` | **Case C (dossier §7a)** — full-name canonical surface of the pre-Pass-10 `amit` row; cross-batch freq=2 (HH-0184 *Sins of the Father* + HH-0189 *Virtues of the Sons*, both Andy Smillie Blood-Angels duels). Direction reversed from the preferred longer-form-canonical convention because renaming a stable canonical-id mid-arc is out of scope for an alias pass (would require row-id migration + downstream junction re-resolve). Deferred row-rename candidate (`amit → nassir_amit`) noted for a future consolidation pass. |
| `The Emperor of Mankind` | `the_emperor` | **Case E (dossier §7a)** — longer-variant with leading "The" of the Pass-10 row, parity with the existing `Emperor of Mankind` alias (without leading "The"). Surface form HH-0179 *The Wolf of Ash and Fire*. Same person, same row. No row edit. |
| `Arvida` | `revuel_arvida` | **Case D paired alias (dossier §7a)** — short-form bare-name paired with the new `revuel_arvida` canonical row (longer-form-canonical pattern per runbook §4 — parity with `branne_nev` + `Branne`, `barabas_dantioch` + `Dantioch`, `targutai_yesugei` + `Yesugei`). Surface forms HH-0141 *Sedition's Gate* (`Arvida` short) + HH-0161 *Rebirth* (`Revuel Arvida` long), same Thousand Sons psyker — cross-batch freq=2-via-alias-consolidation. |

## Promotions — new canonical rows (17)

### Case D + 7b cross-batch spines (3 rows)

| id | name | primaryFactionId | evidence |
| --- | --- | --- | --- |
| `revuel_arvida` | Revuel Arvida | `thousand_sons` | **7a Case D longer-form-canonical (+ paired `Arvida` alias above)** — Thousand Sons psyker, cross-batch freq=2 (HH-0141 *Sedition's Gate* / HH-0161 *Rebirth* — the namesake debut with the "knowledge is power" closing line on Tizca). |
| `marcus_valerius` | Marcus Valerius | `therion_cohort` | **7b cross-batch spine freq=2** — Therion Cohort officer embedded with Raven Guard, cross-batch HH-0149 *Echoes of Revelation* + HH-0171 *The Divine Word*. primaryFactionId `therion_cohort` (Phase-1-promoted regiment-grain sub-faction of `astra_militarum`, explicit spine-character-link rationale in P1 report). |
| `arcadese` | Arcadese | `ultramarines` | **7b cross-batch spine freq=2, identity check passed per strict reading** — Ultramarine ambassador / supporting cross-arc figure, HH-0159 *Forgotten Sons* + HH-0173 *The Gates of Terra*. Two HH authors / books / settings attest the same recurring Ultramarine-named figure per dossier §7b strict reading. |

### 7c curated freq=1 strong-lore-iconic (5 rows)

| id | name | primaryFactionId | evidence |
| --- | --- | --- | --- |
| `solomon_voss` | Solomon Voss | `imperium` | **7c strong-lore-iconic, Pass-12 dossier carry-over** — Iterator / remembrancer at the center of the execution argument with Dorn and Iacton Qruze on Titan; HH-0160 *The Last Remembrancer*. primaryFactionId `imperium` (civilian remembrancer-grade — parity with `alivia_sureka` civilian-perpetual choice). |
| `corswain` | Corswain | `dark_angels` | **7c strong-lore-iconic Dark Angels supporting cross-arc** — Dark Angels Voted Lieutenant, the Lion's right-hand at the Tsagualsa parlay against Konrad Curze; HH-0165 *Savage Weapons*. |
| `hastur_sejanus` | Hastur Sejanus | `sons_of_horus` | **7c strong-lore-iconic — false-Sejanus thread foundational Heresy beat** — dead Mournival captain whose impersonation by Erebus's cult recurs in cult mythology long after his death; HH-0170 *Death of a Silversmith*. Luna-Wolves-era identity canonical-aliased onto Sons of Horus per Pass-10/11/12 Cross-Era convention. |
| `merir_astelan` | Merir Astelan | `dark_angels` | **7c strong-lore-iconic Dark Angels First-of-the-Fallen cross-arc** — Dark Angels chapter-master debating compliance around Byzanthis; HH-0154 *Call of the Lion*. Cross-arc with the Fallen / Cypher / Lion arcs. primaryFactionId `dark_angels` (Heresy-era; post-Heresy First-of-the-Fallen status downstream from his Pass-13 surface). |
| `crius` | Crius | `iron_hands` | **7c strong-lore-iconic Iron Hands cross-arc supporting cast** — Iron Hands captain on Terra serving under the Crusader Host; HH-0177 *Riven*, cross-arc with HH-0176 *Luna Mendax* (Loken arc). |

### 7c medium freq=1 Phase-3-promote per dossier recommendation (9 rows)

| id | name | primaryFactionId | evidence |
| --- | --- | --- | --- |
| `menes_kalliston` | Menes Kalliston | `thousand_sons` | Thousand Sons psyker confronting Khârn on Tizca closing the Prospero arc-thread; HH-0161 *Rebirth* (paired with `revuel_arvida` POV). |
| `heka_tan` | Heka'tan | `salamanders` | Salamander ambassador on Bastion alongside the Ultramarine `arcadese` figure; HH-0159 *Forgotten Sons* (Nick Kyme). |
| `dreagher` | Dreagher | `world_eaters` | World-Eaters captain at the Khârn-Angron encounter on Desh'ea (War-Hounds → World-Eaters transition); HH-0156 *After Desh'ea* (Matthew Farrer). |
| `pallas_ravachol` | Pallas Ravachol | `mechanicus` | Mechanicum adept POV in the prequel-to-*Mechanicum* novella; HH-0172 *The Kaban Project* (Graham McNeill). |
| `mendacs` | Mendacs | `alpha_legion` | Alpha Legion propagandist (the Latin "we lie" in-Legion code-name) on Virger-Mos II; HH-0158 *Liar's Due* (James Swallow). |
| `nykona_sharrowkyn` | Nykona Sharrowkyn | `raven_guard` | Raven Guard Shadowmaster debut paired with `sabik_wayland`, Sisypheum-origin novella; HH-0167 *Kryptos* (Graham McNeill). Cross-arc with future Shattered-Legions novellas. |
| `sabik_wayland` | Sabik Wayland | `iron_hands` | Iron Hands Techmarine debut aboard the Sisypheum; HH-0167 *Kryptos*. |
| `susada_syn` | Susada Syn | `astra_militarum` | Governor-militant on Tallarn surveying post-battle waste from a Titan; HH-0198 *Tallarn: Witness* (John French). primaryFactionId `astra_militarum` (Tallarn-defender Imperial-Army-grade figure). |
| `fel_zharost` | Fel Zharost | `night_lords` | Night Lord lapsed-Librarian character study; HH-0181 *Child of Night* (John French). Night-Lords Librarian cross-arc figure. |

## Phase-3 judgments (cases the dossier flagged for the phase)

- **Case A (Davinite Lodge ↔ Davinite Serpent Lodge).** Out-of-scope for Phase 3
  (Faction-axis decision — Phase 1 already adopted dossier recommendation (a):
  single row `davinite_lodge` + alias `Davinite Serpent Lodge → davinite_lodge`).
- **Case B Maloghurst short-form (7a).** Phase-3 adopted dossier recommendation —
  alias `Maloghurst → maloghurst_the_twisted` (pattern-parallel to Pass-12 Case B
  `Typhon → typhus` and Pass-10 `Little Horus Aximand → horus_aximand`). No row
  edit. Cross-batch freq=2 strongest alias case of the wave.
- **Case C Nassir Amit row-rename deferral (7a + 7d).** Phase-3 adopted dossier
  recommendation (a): **alias-only** `Nassir Amit → amit`, **not** the row-rename
  `amit → nassir_amit`. Rationale: renaming a stable canonical-id mid-arc would
  require row-id migration + downstream junction re-resolve across every prior
  Pass-10/11/12 apply, which is out of scope for an alias pass and would inflate
  blast radius. The Pass-13 surface lands cleanly via alias on the existing
  `amit` slug; the longer-form-canonical convention violation is acknowledged and
  the row-rename remains a deferred candidate for a future consolidation pass
  (the Pass-13 `amit` row otherwise holds because its name field "Amit" matches
  the freq=2 bare-form surface — HH-0143 / HH-0148). Phase-3 noted but did not
  raise as `## Needs decision`.
- **Case D Revuel Arvida ↔ Arvida (7a).** Phase-3 adopted dossier recommendation
  — new row `revuel_arvida` (longer-form-canonical) + paired alias
  `Arvida → revuel_arvida` (parity with `branne_nev` + `Branne`,
  `barabas_dantioch` + `Dantioch`, `targutai_yesugei` + `Yesugei`). Cross-batch
  freq=2-via-alias-consolidation evidence holds (HH-0141 *Sedition's Gate* short
  form + HH-0161 *Rebirth* long form — different batches, same Thousand Sons
  psyker). primaryFactionId `thousand_sons` (exists, direct §3).
- **Case E The Emperor of Mankind longer-variant (7a).** Phase-3 adopted dossier
  recommendation — alias `The Emperor of Mankind → the_emperor` (longer variant
  with leading "The", parity with the existing `Emperor of Mankind` alias). No
  row edit.
- **Case `arcadese` 7b cross-book identity verification.** Phase-3 adopted dossier
  recommendation per strict reading — both HH-0159 *Forgotten Sons* (Ultramarine
  ambassador on Bastion alongside Salamanders) and HH-0173 *The Gates of Terra*
  (Ultramarine POV under a Malcador frame) attest the same Ultramarine-named
  recurring figure. Identity check passed: same primaryFactionId
  (`ultramarines`), same arc grain (Heresy-era Ultramarine supporting cross-arc
  diplomatic / Malcador-linked figure), different authors / books / settings
  consistent with cross-batch spine evidence (parallel to other 7b spine cases
  from earlier passes). Promote per strict reading; identity flagged here for
  audit-cockpit traceability.
- **Case `marcus_valerius` primaryFactionId choice.** Adopted
  `primaryFactionId='therion_cohort'` (the Phase-1-promoted regiment-grain
  sub-faction of `astra_militarum`), per the explicit Phase-1 cross-phase note
  ("Phase 3 will create the row with `primaryFactionId='therion_cohort'`"). FK
  resolves clean — Phase 1 created the `therion_cohort` row strictly before
  Phase 3 per runbook §5 (FK-Reihenfolge).
- **Kaban Machine axis-grain (7d).** Phase-3 adopted dossier recommendation —
  **leave unresolved long-tail**. Mechanicum-construct character-grain is not
  yet established in the resolver layer (the Pass-12 `nurgle` Chaos-God
  precedent is a god-pantheon four-Gods-cast grain, not a sentient-construct
  grain), and a single-novel surface is borderline. A future cross-batch
  freq-2 surface re-promotes if it hits the strict bar.
- **House Devine family (7d).** Phase-3 left the entire Devine family
  (Cyprian / Cebella / Lyx / Raeven / Abelard) **unresolved long-tail**.
  HH-0182 *The Devine Adoratrice* surfaces the full family in a single
  short-story; the Pass-13 wave does not establish cross-batch evidence for
  the head of house (`Cyprian Devine`) or the Knight-pilot heir (`Raeven
  Devine`) — the dossier flagged these as Phase-3 judgment candidates,
  recommendation: promote *if Phase 3 wants Devine-arc completionist grain*.
  Phase 3 declined completionist grain in favor of budget conservatism;
  future Molech-arc wave surfaces will re-evaluate.
- **Weak-curated freq-1 long tail.** Phase-3 left the entire dossier §7c
  weak-curated set unresolved long-tail per runbook §4 + dossier-recommended
  budget conservatism (Alajos / Sheng / Henricos / Grael Noctua / Chamell /
  Dallon Prael / Leon Kyyter / Silas Cincade / Letae / Lermenta / Arkad /
  Vorkellen / Persephia / Leilani Mollitas / Murnau / Ashel / Nisha
  Andrasta / Bulveye / Andras / Belath / Amon Tauromachian / Enobar
  Stentonox / Kargir / Torghun Khan / Thoros / Mayder Oquin / Lukas Chrom).
  All freq=1 single-novella surfaces below either the strong-lore-iconic
  threshold or the dossier-recommend-promote bar; a future cross-batch
  freq-2 surface re-promotes any that hit the strict bar.
- **Hibou Khan (7c judgment).** Phase-3 declined the dossier-flagged
  completionist White-Scars supporting-cast promotion option (Hibou Khan
  HH-0163 *Little Horus*). Single-short-story surface, no cross-batch
  evidence, and the dossier explicitly framed this as Phase-3-discretionary
  ("recommendation: new row if Phase 3 wants completionist White-Scars
  supporting cast; else leave unresolved long-tail"). Phase 3 chose the
  conservative option for budget consistency with the other declined
  weak-curated rows.
- **No Cross-Era / era-rename alias work needed beyond the Pass-13 set.**
  All Pass-10/11/12 Cross-Era chains hold (Khârn / Kharn ↔
  kharn_the_betrayer; Horus Lupercal ↔ horus; Lucius ↔ lucius_the_eternal;
  Lorgar Aurelian ↔ lorgar — all verified by `alias` status in dossier §3).
  No new Pass-13 Cross-Era alias surfaces beyond Cases B/C/D/E.

## Idempotency check

- All 17 new ids (`revuel_arvida`, `marcus_valerius`, `arcadese`,
  `solomon_voss`, `corswain`, `hastur_sejanus`, `merir_astelan`, `crius`,
  `menes_kalliston`, `heka_tan`, `dreagher`, `pallas_ravachol`, `mendacs`,
  `nykona_sharrowkyn`, `sabik_wayland`, `susada_syn`, `fel_zharost`) were
  absent from baseline `characters.json` per pre-edit grep (457 rows pre,
  474 rows post — Δ=+17 clean).
- All 4 new alias keys (`Maloghurst`, `Nassir Amit`, `The Emperor of
  Mankind`, `Arvida`) were absent from baseline `character-aliases.json`
  (57 entries pre, 61 entries post — Δ=+4 clean).
- All 17 new `primaryFactionId` values point at existing factions
  (`thousand_sons`, `therion_cohort` Phase-1-promoted, `ultramarines`,
  `imperium`, `dark_angels`, `sons_of_horus`, `iron_hands`, `salamanders`,
  `world_eaters`, `mechanicus`, `alpha_legion`, `raven_guard`,
  `astra_militarum`, `night_lords`) — FK reihenfolge verified clean per
  runbook §5 (Phase 1 strict-before Phase 3 holds for the new
  `therion_cohort` parent).
- All 4 new alias targets point at existing canonical ids
  (`maloghurst_the_twisted` Pass-10 row, `amit` pre-Pass-10 row,
  `the_emperor` Pass-10 row, `revuel_arvida` new Phase-3 row in the same
  file).
- No row or alias was renamed or removed; all edits are append-only.

## Tests added (14 — exceeds the runbook §3 Phase 3 floor of 5, of which 4 are alias-consolidation, exceeds the ≥2 floor)

Alias-consolidation tests (4 — exceeds the runbook ≥2 floor):

1. `alias-consolidation - Resolver-Pass 13 (7a Case B short-form pattern, parity with Little Horus Aximand → horus_aximand): Maloghurst routes to maloghurst_the_twisted`
2. `alias-consolidation - Resolver-Pass 13 (7a Case C full-form-to-existing-short-canonical, deferred row-rename candidate): Nassir Amit routes to amit`
3. `alias-consolidation - Resolver-Pass 13 (7a Case E longer-variant with leading 'The', parity with existing Emperor of Mankind alias): The Emperor of Mankind routes to the_emperor`
4. `alias-consolidation - Resolver-Pass 13 (7a Case D paired short-form alias, parity with Branne → branne_nev / Dantioch → barabas_dantioch): Arvida routes to revuel_arvida`

Direct-match tests for new rows (10 — covers Case D + both 7b spines + all 5 strong-lore-iconic + 2 representative medium-promote rows):

5. `direct match - Resolver-Pass 13 (7a Case D longer-form-canonical Thousand Sons psyker, Rebirth HH-0161 + Sedition's Gate HH-0141): Revuel Arvida`
6. `direct match - Resolver-Pass 13 (7b cross-batch spine freq=2 Therion Cohort officer with Raven Guard, HH-0149 + HH-0171): Marcus Valerius`
7. `direct match - Resolver-Pass 13 (7b cross-batch spine freq=2 Ultramarine ambassador, HH-0159 + HH-0173, identity check passed): Arcadese`
8. `direct match - Resolver-Pass 13 (7c curated freq=1 strong-lore-iconic Iterator/remembrancer, Last Remembrancer HH-0160 execution argument with Dorn/Qruze on Titan): Solomon Voss`
9. `direct match - Resolver-Pass 13 (7c curated freq=1 strong-lore-iconic Dark Angels Voted Lieutenant at the Tsagualsa parlay, Savage Weapons HH-0165): Corswain`
10. `direct match - Resolver-Pass 13 (7c curated freq=1 strong-lore-iconic — false-Sejanus thread foundational Heresy beat, Death of a Silversmith HH-0170): Hastur Sejanus`
11. `direct match - Resolver-Pass 13 (7c curated freq=1 strong-lore-iconic Dark Angels First-of-the-Fallen, Call of the Lion HH-0154): Merir Astelan`
12. `direct match - Resolver-Pass 13 (7c curated freq=1 strong-lore-iconic Iron Hands captain under Crusader Host, Riven HH-0177): Crius`
13. `direct match - Resolver-Pass 13 (7c medium freq=1 Phase-3-promote — Raven Guard Shadowmaster Sisypheum-origin debut, Kryptos HH-0167): Nykona Sharrowkyn`
14. `direct match - Resolver-Pass 13 (7c medium freq=1 Phase-3-promote — Night Lords lapsed-Librarian, Child of Night HH-0181): Fel Zharost`

> The 7 remaining medium-promote rows (`menes_kalliston`, `heka_tan`,
> `dreagher`, `pallas_ravachol`, `mendacs`, `sabik_wayland`, `susada_syn`)
> are exercised indirectly by `test:resolver-data` (alias targets +
> primaryFactionId FKs all validate) and will be exercised end-to-end via
> their override surfaces in Phase 4a. Adding direct-match tests for every
> single new row crosses into test-redundancy territory under the runbook's
> floor (≥5 cases, ≥2 alias) and is not the §10 verification expectation.

## Verification

Resolver-trias green (runbook §10 — Phase 3 is code-touching, must hold the trias):

- `npm run test:resolver` — **422 passed, 0 failed** (408 → 422; +14 new Pass-13 cases)
- `npm run test:resolver-data` — **ok** (no duplicate ids/names, all parents/FKs consistent, all alias targets canonical, character primaryFactionIds point at existing factions)
- `npm run test:resolver-coverage` — **exit 0** (smoke coverage holds; below-threshold rows are data findings, not regressions)
- `npm run test:apply-override-dry` — **ok** (`out-of-range=21, unknown-work=0`; the new ids unused in current overrides — Phase 3 prepares the seed; Phase 4a will exercise them through `ssot-hh-015..020` overrides plus extension via `seed-resolver-extensions.ts`)

JSON validity (runbook §3 halt): both in-scope JSONs parse cleanly via
`JSON.parse` post-edit (`node -e "JSON.parse(...)"` smoke check, exit 0).

Write-scope adherence (runbook §3 + Driver-Halt-Check): edits limited to
the config-scoped paths:

- `scripts/seed-data/characters.json`
- `scripts/seed-data/character-aliases.json`
- `scripts/test-resolver.ts`
- `sessions/resolver-dossiers/resolver-pass-13-phase-3-report.md`

## Ready for Phase 4a

Phase 3 is complete. Phase 4a (Integration/Apply) may proceed. The 17 new
character rows + 4 new aliases will be exercised end-to-end via the
`ssot-hh-015..020` override files plus the cumulative Phase-4a re-apply
range (`hh 1..20`), per runbook §3 Phase 4a + §7 (Digest-Disziplin). No
`## Needs decision` blockers; no architectural concern surfaced this
phase. FK reihenfolge verified clean (Phase 1 strict-before Phase 3 holds
for the new `therion_cohort` parent of `marcus_valerius`).
