---
session: 2026-05-08-047
role: architect
date: 2026-05-08
status: open
slug: pipeline-hardening
parent: null
links:
  - 2026-05-05-044
  - 2026-05-05-045
  - 2026-05-06-046
commits: []
---

# Pipeline-Härtung vor 3d-Apply (Codex-Review-Antwort)

## Goal

Die Phase-3-Pipeline so härten, dass sie vertrauenswürdig in die DB schreiben darf. Heute produziert sie wertvolle Rohdaten, ist aber kein Apply-Kandidat — fünf konkrete Hebel müssen vor dem 3d-Apply-Step gezogen werden. Dieser Brief bündelt sie in einer einzigen Implementier-Session, weil sie verzahnt sind: jeder Hebel allein wäre eine Mikro-Iteration, zusammen ergeben sie die Voraussetzung für 3d.

> **Bundle-Hinweis:** Brief 047 + Brief 048 (Top-Level-Doku-Refresh) werden in **einer einzigen CC-Sitzung** abgearbeitet. Beide Briefs sind in einem Pull zu lesen, beide Reports werden im selben Push committed (zwei separate Commits, einer pro Brief). Reihenfolge in der Sitzung ist CC's Wahl; empfohlen: 047-Code-Arbeit zuerst, weil sie länger braucht und Inhalt für die Doku liefert (z.B. "26 manuelle + ~700 Pipeline-Bücher" vs. nach 047 "wenn Junction-Coverage Sprung greift, Status-Beschreibung anders"). 048 dann am Ende der Sitzung als Doku-Pass über das jetzt-aktuelle Repo. Brief 046 (Opus-Pipeline-D) wurde am 2026-05-08 zurückgezogen — er liegt in `sessions/archive/2026-05/` mit Retraction-Banner.

## Context

Externer Code-Review (Codex, 2026-05-08) hat sechs Findings am Pipeline-Code geliefert; Cowork hat alle sechs am Code verifiziert. Drei davon sind im Carry-over schon teilweise registriert (3d-Sub-Items für `sourceKind`-Enum-Erweiterung, Hardcover-Author-Hebel), zwei sind neu (LLM-Format-Blind-Cast, Open-Library-Edition-Trap), einer ist strukturell schwerwiegend und vorher unterschätzt (Lore-Coverage 0/50 für factionNames/locationNames/characterNames im 044-Batch).

Konkrete Befunde am Diff `ingest/.last-run/backfill-20260505-2247.diff.json` (50er-Batch):

- `primarySource`: 50/50 = `wikipedia`. Lexicanum trifft als Lead bei null Büchern. Plus: `wikipedia` ist nicht im DB-`source_kind`-Enum.
- `factionNames` / `locationNames` / `characterNames`: jeweils 0/50. Diese Felder sind in `field-priority.ts` exklusiv an `lexicanum` gebunden.
- `startY`: 1/50. Gleicher Grund.
- `format`: zwei Treffer mit invaliden Werten (`"book"` Zeile 1906, `"short"` Zeile 4757), die das DB-Enum `book_format` nicht akzeptiert.
- `releaseYear`: 11 von 15 field_conflicts — Reissue-/Edition-Trap aus Open Library.

Brief 046 (Opus-Pipeline-D) bleibt offen und unabhängig — er beantwortet die Modell-Achse, nicht die Pipeline-Architektur. Du kannst ihn parallel laufen lassen oder erst nach diesem Brief; er blockiert nichts.

Relevante Dateien:

- `src/lib/ingestion/types.ts` — `SourceName`-Union, `SourcePayloadFields`
- `src/db/schema.ts:80-93` — `sourceKind`-pgEnum (alt: ohne `wikipedia`/`open_library`/`hardcover`/`llm`)
- `src/lib/ingestion/field-priority.ts` — FIELD_PRIORITY-Map (Junctions exklusiv lexicanum)
- `src/lib/ingestion/merge.ts:74-78` — `primarySource` = `fieldOrigins.title`-Logik
- `src/lib/ingestion/lexicanum/parse.ts:190-220` — `discoverLexicanumArticle`, drei URL-Patterns
- `src/lib/ingestion/llm/parse.ts:236-253` — Format/Availability-Blind-Cast
- `src/lib/ingestion/llm/prompt.ts:138-226` — Tool-Schema (publish_enrichment)
- `src/lib/ingestion/llm/context.ts` — Plot-Context-Fetcher (NICHT Prompt-Context-Builder; CC-Hinweis: der LLM-User-Prompt wird in `enrich.ts` gebaut, nicht hier — der Carry-over-Eintrag „buildContext" zielt auf den Prompt-Builder, finde ihn dort und füge den Hardcover-Hint an)
- `src/lib/ingestion/open_library/parse.ts:85-115` — `extractFields`, top-doc-pick + `first_publish_year`
- `src/lib/ingestion/hardcover/parse.ts:36-54` — Hasura-Query mit `_eq`-only

## Constraints

- **Keine DB-Schreib-Ops.** Pipeline bleibt Dry-Run. 3d-Apply-Step ist explizit Folge-Brief.
- **Keine Refactors außerhalb der genannten Dateien.** Die Engine-Architektur (SourceCrawler, Merge-Engine) bleibt unangetastet.
- **`SourceName`-Union ist die single source of truth** für Source-Identifier in TypeScript. DB-Enum `source_kind` wird per Migration daran angeglichen, nicht andersrum.
- **Kein Modell-Wechsel.** Default-Modell bleibt `claude-haiku-4-5` (siehe Brief 040). Modell-Entscheidung gehört in 046+.
- **Junction-Felder bleiben raw names im Diff.** FK-Resolution gegen `factions.id` etc. ist 3d-Apply-Job — auch für die neuen LLM-extrahierten Junctions.
- **Validation muss strict sein, nicht silent-pass.** Wo die Pipeline heute blind cast macht (Format/Availability), muss sie künftig entweder closest-match auf eine valide Enum-Value mappen ODER den Wert verwerfen UND einen Flag emittieren. Kein dritter Weg.

## Out of scope

- 3d-Apply-Step selbst (FK-Resolution, Insert-Logik, Rollback). Eigener Folge-Brief.
- Weitere 3e-Test-Batches. Erst nach diesem Brief läuft der nächste Batch — dann auf der gehärteten Pipeline.
- Vokabular-Erweiterung (`duty`, `legion`-Faceten-Dimension). Eigener Brief, abhängig von 046.
- Hand-Check-Workflow + Override-Schema. Eigener Brief.
- UI-Änderungen am Ingestion-Dashboard. Das Dashboard rendert die neuen Felder/Audit-Slots automatisch via `DiffFile`-Type.
- Doku-Refresh (README/ARCHITECTURE/ONBOARDING). Eigener Brief 048, parallel.
- Neue Discovery-Quellen. Wikipedia-Master-Liste + die vier bestehenden Sub-Listen reichen.
- Hardcover-Title-Variation (Carry-over distant-Item). Bleibt liegen.

## Acceptance

Die Session ist fertig wenn:

### A — Source-Kind-Enum + primarySource-Logik

- [ ] Drizzle-Migration erweitert `source_kind` um `wikipedia`, `open_library`, `hardcover`, `llm` (per `ADD VALUE`, idempotent). Migration committed unter `src/db/migrations/`.
- [ ] `mergeBookFromSources` in `merge.ts` setzt `primarySource` nicht mehr blind auf `fieldOrigins.title`. Logik: (a) wenn `lexicanum` mindestens ein Lore-Feld geliefert hat (factionNames/locationNames/characterNames/startY/endY) → `lexicanum`. (b) sonst wenn `llm` für Synopsis-Quelle steht → `llm`. (c) sonst Fallback auf `wikipedia`. Begründung im Code-Kommentar.
- [ ] Test-Lauf zeigt Verteilung von `primarySource`-Werten im Diff (nicht 50/50 wikipedia).

### B — Lore-Coverage

- [ ] `discoverLexicanumArticle` probiert mehr URL-Patterns: mindestens `_(Anthology)`, `_(Novella)`, `_(Audio_Drama)`, `_(Short_Story)`, plus lowercase-Varianten der bestehenden, plus den nackten Title-Versuch ohne Suffix mit Author-Mismatch-Toleranz für Listen-Anker. CC entscheidet die genaue Pattern-Liste.
- [ ] MediaWiki-Search-API als Fallback wenn alle URL-Patterns scheitern. Endpunkt: `https://wh40k.lexicanum.com/mediawiki/api.php?action=opensearch&search=<title>&limit=5&namespace=0&format=json`. Wenn Cloudflare blockt: shell-out-curl-Pfad wie schon in `lexicanum/fetch.ts` etabliert nutzen. Wenn API auch nach curl-shell-out 403 liefert: best-effort-soft-fail, dokumentieren im Report.
- [ ] LLM-Tool-Schema (`publish_enrichment` in `prompt.ts`) bekommt drei neue optionale Output-Felder: `factionNames: string[]`, `locationNames: string[]`, `characterNames: string[]`. System-Prompt erklärt: aus Wikipedia-Plot + Lexicanum-Story + Web-Search-Reviews extrahieren; Eigennamen wie auf Wikipedia/Lexicanum genannt; keine Slug-Form (das ist 3d-FK-Resolution-Job); leeres Array wenn nicht clear extrahierbar.
- [ ] `LLMPayload`-Typing + Parser akzeptieren die neuen Felder. Validation: nur `string[]` durchlassen, andere Typen → ignore + ggf. Flag.
- [ ] FIELD_PRIORITY für `factionNames` / `locationNames` / `characterNames` wird `["lexicanum", "llm"]`. Lexicanum bleibt Lead, LLM füllt Lücken.
- [ ] Test-Lauf zeigt Coverage-Sprung. Quantitatives Ziel: bei 20 Test-Büchern hat **mindestens 80%** je mindestens ein Element in mindestens zwei der drei Junction-Felder. Soft-Befund (kein Hard-Acceptance-Blocker), aber im Report quantifiziert.

### C — Format/Availability-Validation

- [ ] `parse.ts` macht keinen Blind-Cast mehr. Validation gegen `BOOK_FORMAT_VALUES` und `BOOK_AVAILABILITY_VALUES` (existieren schon in `prompt.ts`, exportieren falls nötig).
- [ ] Bei Mismatch: Wert wird nicht in `fields.format` / `fields.availability` geschrieben, **stattdessen** wird ein Flag `kind: "value_outside_vocabulary"`, `field: "format"|"availability"`, `current: <der Roh-Wert>` emittiert. CC entscheidet ob ein closest-match-Mapping vorgeschaltet wird (z.B. `"book"` → `"novel"`, `"short"` → `"short_story"`); wenn ja, Mapping als kleines Lookup-Objekt im Code mit Kommentar warum.
- [ ] Test-Lauf zeigt: keine invaliden Werte mehr in `fields.format` / `fields.availability`. Bei künstlich provoziertem Mismatch (z.B. ein 1–2-Buch-Spike-Test mit manipuliertem Cache-Eintrag — CC's Wahl ob das nötig ist) wird der Flag korrekt gesetzt.

### D — Open Library Edition-Filter

- [ ] `searchOpenLibrary` (in `open_library/fetch.ts`) oder `extractFields` filtert die Doc-Auswahl: Sprache (`language: ["eng"]` oder gleichwertige Search-Parameter), und/oder Publisher-Filter auf `"Black Library"`/`"Games Workshop"`/`"Heroic"`-Familie wenn die API es zulässt.
- [ ] `releaseYear`-Mapping nicht mehr direkt aus `first_publish_year`. CC's Wahl zwischen: (a) wenn Wikipedia bereits `releaseYear` geliefert hat, OL liefert nichts mehr (FIELD_PRIORITY für releaseYear bleibt aber `["wikipedia", "lexicanum", "open_library"]`, also ändert sich nur der Open-Library-Beitrag); (b) OL liefert `releaseYear` nur noch wenn ein Edition-Filter (Sprache + Publisher) auf der Top-Doc passt; (c) ein Cross-Check: OL-Wert wird verworfen wenn er ≥ 3 Jahre nach dem Wikipedia-Wert liegt (Reissue-Indikator).
- [ ] Test-Lauf zeigt: deutlich weniger `releaseYear`-Field-Conflicts vs. 044-Batch (Ziel <30% des bisherigen Werts; im 044-Batch waren es 11/15).

### E — Hardcover-Author-Hint

- [ ] Wenn Hardcover-Crawler im Audit-Slot mehrere Author-Namen geliefert hat (`rawHardcoverPayload`-Slot existiert pro Buch), wird im LLM-User-Prompt-Context ein expliziter Hint ergänzt: „Hardcover lists multiple contributors: [Liste]. Cross-check these against the title's stated author when classifying author_mismatch."
- [ ] Alternative Trigger: wenn `payload.fields.authorNames.length === 1` ODER `authorNames[0]` matcht eine Heuristik-Regex `/various|editor|edited.by/i`, wird der gleiche Hint emittiert.
- [ ] CC findet die richtige Stelle (Prompt-User-Builder-Funktion, vermutlich in `enrich.ts` — der Carry-over-Eintrag verwies auf `context.ts:buildContext`, aber diese Datei enthält den Plot-Fetcher; die Prompt-Struktur ist woanders).
- [ ] Test-Lauf zeigt für einen Anthologie-Slug (z.B. `mark-of-calth` oder `tales-of-heresy`) dass `author_mismatch`-Flags jetzt emittiert werden. Bei Single-Author-Büchern keine Verhaltensänderung.

### Übergreifend

- [ ] `npm run lint` grün, `tsc --noEmit` grün, `npm run build` grün.
- [ ] Ein 20-Buch-Test-Lauf (`--limit 20 --offset 0`, neuer Cache-Snapshot weil Prompt sich ändert) als Diff committed unter `ingest/.last-run/`. Der Diff hat:
  - `primarySource`-Verteilung sichtbar (≥3 verschiedene Werte erwartet)
  - Junction-Coverage-Soft-Befund quantifiziert im Report
  - Keine invaliden Format/Availability-Werte
  - releaseYear-Field-Conflicts unter dem 044-Niveau
- [ ] Implementer-Report unter `sessions/2026-05-08-047-impl-pipeline-hardening.md` mit:
  - Welche Versions-/Patch-Pinning-Entscheidungen falls Dependencies dazukamen (sollte keine geben — alles bestehende Libraries)
  - Quantifizierung der fünf Acceptance-Sub-Ziele
  - Kostenvergleich Test-Lauf 20 Bücher vor/nach (Cost-Erhöhung erwartet ~10–20% durch zusätzliche Junction-Output-Tokens)
  - Beobachtungen aus dem Diff: bricht irgendein Hebel etwas Unerwartetes (z.B. Pattern-Erweiterung trifft falschen Lexicanum-Artikel und liefert Lore von einem anderen Buch)?

## Open questions

Nicht-blockierend, aber wertvoll für den nächsten Architektur-Brief:

- Wie verhält sich die Junction-Coverage in Edge-Cases? Audio-Dramen ohne Lexicanum-Artikel und mit dünnem Wikipedia-Plot — kann das LLM die Junctions aus Web-Search-Reviews überhaupt zuverlässig extrahieren, oder bleiben diese Bücher dauerhaft junction-leer?
- Gibt es Bücher, bei denen die neuen URL-Patterns einen falschen Lexicanum-Artikel matchen (Fehl-Match)? Wenn ja, brauchen wir Author-Disambiguierung-Pflicht für die neuen Patterns analog zum bestehenden `(Novel)`-Pattern?
- Welche Edition-Filter-Strategie für Open Library war pragmatisch (Search-Parameter oder Post-Filter)? Falls Search-API es nicht zulässt: wie viele zusätzliche HTTP-Calls bedeutet Post-Filtering pro Buch?
- Bei `format: "book"` / `format: "short"` — würde ein closest-match-Mapping dem LLM helfen (= konstant valider Output), oder verschleiert es echte Klassifikations-Unsicherheit (= verzerrt die `value_outside_vocabulary`-Statistik)?
- Wie sieht das Verhältnis Lexicanum-Pattern-Treffer vs. LLM-Junction-Treffer aus? Wenn LLM für 80% der Bücher Junctions liefert, könnten wir die Lexicanum-Patterns auch wieder verschmälern (= weniger HTTP-Calls).

## Notes

### Reihenfolge für CC

Die fünf Hebel haben Abhängigkeiten:

1. **A zuerst** — primarySource-Logik ist trivial wenn das Enum schon erweitert ist.
2. **C als zweites** — Format-Validation ist isoliert vom Rest, kleinster Sub-Brick.
3. **D parallel zu C möglich** — OL-Filter ist eigene Datei.
4. **B als drittes** — größter Sub-Brick, hängt nicht an A/C/D.
5. **E zuletzt** — Hardcover-Hint braucht den B-Prompt-Schema-Stand, weil der Hint im gleichen User-Prompt-Block lebt.

CC darf abweichen wenn andere Reihenfolge sich besser anfühlt; im Report begründen.

### Nicht-Pin von Dependencies

Bestehende Libraries reichen (`@anthropic-ai/sdk`, `cheerio`, etc.). Keine neue Dependency erwartet. Falls CC eine bewusste Hinzufügung macht (z.B. ein ISO-Sprachcode-Helper für OL-Filter): Begründung im Report, normaler `npm install`-Workflow, CC entscheidet die Version per gängiger Cowork-Disziplin.

### Bezug zu Brief 046

046 (Opus-Pipeline-D) ist orthogonal — er beantwortet „Welches Modell für 3e?". 047 beantwortet „Ist die Pipeline überhaupt 3d-fähig?". Beide Antworten brauchen wir, aber sie sind unabhängig. Wenn 046 zwischenzeitlich zurückkommt, kann der nächste Brief (047 als Test-Gate erfüllt) Modell-Entscheidung + Vokabular-Erweiterung bündeln.

### Skip-Bedingungen für Folge-Briefs

Wenn dieser Brief grün rauskommt:

- Ein Backlog-Item „Pattern-Schmälerung" wird im Carry-over geöffnet, falls B-Test zeigt dass LLM die Junction-Coverage allein trägt und die erweiterten URL-Patterns überflüssig sind.
- Wenn die `value_outside_vocabulary`-Format-Flags im Test-Lauf ≥3 distinct-Werte zeigen, wird das im nächsten Brief in Vokabular-Erweiterungs-Arbeit gefolden.
