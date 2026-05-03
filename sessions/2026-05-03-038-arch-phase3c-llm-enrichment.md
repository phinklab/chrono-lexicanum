---
session: 2026-05-03-038
role: architect
date: 2026-05-03
status: open
slug: phase3c-llm-enrichment
parent: 2026-05-03-037
links:
  - 2026-05-02-031
  - 2026-05-02-032
  - 2026-05-02-034
  - 2026-05-03-035
  - 2026-05-03-036
  - 2026-05-03-037
commits: []
---

# Phase 3 Stufe 3c — LLM-Anreicherungs-Schicht (Sonnet 4.6 + Web-Search), 20-Buch-Test-Gate, Dry-Run

## Goal

Den dritten Brick der Phase-3-Pipeline bauen: eine LLM-Anreicherungs-Schicht, die nach dem Multi-Source-Merge aus 3a/3b läuft und fünf Jobs erledigt — paraphrasierte Synopsen, Soft-Facet-Klassifikation auf unser kanonisches Vokabular, definitive Format/Availability-Klassifikation, Plausibility-Cross-Check über die multi-source Daten, **plus Reader-Rating-Capture** (eine Quelle pro Buch via Source-Priority-List, normalisiert auf 0–5-Skala). **Web-Search ist verpflichtend pro Buch**, nicht Fallback: jeder Buch-Run schließt mind. eine Availability-Check-Suche (Black Library + Amazon + Audible-Listings) plus Synopsen-Kontext-Suche ein, plus opportunistische Lücken-Füllung wenn der LLM Daten als unklar/widersprüchlich erkennt. Storefront-URLs aus der Suche landen als `discoveredLinks` im Diff (für 3d-FK-Resolution gegen `services`); Reader-Ratings landen als echte DB-Spalten via Schema-Migration 0006. **Keine DB-Schreib-Operationen.** Implementation + ein einziger Test-Lauf mit `--limit 20`. CC stoppt dann hart und gibt Philipp die Diff zur Sichtprüfung; Philipp entscheidet danach „weiter zu 3d" oder „Cost zu hoch → Mini-Brief: Web-Search optional + ggf. Modell-Switch zu Haiku". Voll-Lauf über 800 Bücher ist 3e, nicht jetzt.

3c ist Stufe 3/6 der Phase-3-Roadmap (3a Skeleton ✅ → 3b Aux-Sources ✅ → **3c LLM-Anreicherung** → 3d Apply-Step → 3e Backfill-Day → 3f Maintenance-Crawler).

## Context

- **Was 037 geliefert hat.** Engine läuft Ende-zu-Ende mit 4 Quellen. Discovery: 701 unique Bücher aus 4 Wikipedia-Pages (Hauptliste + HH-novels + Siege_of_Terra + Eisenhorn). Per-Buch-Crawler: Lexicanum (via curl shell-out, Cloudflare-bypass), Open Library (native fetch), Hardcover (GraphQL, `_eq` only — Server blockt `_ilike`). Manual-Protection-Comparator schützt 26 Hand-Curated Books via title-normalize-Match. Diff-JSON in `ingest/.last-run/backfill-20260503-1328.diff.json`: 7 added (6 mit Hardcover-Tags), 3 skipped_manual, 1 field_conflict, 4 echte semantische Errors (Anthologien + Title-Match-Fails). Architektur-Befund: Engine hat zwei zusätzliche Quellen ohne Refactor aufgenommen — These aus 3a hält.
- **Was 3c im Plan macht.** Vier Jobs in **einem** Prompt-Run pro Buch (Philipp-Entscheid), jeder Run macht **immer** mind. zwei Web-Searches:
  1. **Synopse paraphrasieren** (100–150 Wörter, lizenzsicher in eigener Sprache). Input-Quellen: Wikipedia-Article-Plot-Sektion + Lexicanum-Article-Story-Sektion (für das individuelle Buch, nicht aus den Listen-Pages die 3a/3b schon kennen) **plus** mind. eine Web-Search nach Synopsen-Kontext (Goodreads-Reviews, BL-Marketing-Copy, Reddit-Diskussionen). Die Web-Search liefert Reichweite/Charakter-Detail, das die strukturierten Quellen oft nicht haben — Wikipedia ist plot-trocken, Lexicanum ist lore-fokussiert, eine 1-Sentence-BL-Tagline trifft den emotionalen Kern in einem Satz. Open Library hat keine brauchbaren Synopsen → wird nicht gefüttert.
  2. **Soft-Facets klassifizieren** auf das in der DB existierende kanonische Vokabular: `tone`, `theme`, `pov_side`, `protagonist_class`, `entry_point`, `length_tier`, `plot_type`, `scope`, `content_warning`, `protagonist_gender`. LLM bekommt das Vokabular zur Runtime aus der DB (`facet_categories` + `facet_values`), klassifiziert auf Werte daraus, **erfindet nichts**. Multi-Value- vs Single-Value-Verhalten kommt aus `facet_categories.multiValue`. Der Web-Search-Output (Reviews etc.) ist auch hier Input-Quelle für „grimdark vs heroic"-Stimmungs-Calls.
  3. **Format + Availability bestimmen** (auf die Enums aus 3b: `bookFormat` + `bookAvailability`). Format-Hint aus Open-Library + Hardcover-Tags + Title-Pattern (z.B. „: An Audio Drama") + LLM-Reasoning. Availability **verpflichtend via Web-Search** auf Black Library Shop + Amazon + Audible. Aus dieser Such-Runde fallen die Storefront-URLs als Side-Effect ab — landen in `discoveredLinks` der Diff (siehe Job 5).
  4. **Plausibility-Cross-Check** über die multi-source Daten + Web-Such-Validierung. Beispiele: „Lexicanum sagt False Gods spielt M40, aber es ist HH-Buch 2 → widersprüchlich"; „Wikipedia sagt 14 Primarchs-Bände, aber es sind real 18 → flag"; „Author 'Dan Abnett' steht für 'Tales of Heresy', aber das ist eine Multi-Author-Anthologie → flag". Wenn der Cross-Check ein konkretes Faktum klären könnte (z.B. „totalPlanned der Series — wie viele sind real publiziert?"), nutzt der LLM die Web-Search opportunistisch. Output: `llm_flags`-Top-Level-Audit-Slot der Diff-JSON, **kein Auto-Apply, keine Modifikation der Merge-Outputs**.
  5. **Storefront-Link-Capture (kein eigener Job, sondern Side-Effect der Availability-Suche).** Der LLM extrahiert die kanonischen URLs aus der Availability-Such-Runde (Black-Library-Produkt-Page, Amazon-Listing, Audible-Listing, ggf. Apple Books / Kindle / Warhammer+), publiziert sie als `discoveredLinks: Array<{ serviceHint: string; kind: 'shop' | 'audio' | 'reference'; url: string }>` im Audit-Slot der LLMPayload. Service-IDs (`black_library`, `amazon`, `audible`, `kindle`, `apple_books`, `warhammer_plus`) sind in `scripts/seed-data/services.json` schon vorhanden — der `serviceHint`-String muss matchen damit 3d sauber FK-resolven kann. URLs nicht in den Merge fold-en (nicht in FIELD_PRIORITY); sie sind purer Audit/Apply-Input für 3d.
  6. **Reader-Rating-Capture (eigener Job mit Schema-Eingriff).** Eine Rating-Quelle pro Buch, gewählt nach Source-Priority-List, normalisiert auf 0–5-Skala. Source-Priority: `amazon → goodreads → hardcover → audible`. LLM versucht erste Quelle, wenn dort ein Score sichtbar ist (im Listing oder via Web-Search) nimmt er den, sonst nächste. Hardcover-Rating steht aus 3b schon als `rawHardcoverPayload.averageRating` zur Verfügung — der LLM nutzt diesen Wert wenn weder Amazon noch Goodreads ein Rating liefern, ohne neue API-Call. **Normalisierung:** wenn die Quelle eine andere Skala hat als 0–5 (z.B. theoretisch 0–4), rechnet der LLM `(value / sourceMax) * 5` und publishes auf 0–5. Heute sind alle vier Listed-Sources 0–5, aber die Normalisierungs-Konvention steht für zukünftige Quellen. Felder gehen ins Schema (siehe Migration 0006 unter Acceptance): `rating` (numeric(3,2)), `rating_source` (varchar(32)), `rating_count` (integer, optional). Wenn der LLM nirgendwo ein Rating findet (sehr alte / sehr Niche-Releases): alle drei Felder bleiben null.
