---
session: 2026-05-04-040
role: architect
date: 2026-05-04
status: implemented
slug: phase3c-haiku-switch
parent: 2026-05-03-039
links:
  - 2026-05-03-038
  - 2026-05-03-039
  - 2026-05-04-042
commits: []
---

# Phase 3 Stufe 3c — Modell-Switch auf Haiku 4.5 + Prompt-Härtung (Re-Test)

## Goal

Den Test-Gate-Befund aus 039 in eine Konfigurations-Entscheidung gießen: **Haiku 4.5 wird das Default-Modell** der LLM-Anreicherungs-Schicht, plus zwei System-Prompt-Härtungen, die Haikus bekannte Schwächen aus dem Vergleichs-Lauf (Vokabular-Compliance + Format-Required) adressieren. Anschließend ein einziger Re-Test auf demselben Slice (`--limit 20 --offset 20`, also Bücher 21–40), um die Härtungen zu verifizieren. **Kein DB-Schreib, kein Voll-Lauf**, das ist Phase 3e. Wenn der Re-Test grün ist, ist 3c sauber abgeschlossen und 3d/3e können kommen.

## Context

- **Was 039 + Addendum geliefert hat.** Zwei vergleichbare 20-Buch-Test-Diffs, Sonnet 1–20 ($7,00) und Haiku 21–40 ($2,21). Haikus Real-Cost trifft das Original-Brief-Budget aus 038 ($60–160 für 800 Bücher); Haikus Format-Coverage ist mit 95% sogar besser als Sonnets 40%; Synopsen-Qualität auf vergleichbarem Niveau (Stichprobe lore-präzise). **Zwei reproduzierbare Schwächen:** (1) `value_outside_vocabulary` × 19 — Haiku produziert ID-Pattern wie `tone_grimdark` statt `grimdark`, kombiniert die Kategorie als Prefix mit dem Wert. Der Parser filtert die invalid IDs aktuell aus dem Merge raus + flagt sie, also kein Crash, aber ~95% des Haiku-Facet-Outputs landet im Audit statt im FIELD_PRIORITY-Merge — das ist nicht akzeptabel für 3e. (2) Plausibility-Tiefe — Haiku verpasst Multi-Author-Anthologie-Mismatches (0 vs Sonnet 3 `author_mismatch`-Flags). Der zweite Punkt wird **nicht** in diesem Brief gefixt: Philipp übernimmt die Plausibility-Tiefe extern via Hand-Check-Sessions in Claude.ai (separater Chat, 20er-Batches, kein API-Cost) — siehe „Notes / Workflow nach 3e".
- **Cache-Invalidation als Nebenkosten.** Der System-Prompt-Tweak ändert `PROMPT_VERSION_HASH`. Damit ist der Sonnet-Cache der Bücher 1–20 invalid (egal — Sonnet-Modell-Wechsel macht ihn ohnehin obsolet) und der Haiku-Cache der Bücher 21–40 ist invalid (das ist der Re-Test, wir wollen einen frischen Haiku-Lauf). Re-Test-Cost ~$2,20 einmalig, ist vertretbar als Verifikation vor dem $88-Voll-Lauf.
- **`allowed_callers: ["direct"]` ist schon eingebaut.** Aus dem Addendum: ohne dieses Flag lehnt Haiku Web-Search ab. Edit liegt schon im Repo (Commit `f017b15`), CC braucht hier nichts zu tun.
- **`--offset N` CLI-Flag ist schon eingebaut.** Aus dem Addendum: erlaubt sliced Re-Runs. Wir nutzen es für `--offset 20 --limit 20`.
- **`PRICING`-Lookup für Sonnet/Haiku ist schon eingebaut.** `estUsdCost` wird automatisch korrekt berechnet, egal welches Modell läuft.

## Constraints

