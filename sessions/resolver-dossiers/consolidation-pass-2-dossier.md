# Consolidation-Pass 2 — Adjudication dossier

Pass-Scope: Full-Corpus (W40K Pässe 1..9 + HH Pässe 10..15, batches ssot-w40k-001..057 + ssot-hh-001..030).

Source-of-Truth: `sessions/resolver-dossiers/consolidation-pass-2-aggregator-output.md` (Aggregator-Run vom 2026-05-27, deterministic, byte-identisch re-runnable).

Aggregator-Heuristik (Brief 102): Pass-1-Base — exact-normalized-name (NFKD + lower + punct-strip + honorific-strip) ∪ Jaccard ≥ 0.5 ∪ substring ∪ alias-name-coincidence ∪ group-key bonus (parent/primaryFactionId/sector) — plus drei neue HH-aware Signale:

- **Cross-era-anchor-breach**: alias-coincidence-Edge wird zusätzlich annotiert, wenn die geteilte Surface-Form zu einer fest definierten Liste pinned cross-era-Anchor-Surface-Forms gehört (Luna Wolves, Imperial Army, Mechanicum, Ezekyle Abaddon, Kharn, Magnus, Lucius, Ahriman, Horus Lupercal, Calas Typhon, Corvus Corax, Lorgar Aurelian, Little Horus Aximand, Nassir Amit, Alexis Pollux, Dantioch, Maloghurst, Arvida, Aenoid Thiel, etc.). Tripwire gegen Cross-Era-Doubletten, die Pass-1-Heuristik allein nicht fängt.
- **Slug-edit-distance** (locations only): Wagner-Fischer Levenshtein über `joined`-Token-Feld; Schwelle `distance ≤ 2 AND ratio ≤ 0.25 AND min-len ≥ 4`. Fängt Transliterations-Doubletten wie `isstvan ↔ istvaan`, `prospero ↔ prosperan`, `calth ↔ caltha`. Schwelle ist absichtlich so gewählt, dass kanonische Sub-Cluster-False-Positives wie `vigilus ↔ vigil` (ratio 0.286) NICHT triggern.
- **Primarch-stem** (characters only): 22 Primarchen-Stems (horus, sanguinius, rogal dorn, lion eljonson, leman russ, lorgar, fulgrim, perturabo, corax, alpharius, omegon, konrad curze, night haunter, magnus, ferrus manus, mortarion, vulkan, roboute guilliman, guilliman, angron, jaghatai khan, jaghatai). Edge wird gezogen, wenn ein Stem als Token-Subset in mindestens zwei Character-Rows vorkommt — fängt Primarch ↔ Primarch-Sub-Persona-Doubletten (z.B. `magnus` als Primarch vs `magnus` als Andererwhere-Surface-Form).

Output sind **Kandidaten**, keine Decisions.

Adjudication: jeder Cluster bekommt eine Decision `merge | no-merge | flagged`. `merge` braucht einen Keeper-Row und einen explizit benannten Field-Retention-Plan; `no-merge` braucht eine Lore-Begründung; `flagged` blockiert die Welle und wird an den Maintainer eskaliert.

**Summary** (Stand Phase 3): 6 Faction + 7 Location + 10 Character = 23 Kandidaten-Cluster → **2 Merges** (beide Characters), **21 No-Merges**, **0 Flagged**.

---

## Factions — 6 Cluster

### faction cluster 1 — `aeldari_corsairs` ↔ `eldar` → **no-merge**

`aeldari_corsairs` (Aeldari Corsairs, parent='eldar') ist eine **Sub-Faction** unter dem Eldar-Umbrella, `eldar` (Aeldari, parent=null) ist der Umbrella selbst. Substring-Token-Treffer ist erwartete Hierarchie-Form: das Alias `Eldar Corsairs` zeigt auf `eldar` (Pass-1-Era-Coarse-Tag), nicht auf `aeldari_corsairs`. Beide Rows sind getrennt korrekt: `eldar` als Authority-Layer für nicht-disambiguierte Eldar-Erwähnungen, `aeldari_corsairs` als sauberes Sub-Tier für die Corsair-spezifische Surface-Form. **Pass-2-Update**: Pass-2-Aggregator emittiert kein cross-era-anchor-breach-Signal — Eldar-Surface-Formen sind keine Cross-Era-Anchors (Eldar haben kein 30K↔40K-Era-Spaltungs-Problem wie Luna-Wolves↔Sons-of-Horus).

### faction cluster 2 — `chaos` ↔ `cult_of_chaos` → **no-merge**

