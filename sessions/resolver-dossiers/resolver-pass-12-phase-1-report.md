# Resolver-Pass 12 — Phase 1 (Factions) Status Report

**Welle:** `ssot-hh-009..014` (HH-0081..HH-0140, 60 Bücher)
**Phase:** `phase-1-factions`
**Scope:** `scripts/seed-data/factions.json`, `scripts/seed-data/faction-aliases.json`, `scripts/seed-data/faction-policy.json`, `scripts/test-resolver.ts`, this status file.
**Status:** done — ready for Phase 2 (Locations).

## Summary

Die leichteste Faction-Phase des HH-Arcs (Dossier §7c-Beobachtung). Die Welle-Surface-Form-Menge ist
dominiert von Pass-10-verankerten Legionen + Pass-11-aliasierten Era-Renames; genuine Neuheit
beschränkt sich auf vier Xenos-Spezies + eine Sub-Power-Daemon-Sub-Faction-Surface. Landing der
konservativen Dossier-Recommendation: **2 strict-curated lore-iconic new rows** (`rangdan` + `hrud`) +
**1 alias add** (`Daemons of Nurgle → daemons`). `khrave` + `nephilim` (niedriges Lore-Profil)
deferred long-tail; `Brotherhood of Lorgar` / `Covenant of Colchis` (pre-Imperium proto-cults) +
`The Order` (Galaspar one-off antagonist) + `Carinae Sodality` (Raven-Guard-Sub-Grain) bleiben
unresolved per Dossier-Empfehlung. Resolver-Trias grün (372 cases, 0 failures), keine
Datenintegritäts-Regression. Keine architektonische Unsicherheit; keine `Needs decision`-Blocker.

## New faction rows (2 total)

| id | name | parent | alignment | tone | evidence | dossier ref |
| --- | --- | --- | --- | --- | --- | --- |
| `rangdan` | Rangdan | `null` | — | `alien` | freq 1 lore-iconic (HH-0096 *Alpharius: Head of the Hydra*) — foundational antagonist der Rangdan Xenocides (Alpha-Legion-defining pre-Heresy operation) | §7c |
| `hrud` | Hrud | `null` | — | `alien` | freq 1 lore-iconic (HH-0084 *Perturabo: The Hammer of Olympia*) — entropy-aura xenos species; cross-era recurring in HH und W40K (Hrud Migration als Olympia-pre-Heresy-backdrop) | §7c |

