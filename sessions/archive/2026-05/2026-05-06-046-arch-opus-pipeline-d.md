---
session: 2026-05-06-046
role: architect
date: 2026-05-06
status: archived
slug: opus-pipeline-d
parent: null
links:
  - 2026-05-05-045
  - 2026-05-05-044
  - 2026-05-04-042
  - 2026-05-08-047
commits: []
---

> **⚠ ZURÜCKGEZOGEN — vor Handover an CC.**
>
> Dieser Brief wurde nie an Claude Code übergeben. Stand 2026-05-08 hat ein externer Code-Review (Codex) sechs Pipeline-Findings geliefert, die alle am Code verifiziert wurden. Die wichtigsten zwei davon (Lore-Coverage 0/50 für Junctions; Source-Kind-Enum-Loch für `wikipedia`/`open_library`/`hardcover`/`llm`) sind strukturelle Pipeline-Mängel, die VOR jeder weiteren Modell-Vergleichs-Iteration gezogen werden müssen. Wenn die Pipeline 047 nicht überstanden hat, ist ein vierter Modell-Quadrant nicht aussagekräftig — die Daten, gegen die Opus testen würde, ändern sich durch 047 substanziell (neue Junction-Felder, gehärtete Format-Validation, Hardcover-Author-Hint im Prompt-Context, OL-Edition-Filter).
>
> Die Modell-Achse bleibt eine offene Frage, aber:
> - Die 045-Befunde reichen für die nächste Modell-Entscheidung (Haiku bleiben vs Sonnet-Upgrade) bereits aus. Sonnet-B löst `dual` vs `imperium`, ist 3× teurer; Author-Mismatch ist Pipeline-Hebel (047), nicht Modell-Hebel.
> - Wenn nach 047 noch eine offene Modell-Frage bleibt — speziell „Skaliert Opus die Pipeline-Inputs nochmal nuancierter als Sonnet?" — wird das in einem späteren Brief gegen die GEHÄRTETE Pipeline gemessen, nicht gegen die heutige.
> - Cost-Erwartung war ~$1–3 USD und damit niedrig genug, dass es kein hartes Resource-Argument für die Rücknahme gibt — es ist eine Reihenfolge-Entscheidung, kein Sparzwang.
>
> Reflexion: 045 + 046 als Modell-Vergleichsmatrix waren wertvoll für die qualitative Befund-Tiefe (insbesondere die Erkenntnis dass Author-Mismatch ein Pipeline-Hebel ist), aber der Vier-Quadranten-Anspruch übergewichtet die Modell-Achse gegenüber der Pipeline-Architektur-Achse. Codex' Review hat die richtige Frage-Reihenfolge wieder gerade gerückt: Erst Pipeline härten, dann Modell-Wahl.

# Opus-Pipeline-Variante D + Cross-Aggregat aller vier Varianten

## Goal

Den Opus-Quadrant der Vergleichsmatrix nur in einer Variante komplettieren: **D = Opus + Pipeline-Inputs 1:1 + Pipeline-System-Prompt 1:1, kein Web** auf den selben 6 Slugs aus 045. Plus ein Cross-Aggregat-File `ingest/.compare/045-aggregate.json` mit allen vier dann verfügbaren Varianten (A Pipeline-Haiku, B Sonnet-Pipeline, C Sonnet-Web, D Opus-Pipeline) und drei Achsen-Befunden (modelStrength A→B→D, workflowStrength B↔C, plus Diagonal-Befund A vs C).

**Variante E (Opus + Web) ist explizit out of scope.** CC's 045-Empfehlung folgt: C deckt den Web-Workflow-Mehrwert bereits ab, E würde nur marginal nuancieren bei deutlich höherem Subscription-Verbrauch (~5× Sonnet-Web pro Slug). Falls nach 046 noch eine Frage offen bleibt, die nur E beantworten könnte, wäre das ein eigener späterer Mini-Brief — nicht jetzt vorbeugend.

## Context

Stand am 2026-05-06 nach 045-impl-Report (Sonnet-Quadrant fertig):

