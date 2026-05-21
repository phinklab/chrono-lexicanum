---
session: 2026-05-11-061
role: architect
date: 2026-05-11
status: open
slug: ssot-loop
parent: 2026-05-11-059
links:
  - 2026-05-11-058-arch-v2-ssot-mode-first-batch
  - 2026-05-11-058-impl-v2-ssot-mode-first-batch
  - 2026-05-11-059-arch-cc-direct-overrides-w40k-002
  - 2026-05-11-060-arch-ssot-w40k-001-db-apply
  - 2026-05-11-060-impl-ssot-w40k-001-db-apply
commits: []
supersedes: 2026-05-11-059-arch-cc-direct-overrides-w40k-002
---

# SSOT-Loop — selbst-fortschreibender 10er-Batch-Override-Brief

> **⚠ Operative Spec umgezogen (Brief 088, 2026-05-21).** Die ausführbare Spec für genau eine Loop-Iteration lebt jetzt in [`sessions/ssot-loop-runbook.md`](./ssot-loop-runbook.md); der Loop-Driver (`scripts/run-ssot-loop.sh`) und die CC-Iterationen folgen ihr. Brief 061 bleibt als **Design-Rationale** erhalten (warum es den Loop gibt, die Architektur-Entscheidungen) und wird **nicht mehr direkt ausgeführt**.

> **Maintainer-Bedienung.** Du gibst diesen Brief CC einmal pro `/clear`. CC erkennt selbst, welcher Batch dran ist, produziert die Override-JSON für die nächsten 10 Bücher, hängt einen Block an `sessions/ssot-loop-log.md` an und stoppt. Dann `/clear`, gleiche Eröffnung, nächste 10. Bei kumulativ 50 Büchern in der Authority-Schicht stoppt der Loop loud und meldet „Resolver-Brief fällig".

## Goal

Standing-Brief für den Authority-Layer-Aufbau: pro CC-Session genau ein 10er-Batch Override-Daten (`manual-overrides-ssot-{domain}-{NNN}.json`) für den nächsten unverarbeiteten Roster-Slice. CC bestimmt den Batch selbst durch File-Listing über `scripts/seed-data/manual-overrides-*.json`. Stoppt nach jedem Batch (Maintainer-/clear-Pause). Stoppt loud, wenn kumulativ 50/100/150/… Bücher in der Authority-Schicht liegen — das ist die Resolver-Trigger-Schwelle (OQ4 + OQ5).

Diff-only — kein DB-Apply, kein Frontend-Smoke, keine Code-Änderungen. Apply läuft separat per `npm run db:apply-override -- --batch=<name>` aus Brief 060.

Architektonische Logik: 059 war die kanonische 1-Batch-Form mit Sed-Replace-Klonen für 003/004/005. Dieser Brief macht aus dem Sed-Replace-Schritt einen Detection-Schritt im CC-Code-Flow. Ein einziger Markdown-Brief deckt den gesamten Authority-Aufbau über alle ~86 Roster-Batches ab.

## Context

Roster-Stand: `scripts/seed-data/book-roster.json` enthält 859 Bücher in zwei Domains:

- **HH** (Horus Heresy): 294 Bücher, Roster-Indices 0..293 (`HH-0001`..`HH-0294`).
- **W40K** (40K-Mainline): 565 Bücher, Roster-Indices 294..858 (`W40K-0001`..`W40K-0565`).

Die Reihenfolge im Roster-Array ist **HH zuerst, W40K danach**. Wir haben aber mit `W40K-0001`..`W40K-0010` (Eisenhorn + Ravenor + Bequin + The Magos) als ersten Batch (`ssot-w40k-001`) angefangen, weil das der Showcase-Cluster für die Cowork-Hand-Curation war. **Maintainer-Entscheidung für den Loop:** Erst W40K-Domain fertig (ab Index W40K-0011 bis W40K-0565), danach HH-Domain (ab HH-0001).

Authority-Layer-Stand zum Zeitpunkt des Brief-Schreibens:

- `scripts/seed-data/manual-overrides-ssot-w40k-001.json` existiert (10 Bücher, `createdBy: "cowork-opus"`, Cowork-curated, Brief 058 + 060). Authority für den ersten DB-Apply via Brief 060.
- Brief 059 ist durch diesen Brief superseded. 059's Inhalt war: `ssot-w40k-002.json` als 1-shot manuell-getriggerter Batch + Reuse-Anleitung zum Klonen. Beides ersetzt der Loop hier.
- Apply-Skript aus Brief 060 (`scripts/apply-override.ts`) ist landed und idempotent. Es nimmt `--batch=ssot-{domain}-{NNN}` als Argument und liest die korrespondierende JSON.

Pipeline-Bezug: der V2-Pipeline-Stage-3-Pfad (`src/lib/ingestion/v2/llm/enrich.ts`, Haiku-API-Call) bleibt unangetastet — toter Code im Repo, Aufräum-Brief später. CC ersetzt die Stage-3-Funktion durch sein eigenes Reasoning + WebSearch, keine Anthropic-API-Inferenz für die Authority-Datei.

