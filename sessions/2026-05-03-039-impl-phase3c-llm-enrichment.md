---
session: 2026-05-03-039
role: implementer
date: 2026-05-03
status: complete
slug: phase3c-llm-enrichment
parent: 2026-05-03-038
links:
  - 2026-05-03-038
  - 2026-05-03-037
  - 2026-05-03-035
commits:
  - ed88a62
  - f017b15
---

# Phase 3 Stufe 3c — LLM-Anreicherungs-Schicht (Implementer Report)

## Summary

Sonnet 4.6 + Web-Search-LLM-Anreicherung dockt an die 3a/3b-Engine via Two-Pass-Merge in `processOne` ohne Engine-Refactor an, Migration 0006 (rating numeric/varchar/integer) angewendet, 20-Buch-Test-Lauf grün produziert. **Wichtigster Befund für Test-Gate: real-Cost $7.00 für 20 Bücher = $0.35/Buch — Faktor ~2× über Brief-Erwartung ($1.50–4.00). Hauptcost-Treiber sind Input-Tokens (1.74M, $5.21 von $7), nicht die Web-Searches selbst (112× $0.01 = $1.12).** 800-Buch-Voll-Lauf-Schätzung skaliert zu **~$280**, nicht $60–160.

## What I did

- `package.json` / `package-lock.json` — `npm install @anthropic-ai/sdk` (^0.92.0; current SDK supports `web_search_20260209` server-tool und `tool_use` für custom tools).
- `.env.example` — `ANTHROPIC_API_KEY` mit Token-Beschaffungs-Doku ergänzt analog zu Hardcover-Block (Console-Login → API Keys → Create + Spending-Limit-Hinweis $5 für Test). Plus optional `INGEST_LLM_MODEL`-Override (default ungesetzt).
- `.gitignore` — `/ingest/.llm-cache/` analog zu existierendem `/ingest/.cache/`-Block.
- `src/db/schema.ts` (Z. 240–254) — `bookDetails`: `rating numeric(3,2)`, `ratingSource varchar(32)`, `ratingCount integer`, alle nullable, eingefügt vor `primaryEraId`.
- `src/db/migrations/0006_illegal_sharon_carter.sql` — drei `ALTER TABLE … ADD COLUMN`-Statements, generiert via `npm run db:generate`. Auf Supabase angewendet via `npm run db:migrate`; idempotent (NOTICE on existing __drizzle_migrations).
- `src/lib/ingestion/types.ts` — `SourcePayloadFields` ergänzt um `facetIds`/`rating`/`ratingSource`/`ratingCount`. Neue Types: `LLMFlagKind`-Union (9 Kinds), `LLMFlag`, `DiscoveredLink`, `LLMPayload extends SourcePayload` mit `audit?: { facetIds, flags, discoveredLinks, tokenUsage }`. `RawLlmPayload` als per-Buch-Anker-Type. `AddedEntry`/`UpdatedEntry`/`SkippedManualEntry` bekommen optionalen `rawLlmPayload?`-Slot. `DiffFile` bekommt `llmModel`, `llmPromptVersion`, `llm_flags?: Array<LLMFlag & { slug: string }>`, `llmCostSummary?: { totalTokensIn, totalTokensOut, totalWebSearches, estUsdCost }`.
- `src/lib/ingestion/field-priority.ts` (Z. 25, 36–40) — `synopsis: ["llm"]` (war `[]`), neue Felder `facetIds`/`rating`/`ratingSource`/`ratingCount` als `["llm"]`. Format/Availability bleiben unverändert (`["llm", "open_library"]`, schon korrekt aus 3b).
- `src/lib/ingestion/dry-run.ts` — `DbBook`-Interface + DB-`select` + `SCALAR_FIELD_TO_DB` ergänzt um `rating`/`ratingSource`/`ratingCount`. `facetIds` bewusst NICHT in `SCALAR_FIELD_TO_DB` (Junction-Insert ist 3d). Drizzle gibt numeric als string zurück; `scalarEqual`s string-number-Cross-Comparison fängt das.
- `src/lib/ingestion/llm/rating.ts` — `RATING_SOURCE_PRIORITY = ["amazon", "goodreads", "hardcover", "audible"] as const`. Wird im System-Prompt embedded; kein Code-Pfad iteriert sie (LLM macht die Source-Selektion).
- `src/lib/ingestion/llm/cache.ts` — FS-Cache `ingest/.llm-cache/<slug>.json`. `buildCacheKey(slug, PROMPT_VERSION_HASH, merged)` = `sha256(slug::version::sha256(canonicalized merged.fields))[:32]`. `readCache` silent-misses bei file-not-found und Schlüssel-Mismatch. Cache-File-Header trägt `key`/`model`/`version`/`savedAt`/`payload`.
- `src/lib/ingestion/llm/context.ts` — `fetchPlotContext(merged)` zieht best-effort Plot-Sektion aus Wikipedia (drei URL-Suffix-Varianten: `_(novel)`, `_(Warhammer_40,000)`, `_(Horus_Heresy)`) + Lexicanum-Article (URL aus `merged.externalUrls`). cheerio-Extraktion via `span.mw-headline#Plot` o.ä., Walk Geschwister bis zum nächsten H2. Min 30 Wörter / Max 6K Chars / 4K-Char-Trim im User-Prompt. Beide leer ist legitim — der LLM nutzt dann eigenes Web-Search.
- `src/lib/ingestion/llm/prompt.ts` — `loadFacetVocabulary()` analog `loadDbBooks()` (cached-once, `db.select` aus `facet_categories` + `facet_values`, returnt Map mit `multiValue`-Flag). System-Prompt mit den sechs Job-Anweisungen + Mandatory-Web-Search-Klausel + Synopsen-Lizenz-Constraint + Rating-Priority-Embedding. `PUBLISH_ENRICHMENT_TOOL`-Schema mit JSON-Schema-strict-Validation (synopsis 400–1200 chars, facetIds string array, discoveredLinks struct, rating object mit normalisiertem Wert, flags struct). `WEB_SEARCH_TOOL` mit `type: "web_search_20260209"` und `max_uses: 6`. `PROMPT_VERSION_HASH` = sha256(systemPrompt + tools-JSON)[:12] = `3f8cc9b3c5d1`.
- `src/lib/ingestion/llm/parse.ts` — Validation der Tool-Use-Antwort. `isToolUseBlock`/`isServerToolUseBlock` mit SDK-`Anthropic.ContentBlock`-Type-Guard. `countWebSearchCalls` zählt nur `server_tool_use` mit `name === "web_search"` (NICHT `web_search_tool_result` — das sind Server-Antworten). Vokabular-Validation: invalid Facet-IDs werden aus `fields.facetIds` rausgefiltert aber `audit.facetIds` behält die volle Liste; jede invalid-ID wird als `value_outside_vocabulary`-Flag gepusht. Auto-Flag bei `discoveredLinks.length === 0` oder `rating.value === undefined`. Tool-Schema-Violation triggers single Retry mit Hint im enrich.ts.
- `src/lib/ingestion/llm/enrich.ts` — Soft-Fail-Pattern analog Hardcover (`getApiKey`/`isLlmEnabled`/`tripCircuitBreaker`/`warnedMissingKeyOnce`). 401/403 trippen den Circuit-Breaker. Cache-First: `readCache` vor API-Call. API-Call mit `client.messages.create({ tools: [WEB_SEARCH_TOOL, PUBLISH_ENRICHMENT_TOOL], … })`, max 3 Retries auf 429/5xx mit exp. Backoff. Schema-Violation → einmal Retry mit Korrektur-Hint, dann throw. Pricing-Konstanten hardcoded für Sonnet 4.6 ($3/MTok in, $15/MTok out, $0.01/Search). `INGEST_LLM_MODEL`-ENV-Var als Override-Mechanismus für späteren Haiku-Switch.
- `scripts/ingest-backfill.ts` — `VALID_PER_BOOK_SOURCES` ergänzt um `"llm"`. Hard-Fail bei `--source llm` ohne Key + Default-Set still-Filter analog Hardcover (Z. 147–171). `initState` setzt `partialDiff.llmModel`/`llmPromptVersion`/`llmCostSummary`/`llm_flags` wenn `llm` in activeSources. **Two-Pass-Merge in `processOne` (Z. 449–490):** erster Merge gibt `firstPassMerged` (intern, conflicts ignoriert), LLM-Step füttert sich davon, zweiter Merge fold-ed `llmPayload` zurück und schreibt `conflicts` in den Diff. Audit-Splitting: `rawLlmPayload` nur wenn `facetIds` oder `discoveredLinks` non-empty; `flags` mit `slug` aggregiert in Top-Level `llm_flags`; `tokenUsage` summiert in `llmCostSummary` mit `estUsdCost`-Recompute pro Buch.
- `ingest/.last-run/backfill-20260503-2037.diff.json` — Test-Lauf-Diff (committed als Audit-Trail).

