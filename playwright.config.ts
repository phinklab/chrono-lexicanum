/**
 * Mini smoke set (launch plan § Session 8) — deliberately small, no further
 * growth ("kein weiterer Ausbau"). Runs against the PRODUCTION build
 * (`next build` first, then these servers boot `next start`):
 *
 *   :4311 "no-DB" server — DATABASE_URL points at an unreachable port
 *          (the ci.yml build pattern). The prerendered/snapshot routes
 *          (hub, map, podcasts, hot books) plus /ask serve their REAL
 *          content; /timeline and /archive degrade to the themed error
 *          surface; the book long tail answers a plain 500. Used by the
 *          `static` project (DB-free routes + menu/seek interaction smokes)
 *          and the `degraded` project (the S2 error-surface contract).
 *   :4310 "live" server — DATABASE_URL from .env.local / CI secret. Used by
 *          the `live` project: /timeline + /archive content smokes, the
 *          timeline-vs-volume-slider smoke, the cold-book ISR canary.
 *
 * PREVIEW_GATE=off on both: under NODE_ENV=production the proxy otherwise
 * redirects every route to /login and all asserts would test the login page.
 *
 * CI split (S8 decision, see the session report): `static` + `degraded` are
 * the REQUIRED tranche (`npm run test:smoke` — DB-free, deterministic).
 * `live` is the mandatory local pre-merge run and moves into CI once a
 * SMOKE_DATABASE_URL secret (S3a read-only runtime role) exists. Local
 * order matters: run `test:smoke` BEFORE `test:smoke:live` on a fresh
 * build — live renders fill the shared .next data/ISR cache (it survives
 * `next build`; cure: rm -rf .next) and would mask the no-DB asserts.
 */
import { defineConfig } from "@playwright/test";

const LIVE_PORT = 4310;
const NO_DB_PORT = 4311;
// Unreachable by design: imports succeed, any real query fails fast.
const NO_DB_URL = "postgres://smoke-no-db:x@127.0.0.1:9/none";

// Smoke servers must NEVER report to the real Sentry project: the degraded
// project triggers DB failures BY DESIGN, and with the .env.local DSN active
// every local run flooded the dashboard with events tagged
// environment=production (next start sets NODE_ENV=production). An explicit
// empty value beats .env.local (@next/env never overrides existing process
// env), which disables the server-side reporter and turns /monitoring into
// its documented 404 no-op. The client bundle still carries the build-baked
// DSN locally, but its beacons die at the disabled tunnel. CI was never
// affected (no DSN in the CI env at all).
const SENTRY_OFF = { NEXT_PUBLIC_SENTRY_DSN: "" };

// The S5 guard (src/lib/site-url.ts) throws at RUNTIME too, not just at
// build: without SITE_URL every dynamically rendered route answers 500. CI
// has no .env.local, so `next start` booted bare and the second PR run
// failed exactly there (/ask 500, all dynamic prefetch targets 500). Same
// reserved-invalid host the CI build step uses; set unconditionally so the
// suite sees identical canonicals locally and in CI (nothing asserts them).
const SMOKE_SITE_URL = { SITE_URL: "https://example.invalid" };

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? [["list"], ["github"]] : [["list"]],
  timeout: 60_000,
  use: {
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "static",
      testMatch: /smoke-(static|interactions)\.spec\.ts/,
      use: { baseURL: `http://127.0.0.1:${NO_DB_PORT}` },
    },
    {
      name: "degraded",
      testMatch: /smoke-degraded\.spec\.ts/,
      use: { baseURL: `http://127.0.0.1:${NO_DB_PORT}` },
    },
    {
      name: "live",
      testMatch: /smoke-live\.spec\.ts/,
      use: { baseURL: `http://127.0.0.1:${LIVE_PORT}` },
      // The FIRST uncached /timeline render pays its DB roundtrips at WAN
      // latency (local machine → Supabase EU) and has taken >60s on slow
      // evenings; the rendered result is then cached and instant. Prod pays
      // the same roundtrips intra-region. This suite asserts correctness,
      // not a latency budget — give the first render room.
      timeout: 180_000,
    },
  ],
  webServer: [
    {
      command: `npm run start -- -p ${NO_DB_PORT}`,
      url: `http://127.0.0.1:${NO_DB_PORT}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 90_000,
      env: {
        PREVIEW_GATE: "off",
        DATABASE_URL: NO_DB_URL,
        RUNTIME_DATABASE_URL: NO_DB_URL,
        ...SENTRY_OFF,
        ...SMOKE_SITE_URL,
      },
    },
    {
      command: `npm run start -- -p ${LIVE_PORT}`,
      url: `http://127.0.0.1:${LIVE_PORT}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 90_000,
      env: {
        PREVIEW_GATE: "off",
        ...SENTRY_OFF,
        ...SMOKE_SITE_URL,
        // Locally .env.local supplies DATABASE_URL (never override it —
        // explicit process env beats .env files in Next). In CI there is no
        // .env.local and no secret yet; the live server is unused there but
        // must still boot for the webServer readiness check, so give it the
        // unreachable DSN instead of an undefined env.
        ...(process.env.CI && !process.env.DATABASE_URL
          ? { DATABASE_URL: NO_DB_URL }
          : {}),
      },
    },
  ],
});
