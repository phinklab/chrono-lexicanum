---
session: 2026-05-25-099
role: implementer
date: 2026-05-25
status: complete
slug: sessions-archive-sweep
parent: 2026-05-25-099
links:
  - 2026-05-25-099-arch-sessions-archive-sweep
  - 2026-05-09-051-arch-brain-slim-pass
  - 2026-05-23-095-arch-rollup-ownership
commits: []
---

# Sessions-Archiv-Sweep — Impl Report

## Summary

53 geschlossene `arch`/`impl`-Session-Files (NNN 062–095 + 097) sind per `git mv` von `sessions/` nach `sessions/archive/2026-05/` umgezogen; 188 relative Pfad-Referenzen in 12 `brain/wiki/**`-Files sind mechanisch umgeschrieben. `npm run brain:lint -- --no-write` 0 blocking findings, `npm run lint` 0 errors, `npm run typecheck` clean. Stop-before-push.

## What I did

1. **Worktree-Self-Check.** Coordination-Worktree `C:\Users\Phil\chrono-lexicanum`, Strang Meta/Session, frische Branch `codex/session-099-archive-sweep` aus dem HEAD von `codex/coord-pass-098` (= `origin/main` + der Coordination-Pass-Commit, der Brief 099 selbst trägt). Branch-Stack-Detail s. „Decisions I made" unten.
2. **Move (53 Files).** `git mv sessions/<file>.md sessions/archive/2026-05/<file>.md` für jedes NNN ∈ {062, 064, 065, 066, 068, 070–077, 079–095, 097}, Dateiname unverändert. Per NNN:
   - 062 (2), 064 (1), 065 (1), 066 (1), 068 (1), 070 (2), 071 (2), 072 (2), 073 (2), 074 (2), 075 (2), 076 (2), 077 (2), 079 (1), 080 (2), 081 (2), 082 (1), 083 (1), 084 (2), 085 (2), 086 (2), 087 (2), 088 (2), 089 (2), 090 (2), 091 (2), 092 (1), 093 (1), 094 (2), 095 (2), 097 (2) = **53 Files**.
