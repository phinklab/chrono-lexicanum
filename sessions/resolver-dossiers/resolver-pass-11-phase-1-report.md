# Resolver-Pass 11 — Phase 1 (Factions) Status Report

**Welle:** `ssot-hh-003..008` (HH-0021..HH-0080, 60 Bücher)
**Phase:** `phase-1-factions`
**Scope:** `scripts/seed-data/factions.json`, `scripts/seed-data/faction-aliases.json`, `scripts/seed-data/faction-policy.json`, `scripts/test-resolver.ts`, this status file.
**Status:** done — ready for Phase 2 (Locations).

## Summary

Promotions-Disziplin: 1 strict-freq new row (combined freq=6) + 8 curated freq-1 lore-iconic
new rows + 6 alias-Adds, alle gegen Dossier §7a/§7c-Evidenz. Resolver-Trias grün (330 cases,
0 failures), keine Datenintegritäts-Regression. Keine architektonische Unsicherheit; keine
`Needs decision`-Blocker.

## New faction rows (9 total)

| id | name | parent | alignment | tone | evidence | dossier ref |
| --- | --- | --- | --- | --- | --- | --- |
| `knights_errant` | Knights Errant | `imperium` | `imperium` | `imperial` | combined freq 6 (`Knights Errant` freq 4 + `Knights-Errant` freq 2; HH-0037/0042/0048/0054/0064) — Malcador's loyalist-Astartes cadre | §7a Case B, §7c |
| `lectitio_divinitatus` | Lectitio Divinitatus | `imperium` | `imperium` | `archive` | freq 1 lore-iconic (HH-0042 *Garro: Weapons of Fate*) — Emperor-as-god cult, foundational Keeler/Garro arc | §7c |
| `legio_ignatum` | Legio Ignatum | `adeptus_titanicus` | `imperium` | `engine` | freq 1 lore-iconic (HH-0061 *Mortis*) — Titan-Legion parity with `legio_tempestus`/`legio_mortis` | §7c |
| `legio_solaria` | Legio Solaria | `adeptus_titanicus` | `imperium` | `engine` | freq 1 lore-iconic (HH-0053 *Titandeath*) — all-female Princeps Titan Legion | §7c |
| `legio_vulpa` | Legio Vulpa | `adeptus_titanicus` | `chaos` | `engine` | freq 1 lore-iconic (HH-0053 *Titandeath*) — traitor Titan Legion, alignment-mismatch-with-parent parity with `legio_mortis` | §7c |
| `selenar_gene_cult` | Selenar Gene-Cult | `imperium` | `imperium` | `archive` | freq 1 lore-iconic (HH-0058 *The Sons of Selenar*) — Lunar gene-engineering cult; absorbiert auch `Selenar` freq 1 (HH-0037) via Alias | §7a/§7c |
| `thunder_warriors` | Thunder Warriors | `imperium` | `imperium` | `historical_canon_layer` | freq 1 lore-iconic (HH-0074 *Dreams of Unity*) — proto-Astartes der Unification Wars; tone-parity mit `squats`/`interex` | §7c |
| `house_devine` | House Devine | `imperial_knights` | `chaos` | `imperial` | freq 1 lore-iconic (HH-0029 *Vengeful Spirit*) — Molech Imperial Knight house, chaos-korrumpiert; parity mit `house_chimaeros`/`house_draconis`/`knights_of_taranis` | §7c |
| `sanguinary_guard` | Sanguinary Guard | `blood_angels` | `imperium` | `imperial` | freq 1 lore-iconic (HH-0063 *Echoes of Eternity*) — Blood-Angels-Honor-Guard-Formation; named-Sub-Formation-Konvention | §7c |

**Strict-freq floor (Dossier-Recommendation):** 1 row (`knights_errant`).
**Curated lore-iconic ceiling:** ~9 (`+lectitio_divinitatus`, `+legio_{ignatum,solaria,vulpa}`,
`+selenar_gene_cult`, `+thunder_warriors`, `+house_devine`, `+sanguinary_guard`).
**Actual promotion:** **9 rows** (alle Dossier-Recommended landings; keine Über- oder Unter-Promotion).

## New faction aliases (6 total)

