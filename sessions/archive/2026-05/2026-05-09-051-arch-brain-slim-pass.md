---
session: 2026-05-09-051
role: architect
date: 2026-05-09
status: implemented
slug: brain-slim-pass
parent: 2026-05-09-050
links:
  - 2026-05-09-050
  - 2026-05-08-049
  - 2026-05-09-049
commits: []
---

# Brain Slim Pass — Sessions, ADRs, Queues und Repo-Brain verschlanken

## Goal

Das Repo-Brain nach dem Hygiene-Pass 050 bewusst schlanker machen: weniger doppelte Doku, kürzere Einstiegsflächen, schnellere Archivierung alter Sessions, präzisere ADRs und eine klare Trennung zwischen "jetzt relevant", "historisch wichtig" und "später vielleicht".

Der Karpathy-Reset bleibt richtig. Diese Session ist kein Rollback, sondern der zweite Schnitt: **das Brain soll nicht nur korrekt, sondern leicht bleiben.**

## Context

Ein Review der aktuellen Struktur hat sechs valide Verschlankungsfelder ergeben:

1. `sessions/README.md` ist noch zu schwer und wiederholt halbe Session-Historien.
2. `docs/agents/*` konkurriert mit `brain/wiki/workflows/*` als Workflow-Wahrheit.
3. Abgeschlossene Sessions liegen zu lange im Root von `sessions/`; einige Statuswerte sind stale.
4. ADRs sind nützlich, aber teils zu report-artig und zu zahlenlastig.
5. `open-questions.md` vermischt echte Next-Brief-Queue mit dormant/backlog Themen.
6. `ingest/` wird durch committed Diff-JSONs perspektivisch der größte Repo-Wachstumshebel; dafür braucht es eine Retention-Policy.

Diese sechs Punkte sind vom Maintainer bestätigt und sollen in einem kompakten Docs-/Brain-only-Pass umgesetzt werden.

## Constraints

- Brief 050 (Hygiene-Pass) ist gelandet (Commits `e220e9f` … `f80aa16`); 051 baut darauf auf, Link-Audit muss nicht erneut komplett laufen, aber jeder neue Move/Edit prüft seine eigenen Folge-Links.
- Keine App-, Pipeline-, DB- oder Migration-Codeänderungen.
- Keine Inhalte aus `brain/raw/historical/` bearbeiten.
- Session-Logs dürfen verschoben und Frontmatter-Statuswerte korrigiert werden, aber nicht inhaltlich umgeschrieben.
- Keine Wissenslöschung: was gekürzt wird, muss entweder in Session-Logs, Raw-Sources, `brain/wiki/log.md`, `pipeline-state.md`, `roadmap.md` oder einem Archivpfad auffindbar bleiben.
- Nach jedem Move alle relativen Links in `brain/wiki/**`, `sessions/README.md`, `CLAUDE.md` und ggf. `docs/**` prüfen.

## Work Items

### 1. `sessions/README.md` radikal kürzen

Ziel: README ist Navigation, nicht Geschichtsbuch.

- Active-Threads-Tabelle auf maximal 3-5 Einträge kürzen.
- Jede Zeile: Session, Role, Status, maximal 1 kurzer Satz.
- Lange Beschreibungen raus; Details bleiben in den Session-Files und im Brain.
- Infrastructure-Log bleibt nur als Pointer auf `brain/wiki/log.md`.
- Carry-over bleibt nur als Pointer auf `brain/wiki/open-questions.md`.

Akzeptanz: `sessions/README.md` ist deutlich kürzer und in unter 30 Sekunden scannbar.

### 2. Session-Archivierungsregel einführen und anwenden

Neue Regel dokumentieren in `brain/wiki/workflows/sessions-format.md` und/oder `sessions/README.md`:

- Root `sessions/` enthält nur:
  - aktuell offene Briefs,
  - `needs-decision` Threads,
  - maximal die letzten 1-2 gerade abgeschlossenen Sessions, falls sie für direkten Kontext nötig sind.
- Alles andere wandert zügig nach `sessions/archive/YYYY-MM/`.

Dann anwenden:

- Stale Statuswerte korrigieren, mindestens:
  - 034 ist nicht mehr `open`
  - 038 ist nicht mehr `open`
  - 045 ist nicht mehr `open`
- Abgeschlossene ältere Phase-3-Sessions aus dem Root archivieren, soweit sie nicht für die aktuelle Slim/Hygiene-Arbeit offen bleiben.
- Alle Brain-Links nach dem Move aktualisieren.

Akzeptanz: keine klar erledigte Session im Root trägt noch `status: open`.

### 3. `docs/agents/*` entschärfen

Ziel: eine aktuelle Workflow-Wahrheit.

- `brain/wiki/workflows/cowork-session.md`
- `brain/wiki/workflows/cc-session.md`
- `brain/wiki/workflows/sessions-format.md`

