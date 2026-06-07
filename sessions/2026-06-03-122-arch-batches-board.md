---
session: 2026-06-03-122
role: architect
date: 2026-06-03
status: open
slug: batches-board
parent: null
links: []
commits: []
---

# 122 — Batches board (standing)

Stehendes Strang-Board. Daten + Logik, kein UI (das ist 121). Status-Spalte = Wahrheit.

**Ablauf.** Wie 121: Briefing pro Task über Chat (Cowork → Philipp → CC), kein Input-Doc im Repo. CC baut bei Abschluss ein **sehr kleines** Handoff-Doc in `sessions/`; Cowork reviewt + archiviert.

**Strang.** Worktree `chrono-lexicanum-batches`, Branch `codex/ingest-batches-*`. Code/Daten/Config → branch + PR. `brain/**` + `sessions/README.md` nicht anfassen (Rollup).

## Guardrails (hart)

- Jede zugefügte/gescrapte Row trägt `source_kind` + `confidence`.
- Hand-Overrides über `BookV2Record.fields.<f>.override` bzw. Override-JSON unter `scripts/seed-data/`. Override-Format → B2 definiert es.
- Schema-Change + generierte Migration zusammen committen; committe Migrationen nie umbenennen/löschen.
- Keine Version-Pins (CC recherchiert/pinnt). Keine neuen Entity-Bilder.

## Tasks

| # | Task | Status |
|---|---|---|
| B4 | Ask-Modell + Logik: `ask-questions` + `recommend(antworten) → Ranking` über Buch-DB, gegen Typen-Contract (kommt per Chat). **Zuerst — blockt 121-P3** | ☑ erledigt (B4.1–B4.5; siehe 125) |
| B1 | Podcast Step 3: weitere Shows; pro Show website/youtube/spotify-Link wo vorhanden; Schema ggf. um Show-Links | ☐ |
| B2 | Buch-Kuratierung: Faction add/remove + Hand-Fixes via Override; Content-Warnings aus Daten/Schema; Override-Format definieren (was auto-rollt / Augen braucht) | ☐ |
| B3 | Entity-Blurbs: F/C/W je 1–2 Satz per Websuche als Seed/Override-Daten. Kurz, faktisch, kein Lore-Essay | ☐ |
| B5 | Chronicle-Daten: mehr Bücher mit Timeline-Position (`atY`/Ära) | ☐ |
| B6 | Dead-Code-Retirement: V1-Ingestion + V2-LLM + V2-Rest ausmustern (Carve-out: Excel-SSOT-Loader bleibt); stale `CLAUDE.md`-Stack-Tabelle fixen | ☐ |
| B7 | brain:lint always-read Budget-Guardrail (Spec: archivierter Brief 112) | ☐ |
| B8 | Kuratierte Themen-Straenge: seed-data-JSON (Titel/Blurb + Refs auf vorhandene work-/entity-IDs), kein Schema; dangling ID faellt laut. Spec [129](./2026-06-04-129-arch-doorways-curation-layer.md) | ☐ |
| B9 | Kuratierte Charakter-Auswahl: seed-data-JSON ueber `characters` (Spotlight-Flag + `is_primarch`-Flag), kein Schema; Blurbs reiten auf B3. Spec [129](./2026-06-04-129-arch-doorways-curation-layer.md) | ☐ |

## Standing tool

SSOT-Loop (ex-061): Ad-hoc-Roster-Erweiterung, läuft nicht im Default-Cycle. Betrieb: `scripts/runbooks/ssot-loop-runbook.md`. Vehikel für B5.

## Optional context (nur laden wenn der Task es braucht)

- Pipeline-Stand: `brain/wiki/project-state.md` + `pipeline-state.md`.
- Podcast-Lineage: archivierte 110 (Pilot) → 114 (Schema/Apply).
- Dead-Code-Kandidaten-Detail: `git log` / archivierter OQ-13-Text.
