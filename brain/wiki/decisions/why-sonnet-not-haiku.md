---
title: Why Sonnet (current major), not Haiku 4.5
type: decision
created: 2026-05-13
updated: 2026-05-15
sources:
  - ../../../sessions/archive/2026-05/2026-05-05-045-impl-cc-vs-pipeline-comparison.md
  - ../../../sessions/archive/2026-05/2026-05-04-040-arch-phase3c-haiku-switch.md
  - ../../../sessions/2026-05-11-061-arch-ssot-loop.md
  - ../../../sessions/2026-05-15-074-impl-resolver-batch-3.md
  - ../open-questions.md
related:
  - ./why-cc-direct-curation.md
  - ./why-haiku-not-sonnet.md
  - ../pipeline-state.md
  - ../open-questions.md
confidence: high
decision-date: 2026-05-13
supersedes: ./why-haiku-not-sonnet.md
---

# Why Sonnet (current major), not Haiku 4.5

**Status:** historical artefact + reactivation guard post-CC-Direct-Curation. Supersedes [`./why-haiku-not-sonnet.md`](./why-haiku-not-sonnet.md), die als Stub mit Story-Continuity-Pointer erhalten bleibt. Operative Wahrheit seit Brief 061 ist [`./why-cc-direct-curation.md`](./why-cc-direct-curation.md): die V2-LLM-Stage läuft nicht mehr als aktiver Bulk-Backfill-Pfad. Falls diese Stage reaktiviert wird, bleibt Sonnet die Default-Wahl gegenüber Haiku.

## Context

OQ1 (Phase-3e-Modell-Entscheidung) stand seit 040 offen. Trade-off war seit 045 empirisch geklärt: Sonnet ~3× Haiku-Cost, aber semantisch besser bei einer kleinen Menge konkreter Pathologien (`mark-of-calth` `dual` vs `imperium`, `vengeance`-Vokabular-Drift, nuancierteres Plausibility-Reasoning). Bis 2026-05-13 hat das Cost-Argument für Haiku gehalten, weil keine UI-Fläche die Datenqualität sichtbar gemacht hat.

Mit der Cockpit-Phase (OQ9, Trigger 100 Bücher applied) ändert sich die Bewertung: Datenqualitäts-Pathologien werden im Audit-View als rote Lampen sichtbar, Maintainer-Triage-Aufwand pro Pathologie ist non-zero, und die Pathologien, die Sonnet seltener produziert, sind genau die, die im Cockpit am häufigsten aufgehen würden.

## Decision

**Historische Entscheidung / Reaktivierungs-Sicherung:** Wenn die Pipeline-Enrichment-Stage wieder aktiv wird, läuft sie mit Sonnet (current Anthropic stable, Codex pinnt die konkrete Version im shared LLM-Konfigurationspfad `src/lib/ingestion/llm/enrich.ts`; V2 importiert ihn über `src/lib/ingestion/v2/llm/enrich.ts`). Ad-hoc-Override auf Haiku oder anderes Modell bleibt per Env-Variable möglich für Cost-sensitive Re-Runs.

Seit Brief 061 ist das nicht mehr der aktive Ausführungspfad: `claude -p`-Subsessions produzieren die Override-Dateien direkt, und die V2-LLM-Stage bleibt nur als Reaktivierungs-Sicherung im Repo. Es gibt deshalb keinen offenen Implementations-Touch aus dieser ADR, solange CC-Direct-Curation der operative Pfad bleibt.

## Why

- **Cockpit verschiebt das Bewertungskriterium.** Pre-Cockpit war Datenqualität nur über Stichproben in Hand-Check-Sessions sichtbar; jede LLM-Pathologie kostete Maintainer-Detektivarbeit. Mit Cockpit-Audit-View wird Pathologie zum sichtbaren Datum, und der Wert von „LLM produziert weniger Pathologien von vornherein" steigt. Sonnet-Output reduziert die rote-Lampen-Dichte, die Cockpit triagieren muss.
- **Cost ist im Hobby-Rahmen tragbar.** 055-Empirie auf Haiku: ~$0.0199/Buch fresh-Run-Cost (5-Book-Smoke), Hochrechnung 750-Bücher-Voll-Lauf ~$15. Sonnet bei ~3–4× Haiku landet bei ~$45–70 für den gleichen Voll-Lauf. Absolute Größenordnung bleibt im „let it run"-Bereich, auch wenn relativ teurer.
- **Re-Runs sind günstiger als der Erstauf.** 056 hat per-page Lexicanum-Cache + per-book Diff-Checkpointing eingeführt; ein Sonnet-Re-Run auf bestehenden Cache trifft nur die LLM-Call-Cost, nicht die Source-Crawl-Cost. Cockpit-getriebene Re-Apply-Iterationen (z. B. „re-run alle Bücher die im Cockpit als facets-thin markiert wurden") landen damit im Cents-Bereich, nicht im Dollar-Bereich.
- **Semantische Wins sind 40K-spezifisch real.** Die `dual`-vs-`imperium`-Frage bei `mark-of-calth` ist kein Random-Beispiel — es ist die Klasse von Heresy-Edge-Cases (Word Bearers vs. Ultramarines mit ambivalenten Heresy-Loyalitäten), die in der gesamten 30k-Domain auftaucht. Sonnet löst die generisch besser, ohne pro-Buch-Prompt-Härtung.

## What stays from the Haiku ADR

- **Vokabular-ID-Bare-Form-Anforderung** und **Format-Required-Verhalten** sind Prompt-Härtungen, die modell-agnostisch nützlich bleiben. Migrieren in den neuen Modell-Slot 1:1.
- **`value_outside_vocabulary` als nützliches Signal** (Haiku flaggt `duty` × 5) bleibt produktive Eigenschaft, die mit Sonnet auf gleicher Schwelle weiterlaufen sollte. Cockpit-Triage konsumiert diese Flags.
- **Hand-Check-Workflow für Prestige-Reads** (OQ3) ist orthogonal zur Modell-Wahl und bleibt notwendig — Sonnet macht ihn nicht obsolet, nur leichter (weniger Falschalarme pro Buch).

## Revisit triggers

- **Cockpit-Triage zeigt nach 200 Büchern Sonnet-Output mit gleicher Pathologie-Dichte wie Haiku-Output war.** Dann hat sich der Cost-Aufschlag empirisch nicht gelohnt; zurück zu Haiku ist eine Env-Variable.
- **Voll-Lauf-Cost überschießt $80 hochgerechnet.** Hochrechnungsbasis ist 5-Book-Smoke mit Sonnet auf SSOT-Modus; wenn die ersten 50 Sonnet-Bücher überproportional viele Web-Searches ziehen, ist die $45–70-Schätzung nicht mehr gültig.
- **Anthropic released Haiku 5+ mit materially besserer Plausibility.** Drop-in-Downgrade, Cost-Argument greift wieder.
- **Cockpit-getriebene Re-Apply-Cadence verlangt aus operativen Gründen kürzere Iterations-Zeit als Sonnet liefert.** Latenz-Argument (heute nicht akut, weil Pipeline-Lauf nicht user-facing ist).

Pre-Cockpit-Bewertung mit dem ausführlichen Cost-vs-Quality-Trade-off auf Haiku-Seite (post-045): siehe Stub-File [`./why-haiku-not-sonnet.md`](./why-haiku-not-sonnet.md) für den Pointer in den Git-History-Stand vor 2026-05-13.