`chaos` ist der **synthetische Umbrella-Row** (siehe `faction-policy.json#specialCases.chaos`: hosts Heresy-Traitor-Legionen + Sabbat-Worlds-Renegate + Daemons), `cult_of_chaos` ist ein **distinkter Cult-Tier-Row** (parent='chaos') für nicht-Astartes-Chaos-Cultisten ohne klare Marken-Affiliation. Substring-Token-Treffer ist erwartete Hierarchie-Form analog Cluster 1.

### faction cluster 3 — `hive_fleet_kraken` ↔ `hive_fleet_leviathan` → **no-merge**

Zwei **distinkte Hive Fleets** (Kraken = M41 / Macharian-Era; Leviathan = Indomitus-Era). False-positive auf den gemeinsamen Tokens `hive fleet` + shared-parent='tyranids'. Beide sind Pass-Original-Rows mit klar getrennten Quellen-Clustern. HH-Wellen 10..15 berühren weder Hive Fleet — Tyraniden sind ein reines M41/M42-Phänomen.

### faction cluster 4 — `necromunda` ↔ `necromunda_enforcers` → **no-merge**

`necromunda` ist der **Necromunda-Planetary-Cluster-Mid-Knoten** (siehe `faction-policy.json#specialCases.necromunda`: hosts noble Houses + Clan-Houses + cult/guild-register), `necromunda_enforcers` ist ein **distinkter cult/guild-register-Row** (parent='necromunda') für die Enforcer-Surface-Form. Erwartete Hierarchie-Form.

### faction cluster 5 — `scythes_of_the_emperor` ↔ `talons_of_the_emperor` → **no-merge**

Token-Treffer (`of the emperor`) ist semantisch falsch: `scythes_of_the_emperor` ist ein **Astartes-Chapter** (parent='adeptus_astartes', Tyranid-Erst-Kontakt-Lore), `talons_of_the_emperor` ist ein **Custodes-+-Sisters-of-Silence-Umbrella** (parent='imperium', Authority-Layer für Imperial-Throne-Inner-Circle). Komplette Cross-Branch-Differenz. False-positive auf einer 3-of-5-Token-Überlappung mit semantisch unterschiedlichem Head-Token (`scythes` vs `talons`).

### faction cluster 6 — `sons_of_horus` ↔ `sons_of_sek` → **no-merge**

