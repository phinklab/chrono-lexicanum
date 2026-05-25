---
title: Why CC-Direct-Curation, not V2-LLM-Pipeline (für laufende SSOT-Batches)
type: decision
created: 2026-05-15
updated: 2026-05-15
sources:
  - ../../../sessions/2026-05-11-061-arch-ssot-loop.md
  - ../../../sessions/archive/2026-05/2026-05-13-071-arch-loop-driver.md
  - ../../../sessions/archive/2026-05/2026-05-13-071-impl-loop-driver.md
  - ../../../sessions/archive/2026-05/2026-05-14-072-impl-resolver-batch-2.md
  - ../../../sessions/archive/2026-05/2026-05-15-074-arch-resolver-batch-3.md
  - ../../../sessions/archive/2026-05/2026-05-15-074-impl-resolver-batch-3.md
  - ../../../scripts/run-ssot-loop.sh
  - ../../../scripts/apply-override.ts
  - ../../../src/lib/ingestion/v2/llm/enrich.ts
related:
  - ./why-excel-ssot-not-crawl.md
  - ./why-sonnet-not-haiku.md
  - ./why-haiku-not-sonnet.md
  - ./why-multi-source-merge.md
  - ../pipeline-state.md
  - ../project-state.md
  - ../open-questions.md
  - ../deferred-questions.md
confidence: high
decision-date: 2026-05-11
---

# Why CC-Direct-Curation, not V2-LLM-Pipeline (für laufende SSOT-Batches)

**Status:** active · **Effectively decided:** 2026-05-11 (Brief 061, Standing-Loop) · **Formal-ADR-written:** 2026-05-15 (Post-074-Wiki-Hygiene-Pass) · **Sessions:** [061-arch](../../../sessions/2026-05-11-061-arch-ssot-loop.md), [071-arch](../../../sessions/archive/2026-05/2026-05-13-071-arch-loop-driver.md), [071-impl](../../../sessions/archive/2026-05/2026-05-13-071-impl-loop-driver.md), [074-arch](../../../sessions/archive/2026-05/2026-05-15-074-arch-resolver-batch-3.md), [074-impl](../../../sessions/archive/2026-05/2026-05-15-074-impl-resolver-batch-3.md)

## Context

Die V2-Pipeline (Briefs 054–058) wurde gebaut als sauber strukturierter Vier-Stages-Pfad: Stage 0 Discovery (post-057 ersetzt durch Excel-SSOT, siehe [`./why-excel-ssot-not-crawl.md`](./why-excel-ssot-not-crawl.md)), Stage 1 Source-Claims-Crawl (Lexicanum + Open Library + Hardcover), Stage 2 fünf deterministische Validatoren, Stage 3 Slim-LLM-Enrichment (Anthropic API mit Web-Search, Modell-Wahl in [`./why-sonnet-not-haiku.md`](./why-sonnet-not-haiku.md)), Stage 4 `BookV2Record` mit `FieldRecord<T>`-Provenance pro Feld. Code lebt unter `src/lib/ingestion/v2/`; CLI-Entry `scripts/ingest-backfill.ts` mit `--pipeline=v2 --source=ssot --batch=ssot-w40k-NNN`.

Brief 058 hat den SSOT-Modus in die V2-Pipeline integriert (Excel-Roster statt Wikipedia-Discovery); Brief 060 hat den ersten Batch (`ssot-w40k-001`) gegen die DB applied. Bis hier wurde die V2-LLM-Stage (`src/lib/ingestion/v2/llm/enrich.ts`) tatsächlich aufgerufen — pro Buch eine Anthropic-API-Subsession mit dem `PUBLISH_ENRICHMENT_TOOL_V2`-Schema, Web-Search-Tool, Caching unter `ingest/.llm-cache/<slug>.v2.json`.

