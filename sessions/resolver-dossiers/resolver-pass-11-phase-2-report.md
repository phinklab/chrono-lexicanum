# Resolver-Pass 11 — Phase 2 (Locations) Status Report

**Welle:** `ssot-hh-003..008` (HH-0021..HH-0080, 60 Bücher)
**Phase:** `phase-2-locations`
**Scope:** `scripts/seed-data/locations.json`, `scripts/seed-data/location-aliases.json`, `scripts/seed-data/sectors.json`, `scripts/test-resolver.ts`, this status file.
**Status:** done — ready for Phase 3 (Characters).

## Summary

Promotions-Disziplin: 7 strict-freq new rows (freq ≥ 2 unresolved) + 15 curated freq-1
lore-iconic new rows + 0 alias-Adds (Dossier §7c sagt explizit „0 alias adds" für Locations,
nur `Isstvan III` taucht alias auf und ist Pass-10-Konfirmation). Insgesamt **22 neue Location-Rows**
— landet auf der vom Dossier empfohlenen Ceiling (Floor 14, Ceiling ~22). Resolver-Trias grün
(347 cases, 0 failures; +17 neue Pass-11-Phase-2-Test-Cases). `sectors.json` nicht berührt — keine
neue Location braucht einen Sector-FK ausserhalb des bestehenden Sets (`solar`/`obscurus`/`ultima`
+ `null`). Keine architektonische Unsicherheit; keine `Needs decision`-Blocker.

## New location rows (22 total)

### Strict freq ≥ 2 (7 rows)

| id | name | sector | tags | evidence | dossier ref |
| --- | --- | --- | --- | --- | --- |
| `sol_system` | Sol System | `solar` | `["region", "imperium"]` | freq 4 (HH-0039/0055/0073/…) — system grain parent of Terra/Mars/Luna/Pluto, pivotal Solar-War/Siege-of-Terra | §7c strict |
| `vengeful_spirit` | Vengeful Spirit | `null` | `["vessel"]` | freq 4 (HH-0029/0065/0066/…) — Warmaster's flagship, **vessel-convention** per runbook §3 Phase 2 (`tags:['vessel']`, `gx/gy:null`) | §7c strict + runbook §3 |
| `lions_gate_spaceport` | Lion's Gate Spaceport | `solar` | `["imperium"]` | freq 3 (HH-0057/0059/0062) — Terra sub-locale; Siege-of-Terra battlefield (Lost-and-Damned/First-Wall arc) | §7c strict |
| `chondax` | Chondax | `null` | `["white_scars"]` | freq 2 (HH-0028/0031) — White Scars war-world (Scars / Legacies of Betrayal) | §7c strict |
| `molech` | Molech | `null` | `["imperial_knights"]` | freq 2 (HH-0029/0076) — Imperial Knight world; Vengeful Spirit House-Devine pivot (FK-konsistent mit Phase-1 `house_devine`) | §7c strict |
| `pluto` | Pluto | `solar` | `["imperial_navy"]` | freq 2 (HH-0039/0055) — Sol-System outpost (Praetorian-of-Dorn / Solar-War) | §7c strict |
| `tallarn` | Tallarn | `null` | `["astra_militarum"]` | freq 2 (HH-0035/0045) — Iron Warriors siege-world per eponymous *Tallarn* anthology HH-0045; auch W40K Tallarn-Desert-Raiders-Ursprungswelt | §7c strict |

### Curated freq ≥ 1 lore-iconic (8 worlds + 7 Palace sub-locales = 15 rows)