`sons_of_horus` ist die **Heresy-Traitor-Legion** (parent='heretic_astartes', Heresy-Era Lupercal-Saga), `sons_of_sek` ist die **Sabbat-Worlds-Renegate-Mortal-Force** (parent='chaos', Anakwanar-Sek-Anarchy in den Gaunt-Books der Salvation's-Reach- + Urdesh-Cluster). Astartes vs Mortal-Cultist — komplette Spezies/Tier-Differenz. False-positive auf `sons of` Token-Pair.

**Pass-2-Cross-Era-Validierung**: `sons_of_horus` hostet das **Luna-Wolves**-Alias (HH-Pre-Lupercal-Surface-Form per ADR `brain/wiki/decisions/cross-era-identities.md`). Der Aggregator hat dieses Alias gesehen, aber emittiert **kein cross-era-anchor-breach-Signal** auf den faction-Cluster 6 — d.h. die Heresy-Pässe (10..15) haben Luna-Wolves konsistent auf `sons_of_horus` aufgelöst (per Alias) und nicht versehentlich einen Doublette-Row erzeugt. Das ist die positive Validation, die der Pass für die Cross-Era-Hardening sucht.

---

## Locations — 7 Cluster

### location cluster 1 — `baal` ↔ `baal_secundus` → **no-merge**

`baal` ist die **Blood-Angels-Homewelt** (M41 active throne-world, Devastation-of-Baal-Anchor W40K-0474, sector=tempestus, gx=545/gy=440, tag=blood_angels), `baal_secundus` ist der **bewohnbare Mond/Satellit** im Baal-System (Recruiting-World für Blood-Angels-Aspiranten, Wüstenwelt-Lore, sector=tempestus). Beide sind distinkte astronomische Körper im selben System; shared-sector='tempestus' ist erwartet (gleiches Sub-Sector-Cluster), nicht Doublette-Indikator. Identische Pass-1-Entscheidung.

### location cluster 2 — `barbarus` ↔ `tartarus` → **no-merge** (slug-edit-distance false-positive)

**HH-aware signal**: erste slug-edit-distance-Edge in der Pass-2-Aggregator-Ausgabe (Wagner-Fischer Levenshtein = 2 auf den Joins `barbarus` ↔ `tartarus`, ratio 0.25). Lore-Distinktion ist trotzdem klar:

- `barbarus` (tags=`["death_guard"]`) ist die **Death-Welt der Death Guard** — Mortarions Heimat, mit der toxischen Schwefel-Atmosphäre und den Highland-Hexen-Lords; HH-Anchor *The Buried Dagger* + *Cradle of Death*. Pre-Heresy-Mortarion-Lore-Welt.
- `tartarus` (tags=`[]`) ist ein **distinkter Heresy-Era-Cluster-Welt** (Word-Bearers-/Sons-of-Horus-Operationen in HH-Subplots; Tartarus-Pattern-Terminator-Rüstung leitet ihren Namen von der gleichen Welt-Klassifikations-Hierarchie ab). Keine Tags, keine Cross-Coincidence mit Death-Guard.

Signal hat seine Funktion erfüllt (slug-Distanz-Tripwire greift), Adjudication überschreibt korrekt zu no-merge auf Tag-Disjunktheit + Lore-Distinktheit. Diese Klasse von false-positive ist die akzeptierte Kosten-Seite der Tripwire-Schwelle — der gleiche Schwellenwert würde echte Doubletten wie `isstvan ↔ istvaan` (jaccard=0, slug-distance=1) korrekt fangen.

### location cluster 3 — `beta_garmon` ↔ `garm` → **no-merge**

`beta_garmon` (tags=`["adeptus_titanicus"]`) ist der **Beta-Garmon-Cluster** — der HH-Titan-Krieg-Anchor (Titandeath, Titanicus-Saga), drei-Welten-Sub-Sector. `garm` (tags=`[]`) ist eine **separate untagged Welt** ohne Verbindung zum Garmon-Cluster (kein "Beta-Garmon I/II/III"-Aliases auf `garm`, kein shared-sector). Substring-Treffer auf Token-Suffix `garm` ↔ Token-Präfix `garm` ist false-positive — der Cluster Beta-Garmon hat keine "Garm"-Surface-Form in Lore oder Aliases.

### location cluster 4 — `imperial_webway` ↔ `webway` → **no-merge**

Lore-distinkte aber **konzeptuell verwandte** Region-Rows:

- `webway` (tags=`["region"]`) ist das **ursprüngliche Eldar-Webway** — Aeldari-Tech-Netzwerk durch den Immaterium-Schatten, Old-One-Erbe; canonical-region für alle Eldar-/Drukhari-Transit-Lore.
- `imperial_webway` (tags=`["imperium"]`) ist die **Imperial-Webway-Erweiterung** — Big-E's und Magnus' gescheitertes Projekt, das Eldar-Webway in die Mankind-Domain auszudehnen; HH-Anchor *A Thousand Sons* (Magnus bricht den Schutz, durch den Big-E sich verriegelt) + *The First Heretic* + *Master of Mankind*.

Distinkte named entities mit distinkten Lore-Funktionen — die Imperial-Konstruktion war zwar ein Anbau AN das Webway, aber das macht sie nicht zu einer Doublette. Cf. analoges Pattern in Factions, wo `adeptus_astartes` und `heretic_astartes` als distinkte Top-Knoten neben einander stehen, obwohl die Heretic-Astartes ursprünglich Adeptus-Astartes waren.

### location cluster 5 — `ithraca` ↔ `ithracas_vengeance` → **no-merge** (Planet ↔ Ship-named-after-Planet)

- `ithraca` (sector=`ultima`, tags=`["ultramarines","word_bearers"]`) ist eine **Welt** im Ultima-Segmentum (HH-Reference in *Damnation of Pythos* + *Pharos*-Lore-Bogen).
- `ithracas_vengeance` (tags=`["vessel"]`) ist ein **Schiff** (Loyalisten-/Pharos-Lore-Zeitalter Star-Vessel), benannt nach der Welt.

Pattern: Planet ↔ Ship-named-after-planet. Distinkter entity-Typ via `tags:vessel`. Erwartet — same für cluster 6 + 7.

### location cluster 6 — `macragge` ↔ `macragges_honour` → **no-merge** (Planet ↔ Ship-named-after-Planet)

- `macragge` (sector=`ultima`, tags=`["ultramarines"]`, capital=true) ist die **Ultramarines-Homewelt** (Mac-Mob-Anchor — HH *Know No Fear* / *Unremembered Empire* / *Pharos* + W40K-Devastation-of-Macragge / *Spear of the Emperor*).
- `macragges_honour` (tags=`["vessel"]`) ist **Roboute Guilliman's Flaggschiff** — eine Battle-Barge der Ultramarines, benannt nach der Heimatwelt. HH-Anchor *Calth-Saga* / *The Unremembered Empire* / *The Avenging Son*; W40K-Reborn-Primarch-Bogen.

### location cluster 7 — `molech` ↔ `molechs_enlightenment` → **no-merge** (Planet ↔ Ship-named-after-Planet)

- `molech` (tags=`["imperial_knights"]`) ist die **Imperial-Knights-Welt mit Big-E's geheimer Knowledge-Halle** — HH-Anchor *Vengeful Spirit* (Horus erbeutet das Wissen aus den Cthonian-Hallen unter Molech, primärer Pivot-Punkt der Heresy für Horus' Korruption) + *Saturnine* (Sigismund-Duell-Setup).
- `molechs_enlightenment` (tags=`["vessel"]`) ist ein **Schiff** der Cabala-/Heresy-Era-Renegades, benannt nach dem Pivot-Ereignis auf Molech.

