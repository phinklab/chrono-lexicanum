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

> **Maintainer-Bedienung in einem Satz:** Resolver-Apply ist mit Session 069 abgeschlossen; DB-Counts und Smoke-Counts sind dokumentiert. Brief **061** (Loop) kann wieder pro `/clear` weiterlaufen; nächste Iteration wäre `ssot-w40k-006`.

| Session | Role | Status | Topic |
|---|---|---|---|
| [2026-05-12-069-impl-resolver-apply-evidence](./2026-05-12-069-impl-resolver-apply-evidence.md) | implementer | complete | **Resolver-Apply-Evidence.** Migration 0009, Resolver-Seed und Apply-Sweep `001..005` ausgeführt; Nachher-Counts `work_factions=318`, `work_locations=129`, `work_characters=363`; Smoke-Slugs matchen `3/3/6`, `5/6/10`, `7/4/9`, `7/1/5`, `9/3/11`. |
| [2026-05-12-067-impl-resolver-apply-readiness](./2026-05-12-067-impl-resolver-apply-readiness.md) | implementer | complete | **Apply-Readiness für 063.** Detailpage ist vor Migration 0009 preview-sicher, Dry-Run `001..005` liefert erwartete Junction-Counts 318/129/363, Runbook liegt in `docs/resolver-apply-runbook.md`. Nächster Schritt ist Maintainer-DB-Apply, nicht weiterer Code. |
| [2026-05-12-063-arch-resolver-50-books](./2026-05-12-063-arch-resolver-50-books.md) | architect | implemented | **Resolver-Pass nach 50-Bücher-Pause.** Adressiert OQ4 + OQ5. Code gelandet; 067 ergänzt Apply-Readiness und korrigiert die Smoke-Erwartung (`nightbringer` hat nur 1 Location). |
| [2026-05-11-061-arch-ssot-loop](./2026-05-11-061-arch-ssot-loop.md) | architect | open (standing, paused) | **Standing-Loop, auf 50er-Pause.** Pro `/clear` EIN 10er-Override-Batch. CC erkennt Domain + nächste Nummer via File-Listing, schreibt `manual-overrides-ssot-{w40k\|hh}-NNN.json`, hängt an `sessions/ssot-loop-log.md` an. Stoppt loud bei kumulativ 50/100/150… Büchern → Resolver-Brief. **Aktuell pausiert** bei 50 Büchern; Re-Trigger nach Brief 063 Apply-Sweep. Iterations 002..005 erledigt; nächste Iteration wäre `ssot-w40k-006`. |

For closed sessions: [`archive/2026-04/`](archive/2026-04/) and [`archive/2026-05/`](archive/2026-05/). Project-history: [`brain/wiki/project-state.md`](../brain/wiki/project-state.md) "Recently shipped" + [`brain/wiki/log.md`](../brain/wiki/log.md).
