---
report: 2026-05-16-076-resolver-pass-4-phase-2
brief: sessions/2026-05-16-076-arch-resolver-batch-4-axis-sliced.md
dossier: sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-dossier.md
phase: 2
axis: locations
status: done
generated: 2026-05-16
---

# Phase 2 (Locations) — Done summary

> Per-Phase-Statusdatei laut Brief 076 § Phasen-Write-Scopes / Erratum-Punkt 4+8. Kurze Done-Summary. Finaler konsolidierter impl-Report folgt in Phase 4.

## Outcome

25 neue Location-Rows in `scripts/seed-data/locations.json` (132 → 157). 2 neue Aliases in `scripts/seed-data/location-aliases.json` (11 → 13). Keine Sector-Add (`sectors.json` unverändert; Hydraphur nutzt existierenden Sector `pacificus`). 15 neue Resolver-Test-Cases in `scripts/test-resolver.ts` (Acceptance ≥ 4; davon 13 Direct-Match + 1 Alias + 1 Unresolved-Cross-Axis-Guard). `npm run test:resolver` grün: **103 passed, 0 failed** (88 + 15 neue).

Kein `needs-decision`-Stop. Alle Soft-Decisions aus Dossier §7 (Necromunda-Sub-Locations, Hydraphur-Sector, Named-Vessels, Imperium-Cross-Axis) sind in den Decisions unten begründet.

## New location rows (25)

Logische Gruppierung, Append-Only an `locations.json`:

| # | id | name | sector | tags | cluster |
| - | -- | ---- | ------ | ---- | ------- |
| 1 | `hive_primus` | Hive Primus | null | [] | necromunda |
| 2 | `underhive` | Underhive | null | ["region"] | necromunda |
| 3 | `spire` | The Spire | null | ["region"] | necromunda |
| 4 | `hopes_end` | Hope's End | null | [] | necromunda-modern |
| 5 | `dim_zone` | Dim Zone | null | [] | necromunda-modern |
| 6 | `floodgrave` | Floodgrave | null | [] | necromunda-modern |
| 7 | `fallen_dome_of_periculus` | Fallen Dome of Periculus | null | [] | necromunda-modern |
| 8 | `junktion` | Junktion | null | [] | necromunda-classic |
| 9 | `fang` | The Fang | obscurus | ["space_wolves"] | space-wolves |
| 10 | `asaheim` | Asaheim | obscurus | ["space_wolves"] | space-wolves |
| 11 | `aerius` | Aerius | null | [] | space-wolves |
| 12 | `galt` | Galt | null | [] | space-wolves |
| 13 | `garm` | Garm | null | [] | space-wolves |
| 14 | `hyades` | Hyades | null | [] | space-wolves |
| 15 | `planet_of_the_sorcerers` | Planet of the Sorcerers | null | ["chaos","thousand_sons"] | space-wolves |
| 16 | `venam` | Venam | null | [] | space-wolves |
| 17 | `acheron` | Acheron | null | [] | last-chancers |
| 18 | `gothic_sector` | Gothic Sector | null | ["region"] | gothic-war |
| 19 | `shadow_point` | Shadow Point | null | [] | gothic-war |
| 20 | `typhos_prime` | Typhos Prime | null | [] | last-chancers |
| 21 | `phalanx` | The Phalanx | null | [] | soul-drinkers |
| 22 | `selaaca` | Selaaca | null | [] | soul-drinkers |
| 23 | `vanqualis` | Vanqualis | null | [] | soul-drinkers |
| 24 | `hydraphur` | Hydraphur | pacificus | [] | calpurnia |
| 25 | `kepris` | Kepris | null | [] | soul-drinkers-primaris |

Idempotenz: `node -e "const f=require('./scripts/seed-data/locations.json'); const ids=new Set(); for(const r of f){if(ids.has(r.id))throw new Error('dup: '+r.id); ids.add(r.id);}"` zeigt 157 rows, 0 Duplikate.

## New aliases (2)

