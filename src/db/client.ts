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
    // Supabase serves Postgres over TLS — never disable.
    ssl: "require",
    // Keep idle connections short on serverless; Postgres-js default is fine.
    max: 10,
    prepare: false, // pg-bouncer (Supabase pooler) does not support named prepared statements
  });

if (process.env.NODE_ENV !== "production") globalThis.__chronoPg = client;

export const db = drizzle(client, { schema, logger: process.env.NODE_ENV === "development" });
export type Db = typeof db;
