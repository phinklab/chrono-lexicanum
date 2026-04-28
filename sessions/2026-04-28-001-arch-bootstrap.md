---
session: 2026-04-28-001
role: architect
date: 2026-04-28
status: implemented
slug: bootstrap
parent: null
links: []
commits: []
---

# Bootstrap — project foundation and stack decision

## Goal

Take the existing single-HTML-file React prototype ("Chrono Lexicanum") and decide the long-term stack, scaffold a real Next.js + TypeScript project around it, and set up the Cowork ↔ Claude Code workflow that will carry the project forward.

## Context

Philipp arrived with a working prototype: one `Chrono Lexicanum.html` file, ~14 React components loaded via Babel-standalone in the browser, and three data files (`books.js`, `galaxy.js`, `archive.js`) holding ~62 books, 25 factions, 7 eras, 5 sectors, 28 named worlds, and a 5-question recommendation funnel. He wants this to grow into a polished, public, Reddit-launchable site with three primary tools (Chronicle, Cartographer, Ask the Archive), per-book detail pages, an ingestion pipeline pulling from Lexicanum/Goodreads/Black Library, and eventually community submissions.

This is a hobby project but Philipp wants it built to a real engineering bar. He's a thoughtful collaborator — pushed back hard on the initial Vite + JSON recommendation and was right.

## Decisions made (with Philipp, this session)

| Question | Decision | Rationale |
|---|---|---|
| Hosting | **Vercel** | Free, global CDN, serverless functions for future submission forms, native Next.js integration. GitHub Pages can't host serverless. |
| Frontend framework | **Next.js 15 (App Router) + React 19 + TypeScript** | Project will have many page types (book/faction/world/character details). Next.js + Vercel is the path of least resistance. Vite was the initial recommendation; Philipp correctly pointed out that for a multi-page, growing, SEO-sensitive project, Next.js is the better fit. |
| Database | **Supabase Postgres + Drizzle ORM** | Real SQL for cross-cutting queries ("books in segmentum X between M37–M41"), free tier handles >10K rows, REST API and auth ready when community submissions arrive. JSON-in-repo was the initial recommendation; Philipp pushed for "solide" and was right — scraping pipelines will outgrow JSON. |
| Workflow formality | **CLAUDE.md + Git commits + atomic session files** | Lightweight enough for a hobby project, structured enough that two AI agents can hand work back and forth across days. |
| Repo cleanliness | **Prototype lives only locally**, not in repo | The original HTML/JSX prototype is a one-time reference. Its data has been extracted to `scripts/seed-data/*.json` (committed). The prototype folder itself is gitignored. |

See also `ARCHITECTURE.md` § Decisions log for the persistent record.

## What was built in this session

Cowork wrote (no implementation work needed yet, just scaffolding and docs):

- `package.json` with the chosen dependency family (versions to be confirmed by Claude Code on first install)
- `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `drizzle.config.ts`, `.env.example`, `.gitignore`
- `src/db/schema.ts` — full Drizzle schema (eras, factions, series, books, sectors, locations, characters, three junction tables, submissions quarantine, with `source_kind` + `confidence` provenance fields)
- `src/db/client.ts` — cached Postgres client
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Stub routes: `/timeline`, `/map`, `/ask`, `/buch/[slug]`, `/fraktion/[slug]`, `/welt/[slug]`, `/charakter/[slug]`
- `src/components/Aquila.tsx` — proof-of-concept port from the prototype
- `scripts/seed.ts` — loads `scripts/seed-data/*.json` into Postgres, idempotent
- `scripts/seed-data/{eras,factions,series,sectors,locations,ask-questions}.json` — 25 factions, 7 eras, 5 sectors, 28 locations, 14 series, 5 questions; extracted from the prototype as canon reference structure
- `scripts/seed-data/books.json` — intentionally empty `[]`. The prototype's 65 books were placeholders with inconsistent dates/locations; rather than leak that into the live DB, real books arrive via Phase 4 ingestion (Lexicanum, Goodreads, Black Library)
- `CLAUDE.md` — shared project context (read by both agents)
- `docs/agents/COWORK.md` — architect role
- `docs/agents/CLAUDE_CODE.md` — implementer role
- `docs/agents/SESSIONS.md` — session log format
- `sessions/README.md`, `sessions/_templates/{architect-brief,implementer-report}.md`
- `README.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `ONBOARDING.md`

## Acceptance — was this session a success?

- [x] Stack decided and documented in `ARCHITECTURE.md`
- [x] Repo skeleton created (config files + source structure + docs)
- [x] Workflow defined (Cowork as architect, Claude Code as implementer, atomic session files)
- [x] Prototype data extracted to versionable JSON
- [x] Phase 1 of `ROADMAP.md` written, future phases sketched

## Open questions for the next session

- Confirm: the dependency versions in `package.json` are reasonable starting points; Claude Code should bump anything that's stale on first install.
- The prototype has rich CSS (`base.css`, `timeline.css`, `modes.css`, `detail-modal.css`) totaling ~80KB. Phase 2 will need to decide: rewrite as Tailwind utilities, or port the original CSS file-by-file alongside each component? (Suggest: port CSS alongside the component on first migration, then refactor to Tailwind only when a clear pattern emerges.)

## Notes for Claude Code

The next architect brief (`002-arch-phase-1-handoff.md`) is your actual to-do. This session is informational — read it for the *why*, then act on `002`.