| surface form | canonical id | Begründung |
| ------------ | ------------ | ---------- |
| `the Phalanx` (lowercase the) | `phalanx` | Surface-Form-Variation in `manual-overrides-ssot-w40k-020.json` (W40K-0196 + W40K-0197) ist lowercase-the. Direct-Match ist case-sensitive (Resolver Stage 1), daher Alias für die lowercase-Schreibweise. Canonical `name="The Phalanx"` deckt das Capitalized-Pattern. |
| `Tau Empire space` | `tau_empire` | Frame-Surface-Form aus W40K-0182 + W40K-0184 (Last Chancers *Kill Team* / *The Last Chancers Omnibus*). LLM-Tagging-Artifact für die galactic-region "Tau Empire" — kollabiert sauber auf die existierende canonical Row `tau_empire` (statt eine eigene `tau_empire_space`-Row anzulegen, die nur eine Surface-Form-Variante wäre). |

## Decisions

### D1 — ID-Konvention für "The X"-Locations (Dossier §3.2 + Brief Phase-2 Star-Forts-Bullet)

**Gewählt:** Folge bestehender `great_rift`-Precedent — id droppt "the_", name behält "The". Konkret:

- `fang` / "The Fang"
- `spire` / "The Spire"
- `phalanx` / "The Phalanx"

**Begründung:**

- Precedent in `locations.json` ist eindeutig: `great_rift` (id) + "The Great Rift" (name); kein `the_great_rift`-Pattern. Die alias `"Great Rift" → great_rift` deckt die "no-The"-Surface-Form.
- Cowork-Tendenz im Brief (Phase-2-Star-Forts-Bullet) sagte explizit "mit oder ohne führendem `the_` ist CC's Call". CC wählt **ohne** für Konsistenz mit `great_rift`.
- Direct-Match-Coverage: "The Fang" / "The Spire" / "The Phalanx" sind alle capitalized-the in den Override-Files → direct-name-match via canonical name. Nur "the Phalanx" mit lowercase-the (W40K-0020) braucht den oben dokumentierten Alias.
- Alternative geprüft + verworfen: `the_fang` / `the_spire` / `the_phalanx`-Pattern hätte gegen die `great_rift`-Convention verstoßen. Kein semantischer Mehrwert. Bare `fang` / `spire` / `phalanx` sind als snake-case-IDs unique und kollidieren mit nichts (gegen-geprüft via `grep` über `locations.json` + Buch-Slugs — der Buch-Slug `phalanx` für W40K-0196 ist in der `books`-Tabelle, nicht in `locations`, kein Cross-Table-Konflikt).

### D2 — Necromunda-Hive-Geographie als sector=null (Brief Phase-2-Bullet "Necromunda-Geographie")

**Gewählt:** Alle 8 Necromunda-Sub-Location-Rows (`hive_primus`, `underhive`, `spire`, `hopes_end`, `dim_zone`, `floodgrave`, `fallen_dome_of_periculus`, `junktion`) tragen `sector: null`. **Kein** `underhive`-Browse-Root, **kein** neuer Sector.

**Begründung:**

- Precedent: `hive_trazior` (von 072 als Necromunda-Sub-Location angelegt) hat `sector: null`, nicht `sector: "solar"` wie der Necromunda-Hauptknoten. Die 8 neuen folgen dem Pattern.
- Cowork-Tendenz im Brief: "für die Underhive-Granular-Lokationen einzelne Rows, aber keinen `underhive`-Browse-Root (es ist eine Region-Bezeichnung, kein Sector)". Mit `tags: ["region"]` für `underhive` und `spire` ist die Region-Semantik gewahrt, ohne neue Browse-Tier.
- `locations.json` trägt kein `parent`-Feld (Schema-Faktum); die Cluster-Mitgliedschaft "auf Necromunda" lebt also implizit (via Lore + via `book_locations`-Junction-Pattern, nicht via Hierarchie-FK).
- freq=1-Lore-Iconic-Promotionen: `dim_zone` (W40K-0173 *Terminal Overkill*-POV-Setting), `floodgrave` (W40K-0176 *Road to Redemption*-Hauptarena), `fallen_dome_of_periculus` (W40K-0179 *Fire Made Flesh*-Final-Setting), `junktion` (W40K-0165 *Junktion*-Title-Setting) — alle anchor-locations für ihre Buch-Plots, daher promoted. Skipped: `Hive City` (freq=1, W40K-0166) — zu generisch (Tier-Beschreibung, nicht Eigenname); bleibt unresolved.

