# Consolidation-Pass 2 — Adjudication dossier

Pass-Scope: Full-Corpus (W40K Pässe 1..9 + HH Pässe 10..15, batches ssot-w40k-001..057 + ssot-hh-001..030).

Source-of-Truth: `sessions/resolver-dossiers/consolidation-pass-2-aggregator-output.md` (Aggregator-Run vom 2026-05-27, deterministic, byte-identisch re-runnable).

Aggregator-Heuristik (Brief 102): Pass-1-Base — exact-normalized-name (NFKD + lower + punct-strip + honorific-strip) ∪ Jaccard ≥ 0.5 ∪ substring ∪ alias-name-coincidence ∪ group-key bonus (parent/primaryFactionId/sector) — plus drei neue HH-aware Signale:

- **Cross-era-anchor-breach**: alias-coincidence-Edge wird zusätzlich annotiert, wenn die geteilte Surface-Form zu einer fest definierten Liste pinned cross-era-Anchor-Surface-Forms gehört (Luna Wolves, Imperial Army, Mechanicum, Ezekyle Abaddon, Kharn, Magnus, Lucius, Ahriman, Horus Lupercal, Calas Typhon, Corvus Corax, Lorgar Aurelian, Little Horus Aximand, Nassir Amit, Alexis Pollux, Dantioch, Maloghurst, Arvida, Aenoid Thiel, etc.). Tripwire gegen Cross-Era-Doubletten, die Pass-1-Heuristik allein nicht fängt.
- **Slug-edit-distance** (locations only): Wagner-Fischer Levenshtein über `joined`-Token-Feld; Schwelle `distance ≤ 2 AND ratio ≤ 0.25 AND min-len ≥ 4`. Fängt Transliterations-Doubletten wie `isstvan ↔ istvaan`, `prospero ↔ prosperan`, `calth ↔ caltha`. Schwelle ist absichtlich so gewählt, dass kanonische Sub-Cluster-False-Positives wie `vigilus ↔ vigil` (ratio 0.286) NICHT triggern.
- **Primarch-stem** (characters only): 22 Primarchen-Stems (horus, sanguinius, rogal dorn, lion eljonson, leman russ, lorgar, fulgrim, perturabo, corax, alpharius, omegon, konrad curze, night haunter, magnus, ferrus manus, mortarion, vulkan, roboute guilliman, guilliman, angron, jaghatai khan, jaghatai). Edge wird gezogen, wenn ein Stem als Token-Subset in mindestens zwei Character-Rows vorkommt — fängt Primarch ↔ Primarch-Sub-Persona-Doubletten (z.B. `magnus` als Primarch vs `magnus` als Andererwhere-Surface-Form).

Output sind **Kandidaten**, keine Decisions.

Adjudication: jeder Cluster bekommt eine Decision `merge | no-merge | flagged`. `merge` braucht einen Keeper-Row und einen explizit benannten Field-Retention-Plan; `no-merge` braucht eine Lore-Begründung; `flagged` blockiert die Welle und wird an den Maintainer eskaliert.

**Summary** (Stand Phase 1): 6 Faction-Kandidaten-Cluster → **0 Merges**, **6 No-Merges**, **0 Flagged**. Locations + Characters folgen in Phase 2 + 3.

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

## Locations — TBD (Phase 2)

7 Kandidaten-Cluster aus dem Aggregator-Output. Adjudication folgt in Phase 2.

---

## Characters — TBD (Phase 3)

10 Kandidaten-Cluster aus dem Aggregator-Output. Adjudication folgt in Phase 3.

---

## Closing notes (interim — Phase 1)

- **HH-aware Aggregator-Signal-Bilanz (Phase 1)**: Kein cross-era-anchor-breach-Signal auf Faction-Achse. Pinned cross-era surface forms (Luna Wolves auf `sons_of_horus`, Imperial Army auf `astra_militarum`, Mechanicum auf `mechanicus`) sind in den HH-Wellen 10..15 konsistent auf die canonical W40K-Faction-IDs aufgelöst worden — Brief 100 + ADR cross-era-identities haben gehalten. Falsch-Negativ-Befund (Signal sucht Trouble, findet keinen) ist hier das gewünschte Ergebnis.
- **Token-Budget Phase 1**: Aggregator + Faction-Adjudication zusammen unter 15k Tokens (deutlich unter 120k-Limit).
- **Pass-1-Cross-Reference**: Alle 6 Faction-Cluster sind identisch zu Pass-1 (gleiche No-Merge-Decisions). Keine neuen Faction-Doubletten durch die HH-Wellen 10..15 entstanden — Reference-Layer für Factions ist post-HH konsistent.
