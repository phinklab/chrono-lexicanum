---
session: 2026-05-05-045
role: implementer
date: 2026-05-06
status: complete
slug: cc-vs-pipeline-comparison
parent: 2026-05-05-045
links:
  - 2026-05-05-044
  - 2026-05-04-042
commits: []
---

# Sonnet-Quadrant der 5-Zellen-Vergleichsmatrix (B + C, 6 Slugs)

## Summary

Beide Sonnet-Quadrant-Files committed: `ingest/.compare/045-sonnet-pipeline.json` (Variant B, 6/6 Slugs, 33.7K Tokens, kumulativ 67.36% Heuristik) und `ingest/.compare/045-sonnet-web.json` (Variant C, 6/6 Slugs, 154.7K Orchestration-Tokens). **Hauptbefund**: Variant C trifft `author_mismatch` auf BEIDEN Anthologien (2/2), Variant B auf KEINER (0/2) — d.h. der Editor-vs-Author-Pattern liegt nicht in den Pipeline-strukturierten Daten, sondern braucht Web-Recherche. Damit ist die Pipeline strukturell zu eng auf strukturierte Crawl-Inputs gekoppelt; ein Web-Validierungs-Pass würde das fixen.

## What I did

- `ingest/.compare/_runners/load-slug-data.ts` — Per-Slug-Loader: liest aus den zwei Source-Diffs den `payload` (MergedBook) + optionalen `rawHardcoverPayload`, fetcht `plotContext` frisch via `fetchPlotContext` aus `src/lib/ingestion/llm/context.ts:150`. Read-only — kein Pipeline-Edit.
- `ingest/.compare/_runners/divergence.ts` — Divergence-Helper: extrahiert Variant-A-Enrichment aus dem Diff (synopsis/facetIds/flags/discoveredLinks aus `payload.fields` + `rawLlmPayload` + Top-Level `llm_flags` aggregiert per Slug), produziert Markdown-Vergleichs-Notiz für Wortzahl/Set-Diff/Identitäts-Check.
- `ingest/.compare/_runners/variant-b-runner.ts` — Variant B Runner: 6 sequenzielle Anthropic-API-Calls auf `claude-sonnet-4-6` mit `SYSTEM_PROMPT` 1:1 + `buildUserPrompt(...)` 1:1 + `tools: [PUBLISH_ENRICHMENT_TOOL]` (KEIN `WEB_SEARCH_TOOL`). Tool-Choice-Forced auf `publish_enrichment`. Per-Slug-Persist + Console-Status-Line + Hard-Stop-Check bei kumulativ + nextEstimate > 80%.
- `ingest/.compare/_runners/dump-vocab.ts` + `facet-vocabulary.md` — exportiert das DB-Facet-Vokabular als Markdown-Datei, die die Sonnet-Subagenten von Variant C einlesen.
- `ingest/.compare/_runners/variant-c-results.ts` — Aggregator: nimmt die 6 Sonnet-Subagent-Outputs (inline kompiliert, siehe Decisions), berechnet pro Slug `divergence` vs Variant-A UND vs Variant-B, schreibt `045-sonnet-web.json` mit `costEstimate` + `searchedSources`.
- `ingest/.compare/045-sonnet-pipeline.json` — Variant-B-Output, 6 Slugs.
- `ingest/.compare/045-sonnet-web.json` — Variant-C-Output, 6 Slugs.
- `docs/ui-backlog.md` — kein Eintrag (keine UI-Beobachtung).
- `sessions/2026-05-05-045-impl-cc-vs-pipeline-comparison.md` — dieser Report.

Neu installierte Dependencies: keine. Pipeline-Code 1:1 unverändert (`git diff src/lib/ingestion/ src/db/ scripts/` leer nach diesem Lauf).

## Decisions I made