- **Default-Modell-Switch im Code, nicht nur via ENV-Var.** Heute ist `INGEST_LLM_MODEL` der Override und der Default in `enrich.ts` ist `claude-sonnet-4-6`. Nach diesem Brief: Default in `enrich.ts` ist `claude-haiku-4-5` (oder die exakt korrekte Anthropic-Modell-ID, die CC verifiziert). ENV-Var-Override bleibt — wir wollen Sonnet-Ad-Hoc-Re-Runs für einzelne Bücher noch zur Verfügung haben.
- **System-Prompt-Härtung 1: Vokabular-ID-Form.** Der Prompt muss explizit machen, dass Facet-IDs **bare value-IDs** sind, nicht Kategorie-prefixed. Beispiel-Form aus dem aktuellen Vokabular: `grimdark` (kategorisiert in `tone`), nicht `tone_grimdark`; `cw_violence` (in `content_warning`), nicht `content_warning_cw_violence`; `multi` (in `protagonist_class`), nicht `protagonist_class_multi`. Empfohlene Mechanik: ein bis zwei explizite Beispielzeilen im System-Prompt, die richtige und falsche Form gegenüberstellen. CC wählt die exakte Formulierung.
- **System-Prompt-Härtung 2: Format ist required.** `format` ist im Tool-Schema heute optional. Sonnet hat das genutzt um sich bei Unsicherheit rauszuhalten (40% Coverage); Haiku committed sich auf einen best-guess (95% Coverage) — das ist das gewünschte Verhalten. Der Prompt soll das verstärken: wenn `format` unklar ist, wähle die naheliegendste Enum-Option und erkläre die Restunsicherheit über einen `data_conflict`-Flag. **Tool-Schema selbst bleibt unverändert** (`format` bleibt im JSON-Schema optional, weil das LLM in seltenen Edge-Cases trotzdem leer lassen darf — z.B. wenn das Buch wirklich nur als Zeitschriften-Story existiert und keine Enum passt). Verstärkung ist nur eine Prompt-Sprache-Sache.
- **Keine weiteren Pipeline-Optimierungen in diesem Brief.** Nicht `max_uses` runterdrehen, nicht das System-Prompt aggressiv trimmen, nicht den Plot-Context shorter machen. Wenn der Re-Test zeigt dass weitere Cost-Ersparnis möglich oder nötig ist (z.B. der Voll-Lauf-Estimate sollte unter $50 fallen), kommt das als eigener Mini-Brief 041 nach dem Re-Test. Ein-Hammer-pro-Session-Disziplin.
- **Re-Test auf exakt Bücher 21–40.** `npm run ingest:backfill -- --dry-run --limit 20 --offset 20`. Gleiches Slice wie der Haiku-Vergleichs-Lauf aus dem Addendum, damit die Vokabular-Compliance ziel-vergleichbar wird (von 19 invalid IDs runter, idealerweise auf ≤2).
- **Cache-Verzeichnis vor dem Re-Test cleanen ist Philipps Entscheidung, nicht CCs.** Der Prompt-Hash-Wechsel macht den Cache automatisch invalide; Cache-Files werden überschrieben. CC räumt nichts proaktiv weg.
- **Keine Schema-Migration.** 0006 (rating-Felder) reicht für 3c. CC's `bookFormat`/`bookAvailability`-Enums aus 0005 sind unverändert nutzbar.
- **Keine Versions-Pins.** `@anthropic-ai/sdk` bleibt was es ist. Wenn Anthropic eine neuere Web-Search-Tool-Version released oder die Modell-ID `claude-haiku-4-5` umbenennt: CC verifiziert und entscheidet.
- **Diff committed.** Wie in 3a/3b/3c-Original: Test-Diff in `ingest/.last-run/backfill-<timestamp>.diff.json` als Audit-Trail beilegen.

## Out of scope

- **DB-Apply (Diff → DB-Writes).** Phase 3d. Inklusive `ALTER TYPE source_kind ADD VALUE 'llm'`, `work_persons`/`work_facets`-FK-Resolution, `external_links`-UNIQUE-INDEX, `junctionsLocked: true`, `llm_flags`-Triage-Workflow.
- **Voll-Lauf 800 Bücher.** Phase 3e. Erst nach diesem Re-Test, dann nach 3d, dann.
- **Hybrid-Strategie Sonnet-Re-Run für Anthologien.** Philipp hat sich für Haiku-only entschieden; die Plausibility-Tiefe wird extern via Hand-Check abgedeckt (siehe Notes). Wenn sich nach 3e zeigt dass das doch nicht reicht, kann ein selektiver Sonnet-Re-Run über `INGEST_LLM_MODEL=claude-sonnet-4-6 --offset N --limit M` ad-hoc passieren — keine Pipeline-Erweiterung nötig.
- **`rating_source_fallback`-Flag-Kind ergänzen.** Sonnet-spezifisches Flag-Misuse-Symptom; Haiku hat das Verhalten nicht (0× im Vergleichs-Lauf). Wenn Sonnet-Ad-Hoc-Re-Runs später nochmal eingesetzt werden und das Flag stört, eigener Mini-Brief.
- **Pipeline-Cost-Tuning** (`max_uses` runter, System-Prompt-Trim, Plot-Context-Shorter, Web-Search-Optional-Mode). Wenn nach diesem Re-Test Cost-Drücken nötig ist: eigener Brief 041.
- **Workflow für Philipps externe Hand-Check-Korrekturen aus Claude.ai-Sessions.** Das wird ein Override-Mechanismus im 3d-Apply-Step (Override-File mit Buch-IDs + Field-Patches, der vor dem DB-Write angewendet wird). Konzipiert wenn 3d-Brief geschrieben wird; nicht in 040.
- **Carry-over-Items, die in 3c-Original schon abgehakt waren** (Format-Coverage als Test-Gate-Signal, `--offset N`, `allowed_callers`, PRICING-Lookup) — die sind alle schon im Repo.

