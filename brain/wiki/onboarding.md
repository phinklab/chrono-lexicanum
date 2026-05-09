---
title: Onboarding — first-time setup
type: workflow
created: 2026-05-09
updated: 2026-05-09
sources:
  - ../raw/historical/2026-05-08-pre-reset/ONBOARDING.md
  - ../../sessions/2026-05-08-049-arch-karpathy-brain-atlas-reset.md
related:
  - ./project-state.md
  - ./workflows/atlas-regen.md
  - ./architecture.md
confidence: high
---

# Onboarding — first-time setup

> Follow this once. After that, daily work is `git pull && npm run dev`. Total time: ~30 minutes for the repo + Vercel side; +5 minutes if you also set up Obsidian for the Atlas.

You'll set up four things, in this order:

1. Local install (Node, npm, the repo)
2. GitHub repo (push the code)
3. Supabase project (database)
4. Vercel deploy (live URL)

Plus optional: **5. Obsidian for the chrono-atlas vault** (one-time, only if you want a graph-view of the book domain).

## 1. Local install

Need **Node.js 22 or newer** + **git**. Check:

```bash
node --version
npm --version
git --version
```

In the project folder:

```bash
git init -b main          # if not already
git add .
git commit -m "Phase 1: scaffold Next.js + Drizzle + Supabase"
npm install               # ~2 minutes
git add package-lock.json
git commit -m "Add package-lock.json"
```

## 2. GitHub repo

Create at <https://github.com/new>: name `chrono-lexicanum`, **Public** (cleanest for a fan project; needed for Vercel-Hobby SSO-free previews — see memory note on Vercel preview deployment protection). Do **not** add a README/.gitignore/license — we have those.

```bash
git remote add origin https://github.com/<your-username>/chrono-lexicanum.git
git branch -M main
git push -u origin main
```

(Use Personal Access Token if HTTPS prompts for credentials.)

## 3. Supabase project

Go to <https://supabase.com>, **New project**. Name: `chrono-lexicanum`. Generate a strong DB password (save in password manager). Region: closest to you (e.g. `eu-central-1` Frankfurt). Free plan.

Wait ~2 minutes. Then **Settings → Database → Connection string** (URI tab):

- **Use the "Transaction pooler" URL (port 6543)**, NOT the "Direct connection" URL. Reason: Supabase free tier dropped IPv4 from the direct hostname in 2024. Most home/office networks don't have IPv6, so direct doesn't reach. The pooler hostname (`aws-1-eu-central-1.pooler.supabase.com` or similar) has IPv4 records and works for both runtime *and* migrations.
- It looks like: `postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-1-eu-central-1.pooler.supabase.com:6543/postgres`
- URL-encode special characters in the password (`*` → `%2A`, `,` → `%2C`, `!` → `%21`, etc.).

Then **Settings → API** — copy `Project URL`, `anon public` key, `service_role` key (keep secret).