- **045 hat eine wichtige Hypothese-Verschiebung produziert:** Author-Mismatch auf den 2 Anthologien — A=0/2, **B=0/2**, C=2/2. Sonnet-Pipeline löst es NICHT aus identischen Pipeline-Inputs. Das ist Pipeline-Architektur (die Hardcover-Liste mit den echten 8–9 Autoren landet nicht im `buildContext()` für das LLM, nur die Wikipedia-`authorNames`-Liste mit oft nur dem Editor). Die offene Modell-Achsen-Frage: **löst Opus es aus den selben strukturierten Inputs?** Wenn ja — Modell-Skala kompensiert Daten-Knappheit, und Phase-3e-Modell-Wahl wird der primäre Hebel. Wenn nein — Pipeline-Architektur ist eindeutig der Hebel, Modell-Skala sekundär.
- **Tagging-Coverage in 045:** Sonnet-B löst `dual` vs `imperium` (Modell-Hebel funktioniert für POV-Side-Erkennung), aber `chaos` als Faction-pov_side wurde von keinem der drei Modelle gesetzt — gemeinsamer Blind-Spot. Frage an Opus-D: setzt Opus konsequenter Faction-Tags, oder hat es denselben Blind-Spot?
- **Plausibility-Tiefe in 045:** A=1–2 Flags, B=~3 Flags, C=2 Flags mit substantiell tieferem Reasoning (ISBN-Zitate, Format-Ambiguity-Befunde). Frage an Opus-D: liegt Opus's Reasoning-Tiefe näher an Sonnet-B (Pipeline-Inputs allein) oder an Sonnet-C (Web-Recherche)?
- **Cost-Telemetrie in 045 ist sauber für B (API-Pfad), unscharf für C (Subagenten).** Variant B 33.7K Tokens via `@anthropic-ai/sdk` direkt messbar. Variant C 154.7K Orchestration-Tokens — nicht die echten Sonnet-Inferenz-Tokens. Für Variant D in dieser Session: API-Pfad analog zu B, damit Cost-Vergleich Sonnet→Opus präzise ist.
- **Source-Diffs für die 6 Slugs sind unverändert** — 5 Slugs aus `ingest/.last-run/backfill-20260505-2247.diff.json` (044), 1 Slug (`mark-of-calth`) aus `ingest/.last-run/backfill-20260503-2308.diff.json` (042 Re-Test). CC nutzt die Loader-Helpers aus `ingest/.compare/_runners/` die in 045 entstanden sind — kein Neubau nötig.

## Constraints

- **Slug-Liste fixiert auf die selben 6 wie 045.** Keine Erweiterung, keine Tausch-Aktion. Liste in § Notes.
- **Nur eine Variante in dieser Session: D.**

  | Variante | Modell | Inputs | System-Prompt | WebSearch | Output-File |
  |---|---|---|---|---|---|
  | **D** | Opus (aktuelles Major) | Pipeline-Crawler-Audit aus Source-Diffs (re-fetched plotContext via `fetchPlotContext` analog zu 045-B) | Pipeline-Prompt 1:1 aus `src/lib/ingestion/llm/prompt.ts` + identischer fallback-Hint wie in 045-B (Web-unavailable-note) | KEINE | `ingest/.compare/046-opus-pipeline.json` |

  Modell-String wählt CC (z.B. `claude-opus-4-...` aktuelles Major). Pinning-Disziplin gilt — wenn ein bestimmtes Major nötig ist, im Code-Comment dokumentieren, im Brief steht keine Versions-Zahl.

- **Output-Schema = `parseEnrichmentPayload`-kompatibel**, identisch zu 045-B's Form (synopsis, facetIds, format, availability, rating + ratingSource + ratingCount, plausibilityFlags, discoveredLinks, plus `costEstimate` + `divergence`). `divergence` pro Slug enthält Markdown-Notiz für Variant D vs. **alle drei Vorgänger-Varianten** (A, B, C) — also drei kurze Vergleichs-Sätze pro Slug, nicht nur einer.

- **API-Pfad wie 045-B**, nicht Subagent-Pfad. CC nutzt `@anthropic-ai/sdk` direkt aus einem TS-Runner (analog zu `variant-b-runner.ts`). Begründung: präzise Token-Telemetrie für die Cost-Vergleichs-Aussage Sonnet→Opus.