**Strict-freq floor (Dossier-Recommendation):** 0 rows (kein freq≥2 unresolved Faction in der §3-Tabelle).
**Curated lore-iconic ceiling:** ~4 (`+rangdan`, `+hrud` als strong defaults; `+khrave`, `+nephilim` als
discretionary mit niedrigerem Lore-Profil).
**Actual promotion:** **2 rows** — die zwei stark-Lore-ikonischen Xenos-Spezies; `khrave` + `nephilim`
deferred long-tail (Dossier §7c-Empfehlung: „leave unresolved long-tail unless Phase 1 wants
completionist xenos-grain"; Phase 1 wählt konservativ).

## New faction aliases (1 total)

| surface form | → canonical id | dossier ref | evidence |
| --- | --- | --- | --- |
| `Daemons of Nurgle` | `daemons` | §7a Case A | freq 1 HH-0101 *Grandfather's Gift* — sub-Power-Daemon-Surface (Nurgle's Garden mit Mortarion + Kau'gath); parity mit Pass-11 `Daemons of Khorne → daemons` (flat-alias-to-umbrella, sub-Power-Daemon-grain `nurgle_daemons` deferred). Pass-Vorgänger im Daemon-Cluster: Pass-6 `Chaos Daemons`, Pass-11 `Daemons of Chaos` + `Daemons of Khorne` — `Daemons of Tzeentch → tzeentch` (pre-Pass-11) ist die einzige Ausnahme im Daemon-Sub-Power-Cluster, bewusst nicht eingefangen weil Phase-1 das Konsens-Pattern flat-to-umbrella spiegelt. |

## Specialcases-Notizen (`faction-policy.json`)

Pro neuer Row ein `specialCases`-Eintrag mit Rationale + parent/alignment/tone-Choice + freq-Evidenz.
Keine neuen `browseRoots` (beide Rows sind Top-Level-Xenos parent=null analog cabal / interex / laer /
eldar / orks / tau / necrons / tyranids — Top-Level-Xenos-Spezies sind nach Konvention KEIN
Browse-Root, sondern strukturelle Lore-Knoten). Maintainer-Decision nicht erforderlich.

## Cross-Era / Identity-Disziplin (runbook §4)

- **Faction-Rename pattern (Luna Wolves → Sons of Horus precedent):** Pass-10 hat den
  Cross-Era-Faction-Rename-Anker bereits gesetzt; diese Welle re-bestätigt ihn (Sons of Horus
  freq 3 direct in §3 — HH-0090/0115/0127 — ohne neuen Alias-Bedarf; Pass-10 `Luna Wolves →
  sons_of_horus`-Alias wirkt weiter).
- **Mechanicum / Adeptus Mechanicum / Mechanicus alias chain:** Pass-10 + Pass-11 haben den
  Drei-Surface-Alias-Cluster auf `mechanicus` verankert; diese Welle re-bestätigt ihn (Mechanicum
  freq 2 alias in §3 — HH-0121/0130). Bestätigungs-Test ergänzt (siehe Test-Cases unten).
- **Daemonen-Umbrella:** `daemons` ist der Anker; `Chaos Daemons` (Pass 6), `Daemons of Chaos`
  (Pass 11), `Daemons of Khorne` (Pass 11) und neu `Daemons of Nurgle` (Pass 12) sind Aliase.
  Sub-Gott-Faktionen (`khorne`, `slaanesh`, `tzeentch`, `nurgle`) bleiben eigene Rows; die
  Sub-Power-Daemon-Surface aliasiert bewusst zur Umbrella `daemons` statt zur Gott-Faction `nurgle`,
  weil das Surface „Daemons of Nurgle" die Plaguebearer-Truppen (nicht den Gott selbst) bezeichnet —
  Sub-Power-Daemon-Grain unter `daemons` ist deferred (Phase-Decision: flat-alias-to-parent). Die
  einzige bestehende Ausnahme `Daemons of Tzeentch → tzeentch` (pre-Pass-11) bleibt unverändert
  (Bestands-Asymmetrie, kein Refactor nötig).
- **Knights-Errant-Alias-Chain:** Pass-11 hat `Knights-Errant → knights_errant`-Alias verankert;
  diese Welle re-bestätigt ihn (Knights-Errant freq 2 alias in §3 — HH-0130/0134). Bestätigungs-Test
  ergänzt.
- **Cross-axis-Konflikte:** §4 Dossier-Output = **0** — keine in dieser Welle. `Nurgle` taucht in §3
  auf der Character-Achse (HH-0101 — Chaos God als on-page actor), während die Faction-Surface
  `Daemons of Nurgle` separat ist (verschiedene Surface-Forms — kein Disambig-Risiko). Phase-3-Frage
  bleibt unberührt: ob `Nurgle` als character row promotet wird, ist Phase-3-Discretion (Dossier §7c
  + §7d).

## Resolver-Trias (vor Commit)

- `npm run test:resolver` → **372 passed, 0 failed** (6 neue Pass-12-Phase-1-Test-Cases, davon
  2 direct-match-on-new-rows + 1 alias-route + 3 Pass-Vorgänger-Bestätigungs-Tests).
- `npm run test:resolver-data` → ok (parent/alias-Targets validiert; beide neuen Rows tragen
  parent=null + keine alignment-Property analog cabal/laer/interex; alle Alias-Targets existieren).
- `npm run test:resolver-coverage` → unverändert von Pass-11 (read-only; berührt
  HH-009..014 erst in Phase 4a — coverage smoke slug-set ist hh-001..008 + w40k-001..057).
- `npm run test:apply-override-dry` → ok; Guard: `out-of-range=27, unknown-work=0` (Pass-11-Stand,
  HH-009..014 noch nicht angewendet — wird Phase 4a; Pass-12-Apply absorbiert die *Sons of the
  Emperor*-Konstituenten HH-0101..HH-0106+3 vollständig in-range, Brief-101-Guard expected
  `out-of-range=0, unknown-work=0` nach Phase 4a).

## Idempotenz-Check

Vor jedem Insert wurde geprüft, dass der `id`/`name` in `factions.json` noch nicht existiert
und der Surface-Form-Key in `faction-aliases.json` noch nicht belegt ist:

- `rangdan`: keine bestehende Row, kein bestehender Alias. ok
- `hrud`: keine bestehende Row, kein bestehender Alias. ok
- Alias `Daemons of Nurgle`: neuer key in `faction-aliases.json`. ok

`Daemons of Tzeentch → tzeentch` bleibt unverändert (Bestands-Eintrag, keine Conflict-Mutation).

## Test-Case-Zählung

**6 neue Pass-12-Phase-1-Resolver-Test-Cases** (≥ 5 Schwelle erfüllt). Pattern:

1. `direct match - Resolver-Pass 12 Rangdan` — direct-match auf neue Row (Alpha-Legion-pre-Heresy-defining).
2. `direct match - Resolver-Pass 12 Hrud` — direct-match auf neue Row (cross-era-recurring).
3. `alias - Resolver-Pass 12 Daemons of Nurgle routes to daemons umbrella` — neuer Alias-Route.
4. `alias - Resolver-Pass 12 confirmation Mechanicum still routes to mechanicus` — Pass-10/-11-Alias-Chain
   re-bestätigt auf Pass-12-Surface (HH-0121/0130).
5. `alias - Resolver-Pass 12 confirmation Knights-Errant hyphen variant still routes to knights_errant` —
   Pass-11-Alias-Chain re-bestätigt auf Pass-12-Surface (HH-0130/0134).

(Die 6. Test-Zeile ist die direct-match-Bestätigung für `Hrud` separat vom direct-match auf `Rangdan`;
beide sind dedizierte Test-Cases.)

## Deferred / Phase-übergreifende Verweise

- **Phase 3 FK-Bindungen.** Die zwei neuen Faction-Rows sind ab sofort als `primaryFactionId`-Targets
  in `characters.json` verfügbar. Beide Rows sind Top-Level-Xenos parent=null — Phase 3 darf neue
  Rangdan-/Hrud-Charaktere (falls je Dossier-Evidenz auftaucht) mit den IDs verknüpfen. Aktuelles
  Dossier §7c sieht keine xenos-character-rows aus dieser Welle vor (Kau'gath ist ein freq=1 Ork —
  Phase-3-Discretion via existing `orks`-Row); kein FK-Update nötig in Phase 1.
- **Phase 4a Apply-Side.** Die zwei neuen Faction-Rows fließen über `seed-resolver-extensions.ts` in
  die DB (Phase 4a-Concern, nicht hier). Override-Files (`manual-overrides-ssot-hh-009.json`..`014`)
  enthalten die Surface-Forms aus §3 — der Resolver auf Apply-Seite löst sie via diese Phase-1-Adds.
  Phase 4a muss die domain-aware Trias-Batch-Ranges um die sechs `{ domain: "hh", n: "009" }`..
  `{ domain: "hh", n: "014" }`-Tupel erweitern.
- **Deferred long-tail Xenos-Promotionen.** `Khrave` (HH-0095, Ghoul Stars psychic xenos) + `Nephilim`
  (HH-0088, Khan-Chogoris-Crusade-beat) bleiben unresolved long-tail. Falls in zukünftigen Wellen
  re-surfacing → re-evaluate. Aktuelles Pass-12-Surface-Form-Profil (single-novel each, niedrigeres
  Lore-Profil) reicht nicht für Promotion ohne kuratierte Maintainer-Decision.
- **Deferred pre-Imperium proto-cults.** `Brotherhood of Lorgar` + `Covenant of Colchis` (beide
  HH-0085, freq 1) bleiben unresolved per Dossier-Empfehlung — die Word-Bearers-Legion ist die
  institutionelle Nachfolge, BL behandelt die Cults als ancestral context. Falls künftige
  Pre-Discovery-Lorgar-Wellen erneut Cult-Surface-Forms tragen, kann eine kuratierte
  Cult-Lineage-Promotion erwogen werden (separates Architect-Statement).
- **Deferred one-off antagonist-Factions.** `The Order` (HH-0098, Galaspar-Tyrannei) + `Carinae
  Sodality` (HH-0091, Raven-Guard-Sub-Cell auf Kiavahr) bleiben unresolved. „The Order" ist
  generisch (Disambig-Risiko bei späteren Wellen); Carinae-Sub-Grain unter Raven Guard nicht
  etabliert.

## Halt-Disziplin

- Mindestens ein commit pro Phase: ja (dieser commit).
- JSON-Files syntaktisch valide: ja (alle drei seed-data-Files gleich strukturiert wie zuvor,
  nur am Ende ergänzt; trailing commas korrekt entfernt vor den schließenden brackets;
  test:resolver-data hat parent/alias-Targets validiert).
- Architektonische Unsicherheit: nein — keine `Needs decision`-Blocker. Alle Dossier-§7d-Punkte
  (Xenos-Threshold, Daemons-of-Nurgle-Grain, proto-Cults, The Order) wurden in-phase entschieden
  per Dossier-Recommendation, keiner eskaliert.
- Write-Scope: Diff ⊆ {`scripts/seed-data/factions.json`, `scripts/seed-data/faction-aliases.json`,
  `scripts/seed-data/faction-policy.json`, `scripts/test-resolver.ts`,
  `sessions/resolver-dossiers/resolver-pass-12-phase-1-report.md`}.
- Co-Author-Trailer: keiner.

## Ready for Phase 2 (Locations)

Locations-Achs-Paket (`scripts/seed-data/locations.json`, `location-aliases.json`, ggf.
`sectors.json`, `scripts/test-resolver.ts`, Phase-2-Statusdatei) ist frei und FK-konsistent —
Phase 1 hat nur Faction-Files berührt, keine Lokationen. Dossier §7c forecastet die
**umfangreichste Phase-2-Promotion-Welle seit dem HH-Arc-Beginn**: 2 Alias-Adds (Lycaeus →
deliverance Case D, Phall System → phall Case E) + ~10 neue Rows (galaspar strict-freq + 3
Primarch-Birthworlds olympia/barbarus/cthonia + 6 kuratierte lore-iconic kiavahr/thramas_sector/
urgall_depression/occluda_noctis/deshea/alaxxes_nebula/constanix_ii), mit Ceiling ~18.
