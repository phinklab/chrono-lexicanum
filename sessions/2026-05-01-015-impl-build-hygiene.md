---
session: 2026-05-01-015
role: implementer
date: 2026-05-01
status: complete
slug: build-hygiene
parent: 2026-05-01-014
links:
  - 2026-05-01-014
commits:
  - 840de2591fa1aba2d262937c1767cc50bc48a2c6
  - 6aee23b95e4730280170af331dc3f1df1a39b060
  - 1011d14dcc39fa9f1e56f66a53cfd65b0a3a5876
---

# Phase 1.5 — Build-Hygiene shipped

## Summary

CI runs lint + typecheck on every PR (stable check name `ci / lint-and-typecheck`); Vercel applies Drizzle migrations before `next build` via a programmatic runner that the local `db:migrate` also uses; `/healthz` returns 200/503 JSON for uptime monitoring. Vercel's GitHub integration was already commenting preview URLs by default — no Action needed.

## What I did

- `.github/workflows/ci.yml` — new. Triggers on `pull_request` and pushes to `main`; concurrency group cancels superseded runs; runs `npm ci`, `npm run lint`, `npm run typecheck` on Node 22. No build, no tests.
- `scripts/migrate.ts` — new. Programmatic Drizzle migrator using `drizzle-orm/postgres-js/migrator`. Same connection options as `src/db/client.ts` (ssl required, `prepare:false`), `max:1` for the one-shot. Bracket logs (`[migrate] starting…` / `[migrate] done in Xms`) for visibility in the build log; non-zero exit on any failure.
- `package.json` — added `engines.node: ">=22"`; added `vercel-build: tsx scripts/migrate.ts && next build`; repointed `db:migrate` to the same script (with `--env-file=.env.local`) so local and Vercel paths are identical.
- `src/app/healthz/route.ts` — new. Server-side route handler. `GET` runs `db.execute(sql\`select 1\`)` and returns either `200 { ok:true, db:"up", ts }` or `503 { ok:false, db:"down", error }`. `dynamic = "force-dynamic"` plus explicit `Cache-Control: no-store, max-age=0`. Error message collapsed to one line and clipped at 200 chars.
- `src/db/migrations/0001_smoke-test-deploy.sql` — new no-op migration (`SELECT 1;`) generated via `drizzle-kit generate --custom`. Permanent record of the migration-on-deploy wiring; do not "fix" by removing.
- `src/db/migrations/meta/0001_snapshot.json` and `_journal.json` — auto-updated by drizzle-kit.
- `ONBOARDING.md` — added an `Operations` section (CI behavior + check name, migration-on-deploy mechanics, `/healthz` URL + meaning, preview-URL comment expectation). Removed the obsolete "manual production migrate" footnote from Daily workflow.
- `ROADMAP.md` — Phase 1.5 box ticked with `✅ (shipped 2026-05-01, sessions 014–015)`.
- `sessions/README.md` — added 015 row at top, flipped 014 to `implemented`. The `NEXT_PUBLIC_SITE_URL` carry-over was already pruned in the brief commit (Cowork folded it into the brief's pre-flight).

## Decisions I made

### Migration mechanism — programmatic, not `drizzle-kit migrate` CLI

`scripts/migrate.ts` uses `drizzle-orm/postgres-js/migrator` instead of shelling out to `drizzle-kit migrate`. Reasons:
- `drizzle-kit` lives in `devDependencies`. Vercel currently installs devDeps during builds, but that's a default we shouldn't bet the production migration step on. The programmatic path uses only runtime deps already in `dependencies` (`drizzle-orm`, `postgres`).
- Explicit lifecycle (open client → migrate → `await client.end()` → exit). The bracket logs show up cleanly in the Vercel build log.
- Same connection options as the runtime client (Supabase pooler + `prepare:false`), so connection failures mean the same thing in build as at runtime.

I went one step further than the brief asked and **unified `db:migrate` to use the same script** (with `--env-file=.env.local`). Local and Vercel now run identical code. One runner, two callers. Slight scope expansion; you confirmed this in plan review.

### Vercel preview-URL comments — default-on, no Action needed

Confirmed empirically on PR #1: the Vercel-GitHub integration comments the preview URL automatically and updates that comment on each new commit. Documented in `ONBOARDING.md`. **No GitHub Action wired up** — would have been wasted code.

### `/healthz` is public, no auth

Health endpoints are consumed by uptime monitors that don't manage tokens. The body reveals only up/down + a timestamp + a clipped error string. Token-protecting it would force every monitor config to carry a secret for no real defense.

### Node version pinned to 22 LTS

Added `"engines": { "node": ">=22" }` to `package.json` and `node-version: '22'` in `.github/workflows/ci.yml`. Local, CI, and Vercel now agree. Node 22 is the active LTS as of brief date; Node 24 LTS lands later in 2026.

### tsx wrapper instead of top-level await

First draft of `scripts/migrate.ts` used top-level await. tsx defaulted to CJS transpilation and rejected it (`Top-level await is currently not supported with the "cjs" output format`). Wrapped in `async function main(); main().catch(...)` — same pattern `scripts/seed.ts` already uses. Adding `"type": "module"` to `package.json` would have been a project-wide change with broader ripples; the IIFE was the smaller fix.

### Smoke-test migration kept, not reverted

`0001_smoke-test-deploy.sql` is `SELECT 1;` with a comment. The brief allowed either keeping or reverting; keeping it as a permanent record avoids the awkward shape of a "ghost migration" that was applied on Vercel but then deleted from the journal (which would cause hash-mismatch problems on the next `db:generate`). The file is harmless.

### `/healthz` cache-control header (defense in depth)

`force-dynamic` should be enough for Next's caching layer, but I added `Cache-Control: no-store, max-age=0` explicitly so downstream CDNs and any monitor's HTTP cache also don't cache the response. Costs nothing.

## Verification

Local:
- `npm run lint` — 0 errors, 1 pre-existing warning (`@next/next/no-page-custom-font` in `src/app/layout.tsx`, baseline).
- `npm run typecheck` — clean.
- `npm run dev` + `curl http://localhost:3000/healthz` × 2 → both `200`, body `{"ok":true,"db":"up","ts":"…"}`, distinct timestamps (`10:46:47.237Z` vs `10:46:48.312Z`).
- Restarted dev with bogus `DATABASE_URL` → `503`, body `{"ok":false,"db":"down","error":"Failed query: select 1 params:"}`. (`Cache-Control: no-store, max-age=0` on both responses.)
- `DATABASE_URL=postgresql://invalid:invalid@127.0.0.1:9999/nope npx tsx scripts/migrate.ts` → exit code 1 with `[migrate] starting…` then `[migrate] failed: DrizzleQueryError … ECONNREFUSED`. Confirms `vercel-build`'s `&&` chain will short-circuit on real Vercel migration failures.

CI / Vercel on PR #1 (https://github.com/wptnoire/chrono-lexicanum/pull/1):
- `ci / lint-and-typecheck` → SUCCESS on the feature branch.
- Vercel preview deploy → SUCCESS (means `vercel-build` ran end-to-end including `scripts/migrate.ts`; otherwise the `&&` would have failed the build).
- Vercel commented the preview URL on the PR via the default Vercel-GitHub integration.
- Curl on the preview URL → 401 + Vercel SSO redirect (Deployment Protection is enabled by default for previews; production will be public, see "Open issues" below).

CI red-path smoke (PR #2, closed unmerged, branch deleted):
- Branch `demo/ci-fail-smoke` with `const x: number = "this is a string..."`.
- CI run 25211893660 → `lint-and-typecheck` FAILURE, log shows `src/_ci-smoke-fail.ts(5,7): error TS2322: Type 'string' is not assignable to type 'number'` and `Process completed with exit code 2`.
- PR closed, branch deleted on GitHub and locally, remote-tracking ref pruned.

Production after merge: `curl https://chrono-lexicanum.vercel.app/healthz` → `200`, body `{"ok":true,"db":"up","ts":"2026-05-01T11:05:38.220Z"}`, `Cache-Control: no-store`, `X-Vercel-Cache: MISS`. First poll after the merge succeeded with no warm-up needed.

## Open issues / blockers

- **Preview URLs are auth-gated.** Vercel's Deployment Protection is on for previews by default, so `curl <preview>/healthz` returns 401. This is fine for the brief's acceptance because production is public, but worth noting: any uptime monitor pointed at a preview will see auth, not the real route. If you ever want public previews (e.g. for sharing a feature with someone outside Vercel), toggle "Vercel Authentication" off in Project → Settings → Deployment Protection.
- **Vercel build-log line check.** I asked you to eyeball the build log for the `[migrate] starting…` / `[migrate] done in Xms` lines since I can't reach the protected dashboard programmatically. The deploy succeeded, which already implies migrate ran (otherwise the `&&` chain fails), but the explicit log lines are the cleanest signal for future debugging.

## For next session

- **Branch protection on `main`.** The CI check is now stable (`ci / lint-and-typecheck`). Wiring it as a Required Status Check in GitHub → Settings → Branches → Add rule for `main` is a one-time Philipp action; the brief explicitly noted this isn't CC's to do.
- **Failure-mode test for migration-on-deploy.** I demonstrated locally that the script exits non-zero when DATABASE_URL is unreachable. A real Vercel-side test (push a deliberately-broken migration on a throwaway branch, confirm the deploy fails, revert) was out of scope and felt risky against the shared Supabase. If you want belt-and-suspenders, that's a 5-minute side quest later.
- **Sentry / error tracking.** Brief listed it as "own decision, own brief." Worth a session before Phase 4 ingestion lands and silent failures get expensive.
- **Hub novel-count freshness.** Carry-over remains for Phase 4 — once books are real, decide between `export const revalidate = 60` and "redeploy to update count."
- **GitHub Actions Node 20 deprecation warning.** The `actions/checkout@v4` and `actions/setup-node@v4` we use are still on Node 20 internally; GitHub is forcing them to Node 24 in June 2026. No action needed now — both will get patched upstream — but worth a glance at the workflow if you see deprecation noise.

## References

- Brief: [`sessions/2026-05-01-014-arch-build-hygiene.md`](2026-05-01-014-arch-build-hygiene.md)
- Drizzle migrator API: <https://orm.drizzle.team/docs/migrations#run-migrations> (the `migrate(db, { migrationsFolder })` form)
- Vercel build configuration: <https://vercel.com/docs/builds/configure-a-build#build-command> (`vercel-build` script convention)
- Vercel Deployment Protection: <https://vercel.com/docs/deployment-protection>
- PR shipping this session: <https://github.com/wptnoire/chrono-lexicanum/pull/1>
- CI red-path proof (closed): <https://github.com/wptnoire/chrono-lexicanum/pull/2>
