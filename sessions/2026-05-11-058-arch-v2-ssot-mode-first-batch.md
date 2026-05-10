---
session: 2026-05-11-058
role: architect
date: 2026-05-11
status: open
slug: v2-ssot-mode-first-batch
parent: 2026-05-10-057
links:
  - 2026-05-10-057-arch-excel-roster-import
  - 2026-05-10-057-impl-excel-ssot-import
  - 2026-05-10-056-impl-v2-pre-roster-fixes
  - 2026-05-09-055-impl-v2-voll-lauf-decision-gate
commits: []
---

# V2-Pipeline-Refactor auf SSOT-Mode + erster 10er-Batch (W40K-0001..0010)

## Goal

Den V2-Pipeline-Pfad so umbauen, dass er die Maintainer-kuratierte SSOT (`scripts/seed-data/book-roster.json`, 859 Bücher) statt der Wikipedia/TLBranson-Discovery als Roster-Quelle benutzt — und im selben Brief den ersten SSOT-Batch von 10 Büchern (`ssot-w40k-001`) als committed Diff produzieren. Discovery-Stage 0 wird im SSOT-Modus übersprungen, die Stage-1-Validator-Riege wird gegen die jetzt-fixierten Felder durchgegangen und punktuell getrimmt, und das Stage-3-Slim-LLM-Tool-Schema verliert das Format-Feld (Excel-fix). Dry-run-only — DB-Apply bleibt Brief-3d+.

## Context

Nach 057 ist die SSOT-Pipeline-Vorarbeit komplett:

- **Schema-Migration `0008_ssot_schema.sql`** ist applied (Vercel-Auto-Deploy hat die committed-Migrationen schon angewandt; verifiziert in der 057-impl-Append: `__drizzle_migrations` index 9 = `0008_ssot_schema`, `works.external_book_id varchar(16)` UNIQUE existiert, `book_details.notes text` existiert, `work_collections` mit composite-PK + `work_collections_content_idx`-Sekundär-Index + zwei FK-Cascades auf `works(id)` ON DELETE CASCADE existiert, `bookFormat`-Enum hat 9 Werte inkl. `collection`/`artbook`/`scriptbook`, `sourceKind`-Enum hat 15 Werte inkl. `ssot`).
- **Truncate `npm run db:reset-for-ssot -- --confirm`** ist gegen die prod-Supabase gelaufen. Pre-State `works=26 / book_details=26 / work_factions=60 / work_persons=26 / work_facets=413 / external_links=26` → Post-State alle 12 work-Domain-Tabellen auf 0. Alle 10 Reference-Tabellen byte-identisch vorher/nachher (`eras=7, factions=29, series=21, persons=12, characters=0, locations=28, sectors=5, services=18, facet_categories=12, facet_values=85`). DB-State ist clean-slate.
- **`scripts/seed-data/book-roster.json`** (859 Books + 191 Collections) liegt deterministisch im Repo, SHA256-verifiziert byte-identisch über Re-Runs. Per-Book-Form (von `scripts/seed-data/types.ts` getypt): `{ externalBookId, slug, title, authors, editors, editorialNote, releaseYear, format, seriesHint, sourceUrl, notes, sourceRow }`. `releaseYear` kann `null` sein (1 Treffer: W40K-0307 "War for Armageddon Omnibus"). Cluster-Verteilung: 294 `HH-NNNN`-Einträge zuerst (lex-Sortierung `H` < `W`), dann 565 `W40K-NNNN`-Einträge. → **Die ersten W40K-Bücher beginnen im Roster-Index unmittelbar nach dem letzten HH-Eintrag.**
- **V2-Pipeline-Pfad** (`src/lib/ingestion/v2/run-engine.ts` + `run-batch.ts` + `run-pilot.ts` + `validators/{year-outlier,edition-isbn,pagecount,author-editor,lexicanum-missing,index}.ts` + `llm/{prompt,enrich,parse}.ts` + `sources/{lexicanum,open-library,hardcover}.ts`) ist post-055/056 stabil. Stage 0 (Discovery: Wikipedia + TLBranson via `discoverV2Roster()` in `run-engine.ts`), Stage 1 (per-book Source-Claims über `fetchSourceClaims`), Stage 2 (`runAllValidators(claims, book) → Validation[]`), Stage 3 (`enrichBookWithLlmV2` → `SlimLlmPayload`), Stage 4 (`foldIntoBookV2Record` → `BookV2Record`). 056 hat per-page Lexicanum-Cache + per-book Diff-Checkpointing + Cost-Recompute auf Cache-Hits hinzugefügt — bleibt unverändert nutzbar im SSOT-Modus.
- **CLI-Dispatch** in `scripts/ingest-backfill.ts` route'd heute V2 über `--pipeline=v2 --pilot=<name>` (Pilot) oder `--pipeline=v2 --batch=<name> --limit=N` (Batch). Beide Pfade rufen `runV2Pilot` bzw. `runV2Batch` auf; mutual exclusion enforced. Pilot-Slugs hardcoded in `PILOT_V2_TRYOUT_1`; Batch-Namen registriert in `REGISTERED_BATCHES = new Set(["v2-tryout-2"])` in `run-batch.ts`.