50er-Resolver-Schwelle: zählt **kumulativ über alle Domains**. Sobald `sum(books in all manual-overrides-ssot-*.json) % 50 == 0`, stoppt der Loop loud und meldet „Resolver fällig". Sequenz im Klartext für die ersten Iterationen:

- Iteration 1: `ssot-w40k-002` (W40K-0011..0020) → 20 kumulativ → kein Stop.
- Iteration 2: `ssot-w40k-003` (W40K-0021..0030) → 30 → kein Stop.
- Iteration 3: `ssot-w40k-004` (W40K-0031..0040) → 40 → kein Stop.
- Iteration 4: `ssot-w40k-005` (W40K-0041..0050) → 50 → **Resolver-Stop**. Maintainer schreibt Resolver-Brief (OQ4 + OQ5), Apply-Re-Run gegen die 50 mit FK-Resolution.
- Iteration 5 (nach Resolver): `ssot-w40k-006` (W40K-0051..0060) → 60 → kein Stop.
- … weiter bis `ssot-w40k-057` (W40K-0561..0565, **5er-Restbatch**) → 565 W40K-Bücher in Authority + 10 HH-Bücher in Authority? Nein, HH startet noch nicht. Total nach W40K-fertig: 565 Bücher.
- Iteration danach: Domain-Wechsel auf HH. `ssot-hh-001` (HH-0001..0010) → 575 kumulativ.
- … weiter bis HH durch.

Die 50er-Schwelle trifft auch mitten in W40K-Domain mehrfach (50, 100, 150, …, 550) und einmal am sauberen Ende (565 → kein 50er-Treffer; nächste Pause wäre dann erst bei 600 mitten in HH-Domain). Die Schwellenlogik ist domain-agnostisch — sie folgt der kumulativen Authority-Layer-Größe.

## Constraints

- **Eine Override-Datei pro Loop-Iteration.** `scripts/seed-data/manual-overrides-ssot-{domain}-{NNN}.json` mit (idealerweise) 10 Buch-Einträgen. Form identisch zur `ssot-w40k-001.json`-Datei (Top-Level + `books[]` mit `externalBookId` / `slug` / `overrides.{synopsis, facetIds, factions[], locations[], characters[], flags[]}`).

- **Naming-Convention: pro Domain getrennt.** Batch-Namen tragen das Domain-Prefix:
  - W40K-Domain: `ssot-w40k-001`, `ssot-w40k-002`, …, `ssot-w40k-057` (565/10 = 56 volle Batches + 1 5er-Restbatch).
  - HH-Domain: `ssot-hh-001`, `ssot-hh-002`, …, `ssot-hh-030` (294/10 = 29 volle Batches + 1 4er-Restbatch).
  - Brief 060's Apply-Skript-Argument-Validierung erwartet exakt dieses Pattern.

- **Domain-Reihenfolge: erst W40K fertig, dann HH.** CC arbeitet die W40K-Slices der Reihe nach (Roster-Indices 294..858, IDs W40K-0001..W40K-0565) ab; W40K-0001..0010 sind bereits in `ssot-w40k-001.json`, also startet der Loop frühstens bei W40K-0011. Wenn das höchste existierende `ssot-w40k-NNN.json` File die letzten W40K-Bücher abdeckt (`ssot-w40k-057`, enthält W40K-0561..0565), wechselt CC in der nächsten Iteration auf HH-Domain und schreibt `ssot-hh-001.json` (HH-0001..0010).

- **Sauberer Domain-Schnitt am Restbatch.** Der letzte W40K-Batch (`ssot-w40k-057`) enthält die 5 Restbücher W40K-0561..0565 — kein Auffüllen aus HH. Die nächste Iteration startet sauber bei `ssot-hh-001` mit HH-0001..HH-0010 (10er).

- **File-Listing als Detection-Mechanismus.** Pro Iteration listet CC `scripts/seed-data/manual-overrides-*.json`, parst die Batch-Namen (`ssot-w40k-NNN` / `ssot-hh-NNN`), bestimmt den höchsten existierenden NNN pro Domain. Default-Logik:
  1. Wenn `ssot-w40k-057.json` noch nicht existiert → nächste Iteration ist `ssot-w40k-{max(existing_w40k)+1}`.
  2. Wenn `ssot-w40k-057.json` existiert UND `ssot-hh-030.json` noch nicht → nächste Iteration ist `ssot-hh-{max(existing_hh, 0)+1}`.
  3. Wenn beides voll → loud-Stop mit „Authority-Layer komplett, Loop fertig".
  CC darf die Detection auch eleganter formulieren; entscheidend ist das Verhalten.

- **50er-Resolver-Stop kumulativ.** Pre-Iteration-Check: CC liest alle existierenden `manual-overrides-ssot-*.json`-Files, summiert `books.length`. Wenn die Summe (vor dem neuen Batch) `% 50 == 0` ist UND die Summe > 0: loud-Stop. Message: „Kumulativ {N} Bücher in der Authority-Schicht. 50er-Schwelle erreicht. Resolver-Brief fällig (OQ4 + OQ5). Loop pausiert. Maintainer-Trigger zum Fortsetzen: nächste CC-Session mit Resolver-Brief, oder Loop-Brief mit explizitem ‚Resolver-50-Stop ignorieren'-Marker im Eröffnungs-Prompt." CC produziert in diesem Fall KEINE neue Override-Datei, KEINEN Status-Log-Eintrag.

