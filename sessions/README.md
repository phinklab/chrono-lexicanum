# Sessions

This folder is the project's history. Every architect brief from Cowork and every implementer report from Claude Code is one Markdown file here.

For format, naming, status lifecycle, and archive rule, see [`brain/wiki/workflows/sessions-format.md`](../brain/wiki/workflows/sessions-format.md).

## Quick reference

- **Naming:** `YYYY-MM-DD-NNN-{arch|impl}-{slug}.md`
- **`NNN`** is monotonically increasing across the project (not reset daily)
- **Templates** live in [`_templates/`](./_templates/) — copy when starting a session
- **Drafts** go in `_drafts/` (gitignored)
- **Archive rule:** root holds only open / `needs-decision` briefs and at most the last 1–2 just-closed sessions; everything else moves to [`archive/YYYY-MM/`](./archive/) promptly. Detail in [sessions-format § Archiving](../brain/wiki/workflows/sessions-format.md#archiving).

## Pointers

- **Infrastructure log** — replaced by structured updates to [`brain/wiki/log.md`](../brain/wiki/log.md), [`brain/wiki/project-state.md`](../brain/wiki/project-state.md), and [`brain/wiki/pipeline-state.md`](../brain/wiki/pipeline-state.md). Pre-049 entries preserved at [`brain/raw/historical/sessions-readme-log-pre-2026-05-08.md`](../brain/raw/historical/sessions-readme-log-pre-2026-05-08.md).
- **Carry-over for the next architect brief** — replaced by [`brain/wiki/open-questions.md`](../brain/wiki/open-questions.md) (numbered queue) plus [`brain/wiki/deferred-questions.md`](../brain/wiki/deferred-questions.md) (dormant items).
- **Cosmetic UI polish** — lives in [`docs/ui-backlog.md`](../docs/ui-backlog.md), cleared in batched cleanup sessions.

## Active threads

> **Maintainer-Bedienung in einem Satz:** Resolver-Apply (069) und Faction-Policy-Hygiene (070) sind abgeschlossen; `factions.json` ist Lore-korrekt geparented, Browse-Root-Policy + Pre-Apply Parent-Hygiene-Check im Runbook stehen. Aktueller Authority-Stand: 60 Bücher (`ssot-w40k-001..006`). Nächster Schritt: Brief **071** implementieren (Loop-Driver-Skript), damit `ssot-w40k-007..010` autonom in einem Driver-Lauf entstehen können — Skript stoppt bei 100 (Resolver-Pause aus 061), dann Resolver-Brief.

| Session | Role | Status | Topic |
|---|---|---|---|
| [2026-05-13-071-arch-loop-driver](./2026-05-13-071-arch-loop-driver.md) | architect | open | **Loop-Driver-Skript.** `scripts/run-ssot-loop.{sh\|ps1}` wrappt Brief 061 in N `claude -p`-Subsessions (Default 5). Pro Iteration frischer Context (löst Context-Bloat bei manueller `/clear`-Bedienung). Pre-Run-Checks (Worktree clean, nicht `main`, `claude` im PATH), Mittel-Tier Halt-Checks (Exit-Code, neuer Override-File, JSON valide, Form, Buch-Anzahl, Loop-Log gewachsen, CC committed). Resolver-Loud-Stop wird als legitimes Stop-Signal erkannt. Am Ende: `git push` + `gh pr create --fill --base main` (Fallback wenn `gh` fehlt). Default-Konvention: PR pro Driver-Lauf (~40–50 Bücher), 50er-Resolver-Cadence unverändert. |
| [2026-05-13-070-impl-faction-policy-hygiene](./2026-05-13-070-impl-faction-policy-hygiene.md) | implementer | complete | **Faction-Policy & Hierarchie-Hygiene.** Browse-Root-Konzept vs. Tree-Root in [`brain/wiki/decisions/faction-policy.md`](../brain/wiki/decisions/faction-policy.md) + `scripts/seed-data/faction-policy.json` (16 Browse-Roots, `imperium` als Grand-Alignment-Exception). `factions.json` audit-patched: `chaos`-Rename, 5 Heresy-Traitor-Legionen → `chaos`, 8 Loyalist-Astartes-Chapters + `grey_knights` → `adeptus_astartes`, `alignment` auf 14 Rows. `seed-resolver-extensions` Faction-Insert auf Upsert (Option A). `brain:lint` neue Kategorie „Faction policy". Junctions unverändert; kein Re-Apply. |
| [2026-05-13-070-arch-faction-policy-hygiene](./2026-05-13-070-arch-faction-policy-hygiene.md) | architect | implemented | **Faction-Policy & Hierarchie-Hygiene.** Browse-Root-Whitelist (UI-Filter-Ebene) vs. Tree-Root trennen; Lore-Bugs in `factions.json` fixen; Resolver-Apply-Runbook um Pre-Apply Parent-Hygiene-Check erweitern. Keine UI-Arbeit, keine Schema-Migration. |
| [2026-05-12-069-impl-resolver-apply-evidence](./2026-05-12-069-impl-resolver-apply-evidence.md) | implementer | complete | **Resolver-Apply-Evidence.** Migration 0009, Resolver-Seed und Apply-Sweep `001..005` ausgeführt; Nachher-Counts `work_factions=318`, `work_locations=129`, `work_characters=363`; Smoke-Slugs matchen `3/3/6`, `5/6/10`, `7/4/9`, `7/1/5`, `9/3/11`. |
| [2026-05-12-067-impl-resolver-apply-readiness](./2026-05-12-067-impl-resolver-apply-readiness.md) | implementer | complete | **Apply-Readiness für 063.** Detailpage ist vor Migration 0009 preview-sicher, Dry-Run `001..005` liefert erwartete Junction-Counts 318/129/363, Runbook liegt in `docs/resolver-apply-runbook.md`. Nächster Schritt ist Maintainer-DB-Apply, nicht weiterer Code. |
| [2026-05-12-063-arch-resolver-50-books](./2026-05-12-063-arch-resolver-50-books.md) | architect | implemented | **Resolver-Pass nach 50-Bücher-Pause.** Adressiert OQ4 + OQ5. Code gelandet; 067 ergänzt Apply-Readiness und korrigiert die Smoke-Erwartung (`nightbringer` hat nur 1 Location). |
| [2026-05-11-061-arch-ssot-loop](./2026-05-11-061-arch-ssot-loop.md) | architect | open (standing, paused) | **Standing-Loop, auf 50er-Pause.** Pro `/clear` EIN 10er-Override-Batch. CC erkennt Domain + nächste Nummer via File-Listing, schreibt `manual-overrides-ssot-{w40k\|hh}-NNN.json`, hängt an `sessions/ssot-loop-log.md` an. Stoppt loud bei kumulativ 50/100/150… Büchern → Resolver-Brief. **Aktuell pausiert** bei 50 Büchern; Re-Trigger nach Brief 063 Apply-Sweep. Iterations 002..005 erledigt; nächste Iteration wäre `ssot-w40k-006`. |

For closed sessions: [`archive/2026-04/`](archive/2026-04/) and [`archive/2026-05/`](archive/2026-05/). Project-history: [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) "Recently shipped" + [`brain/wiki/log.md`](../brain/wiki/log.md).
