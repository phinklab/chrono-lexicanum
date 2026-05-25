---
title: Faction-Policy — Browse-Root vs. Tree-Root
type: decision
created: 2026-05-13
updated: 2026-05-16
sources:
  - ../../../sessions/archive/2026-05/2026-05-13-070-arch-faction-policy-hygiene.md
  - ../../../sessions/archive/2026-05/2026-05-16-077-arch-grand-alignment-junction-hygiene.md
  - ../../../scripts/seed-data/faction-policy.json
  - ../../../scripts/seed-data/factions.json
  - ../../../scripts/apply-override.ts
  - ../../../scripts/apply-override-skip.ts
related:
  - ../glossary.md
  - ../project-state.md
  - ../pipeline-state.md
confidence: high
decision-date: 2026-05-13
---

# Faction-Policy — Browse-Root vs. Tree-Root

**Status:** active · **Decided:** 2026-05-13 · **Sessions:** [070-arch](../../../sessions/archive/2026-05/2026-05-13-070-arch-faction-policy-hygiene.md)

## Context

`factions` modelliert Hierarchie über einen einzigen self-ref `parent_id`. Beim Brief-070-Brainstorm fiel auf: die Spalte vermischt zwei Konzepte, die das UI später getrennt brauchen wird — die *Tree-Root* (Lore-Wurzel, `parent_id IS NULL`) und die *Browse-Root* (UI-Filter-Ebene). Beispiel: `phantine_air_corps` hängt korrekt unter `astra_militarum`, aber niemand klickt im Hub auf „Phantine Air Corps" — das gehört unter „Astra Militarum" gerollt. Umgekehrt ist `imperium` Tree-Root, aber als Filter-Wahl zu grob (deckt ALLE Imperial-Faktionen ab — das ist Grand-Alignment, lebt schon in `factions.alignment`).

Zugleich enthielt `factions.json` Lore-Bugs: alle Heresy-Traitor-Legionen + alle Loyalist-Astartes-Chapters trugen `parent: "imperium"` (statt `chaos` bzw. `adeptus_astartes`); der `chaos`-Row hieß „Chaos Undivided" obwohl er als Umbrella fungiert. Beides macht zukünftige Resolver-Batches taxonomie-driftanfällig.

Variante α aus dem Brainstorm: `chaos` bleibt Browse-Root **mit eigenem Faction-Row** (uniforme UI-Logik), das Naming wird zu „Chaos" korrigiert, `chaos_undivided` als separate Worship-Form ist deferred bis Daten es rechtfertigen.

## Drei Ebenen

| Ebene | Wo es lebt | Beispiel |
|---|---|---|
| **Grand-Alignment** | `factions.alignment` enum (`imperium \| chaos \| xenos \| neutral`) | Filtert „alle chaos-aligned" über alle Browse-Roots hinweg |
| **Browse-Root** | `scripts/seed-data/faction-policy.json` → `browseRoots[]` (NICHT im Schema) | Hub-Dropdown / Filter-Leiste: Astra Militarum, Adeptus Astartes, Chaos, Tau, … |
| **Sub** | transitive `parent_id`-Kette unter einem Browse-Root | `phantine_air_corps → astra_militarum`, `verghastite_ghosts → tanith_first → astra_militarum` |

Das Schema bleibt unangetastet. Wenn UI später eine DB-Spalte fürs Konzept braucht, ist das ein eigener Brief.

## Browse-Root-Whitelist

16 IDs, definiert in `scripts/seed-data/faction-policy.json`:

| ID | Grand-Alignment | Lore-Kontext |
|---|---|---|
| `astra_militarum` | imperium | Imperial Guard, masseninfanterie |
| `adeptus_astartes` | imperium | Space Marines (alle Chapters Sub) |
| `inquisition` | imperium | Inquisition + Ordos |
| `mechanicus` | imperium | Adeptus Mechanicus |
| `commissariat` | imperium | Politische Officers (Sonderfall) |
| `custodes` | imperium | Adeptus Custodes |
| `sisters_of_battle` | imperium | Adepta Sororitas |
| `ecclesiarchy` | imperium | Imperial-Kirche |
| `imperial_navy` | imperium | Raumflotte |
| `grey_knights` | imperium | Daemon-Hunter (Sonderfall) |
| `chaos` | chaos | Umbrella; alle Chaos-Subs |
| `eldar` | xenos | Aeldari (collapsed) |
| `tau` | xenos | T'au Empire |
| `necrons` | xenos | Necrons |
| `tyranids` | xenos | Tyranid + Genestealer Sub |
| `orks` | xenos | Orks |

**`imperium` ist explizit KEIN Browse-Root** — Grand-Alignment-Konzept. Bleibt als parent-null Tree-Root in `factions` (Lore-Wurzel der Imperial-Subs); auf `knownTopLevelExceptions` in der Policy, damit `brain:lint` ihn nicht flagt.

## Sonderfälle

- **`chaos`:** Synthetischer Umbrella (post-Brief-070: `name="Chaos"`, alignment=chaos). Hosts Heresy-Traitor-Legionen + Word Bearers / Iron Warriors / Blood Pact / Sons of Sek / Zoican Host / Daemons / etc. `chaos_undivided` als getrennte Worship-Form-Row deferred.
- **`commissariat`:** Institutionell parallel zu Astra Militarum, im Schema unter `imperium` (Single-Parent-Limit). Multi-Parent (DAG) deferred.
- **`grey_knights`:** Doppelnatur Astartes-Grade + Chamber Militant Ordo Malleus. Single-Parent: `adeptus_astartes` (Resolver-Robustheit — Books klassifizieren GK üblicherweise als Marines).
- **`genestealer_cults`:** Sub-Faction der Tyraniden (`parent="tyranids"`, 9th-Ed-Lore), nicht eigener Browse-Root.
- **`eldar`:** Aeldari-Umbrella; Craftworlds/Drukhari/Harlequins/Ynnari-Split deferred.

## Grand-Alignment-Junction-Skip

Aus Brief 077 (2026-05-16). Schließt die Pipeline-Compliance-Lücke aus Brief 070: Grand-Alignment-Tags (`Imperium of Man`, `Imperium`, `Chaos`) rutschten durch den Resolver als reguläre `work_factions`-Junctions, obwohl Grand-Alignment in `factions.alignment` lebt, nicht als Filter-Surface.

**Skip-Liste** (Policy-driven, in `scripts/seed-data/faction-policy.json` → `redundantWhenSubPresent`):

```json
"redundantWhenSubPresent": ["imperium", "chaos"]
```

**Skip-Bedingung** (Apply-Layer, `scripts/apply-override.ts` über `decideFactionSkips()` aus `scripts/apply-override-skip.ts`):

1. Die resolved `faction_id` steht in `redundantWhenSubPresent`.
2. Im selben Override-Block ist mindestens eine weitere resolved `faction_id` mit gleicher `alignment` wie die Grand-Alignment-Row.
3. Die andere `faction_id` ist nicht selbst die Grand-Alignment-Row.

Erfüllen alle drei → Junction wird NICHT geschrieben. Die Surface-Form landet im `book_details.notes` `---surfaceForms---`-Block unter neuem Schlüssel `factionsSkippedRedundant` (bare-string-Array, analog zu den existierenden Unresolved-Buckets aus Brief 074/076).

**Erhaltungs-Pfad.** Wenn das Buch im Override-Block nur die Grand-Alignment-Row trägt (keine alignment-gleiche Sub-Faction), bleibt die Junction stehen — sehr seltener Worldbuilding-/Galaxy-Wide-Survey-Fall.

**Semantische Anmerkung — gilt nur für imperium/chaos.** Die Skip-Bedingung vergleicht *Alignments* (nicht Parent-Ketten). Für `imperium` und `chaos` ist das korrekt, weil bei beiden gilt: alignment IS Tree-Root. Wenn künftig `eldar` auf die Skip-Liste käme (post-Aeldari-Sub-Splits), wäre Alignment-Equality ein Fehler: `tau` und `eldar` sind beide `xenos`, aber Tau ist kein Eldar-Sub. Dann muss `decideFactionSkips` auf eine parent-chain-/tree-membership-Bedingung umgestellt werden. Revisit-Trigger unten.