---

## Characters — 10 Cluster

### character cluster 1 — `amit` ↔ `harleen_amity` → **no-merge**

`amit` (primaryFactionId=`flesh_tearers`, notes: cross-cluster ssot-w40k-030/032/033, freq=3) ist ein **Flesh-Tearer-Sergeant/Chaplain** (Pass-Original-Row mit existierendem Alias "Nassir Amit"). `harleen_amity` (primaryFactionId=`inquisition`, Pass-8-Phase-3-Row) ist eine **Inquisitorin** in Scott's Warped-Galaxies-Cluster W40K-0488/0489. Substring-Treffer auf `amit` ist Token-Artefakt — komplette Spezies + Faction + Quellen-Cluster-Differenz. Identische Pass-1-Entscheidung.

### character cluster 2 — `astelan` ↔ `merir_astelan` → **merge** (cross-era identity)

**MERGE-DECISION**. Beide Rows verweisen auf **denselben Dark-Angel/Fallen-Angel-Captain**:

- `astelan` (W40K-canonical short-form, primaryFactionId=`fallen_angels`, notes=null) ist die **W40K-Era-Surface-Form** für den Fallen Angel Astelan (Lexicanum-Lemma "Merir Astelan"; Fallen-Angel-Interrogations-Lore-Cluster).
- `merir_astelan` (HH-Era full-canonical-name, primaryFactionId=`dark_angels`, notes: Pass-13 Phase 3 7c curated freq=1, *Call of the Lion* HH-0154 Astelan vs Belath compliance-debate) ist die **HH-Era-Surface-Form** für den Dark-Angels-Chapter-Master Merir Astelan.

Beweislage: Die `merir_astelan`-Notes selbst dokumentieren explizit die Cross-Era-Kontinuität — *"Cross-arc with the Fallen / Cypher / Lion arcs (his post-Heresy First-of-the-Fallen status is downstream from his Pass-13 surface). primaryFactionId dark_angels (Heresy-era)."* Der Pass-13-Implementierer war sich der Cross-Era-Identität bewusst, behielt aber zwei separate Rows. **Genau dieser Klassen-Failure-Mode** ist der Anlass für die Cross-Era-Identities-ADR (Brief 100) + diese retroaktive Konsolidierung.

- **Keeper**: `astelan` (W40K-canonical short-form per ADR-Pattern Cross-Era-Identities — analog `horus` (HH "Horus Lupercal" alias), `lorgar` (HH "Lorgar Aurelian" alias), `typhus` (HH "Calas Typhon" alias)).
- **Mergee**: `merir_astelan` (HH full canonical name wandert in Aliases).

**Field-Retention-Plan**:
- Keeper-Row `astelan` behält `primaryFactionId='fallen_angels'` (keeper-wins per Pass-1-Default; W40K-Canon-State entspricht der ADR-Präferenz für Cross-Era-Identitäten). Die HH-Pre-Fall-Dark-Angels-Era-Affiliation ist via Notes-Rewrite eingebettet.
- **`notes` wird übernommen** (fill-keeper-null-from-mergee): `astelan.notes` ist null, `merir_astelan.notes` trägt den Pass-13-HH-Era-Kontext. Übernommener Inhalt (cross-era-coherent rewrite):
  *"Cross-era identity: HH-era Dark Angels chapter-master Merir Astelan (Resolver-Pass 13 Phase 3, freq=1) debating compliance around Byzanthis in Call of the Lion (HH-0154, Astelan vs Belath compliance debate); cross-arc with the Fallen / Cypher / Lion arcs. Post-Heresy: First-of-the-Fallen renegade. primaryFactionId fallen_angels reflects the W40K-era canonical state (keeper-wins per consolidation-pass-2 field-retention; HH-era dark_angels affiliation captured here via cross-era note per ADR cross-era-identities). Consolidation-Pass 2 merge of merir_astelan (HH-era surface form) into astelan (W40K-canonical row)."*