## Acceptance

The session is done when:

- [ ] In `enrich.ts` (oder dem äquivalenten zentralen Punkt): Default-Modell ist `claude-haiku-4-5` (genaue ID gegen Anthropic-Doku verifiziert). `INGEST_LLM_MODEL`-ENV-Var-Override bleibt funktional.
- [ ] System-Prompt in `prompt.ts` enthält die explizite Härtung für Vokabular-ID-Form (bare value-IDs, mit Beispiel `grimdark` vs `tone_grimdark`).
- [ ] System-Prompt in `prompt.ts` enthält die explizite Härtung für Format-Required-Verhalten (closest-match unter Unsicherheit, Restunsicherheit als `data_conflict`-Flag).
- [ ] `PROMPT_VERSION_HASH` hat sich gegenüber dem Hash aus dem Haiku-Vergleichs-Lauf geändert (im Diff sichtbar — `llmPromptVersion`-Top-Level-Feld).
- [ ] Re-Test-Lauf `npm run ingest:backfill -- --dry-run --limit 20 --offset 20` läuft grün und produziert einen committed Diff in `ingest/.last-run/`.
- [ ] Im Re-Test-Diff: `llm_flags`-Aggregation für `value_outside_vocabulary` zeigt **count ≤ 2** (war 19 vor dem Fix). Wenn ≤ 5: im Report dokumentieren mit Sample der bleibenden Verstöße. Wenn > 5: das ist ein Befund, im Report begründen + Empfehlung für Mini-Brief 041.
- [ ] Im Re-Test-Diff: Format-Coverage **≥ 90%** (≥ 14/15 added entries; war 19/20 = 95% beim rohen Haiku-Lauf, sollte mit der Härtung halten oder steigen).
- [ ] Im Re-Test-Diff: `llmModel === "claude-haiku-4-5"` (oder die korrekte verifizierte ID), `llmCostSummary.estUsdCost` im Bereich $1,80–$2,80 (~$2,20 vom Original-Haiku-Lauf, plus/minus Cache-Miss-Variability).
- [ ] Im Re-Test-Diff: Synopsen-Wortzahlen bleiben in Range (Soft-Limit 100–150, Tool-Schema 400–1200 chars). Wenn 1–2 Bücher leicht über 150: kein Blocker.
- [ ] `npm run typecheck` + `npm run lint` + `npm run build` grün.
- [ ] CC stoppt nach dem Re-Test. Kein iteratives Re-Lauf-bis-perfekt — wenn der Diff strukturell daneben liegt, im Report begründen und Mini-Brief 041 vorschlagen.

## Open questions

Inputs für den nächsten Cowork-Brief, keine Blocker:

- Hat die Vokabular-Härtung Nebenwirkungen auf andere Job-Outputs (Plausibility-Flag-Counts, Discovery-Link-Counts, Synopse-Verhalten)? Vergleich Re-Test-Diff vs Haiku-Original-Diff aus 039-Addendum hilft.
- Falls `value_outside_vocabulary` trotz Härtung > 2 bleibt: was ist das Pattern (eine bestimmte Kategorie, eine bestimmte Buch-Klasse)? Liefert Hinweis ob ein zweiter Härtungs-Versuch in 041 sinnvoll ist oder ob wir den Audit-Filter im Parser akzeptieren.
- Cache-Hit-Rate-Sanity: ein zweiter Re-Run direkt nach dem ersten sollte 0 API-Calls + $0 verursachen. Nicht zwingend testen, aber wenn CC es opportunistisch beobachtet, im Report dokumentieren.