Create `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:

```env
DATABASE_URL="postgresql://postgres.[REF]:[PWD]@aws-1-eu-central-1.pooler.supabase.com:6543/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-..."     # for Phase-3 LLM enrichment (optional in dev)
HARDCOVER_API_TOKEN="..."          # for Phase-3 Hardcover crawler (optional in dev)
```

Generate + apply schema:

```bash
npm run db:generate    # writes src/db/migrations/0000_*.sql
npm run db:migrate     # applies to Supabase
npm run db:seed        # ~26 books + reference data (eras, factions, sectors, locations, services, facets, persons)
```

Verify in Drizzle Studio (`npm run db:studio`).

## 4. Run locally

```bash
npm run dev
# open http://localhost:3000
```

Errors:
- "DATABASE_URL is not set" → check `.env.local` exists with the right values
- "relation does not exist" → re-run `npm run db:migrate`
- Anything else → ask Claude Code: `claude` and paste the error

## 5. Vercel deploy

<https://vercel.com> → sign up with GitHub → **Add New… → Project** → import `chrono-lexicanum` → Vercel auto-detects Next.js, leave defaults → **Environment Variables**: paste the same vars from `.env.local` (set `NEXT_PUBLIC_SITE_URL` to the Vercel URL it gives you) → Deploy.

Auto-redeploys on every `main` push; previews on every branch/PR. Note: previews are gated by Vercel "Deployment Protection" by default — curling `/healthz` on a preview URL needs auth. Production is the right URL for monitors.

## 6. Optional — Obsidian for chrono-atlas

The book domain (per-book detail) lives in an external Obsidian vault, generated from Postgres via `npm run atlas:regen`. Brain ([`brain/`](../CLAUDE.md), the engineering memory you're reading) is read in your IDE / on GitHub; the Atlas is read in Obsidian for graph-view + cross-page queries.

1. Install Obsidian (free, <https://obsidian.md/download>).
2. Generate the vault: `npm run atlas:regen`. Default output: `~/chrono-atlas/` (i.e. `C:\Users\<you>\chrono-atlas\` on Windows). Override with `--out=<path>`.
3. In Obsidian: "Open folder as vault" → select the `chrono-atlas/` folder.
4. Optional plugins: Dataview (cross-page queries), Graph-View (built-in). Both non-critical; the Atlas works without.

**Don't** open `brain/` as a second Obsidian vault. Brain is IDE/GitHub material; opening it in Obsidian doubles your reading surface and dilutes the domain split. See [`./workflows/atlas-regen.md`](./workflows/atlas-regen.md) for vault regeneration discipline.

## Daily workflow after this

```bash
git pull
npm run dev
# ... work ...
git add . && git commit -m "..." && git push
```

Schema changes:
```bash
# Edit src/db/schema.ts
npm run db:generate
npm run db:migrate
git add src/db/schema.ts src/db/migrations
git commit -m "Schema: <what changed>"
git push
```

Pipeline runs (Phase 3, dry-run):
```bash
npm run ingest:backfill -- --limit 50 --offset 40
# Inspect ingest/.last-run/backfill-YYYYMMDD-HHMM.diff.json
# Or browse /ingest dashboard route
```

## Operations

### CI

`.github/workflows/ci.yml` runs `npm run lint` and `tsc --noEmit` on every PR. Job name: `lint-and-typecheck`. Status check on PRs: `ci / lint-and-typecheck` — use that name in branch-protection.

CI does NOT run `next build` (Vercel does). No tests yet. If red, click into the PR — failing step is ESLint or `tsc --noEmit`.

### Migrations on deploy

`vercel-build` is `tsx scripts/migrate.ts && next build`. The programmatic Drizzle migrator applies pending migrations, then Next builds. If migrate exits non-zero, the `&&` short-circuits and the build fails — no half-applied schema in production.

Same script powers `npm run db:migrate` locally → local and Vercel run the exact same code path. Inspect on a deploy via Vercel build log: search for `[migrate] starting…` and `[migrate] done in Xms`.

### Healthz

`GET /healthz` pings DB with `select 1`:
- `200 { ok: true, db: "up", ts }` if query succeeded
- `503 { ok: false, db: "down", error }` if it failed (one-line error, no stack trace)

Opts out of all caching (`force-dynamic` + `cache-control: no-store`). Public, no auth. Production: `https://chrono-lexicanum.vercel.app/healthz`.

### Preview URLs

Vercel's GitHub integration comments preview URLs on every PR (one persistent comment, updated). Previews gated by Deployment Protection — production URL is the right one for monitors.

## Windows-specific notes

(Documented because Philipp's host is Windows; see brain memory record.)

- PowerShell ExecutionPolicy may block `npm.ps1`. Workaround: use Git Bash (MINGW64) for npm/git operations, or set `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
- Supabase requires the **pooler URL**, not direct (Windows networks lack IPv6 by default).
- `drizzle-kit` rename-resolver prompts need a TTY. If a schema diff drops + adds similarly-named tables, split into two-step generate (drop-only then create-only) — see brain memory.