sind künftig canonical.

Option bevorzugt: `docs/agents/{COWORK,CLAUDE_CODE,SESSIONS}.md` zu kurzen Legacy-/Redirect-Dateien machen:

- "Canonical now: `brain/wiki/workflows/...`"
- "Kept for old session links / historical bootstrap context."
- Keine langen Regeln mehr doppelt halten.

Top-level `CLAUDE.md` entsprechend anpassen: Session-start verweist auf Brain-Workflows, nicht primär auf `docs/agents/*`.

### 4. ADRs kürzen

ADRs bleiben, aber sie werden präziser.

Neue ADR-Regel dokumentieren, z. B. in `brain/CLAUDE.md` oder `brain/wiki/workflows/ingest.md`:

- ADRs beantworten: Context, Decision, Why, Revisit triggers.
- Keine laufenden Batch-Zahlen, keine langen Report-Zusammenfassungen.
- Metriken und aktuelle Pipeline-Zahlen gehören nach `pipeline-state.md`.
- Session-Historie gehört in Session-Files oder `brain/wiki/log.md`.

Konkret kürzen:

- `brain/wiki/decisions/karpathy-reset-2026-05-08.md`
- `brain/wiki/decisions/why-haiku-not-sonnet.md`
- weitere ADRs nur, wenn sie ähnlich report-artig sind.

Akzeptanz: ADRs sind weiterhin verständlich, aber deutlich weniger chronologisch/protokollarisch.

### 5. `open-questions.md` in echte Queue + Deferred trennen

Ziel: Next-Brief-Queue bleibt klein.

- `open-questions.md` enthält nur noch 3-5 unmittelbar handlungsrelevante Punkte.
- Dormant Items wandern nach:
  - `brain/wiki/deferred-questions.md` oder
  - passende Roadmap-/Pipeline-Backlog-Sektion.
- Items 4-8 sind Kandidaten für Deferred.
- Item 9 ist zu breit; in Zielbereiche auflösen:
  - 3d Apply reminders nach `pipeline-state.md`
  - future/distant nach `roadmap.md` oder Deferred.

Index und Related-Links aktualisieren.

Akzeptanz: `open-questions.md` ist wieder eine echte Arbeitsliste, kein Sammelbecken.

### 6. Retention-Policy für `ingest/` festlegen

Keine Dashboard-/Pipeline-Änderung in dieser Session, aber die Policy muss stehen.

Dokumentieren in `brain/wiki/pipeline-state.md` oder neuem `ingest/README.md`:

- Welche Diff-JSONs werden dauerhaft committed?
- Welche sind Acceptance-Artefakte?
- Welche sind temporäre Batch-Artefakte?
- Ab wann reichen Summary + ausgewählte Diffs statt alle Full-Diffs?
- Vor dem Löschen bestehender `.last-run`-Diffs braucht es separaten Dashboard-Brief, weil `/ingest` aktuell committed JSONs liest.

Akzeptanz: Noch keine riskante Löschung, aber eine klare Regel gegen zukünftiges Repo-Anschwellen.

## Acceptance

- `sessions/README.md` ist kurz und navigational.
- Root `sessions/` enthält nur aktive/recent Sessions nach neuer Regel.
- Stale Session-Statuswerte sind korrigiert.
- `docs/agents/*` sind keine konkurrierende Source of Truth mehr.
- ADRs sind gekürzt, besonders Karpathy-Reset und Haiku/Sonnet.
- `open-questions.md` hat maximal 3-5 echte Next-Brief-Items.
- Deferred/Dormant-Themen sind auffindbar, aber nicht in der Startqueue.
- Ingest-Diff-Retention ist dokumentiert.
- `brain/wiki/index.md` und `brain/wiki/log.md` sind aktualisiert.
- Relative Links nach Archiv-Moves geprüft.
- Diff berührt nur Docs/Brain/Sessions, nicht `src/`, `scripts/`, DB-Migrationen oder Pipeline-Code.

## Out of scope

- `brain:lint` Script. Wird nach diesem Slim-Pass Brief 052.
- Pipeline-/Dashboard-Code ändern.
- Alte Session-Inhalte redigieren.
- Raw historical snapshots ändern.
- Bestehende ingest Diff-JSONs löschen, solange Dashboard-Abhängigkeit nicht geklärt ist.

## Report expectations

Im Implementer-Report bitte konkret nennen:

- Welche Sessions verschoben wurden.
- Welche Statuswerte korrigiert wurden.
- Welche ADRs gekürzt wurden und grob um wie viel.
- Was aus `open-questions.md` nach Deferred/Roadmap/Pipeline-State gewandert ist.
- Welche Policy für `ingest/` beschlossen wurde.
- Welche Link-Prüfung gelaufen ist.
