/**
 * Browser-side Sentry init (Launch S5, E6) — the official @sentry/browser
 * SDK, error-only. Next loads this file on every page before hydration
 * (instrumentation-client convention), so unhandled exceptions and promise
 * rejections are captured from the first paint; the error boundaries
 * (error.tsx / global-error.tsx) add the React-render errors explicitly.
 *
 * E6 contract: NO tracing, NO replay, NO PII. Events leave the browser only
 * through the same-origin `/monitoring` tunnel (CSP `connect-src 'self'`
 * stays intact; Sentry never sees a visitor IP — the relay's egress IP is
 * all it gets). DSN unset ⇒ init never runs and every capture call is a
 * no-op.
 */
import * as Sentry from "@sentry/browser";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tunnel: "/monitoring",
    environment: process.env.NODE_ENV,
    // Errors only: full sample on errors, tracing hard-off (also the
    // @sentry/browser default — stated here so the E6 contract is explicit).
    sampleRate: 1,
    tracesSampleRate: 0,
  });
}
