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

# Sonnet-Quadrant der 5-Zellen-Vergleichsmatrix (Sonnet × {Pipeline, Web}, 6 Slugs)

## Goal

Den **Sonnet-Quadrant** einer 5-Zellen-Modell-und-Workflow-Vergleichsmatrix produzieren — also zwei der vier neuen Varianten, beide mit Sonnet 4.6: einmal mit Pipeline-Inputs + Pipeline-System-Prompt 1:1 (Variante B), einmal „klug" — CC's eigener Stil mit freier WebSearch (Variante C). Sechs Slugs, jeder mit klarem Test-Zweck. Output: zwei JSON-Files unter `ingest/.compare/`, plus ein Innerhalb-Sonnet-Befunde-Block im Report (B vs C, plus jeweils B vs Pipeline-Haiku-A und C vs Pipeline-Haiku-A).

Brief 045 ist der **billigere/sicherere Hälfte des Splits** — Sonnet zuerst, dann erst Brief 046 mit den Opus-Varianten (D Pipeline + E Web) + dem Cross-Aggregat aller fünf Varianten. Wenn Sonnet-Web sich in 045 als „klug genug" erweist, kann Brief 046 reduziert oder ganz gestrichen werden — das ist explizit erlaubter Subscription-Schutz.

## Context

Stand am 2026-05-05 nach Batch 1 (Report 044-impl):

- **Pipeline-Baseline-A liegt fertig vor** in zwei Diffs: `ingest/.last-run/backfill-20260505-2247.diff.json` (Bücher 41–90, fünf der sechs Test-Slugs) und `ingest/.last-run/backfill-20260503-2308.diff.json` (Bücher 21–40 = 042 Re-Test, der sechste Slug `mark-of-calth`). Beide Diffs sind mit identischer Pipeline-Konfiguration produziert: Haiku 4.5, Prompt-Hash `f6272d57626d`, mandatory Web-Search via API. Damit sind die beiden Files als Variante-A-Quelle gleichwertig.
- **Per-Buch-Cost-Tracking ist Hard-Constraint dieser Session.** Subscription-Verbrauch über 12 Inferenzen (6 Slugs × 2 Varianten) muss transparent sein, damit (a) Philipp keine Überraschungen erlebt und (b) Brief 046 mit echten Opus-Cost-Schätzungen geplant werden kann. Mechanik in § Constraints.
- **Hardes Tagging-Failure-Beispiel als Test-Case:** `mark-of-calth`. Pipeline-Output (042 Re-Test) hat eine Synopsis, die explizit „Word Bearers", „Roboute Guilliman's Ultramarines" und „Daemonic" (= Chaos) erwähnt — aber die ausgegebenen `facetIds` enthalten *keinen* davon: nur thematische Tags (`betrayal`, `war`, `sacrifice`, `brotherhood`, `cw_violence`, `cw_death`, `mid_series`) plus generisches `imperium` + `space_marine` + `war_story` + `grimdark`. Faktion-Tags `chaos`, `word_bearers`, `ultramarines` fehlen. Das ist ein konkreter Datenpunkt: erkennen Sonnet-Pipeline und Sonnet-Web diese Faktionen?
- **Anthologie-Test bleibt zentral:** in 70 Büchern (042+044) hat Haiku **0× `author_mismatch`-Flag** geliefert, trotz mind. 7 Multi-Author-Anthologien. Die Hypothese: Sonnet liest die Hardcover-Author-Liste aus den Audit-Payloads anders und flagt mismatch. Bei Variante C ist die Hypothese strikter: schafft Sonnet das auch ohne Pipeline-Inputs, allein durch eigene Recherche?

## Constraints

- **Slug-Anzahl fixiert auf 6.** Liste in § Notes. Nicht erweitern, nicht verkleinern.
- **Nur zwei Varianten in dieser Session:**

  | Variante | Modell | Inputs | System-Prompt | WebSearch | Output-File |
  |---|---|---|---|---|---|
  | **B** | Sonnet 4.6 | Pipeline-Crawler-Audit aus dem jeweiligen Source-Diff (per-Slug; siehe § Notes) | Pipeline-Prompt 1:1 aus `src/lib/ingestion/llm/prompt.ts` | KEINE | `ingest/.compare/045-sonnet-pipeline.json` |
  | **C** | Sonnet 4.6 | nur Slug + Wikipedia-Title + `authorNames`-Field (aus Source-Diff `payload.fields.authorNames`) | CC's eigener Stil | FREI (WebSearch + WebFetch) | `ingest/.compare/045-sonnet-web.json` |

