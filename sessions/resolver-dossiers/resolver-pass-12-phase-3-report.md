# Resolver-Pass 12 — Phase 3 (Characters) Status Report

**Welle:** `ssot-hh-009..014` (HH-0081..HH-0140, 60 Bücher)
**Phase:** `phase-3-characters`
**Scope:** `scripts/seed-data/characters.json`, `scripts/seed-data/character-aliases.json`, `scripts/test-resolver.ts`, this status file.
**Status:** done — ready for Phase 4a (Integration/Apply).

## Summary

Die leichteste Character-Phase des HH-Arcs (Dossier §7c-Beobachtung). Pass-11 hat alle freq≥2
HH-Cast-Spines und die Primarch-Roster verankert; Pass-12 ist überwiegend single-novel
supporting-cast-Discretion + Cross-Era-Cleanup. Landing der konservativen-Dossier-Recommendation
(„recommended target ~13 new rows"): **13 new rows** (2 freq-2 Calth-Underworld-Spines + 11 curated
freq-1 lore-iconic Primarchs-monograph- und Novella-Cast-Adds) + **3 alias adds** (Typhon → typhus,
Alexis Pollux → alexis_polux, Dantioch → barabas_dantioch). Alle `primaryFactionId`-Targets zeigen
auf existierende Faction-Rows (Phase-1-FK-Sicherheit eingehalten, runbook §5). Resolver-Trias grün
(392 cases, 0 failures), keine Datenintegritäts-Regression, keine architektonische Unsicherheit,
keine `Needs decision`-Blocker.

## New character rows (13 total)

### Freq-2 cross-batch spines (Dossier §7b — 2 rows)

| id | name | primaryFactionId | evidence | dossier ref |
| --- | --- | --- | --- | --- |
| `kurtha_sedd` | Kurtha Sedd | `word_bearers` | freq 2 cross-batch (HH-0132 *The Honoured* + HH-0133 *The Unburdened*) — Word Bearers Dark Apostle leading the Calth Underworld War; foundational *Mark of Calth* villain | §7b |
| `steloc_aethon` | Steloc Aethon | `ultramarines` | freq 2 cross-batch (HH-0132 + HH-0133) — Ultramarines Honoured commander, Calth loyalist POV (namesake of *The Honoured*) | §7b |

### Curated freq-1 lore-iconic (Dossier §7c — 11 rows)