- **Per-Slug `costEstimate`-Feld** wie in 045 — `subscriptionTier: "opus"` (oder `"opus-api"` falls über API direkt + Token-Burning), `inputTokens`, `outputTokens`, `webSearchCalls: 0`, `estimatedLimitPercent`, `cumulativeLimitPercent`. Hard-Stop bei `cumulative + nextEstimate > 80`.

- **Per-Slug 1-Zeilen-Status an Philipp im Chat** wie in 045-B: Slug-Index/Total + Variante + per-Slug-% + kumulativ-%.

- **Cross-Aggregat-File `ingest/.compare/045-aggregate.json`** als zweites Output-Artefakt dieser Session. Trotz `045-`-Prefix gehört es zu diesem Brief — sammelt die vorherigen Varianten zur Cross-Auswertung. Schema in § Notes.

- **Pipeline-Code unverändert.** Kein Edit in `src/lib/ingestion/**`, `scripts/**`, `src/db/**`. Loader-Helpers aus `ingest/.compare/_runners/` (045-Aufbau) dürfen wiederverwendet werden, neuer Runner `variant-d-runner.ts` analog zu `variant-b-runner.ts`.

- **`ingest/.compare/` bleibt committed.**

- **Subscription-vs-API-Klärung dokumentieren.** Im Report § „What I did" klar stellen: API-Token-Burning (über `.env.local`-Anthropic-Key) oder echte Subscription-Inferenz. Falls API: konkrete USD-Cost im Report. Falls Subscription: Limit-Verbrauchs-Schätzung.

## Out of scope

- **Variante E (Opus + Web).** Skipped per CC-Empfehlung aus 045-impl. Falls 046's Befunde eine spezifische E-Frage offenlassen, separater Mini-Brief später.
- **Pipeline-Architektur-Hebel** (Hardcover-Liste in `buildContext()` reingeben). Eigener Brief vor Phase-3e-Fortsetzung. Carry-Over-Item.
- **Phase-3e-Modell-Entscheidung** (Haiku-bleiben vs Sonnet-Upgrade vs Opus-Upgrade). Wartet auf 046's Cross-Aggregat. Eigener Brief nach 046.
- **Vokabular-Erweiterungen** (`duty` promoten, `legion`-Faceten-Dimension, `chaos`-pov_side-Pattern-Tweak). Eigener Brief.
- **DB-Apply, Hand-Check-Workflow, Override-File-Schema.** Wie immer in Phase 3, kommt nach Modell-/Pipeline-Entscheidungen.
- **Pipeline-Prompt-Refactor.** Wenn CC während des Opus-Laufs sieht „dieser Prompt-Hint würde besser funktionieren": Befund notieren, NICHT fixen.

## Acceptance

The session is done when:

- [ ] **`ingest/.compare/046-opus-pipeline.json`** committed mit Einträgen für alle 6 Slugs im `parseEnrichmentPayload`-Schema + `costEstimate` + `divergence`-Markdown (vs A, B, C). Per-Slug-Cost-Telemetrie aus `message.usage` (input/output Tokens präzise).
- [ ] **`ingest/.compare/045-aggregate.json`** committed mit allen 4 Varianten pro Slug + drei Cross-Achsen-Befunden:
  - **modelStrength** (A→B→D auf Pipeline-Workflow): wie groß ist der Sprung Haiku→Sonnet→Opus? Plateau oder weiter Wachstum?
  - **workflowStrength** (B↔C innerhalb Sonnet): liefert Web qualitativ neue Befunde über Pipeline-Inputs?
  - **diagonalFinding** (A vs C, billigstes-vs-Web-Workflow): Cost-Quality-Trade-off-Aussage.
