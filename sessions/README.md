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

- **`NEXT_PUBLIC_SITE_URL` on Vercel.** Was set to `http://localhost:3000` at first deploy; Philipp updates manually to `https://chrono-lexicanum.vercel.app` in the Vercel dashboard. Confirm-and-strike when verified — purely cosmetic for now (Open Graph metadata), important before Reddit launch.
- **Hub novel-count freshness.** The Hub `<footer>` reads `select count(*) from books` server-side; Next 16 statically prerenders the route at build time, so the count is baked at deploy. Once Phase 4 ingestion lands real books, decide whether to add `export const revalidate = 60` for hourly refresh or accept "redeploy to update count." Implementer-flagged in 2026-04-29-007.

## Active threads

Open and recently-closed sessions, newest first. Cowork updates this list when it writes or reads a session. Older sessions stay in this folder until a phase ends, then move to `archive/`.

| Session | Role | Status | Topic |
|---|---|---|---|
| [2026-04-29-010](2026-04-29-010-impl-aquila-redesign.md) | implementer | complete | Aquila redesign shipped — three layered feather banks per wing; body/talons kept |
| [2026-04-29-009](2026-04-29-009-arch-aquila-redesign.md) | architect | implemented | Aquila redesign — silhouette must read as canonical W40k two-headed eagle (parallel small commit) |
| [2026-04-29-008](2026-04-29-008-arch-timeline-overview-eraview.md) | architect | open | Phase 2a slim — Overview ribbon + EraView track-view at /timeline; ?era= URL contract conflated; 2-3 book fixture |
| [2026-04-29-007](2026-04-29-007-impl-css-hub-polish.md) | implementer | complete | Phase 2 kickoff shipped — tokens, Hub polish, starfield + top-chrome + era-toggle live |
| [2026-04-29-006](2026-04-29-006-arch-css-hub-polish.md) | architect | implemented | Phase 2 kickoff — token foundation, Hub polish, global chrome (starfield + top-chrome + era-toggle) |
| [2026-04-28-005](2026-04-28-005-impl-stack-bumps.md) | implementer | complete | Stack bumps shipped — Next 16 + Tailwind 4, deployed |
| [2026-04-28-004](2026-04-28-004-arch-stack-bumps.md) | architect | implemented | Stack bumps — Next major + Tailwind major before Phase 2 |
| [2026-04-28-003](2026-04-28-003-impl-phase-1-handoff.md) | implementer | complete | Phase 1 ship report — live at chrono-lexicanum.vercel.app |
| [2026-04-28-002](2026-04-28-002-arch-phase-1-handoff.md) | architect | implemented | Phase 1 handoff — install, verify, deploy |
| [2026-04-28-001](2026-04-28-001-arch-bootstrap.md) | architect | implemented | Bootstrap — project foundation and stack decision |