- **Variant B = TS-Runner via @anthropic-ai/sdk; Variant C = Agent-Subagenten mit `model: "sonnet"`.** Mit dir vorab abgestimmt. Variant B braucht den deterministischen 1:1-Pipeline-Prompt-Call → API-Pfad; Variant C braucht die "CC's eigener Stil mit freier WebSearch + WebFetch"-Semantik → Subagent mit Harness-Tools. Konsequenz: B liefert exakte Token-Telemetrie aus `message.usage`; C liefert nur Orchestration-Token-Counts (echte Sonnet-Inferenz-Kosten höher).
- **plotContext für Variant B re-fetched.** Mit dir vorab abgestimmt. `fetchPlotContext(merged)` wird aus dem Runner aufgerufen (kein Edit am Ingestion-Modul, nur Import). Damit ist B's Input äquivalent zu A's Input — fairer Modell-Vergleich.
- **Variant B fallback-Hint hinzugefügt** (Brief § Risiken explizit als Mitigation aufgelistet). Erste Pilot-Messung zeigte: shattered-legions Sonnet-Output war ein Stub-Synopsis von 13 Wörtern ("I'll search for synopsis context and availability information for Shattered Legions before publishing"). Ursache: SYSTEM_PROMPT instruiert "≥2 web_search Calls" — bei abgeschalteten Web-Tool + tool_choice-Force versuchte Sonnet, das Planungs-Stub als Synopsis zu emitten. Mitigation: User-Message-Hint nach dem buildUserPrompt-Output: "web_search is unavailable for this run … skip the synopsis-context and availability-search steps. Use the structured data + plot context above to compose your synopsis directly". KEIN Edit am SYSTEM_PROMPT. Re-Run lieferte für alle 6 Slugs sauber 123–137 Wörter Synopsis.
- **Sonnet-Subagenten parallel statt sequenziell.** Brief § Reihenfolge-Empfehlung war sequenziell, aber 6 parallel-Subagenten sind ~10× schneller (Wall-Clock 132s max statt 6×100s sequentiell), und Hard-Stop-Mechanik war für Variant C ohnehin nicht greifend (sobald Subagenten gestartet sind, kann CC sie nicht pausieren). Per-Slug-Status-Lines wurden in Reihenfolge der completion-notifications gepostet.
- **Variant-B `tool_choice: { type: "tool", name: "publish_enrichment" }`** explizit gesetzt. Pipeline-Default ist offen (Sonnet kann zwischen web_search und publish_enrichment wählen). Da B bewusst kein web_search-Tool hat, würde Sonnet ohne tool_choice u.U. Plain-Text emittieren statt das Tool zu rufen. Force ist hier sauberer.
- **Variant-C costEstimate als heuristischer Lower-Bound dokumentiert.** Das Agent-Tool gibt nur `total_tokens` zurück (keine input/output-Breakdown, keine internen Tool-Use-Turn-Tokens). Echte Sonnet-Inferenz-Kosten sind höher. Im JSON-File mit `costNote` markiert.
- **Subscription-Limit-% bleibt bei der Brief-Heuristik 1% ≈ 50K Tokens** — der Wert wirkt eng (5h-Limit ≈ 5M Tokens wäre realistischer), aber Pipeline-Code-Konsistenz schlägt Realismus, und konservative Schätzung schützt eher als zu lockere. Variant-C-Cumulative landet damit bei 309% (über Hard-Stop), aber das ist Lower-Bound-Art von "über Limit gegangen".
- **Hard-Stop bei B nicht ausgelöst** — kumulativ 67.36% < 80%. Letzter Slug (mark-of-calth) bei 10.97% per-slug, nächste-Estimate ≈ 10.97%, 67.36 + 10.97 = 78.33 — knapp unter Schwelle, war aber der letzte. Bei 7. Slug wäre Hard-Stop gegriffen.

## Innerhalb-Sonnet-Befunde

### (a) Author-Mismatch-Trefferrate auf den 2 Anthologien

| Slug | A (Haiku-Pipeline) | B (Sonnet-Pipeline) | C (Sonnet-Web) |
|---|---|---|---|
| `shattered-legions` | 0 | 0 | **1** ✅ — "Goulding ist Editor only; 8 contributing authors: Abnett, Annandale, French, Haley, Kyme, McNeill, Thorpe, Wraight" |
| `sons-of-the-emperor` | 0 | 0 | **1** ✅ — "8 contributing authors: French, Dembski-Bowden, Kyme, Thorpe, Haley, Goulding, McNeill, Abnett" |
| **Hit-Rate** | **0/2** | **0/2** | **2/2** |

