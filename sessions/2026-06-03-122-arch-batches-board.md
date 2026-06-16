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
| B1 | Podcast Step 3: weitere Shows; pro Show website/youtube/spotify-Link wo vorhanden; Schema ggf. um Show-Links | ☑ erledigt (S1–S3 Link-Fundament/Registry/Apply; 4 Shows inkl. Luetin09 via YouTube-Adapter [130] + CC-Direct-Tagging [131/132]; S4 Episode-Matching bleibt abgegrenztes Folge-Item, vgl. 128) |
| B2 | Buch-Kuratierung: Faction add/remove + Hand-Fixes via Hand-Override-Overlay (deterministischer Tail nach Auto-Apply/Rebuild); Override-Format „final"/„reviewQueue" definieren. Spec: Brief [149](./2026-06-12-149-arch-curation-foundation.md). | ☑ erledigt (impl [149](./2026-06-14-149-impl-curation-foundation.md): Sidecar `curation-overlay.json`, Validator, programmatischer Apply/Dry-Run/Verify, Tail-Slot in `db:rebuild`; DB-frei bewiesen, keine Prod-Mutation unter Freeze) |
| B3 | Entity-Blurbs: F/C/W je 1–2 Satz per Websuche als Seed/Override-Daten. Kurz, faktisch, kein Lore-Essay | ☑ erledigt (Full-Coverage 981/981: 202 F / 490 C / 289 W; Subset+Machinery via Handoff, Full-Sweep maintainer-direkt nachgezogen) |
| B5 | Chronicle-Daten: präzise/event-anchored Setting-Placement → `works.startY/endY` (Maximalpräzision, **kein** Ära-Bucketing — nicht spezifisch verortbare Bücher bleiben raus). **Läuft als Cowork+Philipp-Hand-Kuratierung im git-ignored `/timeline-workshop/`** (Events-Spine M1–M42 zuerst, dann per-Buch-Datierung; Inclusion-Gate „kein Buch ohne groben Richtwert"). Graduiert erst als sauberer Brief zu CC (Events-Tabelle + Apply-Pfad + Date-Provenance + Inclusion-Gate + Undatierbar-Liste). **CC: nicht anfangen** bis der Brief landet. Brief 134 dafür retired/gelöscht. (NB: `atY` ist per-Location, **nicht** das Buch-Setting-Date.) | ⏸ Cowork-Hand |
| B6 | Dead-Code-Retirement: V1-Ingestion + V2-LLM + V2-Rest ausmustern (Carve-out: Excel-SSOT-Loader bleibt); stale `CLAUDE.md`-Stack-Tabelle fixen | ☐ |
| B7 | brain:lint always-read Budget-Guardrail (Spec: archivierter Brief 112) | ☐ |
| B8 | Kuratierte Themen-Straenge: seed-data-JSON (Titel/Blurb + Refs auf vorhandene work-/entity-IDs), kein Schema; dangling ID faellt laut. Spec [129](./2026-06-04-129-arch-doorways-curation-layer.md) | ☐ |
| B9 | Kuratierte Charakter-Auswahl: seed-data-JSON ueber `characters` (Spotlight-Flag + `is_primarch`-Flag), kein Schema; Blurbs reiten auf B3. Spec [129](./2026-06-04-129-arch-doorways-curation-layer.md) | ☐ |
| B10 | Weekly content refresh: wöchentl. Cron difft Track of Words (Bücher) + Registry-Podcast-Feeds gegen committeten Bestand → Vorschlag-Report + Apply-File → PR-Approval → bestehende Apply-Pfade. Additions-only, kein DB-Write aus CI. Spec [133](./archive/2026-06/2026-06-09-133-arch-weekly-content-refresh.md) | ☑ erledigt (133 PR1+PR2 Cron/Rolling-PR; 134 Ignore-List; 136 erste 30 Promotions, Roster 889; 148 Delta-Cursor) |
| B11 | Großer Buch-Reviewer: Multi-Agent-Review (Finder + adversariale Verifier, Muster der Deep-Reviews 140/141/144) über alle 889 Bücher — Facets, Factions, Junctions, Synopsis-Qualität; Findings landen in der 149er-Review-Queue. **Durch B2/149 entsperrt** | ☐ |
| B12 | Ask-Logik-Tuning: `recommend()`-Gewichte + Curation-Rules überarbeiten („beste Optionen erscheinen nicht immer"); Werkzeug: 1080er-Audit (`npm run audit:ask-combinations`). **Nach B11** (Datenqualität zuerst, sonst wird gegen falsche Facets getuned) | ☐ |
| B13 | Weekly-Refresh-Hardening / operativer Preflight: PR-Prompt im Report, Podcast-Artefakt-↔-DB-Drift-Audit (read-only, lokal), Cursor-Lifecycle bootstrappen (`curation-state.json`/`book-seen.json` committen), Outage≠Ruhe (Degraded schließt PR nicht). Detection-only, kein CI-DB-Write. Spec [151](./2026-06-14-151-arch-weekly-refresh-hardening.md). **Vor B2/149** | ☑ erledigt (PR #175; 4 Tasks, 65 Tests; `REFRESH_RESULT=degraded`, Cursor-Baseline `2026-01-01`, read-only `refresh:audit-artifacts`. Maintainer-Preflight: einmal `npm run refresh:audit-artifacts` lokal) |
| B14 | Local-only Curation Admin Tool: separates lokales Browser-Tool für Hand-Kuration auf dem 149er-Apply-Pfad (`curation-overlay.json`, Validator, Dry-Run/Verify/Apply-Result). Start per lokalem npm-Script, bindet nur an `127.0.0.1`/`localhost`, keine Next-/Vercel-Route und keine öffentliche Admin-Fläche. Default safe: Dry-Run/Verify sichtbar; mutierender Apply nur explizit. **Variante 1 entschieden 2026-06-16; nächster Handoff im Batches-Tree.** | ☐ |

## Standing tool

SSOT-Loop (ex-061): Ad-hoc-Roster-Erweiterung, läuft nicht im Default-Cycle. Betrieb: `scripts/runbooks/ssot-loop-runbook.md`. Vehikel für B5.

## Optional context (nur laden wenn der Task es braucht)

- Pipeline-Stand: `brain/wiki/project-state.md` + `pipeline-state.md`.
- Podcast-Lineage: archivierte 110 (Pilot) → 114 (Schema/Apply).
- Dead-Code-Kandidaten-Detail: `git log` / archivierter OQ-13-Text.