## Notes

### Workflow nach 3e (kontextuell, nicht Teil dieses Briefs)

Damit CC den Plan einordnen kann, warum dieser Re-Test sauber abschließen muss bevor 3e startet:

1. **3e Voll-Lauf** auf alle ~800 Wikipedia-discovered Bücher mit dem in 040 gehärteten Haiku-Setup. Geschätzt ~$88, ~38 Stunden Wall-Clock. Resume-Mechanik (3a) wird das erste Mal stress-getestet.
2. **Cowork (Architekten-Rolle) macht Flag-Triage** der ~960 erwarteten LLM-Flags (24/20 × 40 = 960). Drei Kategorien wie in 039's Carry-over skizziert: auto-applied, Cowork-Review, ignoriert. Output ist eine Triage-Notiz die in den 3d-Apply-Step einfließt (welche Flags resolved sind, welche manuell zu korrigieren).
3. **Philipp (extern, in Claude.ai-Chat-Sessions à 20 Bücher) macht GEZIELTEN Hand-Quality-Review** — nicht alle 800 Bücher, sondern zwei Untermengen: (a) **Prestige-Reihen** die Philipp explizit benennt (Horus Heresy 1–54, Siege of Terra, Eisenhorn, Ravenor, Gaunt's Ghosts, ggf. weitere — geschätzt ~150 Bücher), (b) **Bücher mit auffälligen LLM-Flags** aus der Cowork-Triage in Schritt 2 (geschätzt ~120 von 800 mit `data_conflict`/`year_glitch`/`author_mismatch`/`proposed_new_facet`). Die restlichen ~530 „Hintergrund"-Bücher (random Cadian-Honour-Roman-Nr.-37 etc.) bekommen Haiku-Output as-is — die sind für die UX nicht der erste Touchpoint und Hand-Pflege wäre Diminishing-Returns. Output sind Override-Korrekturen pro Buch, kein API-Cost, separater Kontext (nicht hier in Cowork).
4. **3d Apply-Step** liest den Voll-Lauf-Diff + Cowork-Triage-Notiz + Philipps Override-Korrekturen für die ~270 Hand-gecheckten Bücher, resolved alle FKs, schreibt in die DB. Brief 042 (oder welche Nummer dann fällt) wird das Override-File-Format definieren.

Das hat zwei Konsequenzen für 3c (= dieser Brief): das Tool-Schema und die Diff-Form müssen so sauber sein, dass Schritt 3 von einem externen Reviewer ohne tiefe Pipeline-Kenntnis machbar ist. Heute ist das schon erfüllt — der Diff ist menschenlesbares JSON mit `added`/`updated`/`skipped_manual`/`field_conflicts`/`llm_flags`. Kein 040-Action nötig, nur als Erinnerung dass die Diff-Form ein Werkzeug für Philipps Hand-Check ist.

### Beispiel-Sketch für die Vokabular-Härtung im System-Prompt

Illustrativ, CC wählt Wortlaut + Position:

```
The `facetIds` you publish must be bare value IDs from the canonical vocabulary,
NOT prefixed with the category name. The vocabulary is supplied in this prompt.

Correct:   "facetIds": ["grimdark", "cw_violence", "multi"]
Incorrect: "facetIds": ["tone_grimdark", "content_warning_cw_violence", "protagonist_class_multi"]
```

CC darf das umformulieren oder anders positionieren wenn ein anderer Stil im Prompt besser passt — aber die kontrastive Form (richtig vs. falsch) ist erfahrungsgemäß was Modelle zuverlässig korrigiert. Hat der Anthropic-Cookbook-Prompt-Engineering-Section eine andere Empfehlung die besser passt: gerne nutzen, im Report dokumentieren.

### Beispiel-Sketch für die Format-Required-Härtung

Auch illustrativ:

```
The `format` field is REQUIRED. If your web search and structured sources do not
clearly indicate the format, choose the closest match from the enum
(e.g. default to `novel` for full-length releases, `short_story` for sub-50-page
single stories, `audio_drama` only when explicitly marketed as such) and emit a
`flags` entry with kind=`data_conflict` explaining the residual uncertainty.
```

Selber Vorbehalt: CC formuliert um wenn er einen besseren Stil sieht. Was zählt: Format soll committed werden (Coverage hoch halten), und Restunsicherheit landet im Audit-Slot statt in einem leeren Feld.