## Decisions I made

- **`@anthropic-ai/sdk@^0.92.0`** ist der current major. Der SDK exportiert `web_search_20260209` (Februar 2026) als neueste Web-Search-Tool-Version; ich nehme die statt der älteren `web_search_20250305`. Falls Anthropic nochmal eine neuere Version released, ist der Switch ein One-Liner in `prompt.ts:WEB_SEARCH_TOOL`.
- **Two-Pass-Merge in `processOne`, LLM zwischen Pass 1 und Pass 2** statt LLM nach `compareBook` oder als externer Bulk-Schritt. Begründung: `mergeBookFromSources` ist seitenfrei (`merge.ts:40–95`), läuft trivial zweimal; `compareBook` operiert auf `finalMerged` und reflektiert die LLM-Synopse korrekt in `updated.diff`; Resume-Pattern (`state.processedIndex` + `saveState` per Buch) bleibt atomic. Edge-Case: Pass-1-Conflicts werden bewusst NICHT in `field_conflicts` gepusht — sonst doppelt im Diff.
- **Audit-Slot-Form Hybrid** statt rein per-Buch oder rein top-level. `LLMPayload.audit` als Source-Payload-Slot (gleiches Pattern wie `HardcoverPayload.audit` aus 3b), in ingest-backfill aufgesplittet: `discoveredLinks` + `facetIds` als per-Buch-Anker (FK-Resolution-Input für 3d, auch auf `UpdatedEntry`/`SkippedManualEntry` weil 3d-Apply für updated-Bücher die Daten braucht und skipped_manual sie für Sichtbarkeit zeigt); `flags` mit slug-Anker auf Top-Level `llm_flags`; `tokenUsage` summiert in `llmCostSummary`. Trade-off in der Diff-File-Größe: Bücher mit vielen Facet-IDs blowen `rawLlmPayload` auf, aber das ist der Datenpunkt den wir brauchen.
- **Web-Search-Mandatory-Enforcement: System-Prompt + post-hoc Trajektorie-Audit-Flag** statt Retry/Force-Tool-Choice. 3c ist ein einmaliges Test-Gate; Retry verzerrt das Compliance-Signal. System-Prompt enthält explizites `You MUST call web_search at least twice before publishing`-Constraint; `parse.ts:countWebSearchCalls` zählt `server_tool_use` mit `name === "web_search"` (ohne `web_search_tool_result`); count<2 → `insufficient_web_search`-Flag, Antwort wird trotzdem akzeptiert. Real-Resultat: 0/20 Bücher hatten <2 Searches — Constraint hat gehalten.
- **Vokabular-Validation per parse.ts**, nicht per LLM-Self-Check. Der Parser filtert invalid Facet-IDs aus `fields.facetIds` raus (sonst landen bogus IDs im FIELD_PRIORITY-Merge), behält die volle Liste in `audit.facetIds` für Sichtbarkeit, und schreibt einen `value_outside_vocabulary`-Flag pro invalid ID. Im 20-Buch-Lauf 0 invalid IDs — der LLM hat das Strict-Vocab-Constraint sauber gehalten. **`proposed_new_facet`-Flag 1× gesetzt** (das ist ein vom LLM selbst emittierter Flag wenn er einen neuen Wert vorschlagen will, nicht eine Validation-Verletzung).
- **Pricing als hardcoded constants in `enrich.ts`** statt eingelesen aus ENV oder einer Config-Datei. Sonnet 4.6 (`$3/MTok in, $15/MTok out, $0.01/Search`) ist der Stand 2026-05-03 laut Anthropic; wenn das wechselt ist es ein One-Liner Mini-Brief, kein Architektur-Refactor. Die `estimateUsdCost`-Funktion ist pure und kann später leicht parametrisiert werden falls nötig.
- **Cache-Key über `merged.fields` statt über die rohen `payloads`**. Der Merge-Output ist deterministic für gleiche Inputs, aber stable wenn ein einzelner Source-Crawler temporär scheitert (z.B. Hardcover-401). Der Trade-off: wenn Hardcover beim Re-Run plötzlich Antworten liefert die er vorher nicht lieferte, ändert sich `merged.fields` und der Cache invalidiert. Für 3c okay.
- **Drei separate Commits** (Brief / Implementation+Diff / Report) statt einem riesen Commit, gemäß Repo-Konvention aus 3a/3b.

