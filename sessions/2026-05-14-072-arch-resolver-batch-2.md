---
session: 2026-05-14-072
role: architect
date: 2026-05-14
status: implemented
slug: resolver-batch-2
parent: 2026-05-12-063-arch-resolver-50-books
links:
  - 2026-05-11-061-arch-ssot-loop
  - 2026-05-12-063-arch-resolver-50-books
  - 2026-05-12-069-impl-resolver-apply-evidence
  - 2026-05-13-070-arch-faction-policy-hygiene
  - 2026-05-13-071-arch-loop-driver
commits: []
---

# Resolver-Pass 2 — Surface-Form-Crystallization für ssot-w40k-006..010

## Goal

Schließe die Resolver-Schleife für die zweite 50er-Welle der Authority-Schicht (`ssot-w40k-006..010`, 50 Bücher). Konkret: erweitere `factions.json` / `locations.json` / `characters.json` um die in dieser Welle belastbar-häufigen Surface-Forms (≥ 2 plus eine Cowork-kuratierte Liste lore-iconischer freq=1-Promotionen), führe den in OQ2 / 070-Follow-Up festgehaltenen **`heretic_astartes`-Mid-Knoten** unter `chaos` ein (inklusive Reparent von 7 required vorhandenen Heresy-Traitor-Legionen plus optional `alpha_legion` + Pflanzung der fehlenden Death Guard / Emperor's Children + Aufnahme der neuen Renegate-Chapters Black Legion / Crimson Slaughter / Violators / Fabius-Bile-Coterie / Unfleshed), pflege die post-rename Aeldari-/Drukhari-Aliase ein, und erweitere `apply-override.applyCollections` so, dass `external_book_id`-Referenzen über Batch-Grenzen hinweg gegen `works.external_book_id` aufgelöst werden (die seit 004 entstandenen Cross-Batch-Omnibus-Refs landen damit als echte `work_collections`-Rows). Abschluss: Re-Apply `ssot-w40k-001..010` gegen die DB, damit Counts + Detail-Pages den neuen Stand reflektieren.

Adresse: laufende Resolver-Pflege pro 50er-Schwelle aus OQ4/OQ5-Closure-Note in 069; OQ2-(b) `heretic_astartes`-Mid-Knoten (post-070-Maintainer-Diskussion); das im 063-Tracked-for-future markierte Cross-Batch-Collection-Resolution. **Keine Schema-Migration**, **keine UI-Arbeit**, **kein neues Test-Framework**. Loop-Driver (Brief 071) und dieser Brief sind orthogonal — der Driver bleibt unangetastet, der Resolver-Pass läuft auf einem separaten Branch.

## Context

**Stand 2026-05-14, post-loop-w40k-010.** 100 Bücher in der Authority-Schicht. Letzte 50 Bücher (`ssot-w40k-006..010`) wurden in einem 5-Iteration-Loop-Sprint am 2026-05-13/14 geschrieben (siehe `sessions/ssot-loop-log.md`); CC hat `db:apply-override -- --batch=ssot-w40k-NNN` für jede Iteration ausgeführt, daher liegen die 10 zweiten Batches als `work_*` Rows in der DB, **aber gegen das alte Resolver-Set aus 069**. Damit fallen die neuen Surface-Forms heute fast komplett in den `book_details.notes`-Surface-Forms-Block und nicht in echte Junction-Chips. Detail-Page rendert für die 50 neuen Bücher dünn; das passt zur erwarteten Pause-und-Resolver-Sequenz aus Brief 061.

**Post-070-Faction-Policy aktiv.** Browse-Roots aus `scripts/seed-data/faction-policy.json` (16 Browse-Roots, `imperium` als Grand-Alignment-Exception); `factions.json` audit-patched (Chaos-Rename, 5 Heresy-Traitor-Legionen reparent auf `chaos`, 8 Loyalist-Astartes-Chapters + `grey_knights` reparent auf `adeptus_astartes`); `seed-resolver-extensions` Faction-Insert ist Upsert auf JSON-Spalten; `brain:lint` neue Kategorie "Faction policy". Dieser Brief **erweitert** die Policy: `heretic_astartes` wird ein Browse-Root, parallel zu `adeptus_astartes` aber auf der Chaos-Seite (siehe 070-Notes: "Was wir bewusst NICHT entscheiden" hat den heretic_astartes-Split offengelassen — Maintainer-Entscheidung 2026-05-13 hat ihn jetzt geschoben).

**Empirische Surface-Form-Verteilung über die zweite 50er-Welle.** Aggregat aus den 5 Override-JSONs (`manual-overrides-ssot-w40k-006.json` … `010.json`):

| Achse      | Distinct | Total | Direct-Match heute | Alias-Match heute | NEW / unresolved |
| ---------- | -------- | ----- | ------------------ | ----------------- | ---------------- |
| Factions   | 93       | 333   | 32 (34.4%)         | 3 (3.2%)          | 58 (62.4%)       |
| Locations  | 57       | 110   | 11 (19.3%)         | 0                 | 46 (80.7%)       |
| Characters | 111      | 177   | 8 (7.2%)           | 0                 | 103 (92.7%)      |

Bemerkung zur Hit-Rate: Faction-Direct-Match ist deutlich höher als in der ersten Welle (063-Befund: 9 von 43, 20.9 %), weil die erste Resolver-Welle die belastbaren Mehrfachgenannten (Inquisition, Commissariat, Ultramarines, Imperial Guard via alias, Tanith First-and-Only, Verghastite Ghosts, Belladon, Phantine Air Corps, Iron Warriors, Blood Pact, Sons of Sek …) bereits eingearbeitet hat. Locations und Characters sind dagegen niedriger als 063, weil 006..010 deutlich breiter durch das Setting fächert (Ultramar / Maelstrom / Fenris / Mars / Imperium Nihilus statt überwiegend Sabbat-Worlds-Crusade).

**Maintainer-Architektur-Entscheidungen aus Cowork-AskUserQuestion (2026-05-14, this session).**

- **Scope:** 063-Vollform + `heretic_astartes`-Mid-Knoten + Cross-Batch-Collection-Resolution. Eine Welle reicht; kein Aufsplitten in mehrere Mini-Briefs.
- **Aeldari/Drukhari:** Aliase reichen. `Dark Eldar` / `Drukhari` / `Aeldari` → `eldar`. Craftworld-internals (`Iyanden` / `Biel-Tan` / `Commorragh`) bleiben Locations. Kein eigener `drukhari`-Browse-Root, kein vollständiger `aeldari_craftworld`/`aeldari_drukhari`-Split.
- **Frames & Vessels:** Imperium Nihilus / Great Rift / Elara's Veil und benannte Schiffe (Casus Belli / Solace) werden normale `locations`-Rows mit `gx: null`, `gy: null`, plus Disambiguation in `tags` (Imperium Nihilus `['era_frame']`, Great Rift ergänzt `era_frame`, Elara's Veil `['region', 'era_frame']`, Schiffe `['vessel']`). Kein neues `locations.kind`-Schema-Feld.
- **Character-Threshold:** ≥ 2 als Default, plus eine in den Notes enumerierte Liste lore-iconischer freq=1-Promotionen (Primarchs, Daemon-Primarchs, Living-Saints, named Daemon-Princes, Series-Iconic-POVs).

**Sequenz zu offenen Briefs.** Brief 071 (Loop-Driver) bleibt offen; sein Output ist ein Skript, kein Daten-Apply — orthogonal zum Resolver-Pass. Brief 061 (Standing-Loop) ist auf 100er-Pause (`ssot-w40k-011` würde per Pre-Check loud stoppen, weil 100 % 50 == 0); nach Resolver-Apply darf Maintainer Brief 061 für `ssot-w40k-011` wieder triggern. Resolver-Brief-2 läuft auf einem **eigenen Branch** (`session-072-resolver-batch-2` oder ähnlich), nicht auf `session-063-resolver-50-books`.

## Constraints

### Reference-Daten-Extensions

#### `scripts/seed-data/factions.json` — Erweitern

**Neuer Mid-Knoten:**

- `heretic_astartes`: `{ id: "heretic_astartes", name: "Heretic Astartes", parent: "chaos", alignment: "chaos", tone: null, glyph: null }` — Browse-Root-fähig (siehe `faction-policy.json`-Update unten). Cowork-Lore-Recommendation: GW's offizielle Post-2017-Sprachregelung für die Sammelkategorie der Chaos-Astartes. Parallel zu `adeptus_astartes` (das parent=`imperium` trägt — `heretic_astartes` trägt parent=`chaos`).

**Reparent existierender Heresy-Traitor-Legionen** (heute alle parent=`chaos` nach 070-Pass): `sons_of_horus`, `night_lords`, `thousand_sons`, `world_eaters`, `word_bearers`, `iron_warriors`, `lords_of_unholy_host` werden required reparented auf `parent: "heretic_astartes"`. `alpha_legion` ist optional wegen Cabal-Twist-Lore (siehe Open Question unten); wenn CC sie reparented, gilt für sie dieselbe Parent-/Alignment-Regel. **Wichtig:** `word_bearers` und `iron_warriors` führen heute *kein* explizites `alignment`-Feld; sie verlassen sich auf `inferAlignmentFromTree` in `scripts/seed.ts:225` (`parent === "chaos"` → `chaos`). Nach Reparent auf `heretic_astartes` greift die Inferenz nicht mehr und sie würden auf `neutral` kippen. Daher: **alle 7 required reparenteten Rows plus optional `alpha_legion`, falls gewählt, bekommen ein explizites `"alignment": "chaos"`** als Teil des Patches (auch wenn das Feld vorher fehlte). Tone bleibt unverändert. **Sieben required parent-Updates + optional `alpha_legion` + ggf. alignment-Backfill, keine ID-Renames.**

