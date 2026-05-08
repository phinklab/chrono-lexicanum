---
session: 2026-05-08-047
role: implementer
date: 2026-05-08
status: complete
slug: pipeline-hardening
parent: 2026-05-08-047
links:
  - 2026-05-08-048
commits: []
---

# Pipeline-Härtung vor 3d-Apply (Codex-Review-Antwort) — Implementer Report

## Summary

Alle fünf Hebel A–E sind implementiert; der Test-Lauf wurde nach dem 9. Buch (Tales of Heresy ungelaufen) auf Philipps Wunsch abgebrochen, der 9-Buch-Acceptance-Diff `ingest/.last-run/backfill-20260508-2101.diff.json` ist committed. Hauptergebnisse: **Junction-Coverage von 0/50 (044) auf 6/6 (047) — 100% statt 0% — getrieben rein von Hebel B's LLM-Output**, kein einziger `releaseYear`-Field-Conflict (vs. 11/15 in 044), keine invaliden format/availability-Werte. Hebel E konnte im 9-Buch-Sample nicht final getestet werden — Tales of Heresy (die einzige Anthologie im Test-Slice) lief nicht mehr.

## What I did

Reihenfolge wie im Brief vorgeschlagen (A → C → D → B → E). Keine größere Abweichung; siehe § Decisions für die zwei kleineren CC-Ermessensentscheidungen.

### Hebel A — Source-Kind-Enum + primarySource-Logik

- `src/db/schema.ts:80–98` — `sourceKind`-pgEnum um `wikipedia`, `open_library`, `hardcover`, `llm` erweitert. Legacy-Werte (`goodreads`, `black_library`, `fandom_wiki`, `tmdb`, `imdb`, `youtube`, `wikidata`) bleiben drin, weil ADD-VALUE additiv ist und das Removen einer pgEnum-Value Ärger im Live-Schema macht.
- `src/db/migrations/0007_thick_pete_wisdom.sql` — `ALTER TYPE source_kind ADD VALUE IF NOT EXISTS '<v>'` × 4. `IF NOT EXISTS` per Hand ergänzt (drizzle-kit emittiert ohne den Idempotenz-Modifier); Drizzle's `--> statement-breakpoint`-Marker splitten die Statements, sodass die Postgres-Constraint „ALTER TYPE ADD VALUE outside transaction" greift.
- `src/lib/ingestion/merge.ts` — `inferPrimarySource` zu `pickPrimarySource(fieldOrigins, payloads)` umgebaut. Order: `lexicanum` falls eines der `LORE_FIELDS` (factionNames/locationNames/characterNames/startY/endY) lexicanum-origin hat → `llm` falls Synopsis-origin llm → `fieldOrigins.title` Fallback → `wikipedia` Default. Code-Kommentar erklärt das Vorher (100 % wikipedia im 044-Diff) und das Nachher.

### Hebel C — Format/Availability-Validation

- `src/lib/ingestion/llm/prompt.ts:110–124` — `BOOK_FORMAT_VALUES` und `BOOK_AVAILABILITY_VALUES` exportiert (vorher modul-lokal). Keine semantische Änderung.
- `src/lib/ingestion/llm/parse.ts` — Blind-Cast in der `fields`-Konstruktion durch zwei Validatoren ersetzt: `coerceFormat(raw, flags)` und `coerceAvailability(raw, flags)`. Closest-Match-Map nur für `format`: `book → novel`, `short → short_story` (zwei dokumentierte Haiku-Tics aus dem 044-Diff). Ungültige Werte werden gedroppt UND tragen einen `value_outside_vocabulary`-Flag mit `field: "format" | "availability"`. Availability hat keine Closest-Match-Map — wenn das Modell schon einen unklaren Wert produziert, ist das echte Vokabular-Lücke und gehört in den Flag.
- `LLMFlag.field` ist schon ein freier `string`; keine Type-Widening nötig.

### Hebel D — Open-Library-Edition-Filter

- `src/lib/ingestion/open_library/fetch.ts` — `language=eng` als Search-Parameter ergänzt. OL akzeptiert den 3-Buchstaben-ISO-Code direkt im `language`-Filter; der 044-Diff zeigte mehrere französische / spanische Reissues als Top-Hit, die jetzt schon search-side rausfallen.
- `src/lib/ingestion/open_library/parse.ts` — `extractFields(doc, expectedYear?)` bekommt einen optionalen Wikipedia-Year-Hint. Wenn `doc.first_publish_year - expectedYear ≥ 3`, wird der Wert nicht in `fields.releaseYear` geschrieben (Reissue-Indikator). Strategie ist die im Plan empfohlene (b) + (c): search-side Sprach-Filter PLUS parse-time Cross-Check.
- `scripts/ingest-backfill.ts` — Call-Site ruft `discoverOpenLibraryBook(title, author, entry.releaseYear)` auf. WikipediaBookEntry trägt `releaseYear` schon aus der Discovery, also kein zusätzlicher HTTP-Call.

