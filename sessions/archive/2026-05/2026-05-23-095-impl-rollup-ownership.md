---
session: 2026-05-23-095
role: implementer
date: 2026-05-23
status: complete
slug: rollup-ownership
parent: 2026-05-23-095
links:
  - 2026-05-17-082-arch-parallel-worktrees
  - 2026-05-17-083-impl-parallel-worktrees
commits:
  - 9057c3b
  - 277ecc4
  - 9748ea6
  - d9e0e84
  - f991398
  - e9ae266
  - 3d3e550
  - 6f7c612
---

# Rollup-Ownership — konfliktfreie Parallel-Stränge

## Summary

Worktree-gebundene Rollup-Ownership-Regel implementiert: `sessions/README.md` + `brain/**` werden ab jetzt ausschließlich im Koordinations-Worktree geschrieben, nie aus den Product-/Batches-Strängen. Die Session-Start-Routine ist zusätzlich um eine explizite Worktree-Selbstprüfung (Ansage + Halt-mit-Rückfrage bei Strang-Mismatch) gehärtet — beides in `CLAUDE.md`, `AGENTS.md`, `brain/wiki/workflows/cc-session.md` und `brain/wiki/workflows/cowork-session.md` parallel verankert; zusätzlich ein Konsistenz-Sweep in `brain/wiki/workflows/sessions-format.md` + `brain/CLAUDE.md`.

## What I did

- `sessions/2026-05-23-095-arch-rollup-ownership.md` — Architekten-Brief-Amendment (Worktree-Selbstprüfung-Abschnitt + Constraint + Acceptance-Bullet) als eigenen Commit gesichert, bevor implementiert wurde (commit `277ecc4`; der ursprüngliche Brief 095 lag bereits als `9057c3b` auf der Branch).
- `CLAUDE.md` — § "Brain & Atlas" atomic-commit-Satz amendiert (Strang-Worktrees ausgenommen, Brain-Update als nachgelagerter Koordinations-Worktree-Pass); § "Parallel worktrees" um den **Rollup-Ownership**-Block (Koordinations-only-Set + worktree-gebundenes Verbot) und um zwei neue Session-Start-Schritte (Worktree+Strang+Branch-Ansage; Halt-mit-Rückfrage bei Aufgaben-/Strang-Mismatch) erweitert. CC leitet den Strang selbst aus dem Worktree-Pfad ab und fragt den Maintainer nie danach.
- `AGENTS.md` — § "Parallel worktree git protocol" trägt jetzt denselben Rollup-Ownership-Block + dieselbe Worktree-Selbstprüfung wortgleich in der Absicht zu `CLAUDE.md` (Brief-082-Präzedenz: das Protokoll lebt in beiden Dateien).
- `brain/wiki/workflows/cc-session.md` — § "How a CC session begins" um Schritt 2 (Worktree-Self-Check + Ansage + Halt-mit-Rückfrage) ergänzt; § "Brain updates from CC?" komplett umgeschrieben: Strang-Worktrees schreiben **nie** `brain/**` oder `sessions/README.md`; substantielle System-Fakten gehen in den Impl-Report, Cowork zieht sie im Post-Merge-Koordinations-Pass nach; Koordinations-Worktree-CC (Meta-/Session-Briefs wie dieser) editiert `brain/` weiterhin frei. Frontmatter `updated:` + `sources:` bumped.
- `brain/wiki/workflows/cowork-session.md` — § "After reading a CC implementer report" trägt jetzt voran den Sole-Writer-Anchor: Cowork ist der einzige Schreiber des Koordinations-only-Sets, der Post-Merge-Pass ist der einzige Pfad, über den die Rollup-Dateien sich ändern. Neuer Routine-Schritt 8 (`sessions/README.md` Active-Threads + Session-Tabelle aktualisieren — coord-only). Frontmatter `updated:` + `sources:` bumped.
- `brain/wiki/workflows/sessions-format.md` — § "What goes in a report" hat einen neuen Absatz, der den Report als Rollup-Conduit für Strang-Worktrees verankert (Fakten, die früher in `pipeline-state.md` etc. gelandet wären, gehen in "What I did" / "For next session"); § "Archiving" Per-move-Disziplin um den Anchor erweitert, dass alle `sessions/README.md`- und `brain/**`-Edits aus dem Koordinations-Worktree kommen. Frontmatter `updated:` + `sources:` bumped.
- `brain/CLAUDE.md` — § "Ingest" um einen **Where:**-Block erweitert: Ingest läuft nur aus dem Koordinations-Worktree; Strang-Worktrees führen kein Ingest aus, auch wenn die Fakten dort entstehen.
- `brain/wiki/index.md` — Katalog-Frische für die drei berührten Workflow-Pages (`cowork-session.md`, `cc-session.md`, `sessions-format.md`) auf 2026-05-23 gehoben; den jeweiligen Description-Spalten ein „post-095"-Marker hinzugefügt; Frontmatter `updated:` bumped. Hält `brain:lint` grün.

