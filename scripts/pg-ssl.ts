/**
 * Shared SSL policy for the scripts-side Postgres connections
 * (scripts/migrate.ts, scripts/apply-db-roles.ts, scripts/verify-runtime-role.ts).
 *
 * Default is `ssl: "require"` — Supabase's pooler is TLS-required and nothing
 * production-facing may ever downgrade. The ONLY sanctioned opt-out is the CI
 * migration-rehearsal service container (plain `postgres` image on localhost,
 * which speaks no TLS): a URL that carries `sslmode=disable` AND points at a
 * loopback host resolves to `ssl: false`. `sslmode=disable` against any
 * non-loopback host is a hard error, not a downgrade — a mis-pasted production
 * URL must fail loudly instead of silently connecting unencrypted.
 * (Launch S3a, docs/launch-master-plan.md § Session 3a Punkt 4.)
 */

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function sslOptionForUrl(url: string): "require" | false {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // Deliberately no URL echo — connection strings carry credentials.
    throw new Error(
      "[pg-ssl] connection URL is not parseable (redacted) — cannot determine SSL policy",
    );
  }
  if (parsed.searchParams.get("sslmode") !== "disable") return "require";
  if (!LOOPBACK_HOSTS.has(parsed.hostname)) {
    throw new Error(
      `[pg-ssl] sslmode=disable is only allowed for loopback hosts (the CI rehearsal ` +
        `service container), got host "${parsed.hostname}". Remove sslmode=disable — ` +
        `Supabase connections are always TLS.`,
    );
  }
  return false;
}
