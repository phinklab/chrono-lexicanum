---
title: Why Drizzle + Supabase (+ Next.js + Vercel + custom M-scale)
type: decision
created: 2026-04-28
updated: 2026-05-09
sources:
  - ../../../sessions/archive/2026-04/2026-04-28-001-arch-bootstrap.md
  - ../raw/historical/2026-05-08-pre-reset/ARCHITECTURE.md
  - ../../../src/db/schema.ts
related:
  - ../architecture.md
  - ../onboarding.md
confidence: high
decision-date: 2026-04-28
---

# Why Drizzle + Supabase (and the rest of the foundation stack)

**Status:** active · **Decided:** 2026-04-28 (bootstrap session 001) · **Sessions:** [001-bootstrap](../../../sessions/archive/2026-04/2026-04-28-001-arch-bootstrap.md)

## Context

Phase 1 bootstrap brief asked: what's the right stack for a fan archive of W40k novels with three primary tools (Chronicle / Cartographer / Ask the Archive), per-book SEO needs, growth path to community submissions, and a Reddit launch as the milestone?

## Options considered

- **A — Vite + React + JSON-files-in-repo.** Simplest. The HTML prototype was already JSON-shaped data + plain HTML/CSS/JS. Could ship Phase 1 in a day.
- **B — Next.js + SQLite via Prisma.** Server-rendered, real-DB, but SQLite limits scaling and Prisma schema-migrations have been historically friction-y on Vercel.
- **C ✅ chosen — Next.js (App Router) + TypeScript + Tailwind + Drizzle + Supabase Postgres + Vercel.** Real SQL with growth headroom; Drizzle's type-safety + SQL-first approach; Supabase's free tier is ample and auth-ready when needed.

## Decision

**Stack:** Next.js 15 (App Router) + React 19 + TypeScript strict + Tailwind v4 (CSS-first via `@theme {…}`) + Drizzle ORM + Supabase Postgres + Vercel hosting + GitHub repo.

**Custom M-scale** for in-universe years: `(M-1)*1000 + year_within_M`, stored as `numeric(10,3)`. M30.997 = `30997.000`.

**String IDs** for reference tables (`eras`, `factions`, `series`, `sectors`, `locations`, `characters`, `persons`, `services`, `facet_categories`, `facet_values`); **UUIDs** for `works` (titles change, slugs evolve, want stable internal references).

## Why (per axis)

- **Multi-page routing matters.** Books, factions, worlds, characters all want their own URLs (Reddit-shareability + SEO). Next.js fits Vercel's strengths.
- **Data will grow via scraping.** SQL beats hand-written JSON files at >500 books — and we're targeting ~800. JSON-in-repo would force `git diff` on every pipeline run.
- **Per-page Open Graph + SEO is essential** for the Reddit launch. Server-rendered HTML is the cleanest path; static-export wouldn't work for community-submission paths in Phase 6.
- **Drizzle over Prisma:** SQL-first (no Prisma schema-as-DSL re-translation), better TypeScript inference, simpler migrations (just SQL files, committed). Migration friction has been near-zero across 7 schema-migrations to date — the one TTY-rename-resolver issue (Stufe 2a) was worked around via two-step generate (drop-only + create-only).
- **Supabase over self-hosted Postgres:** Auth-ready for Phase 6 community submissions; pooler URL works on IPv4-only Windows networks (Philipp's host); free tier ample at our scale (26 manual + ~700 discovered). Direct-connection IPv4-removal in 2024 forced the pooler-discipline early — non-issue now that everyone uses port 6543.
- **Vercel:** Zero-config Next.js deploys, preview URLs per branch, GitHub-integration auto-comments on PRs. Drizzle migrations run via `vercel-build` (`tsx scripts/migrate.ts && next build`) — local + production share the exact code path.
- **Custom M-scale** beat the alternative ("real integer year + separate millennium column") because: (a) all ordering/range queries become trivial (`WHERE start_y BETWEEN 30998 AND 31014`); (b) the UI display layer formats as "M30.998" without DB joins; (c) consistent with the existing prototype data — zero conversion needed for seed.
- **String IDs for reference, UUID for works** because: reference data has stable, human-readable identifiers (`'thousand_sons'`, `'lexicanum'`, `'cw_violence'`) — debuggable in queries and survives slug-changes. Works get UUIDs because their titles/slugs evolve over time but internal foreign keys must be stable.

## When this decision should be revisited

- **If Vercel pricing changes** make the free tier insufficient. Migration path: keep Next.js, switch to Cloudflare Pages or Netlify (Next-compatible). Supabase migration is harder but possible (export/import).
- **If Drizzle stops being maintained** or develops bugs blocking schema iteration. Migration path: Kysely is the closest alternative philosophically.
- **If we hit Supabase pooler limits** (concurrent connection ceiling). Migration path: Supabase has a paid tier with higher limits, or self-host Postgres on a small VPS.
- **If the M-scale becomes painful** (cross-millennium novels, unusual time-encodings like M40.5K-style). The `secondary_era_ids text[]` open question (4 in [`../open-questions.md`](../open-questions.md)) hints at where this might break — but the M-scale itself is fine.

## Aftermath

The Stufe-2a schema redesign (2026-05-01, sessions 019/020) replaced the books-centric topology with works-centric Class-Table-Inheritance (CTI). Drizzle handled this cleanly — two-file migration split (drop-only + create-only) sidestepped the rename-resolver TTY issue. Decision still active; no axis has been challenged enough to revisit.