- "Merir Astelan" wird als neuer Alias-Eintrag in `scripts/seed-data/character-aliases.json` aufgenommen (HH-Era-Surface-Form zeigt auf `astelan`).

**FK-Remap-Scope**: junction-Rows in `work_characters.character_id='merir_astelan'` müssen auf `astelan` zeigen. Anzahl wird im DB-Sync-Pre-Snapshot ermittelt. Keine logischen FK-Touches auf `characters.primary_faction_id` (faction-Refs sind character→faction, nicht character→character; und keine andere Row hat primary_faction_id='merir_astelan').

### character cluster 3 — `astor_sabbathiel` ↔ `saint_sabbat` → **no-merge**

`astor_sabbathiel` (primaryFactionId=`inquisition`, notes: Inquisitor POV; Pilgrims of Fire, Awakenings) ist ein **Inquisitor** (W40K-Era). `saint_sabbat` (primaryFactionId=`ecclesiarchy`, notes=null) ist die **Saint Sabbat selbst** (Sabbat-Worlds-Crusade-Namenspatronin). Substring-Treffer auf `sabbat` ist false-positive — der Inquisitor ist nach der Saint benannt aber NICHT die Saint. Identische Pass-1-Entscheidung.

### character cluster 4 — `bjorn` ↔ `strybjorn_grimskull` → **no-merge**