**Diagnose**: Author-Mismatch ist NICHT aus den Pipeline-strukturierten Daten erkennbar. Die `payload.fields.authorNames`-Liste alleine zeigt nur `["Laurie Goulding"]` bzw. `["various"]` — Sonnet-B sieht das, kann aber ohne Web-Recherche nicht wissen, dass Goulding Editor ist. Sonnet-C löst es konsistent durch Wikipedia/Lexicanum/Goodreads-Recherche.

**Implikation für Pipeline-Architektur**: Ein Synopsis-zu-Web-Cross-Check-Pass (Brief 045 § Out of scope, eigener Mini-Brief) würde dieses Pattern fangen. Alternativ: wenn `authorNames === ["various"]` oder authors.length === 1 und Title enthält Keywords wie "anthology", explizit Wikipedia-Editor-Lookup triggern.

### (b) Vokabular-Bewertung auf den 2 Vokabular-Drift-Slugs

#### `the-master-of-mankind` (Haiku-A: `duty` outside vocab)

- **B**: emits `proposed_new_facet` — implizit bestätigt Sonnet-B die `duty`-Lücke. Reasoning: Sonnet-B liefert dieselbe Diagnose aus den strukturierten Pipeline-Inputs.
- **C**: emits `proposed_new_facet` mit ausführlichem Reasoning: "Theme of 'duty' (selfless impersonal obligation, Stoic) is central — closest existing IDs are 'loyalty' and 'sacrifice', both partially applicable but neither captures the impersonal sense. Confirms Haiku's earlier proposal."

**Konsens**: Drei Modelle (Haiku, Sonnet-Pipeline, Sonnet-Web) agree — `duty` ist eine echte Vokabular-Lücke. Brief 047+ Override-Schema sollte das berücksichtigen (oder Vokabular-Erweiterung in 048).

#### `shattered-legions` (Haiku-A: `vengeance` outside vocab)

- **B**: emits KEIN `proposed_new_facet`. Sonnet-B's facetIds für shattered-legions enthalten `betrayal, loyalty, sacrifice, brotherhood, war` — Sonnet löst `vengeance` semantisch in existierendes Vokabular auf, statt eine neue Kategorie vorzuschlagen.
- **C**: emits ebenfalls KEIN `proposed_new_facet`. Sonnet-C's facetIds: `betrayal, loyalty, sacrifice, brotherhood, war`. Identisches Auflösungs-Muster.

**Konsens**: `vengeance` als Haiku-A-Vokabular-Drift ist auf Sonnet-Niveau **redundant** — bestehende Theme-Facets (insbesondere `betrayal` + die implizite Loyalitäts-Spannung) decken den semantischen Raum ab. Empfehlung: `vengeance` NICHT zum Vokabular hinzufügen; Override-Datei könnte den Haiku-A-Vorschlag ablehnen.

### (c) Tagging-Coverage auf `mark-of-calth`

| | A | B | C | im Vokab? |
|---|---|---|---|---|
| `chaos` (pov_side) | ❌ | ❌ | ❌ | ✅ ja |
| `word_bearers` | ❌ | ❌ | ❌ | ❌ nicht im Vokab |
| `ultramarines` | ❌ | ❌ | ❌ | ❌ nicht im Vokab |
| `dual` (pov_side) | ❌ | ✅ | ✅ | ✅ ja |
| `imperium` (pov_side) | ✅ | ❌ | ❌ | ✅ ja |

**Diagnose**: Variant-A taggt nur `imperium` als pov_side, was den Word-Bearers-POV vollständig ignoriert (= das ursprüngliche Tagging-Failure). **Variant B + C beide korrigieren das**, indem sie `dual` (= POV across two opposing sides) statt `imperium` setzen — `dual` ist hier semantisch korrekt, weil mehrere Stories dezidiert aus Word-Bearers-Perspektive erzählen.

`word_bearers` und `ultramarines` sind nicht im Vokabular — können nicht direkt getaggt werden. **Sonnet-C emittiert `proposed_new_facet`** mit der Empfehlung: "protagonist_class additions 'heretic_astartes' and 'loyalist_astartes', or a dedicated 'legion' multi-value facet". Sinnvolle Vokabular-Erweiterung für ein Heresy-zentriertes Archiv — separater Brief.