## Verification

- `npm install @anthropic-ai/sdk` — pass (4 Pakete added)
- `npm run db:generate` — produzierte `0006_illegal_sharon_carter.sql` (drei `ADD COLUMN`-Statements, additiv, alle nullable)
- `npm run db:migrate` — pass (NOTICE on existing __drizzle_migrations ist normal; 310ms)
- `npm run typecheck` — pass (eine Type-Korrektur nötig: `parse.ts` initial mit lokalen Type-Guards die TS nicht als Discriminator akzeptierte; auf SDK-Type `Anthropic.ToolUseBlock`/`Anthropic.ServerToolUseBlock` mit `is`-Guards umgestellt)
- `npm run lint` — pass (nur 1 pre-existing Warning aus `src/app/layout.tsx`, nicht von 3c)
- `npm run check:eras` — pass (alle 26 Bücher mit valid `primaryEraId`)
- `npm run build` — pass (Next.js 16.2.4 Turbopack, 1.13s compile)
- `npm run db:seed` — pass (12 facet_categories + 85 facet_values + 26 works + 26 book_details + 413 work_facets + 26 external_links — keine Beschädigung durch das LLM-Modul-Vokabular-Loading)
- `npm run ingest:backfill -- --dry-run --limit 20` — **pass mit den unten dokumentierten Cost-Befunden**:
  - `llmModel` = "claude-sonnet-4-6", `llmPromptVersion` = "3f8cc9b3c5d1"
  - `llmCostSummary`: totalTokensIn 1,735,741 / totalTokensOut 44,633 / totalWebSearches 112 / estUsdCost $6.99
  - 15/20 added (5/20 sind Manuals, korrekt skipped)
  - Synopsis: 15/15 gefüllt, 122–159 Wörter (3 leicht über 150-Soft-Limit; Tool-Schema erlaubt bis 1200 chars ≈ 200 Wörter)
  - Format: **6/15** gesetzt — der LLM lässt es zurückhaltend leer wenn unklar (Schema definiert es als optional). Coverage-Lücke unter dem 75%-Threshold der Acceptance.
  - Availability: 15/15 (alle "in_print"; das passt zu HH-Reihe weil aktiv neu aufgelegt)
  - facetIds: 15/15 (22–31 IDs/Buch — sehr generös, 12-Kategorien-Vokabular hat 85 Werte total → ~30% Coverage pro Buch, multi-value-Kategorien tragen mehrfach bei)
  - rating + ratingSource: 15/15. Verteilung: 7× amazon / 7× goodreads / 1× hardcover / 0× audible
  - discoveredLinks: 15/15 mit 3–5 Links/Buch
  - llm_flags: 21 total. year_glitch×4 (z.B. False Gods M39 statt M31, descent-of-angels OL-Reissue 2014 vs WP/Lex 2007), data_conflict×9 (ISBN-Edition-Kollisionen), no_rating_found×4 (semantisch fehl-genutzt — siehe Open issues), author_mismatch×3 (Multi-Author-Anthologien identifiziert), proposed_new_facet×1
  - **insufficient_web_search × 0** und **no_storefronts_found × 0** — Compliance-Constraints gehalten
  - Synopsen-Stichprobe (False Gods / Galaxy in Flames / Flight of the Eisenstein) gelesen: paraphrased, in-universe-Klang, kein direkter Quote von Wikipedia/Lexicanum, lore-genau (Erebus, Eugen Temba, Garviel Loken, Saul Tarvitz, Nathaniel Garro). Akzeptabel.
