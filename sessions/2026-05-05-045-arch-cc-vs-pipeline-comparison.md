---
session: 2026-05-05-045
role: architect
date: 2026-05-05
status: open
slug: cc-vs-pipeline-comparison
parent: null
links:
  - 2026-05-05-044
  - 2026-05-04-042
  - 2026-05-03-039
commits: []
---

# CC-vs-Pipeline-Vergleich auf 12 Slugs aus Batch 1

## Goal

Apple-to-Apple-Vergleich zwischen Pipeline-LLM-Schicht (Haiku 4.5 via Anthropic-API) und CC-LLM-Schicht (Sonnet 4.6 via Subscription-Inferenz) auf 12 ausgewählten Büchern aus Batch 1 (Brief 044). CC liest die existierenden Crawler-Audit-Payloads aus dem Pipeline-Diff, produziert die LLM-Schicht (Synopsis + Facets + Format/Availability + Plausibility-Cross-Check + Rating-Capture) komplett neu und schreibt einen Vergleichs-File. Ziel ist eine harte Aussage zu der Frage: *„Lohnt sich der Hand-Check über die ~150 Prestige-Bücher mit Sonnet/CC, oder ist Haiku-Output gut genug?"*

Subscription-Cost statt API-Cost — CC nutzt seine native Sonnet-4.6-Inferenz, kein API-Token gegen die Anthropic-API. Wandzeit-Erwartung: 30–60 min für 12 Slugs, abhängig vom Subscription-Tier und Tool-Use-Loop-Overhead.

## Context

Stand am 2026-05-05 nach Batch 1 (Report 044-impl):

- **Pipeline-Diff `ingest/.last-run/backfill-20260505-2247.diff.json` ist die Wahrheits-Quelle für die Inputs.** Pro Slug enthält das Diff: `payload.fields.*` (alle merged Felder inkl. Synopsis, Facets, Format/Availability, Rating, ReleaseYear, etc.), `payload.fieldOrigins.*` (welche Quelle hat welches Feld geliefert), `rawLlmPayload.*` (was der Haiku-Lauf produziert hat: discoveredLinks, facetIds, plausibility-Begründungen), `rawHardcoverPayload.*` (Tags, Rating, Author-Liste — letzteres oft komplett anders als Wikipedia). Plus die Top-Level-`llm_flags` mit Slug-Anker, gruppierbar via `flag.slug`.
- **Haiku-Schwäche bestätigt durch zwei Läufe (042 + 044, 70 Bücher kumulativ):** 0× `author_mismatch` LLM-Flag trotz mind. 5 Multi-Author-Anthologien in Batch 1 (`shattered-legions` mit 9 Autoren, plus `sons-of-the-emperor`, `heralds-of-the-siege`, `blood-of-the-emperor`, `the-burden-of-loyalty`, `scions-of-the-emperor`, `the-lords-of-terra`). Haiku verlässt sich auf den Wikipedia-Author-Field, der bei Compilations oft nur den Editor listet. Side-Channel: Hardcover-Crawler liefert die echte Autorenliste, aber der LLM-Plausibility-Cross-Check sieht das nicht als Konflikt.
- **Vokabular-Drift reproduzierbar bei `duty`** (5/70 Bücher kumulativ — `praetorian-of-dorn` aus 042 plus `the-master-of-mankind`, `wolfsbane`, `saturnine`, `blood-of-the-emperor` aus 044). Plus `vengeance` (1×, `shattered-legions`), `fate` (1×, `ruinstorm`). Haiku flagt das konsistent als `value_outside_vocabulary`, NICHT als `proposed_new_facet`. Frage an den Vergleich: produziert Sonnet/CC bessere Facet-IDs aus dem existierenden Vokabular für diese Bücher, oder erkennt es die selbe Lücke?
- **Synopsen-Drift bei Haiku 5/50 = 10% über 150 Wörtern** (`the-solar-war` 157 W, `the-first-wall` 154 W, `perturabo-the-hammer-of-olympia` 152 W, `jaghatai-khan-warhawk-of-chogoris` 152 W, `lion-eljonson-lord-of-the-first` 153 W) — alle Siege-of-Terra-Climax oder Primarchs-Volumes mit reichen Plot-Webs. Kein Underflow.
- **CC operiert nicht in der Pipeline-Codebasis.** CC's Output ist ein neues File, nicht ein Pipeline-Re-Run. Das schützt die Pipeline-Engine vor unintended changes und macht den Vergleich reproduzierbar (das Vergleichs-File ist Zeit-stabil committed).

## Constraints

