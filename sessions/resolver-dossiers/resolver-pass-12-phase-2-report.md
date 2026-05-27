# Resolver-Pass 12 — Phase 2 (Locations) Status Report

**Welle:** `ssot-hh-009..014` (HH-0081..HH-0140, 60 Bücher)
**Phase:** `phase-2-locations`
**Scope:** `scripts/seed-data/locations.json`, `scripts/seed-data/location-aliases.json`, `scripts/seed-data/sectors.json`, `scripts/test-resolver.ts`, this status file.
**Status:** done — ready for Phase 3 (Characters).

## Summary

Die umfangreichste Phase-2-Promotion-Welle seit HH-Arc-Beginn (Dossier §7c-Forecast bestätigt).
Landing exakt der Dossier-Recommendation am **mittleren Cut** (~10 Rows + 2 Aliase):
**11 neue Rows** (galaspar strict-freq + 3 Primarch-Birthworlds olympia/barbarus/cthonia + 7 kuratierte
lore-iconic kiavahr/thramas_sector/urgall_depression/occluda_noctis/deshea/alaxxes_nebula/constanix_ii) +
**2 alias adds** (Lycaeus → deliverance Case D, Phall System → phall Case E). Resolver-Trias grün
(385 cases / 0 failures; +13 neue Phase-2-Test-Cases). `sectors.json` **unberührt** — kein neuer
Sektor-FK erforderlich (urgall_depression nutzt bestehenden `obscurus`-Sektor; alle anderen Rows
sector=null in Linie mit der Mehrheit der bestehenden HH-Rows nuceria/nostramo/chondax/tallarn).
Keine `Needs decision`-Blocker.

## New location rows (11 total)

| id | name | sector | gx/gy | tags | dossier ref | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| `galaspar` | Galaspar | `null` | null / null | `[]` | §7c strict-freq | freq 2 HH-0093 *Scions of the Emperor* + HH-0098 *Mortarion: The Pale King* — Mortarion-pre-Heresy-Tyranny-Target ruled by *The Order* |
| `olympia` | Olympia | `null` | null / null | `["iron_warriors"]` | §7c Primarch-birthworld | freq 1 HH-0084 *Perturabo: The Hammer of Olympia* — Perturabo's homeworld, foundational lore |
| `barbarus` | Barbarus | `null` | null / null | `["death_guard"]` | §7c Primarch-birthworld | freq 1 HH-0098 *Mortarion: The Pale King* — Mortarion's homeworld, foundational lore |
| `cthonia` | Cthonia | `null` | null / null | `["sons_of_horus"]` | §7c Primarch-birthworld | freq 1 HH-0097 *Blood of the Emperor* — Horus's homeworld, foundational lore |
| `kiavahr` | Kiavahr | `null` | null / null | `["raven_guard"]` | §7c curated lore-iconic | freq 1 HH-0091 *Corax: Lord of Shadows* — Raven Guard parent-world of moon Deliverance |
| `thramas_sector` | Thramas Sector | `null` | null / null | `["region"]` | §7c curated lore-iconic | freq 1 HH-0124 *Prince of Crows* — Thramas Crusade sector, Dark Angels vs Night Lords campaign theatre |
| `urgall_depression` | Urgall Depression | `obscurus` | null / null | `["region"]` | §7c curated lore-iconic | freq 1 HH-0122 *Scorched Earth* — Isstvan V Dropsite Massacre landing-zone sub-location |
| `occluda_noctis` | Occluda Noctis | `null` | null / null | `["region"]` | §7c curated lore-iconic | freq 1 HH-0099 *Rogal Dorn: The Emperor's Crusader* — region beyond Northern Major Warp Storm, Dorn's pre-Heresy operational frontier |
| `deshea` | Desh'ea | `null` | null / null | `["world_eaters"]` | §7c curated lore-iconic | freq 1 HH-0138 *Angron* — Angron's first scene with the World Eaters / Kharn, apostrophe-stripped slug |
| `alaxxes_nebula` | Alaxxes Nebula | `null` | null / null | `["region"]` | §7c curated lore-iconic (cross-pass) | freq 1 HH-0131 *Wolf King* + cumulative cross-pass freq 2 with Pass-11 HH-0028 *Scars* — White Scars vs Alpha Legion ambush nebula |
| `constanix_ii` | Constanix II | `null` | null / null | `["mechanicus"]` | §7c curated lore-iconic | freq 1 HH-0121 *Corax: Soulforge* — Mechanicum forge world |

