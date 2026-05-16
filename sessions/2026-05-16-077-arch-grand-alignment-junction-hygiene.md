---
session: 2026-05-16-077
role: architect
date: 2026-05-16
status: implemented
slug: grand-alignment-junction-hygiene
parent: null
links:
  - 2026-05-13-070-arch-faction-policy-hygiene
  - 2026-05-13-070-impl-faction-policy-hygiene
  - 2026-05-16-076-arch-resolver-batch-4-axis-sliced
  - 2026-05-16-076-impl-resolver-batch-4-axis-sliced
  - 2026-05-16-077-impl-grand-alignment-junction-hygiene
  - 2026-05-11-061-arch-ssot-loop
commits: []
---

# Grand-Alignment-Junction-Hygiene — `imperium`/`chaos` als `work_factions` nicht mehr schreiben

## Codex-Review-Erratum (2026-05-16, vor erstem CC-Pickup)

Codex hat den Brief gegengelesen und drei Präzisierungen scharf gemacht. Alle drei sind in den Constraints unten eingearbeitet; dieser Block ist die Maintainer-Quelle für die Begründungen und überschreibt frühere weichere Formulierungen im Brief.

1. **Skip-Logik gehört in `scripts/apply-override.ts`, nicht in den Resolver.** Der Resolver ist Pure-Surface-Form-zu-ID; ob eine ID redundant ist, ist Block-Context-Information (man braucht die anderen resolved Factions desselben Buchs plus deren Alignments). Das ist Apply-Layer-Wissen. Frühere weiche Empfehlung im Constraints-Block ist jetzt eine harte Vorgabe (siehe unten). Wenn CC einen sauberen Pfad sieht, der die Block-Sicht trotzdem im Resolver-Modul kapselt, gerne mit Begründung — aber die Erwartung ist Apply-Override.

2. **Surface-Form-Persistenz: `book_details.notes` `---surfaceForms---`-Block, neuer Bucket `factionsSkippedRedundant`.** Frühere Brief-Formulierung „CC entscheidet pragmatisch wo" ist überholt. `work_factions.raw_name` scheidet aus per Definition (die Junction wird ja nicht geschrieben). Das existierende `book_details.notes`-`---surfaceForms---`-Pattern (Konvention aus den 074-/076-Resolver-Pässen für Long-Tail-unresolved-Surface-Forms) ist der richtige Ort. Neuer Schlüssel `factionsSkippedRedundant: ["Imperium", "Chaos", ...]` analog zu existierenden Long-Tail-Buckets — kein neues Schema-Feld nötig.

3. **`factions.json` `imperium`-Row hat heute KEIN explizites `alignment`-Feld.** Die Datei trägt nur `{"id": "imperium", "name": "Imperium of Man", "parent": null, "tone": "imperial"}`. Die `alignment="imperium"`-Information wird in `scripts/seed-resolver-extensions.ts` per `inferAlignmentFromTree` inferiert (`f.parent === "imperium" || f.id === "imperium"` → `"imperium"`). `chaos` ist asymmetrisch — die Row hat `"alignment": "chaos"` explizit. Die neue Apply-Logik muss diese Inferenz konsistent benutzen ODER die `factions.json`-Row explizit auf `"alignment": "imperium"` patchen. Empfehlung Cowork: **`factions.json` patchen** (eine Zeile JSON, kein Code-Duplikat, ein-quellige Wahrheit für die Skip-Logik). Wenn CC stattdessen den Helper `inferAlignmentFromTree` aus `seed-resolver-extensions.ts` als shared utility nach `src/lib/` extrahiert und in Apply-Override importiert, ist das auch sauber — aber dann muss der Helper konsistent in beiden Pfaden laufen.

Alle drei Punkte ändern keine Acceptance-Bullets sondern schärfen die Constraints. Reihenfolge bleibt: 076 mergen → 077 fahren → Re-Apply 001..020.

## Goal