- **Slug-Range fixiert auf 12 Bücher.** Nicht erweitern, nicht verkleinern. Liste siehe § Notes.
- **Subscription-Cost-Pfad — keine Anthropic-API-Calls.** CC nutzt seine native Sonnet-4.6-Inferenz. Wenn das Subscription-Limit während des Laufs greift (Pause/Cooldown), das ist erwartetes Verhalten — Lauf splittet sich auf 2–3 CC-Sessions, jede mit Read am Diff-File und partiellem Update am Vergleichs-File. Nicht auf API-Token ausweichen.
- **Inputs ausschließlich aus dem Pipeline-Diff.** CC liest pro Slug aus `ingest/.last-run/backfill-20260505-2247.diff.json` die folgenden Felder: `payload.fields.*` (gibt die merged Wahrheit), `payload.fieldOrigins.*` (Source-Attribution), `rawHardcoverPayload.*` (Tags, Rating, **Hardcover-Author-Liste** — wichtig für Anthologie-Plausibility), und die zugehörigen `llm_flags` aus dem Top-Level-Array (Filter via `flag.slug === <slug>`). Keine zusätzlichen WebFetch/WebSearch-Calls — der Vergleich soll testen, was Sonnet aus den selben Inputs zaubert. Wenn CC zusätzliche Web-Searches braucht um eine Aussage zu treffen, das ist ein Befund („Sonnet kann ohne extra-Recherche nicht klassifizieren"), kein Acceptance-Schritt.
- **System-Prompt-Quelle: Pipeline-Prompt 1:1, NICHT CC's freier Stil.** CC liest `src/lib/ingestion/llm/prompt.ts` und nutzt den dort definierten `SYSTEM_PROMPT` plus die `buildContext(...)` Plot-Context-Form als Modell-Input. Reiner Modell-Vergleich (Sonnet 4.6 vs. Haiku 4.5 mit identischem Prompt + identischen Inputs). Wenn CC den Prompt-Stil anders haben will: Befund im Report dokumentieren, NICHT in dieser Session umschreiben.
- **Output-Schema: Pipeline-LLM-Output 1:1.** CC's Vergleichs-File `ingest/.compare/045-cc-vs-pipeline.json` hat pro Slug exakt die Feld-Form, die `parseEnrichmentPayload(...)` aus `src/lib/ingestion/llm/parse.ts` produziert (Synopsis, facetIds, format, availability, rating + ratingSource + ratingCount, plausibility-flags, discoveredLinks). Plus pro Slug ein `pipelineSnapshot`-Feld mit dem Haiku-Output zum Side-by-Side-Lesen. Plus pro Slug ein `divergence`-Feld mit CC's eigener Annotation, wo das Sonnet-Output substantiell anders ist und warum.
- **Pipeline-Code unverändert.** Kein Edit in `src/lib/ingestion/**`, `scripts/**`, `src/db/**`. Diff-File ist Read-only-Input.

## Out of scope

- **Override-File-Schema-Definition.** Das ist Brief 046 nach diesem Vergleich. Wenn der Vergleich zeigt „Sonnet ist klar besser für Plausibility" → Brief 046 spezifiziert, wie Hand-Check-Korrekturen ins Apply-Step landen. Wenn der Vergleich zeigt „Modelle ähnlich" → Brief 046 fokussiert auf Vokabular-Erweiterung statt Hand-Check-Pipeline.
- **Vokabular-Erweiterung um `duty`/`vengeance`/`fate`.** Wenn Sonnet im Vergleich bessere Facet-IDs aus dem existierenden Vokabular vorschlägt, ist das ein Befund — aber ein neues Vokabular-File anzulegen ist Brief 046 oder später.
- **DB-Apply, 3d-Step.** Wie immer in Phase 3 dry-run only.
- **Pipeline-Refactor.** Auch wenn CC während des Laufs sieht, dass `prompt.ts` schöner ginge oder das Diff-Schema redundant ist — Befund notieren, NICHT fixen.
- **Crawler-Edge-Cases im 044-Diff.** Errors-Liste (47 Stück) bleibt wie sie ist; CC versucht NICHT, Open-Library- oder Hardcover-Misses für die Vergleichs-Bücher zu reparieren.
- **Web-Search-Fallback für fehlende Daten.** Wenn `garro` keinen Hardcover-Hit hat (siehe Errors-Liste), arbeitet CC mit den existierenden Inputs und dokumentiert die Lücke. Brief 046 entscheidet ob Hand-Check Web-Search-Augmentation braucht.

## Acceptance

The session is done when:

- [ ] `ingest/.compare/045-cc-vs-pipeline.json` ist committed mit einem Eintrag pro Slug (12 total). Verzeichnis ist neu (`mkdir -p ingest/.compare/`), `.compare/` darf in `.gitignore` NICHT auftauchen — die Vergleichs-Files werden committed analog zu `.last-run/`.
- [ ] Pro Slug enthält der Eintrag drei Top-Level-Felder: `pipelineSnapshot` (Haiku-Output aus dem 044-Diff, 1:1 kopiert für Read-Convenience), `ccOutput` (Sonnet-Output von dieser Session, im selben Schema wie `parseEnrichmentPayload` returnt), `divergence` (CC's eigene Markdown-Notiz: 2–6 Sätze pro Slug, „Synopsis: X Wörter vs Y Wörter, anderer Tonfall in Z Punkt", „Facets: CC erkennt zusätzlich ABC", „Plausibility: CC flagt author_mismatch wegen DEF", etc.).
- [ ] CC-Inferenz nutzte ausschließlich Subscription-Limit, nicht API-Token. Im Report dokumentieren: ungefähre Token-Zahl (CC's interne Schätzung) und ob Cooldown-Pausen aufgetreten sind.
- [ ] Aggregierter Befunde-Block am Ende des Vergleichs-Files (oder im Report, beides okay) mit folgenden Spalten: (a) **Author-Mismatch-Trefferrate** auf den 4 Anthologien (CC-Plausibility-Flags vs. Haiku 0/4); (b) **Vokabular-Bewertung** auf den 4 Vokabular-Drift-Slugs (CC's facetIds — passt eine existierende Facet-ID besser? oder dieselbe `value_outside_vocabulary`-Lücke?); (c) **Synopsen-Wortzahl-Range** auf allen 12 Slugs (CC liefert konsistent 100–150 W oder hat eigene Drift?); (d) **Plausibility-Tiefe** auf den 2 data_conflict-Slugs (`garro`, `tallarn`) — schreibt CC nuanciertere Reasoning-Strings als Haiku?
- [ ] Subjektive Qualitäts-Aussage von CC im Report („Auf welchen 3 Slugs hat Sonnet/CC den deutlichsten Mehrwert geliefert? Auf welchen 3 ist Haiku ähnlich oder gleich gut?") — das ist die wichtigste qualitative Daten-Punktion für Brief 046.
- [ ] `npm run typecheck` grün, `npm run lint` grün, `npm run build` grün. Keine Änderungen am Pipeline-Code, also sollten alle drei trivial pass — wenn nicht, ist was kaputt gegangen.

## Open questions

Inputs für Brief 046 — CC liefert die in der „For next session"-Sektion:

- **Welche Slugs zeigen die größte Sonnet-Stärke?** Konkret: in welchen Fällen würde der Hand-Check-Workflow für die ~150 Prestige-Bücher den meisten editorial-Wert schaffen?
- **Welche Plausibility-Flag-Kinds findet Sonnet, die Haiku nicht findet?** (Erwartet: `author_mismatch` für Anthologien — bestätigt sich das?)
- **Vokabular: produziert Sonnet bessere Facet-IDs aus dem 85-Werte-Vokabular für die `duty`/`vengeance`/`fate`-Slugs?** Oder erkennt es genauso die Lücke und flagt sie als `value_outside_vocabulary`?
- **Subscription-Verbrauch:** wie viel deines Sonnet-5h-Limits hat der Lauf gekostet? Pro-Slug-Schätzung wenn möglich.
- **Format/Availability:** divergiert Sonnet hier deutlich? (042 hat gezeigt, dass Sonnet-Original vorsichtiger war als Haiku — 6/15 Coverage vs. 20/20 mit Härtung. Reproduziert sich das oder hat die 040-Härtung Sonnet auch geholfen?)
- **Rating-Source-Priority:** alle 4 Anthologien haben `no_rating_found`-Flags bei Haiku. Findet Sonnet doch ein Aggregate-Rating, oder fällt es selbiges Loch?
- **Subjektive Workflow-Aussage:** wäre CC für die ~150 Prestige-Bücher die richtige Form des Hand-Checks (= `claude` lokal aufmachen, 12er-Häppchen abarbeiten), oder eher Claude.ai-Web-Chat (separater Browser-Tab pro 20er-Häppchen)? Beides ist Subscription-Pfad, aber Workflow-Form unterschiedlich.

## Notes

### Ausgewählte 12 Slugs

Verteilung nach Test-Zweck (Stratified Sample aus Batch 1):

**Multi-Author-Anthologien (4 Slugs) — Author-Mismatch-Test, Haiku-Schwäche:**

1. `shattered-legions` — 9 Autoren in Hardcover-Liste, Wikipedia listet nur Editor Laurie Goulding; plus `value_outside_vocabulary: vengeance` und `no_rating_found`-Flags
2. `sons-of-the-emperor` — Anthologie mit mehreren Primarchs-Autoren
3. `heralds-of-the-siege` — Anthologie aus späterer HH-Phase
4. `blood-of-the-emperor` — Anthologie + `value_outside_vocabulary: duty`-Flag (doppeltes Test-Material)

**Vokabular-Drift (4 Slugs) — Categorization-Test mit `value_outside_vocabulary`:**

5. `the-master-of-mankind` — `duty`-Flag
6. `wolfsbane` — `duty`-Flag
7. `saturnine` — `duty`-Flag
8. `ruinstorm` — `fate`-Flag (anderer Drift-Wert als die `duty`-Cluster)

**Plausibility-Tiefe (2 Slugs) — `data_conflict`-Test:**

9. `garro` — pageCount data_conflict (`current: 2` aus Open Library — offensichtliche OL-Datenfehler-Stelle, klassische Hand-Check-Frage); plus Hardcover-Side-Channel-Error „no Hardcover hits for title"
10. `tallarn` — releaseYear data_conflict (Open Library 2018, Wikipedia/Black Library 2017)

**Synopsen-Drift (2 Slugs) — Wortzahl-Konsistenz:**

11. `the-solar-war` — 157 W (über 150-Limit)
12. `the-first-wall` — 154 W (über 150-Limit) + zusätzlich `releaseYear` data_conflict

### Ausgangsdatei

Pipeline-Diff zum Lesen:

```
ingest/.last-run/backfill-20260505-2247.diff.json
```

Dashboard-View für visuelle Inspektion:

```
http://localhost:3000/ingest/backfill-20260505-2247
```

(oder Vercel-URL nach Push)

### Output-Skelett

```jsonc
// ingest/.compare/045-cc-vs-pipeline.json
{
  "comparedAt": "2026-05-05T...Z",
  "sourcedFrom": "backfill-20260505-2247",
  "ccModel": "claude-sonnet-4-6",
  "pipelineModel": "claude-haiku-4-5",
  "promptVersion": "f6272d57626d", // identisch zu Pipeline, weil 1:1-Prompt
  "slugs": {
    "shattered-legions": {
      "pipelineSnapshot": { /* aus 044-Diff kopiert */ },
      "ccOutput": { /* von dieser Session, parseEnrichmentPayload-Schema */ },
      "divergence": "Synopsis: 142 W vs 138 W (Haiku 138, Sonnet 142, beide in Range). Facets: Sonnet erkennt zusätzlich `betrayal`, `loyalty_torn`. Plausibility: Sonnet flagt `author_mismatch` weil Hardcover-Liste 9 Autoren zeigt (Wikipedia: nur 'Laurie Goulding'). Format: identisch. Rating: Sonnet 3.92 ⊃ amazon, Haiku no_rating_found."
    },
    /* … 11 weitere Einträge … */
  },
  "aggregate": {
    "authorMismatchHits": { "cc": 0, "pipeline": 0, "denominator": 4 /* anthologies */ },
    "vocabImprovements": [ /* slugs wo CC bessere existierende facetId findet */ ],
    "synopsisDrift": { "cc_in_range": 0, "pipeline_in_range": 0, "denominator": 12 },
    "plausibilityDepth": "free-text 1–3 Sätze"
  }
}
```

(Skelett ist illustrativ; CC darf das Schema verfeinern, solange die drei Top-Level-Felder pro Slug sowie der `aggregate`-Block enthalten sind.)

### Bash-Tool-Timeout-Reminder

CC-Bash-Tool default ist 120 s. Diese Session braucht keinen langen Pipeline-Lauf, aber wenn CC für Sub-Tasks Bash nutzt: `timeout: 600000` setzen. (044-impl-Report § „Decisions" hat das gestolpert.)

### References

- Brief 044 (`sessions/2026-05-05-044-arch-phase3e-batch-1.md`) + Report 044-impl als Spec für Inputs.
- Pipeline-Prompt: `src/lib/ingestion/llm/prompt.ts` § `SYSTEM_PROMPT` + `buildContext(...)`.
- Pipeline-Output-Parser: `src/lib/ingestion/llm/parse.ts` § `parseEnrichmentPayload(...)`.
- 042-Re-Test-Diff `ingest/.last-run/backfill-20260503-2308.diff.json` als Cross-Vergleichs-Material falls hilfreich.
- 039 Original-Sonnet-Lauf-Diff `ingest/.last-run/backfill-20260503-2037.diff.json` — Achtung: anderer Prompt-Hash (`598f179f95bf`, vor 040-Härtung), nicht direkt vergleichbar zum Modell-Vergleich, aber als Sonnet-Stilistik-Indikator interessant.