- **Override-Skip-Schalter.** Wenn Maintainer im CC-Session-Eröffnungs-Prompt einen Marker wie „skip-50-stop", „ignore resolver pause" oder gleichwertig setzt, überspringt CC den Pre-Check und produziert den nächsten Batch trotzdem. Der Status-Log-Eintrag vermerkt dann „skip-50-stop active". Maintainer kann das z.B. nutzen, wenn er den Resolver bewusst nach hinten schiebt.

- **CC nutzt sein eigenes Reasoning + WebSearch.** Kein Haiku-API-Call, keine Anthropic-API-Inferenz für die Stage-3-Funktion. WebSearch ist das einzige externe Tool für Plot-Lore-Recherche. (Übernommen 1:1 aus Brief 059.)

- **WebSearch-Discipline pro Buch.** 1 obligatorisch (synopsis-context, wenn das Buch nicht aus Trainingsdaten gut bekannt ist), 2-3 conditional (wenn Plot-Lore unzureichend oder Faktion/Charakter-Identität unklar), Soft-Cap bei 5 pro Buch (Omnibus/Anthology darf höher, im Status-Log begründen). CC dokumentiert mittlere und maximale WebSearch-Counts pro Iteration.

- **Plot-Halluzinations-Disziplin.** Keine Faktion / kein Charakter / keine Location ohne Source-Basis. Wenn WebSearch nichts Belastbares liefert: leer lassen oder `{ kind: "low_confidence", field: "characters", reason: "limited source coverage" }`-Flag setzen. Lieber knapp und korrekt als breit und erfunden. Zentrale Schwäche der Haiku-Stage-3 war breite Plot-Erfindung — diese Disziplin ist nicht verhandelbar.

- **Omnibus-/Collection-Aggregation.** Wenn das SSOT-Format `omnibus` / `collection` / `anthology` / `scriptbook` ist: factions/locations/characters/facetIds aggregieren die enthaltenen Einzelwerke, nicht nur das Framing-Material. Tag-Tiefe vergleichbar mit dem längsten Constituent-Werk.

- **Format-Compliance-Check.** Wenn WebSearch belastbar zeigt, dass das Buch real eine Collection/Anthology ist (mehrere benannte Stories, „collects the following", „short story collection") und das SSOT-Format `novel` sagt: `data_conflict`-Flag mit `field: "format"`, `suggestion: "collection"` (oder `"anthology"` bei Multi-Author).

- **Inquisition-Konsistenz.** Wenn ein POV-Charakter ein Inquisitor ist (laut Synopsis, nicht Tag-Inferenz), muss `factions[]` mindestens einen `Inquisition` / `Ordo Xenos` / `Ordo Malleus` / `Ordo Hereticus`-Eintrag mit `role >= "supporting"` enthalten. (Übernommen aus 058-Review.)

- **Surface-Form-Treue, kein Pre-Resolving.** Faktions-/Location-/Character-Namen erscheinen genau so wie in den Quellen — kein Slugify-Mapping, kein Canonical-ID-Lookup. „Sons of Horus" bleibt „Sons of Horus", „Ordo Xenos" bleibt „Ordo Xenos". Resolving in canonical Reference-Tables passiert im Resolver-Brief nach 50 Büchern.

- **Status-Log-Append.** Nach erfolgreichem Override-File-Write hängt CC einen Block an `sessions/ssot-loop-log.md` an. Format-Vorschlag siehe Notes — CC darf Form anpassen, solange (a) Batch-Name, (b) Datum, (c) Buch-IDs, (d) kumulative-Anzahl, (e) pro-Buch-Bullet, (f) WebSearch-Mittel/Max, (g) `value_outside_vocabulary`-Sammlung, (h) auffällige Surface-Forms enthalten sind.

- **Kein DB-Apply, kein Frontend-Smoke, keine Code-Änderungen.** Diff-only. CC committet die neue Override-JSON + den Status-Log-Append + ggf. den `sessions/README.md`-Update. Das war's.

- **Acceptance: Loop ist „erfolgreich" nach jeder Iteration.** Pro `/clear` und Brief-Übergabe genau ein Batch — entweder produziert (Pre-Check grün) oder loud-gestoppt (Pre-Check rot, 50er-Schwelle). Beide Ausgänge sind valide; CC schreibt im Status-Log entsprechend.

- **`npm run lint`** + **`npm run typecheck`** + **`npm run brain:lint -- --no-write`** grün. (Keine Code-Änderungen erwartet, aber Lint-Discipline aus Konvention. CC darf die Befehle bei reinem Daten-Commit überspringen, wenn er es begründet.)

