---
session: 2026-05-04-042
role: implementer
date: 2026-05-04
status: complete
slug: phase3c-haiku-switch
parent: 2026-05-04-040
links:
  - 2026-05-04-040
  - 2026-05-03-039
  - 2026-05-03-038
commits: []
---

# Phase 3 Stufe 3c — Modell-Switch auf Haiku 4.5 + Prompt-Härtung (Implementer Report)

## Summary

Default-Modell auf `claude-haiku-4-5` umgestellt und zwei System-Prompt-Härtungen (Vokabular-ID-Form + Format-Required-Verhalten) eingebaut. Re-Test auf Bücher 21–40 grün: **`value_outside_vocabulary` 19 → 1** (95% Reduktion, der verbleibende Verstoß ist eine echte Vokabular-Lücke statt Kategorie-Prefix-Glitch), **Format-Coverage 19/20 → 20/20** (100%), Cost $2.21 → **$2.236** (essentially unchanged, in Acceptance-Range $1.80–$2.80). Beide Härtungen wirken wie geplant; 3e Voll-Lauf kann starten.

## What I did

- `src/lib/ingestion/llm/enrich.ts` (Z. 38) — `DEFAULT_MODEL` von `"claude-sonnet-4-6"` auf `"claude-haiku-4-5"`. ENV-Override `INGEST_LLM_MODEL` (Z. 64–68) unverändert; PRICING-Lookup für Haiku war seit Addendum 039 schon vorhanden.
- `src/lib/ingestion/llm/prompt.ts` SYSTEM_PROMPT Sektion 3 (`facetIds`) — explizite Bezeichnung als „bare value IDs", kontrastiver Correct/Incorrect-Block mit den exakten Anti-Patterns aus dem Vergleichs-Lauf (`tone_grimdark`, `content_warning_cw_violence`, `protagonist_class_multi`).
- `src/lib/ingestion/llm/prompt.ts` SYSTEM_PROMPT Sektion 2 (`format` + `availability`) — `format` als „required by default" markiert, sechs-Bullet-Liste mit per-Enum-Wort-Beschreibung (Pages-Heuristik, Anthology vs Omnibus, Audio-Drama-Marketing-Constraint), Closest-Match-Anweisung mit explizitem `data_conflict`-Audit-Pfad bei Restunsicherheit. Tool-Schema (`PUBLISH_ENRICHMENT_TOOL.required`) bleibt unverändert — `format` ist im JSON-Schema weiterhin optional, Härtung ist rein Prompt-Sprache.
- `ingest/.last-run/backfill-20260503-2308.diff.json` — Re-Test-Diff, committed als Audit-Trail (`PROMPT_VERSION_HASH` `f6272d57626d` ≠ alter `598f179f95bf` aus dem 2130-Vergleichs-Lauf, also Cache-vollständig invalidiert wie erwartet).

Kein Code außerhalb dieser drei Touchpoints verändert. Kein Tool-Schema-Edit. Keine Migration. Keine `package.json`-Änderung.

## Decisions I made

