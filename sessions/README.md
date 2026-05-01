# Sessions

This folder is the project's history. Every meaningful unit of work — an architect brief from Cowork, an implementation report from Claude Code — is one Markdown file here.

For the format, naming convention, status lifecycle, and full rules, see [`docs/agents/SESSIONS.md`](../docs/agents/SESSIONS.md).

## Quick reference

- **Naming:** `YYYY-MM-DD-NNN-{arch|impl}-{slug}.md` — e.g. `2026-04-28-002-arch-phase-1-handoff.md`
- **`NNN`** is monotonically increasing across the whole project (not reset daily)
- **Templates** live in `_templates/` — copy when starting a new session
- **Drafts** go in `_drafts/` (gitignored)
- **Archive:** when a phase wraps, move completed sessions to `archive/YYYY-MM/`

## Infrastructure log

Small infra changes that don't justify a session. Newest first.

- **2026-05-01** — Repo transferred from `wptnoire/chrono-lexicanum` to `phinklab/chrono-lexicanum` (new GitHub Team org, needed because Rulesets don't enforce on private repos under the Free plan). New canonical URL: <https://github.com/phinklab/chrono-lexicanum>. GitHub redirects old URLs permanently; references to `wptnoire/...` in archived session logs are left as-is (historical record).

## Carry-over for the next architect brief

Items decided / surfaced between sessions that the **next** architect brief MUST address. Append here when you spot something at the end of a session that doesn't deserve its own brief but must not be forgotten. Cowork prunes items here once they've been folded into a brief or otherwise resolved.

- **Hub novel-count freshness.** The Hub `<footer>` reads `select count(*) from books` server-side; Next 16 statically prerenders the route at build time, so the count is baked at deploy. Once Phase 4 ingestion lands real books, decide whether to add `export const revalidate = 60` for hourly refresh or accept "redeploy to update count." Implementer-flagged in 2026-04-29-007.

## Active threads

Open and recently-closed sessions, newest first. Cowork updates this list when it writes or reads a session. Older sessions stay in this folder until a phase ends, then move to `archive/`.

| Session | Role | Status | Topic |
|---|---|---|---|
| [2026-05-01-015](2026-05-01-015-impl-build-hygiene.md) | implementer | complete | Phase 1.5 shipped — CI green on PRs, Drizzle migration runs on Vercel deploy, /healthz live, preview-URL comments confirmed |
| [2026-05-01-014](2026-05-01-014-arch-build-hygiene.md) | architect | implemented | Phase 1.5 Build-Hygiene — CI, Drizzle migration on Vercel deploy, /healthz, preview-URL comments |
| [2026-04-30-013](2026-04-30-013-impl-timeline-buzzy-hover-and-pin-scale.md) | implementer | complete | Timeline polish shipped — buzzy era-band glitch, themed focus brackets, per-era count badges replace ribbon pins |
| [2026-04-30-012](2026-04-30-012-arch-timeline-buzzy-hover-and-pin-scale.md) | architect | implemented | Timeline polish — buzzy/glitchy hover, focus-ring fix, book pins that scale to hundreds |
| [2026-04-29-011](2026-04-29-011-impl-timeline-overview-eraview.md) | implementer | complete | Phase 2a slim shipped — Overview ribbon + EraDetail at /timeline; ?era= contract migrated; 3-book fixture seeded |
| [2026-04-29-008](2026-04-29-008-arch-timeline-overview-eraview.md) | architect | implemented | Phase 2a slim — Overview ribbon + EraView track-view at /timeline; ?era= URL contract conflated; 2-3 book fixture |

Archived sessions live in [`archive/2026-04/`](archive/2026-04/) — Phase 1 (bootstrap, handoff), Phase 1.1 (stack bumps), Phase 2.0 (CSS + Hub + chrome), and the Aquila redesign side-quest.