**Strict-freq floor (Dossier-Recommendation):** 4 rows (`galaspar` + 3 Primarch-birthworlds).
**Recommended target:** ~10 rows (floor + 6 curated lore-iconic).
**Ceiling:** ~18 rows (Phase-2 takes generous lore-iconic cut).
**Actual promotion:** **11 rows** — landing at the recommended target plus `alaxxes_nebula` (cross-pass
cumulative freq 2 promotes per Dossier §7c rationale — same logic as Phase 2 uses for cross-pass
cumulative evidence). Discretionary freq-1 single-novel campaign worlds (`byzas`, `thoas`, `dulan`,
`gardinaal`, `morningstar`, `tatricala`, `carandiru`, `percepton_primus`, `one_five_four_four`,
`charchera_system`, `salvaguardia`, `diavanos`, `zoah`, `mount_ararat`, `tenebrae_9_50`, `taras_division`,
`garden_of_nurgle`, `carinae`, `zenith`) bleiben unresolved long-tail per Dossier-Recommendation
„leave unresolved unless Phase 2 wants ...".

## New location aliases (2 total)

| surface form | → canonical id | dossier ref | evidence |
| --- | --- | --- | --- |
| `Lycaeus` | `deliverance` | §7a Case D | freq 1 HH-0127 *Ravenlord* — pre-Liberation Mechanicum-era name for the moon that becomes Deliverance after Corax's slave uprising overthrows the Mechanicum overseers; both surface forms appear in the same book (BL crosscuts Lycaeus's hellish past with Deliverance's liberated present). Era-rename onto post-rename canonical row, pattern-parallel zu runbook §4 Luna-Wolves-→-Sons-of-Horus precedent. |
| `Phall System` | `phall` | §7a Case E | freq 1 HH-0125 *The Crimson Fist* — system-grain surface for the warp-route collision-site that `Phall` (freq 1, HH-0109 *Ember of Extinction*, direct → `phall`) names as the battle locale (both books in this wave). Default flat-alias-to-existing-row per budget-conservatism + parity with how other system/world pairs are flat in `locations.json`; `phall_system` separate-row deferred (no other warp-route partition surfaces). |

## Vessel-Konvention (runbook §3 Phase 2)

Diese Welle hat **keine** neuen Vessel-/Space-Hulk-Locations zu promoten. Die §3-Surface-Form-Tabelle
führt keine neuen Vessel-Surface-Forms (Pass-11 hat `Vengeful Spirit` mit `tags:['vessel']` /
`gx,gy:null` verankert; diese Welle re-surface den Vessel nicht). Vessel-Konvention bleibt
dokumentiert: `tags:['vessel']` + `gx/gy:null` — Welt-Geographie schreibt sie nicht auf die Karte.

## Sectors-Disziplin

`sectors.json` **unberührt** in dieser Phase. Begründung pro neuer Row:

- `galaspar`, `olympia`, `barbarus`, `cthonia`, `kiavahr`, `thramas_sector`, `occluda_noctis`,
  `deshea`, `alaxxes_nebula`, `constanix_ii`: sector=null in Linie mit der Mehrheit bestehender
  HH-Rows (nuceria, nostramo, chondax, tallarn, signus_prime, pythos, iydris, armatura, beta_garmon,
  molech, colchis, monarchia, khur, nikaea, deliverance, laeran, aghoru, diamat — alle sector=null).
  Phase-2 wählt konservativ; Sector-FKs können in späteren Wellen via dezidierter Maintainer-Decision
  ergänzt werden (kein per-Pass Auto-Assign).
- `urgall_depression`: sector=`"obscurus"` — Sub-Location von Istvaan V (sector=`"obscurus"`, gx=545,
  gy=210). Sub-Location-Grain hält das Parent-Sektor-Tag konsistent (parallel zu Lion's Gate
  Spaceport/Eternity Gate/Saturnine Gate/Golden Throne/Sanctum Imperialis — alle als Terra-Sub-Locales
  mit sector=`"solar"`).