- **Public Synopsis Discipline (ab `ssot-w40k-021` / `W40K-0201`).** Verankert durch Brief 076 (Resolver-Pass 4 axis-sliced) Mini-Phase 5. Greift forward-only — existierende Override-Files `ssot-w40k-001..020` bleiben unangetastet (separater Rewrite-Pass irgendwann später).

  **Synopsen sind public-reader-copy.** `overrides.synopsis` schreibt sich für Leser der Public-Page `/buch/[slug]`: plot-/premise-orientiert, kurz, lesbar. Kein internes Curation-Vokabular, keine Brief-Sprache, keine Audit-Anker.

  **Verboten in `overrides.synopsis`:**
  - SSOT-IDs (`W40K-NNNN`, `HH-NNNN`).
  - Brief-Verweise (`Brief 061`, `Resolver-Pass`, `Brief 076`, …).
  - Authority-Layer-Sprache (`authority layer`, `cumulative=`, `loop-iteration`, `cumulativeBefore`, …).
  - Resolver-/Workflow-Hinweise (`Resolver-Pass`, `resolver class`, `surface form`, `canonical entity`, `direct match`, `alias lookup`, …).
  - Interne Curation-Kommentare (`data_conflict`, `low_confidence`, `historical_canon_layer`, …).
  - Markdown-Fußnoten-/Audit-Stil (`See note:`, `[ref]`, Footnote-Reference-Style, `cf.`-Hinweise).

  **Technische Curation-Infos** gehören stattdessen in:
  - `sessions/ssot-loop-log.md` — per-batch, ohnehin Loop-Log-Konvention; Surface-Form-Sammlung, `value_outside_vocabulary`-Ledger, cross-batch alias-consolidation-Calls für den nächsten Resolver-Pass.
  - `overrides.flags` — `data_conflict`, `low_confidence` etc. bleibt Constraint-conform (schema-tragend, vom Apply-Skript ausgewertet).
  - `book_details.notes` — per-book Maintainer-Notiz für späteres Audit, falls eine über- oder unter-dem-Radar-Bemerkung nötig wird.

  **Begründung.** Synopsen aus `manual-overrides-ssot-w40k-001..020.json` sind public-rendered auf `/buch/[slug]` und wurden teilweise mit internem Curation-Vokabular geschrieben, das für Reddit-Launch / Public-Reader nicht lesbar ist. Die Disziplin trennt sauber: Reader-Copy in `works.synopsis`, Maintainer-Wissen in Loop-Log / Flags / Notes.

- **Faction-Granularity-Discipline (ab `ssot-w40k-021` / `W40K-0201`).** Verankert durch Brief 077 (Grand-Alignment-Junction-Hygiene). Greift forward-only — existierende Override-Files `ssot-w40k-001..020` bleiben unangetastet; die in der DB landenden redundanten Junctions putzt der Backfill-Re-Apply aus Brief 077 (DELETE-then-INSERT).

  **Faction-Tags müssen Browse-Root-Granularität oder spezifischer sein.** Grand-Alignment lebt in `factions.alignment` auf der Sub-Faction-Row, nicht als generischer Filter-Tag. Wikipedia-Style-Umbrella-Tags sind verboten als raw_name; spezifische Sub-Faktionen tragen die Information ohnehin.

  **Verboten als raw_name in `overrides.factions[]`:**
  - `Imperium`, `Imperium of Man`, `Imperium of Mankind` — Grand-Alignment-Tag. Verwende stattdessen die spezifische Sub-Faction (`Astra Militarum`, `Adeptus Astartes`, `Inquisition`, `Mechanicus`, …).
  - `Chaos` als alleiniger Tag, wenn lore-konsistent eine spezifische Chaos-Sub-Faction passt. Verwende `Heretic Astartes`, `Word Bearers`, `Thousand Sons`, `Black Legion`, `Khorne Daemons`, etc.
  - `Xenos`, `Aliens` — niemals. Entweder die konkrete Xenos-Faction (`Eldar` / `Tau` / `Necrons` / `Tyranids` / `Orks`) oder weglassen.

  **Erhaltungs-Pfad.** Wenn das Buch tatsächlich nur generisch über das Imperium / Chaos spricht (Worldbuilding-Sachbuch, Galaxy-Wide-Survey ohne konkrete Faction-POV), darf `Imperium` / `Chaos` als alleiniger Tag stehen — der Apply-Skip greift nicht, weil keine alignment-gleiche Sub-Faction im Block ist (Brief 077 § Constraints). Sehr selten.

  **Begründung.** Brief 070 hat `imperium` als Tree-Root + Grand-Alignment, aber explizit KEIN Browse-Root entschieden (`scripts/seed-data/faction-policy.json` `knownTopLevelExceptions`). Vor Brief 077 hat die LLM den Tag trotzdem konsistent ausgeschrieben, was ~165 redundante `work_factions`-Junctions über `ssot-w40k-001..020` produziert hat (post-Re-Apply weggeputzt). Forward-only-Discipline verhindert die Wiederkehr ab fünfter Welle.