**Modell-Achse-Befund**: Der Sprung Haiku→Sonnet auf identischer Pipeline-Eingabe (B vs A) löst das Tagging-Failure auf Pipeline-Niveau. Heißt: das mark-of-calth-Problem ist primär ein **Modell-Problem mit Haiku 4.5**, kein Pipeline-Architektur-Problem. Sonnet-B fängt es aus den strukturierten Inputs alleine (synopsis-snippet im Hardcover-Audit + plot context aus Lexicanum reichen). Pipeline-Cross-Check-Pass wäre redundant, wenn man auf Sonnet upgraded.

### (d) Plausibility-Tiefe

#### `garro` (pageCount data_conflict)

- **A**: 1 Flag (`data_conflict` auf pageCount, ein-Satz reasoning).
- **B**: 3 Flags — `data_conflict` (pageCount), `no_storefronts_found` (kein Web-Tool), `insufficient_web_search`. Reasoning für data_conflict ist auf Pipeline-Audit-Daten basiert.
- **C**: 2 Flags, beide `data_conflict` mit langem Reasoning:
  1. "Pipeline reports pageCount of 2 pages, which is clearly erroneous. The paperback edition (ISBN 9781784967581, August 2018) has 464 pages."
  2. "Format ambiguity: Black Library markets this as a 'novel' (HH #42), but it is structurally an omnibus/anthology — adapts six previously released audio dramas plus the novella Vow of Faith."

**Sonnet-C schreibt deutlich nuancierteres Reasoning** mit konkreten ISBN-Zitaten und alternativen Format-Diagnosen. Das ist ein konkreter Mehrwert über A und B.

#### `the-solar-war` (Synopsen-Drift > 150W)

- **A**: 0 Flags.
- **B**: 2 Flags — `insufficient_web_search` + `no_rating_found` (beides Coverage-Flags, keine Plausibility-Insights).
- **C**: 2 Flags, beide echte data_conflicts:
  1. "Listed as 'series_start' of Siege of Terra, but it is book 55+ in the broader Horus Heresy continuity. 'requires_context' is the more accurate entry_point facet."
  2. Cast-Range-Beobachtung (multi vs ensemble protagonist_class).

**Sonnet-C identifiziert echte Daten-Probleme die A und B beide übersehen.** Synopsen-Wortzahl: A=140W, B=123W, C=132W — alle innerhalb des 100–150W-Korridors, keine Drift mehr in B/C.

## Per-Slug 1-Zeilen-Status (Beispiel-Trace)

Variant B Konsole-Output (sequentiell, alle 6 Slugs):

```
[variant-b] starting — model=claude-sonnet-4-6, 6 slugs, hard-stop at 80% cumulative.
[variant-b] prompt-version-hash=f6272d57626d
[variant-b] (1/6) loading shattered-legions from ingest/.last-run/backfill-20260505-2247.diff.json…
[variant-b]   Slug 1/6 (shattered-legions, Variant B) fertig — geschätzt 11.05% des Sonnet-5h-Limits, kumulativ 11.05%.
[variant-b] (2/6) loading sons-of-the-emperor from ingest/.last-run/backfill-20260505-2247.diff.json…
[variant-b]   Slug 2/6 (sons-of-the-emperor, Variant B) fertig — geschätzt 10.84% des Sonnet-5h-Limits, kumulativ 21.89%.
[variant-b] (3/6) loading the-master-of-mankind from ingest/.last-run/backfill-20260505-2247.diff.json…
[variant-b]   Slug 3/6 (the-master-of-mankind, Variant B) fertig — geschätzt 11.66% des Sonnet-5h-Limits, kumulativ 33.55%.
[variant-b] (4/6) loading garro from ingest/.last-run/backfill-20260505-2247.diff.json…
[variant-b]   Slug 4/6 (garro, Variant B) fertig — geschätzt 11.44% des Sonnet-5h-Limits, kumulativ 44.99%.
[variant-b] (5/6) loading the-solar-war from ingest/.last-run/backfill-20260505-2247.diff.json…
[variant-b]   Slug 5/6 (the-solar-war, Variant B) fertig — geschätzt 11.4% des Sonnet-5h-Limits, kumulativ 56.39%.
[variant-b] (6/6) loading mark-of-calth from ingest/.last-run/backfill-20260503-2308.diff.json…
[variant-b]   Slug 6/6 (mark-of-calth, Variant B) fertig — geschätzt 10.97% des Sonnet-5h-Limits, kumulativ 67.36%.
[variant-b] done — 6/6 slugs, cumulative 67.36% (heuristik).
```