`thramas_sector` ist **kein** neuer `sectors.json`-Eintrag, sondern eine Location-Row mit
`tags:["region"]` — Sektor-Grain als Location-Tier ist im Resolver bereits etabliert (gothic_sector,
sanctus_reach, eastern_fringe, anaxian_line, alecto, sabbat, medina_corridor, reef_stars). Kein
`browseRoot`-Effekt; `sectors.json` bleibt der Browse-Root-Pool für die Map-UI.

## Resolver-Trias (vor Commit)

- `npm run test:resolver` → **385 passed, 0 failed** (13 neue Pass-12-Phase-2-Test-Cases: 11 direct-match
  auf neue Rows + 2 alias-route). Lauf-Baseline: 372 (post-Phase-1) + 13 = 385.
- `npm run test:resolver-data` → **ok** (10 Checks grün; `location sectors point at existing sectors
  or null` validiert `urgall_depression → obscurus`; alle anderen sector=null; alias targets
  `deliverance` + `phall` existieren als Canonical-Rows; `location coordinates are paired` validiert
  `gx=null,gy=null` für alle neuen Rows).
- `npm run test:resolver-coverage` → unverändert von Pass-11/Phase-1 (read-only; berührt
  HH-009..014 erst in Phase 4a — coverage smoke slug-set ist hh-001..008 + w40k-001..057).
- `npm run test:apply-override-dry` → unverändert von Phase 1; Phase 4a wendet die Welle an.

## Idempotenz-Check

Vor jedem Insert wurde geprüft, dass die `id`/`name`-Paare in `locations.json` noch nicht existieren
und der Surface-Form-Key in `location-aliases.json` noch nicht belegt ist:

- `galaspar`: keine bestehende Row, kein bestehender Alias. ok
- `olympia`: keine bestehende Row, kein bestehender Alias. ok
- `barbarus`: keine bestehende Row, kein bestehender Alias. ok
- `cthonia`: keine bestehende Row, kein bestehender Alias. ok
- `kiavahr`: keine bestehende Row, kein bestehender Alias. ok
- `thramas_sector`: keine bestehende Row, kein bestehender Alias. ok
- `urgall_depression`: keine bestehende Row, kein bestehender Alias. ok
- `occluda_noctis`: keine bestehende Row, kein bestehender Alias. ok
- `deshea`: keine bestehende Row, kein bestehender Alias. ok
- `alaxxes_nebula`: keine bestehende Row, kein bestehender Alias. ok
- `constanix_ii`: keine bestehende Row, kein bestehender Alias. ok
- Alias `Lycaeus`: neuer key in `location-aliases.json`. ok
- Alias `Phall System`: neuer key in `location-aliases.json`. ok

Bestehende `Istvaan V` / `Isstvan V` / `Isstvan III` / `Sabbat Worlds Crusade` / `Vigilus Core` etc.
unverändert; keine Conflict-Mutation.

## Cross-Era / Identity-Disziplin (runbook §4)

- **Lycaeus-↔-Deliverance Era-Rename (Case D).** Anker = post-rename Canonical-Row `deliverance`
  (Pass-10-anchored — HH bootstrap M30 Raven Guard homeworld). HH-Surface-Form `Lycaeus`
  (pre-Liberation Mechanicum-era name) → Alias auf bestehende Row. Pattern-parallel zu Luna-Wolves-
  →-Sons-of-Horus (Pass-10): die heute existierende post-Rename-Canonical-Row ist der Anker;
  era-spezifische Bezeichnungen wandern in `*-aliases.json`. Keine separate `lycaeus`-Row.
- **Phall-System-↔-Phall Grain-Variante (Case E).** Anker = bestehende `phall`-Row (Pass-10-Browse-
  Root). HH-Surface-Form `Phall System` (system-grain Variante) → Alias auf bestehende Row.
  Pattern-parallel zu Pass-6 `Cryptus System → cryptus` (system-grain flat-aliased to existing
  world-grain row). `phall_system` separate-row deferred — keine andere warp-route Partition
  surfaces, simplest grain wins.