Brief 058 zieht diese Werkzeuge an den SSOT-Roster heran. Die `book-roster.json` ist heute *gelandet aber von keinem Pipeline-Pfad konsumiert* — die einzigen heutigen Konsumenten sind ein offener TypeScript-Type (`RosterFile` in `scripts/seed-data/types.ts`) und die Loader-Skript-Output-Datei. Das ändert sich hier.

Operativer Modus: 10er-Batch-Reihe (siehe [`./../brain/wiki/decisions/why-excel-ssot-not-crawl.md`](../brain/wiki/decisions/why-excel-ssot-not-crawl.md) und [`./../brain/wiki/project-state.md`](../brain/wiki/project-state.md)). Brief 058 setzt das Werkzeug auf, fährt den ersten Batch (W40K-0001..W40K-0010 = die ersten 10 mainline-W40K-Einträge, Cluster nach den 294 HH-Büchern). Briefs 059+ sind Folgereihen, mit Maintainer-Review zwischen den Briefs.

## Constraints

- **TypeScript strict.** Kein `any`, keine `as unknown as`. Neue Code-Pfade tragen die V2-Types vom run-engine; das `DiscoveredBook`-Interface aus `src/lib/ingestion/types.ts` ist die canonical Form, an der `processBookV2(book)` heute hängt — der SSOT-Adapter konvertiert `RosterBook → DiscoveredBook` (siehe Notes-Sektion für die Form-Mapping-Skizze).
- **Dry-run by design.** SSOT-Modus schreibt nie in die DB. Output ist ein Diff unter `ingest/.last-run/v2-batch-YYYYMMDD-HHMM.diff.json` (gleicher Filename-Pattern wie heutiger `v2-batch-`-Pfad). Der `pilot`/Batch-Identifier im V2DiffFile-Schema trägt den SSOT-Batch-Namen (siehe unten).
- **Discovery-Stage 0 abschalten im SSOT-Modus.** `discoverV2Roster()` (Wikipedia + TLBranson) wird im SSOT-Pfad **nicht** aufgerufen. Der Roster kommt aus `scripts/seed-data/book-roster.json`. Wikipedia-/TLBranson-Crawler bleiben im Code, nicht löschen — sie sind weiterhin für den Pilot-Pfad (`run-pilot.ts`) und den heutigen `v2-tryout-2`-Batch erreichbar, und perspektivisch für einen 3f-Maintenance-Crawler (Wikipedia-Diff für new releases als Vorschlags-Quelle in die Excel). Code-Schalter: neue Mode-Achse im run-engine ODER getrenntes neues run-batch-ssot.ts. CC's Call (siehe Open Questions).
- **CLI-Schalter:** SSOT-Modus wird über einen neuen Flag-Block aktiviert. Cowork-Tendenz: `--pipeline=v2 --source=ssot --offset=N --limit=M`. `--batch=<name>` wird parallel oder als Replacement weitergetragen (CC's Call) — wichtig ist, dass das im V2DiffFile-`pilot`-Slot landende Identifier-String unter dem Schema `ssot-<cluster>-NNN` steht. Mutual-Exclusion-Logik (V1 / V2-Pilot / V2-Batch-Crawl / V2-Batch-SSOT) muss in `parseCliArgs` sauber bleiben.
- **Erster Batch:** `ssot-w40k-001`. Das sind die **ersten 10 mainline-W40K-Bücher im Roster**: lex-sortiert nach `externalBookId` liegen die 294 `HH-NNNN`-Einträge vor den `W40K-NNNN`-Einträgen, also beginnen die W40K-Bücher unmittelbar nach dem letzten HH-Slot. CC verifiziert den exakten Offset via Roster-Read (nicht hardcoden — falls Maintainer-Excel-Edits die HH-Zahl verschieben, bleibt die Logik korrekt). `--offset` muss eindeutig im SSOT-Modus eine **Roster-Index-Position** sein (0-basiert auf `books[]`), nicht eine globale Slug-Position wie im V1-Pfad.
- **Batch-Name-Registry:** semantisch nach Cluster (Maintainer-Entscheidung 2026-05-11). Schema: `ssot-<cluster>-NNN` mit `cluster ∈ {hh, w40k}`. Für Brief 058 registriert: `ssot-w40k-001`. Briefs 059+ tragen die fortlaufenden Namen (`ssot-w40k-002`, `ssot-hh-001`, …) inkrementell ein. Der Registry-Mechanismus selbst (gating auf `REGISTERED_BATCHES`-Set) bleibt erhalten — gleiche Schutz-Disziplin wie heute beim Crawl-Pfad.
- **Stage-1-Validator-Walk-through.** Die fünf Validatoren in `src/lib/ingestion/v2/validators/index.ts` werden **einzeln** gegen die jetzt-fixierten SSOT-Felder geprüft. Der Trim-Mode ist NICHT pauschal "Validators raus", sondern feldgenau. Cowork-Lesart (Stand 2026-05-11) + CC-Verification-Pflicht:
  - `year_outlier` — operiert auf `claim.fields.startY` (**in-universe-Year** aus Lexicanum-Infobox) sowie `claim.raw.bodyYearCandidates` (Lexicanum-Body-Audit). Die SSOT liefert `releaseYear` (**Publikations-Jahr**), nicht `startY`. **Validator bleibt aktiv** — er hat weiterhin Signal. (Pipeline-state.md hatte im 057-Stand "year_outlier raus weil Year-fix" stehen; das war eine Misslesung und wird in Brief 058 korrigiert.)
  - `edition_isbn_conflict` — vergleicht ISBN-Claims aus Lexicanum/OL. SSOT hat kein ISBN-Feld. **Validator bleibt aktiv.**
  - `pagecount_outlier` — checkt OL-`pageCount` (`<30` drop / `>1500` flag). SSOT hat kein `pageCount`-Feld. **Validator bleibt aktiv.**
  - `author_editor_suspicion` — Anthologie-Detection via `editorNames`-Cell (Lexicanum-Infobox) oder Single-Author-Name-Regex (`/various|editor|edited by|anonymous/i`). SSOT liefert `format` direkt aus dem Maintainer-Excel + zwei dedizierte Felder (`editorialNote: "various" | null`, `editors: string[]`). **Validator-Suggested-Action `flag` für `format=anthology` ist hier redundant**, weil das SSOT-`format` der LLM-Output und dem Validator zuvor kommt. CC's Call: entweder Validator komplett deaktivieren im SSOT-Modus, oder zu einer audit-only Cross-Check-Variante umbauen (das Lexicanum-Editor-Cell-Signal bleibt informativ — wenn SSOT-format `novel` sagt, Lexicanum aber Editor-Cell trägt, ist das eine Cowork-Triage-Note). Cowork-Empfehlung: deaktivieren im SSOT-Modus (kleinstmögliche Code-Änderung); audit-only ist die nächste Iteration falls Cross-Checks im echten Batch nützlich werden.
  - `lexicanum_missing` — Transparenz-only. **Validator bleibt aktiv.**
- **Stage-3-LLM-Tool-Schema-Trim.** Die SSOT liefert `format`, `title`, `authors`, `releaseYear` autoritativ. Im `PUBLISH_ENRICHMENT_TOOL_V2`-Schema (`src/lib/ingestion/v2/llm/prompt.ts`) sind `title`/`authorNames`/`releaseYear` heute schon NICHT enthalten (V2 hat sie nie ge-LLM'd — nur Synopsis/facetIds/factions/locations/characters/flags + optional format). **Konkrete Änderung: `format` aus dem Tool-Schema raus** plus zugehörige Anpassung in `SYSTEM_PROMPT_V2`. Der weiterhin enthaltene `flags` darf den `data_conflict`-Pfad behalten — falls ein Buch im LLM-Web-Search-Ergebnis offensichtlich von der SSOT-format abweicht, soll der LLM ein Flag emittieren statt das Field zu überschreiben.
- **Stage-3-User-Prompt-Anpassung.** Der heutige `buildUserPromptV2` füllt das "Book to enrich"-Header mit `merged.fields.title` + `merged.fields.authorNames` und gibt `merged.fields` als JSON-Blob aus. Im SSOT-Modus soll die "Multi-source data"-Sektion deutlich machen, dass `title`/`authors`/`releaseYear`/`format`/`seriesHint` **SSOT-fix sind, nicht zu überschreiben** — entweder durch ein neues "SSOT-fixed fields"-Header-Segment, oder durch eine zusätzliche Constraint-Zeile im User-Prompt. CC entscheidet die Form; das Outcome ist, dass das LLM nicht mehr versucht, einen `format`-Vorschlag zu produzieren, und Synopsis + Junctions auf den SSOT-Kontext anchored bleiben.
- **`PROMPT_VERSION_HASH_V2` bumpt automatisch** (sha256 über System-Prompt + Tool-Schemata) — das invalidiert den V2-LLM-Cache für die im Batch enthaltenen Bücher. Nicht löschen, der Cache funktioniert per-Slug + Prompt-Hash-Suffix; alte Einträge bleiben ko-existent für Reproduzierbarkeit alter Diffs.
- **Per-Page Lexicanum-Cache + Per-Book Diff-Checkpointing aus 056** bleiben aktiv und unverändert nutzbar. Im SSOT-Modus soll `processBookV2(book)` ohne Änderung am Sub-Stage-Code laufen — der `RosterBook → DiscoveredBook`-Adapter macht den Eintritt kompatibel.
- **`work_collections`-Junction-Population**: explizit **NICHT** in 058. Der Loader hat 191 Collection-Refs in `book-roster.json.collections[]` bereit; die Pipeline schreibt aber heute überhaupt nichts in die DB. Die Junction-Insert-Reihe ist 3d-Apply-Material — siehe pipeline-state.md "Sub-phase backlog" für die geplante Sequenz.
- **`npm run lint`** + **`npm run typecheck`** + **`npm run brain:lint -- --no-write`** grün am Ende.

## Out of scope

- **DB-Apply / Insert-Pfad.** Pipeline bleibt diff-only. Migration 0007 ALTER TYPE `source_kind` (für `wikipedia`/`open_library`/`hardcover`/`llm` als primarySource-Werte), `work_collections`-Junction-Population, `external_book_id → works.id` UNIQUE-Mapping, `editorialNote`/`editors`-Mapping nach `work_persons.role` — alles 3d-Brief.
- **Junction-Resolver** (Surface-Form → Canonical-ID für Faktionen/Locations/Characters). OQ4 + OQ5; folgt nach 30–50 prozessierten Büchern (~Brief 063).
- **Author-/Editor-Resolver.** `RosterBook.authors[]` ist eine Raw-String-Liste; Mapping auf `persons.id` (existing 12 Author-Einträge in der Reference-Tabelle) ist 3d-Job. `RosterBook.editors[]` (heute leer in der Excel) + `RosterBook.editorialNote === "various"` brauchen denselben Resolver-Pfad mit `work_persons.role = "editor"`. Ebenfalls 3d.
- **DetailPanel "Auch enthalten in:"-Frontend.** Backend (`work_collections`-Junction + `worksRelations.containedIn`/`contains`) ist bereit; Frontend folgt in einem eigenen kleinen Brief später, sobald 058+ erste Omnibus-Children im Diff hat und ein 3d-Apply die Junction populated hat.
- **Vokabular-Erweiterung** (OQ2 — `duty`, `legion`-Faceten-Dimension, `chaos`-pov_side Prompt-Härtung). Wartet auf empirische Auslöser aus der 10er-Batch-Reihe.
- **Modell-Entscheidung Haiku vs. Sonnet** (OQ1). Cost-Bild post-055 erdrückend pro Haiku; nicht in 058.
- **Hardcover-Rating-Promotion + Open-Library-Fallback** (OQ6). Architektonisch separat; nicht in 058.
- **Hand-Check-Workflow + Override-Schema** (OQ3). Sequenz post-Resolver, vor 3d-Apply.
- **Wikipedia-/TLBranson-Crawler-Code löschen oder refactoren.** Sie bleiben unverändert im Code für Pilot-Pfad + zukünftige 3f-Maintenance-Crawler-Vorschlags-Quelle. Brief 058 deaktiviert sie nur **in der SSOT-Code-Pfad-Verzweigung**.
- **Bestehende `v2-tryout-2`-Batch-Registrierung löschen.** Bleibt im `REGISTERED_BATCHES`-Set neben den neuen `ssot-*`-Einträgen. Code-/Doku-Aufräumarbeit kommt später.
- **Brain-Hygiene-Updates** (`project-state.md`/`pipeline-state.md`/`open-questions.md` auf den 057-Apply-Stand-+-SSOT-Pipeline-Stand bringen). Cowork macht das später heute in einem separaten Schritt — soll nicht in den 058-impl-Report wandern.
- **README/ROADMAP/ARCHITECTURE-Top-Level-Updates.** Sind Karpathy-Reset-Redirect-Stubs; keine Inhaltsänderung nötig.

## Acceptance

The session is done when:

- [ ] **SSOT-Modus in der V2-Pipeline aktiv.** Aufruf via `npm run ingest:backfill -- --pipeline=v2 --source=ssot --batch=ssot-w40k-001 --offset=<auto> --limit=10` (oder funktional äquivalentes Flag-Set; CC dokumentiert die finale Form im Report). Mutual-Exclusion gegen V1 / V2-Pilot / V2-Crawl-Batch sauber, mit loud-Errors bei widersprüchlichen Flags.
- [ ] **`book-roster.json` als Roster-Quelle.** Der SSOT-Modus liest `scripts/seed-data/book-roster.json` und konvertiert `RosterBook → DiscoveredBook` per Adapter (siehe Notes für die Form-Skizze). Wikipedia/TLBranson-Crawl wird im SSOT-Modus nachweislich nicht aufgerufen (im Report: stdout-Snippet zeigt 0 Wikipedia-Page-Fetches, 0 TLBranson-Page-Fetches; nur die 10 per-Book Lexicanum/OL/Hardcover-Crawls + LLM-Calls).
- [ ] **Roster-Index für `ssot-w40k-001`.** Loader-Read identifiziert den Offset des ersten W40K-Eintrags im Roster automatisch (Suche nach erstem `externalBookId.startsWith("W40K-")` im lex-sortierten Array). Die ersten 10 Bücher dieses Slice landen im Diff. CC notiert im Report die exakten 10 `externalBookId`-Werte (Plausibilitäts-Check: sollten W40K-0001..W40K-0010 sein, falls die Excel nichts gelöscht hat).
- [ ] **Stage-1-Validator-Walk-through dokumentiert.** Im Report einen kurzen Abschnitt mit per-Validator-Status: `year_outlier` aktiv (Begründung), `edition_isbn_conflict` aktiv, `pagecount_outlier` aktiv, `author_editor_suspicion` deaktiviert im SSOT-Modus (Begründung; ggf. Code-Pfad-Skizze: skip im run-engine wenn SSOT-Source, oder Inert-Implementation), `lexicanum_missing` aktiv. Falls CC nach Code-Lektüre andere Schlüsse zieht: loud begründen.
- [ ] **Stage-3-LLM-Tool-Schema getrimmt.** `format` raus aus `PUBLISH_ENRICHMENT_TOOL_V2.input_schema.properties`. Anpassung des Systems-Prompts entsprechend (das "format may be OMITTED…"-Bullet entweder ganz raus oder zu "format is set by SSOT — do not propose"). `PROMPT_VERSION_HASH_V2` ist automatisch neu gehasht; im Report den vorher/nachher-Hash dokumentieren.
- [ ] **Stage-3-User-Prompt-Anpassung.** Der User-Prompt zeigt dem LLM, dass `title`/`authors`/`releaseYear`/`format`/`seriesHint` SSOT-fix sind. Ob als eigene "SSOT-fixed fields"-Sektion oder als Constraint-Zeile in der "Multi-source data"-Sektion ist CC's Wahl; Outcome: LLM versucht nicht mehr, diese Felder zu überschreiben.
- [ ] **Erster Diff committed.** `ingest/.last-run/v2-batch-YYYYMMDD-HHMM.diff.json` mit `pilot: "ssot-w40k-001"`, `discoverySource: ["ssot"]` (neuer Wert; CC entscheidet, ob das V2DiffFile-Schema das toleriert oder ein nullable-/array-Wert sinnvoll ist), 10 Records in `added[]`, plausibler `validationSummary`-Histogramm, `llmCostSummary` mit nicht-null Fresh-Run-Cost (Cache wird durch den Prompt-Hash-Bump invalidiert, also kein Free-Lunch — der Brief erwartet ~$0.20 total für 10 Bücher auf Haiku-Pace).
- [ ] **Diff rendert im `/ingest`-Dashboard.** Smoke-Check: das committed Diff erscheint in der Card-Liste, drill-down funktioniert. Kein Code-Touch am Dashboard nötig — wenn doch (`discoverySource`-Array-Erwartung etc.), im Report begründen.
- [ ] **Surface-Form-Snapshot.** Wie bei 055 (`v2-batch-20260510-1109-surfaces.json` als Sibling): ein `…-surfaces.json` neben dem Diff, das die Faction/Location/Character-Surface-Forms aus dem 10er-Lauf für die Resolver-Triage sammelt. 10 Bücher liefern keine valide Verteilungs-Empirie, aber die Datei dient als Roll-Forward-Format für die spätere Aggregation über 058+059+…
- [ ] **Cost + Web-Search-Reporting.** Im Report die per-Buch-Averages: `$X/book`, `Y web_search/book`. Hochrechnungs-Zeile auf 859 Bücher (extrapoliert auf Voll-Lauf-Kosten) — Plausibility-Check gegen Brain-Hochrechnung ~$15 für 750 Bücher post-055.
- [ ] **`npm run lint`** + **`npm run typecheck`** (oder das im Repo etablierte typecheck-Script) + **`npm run brain:lint -- --no-write`** grün.

## Open questions

- **Code-Pfad-Topologie.** Mode-Achse in `run-engine.ts` (Discovery-Funktion nimmt eine `RosterSource`-Wahl) ODER getrenntes `run-batch-ssot.ts` neben `run-batch.ts`? Cowork-Tendenz: Mode-Achse in `discoverV2Roster` (oder ein neuer `loadV2Roster(source: "crawl" | "ssot")`-Wrapper), weil der pro-Buch-Pfad (`processBookV2`) unverändert bleibt. CC's Call — der Mode-Achse-Pfad ist DRY; das getrennte Skript ist Diff-niedriger und einfacher zu lesen, kostet aber doppelte CLI-Dispatch-Logik in `scripts/ingest-backfill.ts`. Begründung im Report.
- **Mutual-exclusion-Form bei `--batch` vs. `--source=ssot`.** Soll `--source=ssot` auf den `--batch=<name>`-Slot weitertragen (Batch-Namen-Registry bleibt single source of truth) oder eine eigene `--ssot-batch=<name>`-Flag bekommen? Cowork-Tendenz: `--batch=ssot-w40k-001` mit zusätzlichem `--source=ssot` als Mode-Schalter — Namen-Registry erweitert sich automatisch um die `ssot-*`-Einträge. Aber CC's Call wenn die Mutual-Exclusion-Matrix dadurch hässlicher wird als bei separatem Flag.
- **`discoverySource`-Feld im V2DiffFile-Schema.** Heute typed als `string[]` (z. B. `["wikipedia", "tlbranson"]`). Im SSOT-Modus passt `["ssot"]` semantisch, aber ob das Dashboard-Rendering damit umgeht (oder eine Sentinel-Form wie `["ssot:scripts/seed-data/book-roster.json"]` lesbarer ist) ist CC's Wahl. Falls das Schema selbst getouched werden muss: minimaler Eingriff; sicherstellen, dass es weiterhin die 055er und 056er Diffs valide rendert.
- **`author_editor_suspicion`-Validator: inert-im-SSOT-Modus oder audit-only?** Cowork-Empfehlung: inert (return `[]` wenn der Aufruf-Kontext SSOT-getriggert ist, oder Auslassen des Validators in der Validator-Liste für den SSOT-Pfad). Wenn CC nach Lektüre des Validator-Codes findet, dass eine audit-only Cross-Check-Variante mit wenig Aufwand drin ist (Lexicanum-Editor-Cell ≠ SSOT-format), gerne anbieten — aber nicht über das Brief-Acceptance-Bullet hinausgehen.
- **`releaseYear: null`-Handhabung im SSOT-Adapter.** RosterBook erlaubt `releaseYear: number | null`; `DiscoveredBook.releaseYear` ist `number | undefined`. Mapping: `null → undefined`? Oder eine zusätzliche null-toleranz im DiscoveredBook-Type? CC's Call — der Type-Touch betrifft nur das eine Feld; alle anderen Roster-Felder mappen sauber.
- **`seriesHint` aus Excel vs. Discovery-`seriesHint`.** Excel "Section / Series" liefert Strings wie `"Inquisitor (Eisenhorn/Ravenor/Bequin)"` oder `"Original Horus Heresy"`; Discovery-`seriesHint` ist heute strukturierter (`"Horus Heresy"`/`"Eisenhorn"` kompakter). Der `year_outlier`-Validator macht case-insensitive Substring-Match (`includes("horus heresy")`, `includes("eisenhorn")`, …) — sollte mit den Excel-Strings funktionieren, aber ist eine 058-Verifikations-Aufgabe. Im Report dokumentieren: für die 10 ausgesuchten W40K-Bücher (alle vermutlich nicht-Anchor-Series) ist der Validator stumm; das Anchor-Matching-Verhalten gegen Excel-Strings wird empirisch erst beim ersten HH-Batch (`ssot-hh-001`) belastet.

## Notes

- **`RosterBook → DiscoveredBook`-Adapter-Skizze** (illustrativ, nicht final):

  ```ts
  // src/lib/ingestion/v2/ssot/load.ts (oder gleichwertiger Pfad)
  import rosterFile from "@/../scripts/seed-data/book-roster.json"; // oder fs-read
  import type { DiscoveredBook } from "@/lib/ingestion/types";
  import type { RosterBook } from "@/../scripts/seed-data/types";

  export function rosterBookToDiscovered(rb: RosterBook): DiscoveredBook {
    return {
      slug: rb.slug,
      title: rb.title,
      authorHint: rb.authors[0],                // Erste-Author-Wahl; multi handled später
      releaseYear: rb.releaseYear ?? undefined, // null → undefined
      seriesHint: rb.seriesHint ?? undefined,
      seriesIndex: undefined,                   // Excel hat keinen seriesIndex
      isEntryPoint: undefined,                  // Excel hat kein isEntryPoint
      sourcePages: [rb.sourceUrl],              // TLBranson- oder Wikipedia-URL aus der Excel
      // SSOT-spezifisch: das LLM/Validator-System soll sehen, wo der Eintrag herkommt
      // — entweder via neuer `source: "ssot"`-Feld auf DiscoveredBook oder via
      // eines parallelen `SsotBookContext`-Sidecars an `processBookV2(book, ctx?)`.
    };
  }
  ```

  Die ausgelassenen `RosterBook`-Felder (`format`, `externalBookId`, `notes`, `editors`, `editorialNote`, `sourceRow`) brauchen einen Weg, das LLM/Validator-System zu erreichen. Cowork-Empfehlung: **Sidecar-Objekt** an `processBookV2` (`processBookV2(book, ssotContext?)`), das die SSOT-fixierten Felder in den User-Prompt foldet und im `BookV2Record.fields.format`/`.title`/etc. die `source: "ssot"` markiert (statt heute `discovery`/`llm`). Damit bleibt der Adapter-Output ein DiscoveredBook + Sidecar, ohne Type-Inflation am DiscoveredBook selbst.

- **`FieldRecordSource`-Erweiterung.** `src/lib/ingestion/v2/types.ts`'s `FieldRecordSource`-Type bekommt einen `"ssot"`-Wert (parallel zu `"discovery"`, `"lexicanum"`, …). Damit landet `format`-FieldRecord mit `source: "ssot"` im finalen `BookV2Record` — der Diff-Reader/das Dashboard kann die SSOT-Herkunft visualisieren. Zugehörige Anpassung in `synthFieldOrigins` (Mapping `"ssot" → "manual"` oder neuer SourceName-Wert) sicherstellen, dass das V1-`MergedBook`-Shim weiter rendert.

- **`Stage 4` foldIntoBookV2Record:** Im SSOT-Modus überschreiben SSOT-Felder die Stage-1-Claims für `title`/`authorNames`/`releaseYear`/`format`/`seriesHint`. Die Priority-Order in `foldIntoBookV2Record` muss SSOT vor `lexicanum`/`open_library`/`discovery` setzen. Konkret: `titleField`, `authorField`, `releaseYearField`, `formatField`, `seriesHintField` lesen zuerst aus dem Sidecar/SSOT-Bucket, falls vorhanden; sonst die heutige Picker-Logik. Keine Änderung an den `startY`/`endY`/`isbn*`/`pageCount`/`coverUrl`/`synopsis`/`facetIds`/`factions`/`locations`/`characters`-Pfaden — die weichen Felder bleiben Quelle-Pipeline-getrieben.

- **Sequenz nach 058.** Briefs 059..0XX = fortlaufende 10er-Batches mit Maintainer-Review zwischen den Briefs (Surface-Forms, Validator-Trigger, plausible Synopsen). Mini-Briefs zwischendrin: Vokabular-Erweiterung (OQ2), Validator-Tuning falls die Walk-through-Entscheidungen aus 058 sich revidieren, Excel-Fix-Re-Imports falls Maintainer-Edits passieren. DetailPanel "Auch enthalten in:"-Mini-Brief sobald ein Batch erste Omnibus-Children produziert UND ein 3d-Apply die Junction populated hat (also nicht in der 10er-Batch-Reihe — eher post-Resolver-Brief).

- **Brain-Updates post-058** (Cowork-Job nach Implementer-Report — nicht CC's Aufgabe): `project-state.md` Z. ~50 V2-batch-canonical-Diff-Pfad auf die neue 058er-Datei aktualisieren, "Latest pipeline state"-Sektion auf SSOT-Mode-Live-Stand bringen, `pipeline-state.md` "Excel-SSOT layer"-Sektion um den Pipeline-Konsumtions-Pfad ergänzen, `open-questions.md` ggf. neue OQ aufmachen (z. B. wenn der Walk-through eine Validator-Frage offenlässt). Plus **separat** der heute-noch-ausstehende Hygiene-Pass (057-Apply-State in den Brain-Pages eintragen). Beides ist Cowork-Folgearbeit, kein 058-Acceptance-Bullet.

- **Design-Freedom-Block fehlt absichtlich.** Brief 058 berührt kein UI — `/ingest`-Dashboard rendert das committed Diff so wie es heute auch 055er/056er Diffs rendert. Code-Pfad-Topologie, CLI-Flag-Form, Adapter-Code-Form, Validator-Skip-Mechanik sind Architektur-/Implementierungs-Entscheidungen.