Schließe die Pipeline-Lücke, durch die Grand-Alignment-Tags (`Imperium of Man`, `Imperium`, `Imperium of Mankind`, `Chaos`) heute als reguläre `work_factions`-Junctions in die DB rutschen, obwohl Brief 070 / [`faction-policy.md`](../brain/wiki/decisions/faction-policy.md) sie explizit als Tree-Root-/Umbrella-Konzepte ausgewiesen hat, die in `factions.alignment` leben sollen, nicht als Filter-Surface.

Konkret: der Resolver-/Apply-Pfad soll Grand-Alignment-Junctions **skippen, wenn im selben Override-Block bereits eine alignment-gleiche Sub-Faction resolved ist**. Plus: die Loop-Subsession-Discipline ab `ssot-w40k-021` darf solche Tags gar nicht erst produzieren (Constraint-Block analog Mini-Phase 5 aus 076). Plus: ein Re-Apply über `ssot-w40k-001..020` putzt die existierenden ~100+ redundanten Junctions automatisch weg.

## Context

**Maintainer-Beobachtung (Cowork-Session 2026-05-16):** „Imperium of Man" taucht in der vierten Resolver-Welle (`ssot-w40k-016..020`, post-076 in DB) häufig als Faction auf Buch-Seiten auf, obwohl wir vorher mit `Astra Militarum` etc. die spezifische Granularität hatten.

**Wo das Label herkommt — drei Ebenen:**

1. **Seed-Daten.** `scripts/seed-data/factions.json` hat als allererste Row:

   ```json
   { "id": "imperium", "name": "Imperium of Man", "parent": null, "tone": "imperial" }
   ```

   Das ist Tree-Root für alle Imperial-Sub-Faktionen.

2. **Faction-Policy (Brief 070).** `imperium` ist **explizit kein Browse-Root** — `scripts/seed-data/faction-policy.json` listet 19 Browse-Roots (Astra Militarum, Adeptus Astartes, Heretic Astartes, Inquisition, Mechanicus, …) und führt `imperium` in `knownTopLevelExceptions` als Grand-Alignment-Konzept (lebt in `factions.alignment`, NICHT als Filter-Surface). Spec-Zitat: „Grand-Alignment-Konzept (lebt in factions.alignment), bleibt parent-null als Lore-Root, ist aber KEIN Browse-Root."

3. **Pipeline-Realität.** Die LLM-Loop-Subsession (`scripts/run-ssot-loop.sh`-getrieben, [`sessions/2026-05-11-061-arch-ssot-loop.md`](./2026-05-11-061-arch-ssot-loop.md)) ignoriert diese Policy. In `scripts/seed-data/manual-overrides-ssot-w40k-011..020.json` zählt grep:

   | Override-Range | „Imperium…" als raw_name | „Chaos" als raw_name |
   |---|---:|---:|
   | 011..020 | 103 | 79 (in 011..020-Subset) |
   | 001..020 (gesamt) | (vermutlich höher) | **135** |
   | 011..020 „Adeptus Astartes"/„Space Marines" | — | 79 |

   Typisches Pattern bei einem Astartes-Buch:

   ```json
   "factions": [
     { "name": "Space Wolves",     "role": "primary" },
     { "name": "Adeptus Astartes", "role": "primary" },
     { "name": "Space Marines",    "role": "primary" },   // alias → adeptus_astartes (dedupe)
     { "name": "Imperium",         "role": "primary" }    // redundant zu alignment + Sub-Tag
   ]
   ```

   `scripts/seed-data/faction-aliases.json` mapped `"Imperium"`/`"Imperium of Man"`/`"Imperium of Mankind"` jeweils auf `imperium`. Der Resolver schreibt eine `work_factions(faction_id=imperium, raw_name="Imperium")`-Junction. Konsequenz: in der DB hängt nach Brief 076 (200 W40K-Bücher applied) bei vielleicht 100+ Büchern eine redundante `imperium`-Junction, die nichts hinzufügt, was `alignment=imperium` auf den schon vorhandenen Sub-Faktionen nicht trüge — und die im UI als „Imperium of Man" rendert.

