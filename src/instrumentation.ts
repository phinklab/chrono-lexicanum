/**
 * Next instrumentation hook (Launch S5, E6). `onRequestError` is Next's
 * canonical server-error stream — RSC renders, route handlers, server
 * actions and middleware, in both the nodejs and edge runtime. Everything
 * substantive lives in `src/lib/observability/sentry-server.ts` (lazy import
 * keeps the module graph of every request path free of reporting code until
 * the first error actually happens).
 */
import type { Instrumentation } from "next";

export function register(): void {
  // No boot-time setup: the server reporter is stateless and the browser SDK
  // initializes from instrumentation-client.ts.
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  const { reportServerError } = await import(
    "./lib/observability/sentry-server"
  );
  await reportServerError(err, request, context);
};