| surface form | → canonical id | dossier ref | evidence |
| --- | --- | --- | --- |
| `Daemons of Chaos` | `daemons` | §7a Case A | freq 3 HH-0065/0066/0067 (*End and Death* trilogy) — synonymous with Pass-6 `Chaos Daemons` alias; combined effective freq on `daemons` ≥6 |
| `Knights-Errant` | `knights_errant` | §7a Case B / §7c | freq 2 HH-0037/0054 — hyphenation variant of new `Knights Errant` row |
| `Adeptus Mechanicum` | `mechanicus` | §7a Case C | freq 1 HH-0061 — HH formal-name variant of Pass-10 `Mechanicum` alias |
| `Mechanicus` | `mechanicus` | §7a Case C | freq 1 HH-0035 — bare-canonical-name-without-Adeptus variant |
| `Selenar` | `selenar_gene_cult` | §7a/§7c | freq 1 HH-0037 — short-form variant; one row + alias per runbook §4 Surface-Form-Treue |
| `Daemons of Khorne` | `daemons` | §7c | freq 1 HH-0063 — sub-faction-grain flat-aliased to parent; `khorne_daemons`-sub-row deferred |

## Specialcases-Notizen (`faction-policy.json`)

Pro neuer Row ein `specialCases`-Eintrag mit Rationale + parent/alignment/tone-Choice + freq-Evidenz.
Keine neuen `browseRoots` (alle neuen Rows sind Sub-Tier unter existierenden Browse-Roots:
`imperium` für `knights_errant`/`lectitio_divinitatus`/`selenar_gene_cult`/`thunder_warriors`;
`adeptus_titanicus` für die drei Titan-Legionen; `imperial_knights` für `house_devine`;
`blood_angels` für `sanguinary_guard`). Maintainer-Decision nicht erforderlich.

## Cross-Era / Identity-Disziplin (runbook §4)

- **Faction-Rename pattern (Luna Wolves → Sons of Horus precedent):** Pass-10 hat den
  Cross-Era-Faction-Rename-Anker bereits gesetzt; diese Welle re-bestätigt ihn (Sons of Horus
  freq=20 direct in §3 ohne neuen Alias-Bedarf — Pass-10 `Luna Wolves → sons_of_horus` Alias
  wirkt weiter).
- **Mechanicum pre-reformation alias:** Pass-10 `Mechanicum → mechanicus` Alias wird durch
  zwei neue Surface-Form-Varianten ergänzt (`Adeptus Mechanicum`, `Mechanicus`) — ein Anker,
  drei Aliase, kein Row-Split.
- **Daemonen-Umbrella:** `daemons` ist der Anker; `Chaos Daemons` (Pass 6) und neu
  `Daemons of Chaos` (Pass 11) + `Daemons of Khorne` (Pass 11) sind Aliase. Sub-Gott-Faktionen
  (`khorne`, `slaanesh`, `tzeentch`, `nurgle`) bleiben eigene Rows; `Daemons of Khorne` aliasiert
  bewusst zur Umbrella `daemons` statt zur Gott-Faction `khorne`, weil das Surface
  „Daemons of Khorne" die Bloodletter-Truppe (nicht den Gott selbst) bezeichnet — Sub-Faction-Grain
  unter `daemons` ist deferred (Phase-Decision: flat-alias-to-parent).
- **Selenar-Identitäts-Konsolidierung:** Cult-Form (`Selenar Gene-Cult`, HH-0058) ist Canonical;
  short-form `Selenar` (HH-0037) ist Alias. Eine Row + ein Alias statt Two-Row-Split per
  runbook §4-Pattern (longer/more-specific Form Canonical, kürzere Form Alias) — parity mit
  Pass-10 `branne_nev` + `Branne`-Alias.
- **Cross-axis-Konflikte:** §4 Dossier-Output = 0 — keine in dieser Welle. `Selenar` taucht
  in §3 nur auf der Faction-Achse auf (nicht Location); kein Disambig-Risiko.

## Resolver-Trias (vor Commit)

- `npm run test:resolver` → **330 passed, 0 failed** (16 neue Pass-11-Phase-1-Test-Cases, davon
  9 direct-match-on-new-rows + 6 alias-routes + 1 alias-consolidation für `Selenar`).
- `npm run test:resolver-data` → ok (parent/alignment/alias-Targets validiert; alle neuen
  Targets existieren; alignment-Enum-Werte korrekt).
- `npm run test:resolver-coverage` → unverändert von Pass-10 (read-only; berührt
  HH-003..008 erst in Phase 4a).
- `npm run test:apply-override-dry` → ok; Guard: `out-of-range=20, unknown-work=0` (Pass-10-Stand,
  HH-0003..0008 noch nicht angewendet — wird Phase 4a).

## Idempotenz-Check

