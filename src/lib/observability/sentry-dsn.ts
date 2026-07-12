/**
 * Sentry DSN parsing — shared by the /monitoring tunnel route and the
 * server-side error reporter (Launch S5, E6).
 *
 * Edge-safe by design (plain string handling, no node APIs): the reporter
 * runs from `instrumentation.ts#onRequestError`, which fires in the edge
 * runtime too (proxy errors).
 *
 * One env var drives the whole error-only tracker: `NEXT_PUBLIC_SENTRY_DSN`.
 * The DSN is a public identifier, not a secret (it can only submit events,
 * never read them); the NEXT_PUBLIC_ prefix is required so the browser init
 * (instrumentation-client.ts) gets it inlined at build time, and the server
 * side simply reads the same var. Unset ⇒ every piece of the tracker is
 * silently disabled.
 */

export interface SentryDsn {
  /** e.g. https://o123456.ingest.de.sentry.io */
  ingestOrigin: string;
  projectId: string;
  publicKey: string;
}

/** DSN shape: https://<publicKey>@<ingestHost>/<projectId> */
export function parseSentryDsn(raw: string | undefined): SentryDsn | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const projectId = url.pathname.replace(/\//g, "");
  if (!url.username || !projectId) return null;
  return {
    ingestOrigin: `${url.protocol}//${url.host}`,
    projectId,
    publicKey: url.username,
  };
}

/** The envelope ingest endpoint for a parsed DSN. */
export function envelopeUrl(dsn: SentryDsn): string {
  return `${dsn.ingestOrigin}/api/${dsn.projectId}/envelope/`;
}
