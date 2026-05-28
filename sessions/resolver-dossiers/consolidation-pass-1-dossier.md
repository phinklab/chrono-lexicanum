# Consolidation-Pass 1 — Adjudication dossier

Pass-Scope: W40K-Entity-Set (Pässe 1..9, batches ssot-w40k-001..057).

Source-of-Truth: `sessions/resolver-dossiers/consolidation-pass-1-aggregator-output.md` (Aggregator-Run vom 2026-05-25, deterministic, byte-identisch re-runnable).

Aggregator-Heuristik: exact-normalized-name (NFKD + lower + punct-strip + honorific-strip) ∪ Jaccard ≥ 0.5 ∪ substring ∪ alias-name-coincidence, plus group-key bonus (parent/primaryFactionId/sector). Output sind **Kandidaten**, keine Decisions.

Adjudication: jeder Cluster bekommt eine Decision `merge | no-merge | flagged`. `merge` braucht einen Keeper-Row und einen explizit benannten Field-Retention-Plan; `no-merge` braucht eine Lore-Begründung; `flagged` blockiert die Welle und wird an den Maintainer eskaliert.

**Summary**: 15 Kandidaten-Cluster → **2 Merges** (1 Location + 1 Character), **13 No-Merges**, **0 Flagged**.

---

## Factions — 6 Cluster

### faction cluster 1 — `aeldari_corsairs` ↔ `eldar` → **no-merge**

`aeldari_corsairs` (Aeldari Corsairs, parent='eldar') ist eine **Sub-Faction** unter dem Eldar-Umbrella, `eldar` (Aeldari, parent=null) ist der Umbrella selbst. Substring-Token-Treffer ist erwartete Hierarchie-Form: das Alias `Eldar Corsairs` zeigt auf `eldar` (Pass-1-Era-Coarse-Tag), nicht auf `aeldari_corsairs`. Beide Rows sind getrennt korrekt: `eldar` als Authority-Layer für nicht-disambiguierte Eldar-Erwähnungen, `aeldari_corsairs` als sauberes Sub-Tier für die Corsair-spezifische Surface-Form (Robbie MacNiven's *Brutal Kunnin'* / Wraithbound-Cluster).

### faction cluster 2 — `chaos` ↔ `cult_of_chaos` → **no-merge**

`chaos` ist der **synthetische Umbrella-Row** (siehe `faction-policy.json#specialCases.chaos`: hosts Heresy-Traitor-Legionen + Sabbat-Worlds-Renegate + Daemons), `cult_of_chaos` ist ein **distinkter Cult-Tier-Row** (parent='chaos') für nicht-Astartes-Chaos-Cultisten ohne klare Marken-Affiliation. Substring-Token-Treffer ist erwartete Hierarchie-Form analog Cluster 1.

### faction cluster 3 — `hive_fleet_kraken` ↔ `hive_fleet_leviathan` → **no-merge**

Zwei **distinkte Hive Fleets** (Kraken = M41 / Macharian-Era; Leviathan = Indomitus-Era). False-positive auf den gemeinsamen Tokens `hive fleet` + shared-parent='tyranids'. Beide sind Pass-Original-Rows mit klar getrennten Quellen-Clustern.

### faction cluster 4 — `necromunda` ↔ `necromunda_enforcers` → **no-merge**

`necromunda` ist der **Necromunda-Planetary-Cluster-Mid-Knoten** (siehe `faction-policy.json#specialCases.necromunda`: hosts noble Houses + Clan-Houses + cult/guild-register), `necromunda_enforcers` ist ein **distinkter cult/guild-register-Row** (parent='necromunda') für die Enforcer-Surface-Form. Erwartete Hierarchie-Form.

### faction cluster 5 — `scythes_of_the_emperor` ↔ `talons_of_the_emperor` → **no-merge**

Token-Treffer (`of the emperor`) ist semantisch falsch: `scythes_of_the_emperor` ist ein **Astartes-Chapter** (parent='adeptus_astartes', Tyranid-Erst-Kontakt-Lore), `talons_of_the_emperor` ist ein **Custodes-+-Sisters-of-Silence-Umbrella** (parent='imperium', Authority-Layer für Imperial-Throne-Inner-Circle). Komplette Cross-Branch-Differenz. False-positive auf einer 3-of-5-Token-Überlappung mit semantisch unterschiedlichem Head-Token (`scythes` vs `talons`).

### faction cluster 6 — `sons_of_horus` ↔ `sons_of_sek` → **no-merge**

