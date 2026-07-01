---
description: Run the maintainer-driven weekly maintenance pass — detect, review, promote, ship one PR (Brief 172).
---

Run the weekly maintenance pass by following
`scripts/runbooks/weekly-db-update-runbook.md` (the 10-step orchestration).

This is the **batch** review of a week's detection — not for a single item (use
`/add-book` or `/add-podcast-episode` for that).

Flow (see the runbook for the exact commands):
1. Preflight — `test:refresh` + read-only `refresh:audit-artifacts`.
2. Fresh detection — `refresh:check` (noop ⇒ stop, no PR).
3. Review gate — show the week's `report.md` (books + episodes) compactly.
4. Per-item: Philipp calls promote / ignore / defer.
5. Promote books via the per-book path (`add-book-runbook.md` → `apply:book --slug`).
6. Promote episodes via the delta path (`add-podcast-episode-runbook.md` →
   `apply:podcast --show`).
7. Advance cursors (`refresh:mark-reviewed --books` / `--show`,
   `refresh:ignore-book`) — AFTER the PR is merged + fetched (sequencing trap).
8. Inspect the rolling cron PR (`automation/weekly-refresh`) and recommend.
9. Ship one CC-authored Batch/Ingestion PR — Philipp merges.
10. Summarize what was promoted / ignored / deferred and which DB writes ran.

Hard rules:
- CI stays **detection-only**; no auto-apply from GitHub Actions.
- Live DB writes (`apply:book`, `apply:podcast`) **only on Philipp's explicit go**.
- No retired machinery (`import:ssot-roster`, `db:apply-override`, `loop:next`,
  `db:apply-scope`); `db:drift` stays a read-only health check.
- Batch/Ingestion strand: never write `brain/**` or `sessions/README.md`.