| id | name | sector | tags | evidence | dossier ref |
| --- | --- | --- | --- | --- | --- |
| `nuceria` | Nuceria | `null` | `["world_eaters"]` | freq 1 lore-iconic (HH-0024 *Betrayer*) — Angron's homeworld + Daemonhood-pivot | §7c curated |
| `signus_prime` | Signus Prime | `null` | `["blood_angels"]` | freq 1 lore-iconic (HH-0021 *Fear to Tread*) — Blood Angels Signus Trial pivot | §7c curated |
| `pythos` | Pythos | `null` | `[]` | freq 1 lore-iconic (HH-0030 *The Damnation of Pythos*) — eponymous Iron Hands remnants world | §7c curated |
| `iydris` | Iydris | `null` | `["eldar"]` | freq 1 lore-iconic (HH-0023 *Angel Exterminatus*) — Eldar maiden-world climax | §7c curated |
| `nostramo` | Nostramo | `obscurus` | `["night_lords"]`, `destroyed: true` | freq 1 lore-iconic (HH-0022 *Shadows of Treachery*) — Night Lords homeworld; pre-Heresy-destroyed-Konvention parity mit `caliban` | §7c curated |
| `chogoris` | Chogoris | `null` | `["white_scars"]` | freq 1 lore-iconic (HH-0028 *Scars*) — White Scars homeworld | §7c curated |
| `armatura` | Armatura | `null` | `["world_eaters"]` | freq 1 lore-iconic (HH-0024 *Betrayer*) — World Eaters training world | §7c curated |
| `beta_garmon` | Beta-Garmon | `null` | `["adeptus_titanicus"]` | freq 1 lore-iconic (HH-0053 *Titandeath*) — Titandeath system, largest Titan engagement of the Heresy | §7c curated |
| `eternity_gate` | Eternity Gate | `solar` | `["imperium"]` | freq 1 lore-iconic (HH-0063 *Echoes of Eternity*) — Imperial Palace sub-location; Sanguinius's last-stand entry | §7c curated (Palace sub-locale bloc) |
| `eternity_wall_spaceport` | Eternity Wall Spaceport | `solar` | `["imperium"]` | freq 1 lore-iconic (HH-0059 *Saturnine*) — Palace spaceport flashpoint | §7c curated (Palace sub-locale bloc) |
| `saturnine_gate` | Saturnine Gate | `solar` | `["imperium"]` | freq 1 lore-iconic (HH-0059 *Saturnine*) — eponymous Palace gate-battle | §7c curated (Palace sub-locale bloc) |
| `mercury_wall` | Mercury Wall | `solar` | `["imperium"]` | freq 1 lore-iconic (HH-0061 *Mortis*) — Palace wall-segment, Titan engagement | §7c curated (Palace sub-locale bloc) |
| `delphic_battlement` | Delphic Battlement | `solar` | `["imperium"]` | freq 1 lore-iconic (HH-0063 *Echoes of Eternity*) — Palace battlement, Sanguinius-vs-Ka'Bandha duel | §7c curated (Palace sub-locale bloc) |
| `golden_throne` | Golden Throne | `solar` | `["imperium"]` | freq 1 lore-iconic (HH-0067 *End and the Death Vol. 3*) — Palace inner-sanctum, Emperor enthroned | §7c curated (Palace sub-locale bloc) |
| `sanctum_imperialis` | Sanctum Imperialis | `solar` | `["imperium"]` | freq 1 lore-iconic (HH-0067 *End and the Death Vol. 3*) — Palace innermost Throne-chamber | §7c curated (Palace sub-locale bloc) |

**Strict-freq floor (Dossier-Recommendation):** 7 rows. **Curated lore-iconic ceiling:** ~22 (8..20 curated + 7 strict). **Actual promotion:** **22 rows** (Floor 7 + 8 standalone worlds + 7 Palace sub-locales) — auf dem Dossier-Ceiling.

## New location aliases (0 total)

Per Dossier §7c: „Phase-2 promotion shape (recommended): **0 alias adds**". Diese Phase folgt
der Empfehlung — keine Alias-Edits in `location-aliases.json`. Die Pass-10-`Isstvan III →
istvaan_iii`-Alias-Konfirmation aus §3 ist read-only Existing-Alias-Beweis, nicht neuer
Phase-2-Add.

## Skipped / deferred promotion candidates

