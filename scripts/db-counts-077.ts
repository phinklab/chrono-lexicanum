/**
 * One-shot DB-counts probe for Brief 077 (Grand-Alignment-Junction-Hygiene).
 *
 * Mirrors scripts/db-counts-076.ts but additionally reports the count of
 * work_factions rows whose faction_id is one of the grand-alignment IDs
 * ("imperium", "chaos") — the rows the Brief 077 skip-logic is supposed
 * to drive towards a small residual (only books that genuinely carry
 * grand-alignment-only tags without an alignment-peer sub).
 */
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

type CountRow = { count: number };

async function countQuery(label: string, query: string): Promise<number> {
  const result = await db.execute<CountRow>(sql.raw(query));
  const rows = result as unknown as CountRow[];
  const value = rows[0]?.count ?? 0;
  console.log(`${label.padEnd(36)} ${value}`);
  return value;
}

async function main(): Promise<void> {
  console.log("[db-counts-077] start");
  await countQuery("works", "select count(*)::int as count from works");
  await countQuery("work_factions", "select count(*)::int as count from work_factions");
  await countQuery(
    "work_factions(imperium|chaos)",
    "select count(*)::int as count from work_factions where faction_id in ('imperium','chaos')",
  );
  await countQuery(
    "work_factions(imperium)",
    "select count(*)::int as count from work_factions where faction_id='imperium'",
  );
  await countQuery(
    "work_factions(chaos)",
    "select count(*)::int as count from work_factions where faction_id='chaos'",
  );
  await countQuery("work_locations", "select count(*)::int as count from work_locations");
  await countQuery("work_characters", "select count(*)::int as count from work_characters");
  await countQuery("work_collections", "select count(*)::int as count from work_collections");
  console.log("[db-counts-077] done");
  process.exit(0);
}

main().catch((err) => {
  console.error("[db-counts-077] failed:", err);
  process.exit(1);
});