### D3 — Hydraphur als sector="pacificus" (Brief Phase-2-Bullet + Dossier §7.6)

**Gewählt:** `hydraphur` mit `sector: "pacificus"` (existierender Segmentum-Knoten). **Keine** neue `hydraphur`-Sector-Row.

**Begründung:**

- Cowork-Default im Brief: "kann sie einen Sector hinzufügen ... oder `sector: null` setzen". Dossier §7.6: "vermutlich `sector: null` ausreichend".
- CC weicht hier vom `null`-Default ab: Hydraphur ist canonical-lore-eindeutig in Segmentum Pacificus (Adeptus-Arbites-Hochbasis im Pacificus-Sektor; BL-Calpurnia-Trilogie-Setting). Da `pacificus` als Sector bereits existiert (`sectors.json` line 35), ist `sector: "pacificus"` die genauere Auflösung **ohne** Schema-Erweiterung — saubere Win-Win-Wahl.
- Alternative geprüft + verworfen: eigener `hydraphur`-Sector-Eintrag in `sectors.json`. Verletzt das "Schema-Minimal"-Prinzip ohne Nutzen — Hydraphur ist ein Fortress-System, kein eigener Sektor. Cowork-Empfehlung "keinen Hydraphur-spezifischen Sub-Tier" aus dem Brief-Phase-1-Bullet (für Faction-Hierarchie) gilt analog für Locations.

### D4 — Named Vessels: nicht promoted (Brief Phase-2-Bullet + Dossier §7.7)

