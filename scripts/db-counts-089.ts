/**
 * One-shot DB-counts probe for Brief 089 Phase 4 (Resolver-Pass 5).
 *
 * Reports junction + reference + works counts. Used pre/per-batch/post for the
 * Phase-4-Counts-Tabelle. `work_persons` is included for the Call-3 author
 * backfill check (W40K-0206/0244); `facet_values` for the Call-2 commissar seed.
 */
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

type CountRow = { count: number };

async function countQuery(label: string, table: string): Promise<number> {
  const result = await db.execute<CountRow>(
    sql.raw(`select count(*)::int as count from ${table}`),
  );
  const rows = result as unknown as CountRow[];
  const value = rows[0]?.count ?? 0;
  console.log(`${label.padEnd(20)} ${value}`);
  return value;
}

async function main(): Promise<void> {
  console.log("[db-counts-089] start");
  await countQuery("works", "works");
  await countQuery("work_factions", "work_factions");
  await countQuery("work_locations", "work_locations");
  await countQuery("work_characters", "work_characters");
  await countQuery("work_collections", "work_collections");
  await countQuery("work_persons", "work_persons");
  await countQuery("work_facets", "work_facets");
  await countQuery("factions", "factions");
  await countQuery("locations", "locations");
  await countQuery("characters", "characters");
  await countQuery("facet_values", "facet_values");
  console.log("[db-counts-089] done");
  process.exit(0);
}

main().catch((err) => {
  console.error("[db-counts-089] failed:", err);
  process.exit(1);
});