- **Locations-Granularity-Discipline (ab `ssot-w40k-021` / `W40K-0201`).** Verankert durch Brief 084 (Locations-Axis-Hygiene). Greift forward-only — existierende Override-Files `ssot-w40k-001..020` werden vom Backfill-Re-Apply aus Brief 084 in `book_details.notes` korrigiert (Surface-Form wandert von `locationsUnresolved` nach `locationsSkippedRedundant`); `work_locations` bleibt invariant, weil Umbrella-Surface-Forms ohnehin zu `null` resolven.

  **Location-Tags müssen konkret-geographisch sein.** `overrides.locations[].name` ist eine Sektor- / Sub-Sektor- / Welt- / Sub-Location-Bezeichnung. Politik-/Umbrella-/Warp-Surface-Forms sind verboten — die Locations-Achse trägt physische Orte, nicht Reich-/Alignment-/Realm-Klassen.

  **Verboten als raw_name in `overrides.locations[]`:**
  - `Imperium`, `Imperium of Man`, `Imperium of Mankind`, `the Imperium` — politische Reich-Klasse, kein Ort. Verwende konkrete Sektor/Welt (`Cadia`, `Armageddon`, `Hydraphur`, `Scarus Sector`, …).
  - `Chaos`, `Chaos Space`, `the Chaos Space`, `Realm of Chaos` — kein physischer Ort. Verwende konkrete Welten (`Eye of Terror`, `Medrengard`, …) oder weglassen.
  - `the Warp`, `Warp Space` — kein Ort im Sinne der `locations.json` (kein `gx`/`gy`). Wenn der Warp-Aspect plot-relevant ist: in `overrides.synopsis` schreiben.
  - `Xenos`, `Aliens`, `Alien Space` — niemals. Verwende konkrete Xenos-Territorien (`T'au Empire`, `Octarius`, `Vigilus`, …).

  **Erhaltungs-Pfad.** Wenn das Buch ausschließlich Umbrella-Tags trägt und keine konkrete Location (Galaxy-Wide-Survey, lore-only-Standalone), darf ein Tag stehen bleiben — der Apply-Skip greift nicht, weil keine andere Location im Block resolved (Brief 084 § Skip-Bedingung). Sehr selten.

  **Begründung.** Vor Brief 084 hat die LLM Umbrella-Strings konsistent als Filter-Surface auf der Locations-Achse mitausgegeben (Empirie: 20× `Imperium` über `ssot-w40k-001..020`). Da `Imperium` keine `locations.json`-Row hat, resolved der Resolver zu `null` und der Surface-Form landete im `locationsUnresolved`-Notes-Bucket statt im sauberen `locationsSkippedRedundant`-Audit-Bucket. Apply-Layer-Skip macht die Disziplin nun deterministisch (Notes-Bucket-Umsortierung), die forward-only-Discipline verhindert die Wiederkehr ab fünfter Welle.

- **Goodreads-Rating-Discipline (ab `ssot-w40k-021` / `W40K-0201`).** Verankert durch Brief 087 (Goodreads-Rating-Pipeline-Integration). Greift forward-only: existierende Override-Files `ssot-w40k-001..020` bleiben unangetastet; ihre Rating-Coverage stammt aus Brief 086 (119 `hardcover` + 78 `goodreads`, 3 junge Unrated-Ausfaelle).

  **Goodreads ist Page-Read, nicht Snippet.** Pro Buch nutzt CC WebSearch ausschliesslich zum Auffinden der passenden Goodreads-Buchseite (`goodreads.com/book/show/...`). Danach wird die Seite per WebFetch gelesen; Durchschnittsrating und Ratings-Count kommen von der Seite selbst, nie aus dem Such-Snippet.

  **Edition disambiguieren.** CC waehlt die Goodreads-Seite, die zum DB-Buch passt: Einzelroman vs. Omnibus/Collection/Anthology nicht vermischen; Serien- oder Reprint-Seiten nur verwenden, wenn sie die richtige Ausgabe/Work-Aggregation tragen. Bei Ambiguitaet im Status-Log kurz notieren, welche Seite gewaehlt wurde.

  **Override-Form.** Das Ergebnis steht pro Buch in `overrides.rating`:
  - Wert vorhanden: `{ "status": "rated", "source": "goodreads", "value": 4.12, "count": 1234, "evidenceUrl": "https://www.goodreads.com/book/show/..." }`
  - Geprueft, noch keine aggregierte Wertung: `{ "status": "unrated", "source": "goodreads", "reason": "...", "evidenceUrl": "https://www.goodreads.com/book/show/..." }`

  **Nicht raten.** Wenn Goodreads keine aggregierte Wertung zeigt (typisch junge Buecher < ~6-12 Monate oder frische Omnibus-Ausgaben), setzt CC den Unrated-Marker mit Grund. Kein automatischer Nachzug im Loop; spaeterer Refresh-Button / Refresh-Brief ist separat.

  **Apply-Repraesentation.** `status: "rated"` schreibt `book_details.rating` (0-5, zwei Nachkommastellen), `rating_count`, `rating_source='goodreads'`. `status: "unrated"` schreibt `rating=NULL`, `rating_count=NULL`, `rating_source='goodreads'` - damit ist "Goodreads geprueft, noch keine Wertung" von "nie geprueft" (`rating_source IS NULL`) unterscheidbar.

