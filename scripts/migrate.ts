/**
 * Programmatic Drizzle migrator.
 *
 * Two callers (decoupled from the Vercel build — Report 144 § B.1):
 *   - `npm run db:migrate` locally (tsx --env-file=.env.local, DATABASE_URL)
 *   - the `migrate` GitHub Actions workflow: the manual production job passes
 *     the MIGRATION_DATABASE_URL environment secret; the rehearsal job passes
 *     a throwaway service-container URL (Launch S3a).
 *
 * Credential order: MIGRATION_DATABASE_URL wins over DATABASE_URL, so the
 * workflow secret can carry its true name while local usage stays unchanged.
 *
 * SSL policy lives in scripts/pg-ssl.ts: always `ssl: "require"`; the ONLY
 * opt-out is `sslmode=disable` on a loopback host — the CI rehearsal container
 * speaks no TLS. Supabase stays TLS-required; `verify-full` remains the
 * deliberately deferred follow-up documented in src/db/client.ts.
 *
 * The applied-migration count is logged before/after because the CI rehearsal
 * asserts idempotence on it: the second run against the same database must
 * print "applied 0 migration(s)".
 *
 * `prepare: false` mirrors the runtime client (pgbouncer transaction mode);
 * max:1 because this is a short one-shot, not a long-lived pool.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { sslOptionForUrl } from "./pg-ssl";

async function appliedCount(client: ReturnType<typeof postgres>): Promise<number> {
  // Fresh database: drizzle's journal table does not exist before the first run.
  const reg = await client`SELECT to_regclass('drizzle.__drizzle_migrations') AS t`;
  if ((reg[0] as { t: string | null }).t === null) return 0;
  const rows = await client`SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations`;
  return (rows[0] as { n: number }).n;
}

async function main() {
  const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    console.error("[migrate] neither MIGRATION_DATABASE_URL nor DATABASE_URL is set");
    process.exit(1);
  }
  console.log(
    `[migrate] credential: ${process.env.MIGRATION_DATABASE_URL ? "MIGRATION_DATABASE_URL" : "DATABASE_URL"}`,
  );

  const started = Date.now();
  console.log("[migrate] starting…");

  const client = postgres(url, {
    ssl: sslOptionForUrl(url),
    prepare: false,
    max: 1,
  });

  try {
    const before = await appliedCount(client);
    await migrate(drizzle(client), { migrationsFolder: "./src/db/migrations" });
    const after = await appliedCount(client);
    console.log(
      `[migrate] applied ${after - before} migration(s) (${after} total) in ${Date.now() - started}ms`,
    );
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error("[migrate] failed:", err);
    await client.end({ timeout: 5 }).catch(() => {});
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[migrate] unexpected error:", err);
  process.exit(1);
});