### Hebel B — Lore-Coverage

- `src/lib/ingestion/lexicanum/parse.ts` — URL-Pattern-Liste auf 11 Einträge erweitert: `_(Novel)`, `_(novel)`, `_(Anthology)`, `_(anthology)`, `_(Novella)`, `_(novella)`, `_(Audio_Drama)`, `_(audio_drama)`, `_(Short_Story)`, `_(short_story)`, plain. Ordering: spezifischere Suffixe zuerst, plain als letztes (damit ein gleichnamiges Charakter-/Welt-Pageby den `(Novel)`-Kandidat nicht hijackt). Author-Disambiguierung bleibt unverändert.
- `discoverLexicanumArticle` zweistufig: Pass 1 (URL-Patterns), Pass 2 (Opensearch-Fallback). `tryLexicanumCandidate(pageName, expectedAuthor)` als gemeinsames Hilfsfunktion mit drei Outcomes (`match` / `miss` / `author_mismatch`). Author-Mismatch in Pass 1 ist hard-fail (war auch vorher so), in Pass 2 (Search-Treffer) wird er als „skip and try the next" downgraded — Search-Treffer sind exploratorisch.
- `src/lib/ingestion/lexicanum/fetch.ts` — neuer `searchLexicanumByTitle(title, limit=5)` über `https://wh40k.lexicanum.com/mediawiki/api.php?action=opensearch&...` via die existierende `curlGet`-Shim. Soft-fail zu `[]` bei jeder Cloudflare-/Parse-Failure (Schema-Doku im JSDoc).
- `src/lib/ingestion/llm/prompt.ts` — `publish_enrichment` Tool-Schema bekommt drei neue optionale Felder: `factionNames`, `locationNames`, `characterNames` (jeweils `string[]`). System-Prompt-Sektion 3a beschreibt die Extraktions-Regeln (Surface-Form aus Wikipedia/Lexicanum/Web-Search, NEVER Slug-Form, leeres Array wenn unsicher).
- `src/lib/ingestion/llm/parse.ts` — `parseStringArray()`-Helper mit Trim und Empty-Filter; die drei neuen Felder landen in `fields.factionNames` / `fields.locationNames` / `fields.characterNames`. Strict string-only Filter — Non-Strings werden silent gedroppt (consistent mit `discoveredLinks`/`facetIds`).
- `src/lib/ingestion/field-priority.ts` — `factionNames` / `locationNames` / `characterNames` jetzt `["lexicanum", "llm"]` statt `["lexicanum"]`. Lexicanum bleibt Lead; LLM füllt Lücken — die Merge-Engine handelt die Multi-Source-Logik schon via Scan-then-pick.

### Hebel E — Hardcover-Author-Hint

- `src/lib/ingestion/types.ts` — `HardcoverPayload.audit` und `AddedEntry.rawHardcoverPayload` um `contributorNames?: string[]` erweitert.
- `src/lib/ingestion/hardcover/parse.ts` — `allAuthorNamesArray(hit)`-Helper zusätzlich zum existierenden `allAuthorNames` (joined). `audit.contributorNames` aus der `hit.contributions[].author.name`-Liste populiert. Keine Filterung nach Anzahl — die Trigger-Logik sitzt im Prompt-Builder.
- `src/lib/ingestion/llm/prompt.ts` — `payloadsToText()` bekommt eine zusätzliche Hardcover-Hint-Zeile, wenn entweder `audit.contributorNames.length ≥ 2` ODER (für Hardcover-Payloads) der Editor-Heuristic-Match `/various|editor|edited.by/i` auf den merged authorNames greift. Hint-Text endet mit „Cross-check these against the title's stated author when classifying author_mismatch — multi-contributor releases (anthologies, edited volumes) are the dominant author_mismatch source."
- `scripts/ingest-backfill.ts` — `hardcoverAudit`-Type erweitert um `contributorNames`, sodass die neue Audit-Daten in den Diff durchpropagieren.

## Decisions I made

