/**
 * Server-side error reporting to Sentry (Launch S5, E6) — deliberately
 * WITHOUT the @sentry/nextjs framework SDK.
 *
 * Why not the SDK on the server: it wraps next.config, injects OpenTelemetry
 * into every server chunk and has an open fatal-crash report on Next-16
 * Turbopack production builds (duplicated @opentelemetry/api copies recursing
 * — getsentry/sentry-javascript#19367, closed unfixed). Error-only telemetry
 * needs none of that machinery: `instrumentation.ts#onRequestError` already
 * hands us every server-side error (RSC render, route handlers, actions,
 * middleware), and the Sentry envelope ingest is a stable three-line JSON
 * protocol. The browser half DOES use the official @sentry/browser SDK
 * (instrumentation-client.ts) — global handlers there are genuinely hard to
 * hand-roll. Revisit the framework SDK post-launch if server symbolication
 * ever matters more than build-chain risk.
 *
 * PII discipline (E6): no request headers, no cookies, no IPs — the event
 * carries the error, the route, the digest and coarse runtime tags only.
 * Fail-quiet: reporting must never throw into the request path.
 */
import { envelopeUrl, parseSentryDsn } from "./sentry-dsn";

interface ErrorRequest {
  path: string;
  method: string;
}

interface ErrorContext {
  routerKind: string;
  routePath: string;
  routeType: string;
}

/** V8 `at fn (file:line:col)` lines → Sentry stack frames (oldest first). */
function stackFrames(
  stack: string | undefined,
): { frames: Array<Record<string, unknown>> } | undefined {
  if (!stack) return undefined;
  const frames: Array<Record<string, unknown>> = [];
  for (const line of stack.split("\n")) {
    const m = /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?\s*$/.exec(line);
    if (!m) continue;
    frames.push({
      function: m[1] ?? "<anonymous>",
      filename: m[2],
      lineno: Number(m[3]),
      colno: Number(m[4]),
      in_app: !m[2].includes("node_modules"),
    });
  }
  if (frames.length === 0) return undefined;
  return { frames: frames.reverse() };
}

export async function reportServerError(
  err: unknown,
  request: ErrorRequest,
  context: ErrorContext,
): Promise<void> {
  const dsn = parseSentryDsn(process.env.NEXT_PUBLIC_SENTRY_DSN);
  if (!dsn) return;

  try {
    const error =
      err instanceof Error ? err : new Error(`non-Error thrown: ${String(err)}`);
    const digest = (err as { digest?: string } | null)?.digest;
    const eventId = crypto.randomUUID().replace(/-/g, "");
    const sentAt = new Date().toISOString();

    const event = {
      event_id: eventId,
      timestamp: sentAt,
      platform: "node",
      level: "error",
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      ...(process.env.VERCEL_GIT_COMMIT_SHA
        ? { release: process.env.VERCEL_GIT_COMMIT_SHA }
        : {}),
      exception: {
        values: [
          {
            type: error.name,
            value: error.message,
            ...(stackFrames(error.stack)
              ? { stacktrace: stackFrames(error.stack) }
              : {}),
          },
        ],
      },
      tags: {
        side: "server",
        runtime: process.env.NEXT_RUNTIME ?? "nodejs",
        routerKind: context.routerKind,
        routeType: context.routeType,
        // The digest also renders on the user-facing error page ("REF · …"),
        // so a screenshot from a visitor can be matched to this event.
        ...(digest ? { digest } : {}),
      },
      request: { url: request.path, method: request.method },
    };

    // The `dsn` in the envelope header IS the authentication — without it
    // (or an X-Sentry-Auth header) the ingest rejects the POST. Same
    // mechanism the browser SDK relies on when tunneling (verified the hard
    // way in the S5 session: the header-less variant silently 4xx'd).
    const envelope =
      `${JSON.stringify({
        event_id: eventId,
        sent_at: sentAt,
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      })}\n` +
      `${JSON.stringify({ type: "event" })}\n` +
      `${JSON.stringify(event)}\n`;

    await fetch(envelopeUrl(dsn), {
      method: "POST",
      headers: { "content-type": "application/x-sentry-envelope" },
      body: envelope,
      signal: AbortSignal.timeout(3000),
    });
  } catch (reportErr) {
    // Never let telemetry take down the request path; the original error is
    // still in the Vercel function logs.
    console.error("[sentry-server] failed to report error:", reportErr);
  }
}