## Out of scope

- **DB-Apply.** Apply für die produzierte Override-Datei läuft separat per `npm run db:apply-override -- --batch=ssot-{domain}-{NNN}` (Brief 060). NICHT in dieser Iteration.

- **Frontend-Smoke.** Keine `/buch/[slug]`-Verifikation pro Iteration. Maintainer kann optional in einer separaten Hand-Aktion smoke'n.

- **Resolver / Surface-Form-Kristallisation.** OQ4 + OQ5. Eigener Brief, getriggert vom 50er-Stop. Loop-Brief beobachtet die Schwelle, schreibt aber den Resolver-Brief nicht selbst.

- **Pipeline-Stage-3-Dead-Code-Cleanup.** Der Haiku-Stage-3-Pfad in `src/lib/ingestion/v2/llm/enrich.ts` bleibt unangetastet — Aufräum-Brief später, wenn der Loop seit längerem stabil läuft.

- **Vokabular-Erweiterung** (OQ2). CC sammelt `value_outside_vocabulary` im Status-Log; die tatsächliche Erweiterung von `facet-catalog.json` läuft in einem getrennten Brief.

- **Brain-Hygiene-Updates.** `project-state.md` / `open-questions.md` / `log.md` / `pipeline-state.md` werden vom Loop NICHT aktualisiert. Cowork macht das in batched Hygiene-Pässen (typisch nach Resolver-Briefs oder Phase-Wraps).

- **`sessions/README.md` Active-Threads-Tabelle pflegen.** Cowork pflegt diese Tabelle. Der Loop darf maximal die Status-Spalte von 061 selbst nicht anfassen (bleibt `open`, ist Standing-Brief).

- **README / ROADMAP / ARCHITECTURE / Atlas-Regen.** Out of Loop.

- **Re-Apply der bestehenden Override-Dateien.** Wenn Maintainer ein bereits geschriebenes Override-File nachträglich korrigiert (z.B. `ssot-w40k-002.json` editiert): Re-Apply läuft per Brief-060-Skript (idempotent). Loop berührt keine bestehenden Files.

## Acceptance

The session is done when:

- [ ] **Pre-Check ausgeführt.** CC listet `scripts/seed-data/manual-overrides-ssot-*.json`, summiert `books.length`, bestimmt nächste Batch-Domain + Nummer + Roster-Slice. Ausgabe im Status-Log: aktuelle kumulative Anzahl, gewählte Batch-ID, gewählter Slice.