- [ ] **Author-Mismatch-Diagnose** explizit im Aggregat: D=2/2 oder D=0/2? Antwort entscheidet, ob Modell-Skala Pipeline-Daten-Knappheit kompensieren kann oder nicht.
- [ ] **Plausibility-Tiefe-Vergleich D vs C:** schreibt Opus auf Pipeline-Daten allein nuancierteres Reasoning als Sonnet-Web mit eigener Recherche, oder fehlt Opus-D weiterhin der Web-Cross-Check-Teil?
- [ ] **Tagging-Coverage** auf `mark-of-calth` mit D-Spalte: setzt Opus `dual` (wie B) plus eventuell `chaos`? Oder hat es den selben Blind-Spot?
- [ ] **Subscription-vs-API-Klärung im Report** dokumentiert: über API ($x.xx Cost) oder Subscription (~y% Limit-Verbrauch)?
- [ ] **Subjektive Empfehlung von CC** in „For next session": basierend auf den 4 Varianten — welcher Modell-Workflow-Pfad sollte Phase-3e-Restlauf nehmen? Welcher der drei Architektur-Hebel (Pipeline-Hardcover-Context-Fix vs Phase-3e-Modell-Upgrade vs Vokabular-Erweiterung) liefert die größte Quality-pro-Cost-Verbesserung?
- [ ] `npm run typecheck` grün, `npm run lint` grün, `npm run build` grün. Kein Pipeline-Edit.

## Open questions

Inputs für die nächste Brief-Generation (Phase-3-Architektur-Entscheidungen):

- **Modell-Plateau-Frage:** ist Opus deutlich besser als Sonnet auf Pipeline-Inputs, oder ist Sonnet bereits am Plateau? Konkret: schließt Opus-D die Author-Mismatch-Lücke, die B nicht schließen konnte?
- **Cost-Realität für Phase-3e-Vollumstellung:** wenn Opus signifikant besser ist, was würde ein 800-Buch-Phase-3e-Lauf mit Opus kosten? (Opus API ~$15/MTok input, $75/MTok output → wenn Token-Verbrauch ähnlich Haiku-Pipeline ist, wären das ~$1500–2000 für 800 Bücher; wahrscheinlich nicht praktikabel — aber gut zu wissen).
- **Plausibility-Tiefe Pipeline-Niveau:** kommt Opus-Pipeline an Sonnet-Web's Tiefe (ISBN-Zitate, Format-Ambiguity-Befunde) heran, oder bleibt Web-Recherche der einzige Weg dahin?
- **Faction-Tagging-Coverage:** löst Opus-D den `chaos`-pov_side-Blind-Spot von 045? Oder ist das ein Modell-übergreifendes Pattern, das eine Prompt-Härtung braucht?
- **Subscription-Realität für Opus:** wenn CC den API-Pfad wählt (was ich vorgeschlagen habe), bleibt Subscription-Limit unbenutzt — gut für anderen Workflow. Falls Subscription doch genutzt wird: wie viel Headroom bleibt für ein eventuelles späteres E?

## Notes

### Die 6 Slugs (identisch zu 045)

| # | Slug | Source-Diff | Test-Zweck |
|---|---|---|---|
| 1 | `shattered-legions` | `backfill-20260505-2247.diff.json` (044) | Anthologie 9 Autoren + value_outside_vocabulary `vengeance` + no_rating_found |
| 2 | `sons-of-the-emperor` | `backfill-20260505-2247.diff.json` (044) | Anthologie (Author-Mismatch-Pattern-Validierung) |
| 3 | `the-master-of-mankind` | `backfill-20260505-2247.diff.json` (044) | value_outside_vocabulary `duty` |
| 4 | `garro` | `backfill-20260505-2247.diff.json` (044) | pageCount data_conflict + Hardcover-Lücke |
| 5 | `the-solar-war` | `backfill-20260505-2247.diff.json` (044) | Synopsen-Drift > 150W bei Haiku |
| 6 | `mark-of-calth` | `backfill-20260503-2308.diff.json` (042 Re-Test) | Tagging-Failure: Faction-pov_side, Word Bearers/Ultramarines/Chaos in Synopsis aber nicht in facetIds |

Variant D liest pro Slug aus dem Source-Diff `payload.fields` + `rawHardcoverPayload` + `payload.fieldOrigins`, ruft `fetchPlotContext` zur frischen Plot-Daten-Beschaffung (analog 045-B), baut `buildUserPrompt(...)` und ruft Opus-API mit `SYSTEM_PROMPT` 1:1 + `tool_choice: { type: "tool", name: "publish_enrichment" }` und `tools: [PUBLISH_ENRICHMENT_TOOL]` (KEIN `WEB_SEARCH_TOOL`).

### Cross-Aggregat-Schema

