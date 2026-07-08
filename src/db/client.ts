/**
 * Drizzle Postgres client.
 *
 * Two patterns to be aware of:
 *  1) DATABASE_URL is the Supabase Transaction pooler URL (port 6543) in both
 *     dev and prod. The free-tier direct hostname is IPv6-only and unreachable
 *     from typical networks; the pooler is IPv4 and serverless-friendly. We
 *     keep `prepare: false` because pgbouncer (transaction mode) does not
 *     support named prepared statements.
 *  2) Locally, the same module is imported many times (HMR). We cache the
 *     postgres client on the global object so we don't open a new socket on
 *     every save.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Did you copy .env.example to .env.local and fill in the Supabase credentials?",
  );
}

declare global {
  var __chronoPg: ReturnType<typeof postgres> | undefined;
}

const client =
  globalThis.__chronoPg ??
  postgres(connectionString, {
    // TLS is on and must never be disabled. Residual risk (LOW):
    // postgres.js maps `ssl: "require"` to `rejectUnauthorized: false`
    // (its connection.js:283) — the link is encrypted but the pooler's
    // certificate is NOT verified, so a MITM able to intercept the connection
    // could present its own cert (postgres.js's own README flags this). We keep
    // "require" over "verify-full" deliberately: full verification needs the
    // pooler cert to chain to a CA in Node's trust store (or the Supabase CA
    // bundled + pinned in the repo), and getting it wrong breaks *all* DB
    // access in prod — a disproportionate risk to take blind, for a LOW-
    // severity gap, on a change that can't be validated here without a live
    // pooler handshake. Enabling verify-full is a sound follow-up once it can
    // be tested against a live connection; the practical blast radius stays
    // small because this is the transaction pooler over TLS, not a plaintext
    // socket.
    ssl: "require",
    // Pool size: 5 stays comfortably below pgbouncer's default_pool_size on
    // the Supabase free-tier pooler (~15). Higher values oversubscribe the
    // pooler when a page fans out many aggregates at once, which queues
    // queries inside pgbouncer until they hit statement_timeout and the
    // cancelled state poisons the next request. Do NOT raise this to "fix"
    // contention — that only moves the queue into the shared backend pool and
    // enlarges the blast radius. The real fix is caching reads so the DB is
    // barely touched (see `src/lib/db-cache.ts`); this stays at 5 as the floor.
    max: 5,
    // Recycle idle / half-broken sockets instead of handing a poisoned one to
    // the next request — the connection-level half of the poison-cascade fix.
    // Short idle suits serverless: warm reuse during a burst, clean teardown
    // when quiet.
    idle_timeout: 20,
    // Fail fast if the pooler is wedged rather than hanging the caller for the
    // 30s default — a stuck connect was part of how one slow request stalled
    // the whole surface.
    connect_timeout: 10,
    prepare: false, // pg-bouncer (Supabase pooler) does not support named prepared statements
    // Skip the hidden pg_catalog type-introspection round-trip on first use;
    // it can misbehave behind the transaction pooler and is unnecessary with
    // prepare:false. (We do not pass `statement_timeout` here — the 6543
    // transaction pooler rejects it as an unsupported startup parameter; a real
    // per-query timeout would need `SET LOCAL` inside a txn, a future change.)
    fetch_types: false,
  });

if (process.env.NODE_ENV !== "production") globalThis.__chronoPg = client;

export const db = drizzle(client, { schema, logger: process.env.NODE_ENV === "development" });
export type Db = typeof db;
