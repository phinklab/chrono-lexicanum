# Sessions

This folder is the project's history. Every meaningful unit of work — an architect brief from Cowork, an implementation report from Claude Code — is one Markdown file here.

For the format, naming convention, status lifecycle, and full rules, see [`docs/agents/SESSIONS.md`](../docs/agents/SESSIONS.md).

## Quick reference

- **Naming:** `YYYY-MM-DD-NNN-{arch|impl}-{slug}.md` — e.g. `2026-04-28-002-arch-phase-1-handoff.md`
- **`NNN`** is monotonically increasing across the whole project (not reset daily)
- **Templates** live in `_templates/` — copy when starting a new session
- **Drafts** go in `_drafts/` (gitignored)
- **Archive:** when a phase wraps, move completed sessions to `archive/YYYY-MM/`

## Carry-over for the next architect brief

Items decided / surfaced between sessions that the **next** architect brief MUST address. Append here when you spot something at the end of a session that doesn't deserve its own brief but must not be forgotten. Cowork prunes items here once they've been folded into a brief or otherwise resolved.

- **Auto-Memory `userEmail` typo on Claude Code.** CC's auto-memory still holds `wtpnoire@gmail.com`; correct value is `p.kuenzler@web.de` (the GitHub-verified address). Fix path: ask CC to use its own memory mechanism (`/memory edit` or equivalent) — do NOT hand-edit `.claude.json`. Add as a one-line "before you start" item in the next brief.
- **Tailwind v4 border-color compat block in `globals.css` (lines 77–85).** Codemod-installed safety net that defaults all element borders to `gray-200` for v3-compat. Becomes dead weight as soon as Phase 2 ports prototype CSS and every styled element specifies its own border color. Add as the final acceptance bullet in the Phase 2 CSS-port brief: *"verify the v3 compat block in globals.css is no longer needed and delete it; if any element loses its visible border after deletion, that element gets an explicit border-color and the block still goes."*
- **`NEXT_PUBLIC_SITE_URL` on Vercel.** Was set to `http://localhost:3000` at first deploy; Philipp updates manually to `https://chrono-lexicanum.vercel.app` in the Vercel dashboard. Confirm-and-strike when verified — purely cosmetic for now (Open Graph metadata), important before Reddit launch.

## Active threads

Open and recently-closed sessions, newest first. Cowork updates this list when it writes or reads a session. Older sessions stay in this folder until a phase ends, then move to `archive/`.

| Session | Role | Status | Topic |
|---|---|---|---|
| [2026-04-28-005](2026-04-28-005-impl-stack-bumps.md) | implementer | complete | Stack bumps shipped — Next 16 + Tailwind 4, deployed |
| [2026-04-28-004](2026-04-28-004-arch-stack-bumps.md) | architect | implemented | Stack bumps — Next major + Tailwind major before Phase 2 |
| [2026-04-28-003](2026-04-28-003-impl-phase-1-handoff.md) | implementer | complete | Phase 1 ship report — live at chrono-lexicanum.vercel.app |
| [2026-04-28-002](2026-04-28-002-arch-phase-1-handoff.md) | architect | implemented | Phase 1 handoff — install, verify, deploy |
| [2026-04-28-001](2026-04-28-001-arch-bootstrap.md) | architect | implemented | Bootstrap — project foundation and stack decision |