- **Output-Schema in beiden Varianten ist `parseEnrichmentPayload`-kompatibel** — pro Slug die Felder `synopsis`, `facetIds[]`, `format`, `availability`, `rating` + `ratingSource` + `ratingCount` (oder null), `plausibilityFlags[]` mit `kind` + `reasoning`, `discoveredLinks[]` mit `serviceHint` + `kind` + `url`. Variante C darf zusätzliche Felder vorschlagen, aber alle Pflichtfelder müssen geliefert werden.

- **Per-Slug `costEstimate`-Feld ist Pflicht** in beiden Output-Files. Schema:

  ```jsonc
  {
    "costEstimate": {
      "subscriptionTier": "sonnet",
      "inputTokens": 4200,        // CC's Schätzung für diesen Slug
      "outputTokens": 1300,
      "webSearchCalls": 0,        // 0 für Variante B, N für C
      "estimatedLimitPercent": 1.2,    // dieser Slug
      "cumulativeLimitPercent": 8.4    // alle bisherigen Slugs in dieser CC-Session zusammen
    }
  }
  ```

  CC liest seinen eigenen Token-Verbrauch (z.B. via `/cost` oder Session-Header) und trägt die Schätzung pro Slug ein. Bei Cooldown-Pausen wird `cumulativeLimitPercent` nach dem Cooldown-Reset neu gestartet.

- **Per-Slug 1-Zeilen-Status an Philipp im Chat.** Nach jedem fertigen Slug schreibt CC eine kompakte Zeile in die Konsole/Chat: *„Slug 3/6 (`the-master-of-mankind`, Variante C) fertig — geschätzt 2.4% des Sonnet-5h-Limits, kumulativ 11.8%. Weitermachen."* Format CC's Wahl, Inhalt mindestens: Slug-Index/Total + Slug-Name + Variante + per-Slug-% + kumulativ-%.

- **Hard-Stop-Bedingung.** Wenn CC's Schätzung `cumulativeLimitPercent + nextSlugEstimate > 80` ergibt, pausiert CC vor dem nächsten Slug, schreibt die Zwischenstände in beide Output-Files, und fragt Philipp explizit: *„Limit-Schwelle erreicht — Cooldown abwarten oder weitermachen?"* Subscription-Schutz priorität gegenüber Lauf-Vollständigkeit.

- **Pipeline-System-Prompt für B ist 1:1 aus `src/lib/ingestion/llm/prompt.ts`.** CC liest `SYSTEM_PROMPT` und die `buildContext(...)`-Form, baut den User-Input mit den Audit-Daten aus dem jeweiligen Source-Diff (siehe Slug-Liste), ruft Sonnet mit genau diesen zwei Strings auf. Kein Web. Reiner Modell-Vergleich auf identischer Eingabe.

- **Strikte Input-Disziplin für C.** CC bekommt **ausschließlich**: den Slug, den `wikipediaTitle`, die `authorNames`-Liste (aus dem Source-Diff `payload.fields.authorNames`). Alles andere muss CC selbst per WebSearch/WebFetch recherchieren. Pipeline-Diff-Daten **dürfen nicht** als Input herangezogen werden — sonst ist der Workflow-Vergleich verfälscht.

- **`searchedSources`-Array Pflicht in Variante C.** Pro Slug-Eintrag in `045-sonnet-web.json` ein Array mit jeder WebSearch-Query und jeder WebFetch-URL: `{ kind: "web_search" | "web_fetch", query?: string, url?: string }`. Macht ex-post nachvollziehbar, *welche* Quellen Sonnet konsultiert hat.

- **`ingest/.compare/` wird committed**, analog zu `ingest/.last-run/`. Nicht in `.gitignore` aufnehmen.

