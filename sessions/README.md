# Sessions

This folder is the project's history. Every meaningful unit of work — an architect brief from Cowork, an implementation report from Claude Code — is one Markdown file here.

For the format, naming convention, status lifecycle, and full rules, see [`docs/agents/SESSIONS.md`](../docs/agents/SESSIONS.md).

## Quick reference

- **Naming:** `YYYY-MM-DD-NNN-{arch|impl}-{slug}.md` — e.g. `2026-04-28-002-arch-phase-1-handoff.md`
- **`NNN`** is monotonically increasing across the whole project (not reset daily)
- **Templates** live in `_templates/` — copy when starting a new session
- **Drafts** go in `_drafts/` (gitignored)
- **Archive:** when a phase wraps, move completed sessions to `archive/YYYY-MM/`

## Active threads

Open and recently-closed sessions, newest first. Cowork updates this list when it writes or reads a session. Older sessions stay in this folder until a phase ends, then move to `archive/`.

| Session | Role | Status | Topic |
|---|---|---|---|
| [2026-04-28-002](2026-04-28-002-arch-phase-1-handoff.md) | architect | open | Phase 1 handoff — install, verify, deploy |
| [2026-04-28-001](2026-04-28-001-arch-bootstrap.md) | architect | implemented | Bootstrap — project foundation and stack decision |
