/**
 * Sentry tunnel (Launch S5, E6). Browser error envelopes POST here
 * (same-origin — `connect-src 'self'` in the S3b CSP stays untouched, and ad
 * blockers that kill *.sentry.io requests don't see this hop) and are relayed
 * server-side to the configured DSN's ingest endpoint.
 *
 * NOT an open relay: the envelope header must name exactly the DSN this
 * deployment is configured with — anything else is rejected. Body size is
 * capped; error-only events are single-digit KB, so 200 KB is generous
 * headroom without letting the route buffer megabytes.
 *
 * Excluded from the preview-gate proxy matcher: an error on the pre-auth
 * /login surface must still report; the gate's 307 would silently eat the
 * beacon.
 */
import { envelopeUrl, parseSentryDsn } from "@/lib/observability/sentry-dsn";

const MAX_ENVELOPE_BYTES = 200_000;

export async function POST(req: Request): Promise<Response> {
  const dsn = parseSentryDsn(process.env.NEXT_PUBLIC_SENTRY_DSN);
  if (!dsn) return new Response(null, { status: 404 }); // tracker disabled

  const body = await req.text();
  if (body.length === 0 || body.length > MAX_ENVELOPE_BYTES) {
    return new Response(null, { status: 413 });
  }

  // First envelope line = header JSON; its `dsn` must be OUR dsn.
  let headerDsn: string | undefined;
  try {
    const firstLine = body.slice(0, body.indexOf("\n"));
    headerDsn = (JSON.parse(firstLine) as { dsn?: string }).dsn;
  } catch {
    return new Response(null, { status: 400 });
  }
  const claimed = parseSentryDsn(headerDsn);
  if (
    !claimed ||
    claimed.ingestOrigin !== dsn.ingestOrigin ||
    claimed.projectId !== dsn.projectId ||
    claimed.publicKey !== dsn.publicKey
  ) {
    return new Response(null, { status: 403 });
  }

  try {
    const upstream = await fetch(envelopeUrl(dsn), {
      method: "POST",
      headers: { "content-type": "application/x-sentry-envelope" },
      body,
      signal: AbortSignal.timeout(5000),
    });
    return new Response(null, { status: upstream.status });
  } catch {
    // Ingest unreachable — the beacon is lost, the visitor must not notice.
    return new Response(null, { status: 502 });
  }
}