- **Modell-Wahl + Cost.** **Anthropic Sonnet 4.6** für alle 4 Jobs. Cost-Schätzung für 20-Buch-Test mit verpflichtender Web-Search: **~$1.50–4.00** (jedes Buch: ~6–8K Input inkl. Plot-Context + Vokabular, ~1.5K Output, **3–6 Web-Search-Tool-Calls** — 1 mandatory für Synopse-Kontext + 1 mandatory für Availability/Storefront-Links + 1–4 opportunistisch für Lücken/Cross-Check). Voll-Lauf 800 Bücher (3e): **~$60–160** statt der ursprünglichen $20–60. Wenn das nach 20-Buch-Test zu teuer ist, gibt's einen Mini-Brief „Web-Search optional + ggf. Haiku-Switch" — der erlaubt Web-Search nur als Fallback wenn strukturierte Quellen leer sind, und drückt die Cost zurück auf ~$0.50/20 / ~$20/800. Test-Gate-Mechanik: nach dem 20-Buch-Lauf stoppt CC; Philipp inspiziert die Diff (Synopsen-Qualität, Facet-Klassifikation, Plausibility-Flags, **real gemessene Cost + Tool-Call-Zahlen pro Buch**); entscheidet „weiter mit Sonnet+mandatory" → 3e, oder „Cost zu hoch → Mini-Brief: Web-Search optional + ggf. Haiku".
- **API-Key-Beschaffung ist Philipps Job.** `ANTHROPIC_API_KEY` in `.env.local`, **niemals committen**. Wenn der Key fehlt, soft-fail wie Hardcover-Pattern aus 3b: ein WARN beim Start, dann läuft der Crawler ohne LLM-Anreicherungs-Schritt durch (Diff zeigt Per-Book-Sources wie 3b, ohne LLM-Felder).
- **`SourceName: "llm"` ist im Pipeline-Type schon vorgesehen** (3a, types.ts:25). FIELD_PRIORITY-Map (3b, field-priority.ts) listet `llm` als primäre Quelle für `format` + `availability` und als Fallback für `synopsis` + Soft-Facets implizit über das LLM-Modul. Was 3c macht: liefert tatsächliche Werte für diese Felder.
- **Plot-Section-Fetching ist neue Arbeit.** Die existierenden Wikipedia-/Lexicanum-Crawler ziehen ihre Daten aus den Listen-Pages bzw. aus den Article-Bodies aber **ohne Plot/Story-Sektions-Extraktion**. CC erweitert entweder die existierenden Crawler oder baut einen LLM-Modul-internen `fetchPlotContext(book)` — letzteres ist sauberer (LLM-Job kennt seine eigene Input-Form), aber CCs Call.
- **`work_facets`-Junctions sind Apply-Job (3d), nicht 3c.** 3c liefert Facet-Klassifikationen als raw `facetIds: string[]` pro Buch in der LLM-Payload. FK-Resolution + Junction-Insert kommt 3d.
- **Carry-over aus 037 fließt rein.** `series.totalPlanned`-übrige-Werte (das hh_more Primarchs-Beispiel ist hier konkret) wird Plausibility-Check-Job. Hardcover-Tags landen als Input für Soft-Facet-Klassifikation (LLM mappt `["grimdark", "military-sci-fi"]` auf unsere `tone=["grimdark"]`/`theme=["military"]` Vokabel-Werte — also nicht 1:1, sondern semantisch).

## Constraints