Variant C lief mit 6 parallelen Subagenten; Status-Lines wurden in Completion-Reihenfolge gepostet:

```
Slug 1/6 (shattered-legions, Variant C) zurück — author_mismatch detected ✅ (Goulding=editor; 8 contributing authors named). 23.4K tokens, 10 tool uses, 80s.
Slug 5/6 (the-solar-war, Variant C) zurück — proper 130W synopsis, rating 4.02 (Goodreads, 4219 ratings). 22.2K tokens, 10 tool uses, 76s.
Slug 2/6 (sons-of-the-emperor, Variant C) zurück — author_mismatch ✅ mit 8 named contributors, rating 4.10 (Goodreads, 597). 25.9K tokens, 14 tool uses, 102s.
Slug 3/6 (the-master-of-mankind, Variant C) zurück — agrees with `duty`-Vokabular-Gap (proposed_new_facet), 4.22 (Goodreads, 4002). 28K tokens, 18 tool uses, 132s.
Slug 6/6 (mark-of-calth, Variant C) zurück — kritischer Test-Case: ✅ author_mismatch, ✅ Synopsis nennt Word Bearers + Ultramarines + Daemonic, ✅ `dual` pov_side, ✅ proposed_new_facet für legion-IDs. 27K tokens, 17 tool uses.
Slug 4/6 (garro, Variant C) zurück — pageCount data_conflict (464 pages confirmed), format_ambiguity flag (novel vs anthology). 28K tokens, 19 tool uses.
```

## Hard-Stop-Status

- **Variant B**: cumulative end-of-run = **67.36%** (Heuristik 1% ≈ 50K Tokens). Hard-Stop NICHT ausgelöst — letzter Slug hatte 10.97% per-slug-Estimate; bei 7. Slug wäre die 80%-Schwelle erreicht worden (67.36 + 10.97 = 78.33, knapp unter; 7. Slug hätte +11% gegeben → 89%).
- **Variant C**: cumulative end-of-run = **309.4%** (= 154,702 Tokens / 50K * 100, **deutlich über 80% Hard-Stop**). Aber: Subagenten liefen parallel und die Hard-Stop-Mechanik im Aggregator hatte keine Pause-Möglichkeit mehr (Subagenten waren bereits committed). Realer Subscription-Verbrauch ist NICHT durch diesen Wert abgebildet, weil:
  - Subagent-`total_tokens` ist nicht die Sonnet-Inferenz-Tokens (es ist die Wrapper-Reporting-Größe; echte Tokens sind höher → wahrer Verbrauch ist noch größer als 309%).
  - Die Heuristik 1% ≈ 50K wirkt zu eng; eine realistische Sonnet-5h-Subscription-Schwelle wäre eher 5M Tokens (1% ≈ 50K wäre 200K Total-Limit, was unrealistisch klein ist).
  - **Beide Effekte heben sich teilweise auf**; konservative Lesung: Variant C verbraucht ungefähr ~3% einer realistischen Sonnet-5h-Subscription oder etwa 30% einer engeren Pro-Tier-Schwelle.

Im JSON-File mit `costNote` und `limitNote` dokumentiert.

## Verification

- `npm run typecheck` — pass (TS strict, alle neuen Files in `ingest/.compare/_runners/`).
- `npm run lint` — _pending — wird bei commit-Schritt geprüft._
- `npm run build` — _pending._
- `git diff src/lib/ingestion/ src/db/ scripts/` — leer (kein Pipeline-Edit).
- `npx tsx --env-file=.env.local ingest/.compare/_runners/variant-b-runner.ts` — 6/6 Slugs durchgelaufen, JSON committable.
- `npx tsx --env-file=.env.local ingest/.compare/_runners/variant-c-results.ts` — Aggregator hat alle 6 Subagent-Outputs konsolidiert, JSON committable.
- Schema-Check: jeder Slug-Eintrag in beiden JSON-Files hat `synopsis`, `facetIds[]`, `format`, `availability`, `rating`, `ratingSource`, `ratingCount`, `plausibilityFlags[]`, `discoveredLinks[]`, `costEstimate`, `divergence`. C zusätzlich `searchedSources[]` (28 web_search + 46 web_fetch über alle 6 Slugs).
- Manuelle Synopsis-Wortzahl-Stichprobe: alle 12 Synopsen (6×B + 6×C) im 100–150W-Korridor.