**Cockpit-Beleg.** 076-impl-Phase-4d misst `drift via factions=50` für die Welle 0151..0200 und `=102` für 0001..0150 (siehe [`sessions/2026-05-16-076-impl-resolver-batch-4-axis-sliced.md`](./2026-05-16-076-impl-resolver-batch-4-axis-sliced.md), § Phase-4d-Tabelle). Ein Teil dieses Drifts ist legitime Surface-Form-vs-canonical-name-Diskrepanz (z. B. raw `"Imperial Fists"` neben canonical `"Imperial Fists"` — die Schreibweisen matchen, drift entsteht durch Alias-Pfad oder Capitalisation). Aber: das `"Imperium" → imperium`-Mapping ist ein Mass-Producer von Drift-Einträgen, weil die LLM den Tag konsistent generisch ausschreibt.

**Was Brief 070 entschieden hat (recap).** Drei Ebenen: Grand-Alignment in `factions.alignment` enum, Browse-Root in der externen Policy-JSON, Sub in `parent_id`-Kette. `imperium` ist Tree-Root + Grand-Alignment, aber NICHT Browse-Root und damit explizit nicht als Filter-Surface gedacht. Brief 070 hat die Policy in Daten geschrieben — die Pipeline-Compliance (Loop-Subsession + Resolver-Apply) hat das nicht eingezogen. Dieser Brief schließt die Compliance-Lücke.

**Was außer `imperium` noch drin ist:** `chaos` ist per Policy Browse-Root (= darf im UI als Filter rendern), aber im selben Pattern problematisch — wenn ein Override-Block sowohl `Chaos` als auch z. B. `Word Bearers` enthält, ist die `chaos`-Junction redundant zur `word_bearers`-Junction (deren `alignment=chaos` schon trägt). Die symmetrische Behandlung für `chaos` ist Maintainer-Entscheidung pro 2026-05-16-Diskussion: ja, gleicher Skip. `eldar` ist heute kein Skip-Kandidat (Aeldari-Splits sind per Policy collapsed in einer Row, also gibt es noch keine Sub-Faktionen unter `eldar`, gegen die `eldar` redundant sein könnte). Wird relevant, falls künftig `craftworld_iyanden` / `drukhari` / `harlequins` / `ynnari` als separate Rows kommen.

**Carry-over-Items aus [`brain/wiki/open-questions.md`](../brain/wiki/open-questions.md), die dieser Brief NICHT adressiert** (explizit out-of-scope, alle bleiben in der Queue): Loop-Re-Trigger für `ssot-w40k-021..025`, OQ (10) Hardcover-Hit-Rate-Härtung, Cockpit-Drift-Sub-Sortierung, OQ3 Hand-Check-Workflow, Public-Page-Rating-Render, Collection-Gap-Resolve Green Tide, `no_author`-Roster-Hygiene, `run-ssot-loop.sh`-Refinements, Vokabular-Hygiene. Dieser Brief ist Pre-Pass-5-Hygiene und fügt sich vor dem Loop-Re-Trigger ein.

## Constraints

- **Skip-Liste in Konfiguration, nicht als Magic-Constant im TS-Code.** Neues Feld in `scripts/seed-data/faction-policy.json` (z. B. `redundantWhenSubPresent: ["imperium", "chaos"]` — den exakten Schlüsselnamen wählt CC). Begründung: die Policy lebt heute in dieser Datei (070-Konvention), die Skip-Liste gehört konzeptuell dazu, und künftige Erweiterungen (`eldar`, falls Splits aktiviert werden) ändern dann nur die Config, nicht den Resolver-Code.

- **`factions.json`-`imperium`-Row braucht explizites `"alignment": "imperium"`-Feld** (oder shared `inferAlignmentFromTree`-Helper, siehe Erratum Punkt 3). Heute fehlt das Feld — `chaos` hat es, `imperium` nicht. Die Skip-Bedingung muss `alignment` deterministisch lesen können, sonst greift sie versehentlich nicht. Empfehlung Cowork: JSON patchen (eine Zeile, ein-quellige Wahrheit). Falls CC den Helper-Extract-Pfad wählt, muss der Helper konsistent in `seed-resolver-extensions.ts` UND `apply-override.ts` laufen — kein Code-Duplikat.