- **Pipeline-Code unverändert.** Kein Edit in `src/lib/ingestion/**`, `scripts/**`, `src/db/**`. CC liest `prompt.ts` und die Source-Diffs, schreibt in `ingest/.compare/`.

- **Subscription-Splitting erlaubt.** Wenn das 5h-Sonnet-Limit greift, darf der Lauf über mehrere CC-Sessions/Cooldowns verteilt werden. Beide Output-Files können Teilfortschritte enthalten — bei Fortsetzung in einer späteren Session Slugs ergänzen, nicht überschreiben.

## Out of scope

- **Opus-Varianten (D + E).** Brief 046 nach Sonnet-Resultat.
- **Cross-Aggregat aller 5 Varianten.** Auch Brief 046 (oder ein eigener Brief 047, je nachdem was nach 046 sinnvoll erscheint).
- **Override-File-Schema-Definition.** Brief 047+ nach allen Varianten.
- **Vokabular-Erweiterung.** Wenn Sonnet bessere existierende facetIds findet als Haiku — Befund notieren, NICHT live ins Vokabular einpflegen.
- **Pipeline-Verbesserung „Synopsis-zu-Tag-Cross-Check".** Im 044-Befund (mark-of-calth Tagging-Failure) liegt ein Hinweis, dass die Pipeline einen zweiten Validierungs-Pass braucht: nach Synopsis-Erstellung sollten Faktion-/Charakter-Erwähnungen in der Synopsis gegen die `facetIds` gegengeprüft werden. Das ist ein **eigener späterer Mini-Brief** (im Carry-Over notiert), NICHT Teil von 045. CC dokumentiert in 045 nur, ob Sonnet-Pipeline (B) und/oder Sonnet-Web (C) das Problem auch hätten oder es selbst lösen.
- **Crawler-Edge-Cases.** Errors aus dem 044-Diff bleiben wie sie sind. Wenn `garro` in Variante C ohne Hardcover-Hit nicht auflösbar ist, dokumentiert CC die Lücke im `searchedSources`-Array.
- **DB-Apply.** Wie immer in Phase 3.

## Acceptance

The session is done when:

- [ ] **`ingest/.compare/045-sonnet-pipeline.json`** committed mit Einträgen für alle 6 Slugs im `parseEnrichmentPayload`-Schema + jeweils `costEstimate`-Feld + `divergence`-Markdown-Notiz vs. Pipeline-Haiku-A.
- [ ] **`ingest/.compare/045-sonnet-web.json`** committed mit Einträgen für alle 6 Slugs im selben Schema + `costEstimate` + `searchedSources`-Array + `divergence`-Markdown-Notiz vs. Pipeline-Haiku-A *und* vs. Sonnet-Pipeline-B.
- [ ] **Per-Slug 1-Zeilen-Status** wurde in jeder CC-Session konsistent geliefert (Philipp sieht das in der CC-Konsole/Chat live mit). Im Report ein Beispiel-Trace zitieren.
- [ ] **Hard-Stop-Mechanik wurde eingehalten** — wenn keine Pause gebraucht wurde, das im Report dokumentieren („cumulativeLimitPercent end-of-run = X%, hard-stop nicht ausgelöst"); wenn Pause gebraucht wurde, dokumentieren wann + wie lange Cooldown.
- [ ] **Innerhalb-Sonnet-Befunde-Block** im Report mit vier konkreten Spalten: (a) **Author-Mismatch-Trefferrate** auf den 2 Anthologien (`shattered-legions`, `sons-of-the-emperor`) — Pipeline-A: 0/2, B: ?, C: ?; (b) **Vokabular-Bewertung** auf den 2 Vokabular-Drift-Slugs (`the-master-of-mankind` mit `duty`, `shattered-legions` mit `vengeance`) — findet Sonnet bessere existierende facetIds, oder erkennt es dieselbe Lücke?; (c) **Tagging-Coverage** auf `mark-of-calth` — taucht `chaos` / `word_bearers` / `ultramarines` in B's und C's facetIds auf?; (d) **Plausibility-Tiefe** auf `garro` (pageCount data_conflict) und `the-solar-war` (Synopsen-Drift) — schreibt Sonnet nuancierteres Reasoning?
- [ ] **Subjektive Qualitäts-Synthese** im Report-Abschnitt „For next session": auf welchen 2–3 Slugs hat Sonnet-Web (C) deutlichen Mehrwert über Sonnet-Pipeline (B) gezeigt? Auf welchen ist B/C ununterscheidbar? Das ist Input für die Brief-046-Frage „lohnt Opus-Pendant?".
- [ ] `npm run typecheck` grün, `npm run lint` grün, `npm run build` grün. Kein Pipeline-Edit, also alle drei trivial pass.

## Open questions

Inputs für Brief 046 — CC liefert die in der „For next session"-Sektion:

- **Modell-Achse Pipeline-Workflow (A→B):** Wie groß ist der Sprung Haiku → Sonnet auf identischem Prompt + identischen Inputs? Sind Author-Mismatch-Flags + Faktion-Tags konsistent gefangen, oder bleibt Sonnet auch blind?
- **Workflow-Achse innerhalb Sonnet (B↔C):** Liefert „klug + WebSearch" qualitativ neue Befunde, oder ist es redundant zur Pipeline?
- **Tagging-Failure-Diagnose:** Erkennt B die fehlenden Faktion-Tags von `mark-of-calth` aus den Pipeline-Inputs (= dann ist es ein Modell-Problem mit Haiku, nicht ein Pipeline-Architektur-Problem)? Oder fängt erst C es durch eigene Recherche (= dann ist die Pipeline strukturell zu eng auf Plot-Inputs gekoppelt und braucht den Synopsis-Cross-Check-Pass)?
- **Cost-Realität für Opus-Plan:** Wenn Sonnet-Web (C) per Slug Y Web-Searches und Z Tokens braucht, ist Opus-Web (E) realistisch das ~5× im Limit-Verbrauch — passt das in dein Budget oder ist E einer „skip"-Kandidat für Brief 046?
- **Schema-Vorschläge:** Schlägt C ein zusätzliches Output-Feld vor, das die Pipeline noch nicht hat?
- **Vokabular-Auflösung:** Liefert Sonnet (B oder C) für `duty`/`vengeance` bessere existierende Facet-IDs (z.B. `loyalty` falls vorhanden, `revenge`)?

## Notes

### Ausgewählte 6 Slugs

| # | Slug | Source-Diff | Test-Zweck |
|---|---|---|---|
| 1 | `shattered-legions` | `backfill-20260505-2247.diff.json` (044) | Anthologie (9 Autoren) + `value_outside_vocabulary: vengeance` + `no_rating_found` — drei Test-Punkte in einem Buch |
| 2 | `sons-of-the-emperor` | `backfill-20260505-2247.diff.json` (044) | Anthologie (zweiter Datenpunkt für Author-Mismatch-Pattern) |
| 3 | `the-master-of-mankind` | `backfill-20260505-2247.diff.json` (044) | `value_outside_vocabulary: duty` (Vokabular-Drift) |
| 4 | `garro` | `backfill-20260505-2247.diff.json` (044) | pageCount `data_conflict` (`current: 2` aus OL) + Hardcover-„no hits"-Lücke (Plausibility-Tiefe) |
| 5 | `the-solar-war` | `backfill-20260505-2247.diff.json` (044) | Synopsen-Drift > 150W (Wortzahl-Konsistenz) |
| 6 | `mark-of-calth` | `backfill-20260503-2308.diff.json` (042 Re-Test) | **Tagging-Failure**: Synopsis erwähnt Word Bearers + Ultramarines + Daemonic, facetIds enthalten kein `chaos` / `word_bearers` / `ultramarines`. Test ob Sonnet-Pipeline aus selben Inputs die Faktionen fängt, oder erst Sonnet-Web durch eigene Recherche. |

Variante B liest pro Slug aus dem genannten Source-Diff den `payload.fields`-Block, den `rawHardcoverPayload`-Block (wichtig für Anthologie-Author-Liste), und die `payload.fieldOrigins`. Daraus baut CC das `buildContext(...)`-Form und ruft Sonnet mit `SYSTEM_PROMPT` 1:1.

Variante C liest aus dem Source-Diff nur `slug`, `wikipediaTitle`, und `payload.fields.authorNames`. Alles andere recherchiert CC selbst. Wikipedia ist erlaubt (das wäre der naive erste Schritt jedes Web-Lookups), Lexicanum auch, Open Library, Hardcover, Amazon, Goodreads, Audible — alles was CC für sinnvoll hält. Pflicht: `searchedSources`-Array im Output dokumentiert jede Query/URL.

### Reihenfolge-Empfehlung

1. **Variante B zuerst, alle 6 Slugs** (kein Web → schnell, Token-Verbrauch leicht abschätzbar). Erwartung: ~5–10% des Sonnet-5h-Limits für 6 Inferenzen mit ~5K Token Input pro Slug.
2. **Variante C danach, alle 6 Slugs** (mit Web → mehr Tool-Use-Loops, höherer Token-Verbrauch pro Slug). Erwartung: ~10–25% Limit für 6 Web-Inferenzen.
3. Innerhalb-Sonnet-Befunde-Block schreiben.

CC darf abweichen (z.B. paarweise B+C pro Slug abwechselnd, falls das pragmatischer ist) — solange Per-Slug-Cost-Tracking sauber bleibt.

### Output-Skelett pro Slug (Variante B)

```jsonc
{
  "slug": "shattered-legions",
  "synopsis": "...",
  "facetIds": ["..."],
  "format": "anthology",
  "availability": "in_print",
  "rating": null,
  "ratingSource": null,
  "ratingCount": null,
  "plausibilityFlags": [
    { "kind": "author_mismatch", "reasoning": "..." }
  ],
  "discoveredLinks": [],
  "costEstimate": {
    "subscriptionTier": "sonnet",
    "inputTokens": 4200,
    "outputTokens": 1300,
    "webSearchCalls": 0,
    "estimatedLimitPercent": 1.0,
    "cumulativeLimitPercent": 1.0
  },
  "divergence": "Vs. Pipeline-Haiku-A: Sonnet flagt author_mismatch (Haiku 0×). Synopsis 142 W vs Haiku 138 W. Facets identisch außer dass Sonnet `betrayal` hinzufügt. Format/Availability identisch."
}
```

### Output-Skelett pro Slug (Variante C)

```jsonc
{
  "slug": "shattered-legions",
  "synopsis": "...",
  "facetIds": ["..."],
  /* … gleiche Pflichtfelder wie B … */
  "searchedSources": [
    { "kind": "web_search", "query": "shattered legions horus heresy anthology authors" },
    { "kind": "web_fetch", "url": "https://wiki.lexicanum.com/wiki/Shattered_Legions_(Anthology)" },
    { "kind": "web_search", "query": "shattered legions hardcover review goodreads" }
  ],
  "costEstimate": {
    "subscriptionTier": "sonnet",
    "inputTokens": 6800,
    "outputTokens": 1500,
    "webSearchCalls": 4,
    "estimatedLimitPercent": 2.1,
    "cumulativeLimitPercent": 9.3
  },
  "divergence": "Vs. Pipeline-Haiku-A UND vs. Sonnet-Pipeline-B: Sonnet-Web findet zusätzliche author entries via Lexicanum-Subseite, plus Goodreads-Rating das weder Pipeline noch B-Variante hatte (rating=3.92, ratingSource=goodreads). WebSearch-Iterationen: 4."
}
```

### References

- Brief 044 (`sessions/2026-05-05-044-arch-phase3e-batch-1.md`) + Report 044-impl als Spec für Inputs.
- Pipeline-Prompt: `src/lib/ingestion/llm/prompt.ts` § `SYSTEM_PROMPT` + `buildContext(...)` (für Variante B 1:1 zu verwenden).
- Pipeline-Output-Parser: `src/lib/ingestion/llm/parse.ts` § `parseEnrichmentPayload(...)` als Output-Schema-Definition.
- Source-Diff für 5 Slugs: `ingest/.last-run/backfill-20260505-2247.diff.json`.
- Source-Diff für `mark-of-calth`: `ingest/.last-run/backfill-20260503-2308.diff.json` (042 Re-Test, gleiche Pipeline-Konfig).