Vor jedem Insert wurde geprüft, dass der `id`/`name` in `factions.json` noch nicht existiert
und der Surface-Form-Key in `faction-aliases.json` noch nicht belegt ist:

- `knights_errant`: keine bestehende Row, kein bestehender Alias. ok
- `lectitio_divinitatus`: keine bestehende Row, kein bestehender Alias. ok
- `legio_ignatum` / `legio_solaria` / `legio_vulpa`: keine bestehenden Rows. ok
- `selenar_gene_cult`: keine bestehende Row, kein bestehender Alias. ok
- `thunder_warriors`: keine bestehende Row, kein bestehender Alias. ok
- `house_devine`: keine bestehende Row. ok
- `sanguinary_guard`: keine bestehende Row. ok
- Aliase `Daemons of Chaos`/`Daemons of Khorne`/`Knights-Errant`/`Adeptus Mechanicum`/`Mechanicus`/`Selenar`: alle keys neu in `faction-aliases.json`. ok

## Test-Case-Zählung

16 neue Pass-11-Phase-1-Resolver-Test-Cases (≥ 5 Schwelle erfüllt). Pattern:
1 direct-match je neuer Row (9 cases) + 1 alias-route je neuer Alias (6 cases) + 1
alias-consolidation für `Selenar → selenar_gene_cult` parallel zur direct-match auf
`Selenar Gene-Cult` (1 case, mit dem direct-match zusammen gezählt — die Alias-Konsolidierung
ist ein dediziertes Test-Case).

## Deferred / Phase-übergreifende Verweise

- **Phase 3 FK-Bindungen.** Die neuen Faction-Rows sind ab sofort für `primaryFactionId`-Targets
  in `characters.json` verfügbar. Dossier §7b/§7c-Recommendations für Phase 3:
  - `knights_errant` als primaryFactionId für `nathaniel_garro` (existing row — kein FK-Update
    nötig in Phase 1, aber Phase 3 darf neue Knights-Errant-Characters wie `macer_varren`/
    `tylos_rubio` mit `primaryFactionId: knights_errant` anlegen).
  - `house_devine` als primaryFactionId für ggf. neue House-Devine-Characters (Phase 3 Discretion).
  - `sanguinary_guard` als primaryFactionId für `azkaellon` (Sanguinary-Guard-Captain, freq 1
    HH-0063) wenn Phase 3 die Row promotet.
  - `lectitio_divinitatus` als primaryFactionId-Kandidat für `euphrati_keeler` (Saint of the cult,
    Phase 3 Discretion — civilian-cultist primaryFactionId-Convention).
  - `legio_solaria`/`legio_vulpa`/`legio_ignatum` als primaryFactionId-Kandidaten für
    Titan-Princeps-Characters (`mohana_mankata_vi`/`esha_ani_mohana`/`terent_hartekk` —
    Phase 3 picks based on which Legion they fight for).
  - `thunder_warriors` für `dreams_of_unity`-Era-Charaktere (Phase 3 Discretion bei freq-1
    Promotions in HH-0074).
- **Phase 4a Apply-Side.** Die neuen Faction-Rows fließen über `seed-resolver-extensions.ts` in
  die DB (Phase 4a-Concern, nicht hier). Override-Files (`manual-overrides-ssot-hh-003.json`..`008`)
  enthalten die Surface-Forms aus §3 — der Resolver auf Apply-Seite löst sie via diese
  Phase-1-Adds.

## Halt-Disziplin

- Mindestens ein commit pro Phase: ja (dieser commit).
- JSON-Files syntaktisch valide: ja (alle drei seed-data-Files gleich strukturiert wie zuvor,
  nur am Ende ergänzt; trailing commas korrekt entfernt vor den schließenden brackets).
- Architektonische Unsicherheit: nein — keine `Needs decision`-Blocker.
- Write-Scope: Diff ⊆ {`scripts/seed-data/factions.json`, `scripts/seed-data/faction-aliases.json`,
  `scripts/seed-data/faction-policy.json`, `scripts/test-resolver.ts`,
  `sessions/resolver-dossiers/resolver-pass-11-phase-1-report.md`}.
- Co-Author-Trailer: keiner.

## Ready for Phase 2 (Locations)

Locations-Achs-Paket (`scripts/seed-data/locations.json`, `location-aliases.json`, ggf.
`sectors.json`, `scripts/test-resolver.ts`, Phase-2-Statusdatei) ist frei und FK-konsistent —
Phase 1 hat nur Faction-Files berührt, keine Lokationen.