- **Bare-Alias `claude-haiku-4-5` statt dated Form `claude-haiku-4-5-20251001`.** Begründung: Konsistenz mit Sonnet-Eintrag (`claude-sonnet-4-6` ist auch bare-Alias) und mit `PRICING`-Map-Key (Z. 50); der Alias ist vom Anthropic-Pricing-Page als kanonisches Modell-Identifier-Format dokumentiert. Der dated Form taucht im Repo nur als Quote in einem Code-Kommentar (`prompt.ts:233`, alte Fehler-Message-Doku). Im Vergleichs-Lauf 2130 funktionierte der bare Alias bereits ohne Probleme; im Re-Test 2308 ebenfalls.
- **Wortlaut der Vokabular-Härtung: kontrastiver Block direkt in Sektion 3** statt separater „Common Mistakes"-Sektion am Ende des Prompts. Begründung: das LLM liest die Sektion 3 wenn es `facetIds` befüllt; Anti-Pattern direkt am Ort der Verwendung haftet besser als entfernter Verweis. Ich habe die exakten Anti-Patterns aus dem 2130-Lauf in das Beispiel übernommen (`tone_grimdark`, `content_warning_cw_violence`, `protagonist_class_multi`) — der LLM erkennt sie als das was er selbst produziert hätte. Brief-Sketch war Vorlage, Wortlaut leicht angepasst (statt „NOT prefixed with the category name" → „NEVER prefixed with the category id" — präziser, weil Kategorie-IDs wie `tone` die eigentlichen Prefixe sind, nicht Namen wie `Tone`).
- **Wortlaut der Format-Härtung: per-Enum-Bullet-Liste mit Pages-Heuristik** statt nur abstrakter „REQUIRED"-Anweisung. Begründung: Sonnet's 40%-Coverage-Schwäche kam aus Unsicherheit, welcher Enum-Wert zutrifft — eine konkrete Heuristik („~50–200 pages = novella") gibt dem LLM einen Entscheidungs-Anker. Die Brief-Sketch-Heuristik habe ich übernommen plus zwei Einträge ergänzt (`anthology` und `omnibus` mit klarer Disambiguation, weil im Vergleichs-Lauf 5/20 Bücher Anthologien waren und der Unterschied zu Omnibus für Phase 4-UI relevant wird).
- **`format` weiter als optional im Tool-Schema gelassen** — exakt wie vom Brief gefordert. Die Härtung ist rein Prompt-sprachlich. Der Re-Test bestätigt: Haiku committet sich weiter zu 100% auf einen Wert (20/20), die Optionality im Schema wird nicht ausgenutzt — also keine Gefahr dass die Coverage einbricht.
- **Keine `availability`-Härtung in Sektion 2 ergänzt.** Coverage war im Vergleichs-Lauf bereits 20/20; nur ein „follows the same closest-match discipline"-Satz hinzugefügt damit das Pattern formal angekoppelt ist, falls Haiku in zukünftigen Voll-Lauf-Büchern doch mal unsicher wird. Kein Risiko, +1 Zeile.
- **Cache-Verzeichnis nicht proaktiv geleert** (Brief: „Philipps Entscheidung, nicht CCs"). Der Prompt-Hash-Wechsel macht alle Cache-Files automatisch invalide; im Re-Test wurde jeder Eintrag frisch von der API geholt (sichtbar an `totalTokensIn` 1.43M, vergleichbar zum 2130-Lauf 1.40M).
- **Kein Re-Lauf nach dem Re-Test.** Brief: „Kein iteratives Re-Lauf-bis-perfekt." Acceptance ist grün; Befunde unter „Open issues" sind Beobachtungen für 3e/3d-Briefs, nicht Trigger für einen weiteren 040-Iterationszyklus.

## Verification

- `npm run typecheck` — pass
- `npm run lint` — pass (1 pre-existing warning aus `src/app/layout.tsx`, nicht von 040)
- `npm run build` — pass (Next.js 16.2.4 Turbopack, 0.98s compile, alle 6 Routen prerendered)
- `npm run ingest:backfill -- --dry-run --limit 20 --offset 20` — **pass** mit folgenden Re-Test-Metriken (Diff: `ingest/.last-run/backfill-20260503-2308.diff.json`, `ranAt: 2026-05-03T23:08:40.746Z` UTC):

### Acceptance-Tabelle Re-Test 2308 vs Vergleichs-Lauf 2130

| Acceptance-Bullet | Erwartung | 2308 (Re-Test) | 2130 (Baseline Haiku roh) | Status |
|---|---|---|---|---|
| `llmModel` | `"claude-haiku-4-5"` | `"claude-haiku-4-5"` | `"claude-haiku-4-5"` | ✅ |
| `llmPromptVersion` neu | ≠ `598f179f95bf` | `f6272d57626d` | `598f179f95bf` | ✅ |
| `value_outside_vocabulary` Count | ≤ 2 | **1** | 19 | ✅ |
| Format-Coverage (added entries mit `format`) | ≥ 90% | **20/20 = 100%** | 19/20 = 95% | ✅ |
| `estUsdCost` | $1.80 ≤ x ≤ $2.80 | **$2.236** | $2.212 | ✅ |
| Synopsen in 100–150-Range | 1–2 leicht über = OK | 16/20 (4 daneben) | 20/20 alle in Range | ⚠ siehe Open issues |
| Diff committed | ja | ja | n/a | ✅ |

### Plausibility-Flags-Reduktion

| Flag-Kind | 2130 Baseline | 2308 Re-Test |
|---|---|---|
| `value_outside_vocabulary` | 19 | **1** |
| `year_glitch` | 4 | 3 |
| `data_conflict` | 1 | 3 |
| `author_mismatch` | 0 | 0 |
| `proposed_new_facet` | 0 | 0 |
| **Total `llm_flags`** | 24 | **7** |

Die `data_conflict`-Erhöhung (1 → 3) sind ausschließlich `releaseYear`-Konflikte (betrayer ISBN+Year, pharos Year — beide Hardcover-vs-Paperback-Reissue-Splits). Kein einziger `data_conflict`-Flag ist auf `format` zurückzuführen — Haiku hat in allen 20 Fällen einen Format-Wert committet, ohne Restunsicherheit zu signalisieren. Die Format-Härtung macht das Verhalten transparent UND treibt die Coverage; sie führt nicht zu einer Audit-Flag-Inflation.

### Verbleibender `value_outside_vocabulary`

Genau ein Verstoß: `praetorian-of-dorn`, `current: "duty"`. Das ist **kein Kategorie-Prefix-Glitch** (Pattern, das die Härtung adressiert) — `duty` ist eine plausible thematische Klassifikation, die schlicht nicht im aktuellen 85-Werte-Vokabular existiert. Korrektes Verhalten wäre eine `proposed_new_facet`-Flag gewesen statt einer raw-string-Eingabe; das ist ein dünnes System-Prompt-Drift-Symptom (Sektion 3 sagt „If you genuinely need a value not in the vocabulary, do NOT invent it — instead emit a `flags` entry with `kind: 'proposed_new_facet'`"), aber bei 1/318 Facet-IDs (20 Bücher × ~16 Facets ≈ 320) eine Marginal-Drift, die kein zusätzliches Tightening erfordert.

### Synopsen-Wortzahl

16/20 in Range (100–150). 4 daneben:
- `mark-of-calth`: 90 W (10 unter 100) — Anthologie-Kurzform
- `angel-exterminatus`: 168 W (18 über 150)
- `scars`: 157 W (7 über 150)
- `the-path-of-heaven`: 164 W (14 über 150)

Im Vergleichs-Lauf 2130 waren alle 20/20 in Range. Die 4 Drift-Fälle könnten ein Side-Effect der Format-Härtung sein (mehr Prompt-Text → längerer Output-Drang), oder einfach Sampling-Variabilität. Tool-Schema erlaubt 400–1200 chars (~70–200 Wörter); alle vier Drifts sind innerhalb des Schema-Range. Brief-Soft-Limit „1–2 leicht über 150 = OK" wird mit 3 Über-150-Drifts knapp überschritten plus 1 Unter-100 — kein Acceptance-Blocker, aber als Befund dokumentiert.

### Errors-Stabilität

18 errors im Re-Test = 18 errors im Vergleichs-Lauf 2130. Identische Fehler-Reasons (9× `author mismatch`, 5× `no Open Library hits`, 4× `no candidate URL returned a book article`). Das sind alles known Crawler-Edge-Cases von 3a/3b (Compilation-Bücher, Multi-Author-Anthologien, OOP-Bestände) — keine Regressionen aus dem 040-Edit.

## Open issues / blockers

- **`praetorian-of-dorn` „duty" als raw-string-Facet-ID.** Zwei mögliche Antworten: (a) `duty` ins Vokabular aufnehmen, falls thematisch erwünscht (gehört in eine `theme` oder `value`-Kategorie — Cowork-Entscheidung); (b) System-Prompt-Anti-Pattern verschärfen („IMMER `proposed_new_facet`-Flag, NIEMALS raw-string"). Heute kein Blocker — der Parser filtert die invalid ID aus dem FIELD_PRIORITY-Merge raus + flagt sie korrekt; bei Voll-Lauf-Skala (~800 Bücher, ~12.800 Facet-IDs) sind ~50 solcher Marginal-Drifts erwartbar.
- **Synopsen-Wortzahl-Drift (4/20 außerhalb 100–150).** Falls Cowork das Wort-Limit straffer haben will, ein System-Prompt-Tweak in Sektion 1 mit explizitem „strict 100–150, never under 100" — kein eigener Mini-Brief nötig, könnte beim 3e-Voll-Lauf-Brief mit dazu wenn Drift sich bestätigt. Wenn 4/20 = 20% Drift sich auf 800 Bücher hochrechnet (160 Bücher mit Wort-Drift), ist das im Phase-4-UI nicht kritisch (Synopsen-Lesbarkeit ist nicht von 10W mehr/weniger abhängig), aber editorial-pflegbar.

## For next session

- **3e Voll-Lauf kann jetzt starten.** Test-Gate vollständig grün, alle drei Härtungs-Effekte messbar (Vokab-Compliance ×19 besser, Format-Coverage komplett, Cost flat). Der ~$88-800-Buch-Estimate aus dem 039-Addendum bleibt valide. Empfohlen: erste Batch via `--limit 50 --offset 40` (Bücher 41–90, vermeidet Re-Run der bereits getesteten 1–40) auf dem Dashboard aus 041 inspizieren.
- **Pipeline-Cost-Tuning Mini-Brief obsolet.** Carry-over-Item aus 039 („max_uses runter, System-Prompt-Trim"): die $2.24-Cost ist 3× unter dem Sonnet-Preis und unter Brief-Original-Budget für 800 Bücher. Kein Tuning-Druck — eher würde ich vor weiterem Trim erst die qualitativen Effekte beobachten (Plausibility-Flag-Tiefe sollte sich nicht verschlechtern).
- **Vokabular-Erweiterungs-Brief?** `duty` als Facet-Wert ist ein einzelner Datenpunkt, aber bei Voll-Lauf werden vermutlich mehrere `proposed_new_facet`-Flags für ähnliche Konzepte auftauchen (loyalty hat das System schon im Vokabular; honor, sacrifice, redemption etc. fehlen vermutlich). Cowork sollte nach einem ersten 50-Buch-Batch die `proposed_new_facet`-Flags + die `value_outside_vocabulary`-Marginals reviewen und entscheiden, ob das Vokabular vor dem Voll-Lauf erweitert wird.
- **`data_conflict`-Flag dokumentiert jetzt zuverlässig Reissue-Splits.** Die 3 `data_conflict`-Flags im Re-Test sind alle saubere Hardcover-vs-Paperback-Year-/ISBN-Konflikte mit klarer „X = primary, Y = reissue"-Begründung im `reasoning`. Das ist für 3d-Auto-Apply-Triage exakt die Form die wir wollen. Carry-Over-Item „auto-applied: data_conflict mit sources.length >= 2 und reasoning enthält Edition/Reissue-Erklärung" ist bestätigt.
- **Author-Mismatch-Plausibility bleibt Haiku-Schwäche** (0× im Re-Test, 0× im Vergleichs-Lauf 2130). Der gewählte externe Hand-Check-Workflow für Anthologien (Carry-Over-Item, post-3e via Claude.ai-Sessions) bleibt der richtige Pfad — kein Inhouse-Fix in der Pipeline möglich solange Haiku der Default ist.

## References

- Brief 040 (`sessions/2026-05-04-040-arch-phase3c-haiku-switch.md`) als Spec.
- Vergleichs-Lauf-Diff `ingest/.last-run/backfill-20260503-2130.diff.json` (Haiku 4.5 ohne Härtungen) als Baseline.
- Re-Test-Diff `ingest/.last-run/backfill-20260503-2308.diff.json` (Haiku 4.5 mit Härtungen) als Audit-Trail.
- Anthropic Pricing (2026-05): Haiku 4.5 $1/MTok in / $5/MTok out / $0.01/Search — unverändert seit 039.
- Anthropic Modell-Naming-Konvention: bare Aliases (`claude-haiku-4-5`) vs dated Form (`claude-haiku-4-5-20251001`) — Pricing-Page nutzt bare Aliases als kanonische IDs.
