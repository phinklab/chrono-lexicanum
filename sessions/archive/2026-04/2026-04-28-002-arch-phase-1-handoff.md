---
session: 2026-04-28-002
role: architect
date: 2026-04-28
status: implemented
slug: phase-1-handoff
parent: 2026-04-28-001
links:
  - 2026-04-28-001
commits:
  - db2733f77c579f82e669a3244c7fc3a386131e56
---

# Phase 1 handoff — install, verify, deploy

## Goal

Take the scaffold from session 001 and turn it into a running, deployed Phase-1 application. By the end of this session there must be:
- A live Vercel URL where the Hub page renders.
- A Supabase database with the seed data loaded.
- A first commit pushed to a fresh GitHub repo.
- A green `npm run dev` locally.

## Context

Cowork (in session 001) wrote everything in the repo today but **ran zero builds, ran zero installs, ran zero migrations** — Cowork's sandbox cannot finish a `npm install` within its time budget, and the implementer role is yours.

You're starting from a clean working tree. Read these first, in order:

1. `CLAUDE.md` — shared context, conventions, what-not-to-do
2. `docs/agents/CLAUDE_CODE.md` — your role
3. `docs/agents/SESSIONS.md` — how to write your report
4. `sessions/2026-04-28-001-arch-bootstrap.md` — what just happened
5. `ONBOARDING.md` — has step-by-step setup that mirrors this brief

## Constraints

- The repo MUST be clean before the first push. No `node_modules/`, no `.next/`, no `archive/`, no `.env.local`. Verify with `git status` before pushing.
- The seed script MUST work against `scripts/seed-data/*.json`, NOT against the prototype's JS files. (Cowork already updated `scripts/seed.ts` for this.)
- Migrations MUST be committed under `src/db/migrations/` after generation.
- The first commit message: `Phase 1: scaffold Next.js + Drizzle + Supabase` (or your equivalent — terse, imperative, in line with `CLAUDE.md` § Git).
- Do NOT modify the data schema (`src/db/schema.ts`) just because something looks off — flag it in your report's "For next session" instead. Schema changes are architect calls.
- Do NOT push to `main` if `npm run lint` or `tsc --noEmit` fails.

## Out of scope

- Don't start porting components from the prototype (that's Phase 2).
- Don't build the time slider, the recommendation engine, the ingestion pipeline, or anything else from the Roadmap beyond what's needed for a green Phase 1.
- Don't add CI / GitHub Actions yet (Phase 1.5).
- Don't add tests yet (Phase 1.5).
- Don't set up a custom domain (Phase 6).

## Acceptance

- [ ] `npm install` completes locally with the lockfile committed
- [ ] `npm run lint` passes (or, if `eslint-config-next` v9 needs flat config, set that up — your call, document in report)
- [ ] `tsc --noEmit` passes
- [ ] `.env.local` created locally (NOT committed) with valid Supabase credentials
- [ ] `npm run db:generate` produced a SQL migration file under `src/db/migrations/0000_*.sql`
- [ ] `npm run db:migrate` applied it to the dev Supabase project
- [ ] `npm run db:seed` ran successfully. Expected: `Inserted 0 books.` plus the reference structure (eras, factions, series, sectors, locations, characters-derived-from-zero-books = empty). The books list is intentionally empty in v1; real books arrive via Phase 4 ingestion. Verify in Drizzle Studio that `eras`, `factions`, `sectors`, `locations` are populated and `books` is empty.
- [ ] `npm run dev` serves http://localhost:3000 with the Hub page rendering (Aquila, three doorways, no console errors)
- [ ] `/timeline`, `/map`, `/ask` routes respond with their stubs
- [ ] First push to GitHub succeeds; `archive/` is NOT in the push (`git ls-files | grep archive` returns nothing)
- [ ] Vercel deployment succeeds; same Hub page renders at the public URL
- [ ] Implementer report `sessions/2026-04-28-003-impl-phase-1-handoff.md` committed with status `complete`
- [ ] This brief's frontmatter `status:` flipped from `open` to `implemented`

## Open questions for your report

You have full freedom on these — pick what's right and tell us why in "Decisions I made":

1. **Versions.** The `package.json` Cowork wrote pins specific versions (`next@15.1.6`, `react@19.0.0`, `drizzle-orm@^0.38.4`, etc.). Are they current? If anything is meaningfully out of date or has a known showstopper bug, bump it.
2. **ESLint flat config.** ESLint v9 requires the new flat config format (`eslint.config.mjs`). `eslint-config-next` may or may not have a stable flat-config story by now — check, set up whichever works, document.
3. **Tailwind v4?** Cowork picked Tailwind v3 because v4 was new at the time. If v4 is now mature and the migration is trivial, bump it. Otherwise stay on v3 and note it.
4. **Drizzle migration safety on Supabase pooler.** The `prepare: false` flag in `src/db/client.ts` is for the Supabase transaction pooler. For migrations we use the *direct* connection string. Verify `drizzle-kit migrate` works against the direct URL. If it doesn't, fix `drizzle.config.ts` — that's a config detail, not a schema change.
5. **Vercel env vars.** Production needs the same vars as `.env.local`, but `NEXT_PUBLIC_SITE_URL` should be the Vercel URL. Set them in the Vercel dashboard before the first deploy.

## Notes

- `ONBOARDING.md` is essentially a long-form version of this brief, written for Philipp. If anything in the two contradicts, this brief wins (and patch `ONBOARDING.md` in your report's diff).
- Philipp may run some of the manual steps himself (creating the GitHub repo, creating the Supabase project) and hand you the credentials. That's fine — meet him where he is.
- Don't commit secrets even if Philipp pastes them in chat. They go in `.env.local` (gitignored) and the Vercel dashboard.