Brief 061 (2026-05-11) hat das Pattern geändert, **ohne dass der Wechsel explizit als Architektur-Entscheidung gerahmt war**. Die Standing-Loop-Konvention besagt: pro `/clear` öffnet der Maintainer eine `claude -p`-Subsession (Default-Modell, momentan Opus), gibt dem Modell den Roster-Pointer und das Konventions-System, das Modell schreibt **direkt** eine `manual-overrides-ssot-w40k-NNN.json`-Datei und committet sie. Die V2-Pipeline läuft dabei **nicht** — kein Stage-1-Crawl, keine Validatoren, keine Stage-3-API-Call. Die `apply-override.ts`-Schicht konsumiert die Override-Datei und schreibt `works`/`book_details`/Junctions in die DB.

Diese Praxis ist seit Brief 061 die operative Wahrheit: 15 Batches (`ssot-w40k-001..015`, 150 Bücher) sind durch dieses Pattern gelaufen. Brief 071 hat es als Shell-Wrapper `scripts/run-ssot-loop.sh` produktisiert (mehrere Iterationen am Stück per Bash-Loop, jede Iter eine eigene `claude -p`-Subsession). Brief 074-impl hat die dritte Resolver-Welle für 011..015 geschlossen. Die V2-LLM-Stage-Code-Pfade unter `src/lib/ingestion/v2/llm/` sind in dieser Zeit **nicht** angefasst worden — der letzte Commit dort liegt zwischen Brief 055 und 056 (Mai 2026).

Damit ist die V2-LLM-Stage **de-facto ausgemustert** für den aktiven Bulk-Backfill-Pfad, ohne dass das je formal entschieden wurde. Der ADR hier holt die Entscheidung nach.

## Options considered

- **A — V2-LLM-Pipeline reaktivieren.** `scripts/ingest-backfill.ts --pipeline=v2 --source=ssot --batch=ssot-w40k-016` als Default-Driver der nächsten 10er-Iterationen verwenden. Sonnet als Stage-3-Modell (per [`./why-sonnet-not-haiku.md`](./why-sonnet-not-haiku.md)). Override-Files würden weiterhin manuell durch Maintainer korrigierbar sein, aber die Erst-Erzeugung läge wieder bei der strukturierten Pipeline.
- **B ✅ chosen — CC-Direct-Curation als laufender Pfad.** Eine `claude -p`-Subsession pro 10er-Batch produziert die Override-Datei direkt; V2-LLM-Stage bleibt im Code, wird aber nicht ausgeführt. Resolver + Apply-Schicht (`src/lib/resolver/`, `scripts/apply-override.ts`) konsumieren weiterhin die Override-Datei und sind völlig unverändert. Maintainer kann jeden Batch vor Apply reviewen.
- **C — Hybrid: Pipeline crawlt Source-Claims (Stage 1), CC enricht (Stage 3 ersetzt).** Lexicanum/OL/Hardcover-Daten als Pre-Population an die `claude -p`-Subsession füttern, der Stage-3-LLM-Call wird durch die CC-Subsession ersetzt. Beste Source-Provenance-Coverage, aber kompliziertes Wiring.

## Decision

**Option B**, mit zwei expliziten Konsequenzen:

1. **V2-LLM-Stage bleibt im Repo, wird aber nicht gewartet.** `src/lib/ingestion/v2/llm/{enrich,prompt,parse}.ts`, `PROMPT_VERSION_HASH_V2`, `WEB_SEARCH_TOOL_V2`-Konfiguration, V2-Cache-Files unter `ingest/.llm-cache/*.v2.json` bleiben unangetastet. Kein Active-Maintenance, aber auch keine Löschung — der Code ist die Reaktivierungs-Sicherung (Option A) und das historische Artefakt der 054–055-Pipeline-Phase.
2. **Operative Pipeline ist:** Excel-SSOT-Roster ([`./why-excel-ssot-not-crawl.md`](./why-excel-ssot-not-crawl.md)) → `claude -p`-Subsession produziert `manual-overrides-ssot-w40k-NNN.json` → `scripts/apply-override.ts` schreibt in die DB → alle 50 Bücher eigener Resolver-Pass durch separate Cowork-Architect-Session + CC-Implementer-Brief.