- **Skip-Bedingung.** Die Grand-Alignment-Junction wird nicht geschrieben, wenn alle drei Bedingungen halten:
  1. Die resolved `faction_id` steht in der `redundantWhenSubPresent`-Liste.
  2. Im selben Override-Block (`overrides.factions[]` desselben Buchs) ist mindestens eine weitere `faction_id` resolved, deren `alignment` gleich dem `alignment` der Grand-Alignment-Row ist.
  3. Diese andere `faction_id` ist nicht selbst die Grand-Alignment-Row.

  Bleiben darf die `imperium`-/`chaos`-Junction nur, wenn das Buch im Override-Block **keinen** alignment-gleichen Sub-Tag trägt (sehr seltener Fall — z. B. ein Worldbuilding-Sachbuch ohne konkrete Imperial-Faction). Dieser Erhaltungs-Pfad ist gewollt, damit die Junction-Tabelle bei solchen Büchern nicht leer bleibt.

- **Surface-Form-Persistenz: `book_details.notes` `---surfaceForms---`-Block, neuer Bucket `factionsSkippedRedundant`.** Die geskippte Surface-Form (z. B. `"Imperium"`, `"Imperium of Man"`, `"Chaos"`) wird in den existierenden `---surfaceForms---`-Block in `book_details.notes` geschrieben, unter einem neuen Schlüssel `factionsSkippedRedundant: [...]`. Pattern analog zu den existierenden Long-Tail-unresolved-Surface-Form-Buckets aus den 074-/076-Resolver-Pässen — kein neues Schema-Feld, kein neuer Array auf `works`. `work_factions.raw_name` scheidet definitiv aus (die Junction wird nicht geschrieben). Begründung detailliert im Erratum-Block oben (Punkt 2).