```jsonc
// ingest/.compare/045-aggregate.json
{
  "comparedAt": "2026-05-06T...Z",
  "promptVersionHash": "f6272d57626d",
  "sourcedFrom": ["backfill-20260505-2247", "backfill-20260503-2308"],
  "variants": ["pipeline-haiku-A", "sonnet-pipeline-B", "sonnet-web-C", "opus-pipeline-D"],
  "slugs": {
    "shattered-legions": {
      "A": { /* aus 044-Diff `payload.fields` + zugehörige llm_flags */ },
      "B": { /* aus 045-sonnet-pipeline.json */ },
      "C": { /* aus 045-sonnet-web.json */ },
      "D": { /* aus 046-opus-pipeline.json */ },
      "crossDivergence": "Author-Mismatch: A=0, B=0, C=✓, D=?. Synopsis-Length: A=138, B=137, C=137, D=?. Vokabular: A flagt vengeance outside, B/C lösen ohne neuen Tag (betrayal+loyalty), D=?. Plausibility-Flags: A=1, B=2, C=1+author_mismatch, D=?."
    }
    /* … 5 weitere Slugs … */
  },
  "axisFindings": {
    "modelStrength": "...",        // A→B: Sonnet löst Tagging-Coverage. B→D: Sprung in Plausibility-Tiefe? Author-Mismatch?
    "workflowStrength": "...",     // B↔C: Web liefert Author-Mismatch + ISBN/Goodreads, kein anderes wesentlich Neues
    "diagonalFinding": "..."       // A vs C: Cheap-Pipeline-vs-Smart-Web. Konkret: welche Slugs ist die Quality-Lücke groß?
  },
  "costSummary": {
    "A": { "method": "pipeline-api-haiku-with-web", "perSlug": "$0.118 (extrapoliert aus Batch 1)" },
    "B": { "method": "sonnet-api-no-web", "perSlug": "$0.03 (33.7K total / 6)" },
    "C": { "method": "cc-subagent-sonnet-with-web", "perSlug": "~$0.07 (gestützte Schätzung; echte Inferenz-Tokens > Orchestration-Tokens)" },
    "D": { "method": "...", "perSlug": "..." }
  },
  "phase3eModelRecommendation": "..."   // CC's freier-Text-Punktion: welcher Modell-Pfad für die restlichen 750 Bücher?
}
```

### Reihenfolge-Empfehlung

1. Variant D laufen lassen, alle 6 Slugs sequenziell via API-TS-Runner (analog 045-B).
2. Cross-Aggregat-File schreiben — pro Slug die A/B/C/D-Spalten zusammenstellen, `crossDivergence`-Notiz formulieren, Achsen-Befunde aggregieren.
3. Subjektive Empfehlung in „For next session" formulieren.

### Cost-Erwartung

Opus API-Pricing: ~$15/MTok input, ~$75/MTok output. Sonnet-B brauchte 33.7K Tokens für 6 Slugs (~5.6K/Slug, ratio ~80% input / 20% output). Bei gleichem Token-Profil mit Opus: 6 × 5.6K = 33.6K, davon ~27K input ($0.40) + 6.7K output ($0.50) ≈ **$1 USD für Variant D total**. Wahrscheinliche Realität ist 2–3× höher (Opus tendiert zu längerem Output) — also ~$2–3 USD. Klein.

Wenn CC stattdessen Subscription-Pfad wählt: ~5–15% des Opus-5h-Limits.

### References

- Brief 045 + Report 045-impl: `sessions/2026-05-05-045-arch-cc-vs-pipeline-comparison.md` + `sessions/2026-05-05-045-impl-cc-vs-pipeline-comparison.md`
- 045-Output-Files: `ingest/.compare/045-sonnet-pipeline.json` + `045-sonnet-web.json`
- 045-Runner als Vorlage: `ingest/.compare/_runners/variant-b-runner.ts` (analog für `variant-d-runner.ts`), `divergence.ts`, `load-slug-data.ts`
- Pipeline-Module (1:1 verwendet, kein Edit): `src/lib/ingestion/llm/prompt.ts`, `context.ts`, `parse.ts`, `types.ts`
- Source-Diffs für Variant-A-Spalte im Aggregat: `backfill-20260505-2247.diff.json` (5 Slugs), `backfill-20260503-2308.diff.json` (mark-of-calth)
