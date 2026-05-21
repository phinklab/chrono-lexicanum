/**
 * db-counts.ts — stable DB-counts probe for Resolver-Pass Phase 4 (Brief 090;
 * generalized from the per-pass db-counts-NNN.ts clones).
 *
 * Reports junction + reference + works counts as a fixed-size table. Used
 * pre/per-batch/post by run-phase4-apply.sh to build the Counts digest. Wave-
 * independent (the same tables every pass), so no new `-NNN` clone is needed.
 * Read-only.
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
  console.log("[db-counts] start");
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
  console.log("[db-counts] done");
  process.exit(0);
}

main().catch((err) => {
  console.error("[db-counts] failed:", err);
  process.exit(1);
});
