/**
 * One-shot DB-counts probe for Brief 076 Phase 4 (axis-sliced Resolver-Pass 4).
 *
 * Reports junction + reference + works counts. Used pre/per-batch/post for the
 * Phase-4-Counts-Tabelle. Deleted after the impl-report references its output.
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
  console.log("[db-counts-076] start");
  await countQuery("works", "works");
  await countQuery("work_factions", "work_factions");
  await countQuery("work_locations", "work_locations");
  await countQuery("work_characters", "work_characters");
  await countQuery("work_collections", "work_collections");
  await countQuery("factions", "factions");
  await countQuery("locations", "locations");
  await countQuery("characters", "characters");
  await countQuery("sectors", "sectors");
  console.log("[db-counts-076] done");
  process.exit(0);
}

main().catch((err) => {
  console.error("[db-counts-076] failed:", err);
  process.exit(1);
});
