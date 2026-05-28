# Resolver-Pass 9 — Phase 2 (Locations) Report (ssot-w40k-052..057 / W40K-0511..0565)

> Mechanische Resolver-Phase nach `sessions/resolver-pass-runbook.md` §3 Phase 2 + §4. Lese-Scope:
> Runbook + Config (`scripts/resolver-pass.config.json`) + Dossier
> (`sessions/resolver-dossiers/resolver-pass-9-dossier.md`) + Achs-Paket Locations. Keine Briefs, keine
> Override-Files, kein volles Loop-Log gelesen. Self-contained — kein Vorbehalt aus früherem Lauf.

## Summary

- **Wave:** `ssot-w40k-052..057` (6 Loop-Batches, 55 Bücher, W40K-0511..0565 — finale W40K-Welle).
- **Location-Surface-Forms in der Welle (Dossier §3):** 45 distinct / 73 occurrences.
- **Cross-Axis-Konflikte (Dossier §4):** 0 (saubere Welle).
- **Reference-Row-Delta (locations.json):** 214 → **225** rows (+11).
- **Alias-Delta (location-aliases.json):** 15 → **15** (unverändert; keine neuen Aliases nötig — jede
  promovierte Surface-Form trifft den Canonical-`name` exakt unter dem Runbook-§2-Direct-Match-Kontrakt).
- **Sector-Delta (sectors.json):** 8 → **8** (untouched — kein neuer Segmentum/Sector nötig; `alecto`
  als Region-Grain in `locations.json` statt als sectors.json-Entry, konsistent mit `imperium_nihilus`
  / `pariah_nexus` / `gothic_sector` Region-Pattern).
- **Resolver-Tests:** 273 → **280** (+7 neue Cases im ninth-wave-Block in `scripts/test-resolver.ts`).
- **Trias-Status:** alle vier Apply-seitigen Tests grün
  (`test:resolver`, `test:resolver-data`, `test:resolver-coverage`, `test:apply-override-dry`).
- **Halt-Disziplin:** keine architektonische Unsicherheit; keine `## Needs decision`-Stops. Ein Commit.

## New rows in `scripts/seed-data/locations.json` (+11)

### Hard freq ≥ 2 promotions (6)

| id | name | freq | sector | tags | source | rationale |
| --- | --- | --- | --- | --- | --- | --- |
| `varangantua` | Varangantua | 10 | `null` | `[]` | Warhammer-Crime-Cluster (W40K-0539..0542, 0545) + Crime-Anthologien (0543, 0544, 0546) | Master Crime hive city; höchste Evidenz der Welle. `sector: null` weil das Segmentum von Varangantua in den verfügbaren Quellen nicht eindeutig festgelegt ist (Dossier 7c offers Sector Alecto, aber Alecto ist sub-Segmentum-Grain — siehe nächste Row). Hive-city-Grain analog `hive_primus` / `junktion`. |
| `alecto` | Alecto | 8 | `null` | `["region"]` | Crime-Cluster (parent-Sector zu Varangantua) | Sector-Grain; in `locations.json` als Region-Row statt in `sectors.json` als Sector-Entry, konsistent mit `imperium_nihilus` / `pariah_nexus` / `gothic_sector` Pattern (Sub-Segmentum-Sectors werden in `sectors.json` nur dann eigenständig modelliert wenn sie als FK-Target genutzt werden — Sabbat-Beispiel mit `sabbat_region`-Sector + `sabbat`-Location nutzt Pacificus als `sector`, nicht Sabbat-Region). Tag `region` analog `gothic_sector`. |
| `antikef` | Antikef | 3 | `null` | `["necrons"]` | Twice-Dead-King-Trilogie + Omnibus (Crowley, W40K-0551/0552/0553) | Necron-Crownworld, zentrales Setting der Trilogie. Tag `necrons` analog `damnos` (`["ultramarines", "necrons"]`). |
| `sedh` | Sedh | 2 | `null` | `["necrons"]` | Twice-Dead-King-Cluster (W40K-0551, 0553) | Necron-adjacent Companion-World zu Antikef. Same Cluster, same tag. |
| `anaxian_line` | Anaxian Line | 2 | `null` | `["region"]` | Dawn-of-Fire (Kyme *Iron Kingdom* W40K-0532 + *Hand of Abaddon* W40K-0535) | Strategische Region/Frontline der Dawn-of-Fire-Era. Region-Grain analog `gothic_sector` / `bale_stars`. |
| `hive_blackbracken` | Hive Blackbracken | 2 | `null` | `[]` | *King of Pigs* (Archer, W40K-0521) + *Resting Places* anthology (W40K-0526, enthält *King of Pigs*) | Hive city; eponymisches Setting der Horror-eShort *King of Pigs* + Anthology-Wiederauftritt. Hive-city-Grain analog `varangantua`. |

