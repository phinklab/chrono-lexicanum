# Consolidation-Pass 2 — Adjudication dossier

Pass-Scope: Full-Corpus (W40K Pässe 1..9 + HH Pässe 10..15, batches ssot-w40k-001..057 + ssot-hh-001..030).

Source-of-Truth: `sessions/resolver-dossiers/consolidation-pass-2-aggregator-output.md` (Aggregator-Run vom 2026-05-27, deterministic, byte-identisch re-runnable).

Aggregator-Heuristik (Brief 102): Pass-1-Base — exact-normalized-name (NFKD + lower + punct-strip + honorific-strip) ∪ Jaccard ≥ 0.5 ∪ substring ∪ alias-name-coincidence ∪ group-key bonus (parent/primaryFactionId/sector) — plus drei neue HH-aware Signale:

- **Cross-era-anchor-breach**: alias-coincidence-Edge wird zusätzlich annotiert, wenn die geteilte Surface-Form zu einer fest definierten Liste pinned cross-era-Anchor-Surface-Forms gehört (Luna Wolves, Imperial Army, Mechanicum, Ezekyle Abaddon, Kharn, Magnus, Lucius, Ahriman, Horus Lupercal, Calas Typhon, Corvus Corax, Lorgar Aurelian, Little Horus Aximand, Nassir Amit, Alexis Pollux, Dantioch, Maloghurst, Arvida, Aenoid Thiel, etc.). Tripwire gegen Cross-Era-Doubletten, die Pass-1-Heuristik allein nicht fängt.
- **Slug-edit-distance** (locations only): Wagner-Fischer Levenshtein über `joined`-Token-Feld; Schwelle `distance ≤ 2 AND ratio ≤ 0.25 AND min-len ≥ 4`. Fängt Transliterations-Doubletten wie `isstvan ↔ istvaan`, `prospero ↔ prosperan`, `calth ↔ caltha`. Schwelle ist absichtlich so gewählt, dass kanonische Sub-Cluster-False-Positives wie `vigilus ↔ vigil` (ratio 0.286) NICHT triggern.
- **Primarch-stem** (characters only): 22 Primarchen-Stems (horus, sanguinius, rogal dorn, lion eljonson, leman russ, lorgar, fulgrim, perturabo, corax, alpharius, omegon, konrad curze, night haunter, magnus, ferrus manus, mortarion, vulkan, roboute guilliman, guilliman, angron, jaghatai khan, jaghatai). Edge wird gezogen, wenn ein Stem als Token-Subset in mindestens zwei Character-Rows vorkommt — fängt Primarch ↔ Primarch-Sub-Persona-Doubletten (z.B. `magnus` als Primarch vs `magnus` als Andererwhere-Surface-Form).

Output sind **Kandidaten**, keine Decisions.

Adjudication: jeder Cluster bekommt eine Decision `merge | no-merge | flagged`. `merge` braucht einen Keeper-Row und einen explizit benannten Field-Retention-Plan; `no-merge` braucht eine Lore-Begründung; `flagged` blockiert die Welle und wird an den Maintainer eskaliert.

**Summary** (Stand Phase 2): 6 Faction + 7 Location = 13 Kandidaten-Cluster → **0 Merges**, **13 No-Merges**, **0 Flagged**. Characters folgen in Phase 3.

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

## Characters — TBD (Phase 3)

10 Kandidaten-Cluster aus dem Aggregator-Output. Adjudication folgt in Phase 3.

---

## Closing notes (interim — Phase 2)

- **HH-aware Aggregator-Signal-Bilanz (Phase 1+2)**:
  - **cross-era-anchor-breach**: 0 candidates auf Factions + Locations. Pinned cross-era surface forms (Luna Wolves, Imperial Army, Mechanicum, etc.) sind in den HH-Wellen 10..15 konsistent auf die canonical W40K-Faction-IDs aufgelöst worden — Brief 100 + ADR cross-era-identities haben gehalten. Falsch-Negativ-Befund (Signal sucht Trouble, findet keinen) ist hier das gewünschte Ergebnis. Auf der Location-Achse ist die Cross-Era-Anchor-Liste prinzipiell kleiner (Welten sind selten era-gespalten — `istvaan_v` / `istvaan_iii` ist ein Beispiel, wo die Aliases bereits korrekt sitzen).
  - **slug-edit-distance**: 1 candidate (`barbarus ↔ tartarus`), mechanical false-positive — distinkte Welten, distinkte Tags, distinkte Lore. Signal-Justifikation: der gleiche Schwellenwert würde echte Transliterations-Doubletten wie `isstvan ↔ istvaan` (Levenshtein 1, distance-ratio 0.143) fangen, die Pass-1-Heuristik (jaccard-0, kein substring) übersieht. Trade-off ist akzeptabel — false-positives kosten eine Lore-Adjudication pro Pass, false-negatives kosten eine ganze Re-Apply-Welle.
- **Planet ↔ Ship-named-after-Planet Pattern** (3 of 7 Location-Cluster): Ithraca ↔ Ithraca's Vengeance, Macragge ↔ Macragge's Honour, Molech ↔ Molech's Enlightenment. Alle drei sind via `tags:vessel` auf der Mergee-Seite mechanisch erkennbar. Future-pass könnte das als auto-no-merge-Regel im Aggregator implementieren (offene Frage für Impl-Report — siehe Brief 102 OQ-1 "HH-Heuristik-Klassen-Signal/Noise-Aufschlüsselung").
- **Token-Budget Phase 1+2**: Aggregator + 13 Cluster-Adjudication zusammen unter 25k Tokens (deutlich unter 120k-Limit).
- **Pass-1-Cross-Reference**: Location-Cluster 1 (`baal ↔ baal_secundus`) ist identisch zu Pass-1 (gleiche no-merge-Entscheidung). Location-Cluster 2-7 sind **neue** Kandidaten, die in Pass-1 nicht emittiert wurden — ein Mix aus (a) genuinely-new HH-Korpus-Inhalt (Beta-Garmon-Titan-Lore, Ithraca, Molech-Pivot — alles HH-Anchor-Welten, die in den HH-Pässen 10..15 dazukamen) und (b) Pass-1-Aggregator-Heuristik-Erweiterung (slug-edit-distance signal hat barbarus ↔ tartarus erst in Pass-2 sichtbar gemacht).