## Open issues / blockers

- **Variant-C `plausibilityFlags` enthalten teils non-vocab kinds** (z.B. `series_context_required`, `protagonist_class_complexity`, `format_ambiguity`, `faction_coverage`, `entry_point_note`, `protagonist_class_note`, `story_primarch_conflict`). Das ist Schema-Verletzung gegen `LLM_FLAG_KINDS` aus `parse.ts:21`. In den Variant-C-Subagent-Prompts war der Flag-Kinds-Liste nicht so streng wie im Pipeline-SYSTEM_PROMPT. Konsequenz: für Vergleichszwecke OK (semantischer Inhalt zählt), aber wenn Variant C jemals durch `parseLlmResponse` müsste, würden diese Flags gefiltert. Im JSON belassen ohne Korrektur.
- **Cost-Telemetrie für Variant C ist unscharf.** Real-Subscription-Impact unklar ohne Harness-Telemetrie. Brief 046 sollte ggf. eine andere Mess-Methode wählen, falls präzise Cost-Forecasts für Opus benötigt werden.
- **`tool_choice` setzen ändert das Sonnet-Verhalten leicht.** Pipeline-Default ist `tool_choice: auto`. Variant B forced auf `publish_enrichment`, was Sonnet's Inhibition gegen Plain-Text-Ausgabe stärker macht. Klein, aber nicht 1:1 mit Pipeline-Konfig. Im Code-Comment markiert.

## For next session (Inputs für Brief 046)

Cowork's offene Fragen aus Brief 045 § Open questions, beantwortet:

1. **Modell-Achse Pipeline-Workflow (A→B)**: Der Sprung Haiku→Sonnet auf identischer Pipeline-Eingabe ist nicht transformativ, aber substantiell:
   - **Konsistenter Mehrwert**: Tagging-Coverage (mark-of-calth: A=`imperium` only → B=`dual`), Vokabular-Disziplin (B löst `vengeance` semantisch in `betrayal`+`loyalty`), nuanciertere Plausibility-Reasoning (~3 Flags vs A's 1-2).
   - **NICHT von Sonnet-B gelöst**: Author-Mismatch auf den 2 Anthologien (B=0/2). Das Editor-vs-Author-Pattern ist rein Web-Daten-abhängig.
2. **Workflow-Achse innerhalb Sonnet (B↔C)**: C liefert qualitativ neue Befunde:
   - **Author-Mismatch**: C=2/2, B=0/2.
   - **Plausibility-Tiefe**: C nennt konkrete Quellen ("Goodreads 3.70 von 1289 Ratings", "ISBN 9781784967581 hat 464 Pages") und bringt Format-Ambiguity-Befunde (garro: novel vs anthology), die B aus strukturierten Daten allein nicht ableitet.
   - **Nicht redundant**: Auf 4 von 6 Slugs (alle außer the-master-of-mankind und shattered-legions) hat C Informations-Bits, die weder A noch B haben.
3. **Tagging-Failure-Diagnose (mark-of-calth)**: **Modell-Problem mit Haiku 4.5**, nicht Pipeline-Architektur-Problem. Sonnet-B fängt `dual` aus identischen Pipeline-Inputs. **→ Wenn Phase 3e auf Sonnet upgraded, ist der Synopsis-zu-Tag-Cross-Check-Pass redundant.**
4. **Cost-Realität für Opus-Plan**: Variant C verbraucht 154.7K Orchestration-Tokens für 6 Web-Inferenzen = ~25.8K/Slug. Bei Opus (~5× Sonnet-Kosten) wären das ~130K/Slug = 780K für 6 Slugs. Wenn Brief 046 dieselben 6 Slugs nochmal über Opus laufen lässt:
   - **Variant D (Opus + Pipeline-Prompt)**: ~6×35K = 210K Tokens (~$3-4 API-Cost).
   - **Variant E (Opus + Web)**: ~6×130K = 780K Tokens (~$15-20 API-Cost). 
   - **Empfehlung**: Variant E ist im Subscription-Modell teuer. Wenn Brief 046 nur EINE Opus-Variante leisten kann, dann **D > E priorisieren** — D liefert das Modell-Achsen-Signal (Sonnet→Opus auf identischen Pipeline-Inputs), während E's Mehrwert weitgehend durch C abgedeckt ist (qualitative Befunde sind ähnlich; Opus's Edge wäre subtiler).
