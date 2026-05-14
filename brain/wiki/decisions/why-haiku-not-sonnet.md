---
title: Why Haiku 4.5, not Sonnet 4.6 (superseded)
type: decision
created: 2026-05-04
updated: 2026-05-13
sources:
  - ../../../sessions/archive/2026-05/2026-05-03-038-arch-phase3c-llm-enrichment.md
  - ../../../sessions/archive/2026-05/2026-05-03-039-impl-phase3c-llm-enrichment.md
  - ../../../sessions/archive/2026-05/2026-05-04-040-arch-phase3c-haiku-switch.md
  - ../../../sessions/archive/2026-05/2026-05-04-042-impl-phase3c-haiku-switch.md
  - ../../../sessions/archive/2026-05/2026-05-05-045-impl-cc-vs-pipeline-comparison.md
related:
  - ./why-sonnet-not-haiku.md
  - ../pipeline-state.md
  - ../open-questions.md
confidence: high
decision-date: 2026-05-04
superseded-by: ./why-sonnet-not-haiku.md
superseded-on: 2026-05-13
---

# Why Haiku 4.5, not Sonnet 4.6 — superseded

**Status:** superseded 2026-05-13 by [`./why-sonnet-not-haiku.md`](./why-sonnet-not-haiku.md). Diese ADR bleibt als Stub für Story-Continuity erhalten; der vollständige Text der Pre-Cockpit-Argumentation lebt im Git-History-Stand vor 2026-05-13 (`git log --follow brain/wiki/decisions/why-haiku-not-sonnet.md`).

## Kurzversion der ursprünglichen Argumentation (2026-05-04)

- Phase-3c war originally mit Sonnet 4.6 + Web Search geplant; 20-Buch-Test kam 2× über Budget ($0.35/Buch → $280 Voll-Lauf vs. erwartet $60–160).
- Haiku 4.5 Re-Run lag bei $0.11/Buch → ~$88 Voll-Lauf, ohne messbaren Synopsis-Qualitätsverlust auf den Achsen, die wir testen konnten.
- Cost-Gap (3× Input-Token-Preis) ist strukturell, nicht anomal — persistiert über 800 Bücher.
- Plausibility-Depth-Gap (Sonnet löst `dual` vs `imperium` bei `mark-of-calth`, `vengeance`-Vokabular-Drift) ist real aber wurde als „schmaler als befürchtet" bewertet und durch Hand-Check für Prestige-Reads abgedeckt.
- Hebel E (Hardcover-Author-Hint, Brief 047) sollte Haiku's Anthologie-Blindheit prompt-seitig schließen.

## Warum die Entscheidung 2026-05-13 revidiert wurde

Pre-Cockpit war Datenqualität nur über Stichproben in Hand-Check-Sessions sichtbar; das Plausibility-Depth-Gap-Argument zugunsten Haiku verließ sich darauf, dass die Pathologien nicht im UI auftauchen würden. Mit OQ9 (Maintainer-Cockpit, eingeführt 2026-05-13) wird Datenqualität sichtbar und Maintainer-Triage-Aufwand pro Pathologie steigt — der Trade-off kippt. Cost-Argument bleibt strukturell gültig ($45–70 Sonnet vs. $15 Haiku für 750-Bücher-Voll-Lauf), aber wird gegen den höheren Triage-Aufwand aufgewogen statt absolut bewertet.

Volle Argumentation für den Pivot in [`./why-sonnet-not-haiku.md`](./why-sonnet-not-haiku.md).