3. **Reference-Rewrite (188 Refs in 12 Files).** Such-Oberfläche aus dem Brief vollständig durchgrepen — Treffer ausschließlich unter `brain/wiki/**`. Top-Level `CLAUDE.md` / `AGENTS.md` / `README.md` / `ROADMAP.md` / `ARCHITECTURE.md` / `ONBOARDING.md`, `brain/CLAUDE.md`, `sessions/README.md` und die lebenden `sessions/`-Dateien (Loop-Logs, drei Runbooks) sowie `docs/**` enthielten **keine** Referenz auf ein verschobenes File. Die einzige Außen-Referenz war ein `BRIEF_PATH`-Variablen-Treffer in `scripts/run-ssot-loop.sh` — der zeigt auf Brief 061, der im Root bleibt; daneben zwei Kommentar-Erwähnungen von 071 im selben Script-Header, die nach Brief-Scope (`scripts/**` nicht in der Such-Oberfläche, „kein Script-Touch") bewusst nicht angefasst sind.

   Per-File-Verteilung (Summe 188):

   | Wiki-File | Refs |
   |---|---|
   | `brain/wiki/project-state.md` | 51 |
   | `brain/wiki/log.md` | 51 |
   | `brain/wiki/open-questions.md` | 44 |
   | `brain/wiki/pipeline-state.md` | 17 |
   | `brain/wiki/decisions/why-cc-direct-curation.md` | 9 |
   | `brain/wiki/decisions/hardcover-to-goodreads-pivot.md` | 5 |
   | `brain/wiki/decisions/location-policy.md` | 4 |
   | `brain/wiki/decisions/faction-policy.md` | 3 |
   | `brain/wiki/workflows/sessions-format.md` | 1 |
   | `brain/wiki/workflows/cc-session.md` | 1 |
   | `brain/wiki/workflows/cowork-session.md` | 1 |
   | `brain/wiki/decisions/why-sonnet-not-haiku.md` | 1 |
4. **Verifikation.** Drei Gates (s. Verification).
5. **Brief-Status.** `2026-05-25-099-arch-sessions-archive-sweep.md` `status: open` → `implemented`.

## Decisions I made

- **Rewrite-Mechanik.** Statt 188 manueller Edits eine einmalige Node-Substitution geschrieben (`scripts/session-099-archive-rewrite.mjs`), gegen die 12 Ziel-Files gefahren, anschließend **gelöscht** — der Brief sagt „kein Script-Touch". Das Script ist nicht im Diff. Mechanik: ein einziger Regex `sessions/(2026-05-\\d{2}-(062|064|…|097)-)` → `sessions/archive/2026-05/$1`. Idempotent (matcht `sessions/<id>`, nicht `sessions/archive/2026-05/<id>` — der zweite Pfad hat `archive/`, nicht `2026-05-`, hinter `sessions/`). Negativ-Lookbehind nicht nötig. Pfad-Tiefe (`../../sessions/…` vs. `../../../sessions/…`) bleibt unangetastet — der Substring `sessions/` ist in beiden gleich, das Prefix davor wird nicht verändert.
- **Branch-Stack.** Der Brief sagt „Frische Branch … aus aktuellem `origin/main`". Zum Zeitpunkt der Session lag Brief 099 selbst aber nur auf dem noch-nicht-gemergten `codex/coord-pass-098`-Branch (= `origin/main` + 1 Commit „Sessions: Brief 099 + Koordinations-Pass post-#98"). Saubere Lesart hätte den Coord-Pass-Merge abgewartet, dann frisch gebrancht. Pragmatisch hier: `codex/session-099-archive-sweep` aus dem Coord-Pass-HEAD gezogen (also `origin/main` + Coord-Pass-Commit + Sweep-Commit). Nach Merge des Coord-Pass rebased der Sweep-Branch sauber auf `origin/main`.
- **Out-of-scope strikt befolgt.** Inhalt der 53 verschobenen Files **nicht** editiert (`status`-Felder bleiben unverändert, ihre internen Cross-Refs auf andere verschobene Files bleiben formal jetzt „stale", da `brain:lint` `sessions/**` nicht scannt fällt das nicht auf — und der Brief sagt explizit „Inhalt archivierter Briefs ... kein Status-Re-Write an verschobenen Files"). `sessions/resolver-dossiers/` nicht angefasst. `sessions/archive/2026-05/`-Bestand nur additiv erweitert.
- **Frontmatter-`updated`-Bumps an den 12 Wiki-Files nicht gemacht.** Brief sagt „keine Frontmatter-`updated`-Bumps, keine Umformulierung". Reine Pfad-Komponenten-Edits.
- **Sweep-Eingrenzung.** 096 (`open`, Product-Strang in Arbeit) und 098 (arch + impl, just-closed, load-bearing für anstehende HH- und Final-Konsolidierungs-Arbeit) bleiben im Root, wie der Brief explizit listet. 061 (`open`, standing) und 099-arch (selbst) ebenso. Status-Spot-Check von 096/097/061/092/093 vor dem Move bestätigte die Einordnung. Die Brief-Form „NNN 062–097" minus „bleibt-im-Root"-Excel-Liste ergibt eindeutig die 53er-Menge.

## Verification

- **`npm run brain:lint -- --no-write`** → `Blocking findings: 0`, 16 Warnings (Inline diff raw fields 2 / Brain size budget 4 / Stale claim suspects 10 — alle vorbestehend, nicht durch den Sweep verursacht).
- **`npm run lint`** → 0 errors, 1 vorbestehende Warning (`src/app/layout.tsx:44` `@next/next/no-page-custom-font`, unverändert seit Pre-Sweep).
- **`npm run typecheck`** → clean exit, kein Output.
- **Root-Sichtprüfung** (`ls sessions/*.md`):
  ```
  2026-05-11-061-arch-ssot-loop.md
  2026-05-23-096-arch-design-direction.md
  2026-05-25-098-arch-w40k-consolidation-pass.md
  2026-05-25-098-impl-w40k-consolidation-pass.md
  2026-05-25-099-arch-sessions-archive-sweep.md
  2026-05-25-099-impl-sessions-archive-sweep.md   ← this file
  README.md
  consolidation-pass-runbook.md
  resolver-loop-log.md
  resolver-pass-runbook.md
  ssot-loop-log.md
  ssot-loop-runbook.md
  ```
  Plus `_templates/`, `_drafts/`, `archive/`, `resolver-dossiers/`. Deckt sich punktgenau mit dem Brief-Acceptance-Set.