## Decisions I made

- **`sessions/README.md`-Edit war beim Session-Start bereits committet** — Brief 9057c3b enthält Architekten-Brief + den `sessions/README.md`-Edit aus § "Active threads" zusammen. Die `## Commit & PR`-Sektion des Briefs („Ist der Working-Tree wider Erwarten schon clean … Schritt 2 überspringen") sah genau diesen Fall vor. Damit ist der Architekten-Output abgedeckt; ich habe ihn nicht erneut angefasst.
- **Brief-Amendment als eigener Commit (`277ecc4`)** — Philipp hat den Brief nach dem ersten Architekten-Commit um den „Worktree-Selbstprüfung"-Abschnitt + Constraint + Acceptance-Bullet ergänzt; diese Änderung lag uncommitted auf der Branch. Ich habe sie vor der Implementierung gesichert (kein Amend von `9057c3b`, da der Brief-Amendment einen eigenen logischen Schritt darstellt — und Amend ohne explizite Maintainer-Erlaubnis nicht statthaft ist), so dass der PR die finale Brief-Form trägt.
- **Pro Voice-Datei ein Commit, Sweep getrennt** — Brief sagt „ein logischer Schritt pro Commit". CLAUDE.md, AGENTS.md, cc-session.md, cowork-session.md sind je eigene Stimmen (Top-Level-Shared-Context, Agent-Entrypoint, Implementer-Workflow, Architect-Workflow); ich habe sie deshalb pro Datei committed, den Konsistenz-Sweep (sessions-format.md + brain/CLAUDE.md) separat, und den Katalog-Refresh (index.md) als kleinen Folge-Commit nach dem `brain:lint`-Befund.
- **Rollup-Ownership-Block strukturiert vor die Session-Start-Schritte gestellt** — in CLAUDE.md/AGENTS.md § "Parallel worktrees" sitzt der Rollup-Ownership-Block direkt zwischen Worktree-Liste und Session-Start-Schritten. Damit liest sich die Sektion als: was die Worktrees sind → was jeder Worktree darf/nicht darf (Rollup-Ownership) → wie man eine Session startet (mit Worktree-Selbstprüfung als Schritt 5+6). Die Ansage in Schritt 5 referenziert den Rollup-Block oben für die Begründung.
- **Worktree-Selbstprüfung als zwei Session-Start-Schritte (5 + 6) statt einem Sammel-Schritt** — Ansage und Halt-mit-Rückfrage sind zwei unterschiedliche Aktionen mit unterschiedlichen Triggern (immer ausführen vs. nur bei Mismatch); ich habe sie als getrennte Bullets aufgenommen, damit beide einzeln „abhakbar" sind.
- **`cc-session.md` § "Brain updates from CC?"-Titel beibehalten** — der Brief sagt „umschreiben", nicht „umbenennen". Frage-Form bleibt, die Antwort wechselt von „CC darf manchmal Brain editieren" auf „CC im Strang-Worktree nie, im Koordinations-Worktree frei". Das hält die Section-Anker stabil für externe Referenzen.
- **Index.md-Descriptions um „post-095"-Marker erweitert (nicht nur Datum)** — die Workflow-Page-Zeilen in der Index-Tabelle führen schon andere „post-X"-Marker (post-049, post-090); ich habe für jede der drei berührten Pages einen ein-Phrasen-Marker hinzugefügt, damit der Katalog für eine künftige Lese-Quelle erkennbar macht, was die Page seit Brief 095 zusätzlich trägt. Bewusst klein gehalten, um die Index-Größen-Budget-Warnung nicht zu reizen.
- **Kein `log.md`-Eintrag aus dieser CC-Session** — die formale Brain-Ingest-Bookkeeping-Disziplin (`log.md` + Wiki-Page-Updates in einer Cowork-Session-End-Routine) bleibt bei Cowork; ich habe nur die operative Spec geändert + den Katalog frisch gehalten, damit `brain:lint` grün ist. Cowork erstellt einen formalen Log-Eintrag im nachgelagerten Koordinations-Pass — konsistent mit der neuen Rollup-Ownership-Regel selbst.
- **Brief-Amendment-Commit-Message ohne „Co-Authored-By"** — Memory-Eintrag „No Claude as commit co-author" beachtet; keiner der acht Commits trägt einen Claude-Trailer.

## Verification

- `npm run brain:lint -- --no-write` — **0 blocking findings**, 14 warnings (alle pre-existing: 2 inline-diff-raw-field-Hints in `log.md`/`open-questions.md`; 4 Brain-size-budget-Hints in `pipeline-state.md`/`project-state.md`/`decisions/{faction,location}-policy.md`; 8 stale-claim-suspect-Hints in `pipeline-state.md`/`project-state.md`/`open-questions.md`/`roadmap.md`). Die ursprünglich 3 Catalog-Freshness-Blocker (Index-Zeilen für die drei Workflow-Pages aus 2026-05-09/-20) wurden mit dem `index.md`-Refresh-Commit (`6f7c612`) geschlossen. Lint-Report: `brain/outputs/lint/2026-05-23.md`.
- `npm run lint` / `npm run typecheck` — **bewusst übersprungen**: reine Doku-/Workflow-Änderung, kein Code, kein Schema, kein DB-Touch. Brief-061-/094-Konvention für nicht-code-berührende Änderungen.
- Worktree-Selbstprüfung am Session-Start (die Regel, die diese Session selbst einführt) wurde am Anfang dieser Session live praktiziert: „Worktree: `C:\Users\Phil\chrono-lexicanum` (Koordination), Strang: meta/session-only, Branch: `codex/session-095-rollup-ownership`. Aufgabe passt zum Strang (Doku-Änderung an koordinations-eigenen Dateien)." — d. h. die neue Disziplin ist erfüllt, bevor sie ins Repo eingeflossen ist.
- Manuell quer-gelesen, dass die Constraint-Items + Acceptance-Bullets aus dem Brief alle Treffer in den Edits haben: ✓ Koordinations-only-Set benannt, ✓ worktree-gebundenes Verbot, ✓ Atomic-Commit-Amendment, ✓ AGENTS-Spiegel, ✓ cc-session „Brain updates from CC?"-Rewrite, ✓ cowork-session sole-writer-Anker, ✓ Worktree-Selbstprüfung in CLAUDE/AGENTS/cc-session, ✓ sessions-format + brain/CLAUDE-Sweep, ✓ keine Datei un-getrackt/gitignored, ✓ `brain:lint --no-write` grün, ✓ Architekten-Output + Implementierung in derselben Branch `codex/session-095-rollup-ownership`.

## Open issues / blockers

Keine. Die Brief-Open-Questions-Inputs sind im Abschnitt „For next session" beantwortet.

## For next session

Antworten auf die zwei Brief-Open-Questions + zwei Beobachtungen, die ich beim Implementieren angetroffen habe:

- **Numerierungs-Anweisung in `cc-session.md` („next sequential NNN — look at the latest brief, add 1") liest sich nach der Änderung weiterhin sauber.** Sie wurde nicht angefasst, weil Reply-Paare die `NNN` des Briefs teilen (`sessions-format.md` § Naming) und Report-Dateinamen damit nie zwei Stränge gegeneinander bringen. Solange ein neuer Brief eine fresh `NNN` bekommt, kollidiert auch nichts — selbst wenn zwei Stränge Briefs in Flight haben, weil Cowork (alleiniger Brief-Schreiber) die Numerierung sequenziell vergibt, nicht der Implementer-Strang. Kein Wortlaut-Fix nötig.
- **Kein mechanischer Runbook-Schritt schreibt einen Koordinations-only-Pfad.** Verifiziert:
  - **SSOT-Loop-Runbook** (`sessions/ssot-loop-runbook.md`) — Commit-Regel § 9: „Erfolg: ein Commit = { neue `manual-overrides-ssot-{domain}-{NNN}.json`, Log-Append }. Complete: ein Commit = { Log-Append }. Nur diese Pfade anfassen." Beide Pfade liegen außerhalb des Koordinations-only-Sets (`scripts/seed-data/`, `sessions/ssot-loop-log.md`). ✅
  - **Resolver-Pass-Runbook** (`sessions/resolver-pass-runbook.md`) — § 9: „Ein Commit pro Phase … Nur Pfade aus dem Phase-Scope anfassen." Achs-Pakete = `scripts/seed-data/*.json`, `scripts/*.ts`, Dossiers unter `sessions/resolver-dossiers/`, Apply-Digest unter `ingest/.last-run/`, Per-Phase-Statusdateien, finaler Impl-Report. § 8 hält explizit fest: „Resolver-Pässe schreiben normalerweise nicht ins Loop-Log." Kein Touch auf `sessions/README.md` oder `brain/**`. ✅
- **Beobachtung — Edit-Tool-Line-Endings auf `cc-session.md`:** Die Datei hatte working-tree-CRLF + index-CRLF; mein Edit-Commit (`f991398`) hat 115 ins + 110 del (ggü. ~17 echten Content-Zeilen) — der Großteil ist Whitespace-Drift, weil das Edit-Tool die Datei zwischendurch normalisiert hat. `git diff --ignore-all-space` zeigt die echten 17 Zeilen Content. Funktional intakt; der PR-Review-Diff sieht aber laut Memory-Vermerk „verrauscht" aus. Die anderen Workflow-Pages (`cowork-session.md`, `sessions-format.md`, `brain/CLAUDE.md`, `index.md`) habe ich vor dem Stage per `sed -i 's/\r$//'` auf LF gezogen, so dass deren Commit-Diffs klein bleiben — `cc-session.md` ist die Ausnahme. Falls Cowork beim Review stört: ein Folge-Commit, der die Datei mit LF normalisiert, ist trivial; lohnt sich für diesen einen PR aber kaum.
- **Beobachtung — Brief 094 (Resolver-Loop) ist als „open" in `sessions/README.md` getragen, aber zur Implementierung fällig.** Brief 095 betraf 094 nicht inhaltlich (verschiedene Sektionen in CLAUDE.md/AGENTS.md, konfliktfrei). 094 wartet weiter — wie im Brief-095-Context-Block dokumentiert.

## References

Keine externen Quellen — reine Doku-/Workflow-Implementation. Die intern referenzierten Briefs (082/083 Worktree-Bootstrap, 091 Phase-4-Split als Per-PR-Workflow-Präzedenz, 094 Resolver-Loop-Sektion-Disjunktheit) liegen alle im Repo.