**Neue Heretic-Astartes-Rows** (parent=`heretic_astartes`, **explizit** `"alignment": "chaos"` setzen — `inferAlignmentFromTree` schaut nur 1 Level hoch (`parent === "chaos"`), `parent: "heretic_astartes"` würde sonst auf `neutral` fallen; siehe Note zum Reparent oben):

| Surface-Form        | Freq        | Vorgeschlagene ID       | Notiz                                                                                                                   |
| ------------------- | ----------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Black Legion        | 3           | `black_legion`          | Abaddon's-Legion; Foundational Post-Heresy-Faction (heute nicht in `factions.json`, obwohl lore-zentral).                |
| Death Guard         | 1 (iconic)  | `death_guard`           | Foundational Heresy-Traitor-Legion (heute fehlt komplett in `factions.json` neben Emperor's Children — Lücke aus Seed). |
| Emperor's Children  | 2           | `emperors_children`     | Foundational Heresy-Traitor-Legion (heute fehlt; selbe Lücke).                                                          |
| Crimson Slaughter   | 2           | `crimson_slaughter`     | Renegate-Chapter, Death-Knell-Antagonist.                                                                               |
| Violators           | 1 (iconic)  | `violators`             | Slaaneshi-Astartes-Warband, Daemon-World-Antagonist (Charybdia's Court).                                                |
| Fabius Bile's Coterie | 1 (iconic) | `fabius_bile_coterie` | Emperor's-Children-Splinter unter Bile; Lucius-Trilogie-Antagonist. **Canonical-Name MIT Possessiv-Apostroph** — exakt so taucht die Surface-Form in `manual-overrides-ssot-w40k-009.json:247` auf, deshalb landet sie als Direct-Match (kein Alias-Fallback nötig). CC darf snake-case-ID wählen wie passt; Name-Feld bleibt `"Fabius Bile's Coterie"`. Defensiv: optional Alias `"Fabius Bile Coterie": "fabius_bile_coterie"` für Possessiv-loses Surface. |
| Unfleshed           | 3           | `unfleshed`             | Daemonculaba-Failed-Marines (Honsou's Pet-Army). Edge-Case (kein Pure-Blood Astartes) — Cowork-Recommendation hält ihn unter heretic_astartes wegen Astartes-Herkunft; CC darf bei Zweifel direkt unter `chaos` aufhängen und begründen. |
| Dark Mechanicum     | 1 (iconic)  | `dark_mechanicum`       | Eigentlich nicht Astartes — parent=`chaos`, NICHT `heretic_astartes`. Foundational Chaos-Mechanicus-Faction.            |

**Neue Loyalist-Astartes-Rows.** Alle bekommen **explizit** `"alignment": "imperium"` (gleicher Inferenz-Grund wie bei Heretic-Astartes: `inferAlignmentFromTree` matcht `parent === "imperium"` direkt, aber `parent: "imperial_fists"` / `"space_wolves"` / `"adeptus_astartes"` fallen sonst auf `neutral`). Parent wie unten angegeben:

| Surface-Form     | Freq        | Vorgeschlagene ID  | Notiz                                                                                                                                                |
| ---------------- | ----------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| White Scars      | 1 (iconic)  | `white_scars`      | First Founding; foundational. Heute fehlt komplett.                                                                                                  |
| Iron Hands       | 1 (iconic)  | `iron_hands`       | First Founding; foundational. Heute fehlt.                                                                                                            |
| Crimson Fists    | 1 (iconic)  | `crimson_fists`    | Imperial-Fists-Successor; Rynn's-World-Lore-Anker. parent=`imperial_fists` (CC darf alternativ direkt unter `adeptus_astartes` aufhängen und begründen). |
| Iron Snakes      | 1 (iconic)  | `iron_snakes`      | Foundational Greek-coded successor (Abnett-Continuity).                                                                                              |
| Silver Skulls    | 1           | `silver_skulls`    | White-Scars-Successor, Prognosticar-Doktrin.                                                                                                          |
| Dark Hunters     | 1           | `dark_hunters`     | White-Scars-Successor, Phobian-Heimatwelt.                                                                                                            |
| Mentors          | 1 (iconic)  | `mentors`          | Foundational successor (Mentor Legion). Spear-of-the-Emperor-Lore-Anker.                                                                              |
| Emperor's Spears | 1           | `emperors_spears`  | Imperium-Nihilus-Frontier-Chapter (Spear-of-the-Emperor primary protagonist).                                                                         |
| Star Scorpions   | 1           | `star_scorpions`   | Imperium-Nihilus-Frontier-Chapter (gleicher Frame wie Emperor's Spears). Marginal; CC darf weglassen wenn er die Frequenz nicht für ausreichend hält. |
| Celestial Lions  | 1           | `celestial_lions`  | Ill-fated-by-Inquisition-Chapter, Spear-of-the-Emperor-Frame. Marginal; gleicher Hinweis wie Star Scorpions.                                          |
| Wulfen           | 1 (iconic)  | `wulfen`           | Space-Wolves-Sub-Faction (13th-Company-Wulfen). parent=`space_wolves`.                                                                                |

**Neue Chaos-Gott-Rows** (parent=`chaos`, alignment=`chaos`):

| Surface-Form | Freq | Vorgeschlagene ID | Notiz                                                                                                |
| ------------ | ---- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| Khorne       | 7    | `khorne`          | Foundational. Pflicht.                                                                               |
| Slaanesh     | 4    | `slaanesh`        | Foundational. Pflicht.                                                                               |
| Tzeentch     | 3    | `tzeentch`        | Foundational. Pflicht.                                                                               |
| Nurgle       | 2    | `nurgle`          | Foundational. Pflicht. (Schließt das 4-Götter-Set; alle drei bisherigen sind ebenfalls in dieser Welle.) |

**Neue Imperium-Mechanicus-Rows** (parent=`mechanicus`, alignment=`imperium`):

| Surface-Form        | Freq | Vorgeschlagene ID    | Notiz                                                                                                                  |
| ------------------- | ---- | -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Adeptus Titanicus   | 3    | `adeptus_titanicus`  | Titan-Legion-Umbrella; Browse-Root-fähig — siehe `faction-policy.json`-Update.                                          |
| Legio Invicta       | 1    | `legio_invicta`      | parent=`adeptus_titanicus`. Titanicus-Lore-Anker.                                                                       |
| Legio Tempestus     | 1    | `legio_tempestus`    | parent=`adeptus_titanicus`. Titanicus-Lore-Anker.                                                                       |
| Legio Metalica      | 1    | `legio_metalica`     | parent=`adeptus_titanicus`. Imperator-Lore-Anker.                                                                       |
| Pallidus Mor        | 1    | `pallidus_mor`       | parent=`adeptus_titanicus`. Warlord-Lore-Anker (demi-legio, aber lore-tier eines Legios).                              |
| Imperial Hunters    | 1    | `imperial_hunters`   | parent=`adeptus_titanicus`. Warlord-Lore-Anker.                                                                         |
| Imperial Knights    | 1 (iconic) | `imperial_knights` | parent=`mechanicus`. Faction-Tier — eigene Lore-Klasse, nicht Astartes nicht Titan. Kein `parent=null`-Ausweg in dieser Runde, damit `brain:lint` ohne zusätzliche Policy-Exception grün bleibt. |
| Skitarii            | 1    | `skitarii`           | parent=`mechanicus`.                                                                                                    |

**Neue Imperium-Imperial-Rows** (parent=`imperium`, alignment=`imperium`):

| Surface-Form        | Freq | Vorgeschlagene ID       | Notiz                                                                                                                  |
| ------------------- | ---- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Officio Assassinorum| 2    | `officio_assassinorum`  | Imperium-Agency. Browse-Root-fähig (siehe `faction-policy.json`).                                                       |
| Vindicare Temple    | 1    | `vindicare_temple`      | parent=`officio_assassinorum`.                                                                                          |
| Eversor Temple      | 1    | `eversor_temple`        | parent=`officio_assassinorum`.                                                                                          |
| Callidus Temple     | 1    | `callidus_temple`       | parent=`officio_assassinorum`.                                                                                          |
| Culexus Temple      | 1    | `culexus_temple`        | parent=`officio_assassinorum`.                                                                                          |
| Rogue Traders       | 2    | `rogue_traders`         | Cross-Setting-Faction-Klasse.                                                                                           |
| Adeptus Arbites     | 2    | `adeptus_arbites`       | Imperium-Police.                                                                                                        |
| Navis Nobilite      | 1    | `navis_nobilite`        | Imperium-Navigator-Klasse.                                                                                              |
| Squats              | 1    | `squats`                | Aus-Setting-Removed sub-faction; preserve for fidelity. parent=`imperium`, alignment=`imperium`. CC darf Notiz dazu im Tone-Feld setzen. |

**Neue Xenos-Rows:**

| Surface-Form        | Freq | Vorgeschlagene ID         | Parent         | Alignment | Notiz                                                                |
| ------------------- | ---- | ------------------------- | -------------- | --------- | -------------------------------------------------------------------- |
| Hive Fleet Leviathan| 2    | `hive_fleet_leviathan`    | `tyranids`     | `xenos`   | Foundational hive-fleet.                                              |
| Hive Fleet Kraken   | 1    | `hive_fleet_kraken`       | `tyranids`     | `xenos`   | Foundational hive-fleet.                                              |
| Harlequins          | 1 (iconic) | `harlequins`        | `eldar`        | `xenos`   | Eldar-Sub-Faction; lore-iconisch. `alignment` ist Grand-Alignment (Imperium / Chaos / Xenos / Neutral), nicht moralische Haltung — Harlequins sind Eldar-Faction. |
| Fire Caste          | 1    | `fire_caste`              | `tau`          | `xenos`   | Tau-Sub-Caste. Grand-Alignment = Xenos (gleiche Begründung).          |
| Ethereal Caste      | 1    | `ethereal_caste`          | `tau`          | `xenos`   | Tau-Sub-Caste. Grand-Alignment = Xenos (gleiche Begründung).          |
| C'tan               | 1 (iconic) | `ctan`              | `necrons`      | `xenos`   | Foundational Necron-Tier-Wesen (Star-Gods); lore-iconisch.            |

**Neue Astra-Militarum-Rows** (parent=`astra_militarum`, alignment=`imperium`):

| Surface-Form        | Freq | Vorgeschlagene ID         | Notiz                                                                |
| ------------------- | ---- | ------------------------- | -------------------------------------------------------------------- |
| Arkan Confederates  | 1    | `arkan_confederates`      | Fehervari-Dark-Coil-Regiment; Phaedra-Lore-Anker.                    |

**Neue Chaos-Adjacent-Rows** (parent=`chaos`, alignment=`chaos`):

| Surface-Form              | Freq | Vorgeschlagene ID         | Notiz                                                                                                                  |
| ------------------------- | ---- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Bloodborn                 | 3    | `bloodborn`               | Khornate cultist horde (Chapter's-Due-Antagonist). Cultist nicht Astartes — parent=`chaos`.                            |
| Cult of Chaos             | 2    | `cult_of_chaos`           | Generic-Cult-Faction.                                                                                                  |
| Roaring Blades            | 1    | `roaring_blades`          | Traitor-Guard-Surface-Form distinct from Bloodborn / Blood Pact / Sons of Sek / Zoican Host.                          |
| Salinas Liberation Front  | 3    | `salinas_liberation_front`| Imperium-internal-Traitor-Cult (McNeill Killing-Ground).                                                              |
| Punishers                 | 1    | `punishers`               | Chaos-Warband, Dark-Hunters-Umbra-Sumus-Antagonist.                                                                    |

**Fallen Angels:**

| Surface-Form | Freq | Vorgeschlagene ID | Parent     | Alignment | Notiz                                                                                                                  |
| ------------ | ---- | ----------------- | ---------- | --------- | ---------------------------------------------------------------------------------------------------------------------- |
| Fallen Angels| 1    | `fallen_angels`   | `chaos`    | `chaos`   | Foundational, lore-iconisch. Lore-ambig (Astelan's-Claim: Dark Angels are traitors, Fallen are loyalists) — pragmatisch parent=`chaos` mit Notiz. Kein `parent=null`-Ausweg in dieser Runde, damit die Faction-Policy-Lints nicht durch neue Browse-Root-/Exception-Pflege erweitert werden müssen. |

**Faction-Policy-Update.** `scripts/seed-data/faction-policy.json` `browseRoots` array um drei Einträge erweitern: `heretic_astartes`, `adeptus_titanicus`, `officio_assassinorum`. Plus `specialCases`-Notiz für `heretic_astartes`: "Mid-Knoten unter `chaos` analog zu `adeptus_astartes` unter `imperium`. Hosts Heresy-Traitor-Legionen + Renegate-Chapters." Plus `specialCases`-Notiz für `adeptus_titanicus`: "Titan-Legion-Umbrella unter `mechanicus`. Hosts Legio Invicta / Tempestus / Metalica / Pallidus Mor / Imperial Hunters." Plus `specialCases`-Notiz für `officio_assassinorum`: "Assassinorum-Umbrella mit 4 Tempeln (Vindicare / Eversor / Callidus / Culexus)."

#### `scripts/seed-data/locations.json` — Erweitern

Alle neuen Einträge tragen `gx: null`, `gy: null`. Bestehende Cartographer-Welten bleiben unverändert.

| Surface-Form        | Freq        | Vorgeschlagene ID         | sector / hint                          | tags                  |
| ------------------- | ----------- | ------------------------- | -------------------------------------- | --------------------- |
| Ultramar            | 10          | `ultramar`                | Sector-Region. Macragge / Calth / Iax umbrella. | `['sector', 'region']` |
| Imperium Nihilus    | 3           | `imperium_nihilus`        | Era-Frame post-Great-Rift.             | `['era_frame']`        |
| Great Rift          | 1 (iconic)  | `great_rift` *(mutate existing row)* | **Kein neuer Row.** Der existierende `great_rift`-Eintrag (`locations.json:278–289`, `name: "The Great Rift"`, `gx: 540`, `gy: 275`, `tags: ["chaos", "indomitus"]`, `warp: true`) bleibt — der Resolver matcht Direct-on-Name (`src/lib/resolver/index.ts:55`), würde einen separaten `great_rift_chasm`-Alias also nie greifen lassen. Stattdessen: `era_frame` zur tags-Liste ergänzen (Resultat: `["chaos", "indomitus", "era_frame"]`). Pin bleibt, Era-Frame-Semantik wird zusätzlich. CC patcht den existierenden Row in-place. | s.o. |
| Maelstrom           | 3           | `maelstrom`               | Warp-Region. Parallel zu Eye of Terror. | `['warp']`             |
| Webway              | 3           | `webway`                  | Eldar-Infrastructure-Region.            | `['region']`           |
| Hydra Cordatus      | 3           | `hydra_cordatus`          | Storm-of-Iron-Welt.                    | `[]`                   |
| Killing Ground      | 3           | `killing_ground`          | Salinas-Sub-Region (McNeill).          | `[]`                   |
| Salinas             | 3           | `salinas`                 | sector=null. Killing-Ground-Hauptwelt. | `[]`                   |
| Commorragh          | 2           | `commorragh`              | Drukhari-Stadt im Webway. sector=null. | `[]`                   |
| Iax                 | 2           | `iax`                     | Ultramar-Agri-Welt. sector=null.       | `[]`                   |
| Casus Belli         | 1           | `casus_belli`             | Imperator-Class-Titan-as-Location.     | `['vessel']`           |
| Solace              | 1           | `solace`                  | Death-Guard-Grand-Cruiser.             | `['vessel']`           |
| Rynn's World        | 1 (iconic)  | `rynns_world`             | Crimson-Fists-Heimatwelt.              | `[]`                   |
| Arx Tyrannus        | 1           | `arx_tyrannus`            | Crimson-Fists-Fortress-Monastery auf Rynn's World. sector=null. | `[]` |
| Necromunda          | 1 (iconic)  | `necromunda`              | Hive-Welt; foundational.                | `[]`                   |
| Black Reach         | 1           | `black_reach`             | 5th-Edition-Starter-Welt.               | `[]`                   |
| Fenris              | direct ✓    | —                         | Already in `locations.json`.            | —                      |
| Elara's Veil        | 1           | `elaras_veil`             | Imperium-Nihilus-Nebula (Spear-of-the-Emperor). | `['region', 'era_frame']`   |
| Tsadrekha           | 1           | `tsadrekha`               | Shroud-of-Night-Hive-Welt.              | `[]`                   |
| Darkand             | 1           | `darkand`                 | White-Scars-Honour-World.               | `[]`                   |
| Ikara IX            | 1           | `ikara_ix`                | Blood-of-Iax-Mining-Welt.               | `[]`                   |
| Nicomedua           | 1           | `nicomedua`               | Imperator-Forge-Welt.                   | `[]`                   |
| Sycorax             | 1           | `sycorax`                 | Swords-of-Calth-Necron-Front-Welt.       | `[]`                   |
| Opis                | 1           | `opis`                    | Seventh-Retribution-Welt.                | `[]`                   |
| Phaedra             | 1           | `phaedra`                 | Fire-Caste-Death-Welt.                  | `[]`                   |
| Equixus             | 1           | `equixus`                 | Lord-of-the-Night-Welt.                  | `[]`                   |
| Ithaka              | 1           | `ithaka`                  | Iron-Snakes-Heimatwelt.                  | `[]`                   |
| Karybdis            | 1           | `karybdis`                | Iron-Snakes-Fortress-Mond.               | `[]`                   |
| Reef Stars          | 1           | `reef_stars`              | Iron-Snakes-Operations-Region. sector=null. | `['region']`        |
| Kaelor              | 1           | `kaelor`                  | Eldar-Craftworld.                        | `[]`                   |
| Phobian             | 1           | `phobian`                 | Dark-Hunters-Heimatwelt.                | `[]`                   |
| Ras Hanem           | 1           | `ras_hanem`               | Dark-Hunters-Campaign-Welt.              | `[]`                   |
| Temple of Shades    | 1           | `temple_of_shades`        | Assassinorum-Execution-Force-Site.       | `[]`                   |
| Valoria Quintus     | 1           | `valoria_quintus`         | Silver-Skulls-Portents-Welt.             | `[]`                   |
| Eastern Fringe      | 1           | `eastern_fringe`          | Relentless-Patrol-Region.                | `['region']`           |
| Orestes             | 1           | `orestes`                 | Titanicus-Forge-Welt.                    | `[]`                   |
| Vernailis           | 1           | `vernailis`               | Sons-of-Dorn-Campaign-Welt.              | `[]`                   |
| Black Library       | 1           | `black_library_place`     | Eldar-Webway-Archiv. ID-Hinweis: nicht mit Black-Library-the-publisher verwechseln. Sub-Region zu Webway, sector=null. | `['region']` |
| Iyanden             | 1           | `iyanden`                 | Eldar-Craftworld. Achtung: Surface-Form auch in `factions.faction-aliases.json` (siehe unten) — Welt vs. Faction werden im Override separat ausgewiesen, der Welt-Eintrag landet hier. | `[]` |
| Duriel              | 1           | `duriel`                  | Valedor-Battle-Welt.                     | `[]`                   |
| Dolumar IV          | 1           | `dolumar_iv`              | Fire-Warrior-Welt.                       | `[]`                   |
| Sigmatus            | 1           | `sigmatus`                | Pawns-of-Chaos-Welt.                     | `[]`                   |
| Torvendis           | 1           | `torvendis`               | Daemon-World-Welt (Lady Charybdia's).    | `[]`                   |
| Piscina IV          | 1           | `piscina_iv`              | Angels-of-Darkness-Welt.                  | `[]`                   |
| Enothis             | 1           | `enothis`                 | Double-Eagle-Sabbat-Welt.                | `[]`                   |
| Medusa              | direct ✓    | —                         | Already in `locations.json`.             | —                      |
| Hive Trazior        | 1           | `hive_trazior`            | Necromunda-Hive-Stadt; `sector: null` mit Notiz, dass es auf Necromunda liegt. | `[]` |
| Isle of St Capilene | 1           | `isle_of_st_capilene`     | Death-Knell-Sub-Welt.                    | `[]`                   |

freq=1-Long-Tail-Locations (~10), die CC weglassen darf, wenn die Lore-Belastbarkeit dünn ist: alle Welten, die nur in einer einzigen Synopsis vorkommen UND keine eigene Subseries-Anker-Funktion haben. CC's Schätzung; im Report begründen wenn er etwas auslässt.

#### `scripts/seed-data/characters.json` — Erweitern

Bestehende 65 Einträge aus 063 bleiben unverändert. Neue Einträge (Cowork-Vorschlag; CC darf `primaryFactionId` korrigieren):

**Frequency ≥ 2 (16 Einträge):**

| Name                | Freq | Vorgeschlagene ID         | primary_faction_id      | Notiz                                                          |
| ------------------- | ---- | ------------------------- | ----------------------- | -------------------------------------------------------------- |
| Mykola Shonai       | 4    | `mykola_shonai`           | `imperial_navy`         | Nightbringer-Pavonis-Lord-Gouverneurin.                        |
| Marneus Calgar      | 4    | `marneus_calgar`          | `ultramarines`          | Chapter-Master Ultramarines, series-iconic.                    |
| Cato Sicarius       | 4    | `cato_sicarius`           | `ultramarines`          | 2nd-Co-Captain, series-iconic.                                 |
| Leto Barbaden       | 3    | `leto_barbaden`           | `astra_militarum`       | Killing-Ground-Welt-Gouverneur.                                |
| Daron Nisato        | 3    | `daron_nisato`            | `astra_militarum`       | Killing-Ground-Welt-Funktionär.                                |
| Sylvanus Thayer     | 3    | `sylvanus_thayer`         | `astra_militarum`       | Killing-Ground-Welt-Funktionär.                                |
| Shas'O Or'es'ka'an  | 3    | `shaso_oreskaan`          | `tau`                   | Tau-Commander, Courage-and-Honour-Antagonist.                  |
| Aun'rai             | 3    | `aunrai`                  | `tau`                   | Ethereal-Caste, Water-Caste-Diplomat.                          |
| Lord Winterbourne   | 3    | `lord_winterbourne`       | `astra_militarum`       | Imperial-Guard-Regimentskommandant (Courage and Honour).       |
| Tigurius            | 3    | `tigurius`                | `ultramarines`          | Chief-Librarian Ultramarines, series-iconic.                    |
| Cassius             | 3    | `cassius`                 | `ultramarines`          | Master-of-Sanctity Ultramarines, series-iconic.                |
| Forrix              | 3    | `forrix`                  | `iron_warriors`         | Iron-Warriors-Triumvirat (Storm-of-Iron).                       |
| Kroeger             | 3    | `kroeger`                 | `iron_warriors`         | Iron-Warriors-Triumvirat.                                       |
| Barban Falk         | 3    | `barban_falk`             | `iron_warriors`         | Warsmith (Storm-of-Iron).                                       |
| Berossus            | 3    | `berossus`                | `iron_warriors`         | Warsmith.                                                       |
| Magos Naicin        | 3    | `magos_naicin`            | `mechanicus`            | Hydra-Cordatus-Vault-Guardian.                                  |

**Lore-iconische freq=1-Promotionen (~20 Einträge, Cowork-kuratiert):**

| Name                       | Freq | Vorgeschlagene ID            | primary_faction_id     | Lore-Begründung                                                       |
| -------------------------- | ---- | ---------------------------- | ---------------------- | --------------------------------------------------------------------- |
| Roboute Guilliman          | 1    | `roboute_guilliman`          | `ultramarines`         | Primarch; foundational.                                               |
| Saint Celestine            | 1    | `saint_celestine`            | `sisters_of_battle`    | Living-Saint; foundational.                                            |
| Khârn the Betrayer         | 1    | `kharn_the_betrayer`         | `world_eaters`         | Iconic World-Eaters-Champion.                                          |
| Magnus the Red             | 1    | `magnus_the_red`             | `thousand_sons`        | Primarch / Daemon-Primarch.                                           |
| Lucius the Eternal         | 1    | `lucius_the_eternal`         | `emperors_children`    | Soulthief; Series-Iconic.                                              |
| Fabius Bile                | 1    | `fabius_bile`                | `fabius_bile_coterie`  | Iconic Emperor's-Children-Sorcerer (Cabal-Lead).                       |
| Abaddon the Despoiler      | 1    | `abaddon_the_despoiler`      | `black_legion`         | Warmaster of Chaos; foundational.                                      |
| Ahzek Ahriman              | 1    | `ahzek_ahriman`              | `thousand_sons`        | Iconic Thousand-Sons-Arch-Sorcerer.                                    |
| Eldrad Ulthran             | 1    | `eldrad_ulthran`             | `eldar`                | Iconic Eldar-Farseer.                                                  |
| Logan Grimnar              | 1    | `logan_grimnar`              | `space_wolves`         | Great-Wolf / Chapter-Master Space Wolves.                              |
| Ferrus Manus               | 1    | `ferrus_manus`               | `iron_hands`           | Primarch; foundational. (`iron_hands` ist neu in dieser Welle.)        |
| Astelan                    | 1    | `astelan`                    | `fallen_angels`        | Foundational Fallen-Angels-Char (Angels-of-Darkness-Anker).            |
| Belial                     | 1    | `belial`                     | `dark_angels`          | Master der Deathwing; iconic.                                          |
| Darnath Lysander           | 1    | `darnath_lysander`           | `imperial_fists`       | Captain 1st Co, iconic.                                                |
| Lukas the Strifeson        | 1    | `lukas_the_strifeson`        | `space_wolves`         | Iconic Space-Wolves-Prankster (Lukas the Trickster).                   |
| Duke Sliscus               | 1    | `duke_sliscus`               | `eldar`                | Iconic Drukhari-Kabal-Lord (Serpent of Commorragh). Alias-Note: Drukhari → eldar bis zum Faction-Split. |
| Zso Sahaal                 | 1    | `zso_sahaal`                 | `night_lords`          | Iconic First-Captain Night-Lords; Lord-of-the-Night-Anker.             |
| Bronislaw Czevak           | 1    | `bronislaw_czevak`           | `ordo_xenos`           | Foundational Inquisitor (Atlas-Infernal).                              |
| Yriel                      | 1    | `yriel`                      | `eldar`                | Iconic Iyanden-Autarch (Valedor-Anker). Notes: `iyanden` als faction deferred — Yriel hängt am `eldar`-Umbrella. |
| Vorx                       | 1    | `vorx`                       | `death_guard`          | First-Captain Death-Guard (Lords-of-Silence-POV). `death_guard` ist neu in dieser Welle. |
| Anuradha                   | 1    | `anuradha`                   | `emperors_spears`      | Chapter-Serf-POV (Spear-of-the-Emperor); first long-form helot-POV im Layer. `primaryFactionId` ist die Astartes-Faction des Patrons. |
| Amadeus Kaias Incarius     | 1    | `amadeus_kaias_incarius`     | `mentors`              | Mentor → Emperor's-Spears-Anker (Spear-of-the-Emperor).               |

**Weitere freq=1-Cast** (Captain-Becket, Princeps Gearhart, Lexandro d'Arquebus, Janus Darke, Lady Charybdia etc. — siehe Empirie-Aggregat in den Notes): CC's Wahl ob er sie ebenfalls promoted; Default ist „bleibt in book_details.notes". Empfehlung Cowork: nur promoten, wenn (a) named-POV-Anker einer Series-iconischen Geschichte und (b) `primaryFactionId` ohne Recherche eindeutig. Im Report begründen, was promoted wurde und was nicht.

#### Alias-JSONs erweitern

**`scripts/seed-data/faction-aliases.json`** (neue Einträge):

```json
{
  "Dark Eldar": "eldar",
  "Drukhari": "eldar",
  "Heretic Astartes": "heretic_astartes",
  "Mentor Legion": "mentors",
  "Chaos Undivided": "chaos",
  "Biel-Tan": "eldar",
  "Iyanden": "eldar"
}
```

Bestehende Einträge bleiben unverändert (Imperial Guard / Astra Militarum / Eldar / Aeldari / Tau Empire etc.). Sortierung egal; Idempotent gehalten (kein Doppel-Eintrag).

**Begründung Craftworld-Aliase.** Craftworld-internals (`Iyanden` / `Biel-Tan` / `Commorragh`) bleiben Locations (siehe Frames-&-Vessels-Entscheidung in Context). Die zwei Craftworlds tauchen aber in Override-Faction-Listen als Surface-Forms auf (Biel-Tan in `manual-overrides-ssot-w40k-009.json:65`, Iyanden in W40K-Layer als Yriel's Heimat-Faction-Mention). Damit der Faction-Resolver sie nicht als unresolved durchlässt, kollabieren beide Aliase auf `eldar` (Achs-Disambiguation läuft im Override: Faction-Liste → eldar, Location-Liste → der jeweilige `iyanden`/`biel_tan`-Place — Location-Eintrag für `biel_tan` wird nur dann gebraucht, wenn er als Welt in der Locations-Liste eines Buchs auftaucht; siehe Open Question zu Iyanden für die analoge Disambiguation).

**`scripts/seed-data/location-aliases.json`** (neue Einträge):

```json
{
  "Great Rift": "great_rift",
  "Cicatrix Maledictum": "great_rift"
}
```

(Hinweis: `"The Great Rift"` ist bereits Direct-Match auf den existierenden Row und gehört NICHT in die Aliases — siehe Resolver-Regel `byName` vor `aliases` in `src/lib/resolver/index.ts:55`. Wir aliasen nur die zwei restlichen Surface-Varianten — Possessiv-loses „Great Rift" und das lateinische „Cicatrix Maledictum" — auf denselben Ziel-Row.)

**`scripts/seed-data/character-aliases.json`** (neue Einträge — bisher `{}` aus 063):

```json
{
  "Khârn": "kharn_the_betrayer",
  "Kharn": "kharn_the_betrayer",
  "Lukas the Trickster": "lukas_the_strifeson",
  "Jackalwolf": "lukas_the_strifeson",
  "Serpent of Commorragh": "duke_sliscus"
}
```

CC darf weitere Aliase einfügen, wenn er sie aus der Empirie motiviert (z.B. "Inquisitor Czevak" → `bronislaw_czevak` falls Synopsen das Surface-Format führen).

### `apply-override.ts` — Cross-Batch-Collection-Resolution

**Heutiger Stand.** `applyCollections` (in `scripts/apply-override.ts:796–833`) operiert auf der globalen `roster.collections`-Liste aus `book-roster.json` (zentrale Cross-Book-Beziehungsliste mit Tupeln `{ collectionExternalId, contentExternalId, displayOrder, confidence, basis }`). Heute wird `inScope` so gefiltert, dass **beide** Endpunkte (`collectionExternalId` UND `contentExternalId`) im aktuellen Apply-Batch liegen müssen. Cross-Batch-Beziehungen (z.B. W40K-0040 *Founding* in Batch 004 → constituents aus Batch 003) werden dabei verworfen — daher sind heute alle Junction-Rows für solche Omnibusse fehlend.

(Aus dem Brief-/UI-Vokabular: `containedIn` und `contains` aus dem Drizzle-Schema (`src/db/schema.ts:681–682`) sind die Read-Side-Relations für DetailPanel-Queries, NICHT die Datenquelle des Apply-Pfads. Die Apply-Side liest aus `roster.collections`.)

**Refactor.** `inScope` wird auf "**mindestens ein** Endpunkt im aktuellen Batch" gelockert. Beide Endpunkte werden dann zu UUIDs aufgelöst — primär aus `externalIdToUuid` (Batch-Local-Map), bei Miss per `SELECT id FROM works WHERE external_book_id = ?` über die *gesamte* `works`-Tabelle. Resultierende Junction-Row: `{ collectionWorkId: <uuid for collectionExternalId>, contentWorkId: <uuid for contentExternalId> }` — Spaltenrichtung muss zum Drizzle-Schema (`work_collections.collection_work_id` = Container, `work_collections.content_work_id` = Constituent) passen. Die DB-Summary am Ende von `apply-override.ts` muss dieselbe Relevanz-Logik verwenden: `work_collections` zählt Rows, bei denen `collectionWorkId` **oder** `contentWorkId` im Batch liegt; sonst verschwinden nach dem Cross-Batch-Refactor content-seitige Batch-Treffer aus den per-Batch-Counts.

Wenn ein Endpunkt nach beiden Lookups unresolved bleibt (Forward-Ref auf einen späteren noch nicht applied Batch), wird die Junction-Row übersprungen mit einer **loud-Warning** ins Log (`[applyCollections] skipping unresolved external_book_id=W40K-NNNN in batch=ssot-w40k-NNN`). Der nächste Re-Run nach Apply des späteren Batches schließt die Lücke automatisch — das existierende Idempotenz-Pattern (`delete rows where collection_work_id IN batchUuids OR content_work_id IN batchUuids, then insert`) bleibt korrekt, weil jeder Re-Apply die Junction-Rows mit Endpunkt im Batch komplett wegputzt und neu schreibt.

**Sanity-Hinweis zur Spaltenrichtung.** Im echten Code (`apply-override.ts:824–830`) ist die Map korrekt: `collectionWorkId: externalIdToUuid.get(c.collectionExternalId)`, `contentWorkId: externalIdToUuid.get(c.contentExternalId)`. Diese Mapping-Richtung muss erhalten bleiben; das Refactor ersetzt nur den Lookup-Mechanismus (Map → Map-with-DB-Fallback), nicht die Zuordnung.

**Doppelt-aufgelistete Constituents** (Pattern „duplicate_omnibus" aus W40K-0050 ≡ W40K-0056, W40K-0055 ≡ W40K-0057, W40K-0061 ≡ W40K-0062): jeder Omnibus bleibt eigener Container; beide Omnibus-Rows kriegen separate Junction-Sets auf dieselben Constituents. Kein Merge in dieser Runde — die UX-Frage, ob Duplikat-Omnibusse als eine logische Einheit zusammengefasst werden sollen, ist ein eigener Mini-Brief (siehe Out-of-Scope).

**Reapply-Order beachten.** Apply-Reihenfolge bleibt 001 → 002 → … → 010 (chronologisch). Forward-Refs (z.B. ein Omnibus in 004 referenziert einen Constituent aus 007) werden erst nach Batch-007-Apply resolvable; in den sequentiellen Re-Apply-Pass ab 001 würden sie zuerst loud-warned übersprungen und beim späteren 008-Re-Apply-Schritt automatisch nachgetragen (weil der dann sowohl die 008-Batch-UUIDs als auch die jetzt vorhandenen 007-Endpunkte sieht). Damit der Re-Apply-Pass in einem Durchlauf konvergiert, läuft die Schleife 001..010 zweimal — oder die Reihenfolge ist so gewählt, dass alle Cross-Refs nach hinten zeigen. **Cowork-Entscheidung:** Single-Pass 001..010 reicht für diese Runde, weil die belegten Cross-Batch-Refs (siehe `book-roster.json.collections`) ausschließlich Backward zeigen (Omnibusse erscheinen nach ihren Constituents in der Erscheinungs-Reihenfolge). CC verifiziert das mit einem Pre-Pass-Check auf `roster.collections`: für jeden Eintrag `compare batch(collectionExternalId) >= batch(contentExternalId)`; bei Forward-Refs Maintainer warnen und entscheiden, ob Two-Pass nötig.

### `seed-resolver-extensions.ts` — Erweitern

Der existierende Idempotent-Seed-Skript aus 063 (mit dem 070-Upsert-Patch) wird um die neuen Faction/Location/Character-Rows erweitert (siehe Tabellen oben). Pattern bleibt: `INSERT … ON CONFLICT (id) DO UPDATE SET …` für `factions` (Upsert auf JSON-Spalten — `name`, `parent_id`, `alignment`, `tone`, `glyph` werden überschrieben, weil Reparenting der Heresy-Traitor-Legionen genau das ist); `INSERT … ON CONFLICT (id) DO NOTHING` für neue `locations` und `characters`. **Einzige Location-Ausnahme:** `great_rift` wird nach dem Insert-Pfad selektiv per DB-Update mutiert, damit `tags` in Supabase ebenfalls `era_frame` enthält. Das ist bewusst kein genereller Location-Upsert: nur `id = "great_rift"`, nur `tags`, idempotent mit Preserve bestehender Tags (`chaos`, `indomitus`) plus `era_frame`. CLI bleibt `npm run db:seed-resolver-extensions`. Loud-Logging pro Step inklusive `great_rift updated/skipped`.

Der Datei-Header von `scripts/seed-resolver-extensions.ts` ist im selben Patch auf den heutigen Betriebsmodus zu aktualisieren: Brief 072 erlaubt CC ausdrücklich, `npm run db:seed-resolver-extensions` auszuführen; die alte Aussage "Maintainer-trigger only — CC does not run this against prod-Supabase" ist stale.

**Ausführungs-Mode** (gleicher Pattern wie 069). CC führt sowohl `npm run db:seed-resolver-extensions` als auch das Re-Apply 001..010 selbst aus, gegen die Supabase-Postgres die CC bereits per `.env.local` erreicht. Es gibt kein separates Maintainer-Trigger-Gate; der Maintainer hat mit dem Annehmen dieses Briefs implizit Approval für die DB-Mutation gegeben. CC dokumentiert pre-/post-Apply-Counts und Dry-Run-Counts im Report. Bei unerwarteten Fehlern (z.B. FK-Violations, Apply bricht ab) stoppt CC und meldet zurück — kein "weiter mit dem nächsten Batch trotz Fehler".

### Re-Apply 001..010

Nach `db:seed-resolver-extensions` (kein db:migrate nötig — keine Migration in diesem Brief):

```bash
npm run db:seed-resolver-extensions
npm run db:apply-override -- --batch=ssot-w40k-001
npm run db:apply-override -- --batch=ssot-w40k-002
npm run db:apply-override -- --batch=ssot-w40k-003
npm run db:apply-override -- --batch=ssot-w40k-004
npm run db:apply-override -- --batch=ssot-w40k-005
npm run db:apply-override -- --batch=ssot-w40k-006
npm run db:apply-override -- --batch=ssot-w40k-007
npm run db:apply-override -- --batch=ssot-w40k-008
npm run db:apply-override -- --batch=ssot-w40k-009
npm run db:apply-override -- --batch=ssot-w40k-010
```

Idempotenz durch delete-then-insert pro Junction; Re-Run wischt + schreibt komplett neu.

**Counts-Methodik (statt fix gepinnter Schätzwerte).** Die harte Obergrenze für die post-Apply-Counts ist die Summe aller Surface-Form-Occurrences in den Override-JSONs `manual-overrides-ssot-w40k-001..010`. Aus 069-Report (Post-Apply 001..005) + 006..010-Aggregat:

| Achse           | 069-Post-Apply (001..005) | 006..010-Total-Occurrences | Theoretisches Maximum nach Re-Apply 001..010 |
| --------------- | ------------------------- | -------------------------- | -------------------------------------------- |
| `work_factions` | 318                       | 333                        | 651                                          |
| `work_locations`| 129                       | 110                        | 239                                          |
| `work_characters`| 363                      | 177                        | 540                                          |

Die echte post-Apply-Range wird durch `npm run test:apply-override-dry` *vor* dem DB-Apply zementiert (siehe Tests-Section unten): das Dry-Skript zählt resolved-Occurrences nach dem aktuellen Resolver-Set und das ist genau die Obergrenze, die der DB-Apply danach erreichen wird (modulo distinct-collapse — die DB-Counts können geringfügig kleiner sein, wenn dieselbe Faction mehrmals in einem Buch genannt wird und die Junction nur einmal pro (work_id, faction_id) eingefügt wird; vgl. UNIQUE-Constraint in `work_factions`). CC liefert im Report **drei Zeilen pro Achse**: 069-Baseline, Dry-Run-Post-Resolver, Tatsächlich-DB-Post-Apply. Wenn DB-Counts deutlich (>10%) unter Dry-Counts liegen, ist das ein Hinweis auf ein Apply-Bug — Maintainer-Aufmerksamkeit nötig. Wenn DB-Counts in der Größenordnung 060..065 Faction-Occurrences pro Welle fallen (was 069-Quote-pro-Welle nahekommt), ist alles gut.

### Verify

- `npm run lint` grün.
- `npm run typecheck` grün.
- `npm run brain:lint -- --no-write` grün — neue „Faction policy"-Kategorie (070) sollte ohne neue Warnings durchgehen (alle neuen Factions haben parent + alignment gesetzt; Browse-Roots sind in `faction-policy.json` aufgeführt; dieser Brief erlaubt keine neuen `parent: null`-Factions ohne gleichzeitige Policy-Erweiterung).
- **Resolver-Test-Trias auf 001..010 erweitert.** Heute sind `scripts/apply-override-dry.ts:33`, `scripts/test-resolver-coverage.ts:22` und (vermutlich gleichlautend) `scripts/test-resolver-data-integrity.ts` hartcodiert auf `BATCHES = ["001"..."005"]`. CC erweitert das Array auf `["001"..."010"]` — oder, falls eleganter, macht das Array per CLI-Flag (`--batches=001..010`) oder Env-Var parametrisierbar. Acceptance bleibt: alle drei Skripte grün gegen 001..010.
- `npm run test:resolver-data` grün.
- `npm run test:resolver-coverage` grün — Smoke-Counts pro Welle im Report.
- `npm run test:apply-override-dry` grün — `resolved junction counts` für 001..010 sind die Obergrenze für den nachfolgenden DB-Apply.
- `npm run test:resolver` grün — Surface-Form-Resolver-Suite aus 063 fortgeführt + neue Cases für die Aeldari-/Drukhari-Aliase (Drukhari → eldar etc.), für `heretic_astartes`-Direct-Match, für mindestens 3 der neuen Faction-Aliase (Mentor Legion, Chaos Undivided, Heretic Astartes) und für mindestens 2 der neuen lore-iconischen Character-Promotionen.
- **Cross-Batch-Collection-Dry-Test.** CC ergänzt entweder `apply-override-dry.ts` um eine Roster-Collection-Resolution-Sektion oder schreibt ein eigenes Mini-Skript, das aus `book-roster.json.collections` für die ssot-w40k-Domain die Tupel filtert, in denen mindestens ein Endpunkt zur Domain gehört, und prüft: (a) wie viele wären unter dem alten "both endpoints in same batch"-Regime resolvable (Baseline), (b) wie viele wären unter dem neuen Regime resolvable (Single-Pass 001..010), (c) konkrete Beispiele für resolved Cross-Batch-Refs (z.B. W40K-0040 *Founding* → W40K-0024/0025/0026). Im Report dokumentieren.
- **Detail-Page-Smoke gegen 6 Bücher** nach Re-Apply, Counts im Report pro Achse:
  - `/buch/the-anarch` — Regression-Check (sollte unverändert bleiben gegen 069-Counts 9/3/11).
  - `/buch/calgars-fury` — Ultramarines primary, exercises Cross-Batch (W40K-0089).
  - `/buch/the-emperors-gift` — Multi-Inquisition (Grey Knights + Ordo Malleus + Space Wolves antagonist).
  - `/buch/storm-of-iron` — Iron Warriors primary unter neuem `heretic_astartes`-Mid-Knoten.
  - `/buch/celestine` — Sororitas primary + Imperium-Nihilus-Frame.
  - `/buch/spear-of-the-emperor` — Mentors / Emperor's Spears / Star Scorpions / Celestial Lions.
- **Sanity-Check `work_collections`** nach Re-Apply: `SELECT COUNT(*) FROM work_collections;` plus eine konkrete Spotcheck-Query gegen einen Omnibus mit Cross-Batch-Refs, z.B. `SELECT * FROM work_collections WHERE collection_work_id = (SELECT id FROM works WHERE external_book_id = 'W40K-0040');` — sollte mindestens 3 Constituent-Rows zeigen (Founding-Omnibus → W40K-0024/0025/0026 aus Batch 003). Im Report dokumentieren.

## Out of scope

- **Brief 071 (Loop-Driver-Skript).** Bleibt offen, läuft auf seinem eigenen Branch / nimmt seinen eigenen Weg. Resolver-Brief und Loop-Driver berühren sich nicht (Driver wrappt 061 in N Subsessions; Resolver schreibt Daten, nicht Skripte).
- **Brief 061 (Standing-Loop) fortsetzen.** Brief 061 bleibt auf 100er-Pause (W40K-0091..0100 sind geschrieben; nächste Iteration `ssot-w40k-011` würde per Pre-Check loud stoppen weil 100 % 50 == 0). Nach Resolver-Apply darf Maintainer den Loop wieder anstoßen.
- **Logical-Work-ID / `superseded_by` Schema-Erweiterung** für die Duplicate-Omnibus-Paare (W40K-0050 ≡ W40K-0056 etc.). Eigenes Mini-Brief — vermutlich erst relevant, wenn die Ask-the-Archive-Recommender-UX die Duplikate aktiv stören. Heute werden beide Omnibus-Rows als separate Container appliziert und das ist akzeptabel.
- **`canonicity`-Facet** für Heretic-Tomes-Cluster (W40K-0064..0067) und ähnliche Black-Library-Imprint-Klassifikationen. Eigenes Vokabular-Brief.
- **`primaris`-/`firstborn`-Facet** für die Marine-Generation-Distinktion (Swords of Calth + Blood of Iax + Spear of the Emperor sind die ersten Primaris-Anker im Layer). Eigenes Vokabular-Brief.
- **`dark_imperium_era`-Facet** für die zeitliche Verortung post-Great-Rift. Stattdessen wird Imperium Nihilus per `tags: ['era_frame']`, Great Rift per zusätzlichem `era_frame` auf den bestehenden Tags und Elara's Veil per `tags: ['region', 'era_frame']` auf `locations` indiziert, was für die Resolver-Runde reicht.
- **HH-Domain-Resolver.** Heute leer (`ssot-w40k-001..010` ist reines W40K). HH-Resolver-Brief kommt, wenn der Loop in die HH-Domain überrollt (vermutlich nach `ssot-w40k-015` oder ähnlich).
- **`characters.lexicanumUrl`-/`notes`-Anreicherung** für die in dieser Welle gepflanzten Reference-Rows. Eigenes Anreicherungs-Brief (analog zum 063-Tracked-for-future).
- **Hierarchy-Rollup-Filter** in der UI (parentId-recursive). Mit `heretic_astartes` als neuem Mid-Knoten gewinnt das an UX-Relevanz — bleibt aber Phase-5- / Hub-Polish- bzw. OQ9-Cockpit-Brief.
- **Cockpit-Audit-Route** `/buch/[slug]/audit` aus OQ9. Trigger ist erst nach Resolver-Apply diese Welle: 100 Bücher applied liegen jetzt vor (matched OQ9-Trigger), aber das Cockpit-Brief ist eigene Session, nicht Teil der Resolver-Schleife.
- **Hardcover-Rating-Promotion** (OQ6). Eigener Brief.
- **`emperors_children` / `death_guard`-Lücken-Backfill für die ersten 50 Bücher.** Beide Factions tauchen auch in `ssot-w40k-001..005` als Surface-Form-Mentions auf (Sabbat-Anthologies + Cain-Background); die Re-Apply-Sweep dieses Briefs schließt die Junction-Lücke automatisch, sobald die canonical-Rows gepflanzt sind. Kein separater Backfill-Pass nötig.

## Acceptance

The session is done when:

- [ ] **`scripts/seed-data/factions.json`** erweitert: **1 neuer Mid-Knoten (`heretic_astartes`) + 53 neue Faction-Rows = 54 neue Rows insgesamt** (Verteilung: 7 Heretic-Astartes-Kinder + 1 Dark Mechanicum unter chaos + 11 Loyalist-Astartes-Chapters + 4 Chaos-Götter + 8 Mechanicus-Sub-Factions + 9 Imperium-Imperial-Rows + 6 Xenos-Rows + 1 Astra-Militarum-Regiment + 5 Chaos-Adjacent-Warbands + 1 Fallen Angels). **Plus 7 required parent-Updates** an existierenden Heresy-Traitor-Legionen (`sons_of_horus`, `night_lords`, `thousand_sons`, `world_eaters`, `word_bearers`, `iron_warriors`, `lords_of_unholy_host`) **plus optional `alpha_legion`** — siehe Open Question zur Cabal-Twist-Lore. Lore-Bugs (Death Guard / Emperor's Children komplett fehlend) sind geschlossen. **Alle reparented Heretic-Astartes-Kinder + alle neuen Heretic-Astartes-Rows tragen ein explizites `"alignment": "chaos"` (kein Inferenz-Fallback auf `neutral`); alle neuen Loyalist-Successors tragen explizites `"alignment": "imperium"`.** CC darf einzelne "marginal" markierte freq=1-Rows (Star Scorpions, Celestial Lions) im Report mit Begründung weglassen; das senkt das Total entsprechend. Die hier genannten Zählungen sind required.
- [ ] **`scripts/seed-data/locations.json`** erweitert: **45 neue Locations** (alle Einträge der Tabelle in §Reference-Daten-Extensions außer Fenris und Medusa, die bereits direct-match resolvable sind, UND außer Great Rift, dessen existierender Row in-place mutiert wird statt einer neuen Anlegung). Plus **1 In-place-Mutation** an `great_rift` (Tag `era_frame` hinzufügen). Alle neuen Rows tragen `gx: null`, `gy: null`. Imperium-Nihilus trägt `tags: ['era_frame']`; Elara's-Veil trägt `tags: ['region', 'era_frame']`; das mutierte `great_rift` kriegt `era_frame` zusätzlich zu seinen bestehenden Tags. Casus Belli / Solace tragen `tags: ['vessel']`. Cartographer-Pin-Welten (gx/gy gesetzt) bleiben sonst unverändert. CC darf die ~10 marginalsten freq=1-Long-Tail-Locations (eine reine Synopsis-Mention ohne Subseries-Anker) weglassen — im Report begründen, welche genau und warum. Required-Floor: alle Rows mit freq ≥ 2 und alle als "iconic" gelabelten freq=1-Einträge in der Tabelle.
- [ ] **`scripts/seed-data/characters.json`** erweitert: **16 freq≥2-Promotionen + 22 lore-iconische freq=1-Promotionen = 38 neue Charakter-Rows** (CC darf einzelne der freq=1-Iconics ablehnen, wenn `primaryFactionId` ohne Recherche nicht eindeutig ist; im Report begründen). Bestehende 65 Einträge unverändert.
- [ ] **`scripts/seed-data/faction-aliases.json`** erweitert um Drukhari/Dark Eldar/Heretic Astartes/Mentor Legion/Chaos Undivided. Bestehende Aliase unverändert.
- [ ] **`scripts/seed-data/location-aliases.json`** erweitert um Great-Rift-Aliase.
- [ ] **`scripts/seed-data/character-aliases.json`** erweitert um Khârn/Lukas-Trickster/Jackalwolf/Sliscus-Aliase (bisher `{}`).
- [ ] **`scripts/seed-data/faction-policy.json`** erweitert: `heretic_astartes`, `adeptus_titanicus`, `officio_assassinorum` als Browse-Roots; `specialCases`-Notizen ergänzt.
- [ ] **`scripts/apply-override.ts` refactored**: `applyCollections` lockert `inScope` auf "mindestens ein Endpunkt im Batch" und löst beide Endpunkte primär aus `externalIdToUuid`, bei Miss per DB-Lookup auf `works.external_book_id` über die gesamte Tabelle. Spaltenrichtung unverändert (`collectionWorkId` = Container, `contentWorkId` = Constituent). Forward-Ref-Misses werden loud-warned und übersprungen (idempotent durch Re-Run nachholbar). CC verifiziert per Pre-Pass auf `roster.collections`, dass alle Cross-Batch-Refs Backward zeigen (Single-Pass reicht); falls Forward-Refs auftauchen, im Report flaggen. Per-Batch-Summary zählt `work_collections` über `collectionWorkId IN batch OR contentWorkId IN batch`, nicht nur über Container-Seite.
- [ ] **`scripts/seed-resolver-extensions.ts` erweitert**: alle neuen Factions/Locations/Characters per Upsert (Factions) bzw. `ON CONFLICT DO NOTHING` (neue Locations / Characters) seedbar. Zusätzlich selektiver, idempotenter Update-Step für `great_rift.tags` (`era_frame` ergänzen, bestehende Tags bewahren). Datei-Header auf Brief-072-Ausführungsmodus aktualisiert; die stale "Maintainer-trigger only"-Aussage ist entfernt/ersetzt.
- [ ] **`scripts/test-resolver.ts`** ergänzt: neue Test-Cases für die Aeldari-/Drukhari-Aliase, für `heretic_astartes`-Direct-Match, für mindestens drei der neuen Faction-Aliase (Mentor Legion, Chaos Undivided, Heretic Astartes), plus mindestens zwei Test-Cases pro Resolver-Funktion gegen die neuen lore-iconischen Promotionen.
- [ ] **Resolver-Test-Trias** (`scripts/apply-override-dry.ts`, `scripts/test-resolver-coverage.ts`, `scripts/test-resolver-data-integrity.ts`) auf 001..010 erweitert — entweder Batch-Array verbreitert oder per CLI-Flag/Env-Var parametrisierbar gemacht. Alle drei grün gegen 001..010.
- [ ] **Cross-Batch-Collection-Dry-Test** (Erweiterung von `apply-override-dry.ts` oder eigenes Mini-Skript) — zeigt Baseline-vs-Refactor-Resolution-Rates und mindestens ein konkretes Cross-Batch-Beispiel (W40K-0040 → 0024/0025/0026 oder ähnlich) im Report.
- [ ] **`npm run db:seed-resolver-extensions` ausgeführt** durch CC; Output (Counts pro Tabelle, +new / +skipped / `great_rift` updated/skipped) im Report.
- [ ] **Re-Apply 001..010 ausgeführt** durch CC (10× `npm run db:apply-override -- --batch=ssot-w40k-00X`, sequentiell). Pro Welle die per-Batch-Counts im Report; pre- und post-Apply-DB-Counts (`work_factions`, `work_locations`, `work_characters`, `work_collections`) als Tabelle; Vergleich gegen `test:apply-override-dry`-Resolved-Counts. Für `work_collections` zusätzlich globalen Gesamtcount reporten, damit Cross-Batch-Rows mit nur content-seitigem Batch-Bezug sichtbar bleiben.
- [ ] **Detail-Page-Smoke** gegen die 6 Bücher (the-anarch / calgars-fury / the-emperors-gift / storm-of-iron / celestine / spear-of-the-emperor). Pro Buch: Chip-Counts pro Achse + ggf. screenshots-by-eyes-only-Bestätigung im Report.
- [ ] **`work_collections`-Spotcheck** gegen W40K-0040 (Founding Omnibus) und mindestens einen 8er-Batch-Omnibus (z.B. W40K-0061 Iron-Warriors-Omnibus) im Impl-Report.
- [ ] **`npm run lint` + `npm run typecheck` + `npm run test:resolver` + `npm run test:resolver-data` + `npm run test:resolver-coverage` + `npm run test:apply-override-dry` + `npm run brain:lint -- --no-write`** grün.

## Open questions

- **`alpha_legion`-parent (Cabal-Twist).** Heute parent=`chaos` (post-070). Cowork-Vorschlag: reparent auf `heretic_astartes` (analog zu allen anderen Heresy-Traitor-Legionen). Alternative: belassen — Alpha Legion ist lore-ambig wegen der Cabal-Twist-Claim. CC's Wahl, im Report begründen. Diese Entscheidung ist die einzige erlaubte Varianz bei den bestehenden Heresy-Traitor-Legion-Reparents; die anderen sieben sind required.

- **`death_guard` / `emperors_children` parent-Wahl.** Cowork-Vorschlag: `heretic_astartes` (Mid-Knoten). Alternative: direkt unter `chaos` analog zu den bestehenden 5 Reparented-Legionen aus 070 — das wäre inkonsistent mit dem neuen Mid-Knoten, aber konservativ. CC's Wahl. Empfehlung Cowork: ja, mid-Knoten; sonst macht der Mid-Knoten keinen Sinn.

- **`Iyanden`-Conflict: Surface-Form taucht als Faction (1×) UND als Location (1×) auf.** Cowork-Disambiguation: Welt landet in `locations.json` (`iyanden`, Eldar-Craftworld als Place). Faction-Surface-Form wird via `faction-aliases.json` zu `eldar` aliased: `"Iyanden": "eldar"`. CC darf alternativ entscheiden, beide Surface-Forms im Override per Kontext zu disambiguieren (Override-Datei trägt die Achse — wenn eine Faction-Liste „Iyanden" enthält geht es nach `eldar`, wenn eine Location-Liste „Iyanden" enthält geht es nach `iyanden`). Im Report begründen.

- **`Black Library`-Conflict.** Surface-Form „Black Library" in W40K-0079 *Atlas Infernal* meint die Eldar-Webway-Archiv-Institution, nicht den Publisher. CC's Wahl, ob die Welt-Slug `black_library` oder `black_library_place` heißt (das letztere verhindert Trefferschau mit dem Publisher-Begriff, falls in der DB anderwo „Black Library" auftaucht). Empfehlung Cowork: `black_library_place`.

- **Squats als preserved-removed-faction.** Surface-Form aus W40K-0064 *Space Marine* (1993). Cowork-Empfehlung: behalten als canonical `squats`, `tone: "Aus-Setting-Removed sub-faction (Squats)"` oder ähnliche Notiz. Alternative: in `book_details.notes` belassen (Long-Tail-only). Wenn CC sich gegen die Aufnahme entscheidet, sollte die Stelle in W40K-0064's Override-File entsprechend bleiben — keine Über-Korrektur in den Override-JSONs erlauben.

## Notes

### Empirische Surface-Form-Tabellen (Aggregat aus `manual-overrides-ssot-w40k-006..010.json`)

Aggregat wurde via Cowork-Skript erzeugt (50 Bücher, 5 JSONs) und cross-checked gegen den `sessions/ssot-loop-log.md` Status-Block jeder Iteration. Tabellen oben in Constraints reflektieren das Aggregat. Vollständiges Roh-Aggregat (CC zur Verifikation):

**Factions: 93 distinct.** Top-Frequenzen: Chaos (37), Adeptus Astartes (35), Imperial Guard (25, aliased), Heretic Astartes (25, NEW), Ultramarines (14), Daemons (12), Inquisition (11), Iron Warriors (10), Adeptus Mechanicus (9), Imperial Fists (8), Khorne (7), Orks (6), Tau Empire (5, aliased), Tyranids (5), Eldar (5, aliased), Slaanesh (4), Dark Eldar (4, NEW-Alias-Target), Unfleshed (3), Salinas Liberation Front (3), Bloodborn (3), Genestealer Cults (3), Black Legion (3), Tzeentch (3), Adeptus Titanicus (3), Space Wolves (3), Necrons (2), Crimson Slaughter (2), Rogue Traders (2), Adeptus Arbites (2), Cult of Chaos (2), Nurgle (2), Word Bearers (2), Imperial Navy (2), Thousand Sons (2), Grey Knights (2), Ordo Malleus (2), Officio Assassinorum (2), Hive Fleet Leviathan (2), Emperor's Children (2), World Eaters (2), Alpha Legion (2), Adepta Sororitas (2), Drukhari (2, NEW-Alias-Target), Astra Militarum (2), plus 49 weitere bei freq=1 (siehe `sessions/ssot-loop-log.md` für die Per-Batch-Aufschlüsselung).

**Locations: 57 distinct.** Top: Eye of Terror (11, direct), Ultramar (10, NEW), Macragge (9, direct), Calth (5, direct), Pavonis (4, direct), Medrengard (4, direct), Salinas (3, NEW), Killing Ground (3, NEW), Hydra Cordatus (3, NEW), Maelstrom (3, NEW), Webway (3, NEW), Fenris (3, direct), Imperium Nihilus (3, NEW), Commorragh (2, NEW), Iax (2, NEW), plus 42 bei freq=1.

**Characters: 111 distinct.** Top: Uriel Ventris (10, direct), Pasanius Lysane (9, direct), Honsou (9, direct), Ardaric Vaanes (7, direct), Mykola Shonai (4, NEW), Marneus Calgar (4, NEW), Cato Sicarius (4, NEW), Leto Barbaden (3, NEW), Daron Nisato (3, NEW), Sylvanus Thayer (3, NEW), Shas'O Or'es'ka'an (3, NEW), Aun'rai (3, NEW), Lord Winterbourne (3, NEW), Tigurius (3, NEW), Cassius (3, NEW), Forrix (3, NEW), Kroeger (3, NEW), Barban Falk (3, NEW), Berossus (3, NEW), Magos Naicin (3, NEW), plus 91 bei freq=1.

### Heretic-Astartes-Mid-Knoten — Reparent + Anlegen

```
heretic_astartes (NEW, parent=chaos, alignment=chaos)
├── sons_of_horus       (REPARENT chaos → heretic_astartes)
├── night_lords         (REPARENT chaos → heretic_astartes)
├── thousand_sons       (REPARENT chaos → heretic_astartes)
├── world_eaters        (REPARENT chaos → heretic_astartes)
├── word_bearers        (REPARENT chaos → heretic_astartes)
├── iron_warriors       (REPARENT chaos → heretic_astartes)
├── alpha_legion        (OPTIONAL REPARENT chaos → heretic_astartes; siehe Open Question)
├── lords_of_unholy_host (REPARENT chaos → heretic_astartes)
├── black_legion        (NEW; foundational)
├── death_guard         (NEW; foundational, fehlt heute komplett)
├── emperors_children   (NEW; foundational, fehlt heute komplett)
├── crimson_slaughter   (NEW; Renegate-Chapter)
├── violators           (NEW; Slaaneshi-Astartes-Warband)
├── fabius_bile_coterie (NEW; Emperor's-Children-Splinter; name="Fabius Bile's Coterie" mit Apostroph)
└── unfleshed           (NEW; Daemonculaba-Failed-Marines, edge-case — siehe Open Question)
```

Nach Reparent bleibt der direkte `chaos`-Parent-Set:

```
chaos
├── heretic_astartes (NEW, der neue Mid-Knoten)
├── blood_pact       (existing)
├── sons_of_sek      (existing)
├── zoican_host      (existing)
├── daemons          (existing)
├── bloodborn        (NEW; Khornate cultist horde)
├── cult_of_chaos    (NEW)
├── roaring_blades   (NEW; Traitor-Guard)
├── salinas_liberation_front (NEW)
├── khorne           (NEW; Chaos God)
├── slaanesh         (NEW; Chaos God)
├── tzeentch         (NEW; Chaos God)
├── nurgle           (NEW; Chaos God)
├── dark_mechanicum  (NEW)
├── punishers        (NEW; Chaos-Warband)
├── fallen_angels    (NEW; lore-ambig — siehe Tabellen oben)
└── …
```

Die Pre-Heresy-Loyalist-Frame der Heresy-Traitor-Legionen ist explizit nicht abgebildet (es gibt heute kein „pre/post Heresy" Tag). Wenn HH-Domain in den Loop kommt, ist ein eigener Re-Frame-Brief nötig — diese Resolver-Welle bleibt W40K-only.

### Cross-Batch-`applyCollections` — Beispiel-Pseudocode

Datenquelle ist die globale `roster.collections`-Liste aus `book-roster.json` (NICHT die `containedIn`/`contains`-Relations aus dem Drizzle-Schema — die sind nur Read-Side für DetailPanel-Queries). Form ist illustrativ; CC's konkrete Implementation (Caching, Logging-Verbose-Level, Batch-vs-Loop-Lookups) ist freie Wahl. **Wichtig: kein Schema-Touch — die `works.external_book_id`-Spalte existiert seit Migration 0008 (UNIQUE).** Spaltenrichtung wie im echten Code: `collectionWorkId` ist der Container (Omnibus/Anthology), `contentWorkId` ist der Constituent.

```ts
// Vorher (intra-batch only): siehe scripts/apply-override.ts:796–833
async function applyCollections(externalIdToUuid: Map<string, string>, roster: RosterFile) {
  const batchExternalIds = new Set(externalIdToUuid.keys());
  // Heute: beide Endpunkte müssen im Batch sein.
  const inScope = roster.collections.filter(
    (c) =>
      batchExternalIds.has(c.collectionExternalId) &&
      batchExternalIds.has(c.contentExternalId),
  );
  // Idempotency-Delete + Insert (unverändert) …
  const rows = inScope.map((c) => ({
    collectionWorkId: externalIdToUuid.get(c.collectionExternalId)!,
    contentWorkId: externalIdToUuid.get(c.contentExternalId)!,
    // displayOrder, confidence, basis …
  }));
  await db.insert(workCollections).values(rows);
}

// Nachher (cross-batch via works.external_book_id):
async function applyCollections(externalIdToUuid: Map<string, string>, roster: RosterFile, db: Db) {
  const batchExternalIds = new Set(externalIdToUuid.keys());
  // Neu: mindestens ein Endpunkt im Batch.
  const inScope = roster.collections.filter(
    (c) =>
      batchExternalIds.has(c.collectionExternalId) ||
      batchExternalIds.has(c.contentExternalId),
  );

  const resolveUuid = async (externalId: string): Promise<string | null> => {
    const local = externalIdToUuid.get(externalId);
    if (local) return local;
    const row = await db
      .select({ id: works.id })
      .from(works)
      .where(eq(works.externalBookId, externalId))
      .limit(1);
    return row[0]?.id ?? null;
  };

  const rows: WorkCollectionRow[] = [];
  for (const c of inScope) {
    const collectionUuid = await resolveUuid(c.collectionExternalId);
    const contentUuid = await resolveUuid(c.contentExternalId);
    if (!collectionUuid || !contentUuid) {
      const missing = !collectionUuid ? c.collectionExternalId : c.contentExternalId;
      console.warn(
        `[applyCollections] skipping unresolved external_book_id=${missing} in batch=${batchName}`,
      );
      continue;
    }
    rows.push({
      collectionWorkId: collectionUuid,       // ← Container (Omnibus/Anthology)
      contentWorkId: contentUuid,             // ← Constituent (das enthaltene Werk)
      displayOrder: c.displayOrder,
      confidence: c.confidence !== null ? c.confidence.toFixed(2) : null,
      basis: c.basis,
    });
  }
  // Idempotency-Delete erweitern: die heutige "DELETE WHERE col_uuid IN batch OR content_uuid IN batch"-
  // Logik bleibt korrekt, weil wir genau die Subset löschen, die wir auch neu schreiben.
  await db.insert(workCollections).values(rows);
}
```

### Tracked-for-future-Briefs

- **Cockpit-Audit-Route** `/buch/[slug]/audit` (OQ9). Trigger ≥ 100 applied erreicht; Brief 073 oder ähnlich.
- **HH-Domain-Resolver-Brief** sobald der Loop in die HH-Domain überrollt.
- **Anreicherungs-Brief** für `lexicanumUrl` + `notes` der neuen Reference-Rows.
- **Logical-Work-ID / `superseded_by`** für Duplicate-Omnibus-Pattern (W40K-0050 ≡ W40K-0056 etc.). Mini-Brief.
- **`canonicity`-Facet** für Heretic-Tomes-Cluster (W40K-0064..0067 markiert).
- **`primaris`-/`firstborn`-Facet** für die Marine-Generation-Distinktion.
- **Aeldari-Hierarchie-Vollsplit** (`aeldari_craftworld` / `aeldari_drukhari` / `aeldari_harlequins` / `aeldari_ynnari`), wenn das Datenbild das rechtfertigt. Heute geparkt unter „Aliase reichen".
- **`heretic_astartes`-Hierarchy-Rollup-Filter** in der UI — gehört zu OQ9-Cockpit-Phase / Phase-5.
- **Loop fortsetzen.** Brief 061 ist auf 100er-Pause; Maintainer-Trigger nach Resolver-Apply (kein neuer Brief nötig — Brief 061 ist standing). Per Pre-Check würde `ssot-w40k-011` jetzt loud-stoppen weil 100 % 50 == 0; nach Resolver-Apply darf Maintainer den Loop wieder anstoßen mit explizitem „lets go" / skip-Marker, gleicher Pattern wie ssot-w40k-006 in der zweiten Welle.