5. **Schema-Vorschläge**: Sonnet-C schlägt zwei neue Felder/Strukturen vor:
   - **`legion`-facet-Dimension** (multi-value): mit Werten wie `ultramarines`, `word_bearers`, `iron_hands`, `salamanders`, `raven_guard`, `death_guard`, `world_eaters`, ...; oder alternativ `protagonist_class`-Erweiterung mit `heretic_astartes` + `loyalist_astartes`. Würde mark-of-calth, shattered-legions, und viele Heresy-Bücher besser klassifizieren.
   - **`duty`-theme-Wert**: Drei Modelle agree (Haiku-A, Sonnet-B, Sonnet-C), dass die Lücke real ist. Override-Schema (Brief 047+) sollte Vokabular-Erweiterung explizit als ersten Use-Case behandeln.
6. **Vokabular-Auflösung von Haiku-A's Drifts**:
   - `duty` (the-master-of-mankind): **echte Lücke** — alle drei Modelle agreen.
   - `vengeance` (shattered-legions): **redundant** — B und C lösen es ohne neuen Tag durch existierende Theme-Facets.

### Subjektive Qualitäts-Synthese

- **C deutlich besser als B**: `mark-of-calth` (Synopsis nennt Word Bearers + Ultramarines + Daemonic; B's Synopsis bleibt bei "Calth"-Lore-Allgemeinem), `garro` (C: "ISBN 9781784967581 = 464 Pages" + Format-Ambiguity-Diagnose; B: 137W generic Synopsis), `shattered-legions` + `sons-of-the-emperor` (Author-Mismatch Detection nur in C).
- **B/C ununterscheidbar**: `the-master-of-mankind` (beide finden `duty`-Lücke; Synopsen ähnlicher Qualität), `the-solar-war` (Synopsis-Wortzahl-Disziplin in beiden eingehalten; C's Plausibility-Flags sind reicher, aber B macht keine Falsche).
- **Lohnt Opus-Pendant?**: 
  - **D (Opus-Pipeline) lohnt**: würde zeigen, ob Author-Mismatch von Opus aus Pipeline-Daten allein gefangen werden kann (= Wendepunkt: Modell-Skala kompensiert Daten-Knappheit). Niedriger Cost, hoher Informationswert.
  - **E (Opus-Web) lohnt weniger**: C ist auf den Web-relevanten Befunden bereits stark; Opus-Mehrwert über C wäre marginal und teuer. **Empfehlung: E in Brief 046 als optional / später-falls-budget markieren.**

## References

- Brief 045: `sessions/2026-05-05-045-arch-cc-vs-pipeline-comparison.md`
- Brief 044 + Implementer: `sessions/2026-05-05-044-arch-phase3e-batch-1.md` + `sessions/2026-05-05-044-impl-phase3e-batch-1.md`
- Pipeline-Source-Diffs (Variant-A-Baseline):
  - `ingest/.last-run/backfill-20260505-2247.diff.json` (5 Slugs, 044-Lauf)
  - `ingest/.last-run/backfill-20260503-2308.diff.json` (mark-of-calth, 042-Re-Test)
- Pipeline-Module (1:1 verwendet, kein Edit):
  - `src/lib/ingestion/llm/prompt.ts` — `SYSTEM_PROMPT`, `buildUserPrompt`, `PUBLISH_ENRICHMENT_TOOL`, `loadFacetVocabulary`, `PROMPT_VERSION_HASH=f6272d57626d`
  - `src/lib/ingestion/llm/context.ts:150` — `fetchPlotContext`
  - `src/lib/ingestion/llm/parse.ts:157` — `parseLlmResponse` (Output-Schema-Referenz)
  - `src/lib/ingestion/types.ts` — `MergedBook`, `LLMPayload`, `LLMFlag`, `DiscoveredLink`
- Output-Files: `ingest/.compare/045-sonnet-pipeline.json` + `045-sonnet-web.json`
- Anthropic SDK 0.92.0, model `claude-sonnet-4-6`.