`sons_of_horus` ist die **Heresy-Traitor-Legion** (parent='heretic_astartes', Heresy-Era Lupercal-Saga), `sons_of_sek` ist die **Sabbat-Worlds-Renegate-Mortal-Force** (parent='chaos', Anakwanar-Sek-Anarchy in den Gaunt-Books der Salvation's-Reach- + Urdesh-Cluster). Astartes vs Mortal-Cultist — komplette Spezies/Tier-Differenz. False-positive auf `sons of` Token-Pair.

---

## Locations — 2 Cluster

### location cluster 1 — `baal` ↔ `baal_secundus` → **no-merge**

`baal` ist die **Blood-Angels-Homewelt** (M41 active throne-world, Devastation-of-Baal-Anchor W40K-0474), `baal_secundus` ist der **bewohnbare Mond/Satellit** im Baal-System (Recruiting-World für Blood-Angels-Aspiranten, Wüstenwelt-Lore). Beide sind distinkte astronomische Körper im selben System; shared-sector='tempestus' ist erwartet (gleiches Sub-Sector-Cluster), nicht Doublette-Indikator.

### location cluster 2 — `vigilus_s` → `vigilus` → **merge**

**MERGE-DECISION**. Beide Rows verweisen auf die Vigilus-Welt (Vigilus War / Imperium-Nihilus-Frontier-Anchor).

- **Keeper**: `vigilus` (Pass-Original-Row, korrekte Metadata: sector=ultima, gx=730, gy=355).
- **Mergee**: `vigilus_s` (name="Vigilus Core", sector=tempestus, gx=520, gy=520).

Beweislage: `vigilus_s` ist eine **Phantom-Row** — keine Override-Datei (alle batches/* Override-JSONs durchsucht) verweist auf die Surface-Form "Vigilus Core". Die Metadata (sector=tempestus statt ultima; gx/gy=520 statt 730/355) ist falsch und entspricht keiner Vigilus-Quelle. Mutmaßlicher Resolver-Pass-Defekt: Phase 2 hat in einer früheren Welle einen synthetischen Disambiguierungs-Suffix `_s` (=secondary?) erzeugt, ohne dass eine Surface-Form das gerechtfertigt hätte.

**Field-Retention-Plan**:
- Keeper-Row `vigilus` behält alle seine Felder unverändert (sector=ultima, gx=730, gy=355, M-scale-Range etc.).
- Vom Mergee-Row `vigilus_s` werden **keine Felder übernommen** (Phantom-Metadata).
- "Vigilus Core" wird als neuer Alias-Eintrag in `scripts/seed-data/location-aliases.json` aufgenommen (Robustheit gegen späteren Override-Drift).

**FK-Remap-Scope**: junction-Rows in `work_locations.location_id='vigilus_s'` müssen auf `vigilus` zeigen. Anzahl wird im DB-Sync-Pre-Snapshot ermittelt.

---

## Characters — 7 Cluster

### character cluster 1 — `amit` ↔ `harleen_amity` → **no-merge**

`amit` ist ein **Flesh-Tearer-Sergeant/Chaplain** (Pass-Original-Row, primaryFactionId='flesh_tearers', cross-cluster freq=3 in ssot-w40k-030/032/033). `harleen_amity` ist eine **Inquisitorin** (Pass-8-Phase-3-Row, primaryFactionId='inquisition', Scott's Warped-Galaxies-Cluster W40K-0488/0489). Substring-Treffer auf `amit` in `harleen_amity` ist Token-Artefakt — komplette Spezies + Faction + Quellen-Cluster-Differenz.

### character cluster 2 — `magister_sek` → `anakwanar_sek` → **merge**

**MERGE-DECISION**. Beide Rows verweisen auf den **Anarch der Sons of Sek** (Gaunt-Ghosts-Lore, Hauptantagonist der Sabbat-Worlds-Crusade-Späteren-Bücher).

- **Keeper**: `anakwanar_sek` (Pass-1-Era-Row, primaryFactionId='sons_of_sek', referenziert in batches/ssot-w40k-004.json für *Salvation's Reach* + *The Anarch*).
- **Mergee**: `magister_sek` (Pass-9-Phase-3-Row, primaryFactionId='sons_of_sek', Pass 9 hat den Pass-1-Row beim Promotion-Schritt für die Urdesh-Duology W40K-0549/0550 nicht erkannt).

Beweislage: `name="Magister Sek"` ist der Ehrentitel/Surface-Form, `name="Anakwanar Sek"` der canonical-Name. Same primaryFactionId, same Lore-Funktion (Anarch der Sons of Sek). Pass-9-Implementierer hat eine Doublette-Row produziert, weil der Pass-1-Row mit dem Honorific-stripped-Token `sek` nicht in die Re-Resolution einbezogen wurde — exakt der Klassen-Failure-Mode, gegen den dieser Pass entworfen ist.

**Field-Retention-Plan**:
- Keeper-Row `anakwanar_sek` behält `primaryFactionId='sons_of_sek'` (übereinstimmend) und `lexicanumUrl=null` (beide Rows null — keine Konfliktentscheidung).
- **`notes` wird übernommen**: `anakwanar_sek.notes` ist `null`, `magister_sek.notes` trägt die Urdesh-Duology-Kontextbeschreibung. Per Field-Retention-Regel („Feld, das in der behaltenen leer/null ist, wird in die behaltene Row übernommen") wandert die Mergee-`notes` in die Keeper-Row. Übernommener Inhalt (leicht entkoppelt von der wellenspezifischen Pass-9-Selbstreferenz, da der Row jetzt cross-pass wird): *"Anarch of the Sons of Sek, antagonist of Matthew Farrer's Urdesh duology (W40K-0549 The Serpent and the Saint, W40K-0550 The Magister and the Martyr); cross-cluster appearance in Sabbat-Worlds-Crusade-Saga (Salvation's Reach, The Anarch). Consolidation-Pass 1 merge of magister_sek into anakwanar_sek."*
- "Magister Sek" wird als neuer Alias-Eintrag in `scripts/seed-data/character-aliases.json` aufgenommen.

**FK-Remap-Scope**: junction-Rows in `work_characters.character_id='magister_sek'` müssen auf `anakwanar_sek` zeigen. Anzahl wird im DB-Sync-Pre-Snapshot ermittelt.

### character cluster 3 — `astor_sabbathiel` ↔ `saint_sabbat` → **no-merge**

`astor_sabbathiel` ist ein **Inquisitor** (Pilgrims-of-Fire/Awakenings-POV, primaryFactionId='inquisition'). `saint_sabbat` ist die **Saint Sabbat selbst** (Sabbat-Worlds-Crusade-Namenspatronin, primaryFactionId='ecclesiarchy'). Substring-Treffer auf `sabbat` ist false-positive — distinkte Personae, der Inquisitor ist nach der Saint benannt aber NICHT die Saint.

### character cluster 4 — `brielle` ↔ `brielle_gerrit` → **no-merge**

`brielle` ist die **Necromunda-Escher-Wild-Hydras-Gang-POV** in Hill's *Terminal Overkill* W40K-0173 (primaryFactionId='house_escher'). `brielle_gerrit` ist eine **Rogue-Trader-Erbin** (Lucian Gerrits Tochter) in Hoare's Rogue-Star-Trilogie W40K-0261..0263 (primaryFactionId='rogue_traders'). Komplett distinkte Welten, Quellen-Cluster, Faktionen.

### character cluster 5 — `gerontius_helmawr` ↔ `lord_helmawr` → **no-merge**

**Deliberate Split** (per Row-notes in `factions.json`-Adjazenz und `characters.json`-Row-notes). Klassisch-Imprint Lord Gerontius Helmawr (Necromunda-classic-Tyrannei-Lore) versus Modern-Imprint Lord Helmawr (Hill's Terminal Overkill / Necromunda-modern Hardback-Linie). Analoges Pattern zu `soul_drinkers` mit `tone='primaris_reboot_coexistent'`: dieselbe Lore-Funktion, aber zwei distinkte Imprint-Ebenen mit absichtlich getrennten Rows. **Don't unify cross-imprint personae** ist Resolver-Convention-Pflicht.

### character cluster 6 — `ivan` ↔ `ivan_sternberg` → **no-merge**

`ivan` ist ein **Praetorian-Guard-Ensemble-Mitglied** in King's Macharian-Crusade-Trilogie W40K-0361..0364 (primaryFactionId='astra_militarum', freq 4). `ivan_sternberg` ist ein **Imperial Inquisitor** in *Ragnar's Claw* W40K-0153 (primaryFactionId='inquisition', Talisman-of-Lykos-Plotline). Komplett distinkte Personen mit nur einem Vornamen-Token-Treffer.

### character cluster 7 — `lord_solar_macharius` ↔ `macha` → **no-merge**

`lord_solar_macharius` ist der **Lord Solar Macharius** (Eroberer der Macharian-Crusade, M41 Imperium, primaryFactionId='astra_militarum'). `macha` ist die **Aeldari-Farseerin Macha** (*Dawn of War*-Lore, primaryFactionId='eldar'). Substring-Treffer ist false-positive auf den ersten 4 Buchstaben — komplett distinkte Spezies, Faction, Geschlecht, Era.

---

## Closing notes

- **Lore-Tiefe-Klassifikation**: Beide Merges (`vigilus_s → vigilus`, `magister_sek → anakwanar_sek`) sind **mechanisch eindeutige Doubletten** mit klarer Identitäts-Übereinstimmung. Keine lore-deep-Merges in dieser Welle, keine Identitäts-Unsicherheiten.
- **Token-Budget**: Aggregator + Adjudication zusammen unter 30k Tokens (gut innerhalb 120k-Limit).
- **Resolver-Pass-Defekt-Spuren**: Cluster 2-Location (`vigilus_s` Phantom-Row) und Cluster 2-Character (`magister_sek` Pass-9-Pass-1-Honorific-Miss) sind beide Belege dafür, dass der Consolidation-Pass als wiederkehrendes Sanitization-Tool gerechtfertigt ist.