Operativ-Pfad-Details:
- **`claude -p`-Subsession.** Default-Modell (heute Claude Opus 4.7). Maintainer-Prompt enthält Roster-Pointer (`scripts/seed-data/book-roster.json`), Batch-Nummer, Konventions-System aus Brief 061 (Synopsis-Anforderungen, surface-form-treue, `historical_canon_layer`-Marker für pre-modern-Canon, `data_conflict`-Flag-Konventionen, etc.). Web-Search-Befugnis liegt bei CC's eingebautem WebSearch-Tool — keine separate Anthropic-API-Konfiguration.
- **Loop-Driver-Skript.** `scripts/run-ssot-loop.sh` (Brief 071-impl): Bash-Single-File-Wrapper, `gh pr create`-idempotent, ⏸-Stop bei jeder 50er-Schwelle (Brief-061-Algorithmus `cumulative % 50 == 0` → loud-stop für Resolver-Brief, override per `skip-50-stop`-Marker im Eröffnungs-Prompt).
- **Resolver-Schicht unverändert.** `src/lib/resolver/`, `scripts/seed-data/{factions,locations,characters}.json`, `scripts/seed-data/{faction,location,character}-aliases.json`, `scripts/seed-resolver-extensions.ts`, `scripts/apply-override.ts`. Die Übersetzung Surface-Form → Canonical-ID lebt komplett außerhalb der LLM-Schicht und ist deterministisch.
- **Audit-Schicht unverändert.** Maintainer-Cockpit aus Brief 073 (`/buch/[slug]/audit` + `/buecher`-Audit-Pillen) ist die laufende Quality-Loop. Drift-Pille zeigt raw_name-vs-canonical-Drift; freq-/confidence-Sort innerhalb der Pille ist offene Quality-Feedback-Verbesserung aus 074-impl.

## Why

- **Maintainer-Kontrolle ist heute load-bearing.** Die SSOT-Phase ist eine Curation-Phase, keine Bulk-Pipeline-Phase. Jeder 10er-Batch profitiert davon, dass der Maintainer die Surface-Forms sieht und Entscheidungen trifft (welche neuen Factions promoten, welche Aliase, welche `historical_canon_layer`-Marker). Eine strukturierte Pipeline würde die Curation hinter einem deterministischen Prompt verstecken; CC-Direct-Curation hält sie sichtbar.
- **Kein separates Token-Budget.** Anthropic-API-Calls aus der V2-LLM-Stage liefen gegen einen separaten `ANTHROPIC_API_KEY` mit eigenem Cost-Tracker (~$0.0199/Buch fresh-Smoke, $15 Hochrechnung für 750 Bücher V2-Voll-Lauf). CC-Subsessions laufen gegen die generelle Claude-Allowance des Maintainers — Cost-Tracking ist nicht buch-granular, aber im Hobby-Rahmen tragbar und vermeidet die parallele API-Key-Wartung.
- **Modell-Qualität ist höher.** CC's Default-Modell (Opus heute, Sonnet als Fallback) ist semantisch stärker als das Haiku der V1-Pipeline und teurer/besser als das Sonnet der V2-Stage (siehe [`./why-sonnet-not-haiku.md`](./why-sonnet-not-haiku.md) — die Architektur-Entscheidung pro Sonnet adressiert genau die Pathologien, die ein noch stärkeres Modell strukturell vermeidet). Empirisch: die 150 Bücher aus 001..015 zeigen weniger `value_outside_vocabulary`-Flags und sauberere Surface-Form-Treue als die V2-Pilot-Ergebnisse aus 054 / 055.
- **Latenz drastisch niedriger.** Stage 1 (Source-Claims-Crawl) hat im 055-Voll-Lauf 70 Minuten pro 100 Bücher gekostet, davon ~60 Minuten Lexicanum-Throttle (5 s × 11 URL-Patterns × ~70% lex-missing). Brief 056 hat den per-page Lex-Cache eingeführt (5000× Speedup auf Re-Runs), aber Cold-Cache-Latenz blieb hoch. CC-Direct-Curation überspringt Stage 1 komplett — CC's eingebauter WebSearch entscheidet pro Buch, ob ein Lookup nötig ist. Ein 10er-Batch ist heute eine ~20-Minuten-Session statt einer ~7-Minuten-Pipeline-Lauf+stundenlange-Wartezeit.
- **Resolver-Loop bleibt strukturell sauber.** Surface-Forms aus den Override-Files werden in `scripts/seed-data/{factions,locations,characters}.json` + Aliase kuratiert, dann via `seed-resolver-extensions` in die DB geseedet, dann via `apply-override.ts` als Junctions geschrieben. Diese Trennung — "Pipeline produziert Surface-Forms, Resolver-Schicht crystallisiert sie" — ist unter beiden Optionen gleich. CC-Direct-Curation respektiert sie sauber.

