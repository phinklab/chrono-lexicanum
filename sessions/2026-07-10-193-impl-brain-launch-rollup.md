---
session: 2026-07-10-193
role: implementer
date: 2026-07-10
status: complete
slug: brain-launch-rollup
parent: null
links:
  - 2026-07-06-178b
  - 2026-07-08-185
  - 2026-07-08-186
  - 2026-07-08-187
  - 2026-07-08-188
  - 2026-07-09-189
  - 2026-07-09-190
  - 2026-07-10-191
  - 2026-07-10-192
commits: []
---

# Brain- und Launch-Rollup bis Session 192

## Summary

Alle drei Worktrees wurden auf `origin/main` (`9977cd3`) synchronisiert; nur Batch/Ingestion brauchte einen Fast-forward. Der Koordinationsstand ist nun gegen 178b, Sessions 185–192, Weekly Refresh W28 und den lokalen Launch-Arbeitsplan reconciled, ohne die beiden Launch-Planungsdateien zu versionieren.

## What I did

- `brain/wiki/project-state.md`, `worklist.md`, `open-questions.md`, `deferred-questions.md`, `roadmap.md` — Ist-Stand und Launch-Queue auf 2026-07-10 gezogen.
- `brain/wiki/architecture.md`, `pipeline-state.md`, `book-data-overview.md`, `glossary.md` — veraltete V1/V2-/26-Bücher-Beschreibungen durch die lebende Per-Buch-, Podcast-, App- und Map-Architektur ersetzt.
- `brain/wiki/index.md`, `brain/wiki/log.md`, `sessions/README.md`, `README.md` — Katalog, Operation-Log und öffentliche Projektbeschreibung aktualisiert.
- `sessions/2026-07-02-181-arch-product-prune-pass.md` — durch Session 185 als implementiert gebucht.
- `sessions/2026-07-02-182-arch-launch-tech.md` — als durch das maintainer-lokale Launch-Programm superseded markiert; seine Arbeit ist noch nicht geliefert.
- `sessions/2026-06-03-121-arch-product-board.md` und `docs/ui-backlog.md` — erledigte Cleanup-/Mobile-Arbeit und verbleibende Launch-A11y-Arbeit reconciled.
- `AGENTS.md`, `CLAUDE.md`, `brain/wiki/workflows/cc-session.md` — die eng begrenzte serielle Launch-Ausnahme in die kanonischen Agentenregeln aufgenommen.
- Aktuelle Kennzahlen verifiziert: 896 Bücher; 1.114 Podcast-Episoden (155/368/399/192); 1.055 Kartenwelten, 1.352/1.710 platzierte Werk-Kanten; 8 Great Journeys mit 101 Akten; 30 DB-freie Tests.

## Decisions I made

- **Die Launch-Dateien bleiben lokale Arbeitsdokumente.** Philipps aktuelle Anweisung überschreibt ihren eigenen S0-Commit-Punkt. Brain verlinkt sie deshalb nicht als dauerhafte `sources:`; der ausführbare Detailplan bleibt bewusst ungetrackt.
- **Plan und Ist werden strikt getrennt.** Snapshot, Rollen, SEO, Observability und A11y stehen als Launch-Queue im Brain, aber nicht als geliefert.
- **Session 191 ist nicht der Endzustand.** Der SVG-Motion-Plane-Versuch wurde auf dem Pixel widerlegt; Session 192 ist kanonisch: Canvas bis 900 px, 30 fps, DPR maximal 2; Desktop behält SVG.
- **Kein Archive-Sweep in diesem Pass.** Die lokalen Launch-Prompts referenzieren Brief 181/182 noch an ihren Root-Pfaden. Ein Verschieben würde die bewusst ungetrackten Arbeitsdokumente sofort veralten lassen; Root-Hygiene folgt nach der Launch-Strecke.
- **Temporärer Arbeitsmodus:** Die Launch-Sessions laufen seriell im Koordinations-Worktree und werden durch die lokalen Prompts gezündet. PR-Inhalte bleiben strandrein; `main` bleibt read-only. Nach dem Launch gilt wieder das Drei-Worktree-Routing.

## Verification

- `git`-Sync-Endzustand: Coordination / Product / Batches jeweils `9977cd3` = `origin/main`; alle vorhandenen ungetrackten Dateien blieben erhalten.
- Quellen vollständig gelesen: 178b, 185–192, Weekly-Refresh W28, Briefs 181/182, alle zentralen Brain-Rollups und beide lokalen Launch-Arbeitsdokumente.
- `npm run brain:lint -- --no-write` — pass, 0 Blocking Findings / 20 Warnungen (vor dem Rollup: 46 Warnungen).
- `git diff --check` — pass.
- Index-Abdeckung — 35 Wiki-Dateien katalogisiert, 0 fehlend; alle `Updated`-Zellen stimmen mit dem Frontmatter überein.
- Gezielte Greps auf alte Kennzahlen, Brief-181/182-Status, Five-Questions-Copy, Weekly-PR #200 und erledigte Map-Follow-ups — keine stale Treffer in den lebenden Rollup-Seiten (nur die explizite Notiz, dass #200 geschlossen ist).
- `npm run lint` / `npm run typecheck` — nicht ausgeführt; der Branch ändert ausschließlich Markdown/Projektgedächtnis, keine TypeScript-/Buildfläche.

## Open issues / blockers

- Vor S1a sind vier Widersprüche im lokalen Launch-Plan zu bereinigen: keine Prod-DB-Mutation mit ungemergtem Era-Code; Revalidation erst nach dem Snapshot-Deploy oder suppressbar; `RUNTIME_DATABASE_URL` braucht einen echten `src/db/client.ts`-Consumer-Schnitt; der finale Snapshot braucht einen eigenen Batches-PR vor dem Koordinations-Protokoll.
- S0 braucht weiterhin Philipps vier Entscheidungen: finale URL-Matrix, kanonischer Production-Host/Domain, Era-Variante und Error-only-Tracker ja/nein.
- Migration `0015` und ein aktueller Prod-`db:drift` sind im Repo nicht als ausgeführt belegt.
- Der Canvas-Fix aus 192 braucht noch Philipps Pixel/Chrome-Verdikt auf dem Preview-Deploy.

## For next session

- Zuerst einen kurzen Launch-Plan-Preflight/S0 durchführen und die vier Widersprüche plus vier Maintainer-Entscheidungen schließen.
- Danach die Launch-Sessions seriell nach der lokalen Prompt-Sammlung fahren; jede Session erhält ihren eigenen Branch, Report und PR.

## References

- `sessions/2026-07-06-178b-impl-map-polish.md`
- `sessions/2026-07-08-185-impl-website-review-mobile.md` bis `sessions/2026-07-10-192-impl-mobile-cartographer-canvas.md`
- `ingest/refresh/2026-W28/report.md`
- Maintainer-lokale Arbeitsdateien `docs/launch-master-plan.md` und `docs/launch-session-prompts.md` (bewusst ungetrackt)