- **Spot-Check Re-Grep.** `sessions/2026-05-\\d{2}-(062|…|097)-` über `brain/**` → 0 Treffer; gleiche Suche über `CLAUDE.md AGENTS.md README.md ROADMAP.md ARCHITECTURE.md ONBOARDING.md docs/**` → 0 Treffer. Doppel-Prefix-Korruption (`sessions/archive/2026-05/sessions/archive`) → 0 Treffer.

## Open issues / blockers

Keine. Stop-before-push: Branch `codex/session-099-archive-sweep` lokal, nicht gepusht, kein PR.

## For next session

Antworten auf die zwei Open Questions aus Brief 099:

- **Ref-Konzentration (188 Refs, 12 Files).** 87 % der Rewrites (163 / 188) liegen in vier Rollup-Pages: `project-state.md` (51), `log.md` (51), `open-questions.md` (44), `pipeline-state.md` (17). Die Decision-Pages tragen einzelne `sources:`-Frontmatter-Verweise auf die Briefs, die das ADR begründen (max 9 in `why-cc-direct-curation.md`); die Workflow-Pages je 1 (ein einzelner Bezugs-Brief). Mechanisch ist die Schwellen-Disziplin „archiviere geschlossene Sessions promptly statt gesammelt" (Brief-098-Niveau eigentlich, formales Statement in `sessions-format.md` § Archiving) die wirksamste Reduktion — wenn der `sources:`-Frontmatter-Pfad bei der nächsten Archivierung schon `archive/YYYY-MM/<id>.md` trägt, fällt nicht das Rewrite-Volumen weg (jeder Eintrag muss ja trotzdem aktualisiert werden), aber es entstehen keine 25-Sessions-langen Listen mehr, die in einem Sweep zusammenkommen. Sub-Option: die `sources:`-Frontmatter-Pflege beim Session-End nach `archive/YYYY-MM/<id>.md` schreiben (selbst wenn die Datei in dem Moment noch im Root liegt) — das hebt einen Edit von 188 auf ~0 für künftige Sweeps. Wäre ein eigener Mini-Workflow-Update.
- **`brain:lint`-Coverage-Lücken.** Der Scan deckt `brain/wiki/**`, `brain/CLAUDE.md`, `brain/outputs/lint/README.md`, `brain/raw/reviews/README.md` voll (interne Links, Frontmatter, Sources), und auf den fünf Top-Level-Docs `CLAUDE.md / README.md / ARCHITECTURE.md / ROADMAP.md / ONBOARDING.md` die `brain/`- und `sessions/`-Link-Targets. **Nicht im Scan-Set**: `AGENTS.md`, `sessions/README.md`, die lebenden `sessions/`-Dateien (Loop-Logs, Runbooks), `sessions/**/*.md` (Archive + Dossiers), `scripts/**`, `docs/**`. In diesem Sweep ohne Folge — die direkten Greps haben in jedem dieser Pfade 0 moved-file-Refs gefunden — aber strukturell ein Material-Punkt: ein kleiner `brain:lint`-Coverage-Erweiterungs-Brief könnte `AGENTS.md` und die zwei Loop-Logs / drei Runbooks unter `sessions/` in `TOP_LEVEL_LINK_SCAN_FILES` aufnehmen (gleiche `TOP_LEVEL_LINK_PREFIXES`-Regel, sehr kleiner Patch in `scripts/brain-lint.ts`). `docs/**` und `scripts/**` sind Architektur-Entscheidungen weiter weg; falls jemals ein Doc-/Script-Ref auf eine archivierte Session zeigt, wäre das die Trigger-Bedingung.

Operativ: nichts blockiert die HH-Domäne. Der nächste Architekten-Schritt ist nach Brief-099-Merge typischerweise der HH-Resolver-Bootstrap (analog Brief 063 für W40K), sobald der SSOT-Loop in die HH-Range gekippt ist; sekundär OQ (3) Hand-Check-Workflow / OQ (13) Crawl-Simplification.