## Trade-Off (was wir bewusst akzeptieren)

- **Reproduzierbarkeit ist niedriger.** Ein zweiter Lauf der V2-Pipeline mit identischem Roster + Cache produziert byte-identische Diffs (per `PROMPT_VERSION_HASH_V2` + deterministische Validatoren). Ein zweiter `claude -p`-Lauf mit identischem Prompt produziert ähnliche, nicht identische Override-Files. Akzeptabel weil: (a) Override-Files sind committed (`scripts/seed-data/manual-overrides-ssot-w40k-NNN.json`), die *Daten* sind reproduzierbar via Git; (b) der `claude -p`-Lauf produziert Material, das Maintainer sowieso reviewen würde — Determinism ist nicht der wertvolle Property hier, Curation-Qualität ist es.
- **Source-Provenance pro Feld fehlt.** V2's `FieldRecord<T> = { value, source, fetchedAt, override?, evidence? }` ist im Override-Format nicht erhalten — die Override-Datei trägt nur die finalen Werte. `book_details.confidence` (heute ~1.00 für alle SSOT-Bücher) + `book_details.notes` (Surface-Forms-Block) + Maintainer-Audit-Cockpit (Brief 073) übernehmen die Provenance-Rolle pragmatisch. Wirklicher Verlust nur, wenn jemand später die Frage stellt "welche Source hat dieses Year-Feld geliefert" — Antwort heute: "der Excel-SSOT, mit Maintainer-Override-Möglichkeit".
- **Keine deterministischen Validatoren.** `year_outlier`, `edition_isbn_conflict`, `pagecount_outlier`, `author_editor_suspicion`, `lexicanum_missing` aus der V2-Stage 2 laufen nicht mehr. `claude -p` macht ähnliche Sanity-Checks ad-hoc (sieht Lexicanum-Body, korrigiert offensichtliche Jahres-Halluzinationen), aber ohne Pflicht-Gate. Mitigation: die Audit-Cockpit-Pillen (Drift, Gap) machen Validator-äquivalente Auffälligkeiten sichtbar; Maintainer reviewt pro Buch.
- **Source-Coverage ist implizit.** V2-Pipeline garantierte explizit, dass Hardcover-Calls für jedes Buch laufen (mit Result oder Silent-Skip). CC-Subsessions entscheiden pro Buch, ob sie WebSearch aufrufen — könnte einzelne Bücher mit nicht-optimalen Quellen "auflösen", wenn CC nicht searcht. Bisher empirisch unauffällig (150 Bücher), aber bleibt strukturell wahr.
- **Multi-Source-Merge entfällt.** Die `field-priority.ts`-Logik aus [`./why-multi-source-merge.md`](./why-multi-source-merge.md) ist in der CC-Direct-Curation effektiv durch Maintainer-Override + CC-Judgment ersetzt. Die ADR-Begründungen für den Merge (deterministisch, debuggable, source-aware) bleiben theoretisch korrekt — sie sind nur nicht der operative Pfad.