### Lore-iconic freq=1 promotions (5)

Das Dossier §7c listet ~20 freq=1-Locations als "Phase 2's discretion". Ich promoviere 5, mit klarer
Lore-Anchor- oder Cluster-Justifikation; die restlichen bleiben unresolved (Long-Tail oder
Out-of-Domain — siehe "Deliberately NOT promoted").

| id | name | sector | tags | source | rationale |
| --- | --- | --- | --- | --- | --- |
| `imperial_palace` | Imperial Palace | `solar` | `["imperium", "custodes"]` | *Lord of the Fallen* (French, W40K-0562) | Terra-Sub-Location (Cypher-POV-Setting). Lore-iconic — Imperial Palace ist der politische/zeremoniale Kern des Imperiums. `sector: "solar"` da Sub-Location von Terra (sector=solar). Tags spiegeln `terra` (`["imperium", "custodes", "commissariat"]`) minus `commissariat`. Eigene Row statt Alias zu `terra` — konsistent mit `tizca` (vs Prospero) / `hive_primus` (vs Necromunda) / `asaheim` (vs Fenris) Sub-Location-Precedent. |
| `ghoul_stars` | Ghoul Stars | `null` | `["region", "necrons"]` | *Severed* (Crowley, W40K-0564) | Lore-iconic Necron-Frontier-Region (Sautekh-Crownworlds-Heimat). Companion-Region zur Twice-Dead-King-Necron-Achse. Region-Grain + Necron-Tag. |
| `gathalamor` | Gathalamor | `null` | `["ecclesiarchy"]` | *The Gate of Bones* (Clark, W40K-0529, Dawn of Fire #2) | Lore-iconic Dark-Imperium-Cardinal-Welt, zentrales Schlachtfeld der Indomitus-Crusade-Era (Word-Bearers-Invasion). M42-Anchor analog `almace` (Pass 8). Tag `ecclesiarchy` matches Cardinal-Welt-Funktion. |
| `kamidar` | Kamidar | `null` | `["imperial_knights"]` | *The Iron Kingdom* (Kyme, W40K-0532, Dawn of Fire #5) | Lore-iconic Imperial-Knight-Welt; Iron Queen Orlah Knight-House-Sitz. Tag `imperial_knights` matches Knight-Welt-Funktion. Eponymisches Setting. |
| `the_spoil` | The Spoil | `null` | `[]` | *The King of the Spoil* (Beer, W40K-0545) + Crime-Cluster | Varangantua-Sub-Region; eponymisches Setting der Beer-Crime-Novel. Sub-Location-Grain analog `the_spire` (Necromunda). Flat row statt parent-FK auf Varangantua — Schema modelliert location ↔ sector, nicht location ↔ location (Pass-8-Precedent für Precipice/Blackstone). |

## Vessel-Watch (Dossier 7c)

**Keine** Vessel-Promotionen in dieser Welle. Dossier §7c: "No freq ≥ 2 named ship surfaces. The
Baggit-and-Clodde duology has unnamed Imperial vessels; the Twice-Dead King trilogy's 'armada of the
Imperium' stayed nameless per loop log; Sea of Souls is a confined-ship piece but the ship isn't named
in §3. No vessel promotions this wave." Die Vessel-Konvention (`tags:['vessel']`, `gx/gy:null`) bleibt
ungenutzt diese Welle — auf bestehende Vessel-Rows (z. B. `casus_belli`, `solace`, `steel_tread`,
`ithracas_vengeance`, `sin_of_damnation`) keine neue Aktion.

## Deliberately NOT promoted

Das Dossier flaggt 24 weitere unresolved Location-Surface-Forms in der Welle, die ich diese Phase
bewusst unresolved lasse:

- **`Shyish` (freq 2, AoS Realm of Death)** — AoS-flagged (Accursed W40K-0517 + Gothgul Hollow W40K-0519,
  beide `setting->age_of_sigmar`). Dossier §7c default = leave unresolved (resolver doesn't act on
  setting; das `setting->age_of_sigmar`-Flag trägt durch zur Audit-Cockpit-Advisory). Gleicher Default
  wie Pass-8 (`shyish`, `aqshy`, `realm_of_ghur`, `ghyre` — alle AoS-Realms, alle unresolved).
- **AoS-spezifische Sub-Locales (freq 1, jeweils unresolved):** `Mhurghast` (Gothgul Hollow setting),
  `Calignius` + `Blood-Rock Peaks` (Black-Eyed Saint W40K-0525, AoS-flagged), `Gothghul Hollow` (Tales
  of Mhurghast #1, AoS-flagged + `data_conflict:title`). Gleicher AoS-Default.
- **Warhammer-Fantasy-Lokale (freq 1, jeweils unresolved):** `Drachenfels`, `Altdorf`, `The Old World`
  — Vampire-Genevieve-Omnibus (W40K-0511, `setting->warhammer_fantasy`-Flag); kein Warhammer-Fantasy-
  Bucket.
- **Segmentum-Grain freq=1 (jeweils unresolved):** `Segmentum Solar`, `Ultima Segmentum` — Dossier §7c
  bietet Phase-2-Promotion als Option an, aber kein per-Segmentum-Row-Precedent in `locations.json`
  (die fünf Segmenta leben nur in `sectors.json`; die Surface-Form *Segmentum X* würde nicht via
  resolveLocation aufgelöst, sondern als Sector-Frame kategorisiert werden). Lasse unresolved analog
  dem Imperium-as-Location-Test-Case (`resolveLocation("Imperium").id` stays null).
- **Varangantua-Sub-Distrikte (freq 1, jeweils unresolved):** `Polaris`, `Steelmound`, `Nearsteel`
  (Grim Repast / Flesh and Steel). Dossier §7c: "Plausible sub-location rows if Phase 2 supports
  nested location grain under Varangantua; else leave unresolved." Schwache freq=1-Evidenz pro Distrikt;
  promoviere nur den eponymischen `the_spoil` (Beer-Novel-Titel) + Top-Level `varangantua`. Bei nächster
  Surface-Form mit mehr Distrikt-Evidenz kommt eine Promotion-Diskussion in Frage.
- **Long-tail freq=1 Lokale** ohne lore-iconic Anchor: `Doahht` (Severed setting), `Velua` (Martyr's
  Tomb), `Srinagar` (Throne of Light), `Machorta Sound` (Avenging Son), `Ghereppan` (Magister and the
  Martyr — Urdesh sub-locale), `Golden Chain` (Martyr's Tomb), `Rotauri` (Prisoners of Waaagh),
  `Thorsarbour` (Bookkeeper's Skull), `Gabal` (Warlord of Warlords), `Vorganthian` (Auric Gods). Long-
  tail per Runbook §2 ("lieber Long-Tail offen lassen als eine falsche Canonical-Kante schreiben").
  Mehrere davon (Doahht, Ghereppan, Velua) wären als Companion-Worlds zu existierenden Clustern (Sedh,
  Urdesh, Martyr's-Tomb-Cluster) denkbar — schwache freq=1-Evidenz pro Welt, nächste Welle entscheidet.
- **Bereits-direct/aliased Surface-Forms (idempotent, keine Aktion):** `Terra` (freq 4, direct →
  `terra`), `Ultramar` (freq 2, direct → `ultramar`), `Urdesh` (freq 2, direct → `urdesh`), `Sabbat
  Worlds` (freq 2, alias → `sabbat`, Pass-1), `Eye of Terror` (freq 1, direct), `Fenris` (freq 1,
  direct), `Armageddon` (freq 1, direct), `Imperium Nihilus` (freq 1, direct), `Pariah Nexus` (freq 1,
  direct), `Ullanor` (freq 1, direct), `Great Rift` (freq 1, alias → `great_rift`, Pre-Pass).

## Idempotency-Check

Alle 11 neuen Row-IDs waren vor der Phase nicht im Reference-Set:

- Row-IDs gegen bestehende `locations.json` (vorher 214 Rows): kein Konflikt — `varangantua`, `alecto`,
  `antikef`, `sedh`, `anaxian_line`, `hive_blackbracken`, `imperial_palace`, `ghoul_stars`,
  `gathalamor`, `kamidar`, `the_spoil` sind alle neu.
- `name`-Eindeutigkeit gegen `locations.json` bestätigt (kein Namensduplikat).
- Sector-FK der neuen Rows: 10 von 11 nutzen `sector: null` (Region-/Long-Tail-Pattern); 1 (`imperial_palace`)
  nutzt `sector: "solar"` — `solar` existiert bereits in `sectors.json`, bestätigt durch
  `test:resolver-data` Check "location sectors point at existing sectors or null".
- Keine neuen Aliases — keine Konflikte mit existierenden 15 location-aliases-Keys.

Re-Run auf derselben Branch wäre no-op.

## FK-Sicherheit für Phase 3 (Runbook §5)

Phase 2 berührt keine Faction-Achse. Locations sind kein FK-Target für `primaryFactionId` neuer
Characters in Phase 3 — die Reihenfolge-Constraint (Phase 1 strikt vor Phase 3) betrifft ausschließlich
die Faction-Achse. Phase 3 kann unmittelbar nach Phase 2 starten.

Die in Phase 1 promovierten neuen Faction-IDs (`ogryns`, `sautekh_dynasty`) bleiben unverändert
verfügbar für Phase-3-Character-Promotions.

## Verifikation (Runbook §10)

Code-berührende Phase 2 hält die Trias grün, bevor committet wird:

```text
npm run test:resolver            → 280 passed, 0 failed   (273 + 7 neu im ninth-wave-Block)
npm run test:resolver-data       → resolver data integrity ok (alle 10 Checks grün, inkl.
                                   "location sectors point at existing sectors or null" — bestätigt
                                   `imperial_palace.sector="solar"` valid)
npm run test:resolver-coverage   → totals factions=1796/2116, locations=684/898 (+1 vs Phase 1
                                   baseline 683 — neue Surface-Form-Matches in den Smoke-Slugs),
                                   characters=1170/1535 (below-threshold smoke rows sind data findings,
                                   not failures)
npm run test:apply-override-dry  → [apply-override-dry] ok
                                   (0 dangling FK/alias refs, 0 missing facet ids, 0 unresolvable
                                    constituents, 15 forward collection refs — Pass-6/7/8-collection-
                                    gaps carry-through, range-aware Guard grün)
```

Kein `lint`/`typecheck` — Phase 2 ändert nur JSON-Data-Files + `test-resolver.ts` (Test-Data, nicht
Production-Code).

## Touched files (Write-Scope-konform)

- `scripts/seed-data/locations.json` (+11 rows angehängt am Array-Ende: 6 freq≥2 + 5 lore-iconic
  freq=1)
- `scripts/test-resolver.ts` (+7 `check()`-Cases im ninth-wave-Block in `resolveLocation`-Sektion,
  vor `console.log("\nresolveCharacter")`)
- `sessions/resolver-dossiers/resolver-pass-9-phase-2-report.md` (diese Datei)

`scripts/seed-data/location-aliases.json` und `scripts/seed-data/sectors.json` sind im Phase-2-Scope
aber **nicht** angefasst (keine Aliases nötig — direkter Canonical-Name-Match deckt alle Promotions;
kein neuer Sector nötig — `alecto` als Region-Row in `locations.json` statt Sector-Entry, konsistent
mit Pass-8-Approach). Das ist OK — der Runbook-Scope ist eine obere Schranke, keine Pflicht-Liste.

Ready for Phase 3 (Characters).
