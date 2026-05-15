/**
 * Brief 074 helper — snapshot global junction + reference counts.
 *
 * Run before + after each apply step; output is what fills the impl-report
 * counts-table. Read-only.
 *
 * Optional --label=<text> arg gets embedded in the output header so multiple
 * snapshots from the same run can be diffed.
 */
import { count } from "drizzle-orm";

import { db } from "../src/db/client";
import {
  characters,
  factions,
  locations,
  works,
  workCharacters,
  workCollections,
  workFactions,
  workLocations,
} from "../src/db/schema";

async function countOf(
  table: typeof factions | typeof locations | typeof characters |
         typeof works | typeof workFactions | typeof workLocations |
         typeof workCharacters | typeof workCollections,
): Promise<number> {
  const result = (await db.select({ value: count() }).from(table as never)) as Array<{ value: number }>;
  return Number(result[0]?.value ?? 0);
}

async function main() {
  const label = process.argv.find((a) => a.startsWith("--label="))?.slice(8) ?? "snapshot";
  const [f, l, c, w, wf, wl, wc, wcoll] = await Promise.all([
    countOf(factions),
    countOf(locations),
    countOf(characters),
    countOf(works),
    countOf(workFactions),
    countOf(workLocations),
    countOf(workCharacters),
    countOf(workCollections),
  ]);
  console.log(JSON.stringify({
    label,
    factions: f,
    locations: l,
    characters: c,
    works: w,
    work_factions: wf,
    work_locations: wl,
    work_characters: wc,
    work_collections: wcoll,
  }));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