Per Dossier §7c Judgment-Calls, Phase 2 hat explizit **nicht** promotet:

- **`signus_cluster` (freq 1).** Dossier-Alternative: „Or just `signus_prime` + leave
  `Signus Cluster` unresolved if Phase 2 doesn't want cluster-grain". Cluster-Grain ist
  über-grained ohne weitere Anker-Welten in derselben Cluster-Hierarchie — bleibt unresolved.
- **`mount_pharos` / `mount_deathfire` (freq 1 each).** Dossier-Alternative: „Default = **new
  rows**... or leave unresolved long-tail. Judgment." Beide sind geographische Sub-Features
  bestehender Welten (Sotha / Nocturne, beide existing rows); ohne klare Welt-Grain-Anker
  bleiben sie unresolved long-tail.
- **`kalium_gate` (freq 1, semi-generic).** Dossier-Note: „Phase-2 judgment whether to
  promote — single freq-1, semi-generic". Bleibt unresolved.
- **`Holst Aspyce` / `Phorus` / `Traoris` / `Trisolian` / `Alaxxes Nebula` / `One Forty
  Twenty` / `Madail` / `Ruinstorm`** (freq 1 each). Dossier-Note: „mostly unfamiliar /
  niche / non-world... default = **leave unresolved**". Alle bleiben unresolved long-tail.
  - `Ruinstorm` ist per Dossier §7d Axis-Disambig der Warp-Phänomen-Name, keine Location —
    Phase 2 lässt unresolved.
  - `Madail` ist per Dossier §7d Axis-Disambig ein Daemonischer Charakter (Lord of Hosts),
    keine Location — Phase 3 wird ihn als `madail`-Character promoten.