- **Cross-axis-Konflikte:** §4 Dossier-Output = **0** — keine in dieser Welle. Phase 2 prüft auch
  retrospektiv: `Nurgle` (Character §3) hat keinen Location-Conflict (`Garden of Nurgle` ist ein
  separate Surface-Form, bleibt unresolved long-tail); `Olympia` (Location) hat keinen Faction- /
  Character-Conflict (kein gleichnamiges Surface auf anderer Achse in §3 / §4); `Galaspar` (Location)
  hat keinen Faction-/Character-Conflict (`The Order` Faction ist separate Surface-Form, bleibt
  unresolved per Phase-1-Recommendation).

## Sub-Location-Grain-Beispiel (urgall_depression)

`urgall_depression` ist die **vierte** Heresy-Sub-Location, die als eigene Row promotet wird, parallel
zur Pass-11-Bloc (Lion's Gate Spaceport / Eternity Gate / Eternity Wall Spaceport / Saturnine Gate /
Mercury Wall / Delphic Battlement / Golden Throne / Sanctum Imperialis — alle Terra-Sub-Locales mit
sector=`"solar"`). Urgall Depression ist ein Istvaan-V-Sub-Locale (sector=`"obscurus"`, parent =
istvaan_v gx=545,gy=210). Sub-Location-Grain bleibt eine Phase-2-Discretion-Entscheidung pro Welle —
das Dossier hat keine harte Schwelle; Pass-12 promotet Urgall Depression weil es ein lore-iconic
Battlefield-Sub-Locale des Dropsite-Massacres ist (Salamanders/Iron Hands/Raven Guard Landing-Zone).

## Test-Case-Zählung

**13 neue Pass-12-Phase-2-Resolver-Test-Cases** (≥ 4 Schwelle erfüllt — Schwellen-Faktor 3,25×).
Pattern:

1. `direct match - Resolver-Pass 12 Galaspar` — strict-freq direct-match.
2. `direct match - Resolver-Pass 12 Olympia` — Primarch-birthworld direct-match.
3. `direct match - Resolver-Pass 12 Barbarus` — Primarch-birthworld direct-match.
4. `direct match - Resolver-Pass 12 Cthonia` — Primarch-birthworld direct-match.
5. `direct match - Resolver-Pass 12 Kiavahr` — curated lore-iconic direct-match.
6. `direct match - Resolver-Pass 12 Thramas Sector` — sector-grain direct-match (Location-Tier).
7. `direct match - Resolver-Pass 12 Urgall Depression` — Sub-Location-Grain direct-match.
8. `direct match - Resolver-Pass 12 Occluda Noctis` — curated lore-iconic direct-match.
9. `direct match - Resolver-Pass 12 Desh'ea` — apostrophe-stripped slug direct-match (parity zu Ka'Bandha).
10. `direct match - Resolver-Pass 12 Alaxxes Nebula` — cross-pass cumulative-freq direct-match.
11. `direct match - Resolver-Pass 12 Constanix II` — curated lore-iconic direct-match.
12. `alias - Resolver-Pass 12 Lycaeus routes to deliverance` — Era-Rename alias-route (Case D).
13. `alias - Resolver-Pass 12 Phall System routes to phall` — System-Grain alias-route (Case E).

## Deferred / Phase-übergreifende Verweise

- **Phase 3 FK-Bindungen.** Die elf neuen Location-Rows sind ab sofort als Location-Surface-Form-Targets
  in den Override-Files lookup-fähig. Phase 3 (Characters) berührt `locations.json` nicht — nur
  `characters.json` + `character-aliases.json`. Keine FK-Updates aus Phase 2 erforderlich.
- **Phase 4a Apply-Side.** Die elf neuen Location-Rows fließen über `seed-resolver-extensions.ts` in
  die DB (Phase 4a-Concern, nicht hier). Override-Files (`manual-overrides-ssot-hh-009.json`..`014`)
  enthalten die Surface-Forms aus §3 — der Resolver auf Apply-Seite löst sie via diese Phase-2-Adds
  (inkl. der zwei neuen Aliase). Phase 4a muss die domain-aware Trias-Batch-Ranges um die sechs
  `{ domain: "hh", n: "009" }`..`{ domain: "hh", n: "014" }`-Tupel erweitern.
- **Deferred discretionary freq-1 Single-Novel Campaign Worlds.** Die in der Summary aufgelisteten ~19
  freq-1-Single-Novel-Surface-Forms bleiben unresolved long-tail per Dossier §7c „leave unresolved
  unless Phase 2 wants ...". Falls in zukünftigen Wellen re-surfacing (z. B. weitere
  Tallarn-/Tatricala-/Mount-Ararat-Bücher) → re-evaluate.
