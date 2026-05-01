/**
 * Programmatic Drizzle migrator.
 *
 * Two callers:
 *   - `npm run db:migrate` locally (tsx --env-file=.env.local)
 *   - `vercel-build` on Vercel (DATABASE_URL injected by the platform)
 *
 * Mirrors the runtime client (src/db/client.ts) for connection options:
 * Supabase pooler => ssl required, prepare:false. We use max:1 because this
 * script is a short one-shot, not a long-lived pool.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[migrate] DATABASE_URL is not set");
    process.exit(1);
  }

  const started = Date.now();
  console.log("[migrate] starting…");

  const client = postgres(url, {
    ssl: "require",
    prepare: false,
    max: 1,
  });

  try {
    await migrate(drizzle(client), { migrationsFolder: "./src/db/migrations" });
    console.log(`[migrate] done in ${Date.now() - started}ms`);
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