- **Skip-Logik in `scripts/apply-override.ts`** (Junction-Write-Layer), nicht im Resolver-Modul. Der Resolver bleibt Pure-Surface-Form-zu-ID; die Block-Context-Bedingung („gibt es einen alignment-gleichen Sub-Tag im selben Override-Block") braucht den ganzen Override-Block, das ist Apply-Layer-Wissen. Begründung detailliert im Erratum-Block oben (Punkt 1).

- **Loop-Constraint-Block analog Mini-Phase 5 aus 076.** In [`sessions/2026-05-11-061-arch-ssot-loop.md`](./2026-05-11-061-arch-ssot-loop.md) (Public-Synopsis-Discipline-Block-Pattern) wird ein neuer Constraint-Block „Faction-Granularity-Discipline" angefügt, der ab `ssot-w40k-021` greift. Plus: `scripts/run-ssot-loop.sh`-Trigger-Heredoc bekommt einen kurzen Append, der diese Discipline in jede Loop-Subsession übergibt. Beispieltext (CC darf das wordsmith): „Faction-Tags müssen Browse-Root-Granularität oder spezifischer sein. Niemals `Imperium` / `Imperium of Man` / `Imperium of Mankind` als generischen Grand-Alignment-Tag schreiben — die Grand-Alignment-Info lebt in `factions.alignment` auf der Sub-Faction-Row. Analog: `Chaos` nur dann als raw_name, wenn das Buch ohne spezifische Chaos-Sub-Faction läuft."

- **Re-Apply über `ssot-w40k-001..020` als Backfill.** Apply-Override ist DELETE-then-INSERT (siehe `scripts/apply-override.ts` Header-Comment). Nach dem Resolver-Skip-Edit liefert ein `db:apply-override` über alle 20 Batches die DB ohne die redundanten `imperium`-/`chaos`-Junctions. Counts-Tabelle dokumentieren analog 074-/076-Pattern (Pre / Per-Batch / Post).

- **Tests grün halten.** `npm run test:resolver`, `test:resolver-data`, `test:resolver-coverage`, `test:apply-override-dry`, `lint`, `typecheck`, `brain:lint -- --no-write`. `test:resolver-coverage` darf eine sinkende absolute Coverage zeigen (less junctions written) — das ist erwartet. Hauptmetrik: keine Smoke-Slug-Regression bei Sub-Tag-Counts.

- **`faction-policy.md`-Decision-Page aktualisieren.** Neuer Abschnitt „Grand-Alignment-Junction-Skip" in [`brain/wiki/decisions/faction-policy.md`](../brain/wiki/decisions/faction-policy.md), der die Skip-Liste + Bedingung + Backfill-Pfad dokumentiert. Updated-Date hochsetzen.

## Out of scope

- **UI-Anzeige-Name der `imperium`-Row.** Nicht in diesem Brief umbenennen (Maintainer-Entscheidung 2026-05-16: später, ggf. mit Sub-Hygiene gebündelt). „Imperium of Man" bleibt vorerst als `name` in der Row; sobald die Junction-Hygiene greift, ist das Label im normalen Public-Pfad nicht mehr sichtbar. Audit-Cockpit zeigt es noch — das ist tolerierbar bis zu einem separaten Hygiene-Pass.

- **Hub-Dropdown / `/buecher`-Faction-Filter-Refactor.** Brief 070-Out-of-Scope-Position. UI-Rollup-Brief bleibt deferred.

- **Eldar-Sub-Splits aktivieren** (Drukhari / Craftworlds / Harlequins / Ynnari als separate Rows). Brief 070-Out-of-Scope-Position. Wenn aktiviert, kann die Skip-Liste erweitert werden (Config-Edit, kein Code).

- **Schema-Migration für `factions.browse_root` / `factions.kind`.** Brief 070-Out-of-Scope-Position bleibt gültig.

- **Andere Carry-over-Items** (siehe Context-Block, Carry-over-Auflistung). Bleiben in `open-questions.md`.

- **Loop-Re-Trigger für `ssot-w40k-021..025`** läuft NICHT in dieser Session. Wenn dieser Brief gemerged ist, kann der nächste Maintainer-Step der Loop-Re-Trigger sein — dann greift die neue Discipline für die fünfte Welle automatisch.

- **Catalog-Typo-Strips** wie in 074-/076-impl (facetIds-Pflege) sind nicht Teil dieses Briefs, es sei denn CC stolpert beim Re-Apply über einen blockierenden Fall — dann kurz in den Report mit Patch.

## Acceptance

The session is done when:

- [ ] `scripts/seed-data/faction-policy.json` trägt ein neues Feld (z. B. `redundantWhenSubPresent`) mit `["imperium", "chaos"]`.
- [ ] `scripts/seed-data/factions.json` `imperium`-Row trägt explizit `"alignment": "imperium"` (oder shared `inferAlignmentFromTree`-Helper ist nach `src/lib/` extrahiert und in Apply-Override + Seed-Skript benutzt).
- [ ] `scripts/apply-override.ts` implementiert die Skip-Bedingung (drei Punkte aus dem Constraints-Block); Resolver-Modul bleibt unangetastet.
- [ ] Geskippte Surface-Forms landen in `book_details.notes` `---surfaceForms---`-Block unter neuem Schlüssel `factionsSkippedRedundant` (Bucket-Pattern analog 074/076 Long-Tail).
- [ ] [`sessions/2026-05-11-061-arch-ssot-loop.md`](./2026-05-11-061-arch-ssot-loop.md) trägt einen `## Faction-Granularity-Discipline`-Block (oder analog), der ab `ssot-w40k-021` greift; `scripts/run-ssot-loop.sh`-Trigger-Heredoc reicht die Discipline an die Loop-Subsession durch.
- [ ] [`brain/wiki/decisions/faction-policy.md`](../brain/wiki/decisions/faction-policy.md) trägt einen neuen Abschnitt „Grand-Alignment-Junction-Skip" mit Skip-Liste + Bedingung + Update-Date.
- [ ] `npm run db:apply-override -- --batch=ssot-w40k-NNN` für N ∈ 001..020 läuft sauber durch (sequenziell, analog 074-/076-Pattern). Counts-Tabelle im Report (Pre / Per-Batch / Post für mindestens `work_factions`).
- [ ] Smoke-Slugs liefern: mindestens 6 Bücher (Vorschlag: `space-wolf` W40K-0152, `the-anarch` W40K-0038, `inquisitor-draco` W40K-0148, `the-green-tide` W40K-0147, `armageddon-saint` W40K-0185, `13th-legion` W40K-0181) zeigen **keine `imperium`- oder `chaos`-Junction mehr** in `work_factions` (sofern alignment-gleiche Sub-Tags da sind), aber alle Sub-Tags intakt.
- [ ] `npm run test:resolver` / `test:resolver-data` / `test:resolver-coverage` / `test:apply-override-dry` / `lint` / `typecheck` / `brain:lint -- --no-write` grün. Test-Erweiterungen (mindestens 2 Resolver-Test-Cases: einer für „Skip greift", einer für „Skip greift NICHT weil kein Sub vorhanden") sind committed.

## Open questions

- Ist `apply-override.ts` der bessere Ort für die Skip-Logik, oder soll der `resolveFactions`-Helper das schon kennen? Cowork-Empfehlung: `apply-override.ts`, weil die Bedingung den Gesamtblock-Kontext braucht. Aber wenn CC einen sauberen Pfad sieht, der das im Resolver-Modul erledigt (z. B. via einer neuen `resolveFactionsForWork(factions, opts)`-Variante), gerne.
- Wo wird die Surface-Form für ein geskipptes Tag persistiert? `book_details.notes`-Surface-Forms-Block ist die existierende Konvention für unresolved Surface-Forms. Bei *geskippten* (resolved-aber-redundanten) Tags ist die Lage weniger klar. Optionen: (a) einfach weglassen (Lookup via Override-File reicht als Audit-Pfad), (b) eigener Block im notes-Feld, (c) Audit-Spalte auf `works`. Cowork hat keine starke Präferenz — CC entscheidet pragmatisch.
- Soll die `faction-policy.md`-Decision-Page einen Revisit-Trigger für „falls Sub-Splits unter `eldar` aktiviert werden" bekommen? Cowork tendiert zu ja.
- Driver-Beobachtung: könnte `scripts/run-resolver-pass.sh` (076-Deliverable, noch nicht produktiv-gefahren) diesen Brief als „Hygiene-Pass" laufen? Eher nicht — das ist kein 50er-Batch-Resolver-Pass, sondern ein Pipeline-Hygiene-Edit + Re-Apply. Aber CC darf das beurteilen.

## Notes

**Counts-Schätzung (zur Erwartungs-Kalibrierung — keine Verpflichtung):**

- `imperium`-Junctions in DB heute: vermutlich 80–120 Bücher (grep zählt 103 `"Imperium…"`-Vorkommen in 011..020-Overrides; nicht jede produziert eine Junction wegen Dedupe nach `faction_id`, aber 011..020 sind nur 100 Bücher → die Häufigkeit ist hoch).
- `chaos`-Junctions in DB heute: vermutlich 50–80 Bücher (135 Vorkommen über 001..020, viele in Antagonist-Rolle, viele neben spezifischeren Chaos-Subs).
- Erwartete `work_factions`-Reduktion: 130–200 Junction-Rows weniger (post-Re-Apply 001..020). Counts post-076 sind `work_factions=1185` — wir landen vermutlich bei ~1000–1050.
- Coverage-Tests (`test:resolver-coverage`): die Input-Counts (Surface-Forms) bleiben gleich; die direkt-resolved-Counts sinken um die Skip-Anzahl. Erwartet: Coverage-Ratio sinkt leicht (z. B. `factions=1000/1301 = 77 %` statt 91 %), weil „resolved" jetzt strenger zählt — geskipped ≠ unresolved, aber der existierende Coverage-Test misst das nicht ohne Edit. CC darf den Coverage-Test angemessen anpassen oder die Skip-Anzahl als separate Metrik loggen.

**Beispiel-Override-Block** zur Veranschaulichung (echtes Pattern aus `manual-overrides-ssot-w40k-016.json`, lightly trimmed):

```json
{
  "externalBookId": "W40K-0152",
  "overrides": {
    "factions": [
      { "name": "Space Wolves",     "role": "primary" },
      { "name": "Adeptus Astartes", "role": "primary" },
      { "name": "Space Marines",    "role": "primary" },
      { "name": "Imperium",         "role": "primary" },
      { "name": "Thunderfist tribe","role": "primary" }
    ]
  }
}
```

Nach der Skip-Logik landen in `work_factions`: `space_wolves`, `adeptus_astartes` (Alias `Space Marines` dedupe'd), `thunderfist_tribe`. Die `imperium`-Junction wird geskipped (alignment=imperium, andere Sub `space_wolves` ebenfalls alignment=imperium, ID-≠).

**Constraint-Block für 061 (Beispiel-Wording, CC darf wordsmithen):**

```markdown
## Faction-Granularity-Discipline (ab `ssot-w40k-021`)

Faction-Tags MÜSSEN Browse-Root-Granularität oder spezifischer sein. Verboten als
generischer Grand-Alignment-Tag (Wikipedia-Style-Umbrella):

- `Imperium`, `Imperium of Man`, `Imperium of Mankind` — Grand-Alignment lebt in
  `factions.alignment`, nicht als Junction. Verwende stattdessen die spezifische
  Sub-Faction (z. B. `Astra Militarum`, `Adeptus Astartes`, `Inquisition`).
- `Chaos` (als alleiniger Tag, wenn spezifische Chaos-Sub-Faktionen lore-konsistent
  wären): vermeiden. Verwende `Heretic Astartes`, `Word Bearers`, etc.
- `Xenos`, `Aliens`: gar nicht als raw_name — entweder die spezifische Xenos-
  Faction (Eldar / Tau / Necrons / Tyranids / Orks) oder weglassen.

Wenn das Buch tatsächlich nur generisch über das Imperium spricht (z. B. ein
Worldbuilding-Sachbuch oder ein Galaxy-Wide-Survey ohne konkrete Faction),
darf `Imperium`/`Chaos` stehen — der Resolver behält die Junction in diesem Fall.
```

**Symmetrie-Anmerkung für künftige Pässe:**

- Wenn `eldar`-Splits aktiviert werden (Drukhari etc.), kommt `eldar` auf die Skip-Liste (Config-Edit, kein Code).
- Wenn `tyranids` / `genestealer_cults` differenziert werden, gleiches Muster.
- Pre-Heresy-Ambivalenz `alpha_legion` (Cabal-Twist) ist davon nicht betroffen — `alpha_legion` ist konkrete Faction, nicht Grand-Alignment.

**Referenzen:**

- ADR Faction-Policy: [`brain/wiki/decisions/faction-policy.md`](../brain/wiki/decisions/faction-policy.md)
- Policy-Daten: [`scripts/seed-data/faction-policy.json`](../scripts/seed-data/faction-policy.json)
- Faction-Aliase: [`scripts/seed-data/faction-aliases.json`](../scripts/seed-data/faction-aliases.json)
- Apply-Override: [`scripts/apply-override.ts`](../scripts/apply-override.ts)
- Resolver-Modul: [`src/lib/resolver/index.ts`](../src/lib/resolver/index.ts)
- Loop-Brief: [`sessions/2026-05-11-061-arch-ssot-loop.md`](./2026-05-11-061-arch-ssot-loop.md)
- Loop-Driver: [`scripts/run-ssot-loop.sh`](../scripts/run-ssot-loop.sh)
- Resolver-Apply-Runbook: [`docs/resolver-apply-runbook.md`](../docs/resolver-apply-runbook.md)
- Mini-Phase-5-Precedent (Constraint-Block-Pattern): [`sessions/2026-05-16-076-impl-resolver-batch-4-axis-sliced.md`](./2026-05-16-076-impl-resolver-batch-4-axis-sliced.md), § „Mini-Phase 5".
