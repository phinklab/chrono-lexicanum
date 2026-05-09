---
session: 2026-05-09-052
role: architect
date: 2026-05-09
status: implemented
slug: ingest-retention-strategy
parent: 2026-05-09-051
links:
  - 2026-05-09-051
  - 2026-05-09-050
commits: []
---

# Ingest-Retention — Decision: Option A (für jetzt)

## Decision (TL;DR)

**Alle Ingest-Diff-Files bleiben committed in `ingest/.last-run/`.** Kein Manifest, kein Summary-Writer, kein Dashboard-Refactor — Status quo bleibt der Status quo. Brain-Disziplin (nie inline-quoten) wird als Regel ergänzt. Re-evaluate-Trigger werden explizit gesetzt, damit wir den Moment nicht verpassen, wenn Option A nicht mehr trägt.

Begründung in zwei Sätzen: Die Pipeline-Daten-Erhebung ist noch nicht ausgereift, also wollen wir die Voll-Diffs als Apply-Input + Audit-Material + Triage-Anker lokal haben. Das Repo ist heute bei 808 KB — kein akuter Druck rechtfertigt jetzt Manifest- + Summary-Komplexität.

**Diese Session ist Cowork-only** — kein CC-Turn, keine Code-Änderung, keine Datei-Verschiebung.

## What gets done in this session

- Diese Brief-Datei selbst (Decision-Record).
- `brain/wiki/pipeline-state.md` § "Ingest-diff retention" um die Option-A-Wahl + Brain-Inline-Quote-Verbot + Re-evaluate-Trigger ergänzen.
- `brain/wiki/log.md` Eintrag.
- `sessions/README.md` Active-Threads-Tabelle: 052 → status `implemented`.

Nichts weiter. Kein Code, kein Schema, keine `.gitignore`, keine Dashboard-Änderung.

## Re-evaluate-Trigger

Option A bleibt gültig, **bis** mindestens einer der folgenden Trigger feuert. Dann wird ein neuer Brief geöffnet, der die Strategie revisited:

1. **Repo-Größe.** `ingest/.last-run/` überschreitet 5 MB. (Heute 808 KB; Hochrechnung 3e-Voll-Lauf ~4–5 MB; das ist die natürliche Schwelle.)
2. **3d-Apply ist gelaufen + stabil.** Sobald Apply produktiv DB-Writes erzeugt hat, wird ein Teil der Diff-Daten redundant (DB ist dann der Beweis, nicht der Diff). Das ist der natürliche Moment für Stufe 2 (Tier-D-Cold-Archive).
3. **Vor 3e-Voll-Lauf**, falls die Hochrechnung dann doch über die 5-MB-Marke ginge.
4. **Wenn ein Wiki-Page versehentlich Diff-Inhalt inline lädt** (Brain-Regel-Verstoß; Lint sollte das fangen, sobald das Skript existiert).

## Brain-Regel (gilt unabhängig von der Storage-Wahl)

Wiki-Pages zitieren Diff-Files **ausschließlich** per `sources:`-Frontmatter-Pfad — niemals inline. Aggregate (Cost/Buch, Junction-Coverage, Flag-Histogramm, primarySource-Distribution) gehören als synthetisierte Kennzahlen in `brain/wiki/pipeline-state.md`. Inline-Quotes aus `payload`, `updated[].diff`, `llm_flags`, `rawLlmPayload`, `rawHardcoverPayload` sind verboten — das sind Roh-Daten, kein Brain-Material.

Diese Regel ist universell. Sie hängt nicht an Option A; sie schützt das Brain davor, dass eine 130-KB-JSON-Inhalt in eine Wiki-Synthese kriecht.

## Was Option A nicht ist

- **Kein Freibrief, Diff-Files niemals zu löschen.** Existierende Hard-Rule (aus 051) bleibt: kein Diff darf gelöscht werden, solange das Dashboard `ingest/.last-run/` direkt enumeriert. Eine zukünftige Cleanup-Sweep braucht weiterhin einen separaten Brief, der Dashboard-Read-Path geprüft hat.
- **Keine Aussage über die Tier-A/B-Files vom 2026-05-03.** Die drei Sonnet/Haiku-A/B-Vergleichs-Files sind heute Audit-Anker für `decisions/why-haiku-not-sonnet.md`. Sie bleiben drin, bis die ADR-Sources-Liste aktiv reduziert wird (eigener Brief, nicht jetzt).
- **Keine Code-Änderung am Diff-Writer / Dashboard / Schema.** Status quo der Implementierung.

## Rationale-Zusammenfassung (kurz)

Eine längere Analyse der sechs vorgeschlagenen Optionen (A: alles committen + Brain-Regel · B: Summary-only + gitignored Full · C: Acceptance committen, Routine als Summary · D: GitHub Releases · E: Komprimierung im File · F: Dashboard auf Summary umbauen) lag in einer früheren Fassung dieses Briefs vor — Stand Cowork-Vor-Analyse. Kernbefunde, die für die Option-A-Wahl tragen:

- Apply-relevante Daten pro Buch (`payload`, `rawLlmPayload.facetIds`, `rawLlmPayload.discoveredLinks`, `llm_flags`) sind **Apply-Input**, nicht reines Audit. Solange 3d-Apply nicht gelaufen ist, müssen sie zugänglich bleiben.
- Aktuelle Größe (808 KB) liegt deutlich unter dem Trigger; Komplexität (Manifest-File + Summary-Writer + Dashboard-Listen-Refactor) wäre verfrüht.
- Brain-Disziplin (nie inline-quoten) löst das Brain-Wachstumsproblem ohne Storage-Migration.
- Dashboard-Listenansicht-Performance ist aktuell kein Schmerz (Build-Zeit Vercel ist nicht limitiert).

Wenn ein Trigger feuert, ist die wahrscheinliche Nachfolge-Strategie **Option C+F** (Tier-D-Routine → Cold-Archive nach Apply, Summary-getriebene Listenansicht). Die Analyse der Tiers (Smoke / Test-Rerun / Acceptance / Routine-Batch) und der Per-Feld-Klassifikation aus der Vor-Fassung bleibt nutzbar, sobald der Re-evaluate-Brief ansteht — Git-Historie hält sie vor.

## Acceptance

- [x] Decision dokumentiert (dieser File).
- [x] `brain/wiki/pipeline-state.md` § "Ingest-diff retention" reflektiert Option A + Brain-Regel + Re-evaluate-Trigger.
- [x] `brain/wiki/log.md` Eintrag.
- [x] `sessions/README.md` Active-Threads aktualisiert.

## Out of scope

- Code-Änderung jeder Art.
- Datei-Verschiebung / Datei-Löschung in `ingest/.last-run/`.
- `.gitignore`-Änderung.
- Dashboard-Refactor.
- Manifest- / Summary-File-Einführung.
- Folge-Brief 053 für CC (kommt erst, wenn ein Trigger feuert oder unabhängig bei Lint-Skript).

## Notes

- Pre-Decision-Fassung dieses Briefs (mit ausführlichem Vergleich A–F + 11-Regel-Policy + 053-Stub) lebt in Git-Historie. Wenn ein Re-evaluate-Trigger feuert, dort als Startpunkt graben.
- Lint-Skript-Brief (053 oder höher) sollte den „Inline-Diff-Quote"-Check als prüfbares Kriterium aufnehmen, sobald das Skript geschrieben wird.