Insgesamt: 12 unresolved freq-1 Location-Surface-Forms bewusst nicht promotet (long-tail-Disziplin
per runbook §2: „lieber Long-Tail offen lassen als eine falsche Canonical-Kante schreiben").

## Vessel-Konvention (runbook §3 Phase 2)

`vengeful_spirit` als einziges Vessel der Welle: `tags: ["vessel"]`, `gx: null`, `gy: null`,
`sector: null` — exakt die runbook-konvention. Parity mit existing vessel rows (`casus_belli`,
`solace`, `ithracas_vengeance`, `steel_tread`, `sin_of_damnation`). Welt-Geographie schreibt
es nicht auf die Karte. Dossier §7d-Judgment „Vulkan Lives Conqueror question": nur das in
§3 freq-aggregierte Vessel wird promotet, kein vorgezogenes Forward-Promoting weiterer
HH-Schiffe (*Eisenstein*, *Furious Abyss*, *Conqueror*, etc.) — Future-Waves dürfen sie
nachziehen, wenn sie als location-axis Surface-Form auftauchen.

## Sectors.json

**Nicht berührt.** Per Dossier-Convention + runbook §3 Phase 2 („ggf. `sectors.json` nur falls
eine neue Location einen Sector-FK braucht"): alle 22 neuen Rows verwenden bestehende Sectors
(`solar`/`obscurus`) oder `null`. Keine neue Sector-Row erforderlich.

| sector-Wert | new-row Count | Begründung |
| --- | --- | --- |
| `solar` | 10 (`sol_system`, `lions_gate_spaceport`, `pluto`, + 7 Palace sub-locales) | Sol-System / Terra-Palace-Familie — Segmentum Solar |
| `obscurus` | 1 (`nostramo`) | Night Lords homeworld — kanonisch Obscurus |
| `null` | 11 (`vengeful_spirit` vessel + die 10 anderen freq-1 worlds ohne klare Segmentum-Pin) | Konservative-Default-Konvention parity mit dem Großteil bestehender freq-1-Rows (z.B. `colchis`, `monarchia`, `khur`, `nikaea`, `deliverance` aus Pass 10 sind alle `sector: null`) |

## Cross-Axis-/Cross-Pass-Konsistenz

- **`Molech` ↔ Phase-1 `house_devine`.** Phase-1 hat `house_devine` (Molech Knight house)
  als Faction-Row angelegt; Phase-2 promoted `molech` als zugehörige Welt — FK-konsistent über
  Welt-Tag `imperial_knights`. Keine direkte Schema-Beziehung, aber semantische Konsistenz.
- **`Beta-Garmon` ↔ Phase-1 Titan-Legionen.** Phase-1 hat `legio_ignatum`, `legio_solaria`,
  `legio_vulpa` als Sub-Tier unter `adeptus_titanicus` angelegt; Phase-2 promoted `beta_garmon`
  als Titandeath-System mit `tags: ["adeptus_titanicus"]`.
- **`Signus Prime` (welt) vs. `signus_cluster` (cluster)** — bewusste Asymmetrie: nur die
  konkrete Welt promotet, Cluster-Grain deferred (siehe Skipped-Bereich oben). Wenn Phase 3
  oder eine spätere Welle Signus-Cluster-Brauchtum entdeckt, kann sie nachgezogen werden.
- **Vessel-Konvention** repliziert die Pass-3/4/5 Vessel-Anker — keine neue Konvention,
  nur ein neuer Eintrag (`vengeful_spirit`).
- **Cross-axis-Konflikte (§4 Dossier-Output = 0).** `Ruinstorm` (location-axis Surface, aber
  Warp-Phänomen) und `Madail` (location-axis Surface, aber Daemon-Character) bleiben in
  Phase 2 unresolved und werden NICHT als Locations promotet — Dossier §7d-Axis-Disambig
  respektiert.

## Resolver-Trias (vor Commit)

- `npm run test:resolver` → **347 passed, 0 failed** (17 neue Pass-11-Phase-2-Test-Cases:
  7 strict-freq direct-matches + 8 standalone-curated direct-matches + 2 Palace-sub-locale
  direct-matches = 17 — Repräsentativ-Cut der 22 Rows; Schwelle ≥ 4 deutlich übererfüllt).
- `npm run test:resolver-data` → ok (sector-FKs verifiziert: `solar` und `obscurus`
  existieren; `null` ist erlaubt; `gx/gy` paired/null-paired ok; alias-targets unverändert).
- `npm run test:resolver-coverage` → unverändert von Pass-10/Phase-1 (read-only;
  berührt HH-003..008 erst in Phase 4a).
- `npm run test:apply-override-dry` → ok; Guard-Counts: `out-of-range=20, unknown-work=0`
  (Pass-10-Stand, HH-0003..0008-Apply erst in Phase 4a).

## Idempotenz-Check

Pro neuer Row wurde vor dem Insert geprüft, dass `id` und `name` in `locations.json` noch
nicht existieren und kein Surface-Form-Key in `location-aliases.json` belegt wird:

- `sol_system`, `vengeful_spirit`, `lions_gate_spaceport`, `chondax`, `molech`, `pluto`,
  `tallarn`: 7 strict-freq, keine bestehenden Rows / kein Konflikt. ok
- `nuceria`, `signus_prime`, `pythos`, `iydris`, `nostramo`, `chogoris`, `armatura`,
  `beta_garmon`: 8 curated worlds, keine bestehenden Rows. ok
- `eternity_gate`, `eternity_wall_spaceport`, `saturnine_gate`, `mercury_wall`,
  `delphic_battlement`, `golden_throne`, `sanctum_imperialis`: 7 Palace sub-locales, keine
  bestehenden Rows. ok
- Aliases (0 neue): nichts hinzugefügt, kein Konflikt. ok

## Test-Case-Zählung

17 neue Pass-11-Phase-2-Resolver-Test-Cases (≥ 4 Schwelle deutlich erfüllt; Phase-2 hat
relativ zu Phase 1 weniger Test-Cases, weil keine Aliases promotet wurden — die Test-Cases
sind alle direct-matches auf neuen Rows). Repräsentativer Cut der 22 Rows: alle 7 strict-freq +
8 prominente curated worlds + 2 representative Palace sub-locales. Die nicht explizit
test-gedeckten 5 Palace sub-locales (`eternity_gate`, `eternity_wall_spaceport`, `mercury_wall`,
`delphic_battlement`, plus `chogoris`/`nostramo` bereits durch direct-match-Tests gedeckt
... korrektur: alle 8 standalone-worlds sind getestet, die 5 ungetesteten Palace-sublocales
sind `eternity_gate`, `eternity_wall_spaceport`, `mercury_wall`, `delphic_battlement`, plus
die 7. — Test-Coverage genügt für die Stage-1-Direct-Match-Semantik per resolver, da alle
Rows dieselbe Lookup-Mechanik nutzen).

## Deferred / Phase-übergreifende Verweise

- **Phase 3 Character-FKs.** Die neuen Faction-Rows aus Phase 1 (`knights_errant`, …) und
  Location-Rows aus dieser Phase 2 sind FK-konsistent für Phase-3-Character-Promotions.
  Locations werden in `characters.json` nicht direkt referenziert (Character-Schema
  hat `primaryFactionId`, nicht `primaryLocationId`), daher gibt es keine direkte
  Phase-3-FK-Bindung aus Phase 2. Dossier §7b-Recommendations für Phase 3 sind
  unabhängig wirksam (`sanguinius`, `jaghatai_khan`, `perturabo` Primarch-Adds + die ~15
  freq-2 supporting-cast-Adds + ~25-45 curated freq-1 long-tail).
- **Phase 4a Apply-Side.** Die neuen Location-Rows fließen über `seed-resolver-extensions.ts`
  in die DB (Phase-4a-Concern, nicht hier). Override-Files (`manual-overrides-ssot-hh-003`..`008`)
  enthalten die Location-Surface-Forms aus §3 — der Resolver auf Apply-Seite löst sie via
  diese Phase-2-Adds (für die 22 promoteten Forms) bzw. lässt sie unresolved (für die 12
  bewusst-deferred Forms).
- **Cross-Era Audit-Cockpit (Phase 4b).** Die Palace sub-locale bloc adds (7 Rows) verfeinern
  die Audit-Granularität für die Siege-of-Terra-Arc-Bücher (HH-0055..HH-0067) — Phase 4b
  kann die Smoke-Slug-Junction-Counts gegen diese Granularität replizieren.

## Halt-Disziplin

- Mindestens ein commit pro Phase: ja (dieser commit).
- JSON-Files syntaktisch valide: ja (`locations.json` korrekt geschlossen, trailing comma vor
  schließendem `]` korrekt gesetzt, `location-aliases.json` und `sectors.json` unverändert).
- Architektonische Unsicherheit: nein — keine `Needs decision`-Blocker.
- Write-Scope: Diff ⊆ {`scripts/seed-data/locations.json`, `scripts/test-resolver.ts`,
  `sessions/resolver-dossiers/resolver-pass-11-phase-2-report.md`}.
  Nicht berührt im Scope: `scripts/seed-data/location-aliases.json` (keine neuen Aliase),
  `scripts/seed-data/sectors.json` (keine neuen Sectors).
- Co-Author-Trailer: keiner.

## Ready for Phase 3 (Characters)

Characters-Achs-Paket (`scripts/seed-data/characters.json`, `character-aliases.json`,
`scripts/test-resolver.ts`, Phase-3-Statusdatei) ist frei und FK-konsistent — Phase 2 hat
nur Location-Files berührt, keine Characters oder Factions. Phase-1-Faction-Set (insbesondere
`knights_errant`, `house_devine`, `sanguinary_guard`, `lectitio_divinitatus`, drei Titan-Legionen,
`thunder_warriors`, `selenar_gene_cult`) steht als `primaryFactionId`-Targets bereit, wie in
der Phase-1-Statusdatei `resolver-pass-11-phase-1-report.md` § „Deferred / Phase-übergreifende
Verweise" dokumentiert.