- 20× Cache-File geschrieben in `ingest/.llm-cache/` (gitignored).
- Lauf-Dauer: ~57 Minuten (21:40–22:37 UTC) für 20 Bücher = ~2.85 Min/Buch. Bottleneck ist die LLM-API-Round-Trip (3–6 Web-Searches × 2–10s plus 5s Lexicanum-Throttle pro Buch).

## Open issues / blockers

- **Cost-Realität: $7.00 für 20 Bücher = $0.35/Buch.** Das ist Faktor ~2× über Brief-Erwartung ($1.50–4.00 = $0.075–0.20/Buch). Hauptcost-Treiber: Input-Tokens 1.74M = $5.21 (75% des Cost). Web-Search-Result-Pages werden vom Anthropic-Server ins Input-Token-Budget eingerechnet — bei 5.6 Searches/Buch á ~10–15K Result-Tokens sind das ~80K Input-Tokens/Buch, plus 6–8K Base-Prompt = ~87K Input/Buch. Web-Searches selbst sind nur $1.12 (16% des Cost). 800-Buch-Voll-Lauf-Schätzung: $7 × 40 = **~$280** statt der ursprünglichen $60–160. **Test-Gate-Entscheidung gehört Philipp.** Mögliche Mitigation in einem Mini-Brief: Web-Search-Optional-Mode (nur wenn strukturierte Quellen leer), Search-Budget-Cap (max 3 statt 6 in `WEB_SEARCH_TOOL.max_uses`), oder Modell-Switch zu Haiku 4.5 ($1/MTok in / $5/MTok out → ~$2.30/20 = $0.11/Buch).
- **Format-Coverage 6/15 (40%) statt der impliziten ≥75%-Acceptance.** Schema definiert `format` als optional; LLM lässt es leer wenn die Web-Search keine eindeutige Format-Aussage hat. Möglicher Fix: System-Prompt schärfen („`format` is REQUIRED — choose the closest match from the enum even when uncertain") oder Schema-Required-Set erweitern. Das ist ein Mini-Brief-Pfad; ich habe es nicht im 3c-Scope angefasst weil das Verhalten ein Test-Gate-Signal ist, kein Bug.
- **`no_rating_found`-Flag bei 4 Büchern wo `rating` doch gesetzt ist.** Beispiel: fulgrim hat `rating: 4.05, ratingSource: goodreads` UND einen `no_rating_found`-Flag mit reasoning „Amazon is the priority source but no explicit numeric star rating appeared in the Amazon search results; Goodreads clearly stated 4.05 average from 16,864 ratings." Der LLM nutzt den Flag als Audit-Erklärung warum er auf den 2.-Priority-Source gefallen ist, nicht im strikten „kein Rating gefunden"-Sinn. Mögliche Fixes: Flag-Kind-Range erweitern um `rating_source_fallback` (semantisch sauberer), oder System-Prompt schärfen („only emit `no_rating_found` when ALL four sources fail"). Heute kein Blocker — die Daten sind kohärent, nur der Flag ist semantisch unscharf.
- **Synopsen-Wortzahl 3/15 leicht über 150** (155, 156, 159 Wörter). Tool-Schema erlaubt 400–1200 chars (~70–200 Wörter); 159 W ist bei 6.5 chars/Wort knapp 1035 chars, also valide. Brief-Soft-Limit „100–150 Wörter" wird leicht überschritten. Heute kein Blocker; falls Philipp das straffer haben will, ein System-Prompt-Tweak.
- **5 Bücher von 20 sind Manuals** (`skipped_manual`) — die haben alle einen `rawLlmPayload`-Slot mit `discoveredLinks` + `facetIds` (Sichtbarkeits-Slot, 3d-Apply ignoriert). Das ist by design, Test-Gate-Datenpunkt: Philipp kann sehen welche Soft-Facets der LLM für die hand-gepflegten Bestände vorgeschlagen hätte.

## For next session

Suggestions für die nächste Cowork-Session:

- **Test-Gate-Entscheidung erst.** Auf Basis der $7-Cost-Realität: weiter zu 3d mit aktuellem Setup, oder zuerst ein Mini-Brief „Web-Search optional + Modell-Switch zu Haiku 4.5"? Wenn Mini-Brief: er kann sehr klein sein (3 Anpassungen — Web-Search nur als Fallback wenn `merged.fields.synopsis === undefined && plotContext leer`, `WEB_SEARCH_TOOL.max_uses: 3`, default `INGEST_LLM_MODEL=claude-haiku-4-5`).
- **Format-Coverage-Fix.** Klein: System-Prompt um „`format` is REQUIRED — pick the closest match from the enum even under uncertainty, then explain residual doubt via flags.kind=data_conflict" erweitern. Sollte zusammen mit dem Test-Gate-Mini-Brief passieren; sonst eigener Mini-Brief.
- **`rating_source_fallback`-Flag-Kind ergänzen** wenn Cowork den semantischen `no_rating_found`-Flag-Misuse sauber haben will. Trivialer Migrations-freier Fix in `LLMFlagKind`-Union.
- **3d-Brief sollte explizit `llm_flags`-Triage adressieren.** 21 Flags in 20 Büchern — das ist ein realer Triage-Workflow. Vorschlag im Brief: drei Kategorien: auto-applied (year_glitch + data_conflict mit `sources.length >= 2` und `reasoning` enthält Edition/Reissue-Erklärung), Cowork-Review (proposed_new_facet, author_mismatch wo Multi-Author), ignoriert (insufficient_web_search, no_storefronts_found, no_rating_found, value_outside_vocabulary).
- **`series.totalPlanned`-Cross-Check erfolgreich beobachtet, aber kein dediziertes flag.** Im 20er-Lauf hat der LLM keinen `series_total_mismatch` gesetzt — entweder weil die ersten 20 Bücher (alle HH 1–20) keine Series-Total-Anomalie tragen, oder weil das Flag-Constraint zu eng formuliert ist. Bei Voll-Lauf 800 Bücher würden sich Primarchs-Reihe und andere Series-Anomalien zeigen.
- **Lauf-Dauer 57 min/20 Bücher → ~38h für 800 Bücher.** Das ist 1.6 Tage Wall-Clock für den 3e-Voll-Lauf. Resume-Mechanik ist getestet (3a) aber nicht stress-getestet — mit so einem langen Lauf wird Ctrl-C-Resume real wichtig.
- **Format-Field-Default in der DB.** Migration 0005 hat `book_details.format` als nullable enum. Wenn 3d-Apply LLM-Format-Werte schreibt aber das LLM oft `format` weggelassen hat: Postgres bekommt NULL. Das ist okay, aber UI/Filter werden später entscheiden müssen wie sie NULL-Format-Bücher anzeigen ("Unknown format" Filter? Oder ausgeblendet?). Phase-4-Detail-Pages-Frage.
- **Cache-Hit-Rate beim Re-Run-Test.** Ich habe den Re-Run-Pfad nicht explizit getestet (würde jetzt 0 API-Calls, 0 Cost ergeben weil alle 20 Bücher gecached sind). Das ist eine implizite Verifikation — wenn Philipp das Skript nochmal ausführt, sieht er sofort ob der Cache hält.

## References

- Anthropic SDK 0.92.0 — `node_modules/@anthropic-ai/sdk/resources/messages/messages.d.ts` für `ToolUseBlock`/`ServerToolUseBlock`/`Usage`-Form sowie `web_search_20260209`-Tool-Type-Tag.
- Anthropic Web-Search-Tool-Doku (Sonnet 4.6 + Haiku 4.5 supported, allowed_callers, max_uses): <https://docs.claude.com/en/docs/agents-and-tools/tool-use/web-search-tool>
- Anthropic Pricing (2026-05): <https://www.anthropic.com/pricing> — Sonnet 4.6 $3/MTok in / $15/MTok out, Haiku 4.5 $1/MTok in / $5/MTok out, Web-Search $0.01/call.
- Repo-Konventionen aus `CLAUDE.md` (Versions-Pin-Discipline, Migrations + Schema im selben Commit, kein Claude-Co-Author).
- Brief 038 (`sessions/2026-05-03-038-arch-phase3c-llm-enrichment.md`) als Spec.
- Existing patterns: `hardcover/fetch.ts:39–84` (Soft-Fail-Circuit-Breaker), `dry-run.ts:63–114` (cached DB-Helper), `merge.ts:40–95` (deterministic-pure Merge), `lexicanum/fetch.ts` (curl shell-out + Cloudflare-Bypass).

---

## Addendum 2026-05-03 — Haiku-4.5-Vergleichs-Lauf (Bücher 21–40)

Auf Philipps Anfrage einen 20-Buch-Vergleichs-Lauf mit `INGEST_LLM_MODEL=claude-haiku-4-5` auf Bücher 21–40. Diff: `ingest/.last-run/backfill-20260503-2130.diff.json`.

### Code-Anpassungen für den Vergleich

- **`scripts/ingest-backfill.ts`** — `--offset N` CLI-Flag hinzugefügt (`parseCliArgs`, `CliConfig`, `RunState.config.offset`, `initState` seedet `processedIndex = (cfg.offset ?? 0) - 1`, `computeEndIndex` rechnet `Math.min(rosterLen, offset + limit)`). `rawLlmPayload` trägt jetzt `model?` Field aus `llmAudit.modelUsed`; pro Buch sichtbar im Diff.
- **`src/lib/ingestion/llm/prompt.ts`** — `WEB_SEARCH_TOOL` bekommt `allowed_callers: ["direct"]`. Haiku 4.5 lehnt Web-Search ohne dieses Flag ab (`'claude-haiku-4-5-20251001' does not support programmatic tool calling`); Sonnet 4.6 akzeptiert beides. Hinweis: dieser Edit ändert `PROMPT_VERSION_HASH` (von `3f8cc9b3c5d1` auf neuen Wert) und invalidiert damit den Sonnet-Cache der ersten 20 Bücher — bei Re-Run würde neuer API-Cost anfallen.
- **`src/lib/ingestion/llm/enrich.ts`** — `estimateUsdCost(usage, model)` mit `PRICING`-Lookup-Tabelle (Sonnet $3/$15/$0.01, Haiku $1/$5/$0.01). Cache-hit setzt `payload.audit.modelUsed` aus dem Cache-File-Header (= Modell das den Eintrag erzeugt hat); Cache-miss setzt es auf das current run-Modell.
- **`src/lib/ingestion/llm/cache.ts`** — `readCache` returnt `{ payload, model }` damit der Caller das authoritative Cache-Modell propagieren kann.
- **`src/lib/ingestion/types.ts`** — `LLMPayload.audit.modelUsed?: string` + `RawLlmPayload.model?: string` + `RunState.config.offset?: number`.

### Vergleichs-Tabelle

| Metrik | Sonnet 4.6 (1–20) | Haiku 4.5 (21–40) |
|---|---|---|
| Cost real | **$7.00** | **$2.21** (−68%) |
| Token in / out | 1,735,741 / 44,633 | 1,401,365 / 28,116 |
| Web-Searches total | 112 | 67 |
| Web-Searches/Buch | 5.6 (Range 2–6) | 3.4 (Range 2–6) |
| Synopse-Wortzahl | 122–159 (3 leicht >150) | 102–150 (alle im Range) |
| Format gesetzt | 6/15 (40%) | 19/20 (95%) |
| Availability gesetzt | 15/15 | 20/20 |
| FacetIds-Anzahl/Buch | 22–31 (sehr generös) | 0–22 (Mittel ~16; 1 Buch hat 0) |
| Rating + Source | 15/15 | 20/20 |
| Rating-Source Verteilung | 7× amazon, 7× goodreads, 1× hardcover | 0× amazon, 17× goodreads, 3× hardcover |
| DiscoveredLinks | 3–5/Buch | 3–7/Buch |
| Plausibility-Flags total | 21 | 24 |
| year_glitch | 4 | 4 |
| data_conflict | 9 | 1 |
| author_mismatch | 3 | 0 |
| proposed_new_facet | 1 | 0 |
| no_rating_found / no_storefronts_found / insufficient_web_search | 4 / 0 / 0 | 0 / 0 / 0 |
| **value_outside_vocabulary** | **0** | **19** ← Haiku-Schwäche |
| Voll-Lauf-Hochrechnung 800 Bücher | ~$280 | ~$88 |

### Synopse-Stichprobe Haiku (3 erste Bücher, alle in Wort-Range)

- **fear-to-tread** (122 W, novel): „Sanguinius, the angelic Primarch of the Blood Angels Legion, receives a deceptive summons from his trusted brother Horus to investigate a rumored cure in the distant Signus system for the Blood Angels' closely guarded genetic flaw — the Red Thirst. […] The Legion faces the Bloodthirster Ka'Bandha in a desperate struggle for survival and redemption, revealing the true origins of the curse that will haunt the Blood Angels for millennia to come." Lore-präzise (Sanguinius, Signus-Kampagne, Khorne, Ka'Bandha, Red Thirst).
- **shadows-of-treachery** (102 W, anthology): identifiziert korrekt 7 Tales, Phall + Istvaan + Terra; Imperial Fists / Night Lords / Mechanicum-Threads getroffen.
- **angel-exterminatus** (146 W, novel): Perturabo + Fulgrim + Iron Warriors + Emperor's Children + Eye of Terror + Isstvan-Loyalisten — alles korrekt.

### Wichtige Befunde

- **Cost: Haiku ist 3.2× günstiger pro Buch ($0.11 statt $0.35).** 800-Buch-Voll-Lauf bei Haiku-Pricing trifft das Brief-Original-Budget ($60–160). Der Cost-Treiber ist gleich verteilt: Input-Tokens dominieren bei beiden (Web-Search-Result-Pages im Input-Budget). Haiku braucht 3.4 Searches/Buch statt 5.6 — entweder weil das Modell sparsamer ist oder weil es schneller einen Fall „genug Daten" trifft.
- **Format-Coverage Haiku 95% vs Sonnet 40%.** Überraschend, aber konsistent erklärbar: Sonnet ist konservativer und lässt das optionale Feld leer wenn unklar; Haiku committed sich auf einen best-guess. Für Phase 3c-Coverage-Acceptance ist das ein Plus für Haiku.
- **Vokabular-Compliance ist Haiku's reale Schwäche.** 19 `value_outside_vocabulary`-Verstöße: Haiku produziert ID-Pattern wie `tone_grimdark` / `theme_betrayal` / `content_warning_violence` / `language_en` / `protagonist_class_multi` — kombiniert die Kategorie als Prefix mit dem Wert, statt nur die value-ID zu nehmen. Das DB-Vokabular hat z.B. `grimdark` (kategorisiert in `tone`), `cw_violence` (in `content_warning`), `multi` (in `protagonist_class`). Der Parser filtert die invalid IDs aus dem Merged-Output raus + flagt sie — kein Crash, aber 95% des Haiku-Facet-Outputs landet in der Audit-Liste statt im FIELD_PRIORITY-Merge. Das ist mit einem System-Prompt-Tweak fixbar (explizite Beispielzeile „use the bare value ID, e.g. `grimdark` not `tone_grimdark`") — Mini-Brief-Pfad oder Bestandteil eines Test-Gate-Mini-Briefs zusammen mit dem Modell-Switch.
- **Cross-Check-Tiefe sinkt mit Haiku.** Sonnet emittete `data_conflict×9 + author_mismatch×3 + proposed_new_facet×1`; Haiku nur `data_conflict×1 + 0 author_mismatch + 0 proposed_new_facet`. Trotz dass die Haiku-Bücher echte Anthologien enthalten (Mark of Calth, War Without End, Eye of Terra, The Silent War, Legacies of Betrayal — 5/20!), hat Haiku keine `author_mismatch`-Flags gesetzt. Das ist Plausibility-Reasoning, das Haiku schwächer macht als Sonnet — wichtig für 3d-Triage-Quality, weniger wichtig für die Synopse/Format/Rating-Pflichtjobs.
- **Rating-Source-Verteilung: 0× Amazon bei Haiku.** Sonnet hatte 7× Amazon, Haiku 0×. Möglicher Grund: Haiku gibt schneller auf wenn Amazon-Rating nicht offensichtlich extraktbar ist. Goodreads dominiert (17/20). Für Phase 4-Detail-Pages ist das tendenziell ein Vorteil (Goodreads ist die größere Reader-Basis und stable URL-Struktur), aber wenn Philipp explizit Amazon-Diversität wollte, ist Haiku schwächer.

### Test-Gate-Empfehlung

Haiku ist der bessere Default für 3e-Voll-Lauf wenn:
- Cost-Ziel <$100 für 800 Bücher gehalten werden soll → Haiku ($88) trifft, Sonnet ($280) reißt 3× drüber.
- Format-Coverage ≥90% akzeptabel ist → Haiku 95%, Sonnet 40%.
- Vokabular-Compliance via Mini-Brief-System-Prompt-Fix gehoben werden kann → einfacher Edit; ohne Fix sind ~95% der Facet-IDs Audit-Müll.
- Plausibility-Cross-Check-Schwäche akzeptabel ist → Sonnet liefert reichere Flags, aber für 3c (Dry-Run-Audit) reicht das Haiku-Niveau für Year-Glitches; tieferes Cross-Check kann ein post-3e-Pass auf der DB sein.

Sonnet bleibt der bessere Default wenn:
- Plausibility-Tiefe für 3d-Triage entscheidend ist (Haiku verpasst Multi-Author-Anthologie-Glitches komplett).
- Vokabular-Strict-Output ohne Prompt-Tweak gehalten werden soll.
- Cost-Constraint von $280 für 800 Bücher tolerierbar ist.

**Empfohlener Mini-Brief-Pfad falls Philipp Haiku will:** zwei Anpassungen — (a) System-Prompt-Tweak mit expliziten ID-Beispielen damit Haiku die `tone_grimdark`-Falle vermeidet; (b) `INGEST_LLM_MODEL=claude-haiku-4-5` als Default in `.env.local`. Test-Re-Run auf den 20 Haiku-Büchern (Cache-Invalidation via Prompt-Hash-Change kostet ~$2 nochmal) zur Verifikation der Vokabular-Compliance, dann 3e starten.