- `bjorn` (primaryFactionId=`space_wolves`, alias "Bjorn the One-Handed", notes: HH-Pass 11 Phase 3, freq 2, *War Without End* HH-0033 / *Wolfsbane* HH-0049) ist der **future-Bjorn-the-Fell-Handed** Space-Wolves-Anchor (Primarch-Companion-Dreadnought-Träger in W40K-Era, hier in HH-Era seine pre-Sarcophagus-Living-Astartes-Form).
- `strybjorn_grimskull` (primaryFactionId=`space_wolves`, notes: Space-Wolves-saga POV; ex-Grimskull-tribe rival who becomes Ragnar's pack-brother) ist ein **distinkter Space-Wolves-Charakter** aus William King's Ragnar-saga (W40K-Era).

Substring-Treffer auf `bjorn` (in `strybjorn` als Token-Suffix) + shared-primaryFactionId ist false-positive — komplett distinkte Personae, getrennte Lore-Bögen, getrennte Quellen-Cluster.

### character cluster 5 — `brielle` ↔ `brielle_gerrit` → **no-merge**

`brielle` (primaryFactionId=`house_escher`, notes: Escher Wild-Hydras gang POV in Hill's Terminal Overkill W40K-0173) ist die **Necromunda-Escher-Gang-POV**. `brielle_gerrit` (primaryFactionId=`rogue_traders`, notes: Rogue Trader Lucian's daughter, Hoare Rogue-Star trilogy W40K-0261..0263) ist eine **Rogue-Trader-Erbin**. Komplett distinkte Welten, Quellen-Cluster, Faktionen. Identische Pass-1-Entscheidung.

### character cluster 6 — `gerontius_helmawr` ↔ `lord_helmawr` → **no-merge** (deliberate cross-imprint split)

Beide Rows haben **explizite Notes**, die den Deliberate-Split dokumentieren:
- `gerontius_helmawr.notes`: *"Classic-imprint Spire-Lord of Hive Primus; assassinated in Lasgun Wedding (W40K-0170). Distinct row from the modern-imprint lord_helmawr per the soft-reboot in-fiction-continuity break (Loop-Log: 'Lord Helmawr is alive again' in Soulless Fury)"*
- `lord_helmawr.notes`: *"Modern-imprint Spire-Lord of Hive Primus in Soulless Fury (W40K-0177); soft-reboot revival of the throne after the classic Lord Gerontius Helmawr's assassination. Distinct row from gerontius_helmawr"*

**Don't unify cross-imprint personae** ist Resolver-Convention-Pflicht. Identische Pass-1-Entscheidung.

### character cluster 7 — `horus` ↔ `horus_aximand` → **no-merge** (primarch-stem signal — Primarch ↔ Captain-named-after-Primarch)

**HH-aware signal**: erste primarch-stem-Edge in der Pass-2-Aggregator-Ausgabe (Stem `horus` als Token-Subset in beiden Rows). Lore-Distinktion ist trotzdem klar:

- `horus` (primaryFactionId=`sons_of_horus`, alias "Horus Lupercal", notes: Pass-10 Phase 3 freq 3, Warmaster Horus, Primarch of Sons of Horus / Luna Wolves; opening Heresy arc HH-0001/0002/0003) ist **der Primarch selbst**.
- `horus_aximand` (primaryFactionId=`sons_of_horus`, alias "Little Horus Aximand", notes: Pass-10 Phase 3 freq 2 + freq 1 alias, Sons of Horus Mournival captain 'Little Horus' nickname; opening trilogy HH-0001/0002 + Age of Darkness HH-0016) ist **Captain "Little Horus" Aximand** — Mournival-Captain der Sons of Horus, der **nach** dem Primarch benannt wurde (Mournival-Tradition der Echo-Names).

Signal hat seine Funktion erfüllt (Primarch-Stem-Tripwire greift), Adjudication überschreibt korrekt zu no-merge auf Rang + Persona-Distinktheit. Pattern: Primarch ↔ Astartes-Captain-named-after-Primarch — analog zum Location-Pattern Planet ↔ Ship-named-after-Planet (cluster 5-7 Locations). **Positive Cross-Era-Validation**: HH-Wellen 10..15 haben Horus Lupercal und Little Horus Aximand korrekt als distinkte Rows behalten; Mournival-Tradition wird via Alias-Layer abgebildet, nicht durch Row-Duplikation.

### character cluster 8 — `ivan` ↔ `ivan_sternberg` → **no-merge**

`ivan` (primaryFactionId=`astra_militarum`, notes: Pass-7 Praetorian Guard ensemble member of King's Macharian Crusade W40K-0361..0364, freq 4) ist ein **Praetorian-Guard-Ensemble-Mitglied**. `ivan_sternberg` (primaryFactionId=`inquisition`, notes: Imperial Inquisitor quest-giver in Ragnar's Claw W40K-0153) ist ein **Imperial Inquisitor**. Komplett distinkte Personen mit nur einem Vornamen-Token-Treffer. Identische Pass-1-Entscheidung.

### character cluster 9 — `lord_solar_macharius` ↔ `macha` → **no-merge**

`lord_solar_macharius` (primaryFactionId=`astra_militarum`, notes: Pass-7 lore-iconic conqueror of the Macharian Crusade M41, William King's trilogy W40K-0361..0364, freq 4) ist der **Lord Solar Macharius**. `macha` (primaryFactionId=`eldar`, notes=null) ist die **Aeldari-Farseerin Macha** (*Dawn of War*-Lore). Substring-Treffer ist false-positive auf den ersten 4 Buchstaben — komplett distinkte Spezies, Faction, Geschlecht, Era. Identische Pass-1-Entscheidung.

### character cluster 10 — `nykona_sharrowkyn` ↔ `sharrowkyn` → **merge** (same-era doublette)

**MERGE-DECISION**. Beide Rows verweisen auf **denselben Raven-Guard-Mor-Deythan-Charakter** Nykona Sharrowkyn (Graham McNeill, Shattered-Legions/Sisypheum-Saga):

- `sharrowkyn` (primaryFactionId=`raven_guard`, surname-only short-form, notes: Pass-11 Phase 3 7c curated freq=1 lore-iconic, Raven Guard sniper, Shattered Legions associate, *Angel Exterminatus* HH-0023).
- `nykona_sharrowkyn` (primaryFactionId=`raven_guard`, full canonical name, notes: Pass-13 Phase 3 7c medium freq=1 Phase-3-promote, Raven Guard Shadowmaster debut paired with Sabik Wayland, *Kryptos* HH-0167 Graham McNeill, Sisypheum origin).

Beweislage: Sowohl *Angel Exterminatus* (HH-0023, McNeill) als auch *Kryptos* (HH-0167, McNeill) sind Teile derselben Shattered-Legions/Sisypheum-Saga. Beide referenzieren denselben Raven-Guard-Mor-Deythan-Charakter — den Pass-11-Implementierer hat den Pass-Original-Row dann mit dem surname-only-Slug erstellt, der Pass-13-Implementierer hat zwei Wellen später den full-canonical-name-Row erstellt, ohne den existierenden Pass-11-Row zu erkennen. **Same-Era-Cross-Pass-Doublette** — derselbe Klassen-Failure-Mode wie Pass-1 `magister_sek → anakwanar_sek` (Pass-9-Implementierer erkannte Pass-1-Row nicht beim Honorific-Strip).

- **Keeper**: `nykona_sharrowkyn` (full canonical name; Lexicanum-Lemma; Pass-13 ist die neuere Promotion mit Sisypheum-Origin-Kontext).
- **Mergee**: `sharrowkyn` (surname-only short-form).

**Field-Retention-Plan**:
- Keeper-Row `nykona_sharrowkyn` behält `primaryFactionId='raven_guard'` (identisch, keine Konflikt-Entscheidung).
- **`notes` wird angereichert** (keeper has content, mergee has unique cross-pass content): Keeper-notes werden um Pass-11-Anchor (*Angel Exterminatus*) ergänzt:
  *"Resolver-Pass 13 Phase 3 (7c medium freq=1 Phase-3-promote per dossier recommendation — Raven Guard Shadowmaster debut, cross-arc with the Sisypheum arc + future Shattered-Legions novellas): Raven Guard Shadowmaster debut paired with Sabik Wayland; Kryptos (HH-0167, Graham McNeill — Sharrowkyn / Wayland + Sisypheum origin). Earlier Resolver-Pass 11 Phase 3 surface (7c curated freq=1 lore-iconic): Raven Guard sniper, Shattered Legions associate, Angel Exterminatus (HH-0023). primaryFactionId raven_guard. Consolidation-Pass 2 merge of sharrowkyn (surname-only short-form, Pass-11 surface) into nykona_sharrowkyn (full canonical name, Pass-13 surface)."*
- "Sharrowkyn" wird als neuer Alias-Eintrag in `scripts/seed-data/character-aliases.json` aufgenommen (surname-only-Surface-Form zeigt auf `nykona_sharrowkyn`).

**FK-Remap-Scope**: junction-Rows in `work_characters.character_id='sharrowkyn'` müssen auf `nykona_sharrowkyn` zeigen. Anzahl wird im DB-Sync-Pre-Snapshot ermittelt. Keine logischen FK-Touches.

---

## Closing notes

### Lore-Tiefe-Klassifikation der zwei Pass-2-Merges

- **`merir_astelan → astelan`** — **Lore-Deep-Tier** (cross-era identity, ADR-driven). Die Mergee-Notes selbst dokumentieren die Cross-Era-Kontinuität, die Pass-13 nicht konsolidierte — der Merge ist die retroaktive Anwendung der Cross-Era-Identities-ADR (Brief 100) auf einen Pass-13-Row, dessen Implementierer die Identität erkannte, aber die ADR-Policy noch nicht hatte. **Diese Merge-Klasse ist der primäre Lore-Beweis dafür, dass Pass 2 als HH-Konsolidierungs-Pass nötig war** — Pass-1-Konsolidierung hätte den Row mangels HH-Pässen nicht greifen können; ohne Pass-2 wäre der Doublette dauerhaft im Reference-Layer geblieben.
- **`sharrowkyn → nykona_sharrowkyn`** — **Mechanical-Tier** (same-era cross-pass doublette). Klassen-identisch zu Pass-1 `magister_sek → anakwanar_sek` (Pass-9-Implementierer erkannte Pass-1-Row nicht beim Honorific-Strip). Pass-11 erstellte `sharrowkyn`, Pass-13 erstellte `nykona_sharrowkyn`, beide für denselben McNeill-Raven-Guard-Mor-Deythan-Charakter aus der Shattered-Legions-Saga. Mechanically eindeutig.

### HH-aware Aggregator-Signal-Bilanz (Pass-2-Gesamt)

| Signal-Klasse | Trigger-Count | True-Positive (Merge) | False-Positive (No-Merge) | Notes |
|---|---|---|---|---|
| **cross-era-anchor-breach** | 0 | 0 | 0 | Pinned cross-era surface forms (Luna Wolves, Imperial Army, Mechanicum, Ezekyle Abaddon, Kharn, Magnus, Lucius, Ahriman, Horus Lupercal, Calas Typhon, Corvus Corax, Lorgar Aurelian, Little Horus Aximand, Nassir Amit, Alexis Pollux, Dantioch, Maloghurst, Arvida, Aenoid Thiel) wurden in HH-Wellen 10..15 konsistent auf canonical W40K-IDs aufgelöst. **Positive Cross-Era-Validation** — ADR + Brief 100 haben gehalten. |
| **slug-edit-distance** (locations) | 1 | 0 | 1 (`barbarus ↔ tartarus`) | False-positive, aber Signal-justifiziert: derselbe Schwellenwert würde `isstvan ↔ istvaan` (Levenshtein 1) fangen, die Pass-1-Heuristik übersieht. |
| **primarch-stem** (characters) | 1 | 0 | 1 (`horus ↔ horus_aximand`) | False-positive (Primarch ↔ Captain-named-after-Primarch — analog Planet↔Ship). |
| **Pass-1-base-Heuristiken** (jaccard / substring / alias-coincidence / group-key) | 21 | 2 (`astelan ↔ merir_astelan`, `sharrowkyn ↔ nykona_sharrowkyn`) | 19 | Base-Heuristik trägt **beide** Pass-2-Merges. HH-aware-Signale haben **keinen** Merge produziert. |

**Beobachtung**: Beide Merges (Lore-Deep + Mechanical) wurden von Pass-1-Base-Heuristiken (jaccard ≥ 0.5 + substring + shared-primaryFactionId) gefunden. Die HH-aware Signale (cross-era-anchor-breach + slug-edit-distance + primarch-stem) emittierten 2 zusätzliche Kandidaten (1 location + 1 character), beide false-positives. **Signal-Wert der HH-aware Layer**: trotz 0 True-Positives in diesem Pass haben sie ihre Funktion erfüllt — sie sind Tripwires, die negative-validate hätten gegen-bewiesen, falls eine echte Cross-Era-Anchor-Verletzung oder Transliterations-Doublette unter dem Radar geblieben wäre. **False-negative auf Cross-Era-Anchor-Breach ist positiv**: Brief 100 + ADR-Hardening haben die HH-Pässe sauber durch.

### Patterns für künftige Pass-3 (falls je nötig)

- **Planet ↔ Ship-named-after-Planet** (3 of 7 Locations): `tags:vessel` auf der Mergee-Seite ist mechanisch erkennbar. Future-pass könnte das als auto-no-merge-Regel im Aggregator implementieren (würde Cluster 5, 6, 7 Locations aus dem Output filtern).
- **Primarch ↔ Captain-named-after-Primarch**: analog mechanisch erkennbar via "captain"-Token im Mergee-Name (siehe Cluster 7 Characters, `horus_aximand`). Aktuelles `primarch-stem`-Signal triggert eine Edge, aber kein Filter — Pass-3-Verbesserung: edge-Reason "primarch-stem-named-after" als auto-no-merge-Marker.
- **Same-Era Cross-Pass Doublette** (`sharrowkyn ↔ nykona_sharrowkyn`): Pass-1-Heuristik-Pattern (substring + jaccard + shared-faction) reichte aus. Keine HH-spezifische Verbesserung nötig.

### Token-Budget

- Phase 0 (Aggregator) — unter 5k Tokens.
- Phase 1 (Factions, 6 Cluster) — unter 10k Tokens.
- Phase 2 (Locations, 7 Cluster) — unter 10k Tokens.
- Phase 3 (Characters, 10 Cluster, 2 Merges mit Field-Retention) — unter 15k Tokens.
- **Total Pass-2 vor Maintainer-Gate** — unter 40k Tokens, deutlich unter 120k-Limit. Axis-sliced sequential execution mit per-Phase-Commits hält den per-Subsession-Token-Footprint stabil.

### Pass-1-Cross-Reference

- **Factions**: 6/6 identisch zu Pass-1 (keine neuen Doubletten durch HH-Wellen).
- **Locations**: 1/7 Pass-1-Carryover (`baal ↔ baal_secundus`), 6/7 neu (HH-Anchor-Welten + slug-distance-Signal).
- **Characters**: 6/10 Pass-1-Carryover (amit, astor_sabbathiel, brielle, gerontius_helmawr, ivan, lord_solar_macharius), 4/10 neu (astelan/merir_astelan cross-era, bjorn/strybjorn substring, horus/horus_aximand primarch-stem, nykona_sharrowkyn/sharrowkyn same-era doublette).

Pass-1-Merge-Pattern (vigilus_s → vigilus + magister_sek → anakwanar_sek) hat in Pass-2 ein direktes Echo: **eine Same-Era-Cross-Pass-Doublette (mechanical) + eine Cross-Era-Identity (lore-deep)** — exakt analog zur Pass-1-Verteilung (eine Phantom-Row mechanical + eine Cross-Wave-Honorific-Miss mechanical). Pass-2 erweitert das Mechanical-Mix um ein Cross-Era-Identity-Beispiel, das die Pass-1-Heuristik nicht hatte erfassen müssen.