- **Keine DB-Schreib-Operationen.** Dry-Run only. Comparator darf DB lesen (auch facet_categories/facet_values als kanonisches Vokabular für den Prompt), schreibt nichts.
- **Keine `ALTER TYPE source_kind` für `llm`.** Das DB-Enum bekommt `llm` erst in 3d, weil dort tatsächlich `works.sourceKind` geschrieben wird. In 3c ist `llm` ausschließlich ein Pipeline-Type-Wert.
- **Eine Schema-Migration: 0006 für Rating-Felder.** Drei nullable Spalten auf `book_details` (`rating`, `rating_source`, `rating_count`). Sonst keine Schema-Änderungen, keine neuen Enums (rating_source ist `varchar(32)` damit zukünftige Quellen Zeilen-Edit statt ALTER TYPE sind). Wenn CC während der Implementation feststellt dass noch was Anderes zwingend Schema-Erweiterung bräuchte: im Report dokumentieren statt umzubauen.
- **`ANTHROPIC_API_KEY` aus `.env.local`.** Niemals committen, niemals im Code hardcoden, niemals in Test-Diffs landen lassen. Das Key-File aus dem Repo halten ist `.gitignore`-Sache (steht schon).
- **Wenn API-Key fehlt: soft-fail.** Pattern aus 3b Hardcover-Crawler: einmal initial WARN, dann alle LLM-Anreicherungs-Aufrufe als `errors: [{ source: "llm", reason: "missing api key" }]` markieren — kein Crash, kein leerer Diff, kein doppelter Re-Run.
- **Strict-Vocabulary für Facets.** LLM darf **nur** Facet-IDs aus dem zur Runtime geladenen Vokabular benutzen. Output-Validierung: jeder zurückgegebene Facet-ID muss in `facet_values.id` existieren. IDs außerhalb des Vokabulars → `llm_flags`-Eintrag „proposed_new_facet" (Audit-Information, kein Crash, keine Auto-Erweiterung des Vokabulars).
- **Synopsen müssen paraphrasiert sein, kein Copy.** Lizenzsicher: keine direkten Sätze aus Wikipedia/Lexicanum/Black-Library-Marketing. Prompt fordert das explizit ein („In your own words, do not quote source material directly. 100–150 words."). Im Test-Lauf wird Philipp das stichprobenartig gegen die Quellen prüfen.
- **20-Buch-Test-Gate ist Hard-Acceptance.** CC läuft `npm run ingest:backfill -- --dry-run --limit 20` **einmal** mit aktivem LLM-Step, schreibt den Diff, committed Code + Diff, **stoppt**. Kein iteratives Anpassen-und-Re-Lauf-mit-mehr-Büchern. Wenn der erste 20er-Lauf strukturelle Probleme zeigt (Prompt produziert Junk, Tool-Call-Schema bricht): Report mit Befund + zweiter 20er-Lauf nach Anpassung ist fine. Aber nicht 50, nicht 100, nicht 800 — Philipp ist die Quality-Gate.
- **Cache-LLM-Antworten lokal.** `ingest/.llm-cache/<slug>.json` mit Cache-Key über (`slug` + `prompt-version-hash` + `merged-payload-hash`). Verhindert dass ein Re-Run bei einem CLI-Crash 20× neu bezahlt. Cache-Hit nutzt die gespeicherte Antwort 1:1, Cache-Miss ruft die API. `ingest/.llm-cache/` ist gitignored (sensible Daten + groß), aber das Cache-Verzeichnis-Schema selbst dokumentiert. Re-Run nach Prompt-Änderung: Hash ändert sich → automatisch neu.
- **Strukturierter Output via Tool-Use.** Anthropic-API hat `tool_use` für strikte JSON-Schemas. Das LLM ruft ein Tool `publish_enrichment` mit definiertem JSON-Schema (siehe „Notes" weiter unten). Keine Free-Form-JSON-Antworten, kein Regex-Parsing. Bei Schema-Violation: einmal Retry mit „please call publish_enrichment with valid arguments", dann error.
- **Web-Search via eingebautem Anthropic-Tool, MANDATORY pro Buch.** Die Anthropic-API kennt das `web_search`-Server-Tool — wir nutzen das, kein external Search-API (kein Brave-Key, kein SerpAPI). Tool ist enabled im API-Aufruf, und der LLM **muss** pro Buch mind. zwei Searches machen: (a) Synopsen-Kontext (z.B. „<title> by <author> Warhammer 40k novel synopsis review") und (b) Availability-Check inkl. Storefront-URL-Extraktion (z.B. „<title> blacklibrary.com" + „<title> amazon" + „<title> audible"). Wie CC die Verpflichtung enforced — System-Prompt-Instruktion mit „You MUST call web_search at least twice before publishing", oder Tool-Call-Chain-Pattern, oder Validierungs-Pass mit One-Shot-Retry — ist Implementations-Frage. Empfehlung: System-Prompt-Instruktion plus eine Schwacher Validierung im `parse.ts` (wenn die LLM-Trajektorie keine zwei `web_search`-Tool-Uses zeigt, ein Audit-Flag „insufficient_web_search" setzen, aber die Antwort trotzdem akzeptieren — wir sehen das im Diff für die Test-Gate-Entscheidung).
- **Storefront-URL-Capture im LLM-Tool-Schema.** Der `publish_enrichment`-Tool-Call hat ein Pflicht-Feld `discoveredLinks: Array<{ serviceHint, kind, url }>`. Wenn der Availability-Web-Search keine BL/Amazon/Audible-URLs auswirft (passiert bei sehr alten OOP-Büchern), ist das Array leer + ein `llm_flag` `kind: "no_storefronts_found"` wird gesetzt. `serviceHint`-String matcht die `services.json`-IDs — `black_library`, `amazon`, `audible`, `kindle`, `apple_books`, `warhammer_plus` sind die erwarteten Werte. Andere Service-Hints landen unverändert im Diff und werden in 3d entweder gegen neue services-Einträge resolved oder als „unknown" geflaggt.
- **Token-Budgets.** Max Input-Tokens pro Call: ~12K (System-Prompt + Facet-Vokabular + multi-source-Payload + Plot-Kontext-Text + Web-Search-Result-Pages die das `web_search`-Tool zurückspeist). Max Output: ~2K (Synopsis 100–150w + Facet-Klassifikationen + Format/Availability + DiscoveredLinks + Plausibility-Flags). Wenn Plot-Kontext (Wikipedia-Article + Lexicanum-Article) zusammen >6K Tokens hat: trimmen auf ~4K (Plot-Sektion-Anfang + Hauptteil) — Web-Search-Result-Tokens dazu sind variabel und Anthropic-side-budgeted. Ziel: deterministisch unter Sonnet-Tier-Limits, mit Headroom für 3–6 Web-Search-Tool-Round-Trips.
- **Rate-Limits + Retries.** Anthropic Sonnet 4.6 hat Tier-basierte Limits. Für 20-Buch-Test ist nichts relevant. Pro Call: max 3 Retries auf 429 / 5xx mit exponential backoff (1s/2s/4s). Tool-Call-Errors innerhalb des Calls: einmal Retry mit Korrektur-Hint, dann als `errors`-Eintrag in den Diff.
- **Prompt-Version + Modell-Name in jedem Diff.** Top-Level-Diff-Felder `llmModel: "claude-sonnet-4-6"` und `llmPromptVersion: "<sha256[:12]>"`. Macht die Test-Gate-Entscheidung („Modell-Switch lohnt") nachvollziehbar.
- **Modell-Wahl ist konfigurierbar, aber Default Sonnet.** ENV-Var `INGEST_LLM_MODEL` mit Default `claude-sonnet-4-6`. Der Modell-Switch zu Haiku in einer späteren Mini-Session ist dann ein Ein-Zeilen-`.env.local`-Wechsel, nicht Code-Änderung.
- **Keine Versions-Pins, keine npm-Pakete-Pins.** CC pinnt selbst was nötig ist (`@anthropic-ai/sdk` aktuell, andere Deps falls nötig).

## Out of scope

- **DB-Apply (Diff → DB-Writes).** Phase 3d. Inklusive `ALTER TYPE source_kind ADD VALUE 'llm'`, `work_persons`-FK-Resolution mit Auto-Create, `work_facets`-Junction-Insert aus den 3c-LLM-Klassifikationen, UNIQUE INDEX auf `external_links`, `junctionsLocked: true`-Flag.
- **Backfill-Day** (40-/100er-/800er-Läufe, Auto-PRs). Phase 3e. Kein Skript für Batch-PR-Generierung in 3c.
- **Resume-Test mit Ctrl-C** beim großen Lauf. Phase 3e (carry-over aus 035).
- **Maintenance-Crawler in GH Actions.** Phase 3f.
- **Prompt-Iterations-Tooling** (Eval-Harness, Golden-Dataset, A/B-Vergleich). Wenn 3c's 20-Buch-Test zeigt dass der Prompt iteriert werden muss: ein zweiter Mini-Brief mit gezielten Anpassungen. Heute kein Eval-Framework.
- **Soft-Facet-Vokabular-Erweiterung.** Wenn der LLM in 3c im Test merkt „der ‚imperium-vs-chaos'-Konflikt ist nicht gut über `tone`/`theme` ausdrückbar" und einen neuen Facet-Wert vorschlägt: das landet als `proposed_new_facet`-Audit-Eintrag im `llm_flags`-Slot. Eigentliche Vokabular-Erweiterung ist eine Cowork-Diskussion + Migration, kein 3c-Auto-Job.
- **`work_persons`-FK-Resolution + Auto-Create-on-New-Person.** Carry-over für 3d.
- **`junctionsLocked: true`-Flag.** Carry-over für 3d.
- **`loadTimeline`-Trim auf `SELECT primaryEraId, COUNT(*) GROUP BY`.** Carry-over für 3d-Migration-Sammelung.
- **`curl` GH-Action-Container-Doku.** Carry-over für 3f.
- **`secondary_era_ids text[]` für Multi-Era-Sichtbarkeit.** Phase-4-Timeline-Reshape.
- **Redirect 307 vs. meta-refresh.** Bleibt liegen.
- **Lexicanum-`apiSearchFallback()` (zweiter Discovery-Pfad mit Cloudflare-Bypass-Tooling).** Distant.
- **Format/Availability-Heuristik aus Open-Library mit per-Edition + Sprach-Filter.** Distant — der ganze Sinn von 3c LLM ist diese Klassifikation belastbar zu machen.
- **`coverUrl`-Höher-Auflösung (>L=480px).** Phase-4-Detail-Pages-Frage.
- **Refactoring der Engine-Architektur** (`SourceCrawler`-Interface, FIELD_PRIORITY, SOURCE_CONFIDENCE, `processOne()`-Pattern, `AddedEntry.rawHardcoverPayload` zu `auditPayloads: Record<SourceName, unknown>`). Wenn 3c's LLM-Step-Integration zeigt dass die Architektur biegt, das im Report dokumentieren — Refactor-Entscheidung ist gemeinsam, nicht CC-Solo, und nicht in 3c.
- **Tags-zu-Facets-Mapping als deterministisches Code-Lookup.** Hardcover-Tags landen als **Input** für den LLM-Soft-Facet-Job (LLM mappt semantisch), nicht als deterministische Lookup-Tabelle. Wenn der LLM zeigt dass es ein paar 1:1-Mappings gibt die hartcodiert sein sollten („military-sci-fi" → `theme=military`): das ist ein Optimierungs-Pfad für 3.5 oder 3e, nicht 3c.
- **Multi-Source-Rating-Aggregation.** 3c nimmt bewusst nur **eine** Quelle pro Buch nach Source-Priority. Falls Phase 4 (Detail-Page) zeigt dass mehrere Ratings vergleichend angezeigt werden sollen (z.B. „Goodreads: 4.21 / Amazon: 4.5"), kommt das als separate Schema-Erweiterung — z.B. `rating_breakdown jsonb` als Audit-/Display-Slot. Heute YAGNI.

## Acceptance

The session is done when:

- [ ] **LLM-Modul** in `src/lib/ingestion/llm/`:
  - `enrich.ts` — Haupt-Entry-Point. `enrichBookWithLLM(merged: MergedBook, rawPayloads: SourcePayload[]): Promise<LLMPayload | null>`. Nutzt `@anthropic-ai/sdk` (current major), liest API-Key aus `process.env.ANTHROPIC_API_KEY`, soft-fails wenn missing.
  - `prompt.ts` — System-Prompt + User-Prompt-Builder. Lädt Facet-Vokabular zur Runtime aus DB (`facet_categories` + `facet_values`), trimmt Plot-Kontext auf Token-Budget, baut Tool-Use-Schema für strukturierten Output.
  - `parse.ts` — Validierung der Tool-Call-Antwort gegen das publishierte Schema; Mapping in `LLMPayload`.
  - `context.ts` — `fetchPlotContext(book)`: zieht Wikipedia-Article-Plot-Sektion (per `external_links`-URL aus dem MergedBook) + Lexicanum-Article-Story-Sektion. Wenn beide leer / unter Mindest-Wortzahl: kein Web-Search-Pre-Fetch hier — der Trigger zum Web-Search ist Aufgabe des LLM-Tool-Calls (LLM ruft `web_search` selbst wenn es Kontext fehlt).
  - `cache.ts` — File-System-Cache `ingest/.llm-cache/<slug>.json`, Key über (`slug` + `prompt-version-hash` + `merged-payload-hash`).
- [ ] **Schema-Migration 0006** für Rating-Felder:
  - `book_details.rating` `numeric(3,2)` nullable — Wert auf 0–5-Skala (z.B. `4.21`).
  - `book_details.rating_source` `varchar(32)` nullable — Service-ID-String (`amazon`, `goodreads`, `hardcover`, `audible`). Kein Enum, weil neue Quellen ohne ALTER TYPE hinzufügbar sein sollen.
  - `book_details.rating_count` `integer` nullable — Anzahl Reviews; null wenn LLM die Zahl im Listing nicht sicher extrahieren kann (Amazon zeigt's eindeutig, Audible sometimes weniger eindeutig).
  - `npm run db:generate` produziert `0006_*.sql`, committed mit Schema-Change. `npm run db:migrate` läuft idempotent (NOTICE on existing `__drizzle_migrations` ist normal), alle 26 Manuals + 7 Eras + 21 Series überleben mit den neuen Spalten als NULL.
- [ ] **Source-Priority-Konstante** für Ratings in `src/lib/ingestion/llm/rating.ts` (oder wo CC es natürlich findet):
  - `RATING_SOURCE_PRIORITY = ["amazon", "goodreads", "hardcover", "audible"] as const;`
  - Erweiterbar via Append (z.B. `apple_books` später wenn Coverage es rechtfertigt).
- [ ] **Type-Erweiterungen** in `src/lib/ingestion/types.ts`:
  - `LLMPayload extends SourcePayload` mit `source: "llm"`. `fields` füllt `synopsis`, `format`, `availability`, `rating`, `ratingSource`, `ratingCount` (wenn LLM klassifiziert). Plus neue Audit-Slot-Felder `audit?: { facetIds?: string[]; flags?: LLMFlag[]; discoveredLinks?: DiscoveredLink[]; tokenUsage?: { input: number; output: number; webSearchCount: number } }`.
  - `LLMFlag` als eigener Type: `{ kind: "data_conflict" | "value_outside_vocabulary" | "series_total_mismatch" | "author_mismatch" | "year_glitch" | "proposed_new_facet" | "insufficient_web_search" | "no_storefronts_found" | "no_rating_found"; field?: string; current?: unknown; suggestion?: unknown; sources?: string[]; reasoning?: string }`.
  - `DiscoveredLink` als eigener Type: `{ serviceHint: string; kind: "shop" | "audio" | "reference"; url: string }`.
  - `SourcePayloadFields` bekommt `facetIds?: string[]` (LLM-only-Feld), plus `rating?: number` (0–5), `ratingSource?: string` (matcht service-ID), `ratingCount?: number`. FIELD_PRIORITY-Einträge: `facetIds: ["llm"]`, `rating: ["llm"]`, `ratingSource: ["llm"]`, `ratingCount: ["llm"]` (hardcover liefert seinen eigenen averageRating in `rawHardcoverPayload.audit` aus 3b — der ist Input für den LLM, nicht direkt FIELD_PRIORITY-gemerged, weil er noch nicht source-gewählt + normalisiert ist).
  - `DiffFile` bekommt: `llmModel?: string`, `llmPromptVersion?: string`, `llm_flags?: LLMFlag[]` (Top-Level-Audit-Slot, nur wenn nicht-leer), `llmCostSummary?: { totalTokensIn: number; totalTokensOut: number; totalWebSearches: number; estUsdCost: number }` (Top-Level-Cost-Roll-Up für die Test-Gate-Entscheidung).
- [ ] **CLI-Erweiterung** in `scripts/ingest-backfill.ts`:
  - `VALID_PER_BOOK_SOURCES` bekommt `"llm"`. Default-Set ohne Token-Filter: wenn `ANTHROPIC_API_KEY` fehlt, `llm` still aus `activeSources` entfernt + ein einmaliger Error-Eintrag im Diff (Pattern aus 3b Hardcover).
  - LLM-Step läuft im `processOne()` **nach** dem multi-source-Merge. CC darf wählen wie er die LLM-Step-Integration konkret schneidet — kleinster sauberer Schnitt: nach `compareBook()` baut die Pipeline einen `MergedBook → enrichBookWithLLM → MergedBook` Second-Pass-Loop, der die LLM-Felder via FIELD_PRIORITY in den finalen Merge fold-ed.
  - `--source llm` einzeln aktivierbar (für nur-LLM-Re-Runs auf bestehenden Diffs); `--source lexicanum,open_library,hardcover` weiterhin valid.
- [ ] **Field-Priority-Map ergänzt** in `src/lib/ingestion/field-priority.ts`:
  - `synopsis: ["llm"]` — LLM ist die einzige Synopse-Quelle (3a/3b liefern keine).
  - `format: ["llm", "open_library"]` — schon aus 3b, jetzt mit echtem LLM-Wert.
  - `availability: ["llm", "open_library"]` — analog.
  - `facetIds: ["llm"]`.
  - Andere Felder unverändert.
- [ ] **Plausibility-Cross-Check liefert konkret:**
  - Lexicanum-`startY`/`endY` gegen Buch-Series-Position cross-checked (z.B. False Gods M40 vs HH-#2-erwartet-M30 → Flag).
  - `series.totalPlanned`-Werte gegen aktuellen Stand validiert (deckt das Carry-over aus 037 für `hh_more` Primarchs etc.).
  - Multi-Author-Anthologien identifiziert (Title-Pattern + LLM-Ground-Truth → Author-Mismatch-Errors aus 3b in `llm_flags` als „author_mismatch" zugeordnet).
  - Year-Conflicts wo Open-Library-`first_publish_year` von Wikipedia/Lexicanum abweicht (3b's `field_conflicts` werden in 3c reasoned: „OL=2014 ist Reissue der 2007-Original-Edition, deshalb Wikipedia korrekt").
- [ ] **Test-Lauf** nachweisbar:
  - `npm run ingest:backfill -- --dry-run --limit 20` läuft grün mit aktivem LLM-Step.
  - Diff committed unter `ingest/.last-run/backfill-<YYYYMMDD-HHMM>.diff.json` mit:
    - `llmModel = "claude-sonnet-4-6"` (oder welche Modell-String die SDK aktuell verlangt)
    - `llmPromptVersion = "<hash>"`
    - `llmCostSummary` mit `totalTokensIn`, `totalTokensOut`, `totalWebSearches`, `estUsdCost` — ist die Daten-Grundlage für Philipps „weiter oder Web-Search-optional"-Entscheidung.
    - **Mindestens 15 von 20 Büchern** haben gefüllte LLM-Felder (`synopsis` + `format` + `availability` + `facetIds`). Lücken sind okay (manche Bücher haben kein Plot-Material), aber keine systematische Abdeckungs-Lücke.
    - **Mindestens 15 von 20 Büchern** haben mind. 1 `discoveredLink` (ein Storefront-URL) im Audit. Bücher ohne Storefronts (sehr alt, OOP-Vergessen) bekommen `no_storefronts_found`-Flag — beides ist legitim, aber ein systematisches Loch (z.B. 5+ Bücher ohne Storefronts) heißt der Web-Search-Prompt funktioniert nicht.
    - **Mindestens 15 von 20 Büchern** haben ein `rating` + `ratingSource` gesetzt. `rating_source`-Verteilung im Diff sichtbar (Erwartung: meiste landen auf `amazon` oder `goodreads`; Hardcover als 3.-Fallback für die 6 von 7 Bücher die wir aus 3b schon haben; Audible für reine Audio-Drama-Releases). Bücher ohne Rating (z.B. obskure 90er-Releases): `no_rating_found`-Flag.
    - **Mindestens 1 Plausibility-Flag** im `llm_flags`-Slot (es gibt schon bekannte Konflikte aus 3b; falls keiner auftaucht ist der Cross-Check nicht aktiv).
    - **Synopse-Stichproben** sichtbar im Diff: für die 5 ersten added-Einträge im Auge inspizierbar (Wortzahl, Original-Klang, keine direkten Quellen-Phrasen).
    - **Tool-Call-Zahl pro Buch** im `audit.tokenUsage.webSearchCount` aufgezeichnet — Erwartung 2–6 pro Buch; deutlich unter 2 = Mandatory-Constraint nicht enforced; deutlich über 6 = LLM ist Web-Search-süchtig, Cost-Treiber für 3e.
- [ ] **Verification:**
  - `npm run lint`, `npm run typecheck`, `npm run check:eras`, `npm run build` alle grün.
  - `npm run db:seed` läuft weiter (Vokabular-Read aus DB darf nicht den Seed-Pfad brechen).
  - `.env.example` um `ANTHROPIC_API_KEY=` mit Schritt-für-Schritt Token-Beschaffungs-Doku ergänzt (Pattern aus 3b Hardcover).

## Open questions

Inputs für die nächste Cowork-Session, kein Blocker:

- **20-Buch-Cost-Reality.** Schätzung sagt $1.50–4.00. Wenn das real ~$3 für 20 ist, sind 800 Bücher ~$120 — ein einmaliger Backfill-Cost den Philipp ohne Bauchschmerzen zahlt. Wenn's ~$8 für 20 ist (Web-Search ist teurer pro Call als geschätzt, oder LLM kettet 8+ Searches/Buch), sind 800 ~$320 und Philipp will den Optional-Web-Search-Mode. Der `llmCostSummary`-Slot im Diff macht das hart messbar.
- **Plot-Sektion-Extraktion: Wikipedia-Article via existing `external_links`-URL oder neuer Fetcher?** Die meisten Bücher in unserer Pipeline haben eine Wikipedia-Article-URL aus 3a/3b (`/wiki/<title>_(novel)`). 3c kann die einfach erneut fetchen und `==Plot==`/`==Synopsis==`-Sektion extrahieren. Aber manche Bücher haben keinen eigenen Wikipedia-Article (nur Listeneintrag). CCs Empfehlung im Report: ist Lexicanum + verpflichtende Web-Search robust genug, oder lohnt der Wikipedia-Article-Fetch?
- **Tool-Use-Schema-Design.** Eine `publish_enrichment`-Tool mit allen 4 Jobs + DiscoveredLinks in einem Schema, oder mehrere kleinere Tools? Ein Tool ist atomarer; mehrere erlauben partielle Antworten. CC's Call basierend auf SDK-Realität — meine Default-Erwartung ist ein Tool, weil die Jobs zusammen eine kohärente Anreicherung sind.
- **Web-Search-Discipline.** Erwartung 2–6 Tool-Calls pro Buch. Wenn der LLM 8+ Searches macht (Synopsen-Vertiefung + Lückenfüllung + jede Faceten-Frage googelt), ist das Cost-Treiber für 3e. Mitigation: System-Prompt mit hartem Search-Budget („max 5 web_search calls"). Heute kein Blocker, aber Daten ausm Test-Lauf bestimmt's.
- **Facet-Vokabular-Coverage.** Wenn der LLM oft Facets vorschlägt die NICHT im Vokabular sind (häufige `proposed_new_facet`-Flags), heißt das wir haben Vokabular-Lücken. CC sammelt im Test-Lauf-Diff: welche neuen Facet-Werte werden vorgeschlagen, wie oft? Daraus baue ich einen Vokabular-Erweiterungs-Brief.
- **Synopsen-Stil.** Default ist „neutraler in-universe-Klang, 100–150 Wörter, Spoiler-conscious aber kein Inhalt-Verstecken". Wenn die generierten Synopsen einen anderen Stil treffen (zu marketing-haft, zu trocken, zu spoilerig) — Stichprobe-Anmerkungen im Report, dann passe ich den System-Prompt für 3e.
- **Storefront-URL-Qualität.** Erwartung: BL-Produkt-Pages sind sehr stabil (`blacklibrary.com/product/<slug>.html`), Amazon und Audible sind weniger stabil (Tracking-Suffixe, Region-Locks). LLM könnte affiliate/tracking-Suffixe abschneiden — aber solange die Base-URL kanonisch ist, reicht das. Audit-Stichprobe aus dem Test-Lauf wird zeigen ob URLs sauber genug für 3d-Apply sind, oder ob ein URL-Sanitization-Pass nötig wird.
- **Rating-Source-Verteilung.** Erwartung: meiste 40k-Bücher haben Goodreads-Reviews (große Reader-Basis), Amazon-Stars sind oft auch da. Hardcover (3.-Fallback) trägt für die ~6 von 7 aus 3b-Diff existierenden Hardcover-Treffer. Audible ist 4.-Fallback fast nur für Audio-Drama-Releases relevant. Wenn der Test zeigt dass Goodreads häufiger als Amazon trifft, kann ich die Priority-Reihenfolge in einem Mini-Brief umkehren — heute nehmen wir Philipps Default. Wenn 5+ Bücher `no_rating_found` haben, ist das ein Coverage-Befund (entweder echt obskure Releases oder der Web-Search-Prompt findet's nicht).
- **Sonnet 4.6 vs Haiku 4.5 — wann macht der Switch Sinn?** Wenn nach Test-Lauf-Sichtprüfung Synopsen/Plausibility-Reasoning gut sind, bleibt Sonnet. Wenn die Cost zu hoch und die Klassifikations-Jobs auch von Haiku gut gemacht werden: Mini-Brief mit ENV-Var-Override + ggf. Web-Search-Optional-Mode dazu.

## Notes

### Datei-Layout-Skizze (illustrativ, nicht bindend)

```
src/lib/ingestion/
  llm/
    enrich.ts                    ← Anthropic-SDK-Call, soft-fail bei missing key
    prompt.ts                    ← System+User-Prompt + Tool-Schema-Builder
    parse.ts                     ← Tool-Call-Response-Validation → LLMPayload
    context.ts                   ← Plot-Section-Fetcher (Wikipedia-Article + Lexicanum-Article)
    cache.ts                     ← FS-Cache mit prompt-version-hashed key
  field-priority.ts              ← + facetIds, synopsis (LLM-primär)
  types.ts                       ← + LLMPayload, LLMFlag, DiffFile.llm_flags
scripts/
  ingest-backfill.ts             ← + LLM-Step-Integration in processOne()
.env.example                     ← +ANTHROPIC_API_KEY (mit Token-Beschaffungs-Doku)
```

### Tool-Use-Schema-Skizze (illustrativ — exakte Form ist CCs Implementation)

```jsonc
// One tool exposed to the LLM:
{
  "name": "publish_enrichment",
  "description": "Publish the enrichment for one book. Call this exactly once after all required web_search calls.",
  "input_schema": {
    "type": "object",
    "required": ["synopsis", "facetIds", "discoveredLinks", "flags"],
    "properties": {
      "synopsis": {
        "type": "string",
        "minLength": 400,         // ~100 words floor
        "maxLength": 1200,        // ~150 words ceiling, slack
        "description": "Paraphrased in-universe synopsis, 100–150 words, no direct quotes from sources."
      },
      "format": {
        "type": "string",
        "enum": ["novel", "novella", "short_story", "anthology", "audio_drama", "omnibus"]
      },
      "availability": {
        "type": "string",
        "enum": ["in_print", "oop_recent", "oop_legacy", "unavailable"]
      },
      "facetIds": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Facet value IDs from the canonical vocabulary. Each ID must exist in facet_values.id."
      },
      "discoveredLinks": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["serviceHint", "kind", "url"],
          "properties": {
            "serviceHint": { "type": "string", "description": "Should match a services.json id: black_library, amazon, audible, kindle, apple_books, warhammer_plus." },
            "kind": { "enum": ["shop", "audio", "reference"] },
            "url": { "type": "string", "format": "uri" }
          }
        }
      },
      "rating": {
        "type": "object",
        "description": "First-source-with-data from priority list [amazon, goodreads, hardcover, audible]. Normalize value to 0–5 scale before publishing. Omit entirely if no rating found in any source.",
        "required": ["value", "source"],
        "properties": {
          "value": { "type": "number", "minimum": 0, "maximum": 5 },
          "source": { "enum": ["amazon", "goodreads", "hardcover", "audible"] },
          "count": { "type": "integer", "minimum": 0, "description": "Number of reviews. Optional — set null if not clearly extractable from the listing." }
        }
      },
      "flags": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["kind"],
          "properties": {
            "kind": { "enum": ["data_conflict", "value_outside_vocabulary", "series_total_mismatch", "author_mismatch", "year_glitch", "proposed_new_facet", "insufficient_web_search", "no_storefronts_found", "no_rating_found"] },
            "field": { "type": "string" },
            "current": {},
            "suggestion": {},
            "sources": { "type": "array", "items": { "type": "string" } },
            "reasoning": { "type": "string" }
          }
        }
      }
    }
  }
}
```

### Diff-JSON-Schema-Erweiterung

```jsonc
{
  "ranAt": "...",
  "discoverySource": "wikipedia",
  "discoveryPages": [...],
  "activeSources": ["lexicanum", "open_library", "hardcover", "llm"],
  "discovered": 701,
  "llmModel": "claude-sonnet-4-6",                              // NEU
  "llmPromptVersion": "a3f8b2c1d4e7",                           // NEU (sha256[:12])
  "added": [
    {
      "wikipediaTitle": "...",
      "slug": "false-gods",
      "payload": {
        "fields": {
          "title": "...",
          "synopsis": "Horus's wounded soul drifts through the Whispering ...",   // NEU (LLM)
          "format": "novel",                                                       // NEU (LLM)
          "availability": "in_print",                                              // NEU (LLM)
          "facetIds": ["tone:grimdark", "theme:betrayal", "pov_side:imperium"],    // NEU (LLM)
          "rating": 4.21,                                                          // NEU (LLM, 0–5 scale)
          "ratingSource": "goodreads",                                             // NEU (LLM, service-id string)
          "ratingCount": 28403,                                                    // NEU (LLM, optional)
          // ...
        },
        "fieldOrigins": {
          "synopsis": "llm",
          "format": "llm",
          "availability": "llm",
          "facetIds": "llm",
          "rating": "llm",
          "ratingSource": "llm",
          "ratingCount": "llm",
          // ...
        },
        "externalUrls": [
          // wikipedia + lexicanum + open_library + hardcover wie bisher.
          // KEINE eigene LLM-URL — der LLM hat keine "source page", er ist ein
          // Compute-Schritt über die anderen Quellen.
        ]
      }
    }
  ],
  "field_conflicts": [...],
  "errors": [
    { "slug": "...", "source": "llm", "message": "missing api key" }   // soft-fail
  ],
  "llm_flags": [                                                       // NEU
    {
      "slug": "false-gods",
      "kind": "year_glitch",
      "field": "startY",
      "current": 40000,
      "suggestion": 30998,
      "sources": ["lexicanum/article-body-extraction-brittle", "wikipedia"],
      "reasoning": "False Gods is HH book 2 (Wikipedia confirms series_index=2). Horus Rising (HH #1) is set in M30. Lexicanum's M40 reading appears to be a body-text extraction error. Plausibility flag: in-universe year should be M30, ~30998-30999."
    },
    {
      "slug": "primarchs-1",
      "kind": "series_total_mismatch",
      "field": "series.totalPlanned",
      "current": 14,
      "suggestion": 18,
      "sources": ["wikipedia/Primarchs_(novel_series)", "blacklibrary.com"],
      "reasoning": "Wikipedia lists 18 Primarchs novels published 2017–2023 (Roboute Guilliman through Vulkan)."
    }
  ]
}
```

### Phase-3-Roadmap-Update (zur Erinnerung)

| Stufe | Status | Inhalt |
|---|---|---|
| **3a** | ✅ shipped 2026-05-03 (sessions 034 + 035) | Wikipedia-Discovery + Lexicanum-Crawler + Multi-Source-Engine + Manual-Protection + 7 Confidence-Aktivierungen + 5 totalPlanned-Korrekturen |
| **3b** | ✅ shipped 2026-05-03 (sessions 036 + 037) | Open Library + Hardcover docken an, format/availability-Schema, Wikipedia-Discovery auf 4 Pages, Hardcover-Schema empirisch verifiziert |
| **3c** | ← diese Session | LLM-Anreicherung (Sonnet 4.6 + Web-Search): Synopsen, Soft-Facets, Format/Availability, Plausibility-Cross-Check. 20-Buch-Test-Gate. |
| **3d** | next | Apply-Step: Diff → DB-Writes mit Manual-Protection on conflict, FK-Resolution für Author-Junction + Facet-Junctions, ALTER TYPE für sourceKind ('open_library', 'hardcover', 'llm'), UNIQUE INDEX external_links, junctionsLocked-Flag |
| **3e** | | Backfill-Day: Resume-Test mit Ctrl-C, --limit 40 Test, --limit 800 Voll-Lauf, Auto-PRs in 100er-Batches |
| **3f** | | Maintenance-Crawler in GH Actions, monatlich, Wikipedia-Diff für Neureleases |

### API-Key-Beschaffung (für Philipp, vor dem Test-Lauf)

1. <https://console.anthropic.com> → Sign in (existing Anthropic-Account oder neu).
2. „API Keys" → „Create Key" → ein Key z.B. `chrono-lexicanum-ingestion`.
3. Key in `.env.local` als `ANTHROPIC_API_KEY=sk-ant-…` eintragen — **niemals committen**.
4. Optional: in Console.anthropic Spending-Limit auf $5 setzen für den 20-Buch-Test (Sicherheits-Stop).
5. CC's Crawler liest `process.env.ANTHROPIC_API_KEY`; wenn fehlt, soft-fail mit WARN.

### Verbindlichkeit der Architektur

Die LLM-Schicht ist die Anreicherungs-Stufe der Pipeline, **nicht** ein Multi-Source-Refactor. Sie operiert auf der Output-Seite (post-merge), liefert via FIELD_PRIORITY in die finale Merge zurück, und schreibt Audit-Slots. Wenn der LLM-Step zeigt dass die Engine etwas Strukturelles für Phase 3+ braucht (z.B. ein gemeinsamer Audit-Payload-Slot statt `rawHardcoverPayload` + LLM-Extras separat), wird das in 3d sauber zusammengezogen — heute strict an die 3a/3b-Form andocken.