- [ ] **50er-Schwellen-Check.** Wenn kumulativ % 50 == 0 UND kumulativ > 0 (und kein „skip-50-stop"-Marker im Eröffnungs-Prompt): loud-Stop, KEINE Override-Datei geschrieben, Status-Log-Eintrag mit Stop-Begründung, Empfehlung „Resolver-Brief schreiben (OQ4 + OQ5)". Iteration endet hier.

- [ ] **Override-Datei committed (wenn nicht 50er-Stop).** `scripts/seed-data/manual-overrides-ssot-{domain}-{NNN}.json` mit den 10 (oder 5/4 am Restbatch-Ende) Buch-Einträgen.

- [ ] **Pro Buch enthalten:** `externalBookId` (matched mit Roster), `slug` (matched mit Roster), `overrides.synopsis` (400-1200 Zeichen, plot-konkret, namentliche Charaktere/Locations; bei Long-Tail-Coverage kürzer + `low_confidence`-Flag), `overrides.facetIds` (typisch 15-20 IDs aus `facet-catalog.json`; weniger bei dünner Coverage), `overrides.factions[]`, `overrides.locations[]`, `overrides.characters[]`, `overrides.flags[]`, ab `ssot-w40k-021` außerdem `overrides.rating`.

- [ ] **Top-Level der Override-Datei:** `$schema: "manual-overrides-v1"`, `batch: "ssot-{domain}-{NNN}"`, `createdBy: "claude-code"` (oder CC's tatsächliche Selbstbenennung), `createdAt: <ISO-Datum>`, `model: <tatsächliches Modell>`, `rationale: <2-3 Satz-Begründung der Batch — was war besonders an dieser 10er-Welle>`.

- [ ] **Status-Log-Append.** `sessions/ssot-loop-log.md` bekommt einen neuen Block angehängt mit (a) Datum, (b) Batch-Name, (c) Buch-IDs + Titel, (d) kumulativer-Counter nach diesem Batch, (e) WebSearch-Mittel + Max, (f) pro-Buch-Bullet (1-2 Sätze: Roster-Mistag-Verdacht? Format-Konflikt? Dünne Coverage? Neue Vokabular-Kandidaten?), (g) `value_outside_vocabulary`-Sammlung der Iteration, (h) auffällige Surface-Form-Frequenzen innerhalb der 10. Wenn die Datei noch nicht existiert, CC legt sie mit kurzer Header-Sektion an (siehe Notes).

- [ ] **Sauberer Domain-Wechsel** (nur relevant beim entsprechenden Lauf). Wenn die nächste Batch HH ist (W40K-Domain durch): CC produziert `ssot-hh-001.json` mit HH-0001..HH-0010 — keine Domain-Mischung im File. Status-Log vermerkt den Domain-Wechsel explizit.

- [ ] **Restbatch-Handling** (nur am Domain-Ende relevant). Wenn die Domain weniger als 10 Restbücher hat (W40K → 5 Restbücher am Ende, HH → 4 Restbücher am Ende): CC produziert einen kleineren Batch (5er bzw. 4er). Status-Log vermerkt „Restbatch, N < 10".

- [ ] **Vollständigkeit:** Wenn beide Domains voll abgedeckt sind: loud-Stop, „Authority-Layer komplett für alle 859 Bücher. Loop fertig. Resolver- + Apply-Sweep für die letzten 50 noch ausstehend." Status-Log-Final-Eintrag.

- [ ] **Lint/Typecheck/Brain-Lint** grün, sofern CC sie laufen lässt (siehe Constraints).

## Open questions

- **Skip-50-Marker-Erkennung.** CC bekommt den Eröffnungs-Prompt vom Maintainer, in dem ggf. ein Skip-Marker steht („skip-50-stop", „ignore resolver pause", o.ä.). CC's Heuristik für das Matching ist seine Wahl (Substring-Match? Regex? Wörterbuch?) — Cowork-Tendenz: liberal substring-matchen, im Status-Log dokumentieren, ob ein Skip erkannt wurde.

- **Long-Tail-Bücher ohne belastbare Web-Lore.** Wenn CC bei einem Necromunda- oder einem Specialist-Imprint-Titel mit 5 WebSearches keine belastbare Plot-Lore findet: minimale Synopsis (≤200 Zeichen, vorsichtig formuliert), reduzierte Tags (5-8 statt 15-20), `low_confidence`-Flag. Lieber knapp und ehrlich als breit und erfunden. (1:1 aus Brief 059 übernommen.)

- **Roster-Fehleintrag-Verdacht** (Cross-Setting). Wenn CC sieht, dass ein als W40K-getaggtes Buch real ein Fantasy-/Necromunda-Buch ist: `data_conflict`-Flag mit `field: "setting"`, `suggestion: "fantasy"` (oder analog), Synopsis kommentiert das offen, Buch bleibt im Override-File (sonst klafft eine Lücke). Maintainer entscheidet im Excel-SSOT-Workflow später über Roster-Cleanup. (1:1 aus 059.)

- **HH-Domain-Plot-Density vs. W40K-Long-Tail.** Erwartung: HH-Books haben höhere Web-Density (Black-Library-Premium-Serie, gut dokumentiert) als W40K-Long-Tail-Mid-2000er. Mittlere WebSearch-Counts dürften in HH niedriger ausfallen. Empirie aus den ersten 5-10 HH-Iterationen wird das zeigen.

- **Resolver-Trigger-Auto-Detection vs. Maintainer-Trigger.** Aktuell stoppt der Loop bei 50/100/150 und gibt die Resolver-Empfehlung. Maintainer schreibt den Resolver-Brief manuell. Alternative später: Loop-Brief schreibt einen Resolver-Stub-Brief (Frontmatter + Goal) und Maintainer füllt aus. Out of Scope für diese Iteration, aber als zukünftige Optimierung notiert.

- **Status-Log-Größe über die Zeit.** Bei ~86 Iterationen wird `ssot-loop-log.md` über tausend Zeilen lang. Cowork wird vermutlich nach jedem Resolver-Brief die letzten 5 Iterations-Blöcke nach `archive/ssot-loop-log-YYYY-MM.md` verlagern. Loop-Brief muss das nicht antizipieren — nur sauber anhängen.

## Notes

### Detection-Algorithmus (illustrativ, nicht final)

```ts
// Pseudocode — CC wählt finale Form
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const SEED_DIR = "scripts/seed-data";
const ROSTER_PATH = join(SEED_DIR, "book-roster.json");

async function detectNextBatch(): Promise<{
  domain: "w40k" | "hh";
  number: number;
  rosterSlice: RosterBook[];
  cumulativeBefore: number;
  isResolverPause: boolean;
  isLoopComplete: boolean;
}> {
  // 1. List existing override files
  const files = (await readdir(SEED_DIR)).filter((f) =>
    /^manual-overrides-ssot-(w40k|hh)-\d+\.json$/.test(f),
  );

  // 2. Group by domain, find max number per domain, sum books
  const perDomain: Record<"w40k" | "hh", { max: number; books: number }> = {
    w40k: { max: 0, books: 0 },
    hh: { max: 0, books: 0 },
  };
  for (const file of files) {
    const m = file.match(/^manual-overrides-ssot-(w40k|hh)-(\d+)\.json$/)!;
    const domain = m[1] as "w40k" | "hh";
    const num = Number(m[2]);
    const data = JSON.parse(await readFile(join(SEED_DIR, file), "utf-8"));
    perDomain[domain].max = Math.max(perDomain[domain].max, num);
    perDomain[domain].books += data.books.length;
  }
  const cumulativeBefore = perDomain.w40k.books + perDomain.hh.books;

  // 3. Resolver-Pause-Check
  const isResolverPause = cumulativeBefore > 0 && cumulativeBefore % 50 === 0;

  // 4. Decide next batch
  const roster = JSON.parse(await readFile(ROSTER_PATH, "utf-8")).books;
  const w40kBooks = roster.filter((b) => b.externalBookId.startsWith("W40K-"));
  const hhBooks = roster.filter((b) => b.externalBookId.startsWith("HH-"));

  const w40kBatchesDone = perDomain.w40k.max;
  const w40kFullDone = w40kBatchesDone * 10 >= w40kBooks.length;

  if (!w40kFullDone) {
    const start = w40kBatchesDone * 10;
    const end = Math.min(start + 10, w40kBooks.length);
    return {
      domain: "w40k",
      number: w40kBatchesDone + 1,
      rosterSlice: w40kBooks.slice(start, end),
      cumulativeBefore,
      isResolverPause,
      isLoopComplete: false,
    };
  }

  const hhBatchesDone = perDomain.hh.max;
  const hhFullDone = hhBatchesDone * 10 >= hhBooks.length;
  if (!hhFullDone) {
    const start = hhBatchesDone * 10;
    const end = Math.min(start + 10, hhBooks.length);
    return {
      domain: "hh",
      number: hhBatchesDone + 1,
      rosterSlice: hhBooks.slice(start, end),
      cumulativeBefore,
      isResolverPause,
      isLoopComplete: false,
    };
  }

  return { /* sentinel */ isLoopComplete: true } as never;
}
```

CC darf den Algorithmus auch direkt im CC-eigenen Skript-Lauf inline ausführen oder in `scripts/loop-next-batch.ts` als Helper-Skript ablegen — beides ist OK. Wenn als Helper-Skript: Lint/Typecheck-Pflicht greift, Skript ist re-runable.

### Status-Log-Format (Vorschlag)

CC erzeugt `sessions/ssot-loop-log.md`, falls noch nicht existent, mit folgendem Header:

```markdown
# SSOT-Loop Log

> Append-only log of every loop-brief iteration (Brief 061). Cowork reads the latest entries to plan resolver briefs, vocabulary expansions, and mini-fixes. Pro Iteration ein H2-Block.
>
> Status-spalte: ✅ committed | ⏸ resolver-pause | ✋ skip-50-active | 🏁 loop-complete

```

Pro Iteration ein H2-Block in folgender Form (CC darf abweichen, solange die acht Akzeptanz-Felder vorhanden sind):

```markdown
## 2026-05-DD · ssot-w40k-002 · W40K-0011..0020 · ✅

- **Cumulative books in authority:** 20 / 50 to next resolver pause
- **CC model:** <model-string>
- **WebSearch:** mean=2.3, max=5 (over 10 books)
- **Per-book bullets:**
  - W40K-0011 *Trollslayer*: ⚠ roster-mistag-suspect (Warhammer Fantasy, not 40K). `data_conflict` flag set, `field: setting, suggestion: fantasy`.
  - W40K-0012 *Space Wolf*: Ragnar Blackmane intro, William King, solid coverage. 2 WebSearches.
  - …
- **value_outside_vocabulary:** ["initiation", "tribal-honor", "duty"]
- **Notable surface-forms (within this batch):** Space Wolves ×4, Inquisition ×3, Fenris ×2.
- **Notes:** Brief 059's W40K-002 file already existed before loop-start; this iteration produced W40K-003. (Beispiel-Fall, gilt für die erste Iteration nicht.)
```

Bei Resolver-Pause ein kürzerer Block ohne Per-Book-Bullets:

```markdown
## 2026-05-DD · ⏸ Resolver-Pause bei 50 Büchern

- **Cumulative books:** 50 (in 5 batches: ssot-w40k-001..ssot-w40k-005)
- **Action required:** Maintainer schreibt Resolver-Brief (OQ4 + OQ5). Loop stoppt bis dahin.
- **Skip-marker?** none detected — Loop hat 50er-Stop respektiert.
```

Bei `skip-50-stop`-aktiviert ein Block mit klarem Marker, dass die Pause ignoriert wurde.

Bei Loop-Complete:

```markdown
## 2026-05-DD · 🏁 Loop complete — 859 Bücher in Authority-Schicht

- **Last batch:** ssot-hh-030 (HH-0291..HH-0294, 4er-Restbatch)
- **Total batches:** 57 W40K + 30 HH = 87 batches
- **Resolver + Apply sweep noch ausstehend** für die letzten N Bücher seit dem letzten 50er-Pause.
```

### Beispiel-Eröffnungs-Prompt für Maintainer

Maintainer ruft CC nach jedem `/clear` mit etwa folgender Eröffnung an:

> „Brief `sessions/2026-05-11-061-arch-ssot-loop.md` ausführen."

Oder mit Skip-Marker, wenn Maintainer den Resolver bewusst verschiebt:

> „Brief `sessions/2026-05-11-061-arch-ssot-loop.m