**Backfill für 001..020.** Apply-Override ist DELETE-then-INSERT für `work_factions`; ein Re-Apply über `ssot-w40k-001..020` nach dem Code-Edit putzt die existierenden redundanten Junctions automatisch weg (~165 Junctions weg über 200 Bücher gemessen).

**Forward-Discipline.** Loop-Brief 061 trägt einen `Faction-Granularity-Discipline`-Block ab `ssot-w40k-021`, der die generischen Grand-Alignment-Tags in `overrides.factions[]` schon beim LLM-Authoring verhindert. `scripts/run-ssot-loop.sh` reicht die Discipline an jede Loop-Subsession durch.

## Was wir bewusst NICHT entscheiden

- **Multi-Parent / DAG.** Einzige Spalte `parent_id` bleibt; Sonderfälle wie Commissariat (Institutional-Parallel) leben in der Policy-Beschreibung, nicht im Schema.
- **`browse_root`-/`kind`-Feld im Schema.** Policy lebt in der JSON-File. Wenn UI das Konzept braucht, eigener Brief.
- **Aeldari-Split** in Craftworlds / Drukhari / Harlequins / Ynnari als separate Browse-Roots.
- **Chaos-Gott-Splits** (Khorne / Tzeentch / Nurgle / Slaanesh) als separate Browse-Roots.
- **`chaos_undivided` als separater Faction-Row.**
- **UI-Rollup-Implementierung.** Kein `WITH RECURSIVE`, kein Faktions-Filter, keine Detailpage-Refactors.

## Revisit-Trigger

- **Datenbild dichter** (Resolver-Pipeline hat ≥100–150 W40K-Bücher abgedeckt) UND UI-Polish-Phase ist anstehend → UI-Rollup-Brief macht das Konzept im Schema sichtbar.
- **Chaos-Worship-Cluster** häufen sich in Resolver-Outputs → `chaos_undivided` + ggf. Chaos-Gott-Splits werden eigene Rows.
- **HH-Domain** rollt über → Heresy-spezifische Legions-Disziplinen (Pre-Heresy-Ambivalenz `alpha_legion`/Cabal-Twist) brauchen ggf. eigene Policy-Entscheidung.
- **Sonderfälle brechen Single-Parent-Limit häufig** (Commissariat, Sisters of Silence, Grey Knights, Inquisition-Astartes-Doppelnaturen) → DAG-Migration wird erwogen.
- **Aeldari-Sub-Splits aktiviert** (Drukhari / Craftworlds / Harlequins / Ynnari als eigene Rows) → `redundantWhenSubPresent` darf um `eldar` erweitert werden, ABER der `decideFactionSkips`-Algorithmus muss vorher von Alignment-Equality auf Parent-Chain umgestellt werden — `tau` ist `xenos` wie `eldar`, aber kein Sub davon. Gleiche Anpassung wenn Tyraniden-/Genestealer-Splits oder Ork-Klan-Splits Browse-Root-Status bekommen.

## Aftermath

Brief 070 (2026-05-13) implementiert:

- `factions.json` audit-patched (Chaos-Rename + 14 Reparents: 5 Heresy-Traitor-Legionen → `chaos`, 8 Loyalist-Chapters + Grey Knights → `adeptus_astartes`).
- `scripts/seed-resolver-extensions.ts` auf `onConflictDoUpdate` für Factions geliftet (Option A aus Notes Tabelle 4) — Pre-Apply-Hygiene-Check kann denselben Pfad künftig wiederverwenden.
- `docs/resolver-apply-runbook.md` erweitert um Pre-Apply Parent-Hygiene-Check vor jedem `db:apply-override`-Sweep.
- `scripts/brain-lint.ts` neue Kategorie „Faction policy" (warn: parent-null nicht in browseRoots/knownTopLevelExceptions; error: dangling parent).