| id | name | primaryFactionId | evidence | dossier ref |
| --- | --- | --- | --- | --- |
| `barabas_dantioch` | Barabas Dantioch | `iron_warriors` | freq 1 lore-iconic (HH-0084 *Perturabo: The Hammer of Olympia* surface form `Dantioch`) — Iron Warriors Warsmith, lone-loyalist archetype, cross-arc figure (Hydra-Cordatus + *Imperial Truth*); longer-form canonical per runbook §4 | §7c |
| `sor_talgron` | Sor Talgron | `word_bearers` | freq 1 lore-iconic (HH-0126 *The Purge*) — Word Bearers anchor of Burning-of-Monarchia + Percepton-Primus arc | §7c |
| `ingethel` | Ingethel | `daemons` | freq 1 lore-iconic (HH-0115 *Aurelian*) — Daemonic guide of Lorgar in the Eye of Terror; foundational figure in the Word Bearers' fall-to-Chaos arc (cross-arc with *The First Heretic*) | §7c |
| `kandawire` | Kandawire | `imperium` | freq 1 lore-iconic (HH-0110 *Valdor: Birth of the Imperium*) — central non-Valdor POV of the Imperial-founding court-intrigue trio | §7c |
| `amar_astarte` | Amar Astarte | `imperium` | freq 1 lore-iconic (HH-0110) — second central non-Valdor POV of the Valdor trio | §7c |
| `ilya_ravallion` | Ilya Ravallion | `white_scars` | freq 1 (HH-0116 *Brotherhood of the Storm*) + cross-pass cumulative freq 2 via Pass-11 HH-0036 *Path of Heaven* — White Scars human-ally Departmento-Munitorum liaison | §7c |
| `hasik_khan` | Hasik Khan | `white_scars` | freq 1 lore-iconic (HH-0088 *Jaghatai Khan: Warhawk of Chogoris*) — White Scars Khorchin Khan | §7c |
| `holguin` | Holguin | `dark_angels` | freq 1 lore-iconic (HH-0136 *Dreadwing*) — Dark Angels Voted Lieutenant; Dreadwing-organization anchor | §7c |
| `redloss` | Redloss | `dark_angels` | freq 1 lore-iconic (HH-0136) — Dark Angels Dreadwing Master; Dreadwing-organization anchor | §7c |
| `hrend` | Hrend | `iron_warriors` | freq 1 (HH-0129 *Tallarn: Ironclad*) + cross-pass cumulative freq 2 via Pass-11 HH-0045 *Tallarn* — Iron Warriors antagonist Tallarn-arc; Pass-11-deferred, Pass-12-promotes per cross-pass evidence parallel to alaxxes_nebula Phase-2 logic | §7c |
| `nurgle` | Nurgle | `nurgle` | freq 1 lore-iconic (HH-0101 *Grandfather's Gift*) — Chaos God Grandfather Nurgle as on-page actor in Mortarion's audience; §7d axis-grain judgment: Phase-3 promotes character row per dossier recommendation (defensible four-Gods-cast grain when Khorne/Tzeentch/Slaanesh later surface); primaryFactionId `nurgle` (the god-pantheon faction row, more precise than the `daemons` umbrella) | §7c, §7d |

**Strict-freq floor (Dossier-Recommendation):** 4 rows (2 freq-2 + 2 strongest freq-1 — Dantioch + Sor Talgron).
**Curated lore-iconic ceiling:** ~25 (with generous freq-1 cut).
**Recommended target:** ~13 rows.
**Actual promotion:** **13 rows** — landet exakt am Dossier-Recommended-Target (floor + 9 strong-lore-iconic). Weak-curated long-tail (Solomon Voss, Atesh Tarsa, Khrossus, T'kell, Agapito, Tahirah, Kau'gath, Orthos Ulatal etc. + die single-novel-supporting-cast in der dossier §7c-Weak-Liste) bleibt unresolved long-tail per Dossier-Empfehlung; falls in zukünftigen Wellen re-surface → re-evaluate.

## New character aliases (3 total)

| surface form | → canonical id | dossier ref | evidence |
| --- | --- | --- | --- |
| `Typhon` | `typhus` | §7a Case B | freq 1 (HH-0119 *The Lion* — Death Guard antagonist short-form bare name); Pass-11 verankerte `Calas Typhon → typhus` (Cross-Era pattern), die bare-form-Surface taucht erstmals in dieser Welle auf. Pattern-parallel zu Pass-11's Horus Lupercal / Lorgar Aurelian / Corvus Corax / Emperor of Mankind Cross-Era-Alias-Chain (Long-Form-Anker zuerst, Short-Form aliasiert wenn er später surfaced). |
| `Alexis Pollux` | `alexis_polux` | §7a Case C | freq 1 (HH-0109 *Ember of Extinction*) — **Typo** für `Alexis Polux` (HH-0125 *The Crimson Fist*, direct → `alexis_polux`, Pass-11-Pre-Row). Selber Imperial Fists 405th-Company-Captain (Battle of Phall), Doppel-l-Schreibfehler in HH-0109. Override-File trägt die Surface-Form wie authored (surface-form-treue runbook §4), Alias normalisiert die Auflösung. Einziger typo-driven cross-batch character consolidation der Welle. |
| `Dantioch` | `barabas_dantioch` | §7c (longer-form-canonical pattern) | freq 1 (HH-0084 *Perturabo: The Hammer of Olympia* short-form surface) — neue Row trägt die Lore-kanonische Long-Form `Barabas Dantioch`, der HH-0084-Surface aliasiert auf die Long-Form (runbook §4 longer-form-canonical pattern; parity mit `branne_nev` + `Branne` (Pass-10) / `targutai_yesugei` + `Yesugei` (Pass-11) / `lucius_the_eternal` + `Lucius`). |

## Cross-Era / Identity-Disziplin (runbook §4)

- **Cross-Era short-form → existing canonical (Case B Typhon).** Bare-form-Pickup eines Pass-11-Anchors:
  Pass-11 hat den Long-Form-Anker `Calas Typhon → typhus` gesetzt; diese Welle surfaced erstmals die
  bare-Form `Typhon` und alias-ed sie auf denselben Anker. Konsistent mit dem Pass-11-Pattern (Long-Form
  anchor first, short-form alias when it surfaces in a later wave).
- **Typo cross-batch consolidation (Case C Alexis Pollux).** Beide Surface-Forms gehören zur selben
  Identität (Imperial Fists Alexis Polux, Battle of Phall). HH-0109 trägt einen orthographischen
  Doppel-l-Fehler. Alias-Route hält die kanonische Single-Row (`alexis_polux`) sauber; surface-form-
  treue im Override-File (HH-0109's Override-Eintrag bleibt unverändert).
- **Longer-form-canonical pattern (Case Dantioch).** Neue Row trägt Lore-kanonische Vollform
  `Barabas Dantioch`, die HH-0084-Surface ist der Short-Form `Dantioch` — kanonical-row + alias statt
  zwei Rows (runbook §4). Identische Logik wie `branne_nev` + `Branne` / `targutai_yesugei` + `Yesugei`.
- **Honor-title-split parity confirmations (already-aliased in earlier passes, no Phase-3 action this
  wave).** Pass-10/-11 Anker bleiben grün: `Kharn → kharn_the_betrayer` (Pass-10, 2 hits this wave —
  HH-0112/0138), `Horus Lupercal → horus` (Pass-11, 1 hit — HH-0115), `Lorgar Aurelian → lorgar`
  (Pass-11, 1 hit — HH-0115), `Corvus Corax → corax` (Pass-11, 1 hit — HH-0091), `Emperor of Mankind →
  the_emperor` (Pass-11, 3 hits — HH-0104/0107/0110), `Lucius → lucius_the_eternal` (Pass-10, 1 hit —
  HH-0117), `Branne → branne_nev` (Pass-10, 1 hit — HH-0121). Jede Pass-10/-11-Cross-Era-Anchor-Chain
  fängt ihr Pass-12-Re-Surface direkt.
- **All 17 Primarchs anchor exhaustively** (Pass-10 + Pass-11 Combined). Jeder benannte Primarch in
  dieser Welle catched seine bare-Name-Surface direct: Lion El'Jonson, Rogal Dorn, Sanguinius, Ferrus
  Manus, Angron, Fulgrim, Horus, Konrad Curze, Magnus the Red, Mortarion, Perturabo, Roboute Guilliman,
  Vulkan, Alpharius, Jaghatai Khan, Leman Russ, Lorgar, Corax. Primarch-Coverage post-Pass-12: vollständig.

## FK-Sicherheit (runbook §5)

Phase 1 hat 2 neue Rows hinzugefügt (`rangdan`, `hrud`) + 1 neuen Alias. Alle Pass-12-Phase-3-
`primaryFactionId`-Targets zeigen auf existierende Faction-Rows:

- `word_bearers` (existing) — `kurtha_sedd`, `sor_talgron`
- `ultramarines` (existing) — `steloc_aethon`
- `iron_warriors` (existing) — `barabas_dantioch`, `hrend`
- `daemons` (existing) — `ingethel`
- `imperium` (existing) — `kandawire`, `amar_astarte`
- `white_scars` (existing) — `ilya_ravallion`, `hasik_khan`
- `dark_angels` (existing) — `holguin`, `redloss`
- `nurgle` (existing) — `nurgle` (character row primaryFactionId points at the existing god-pantheon faction row)

Keine FK-Verweise auf Phase-1-Neuheiten dieser Welle (kein Rangdan-/Hrud-Character im
Dossier-§7c-Empfehlungsset — Phase-1-Anmerkung „Aktuelles Dossier §7c sieht keine xenos-character-rows
aus dieser Welle vor" bestätigt). `test:resolver-data` validiert die FK-Konsistenz vor Commit.

## Resolver-Trias (vor Commit)

- `npm run test:resolver` → **392 passed, 0 failed** (7 neue Pass-12-Phase-3-Test-Cases, davon
  2 direct-match-on-new-freq-2-row + 4 direct-match-on-new-freq-1-row + 3 alias-route, inkl. der
  drei alias-consolidation cases Typhon/Alexis Pollux/Dantioch).
- `npm run test:resolver-data` → ok (alle 10 Integritäts-Checks grün — keine Duplikat-IDs/-Namen,
  alle `primaryFactionId`-Targets existieren, Alias-Targets resolven, no parent/sector-FK-broken).
- `npm run test:resolver-coverage` → unverändert von Pass-11 (read-only auf Phase-3 — coverage smoke
  slug-set ist hh-001..008 + w40k-001..057; Phase 4a wird die Pass-12-Welle in die smoke-Range
  bringen).
- `npm run test:apply-override-dry` → ok; Guard: `out-of-range=27, unknown-work=0` (Pass-11-Stand,
  HH-009..014 noch nicht angewendet — wird Phase 4a; Pass-12-Apply absorbiert die *Sons of the
  Emperor*-Konstituenten HH-0101..HH-0106+3 vollständig in-range; Brief-101-Guard expected
  `out-of-range=0, unknown-work=0` nach Phase 4a Cumulative-Range-Apply).

## Idempotenz-Check

Vor jedem Insert wurde geprüft, dass die `id` / `name` in `characters.json` noch nicht existiert
und der Surface-Form-Key in `character-aliases.json` noch nicht belegt ist:

- `kurtha_sedd`, `steloc_aethon`, `barabas_dantioch`, `sor_talgron`, `ingethel`, `kandawire`,
  `amar_astarte`, `ilya_ravallion`, `hasik_khan`, `holguin`, `redloss`, `hrend`, `nurgle`:
  keine bestehenden Rows oder Aliases. ok
- Alias keys `Typhon`, `Alexis Pollux`, `Dantioch`: alle drei neu. ok

`Calas Typhon → typhus` (Pass-11), `Kharn → kharn_the_betrayer` (Pass-10), `Horus Lupercal → horus`
(Pass-11), `Corvus Corax → corax` (Pass-11), `Lorgar Aurelian → lorgar` (Pass-11), `Emperor of
Mankind → the_emperor` (Pass-11), `Lucius → lucius_the_eternal` (Pass-10), `Branne → branne_nev`
(Pass-10), `Yesugei → targutai_yesugei` (Pass-11) bleiben unverändert.

## Test-Case-Zählung

**7 neue Pass-12-Phase-3-Resolver-Test-Cases** (≥ 5 Schwelle erfüllt, davon ≥ 2 alias-consolidation
required). Pattern:

1. `alias-consolidation - Resolver-Pass 12 (7a Case B) Typhon routes to typhus` — Cross-Era short-form alias (alias-consolidation #1).
2. `alias-consolidation - Resolver-Pass 12 (7a Case C) Alexis Pollux routes to alexis_polux` — typo cross-batch consolidation (alias-consolidation #2).
3. `direct match - Resolver-Pass 12 Kurtha Sedd` — freq-2 cross-batch spine direct (§7b).
4. `direct match - Resolver-Pass 12 Steloc Aethon` — freq-2 cross-batch spine direct (§7b).
5. `direct match - Resolver-Pass 12 Barabas Dantioch` — direct-match on new freq-1 lore-iconic row.
6. `alias-consolidation - Resolver-Pass 12 Dantioch routes to barabas_dantioch` — longer-form-canonical alias (alias-consolidation #3).
7. `direct match - Resolver-Pass 12 Nurgle` — direct-match on new character row (Chaos-God-as-character grain, §7d judgment).

**Alias-consolidation count: 3** (≥ 2 required — Cases B + C + Dantioch longer-form-canonical pattern).

## Deferred / Phase-übergreifende Verweise

- **Phase 4a Apply-Side.** Die 13 neuen Character-Rows + 3 neuen Aliases fließen über
  `seed-resolver-extensions.ts` in die DB (Phase 4a-Concern). Override-Files
  (`manual-overrides-ssot-hh-009.json`..`014`) enthalten die Surface-Forms aus §3 — der Resolver auf
  Apply-Seite löst sie via diese Phase-3-Adds. Phase 4a muss die domain-aware Trias-Batch-Ranges um
  die sechs `{ domain: "hh", n: "009" }`..`{ domain: "hh", n: "014" }`-Tupel erweitern.
- **Deferred weak-curated long-tail Promotions.** Folgende Dossier-§7c-Weak-Promotion-Kandidaten
  bleiben **unresolved long-tail** per Dossier-Empfehlung „leave unresolved unless Phase 3 wants
  generous freq-1 cut":
  - Single-novel POVs: `Solomon Voss` (HH-0112 Sigismund interviewer), `Atesh Tarsa` (HH-0128
    Salamander), `Khrossus` (HH-0137 Warsmith), `T'kell` (HH-0135 Salamander, slug stripped →
    `tkell`), `Agapito` (HH-0121 Raven Guard captain), `Tahirah` (HH-0123 Tallarn-Exec POV),
    `Kau'gath` (HH-0101 Ork, → `kaugath`), `Orthos Ulatal` (HH-0106 archivist frame).
  - Single-novella supporting cast: `Aecus Decimus`, `Jaruleth` (HH-0126), `Akurduana`, `Moses
    Trurakk` (HH-0087), `Calliphone` (HH-0084), `Nairo` (HH-0085), `Jorin Bloodhowl`, `Durath`
    (HH-0082), `Kell`, `Haln` (HH-0134), `Dravian Klayde` (HH-0130), `Ulrach Branthan` (HH-0128),
    `Usabius`, `Ra'stan` (HH-0122 → `rastan`), `Xyrokles` (HH-0093).
  Phase-3 wählt konservativ — kein Promote ohne ≥2 cross-batch evidence oder strong-Lore-Profil.
  Falls in zukünftigen Wellen re-surfacing → re-evaluate (parallel zum `Hrend`-cross-pass-cumulative-
  Pattern dieser Welle, das die Pass-11-Deferred-Decision umgekehrt hat).
- **Cross-axis-Konflikte:** §4 Dossier-Output = **0** — keine in dieser Welle. `Nurgle` taucht in §3
  auf der Character-Achse (HH-0101), die Faction-Surface `Daemons of Nurgle` ist separat
  (verschiedene Surface-Forms — kein Disambig-Risiko). Phase-1 hat `Daemons of Nurgle → daemons`
  aliasiert; diese Phase 3 promotet `Nurgle` als Character-Row. Beide Pfade kohabitieren konfliktfrei.

## Halt-Disziplin

- Mindestens ein commit pro Phase: ja (dieser commit).
- JSON-Files syntaktisch valide: ja (beide character-Files JSON-validiert; test:resolver-data hat
  alle FK/Alias-Targets validiert).
- Architektonische Unsicherheit: nein — keine `Needs decision`-Blocker. Alle Dossier-§7d-Punkte
  (Nurgle character-vs-faction grain, weak-curated long-tail promotion threshold) wurden in-phase
  entschieden per Dossier-Recommendation, keiner eskaliert.
- FK-Reihenfolge runbook §5: Phase 1 (Factions) ist committed; alle `primaryFactionId`-Targets dieser
  Phase 3 zeigen auf existierende Faction-Rows (entweder Pre-Pass-12 oder Pass-12-Phase-1-neu — kein
  Verweis aus Phase-3-Rows zeigt auf eine Phase-1-Neuheit dieser Welle, die Phase-1-Adds Rangdan/Hrud
  haben keine Character-FK-Verbraucher in §7c).
- Write-Scope: Diff ⊆ {`scripts/seed-data/characters.json`, `scripts/seed-data/character-aliases.json`,
  `scripts/test-resolver.ts`, `sessions/resolver-dossiers/resolver-pass-12-phase-3-report.md`}.
- Co-Author-Trailer: keiner.

## Ready for Phase 4a (Integration/Apply)

Phase 4a-Achs-Paket (`scripts/seed-resolver-extensions.ts`, `scripts/apply-override-dry.ts`,
`scripts/apply-override-collections.ts`, `scripts/test-resolver-coverage.ts`,
`scripts/test-resolver-data-integrity.ts`, `scripts/seed-data/collection-gaps.json`,
`scripts/seed-data/persons.json`, die 6 Override-Files ssot-hh-009..014,
`scripts/db-counts.ts`, `scripts/seed-facets.ts`, `scripts/run-phase4-apply.sh`,
`ingest/.last-run/phase4-digest.md`, Phase-4a-Statusdatei) ist frei und FK-konsistent.
Pass-12-Reference-Row-Deltas, die Phase 4a in `seed-resolver-extensions.ts` aufnimmt:

- **Factions (Phase 1):** +2 rows (`rangdan`, `hrud`), +1 alias (`Daemons of Nurgle → daemons`).
- **Locations (Phase 2):** siehe `resolver-pass-12-phase-2-report.md`.
- **Characters (Phase 3, this report):** +13 rows (`kurtha_sedd`, `steloc_aethon`, `barabas_dantioch`,
  `sor_talgron`, `ingethel`, `kandawire`, `amar_astarte`, `ilya_ravallion`, `hasik_khan`, `holguin`,
  `redloss`, `hrend`, `nurgle`), +3 aliases (`Typhon → typhus`, `Alexis Pollux → alexis_polux`,
  `Dantioch → barabas_dantioch`).

Phase 4a kann die kumulative Apply-Range `hh 1..14` (idempotent delete-then-insert für HH-001..008,
first-time für HH-009..014) starten; Brief-101-Forward-Ref-Guard expected `out-of-range=0,
unknown-work=0` (HH-0090 *Sons of the Emperor* hat 9 Konstituenten alle in-range).