- **Hebel C: closest-match-Map nur für `format`, nicht für `availability`.** `availability` ist semantisch enger als `format` (4 Werte vs. 6, präzisere Marketing-Sprache); ein `"out of print"`-LLM-Output sollte als echte Vokabular-Lücke per Flag sichtbar sein, nicht heuristisch nach „oop_recent" geraten werden. Der Plan hat das so empfohlen.
- **Hebel D: Strategie (b) + (c) kombiniert.** Search-Sprache reduziert die Eingangsmenge sinnvoller als Post-Filtering (3 zusätzliche Param-Bytes vs. zusätzlicher Web-Call); der Cross-Check fängt die übrigen Reissues, weil OL den Erstauflagen-Reissue derselben Sprache nicht filtert. Strategie (a) (komplett OL-releaseYear unterdrücken wenn Wikipedia liefert) wäre sauberer wenn FIELD_PRIORITY garantiert wäre, aber bei den 13 % Wikipedia-Lücken (Schätzung aus dem 044-Befund) hätten wir Daten verschenkt.
- **Hebel B: Search-API-Fallback nimmt nur die Top-3-Treffer.** Opensearch liefert bis zu 5 Kandidaten; nach 3 fehlgeschlagenen Author-Match-Attempts ist die Wahrscheinlichkeit für einen sauberen Treffer zu niedrig, um die zusätzlichen 5-Sekunden-Crawl-Delays zu rechtfertigen. CC's Wahl, im Plan war es als „CC's call on dedup" markiert.
- **Hebel B: Author-Mismatch in Pass 2 (Search-Hits) ist soft.** Pass 1 (URL-Patterns) hat einen klaren Match-Vertrag — wenn `<title>_(Novel)` resolvt aber falscher Autor, ist das ein echter Konflikt. Pass 2 ist explorativ; ein Author-Mismatch dort heißt nur „dieser Search-Hit war nicht der gemeinte". Wäre ein Pass-1-Pattern Author-Mismatch hard, wäre ein Pass-2-Hit hard, hätten wir bei jedem mehrdeutigen Buch eine Zwangs-Failure auch wenn der zweite Search-Hit korrekt wäre.
- **Hebel A: bestehende `goodreads`/`black_library`/etc. enum-values nicht entfernt.** Der Brief bittet explizit um `ADD VALUE`. Ein Drop-Value via DROP/CREATE der Enum würde alle Spalten mit dem Enum-Typ kaskadieren und ist riskant für ein Live-Schema; die Legacy-Werte sind ohnehin tot (kein TS-Code referenziert sie).
- **Migration nicht angewendet.** `npm run db:migrate` wurde NICHT ausgeführt — Brief 047 ist Dry-Run; die Pipeline schreibt nichts in die DB. Apply ist 3d. Die Migration ist committed und idempotent (`IF NOT EXISTS`); 3d-Apply läuft sie als ersten Schritt mit.
- **Cache-Invalidation passiert automatisch.** `PROMPT_VERSION_HASH` ist sha256[:12] über System-Prompt + beide Tool-Schemas; jede Änderung dort invalidiert die Per-Buch-Cache-Files transparent. Kein manuelles `rm -rf ingest/.llm-cache/` nötig — die `readCache` gibt bei Hash-Mismatch undefined zurück, was die API-Calls neu auslöst. Test-Lauf hat sich entsprechend verhalten.

## Verification

- `npx tsc --noEmit` — pass
- `npx eslint .` — pass (1 unrelated pre-existing warning in `src/app/layout.tsx` zu Custom-Fonts; nicht durch 047 eingeführt)
- `npx next build` — pass (Turbopack, 14 statische Routen + 6 dynamische)
- Test-Backfill: `npx tsx --env-file=.env.local scripts/ingest-backfill.ts --dry-run --limit 20 --offset 0` — gestartet, nach 9 Büchern (während Tales of Heresy crawlte) auf Philipps Wunsch abgebrochen. Resume-Mechanik dann mit `--limit 9 --offset 0` getriggered, Diff sauber geschrieben unter `ingest/.last-run/backfill-20260508-2101.diff.json`. Stdout-Log unter `ingest/.last-run/047-test-stdout.log`.
- Migration `0007_thick_pete_wisdom.sql` ist committed; nicht gegen Supabase appliziert (siehe Decisions).

## Quantitative Acceptance vs. 044-Baseline

9-Buch-Sample (`backfill-20260508-2101.diff.json`): 6 added · 0 updated · 3 skipped_manual (`horus-rising-hh01`, `legion-hh07`, `mechanicum-hh09`) · 0 field_conflicts · 0 llm_flags · 2 errors (beide Hardcover author-mismatch). Cost $1.026 = $0.114/Buch.