- **Deferred Sub-Power-Daemon-Realms (`Garden of Nurgle`).** Bleibt unresolved per Dossier-Empfehlung —
  Warp-realm-Grain ist im Resolver nicht etabliert. Analog zu Pass-11's `Ruinstorm`-Diskussion
  (Warp-phenomenon-nicht-Location). Falls Future-Wellen zusätzliche Sub-Power-Daemon-Realm-Surfaces
  bringen (Khorne's Brass Citadel, Tzeentch's Crystal Maze, Slaanesh's Palace of Pleasure), kann
  eine kuratierte Sub-Realm-Promotion erwogen werden (separates Architect-Statement).
- **Deferred Sub-Faction-Grain (`Carinae` / `Zenith`).** Bleibt unresolved per Dossier-Empfehlung —
  Raven-Guard-Sub-Cell-Grain (parallel zu Carinae Sodality Faction) nicht etabliert. Falls in
  zukünftigen Corax-Wellen Carinae-Sub-Locales re-surfacen → re-evaluate.

## Halt-Disziplin

- Mindestens ein commit pro Phase: ja (dieser commit).
- JSON-Files syntaktisch valide: ja (alle drei seed-data-Files gleich strukturiert wie zuvor,
  nur am Ende ergänzt; trailing commas korrekt entfernt vor den schließenden brackets;
  test:resolver-data hat sector-FKs + alias-targets + coordinate-pairing validiert).
- Architektonische Unsicherheit: nein — keine `Needs decision`-Blocker. Alle Dossier-§7d-Punkte
  (Phall ↔ Phall System Grain, Lycaeus-Alias-Call, Forward-Ref-Guard) wurden in-phase entschieden
  per Dossier-Recommendation (Phall-System-Alias zur bestehenden Row; Lycaeus-Alias zur bestehenden
  Row; Forward-Ref-Guard-Check ist Phase-4a-Concern, nicht hier).
- Write-Scope: Diff ⊆ {`scripts/seed-data/locations.json`, `scripts/seed-data/location-aliases.json`,
  `scripts/seed-data/sectors.json`, `scripts/test-resolver.ts`,
  `sessions/resolver-dossiers/resolver-pass-12-phase-2-report.md`}. **`sectors.json` blieb
  faktisch unberührt** (im Scope deklariert pro runbook §3 Phase 2 „ggf. `sectors.json` (nur falls
  eine neue Location einen Sector-FK braucht)" — kein neuer FK erforderlich).
- Co-Author-Trailer: keiner.

## Ready for Phase 3 (Characters)

Characters-Achs-Paket (`scripts/seed-data/characters.json`, `character-aliases.json`,
`scripts/test-resolver.ts`, Phase-3-Statusdatei) ist frei und FK-konsistent — Phase 2 hat nur
Location-Files berührt. Dossier §7a + §7b + §7c forecasten **die leichteste Phase-3-Promotion-Welle
des HH-Arcs** (Pass-11 absorbierte jeden freq-2 Spine für den main HH-Cast): 2 Alias-Adds (Typhon →
typhus Case B, Alexis Pollux → alexis_polux Case C) + 2 freq-2 new rows (kurtha_sedd + steloc_aethon)
+ ~9 strong curated freq-1 lore-iconic new rows (barabas_dantioch + sor_talgron + ingethel +
kandawire + amar_astarte + ilya_ravallion + hasik_khan + holguin + redloss + hrend + nurgle), mit
Ceiling ~25. Phase-3 muss `primaryFactionId` für jede neue Row auf das Phase-1-Faction-Set zeigen
(rangdan + hrud verfügbar; word_bearers + ultramarines + iron_warriors + dark_angels + white_scars +
daemons + raven_guard + space_wolves + sons_of_horus + iron_hands etc. via Pass-10/-11-Anchors).