## When this decision should be revisited

- **Wenn Reproduzierbarkeit zum bindenden Anspruch wird.** Beispiel: ein externer Reviewer will die Daten reproduzieren können, oder ein Co-Maintainer trägt bei und braucht die deterministische Pipeline als gemeinsames Werkzeug. Promote-Pfad: zurück zu Option A (Reaktivierung der V2-LLM-Stage), Cost-Trade-Off pro [`./why-sonnet-not-haiku.md`](./why-sonnet-not-haiku.md) ist akzeptiert.
- **Wenn CC-Direct-Curation systematische Qualitätsprobleme zeigt.** Beispiel: das Audit-Cockpit zeigt einen Drift-Cluster, der mit der V2-Stage-2-Validatoren strukturell verhindert worden wäre (z. B. ein `year_outlier`-Fall slippt durch). Cockpit-Triage post-074-impl ist hier der erste Probe-Punkt — wenn die Cockpit-Pillen >10% der applied Bücher in einer Triage-Spur halten, wäre das ein Hebel.
- **Wenn das Token-Budget der Maintainer-Claude-Allowance klar wird, dass es teurer ist als die API-Calls.** Heute nicht der Fall (Hobby-Rahmen), aber bei aktivem Cockpit-Refinement + Resolver-Pässen + Loop-Iterationen + parallelen Briefen könnte die Allowance limitierend werden. Trigger: Maintainer beobachtet Subscription-Limits.
- **Wenn die V2-LLM-Stage strukturelle Upgrades bekommt** (z. B. ein neuer Modell-Tier wird verfügbar, der unter dem alten API-Pfad billiger UND besser ist als CC's Default), kann das Trade-Off sich umkehren.
- **Wenn der Resolver-Loop pro Welle systematisch >100 Surface-Forms aus einer einzelnen Iteration fängt** (Long-Tail wird zu Mid-Tail). Das würde implizieren, dass die LLM-Curation-Qualität nachlässt oder dass die Domain-Coverage strukturell breiter wird; in beiden Fällen wäre ein Pipeline-Rerun mit härteren Prompts billiger als die kumulative Resolver-Arbeit.

## Aftermath

Brief 074 hat OQ1 (Sonnet-vs-Haiku) und OQ2-(c) (`chaos`-pov_side-Prompt-Härtung) als moot-post-Pipeline-Shift identifiziert; die Wiki-Hygiene-Session 2026-05-15 (post-074-impl) hat diesen ADR geschrieben und beide OQs aus dem active-set bereinigt:

- OQ1 in [`../open-questions.md`](../open-questions.md) bleibt als `~~closed~~`-Marker mit Verweis auf diesen ADR (Story-Continuity); operative Wahrheit ist hier.
- OQ2-(c) ist nach [`../deferred-questions.md`](../deferred-questions.md) gewandert mit Promote-Triggern (Cockpit-Drift-Cluster ≥5 Traitor-Legion-Bücher oder V2-LLM-Reaktivierung).
- [`../pipeline-state.md`](../pipeline-state.md) trägt einen Banner-Hinweis im V2-LLM-Stage-Abschnitt, dass die Stage de-facto ausgemustert ist; Code-Beschreibung bleibt unangetastet (Reaktivierungs-Sicherung).

Operativer Status post-Wiki-Hygiene: 150 W40K-Bücher in der DB via CC-Direct-Curation produced; Resolver-Pass 3 (Brief 074-impl) gerade geschlossen; nächste Iteration `ssot-w40k-016` über `claude -p`-Subsession (mit `skip-50-stop`-Marker bis zur 200er-Resolver-Pause).