**Skip:** `Lord Solar Macharius` (Cruiser, Gothic War), `Planet Killer` (Chaos Super-Weapon, Gothic War), `Brokenback` (Soul Drinkers' Chaos-Cruiser-Hulk, *Hellforged* + Annihilation Second Omnibus).

**Begründung:**

- Dossier §7.7 sagt explizit: "Keiner ist im Surface-Form-Aggregat als location-eintrag aufgetaucht — die LLM hat sie nicht als location getagged, sondern in den Synopses erwähnt. **Phase 2 hat hier nichts zu tun.**"
- Cowork-Faustregel "alias / promote nur bei ≥1× konkret auftauchender Surface-Form" greift: kein Override-File hat sie als `location`-Eintrag mit `name`-Feld; sie sind ausschließlich Plot-Erwähnungen.
- Brief-Constraint "keine over-broad Promotionen" + "keine speculative-Vessel-Promote ohne Surface-Form-Beleg" gibt den Cleanup-Default vor.
- Wenn ein späterer Resolver-Pass (oder eine ingestion-LLM-Reklassifizierung) diese Vessels in `book_locations`-Surface-Forms aufnimmt, kann eine Hygiene-Session sie promoten. Dann analog 072-Pattern `tags: ["vessel"]` + `sector: null` + `gx/gy: null`.

### D5 — `Imperium`-als-Location: documented unresolved (Brief Cross-Axis-Bullet + Dossier §4)

**Skip:** Surface-Form `Imperium` (freq=20 auf Location-Achse) bleibt **unresolved**. **Keine** neue `imperium`-Location-Row, **kein** Alias `Imperium → terra` o. ä.

**Begründung:**

- Dossier §4 Cross-Axis-Warnung: `Imperium` ist eine LLM-eingestreute galactic-scale Frame-Tag, kein konkreter Ort. Faction-Seite löst es korrekt via Alias `Imperium → imperium`; Location-Seite muss separat behandelt werden.
- Lösungsweg analog 072 `era_frame`-Pattern: lass Locations-Achse `Imperium` unresolved; eine zukünftige Hygiene-Session kann ggf. eine `imperial_space`-Location mit `tags: ["era_frame"]` einführen — **OOS dieser Session** laut Brief.
- Cross-Axis-Sicherheit: keine ID-Kollision mit dem Faction `imperium`-Knoten, weil Resolver-Lookups Achsen-getrennt sind (`resolveFaction` vs. `resolveLocation`).
- Test-Coverage: explizites unresolved-guard im Test-Case (`resolveLocation("Imperium").id === null`) — verhindert akzidentelle künftige Promotion und macht das Cross-Axis-Pattern explizit.

### D6 — Space-Wolves-Saga: selektives sector="obscurus"

**Gewählt:** `fang` + `asaheim` mit `sector: "obscurus"` (sie liegen auf Fenris bzw. sind Fenris-Kontinente; Fenris hat selbst `sector: "obscurus"`). Die übrigen 6 Space-Wolves-Lokationen (`aerius`, `galt`, `garm`, `hyades`, `planet_of_the_sorcerers`, `venam`) mit `sector: null`.

**Begründung:**

- `the_fang` (volcanic monastery on Fenris) und `asaheim` (continent of Fenris) sind on-world-Features eines Sector-getaggten Planeten; sie erben dessen Sector. Precedent: `civitas_beati` auf Herodor erbt `sector: "sabbat_region"` (line 545).
- Die anderen 6 Lokationen (`aerius`, `galt`, `garm`, `hyades`, `venam`) sind separate Worlds in/um das Fenris-System mit unklarem oder uneinheitlichem Segmentum-Mapping in der BL-Lore (Galt liegt z. B. außerhalb des Fenris-Systems im "wider Sector"); CC default-t für Sector-Unsicherheit auf `null` statt überzu-claimen.
- `planet_of_the_sorcerers` liegt im Eye of Terror (Warp-Anomalie, die Obscurus straddelt). Sector-Mapping wäre theoretisch `obscurus`, aber per Eye-of-Terror-Convention der bestehenden `eye_of_terror`-Row (`sector: "obscurus"`) ist die Daemon-World-Identität primär — Tags `["chaos","thousand_sons"]` machen das explizit, `sector: null` hält die Surface-Frage offen.
- Tags `["space_wolves"]` an `fang` + `asaheim` markiert die Faction-Affinität analog `fenris` (`tags: ["space_wolves"]`).

### D7 — Gothic Sector als region-tag

**Gewählt:** `gothic_sector` mit `tags: ["region"]`, `sector: null`. Kein eigener Eintrag in `sectors.json`.

**Begründung:**

- Gothic Sector ist konzeptionell ein Sektor, aber kein **Segmentum** — die `sectors.json`-Datei trägt heute primär Segmenta + ein paar Sub-Sektor-Rollups (Scarus / Helican / Sabbat-Region). Gothic Sector würde eine neue Sub-Sektor-Tier öffnen, die für eine einzelne Resolver-Welle zu invasiv ist.
- Lieber Location-Row mit `tags: ["region"]` (analog `ultramar` line 623, `webway` line 654, `eastern_fringe` line 897). Resolver/Cockpit-Coverage ist gleichwertig.
- Wenn ein späterer Resolver-Pass weitere "Named Sectors" (z. B. Calixis als Sector statt nur Location, Korronus-Expanse) bringt, kann eine Hygiene-Session `sectors.json` strukturell erweitern. Aus-Scope hier.

### D8 — freq=1 lore-iconic Location-Promotion

Promoted (5):

- `dim_zone` (W40K-0173 *Terminal Overkill* — Underhive-POV-Setting)
- `floodgrave` (W40K-0176 *Road to Redemption* — Underhive-Final-Confrontation)
- `fallen_dome_of_periculus` (W40K-0179 *Fire Made Flesh* — Climax-Setting)
- `junktion` (W40K-0165 *Junktion* — Title-Eponym)
- `kepris` (W40K-0198 *Traitor by Deed* — Primaris-Soul-Drinkers-Debüt-Engagement)

Nicht-promoted (1, bleibt Long-Tail-unresolved):

- `Hive City` (freq=1, W40K-0166 *Fleshworks*) — generisch (Tier-Beschreibung, nicht Eigenname). Cowork-Faustregel "lieber Long-Tail unresolved als falsche Canonical-Kanten".

## Resolver-Status-Veränderung

Pre-Phase-2 (post-074-Baseline + post-Phase-1):

```
locations: 132 rows / 11 aliases
location surface forms in wave: 7 resolved (direct only), 28 unresolved (Dossier §3.2)
```

Post-Phase-2:

```
locations: 157 rows (+25) / 13 aliases (+2)
location surface forms in wave: 33 resolved (direct: 32 / alias: 1), 2 unresolved
```

Long-Tail-unresolved (2, beide bewusst nicht promoted):

- `Hive City` (freq=1, W40K-0166) — zu generisch (Tier).
- `Imperium` (freq=20, cross-axis) — Frame-Tag, documented unresolved (D5).

(Surface-Form `Tau Empire space` ist via Alias resolved, daher als "alias" gezählt; `Tau Empire` als Direct-Match auf bestehende `tau_empire`-Row tauchte nicht im Wellen-Aggregat auf — würde aber resolven, falls ein späteres Override-File die Surface-Form bringt.)

## Test-Coverage

15 neue Location-Test-Cases in `scripts/test-resolver.ts` (Acceptance ≥ 4):

1. `Hive Primus` → `hive_primus` (Necromunda-Sub-freq=20)
2. `Underhive` → `underhive` (Necromunda-Region-tag-freq=20)
3. `The Spire` → `spire` (Necromunda-Upper-Hive, `great_rift`-Pattern ohne `the_`)
4. `Junktion` → `junktion` (freq=1 Title-Eponym)
5. `The Fang` → `fang` (Space-Wolves-Monastery, freq=8)
6. `Asaheim` → `asaheim` (Fenris-Continent)
7. `Planet of the Sorcerers` → `planet_of_the_sorcerers` (Multi-Word + Chaos-Tag)
8. `Gothic Sector` → `gothic_sector` (Region-Tag)
9. `Shadow Point` → `shadow_point` (Gothic-War)
10. `The Phalanx` → `phalanx` (Soul-Drinkers-Star-Fort, Capitalized-The)
11. `the Phalanx` → `phalanx` (Alias lowercase-the)
12. `Hydraphur` → `hydraphur` (Calpurnia, sector="pacificus")
13. `Selaaca` → `selaaca` (Soul-Drinkers)
14. `Tau Empire space` → `tau_empire` (Alias frame-region)
15. `Imperium` → `null` (Cross-Axis-Unresolved-Guard)

`npm run test:resolver` Ergebnis: **103 passed, 0 failed** (alle bestehenden 88 unverändert).

## Files touched (Phase-2 Write-Scope)

- `scripts/seed-data/locations.json` (+25 rows, append-only)
- `scripts/seed-data/location-aliases.json` (+2 keys)
- `scripts/test-resolver.ts` (+15 test cases, sectioned-append nach `alias - Serenade routes to Cepharil`)
- `sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-phase-2-report.md` (diese Datei, neu)

**Nicht berührt** in dieser Phase:

- `scripts/seed-data/sectors.json` (kein neuer Sector nötig — Hydraphur nutzt existierenden `pacificus`).
- Keine Pfade außerhalb des Write-Scopes.

## Hand-off to Phase 3 (Characters)

- Faction-Set (Phase 1) liefert Pre-Condition für Character-`primaryFactionId`: `house_ulanti`, `house_helmawr`, `house_koiron`, `last_chancers`, `soul_drinkers`, `howling_griffons`, `house_belisarius` sind nutzbar (siehe Phase-1-Report §Hand-off).
- Location-Set (Phase 2) ist Resolver-Coverage-Voraussetzung für Smoke-Tests in Phase 4 (z. B. `phalanx` für W40K-0196-Smoke, `hydraphur` für W40K-0199-Crossfire-Smoke, `the_fang` für Space-Wolves-Saga-Smoke).
- Cross-Axis-Achtung Iyanden-Style: `Imperium`-als-Location bleibt unresolved (Dossier §4 + D5 oben). Phase-3-Characters sollte sehr unwahrscheinlich „Imperium" als Surface-Form sehen — falls doch (z. B. eine Character-Surface-Form mit „Imperium" als Faktion-Annotation), nicht versehentlich zur Location-Row routen.
- Cross-Batch-Alias-Consolidation-Cases (Mad Donna / Kal Jerico / Lord Helmawr / Kage-Burned-Man) sind Phase-3-Domain — Dossier §5 Cases 1-4.

## Open issues / blockers

Keine. Phase 3 (Characters) ist freigegeben.