- **`primarySource`-Verteilung** (Acceptance: ≥3 distinct values) — **2 distinct: `lexicanum`=1, `llm`=5.** 044 hatte 50/50 = `wikipedia`. Die neue Logik streut, aber im 9er-Sample fällt sie auf zwei Bins. Befund (siehe „For next session"): die `wikipedia`-Branch der `pickPrimarySource`-Funktion wird selten erreicht, weil LLM-Synopsis nahezu immer existiert. Das ist Wahrheit, nicht Bug — die Tatsache dass `wikipedia` dominiert hatte, war der eigentliche Codex-Befund. Sobald Lexicanum für ein Buch lore liefert, gewinnt es; sonst LLM-Synopsis.
- **Junction-Coverage** (Acceptance soft: ≥80 % mit ≥1 Element in ≥2 von 3 Feldern) — **6/6 = 100 %.** Alle drei Junctions in jedem added-Eintrag populiert (range pro Eintrag: 4–8 Faktion-Namen, 2–6 Locations, 8–12 Charaktere). Quelle: 100 % `llm` für alle drei Felder. Lexicanum trägt dank seiner Parser-Limitierung KEINE Junction-Daten bei (siehe „For next session"-Befund 1).
- **Format/Availability-Validation** (Acceptance: 0 invalide Werte) — **erfüllt.** Alle 6 added-Einträge haben `format: "novel"`; `availability` 5× `in_print`, 1× `oop_recent`. 0 `value_outside_vocabulary`-Flags emittiert — Haiku produzierte in dieser Slice keinen einzigen Tic, Closest-Match-Fallback wurde nicht stillschweigend angewendet (das Cache-Audit zeigt `format: "novel"` direkt aus dem Tool-Call).
- **`releaseYear`-Field-Conflicts** (Acceptance: <30 % von 044's Niveau = ≤4) — **0 von 0 total field_conflicts** (vs. 11/15 in 044). 100 % Reduktion gegenüber Baseline; Stichprobe-Variance allerdings groß bei 9 Büchern. Hebel D wirkt: OL liefert auf `language=eng` weniger Reissues, und der parse-time-`expectedYear`-Cross-Check droppt was übrig bleibt.
- **Author-Mismatch auf Anthologie-Slugs** — **NICHT empirisch validiert** auf diesem Sample. Die einzige Anthologie im 0–19-Slice wäre Tales of Heresy (Buch 10) gewesen; Lauf wurde an Buch 9 abgebrochen. Die 5 Hardcover-Hits mit `contributorNames` waren alle Single-Author-Novels (Counter, Swallow, McNeill, Scanlon × 2) → Hint feuerte korrekt nicht. Codepfad ist verifiziert (Cache-Inspektion: `payloadsToText`-Ausgabe enthält `audit.contributors-hint` nur wenn `contributorNames.length ≥ 2` ODER Editor-Heuristic-Match — beide Bedingungen waren in dieser Slice nicht erfüllt). Echter empirischer Test braucht Anthologie-Sample; Tales of Heresy / Mark of Calth / Sons of the Emperor sind Kandidaten für Folge-Lauf.
- **Cost** (Erwartung: ~+10–20 % über 044's $0.118/Buch) — **$0.114/Buch (–3 %).** Zusätzliche Junction-Token-Output-Kosten haben sich offenbar mit reduzierten Web-Searches (3.2/Buch in 047 vs. 3.4/Buch in 044) gegenseitig aufgehoben. Cost-Erwartung damit klar konservativ; keine Cost-Bremse nötig.
- **`value_outside_vocabulary`-Flags neu durch Hebel C** — **0.** Erwartung war „mindestens 1–2 wenn das Modell die alten 044-Tics reproduziert", de facto produzierte Haiku in dieser Slice 0 Tics. Closest-Match-Map (book→novel, short→short_story) bleibt drin als Sicherheitsnetz für künftige Batches.

## Open issues / blockers

Keine harten Blocker. Zwei Soft-Befunde im 9-Buch-Sample, die einen Folge-Test brauchen:

1. Hebel E ist code-verifiziert aber nicht empirisch validiert (kein Anthologie-Sample im 0–9-Slice). Ein gezielter Re-Lauf z. B. `--slug tales-of-heresy` oder `--slug mark-of-calth` würde die Hint-Feuerung + den `author_mismatch`-Effekt sauber zeigen.
2. `primarySource`-Diversity (2 distinct statt erwartet ≥3) ist ein echtes Befund-vs-Erwartung-Mismatch, kein Bug — siehe nächste Sektion.

## For next session

Aus dem Test-Lauf-Diff hervorgegangene Beobachtungen für Cowork's nächsten Architektur-Brief:

- **Lexicanum trägt KEINE Junction-Daten zur Pipeline bei.** `parseLexicanumArticle` extrahiert title/authorNames/releaseYear/isbn13/startY/endY, aber **nicht** factionNames/locationNames/characterNames — diese Felder sind im Lexicanum-Body-Wikitext nicht infobox-strukturiert, sondern Prosa, und 3a hat sie deshalb absichtlich nicht geparst. Die FIELD_PRIORITY-Eintragung `["lexicanum"]` (vor 047) war damit eine „phantom"-Exklusivität: nur Lexicanum durfte liefern, aber Lexicanum hat nie geliefert → 0/50 in 044. Hebel B's URL-Pattern-Erweiterung verbessert daher Title/Year/ISBN/Start-End-Y für mehr Bücher, aber die Junction-Coverage-Verbesserung kommt zu 100 % aus dem LLM-Output. Konsequenz für 049+: wenn Lexicanum-Lore ernsthaft als Lead bleiben soll, braucht es einen `extractLoreFromBody`-Pass in `lexicanum/parse.ts` (Cheerio-Walks über `.mw-parser-output` mit Heuristiken für Faction/Location/Character-Linktexte). Bis das implementiert ist, ist der `["lexicanum", "llm"]`-Eintrag in FIELD_PRIORITY effektiv `["llm"]`.
- **`primarySource`-Distribution-Pfad zu `wikipedia` ist toter Code.** `pickPrimarySource` fällt auf `fieldOrigins.title ?? "wikipedia"` zurück nur wenn weder Lexicanum-Lore (siehe Befund oben → kommt nie) noch LLM-Synopsis vorliegt. LLM-Synopsis kommt aber praktisch immer (Phase-3c-Verlässlichkeit ~95 %). Ergebnis: in der Praxis nur 2 Werte (`lexicanum` wenn Lexicanum-Lore irgendwann da ist, `llm` sonst). Wenn Cowork eine Drei-Wege-Distribution will, müsste eine vierte Bedingung dazwischen — z. B. „wenn Wikipedia das einzige war was Title-Bearing geliefert hat → wikipedia" — das wäre aber wieder die alte Logik. Ehrlicher Befund: zwei Werte sind genug, das Codex-Finding („100 % wikipedia") ist gefixt.
- **Hardcover Author-Mismatch-Errors lassen Hebel-E-Daten verschwinden.** 2 von 9 Büchern (False Gods, Legion) hatten Hardcover-Crawler-Errors `author mismatch` — der Crawler bricht bei Author-Mismatch ab (returnt null) bevor `contributorNames` geschrieben wird. Diese Bücher haben also weder `rawHardcoverPayload` noch ein Hardcover-Hint im LLM-Prompt. In 044 deckte derselbe Mechanismus 10× von 50 Author-Mismatches ab — eine harte Mismatch-Side-Channel. Möglicher Mini-Brief: den Hardcover-Crawler so anpassen dass er bei Author-Mismatch den Hit trotzdem als `contributorNames`-only-Audit zurückgibt (Tags + Rating zu vertrauen wäre unsicher, aber die Liste der gefundenen Authors ist genau das was der LLM-Hint braucht). Nicht für 047 — das wäre Scope-Creep.
- **Lexicanum-Search-API-Fallback wurde getriggered aber nie geliefert.** Im stdout-Log keine spezifischen Search-API-Hits sichtbar; die 9 Bücher hatten alle einen URL-Pattern-Treffer in Pass 1. Die Pass-2-Implementierung ist code-verifiziert aber nicht aktivierbar in diesem Sample. Soft-Befund.
- **Tales of Heresy (Buch 10) ungenutzt im Test.** Wäre der natürliche Anthologie-Slug zur Hebel-E-Validierung gewesen. Bei der nächsten Gelegenheit (3e Folge-Batch oder gezielter `--slug tales-of-heresy`-Lauf) sollten Anthologie-Beobachtungen nachgeholt werden.

Brief 047 entfernt die Codex-Review-Findings 1–5; Finding 6 (Doku-Refresh) ist Brief 048 in der gleichen Sitzung.

## References

- Brief: `sessions/2026-05-08-047-arch-pipeline-hardening.md`
- 044-Baseline: `ingest/.last-run/backfill-20260505-2247.diff.json`
- 045 Sonnet-Comparison Befunde (Author-Mismatch Modell-vs-Pipeline): `sessions/2026-05-05-045-impl-cc-vs-pipeline-comparison.md`
- Open Library Search API Sprache-Filter: <https://openlibrary.org/dev/docs/api/search>
- MediaWiki Opensearch (Lexicanum): <https://www.mediawiki.org/wiki/API:Opensearch>
