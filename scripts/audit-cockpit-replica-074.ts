/**
 * Brief 074 helper — SQL replica of /buecher?audit=drift,gap,ssot,collections
 * pillen-logic. Read-only. Two arg variants:
 *   --range=W40K-0101..W40K-0150   limit to the third-wave 50
 *   --all                          all ssot books
 *
 * Pillen-logic per src/app/buecher/page.tsx:262-306:
 *   drift = any (work_factions|work_locations|work_characters).raw_name IS NOT NULL
 *           AND raw_name != canonical.name
 *   gap   = factions=0 OR locations=0 OR characters=0
 *   ssot  = source_kind='ssot'
 *   collections = (containedIn count from work_collections.content_work_id) >= 2
 */
import { sql } from "drizzle-orm";

import { db } from "../src/db/client";

interface Row {
  external_book_id: string | null;
  slug: string;
  source_kind: string;
  factions: number;
  locations: number;
  characters: number;
  drift_count: number;
  contained_in: number;
}

function parseRange(arg: string | undefined): { from: string; to: string } | null {
  if (!arg) return null;
  const m = arg.match(/^([A-Z0-9-]+)\.\.([A-Z0-9-]+)$/);
  if (!m) return null;
  return { from: m[1], to: m[2] };
}

async function main() {
  const rangeArg = process.argv.find((a) => a.startsWith("--range="))?.slice(8);
  const all = process.argv.includes("--all");
  const range = parseRange(rangeArg);

  let whereClause = sql`w.kind = 'book' AND w.source_kind = 'ssot'`;
  if (range) {
    whereClause = sql`${whereClause} AND w.external_book_id BETWEEN ${range.from} AND ${range.to}`;
  } else if (!all) {
    // default to range W40K-0101..W40K-0150
    whereClause = sql`${whereClause} AND w.external_book_id BETWEEN 'W40K-0101' AND 'W40K-0150'`;
  }

  const result = (await db.execute(sql`
    WITH wf AS (
      SELECT wfj.work_id,
             COUNT(*) AS n,
             COUNT(*) FILTER (WHERE wfj.raw_name IS NOT NULL
                                AND wfj.raw_name <> ''
                                AND wfj.raw_name <> f.name) AS drift
        FROM work_factions wfj
        JOIN factions f ON f.id = wfj.faction_id
       GROUP BY wfj.work_id
    ),
    wl AS (
      SELECT wlj.work_id,
             COUNT(*) AS n,
             COUNT(*) FILTER (WHERE wlj.raw_name IS NOT NULL
                                AND wlj.raw_name <> ''
                                AND wlj.raw_name <> l.name) AS drift
        FROM work_locations wlj
        JOIN locations l ON l.id = wlj.location_id
       GROUP BY wlj.work_id
    ),
    wc AS (
      SELECT wcj.work_id,
             COUNT(*) AS n,
             COUNT(*) FILTER (WHERE wcj.raw_name IS NOT NULL
                                AND wcj.raw_name <> ''
                                AND wcj.raw_name <> c.name) AS drift
        FROM work_characters wcj
        JOIN characters c ON c.id = wcj.character_id
       GROUP BY wcj.work_id
    ),
    ci AS (
      SELECT content_work_id AS work_id, COUNT(*) AS n
        FROM work_collections
       GROUP BY content_work_id
    )
    SELECT w.external_book_id, w.slug, w.source_kind,
           COALESCE(wf.n, 0)::int AS factions,
           COALESCE(wl.n, 0)::int AS locations,
           COALESCE(wc.n, 0)::int AS characters,
           (COALESCE(wf.drift,0) + COALESCE(wl.drift,0) + COALESCE(wc.drift,0))::int AS drift_count,
           COALESCE(ci.n, 0)::int AS contained_in
      FROM works w
      LEFT JOIN wf ON wf.work_id = w.id
      LEFT JOIN wl ON wl.work_id = w.id
      LEFT JOIN wc ON wc.work_id = w.id
      LEFT JOIN ci ON ci.work_id = w.id
     WHERE ${whereClause}
     ORDER BY w.external_book_id NULLS LAST, w.slug
  `)) as unknown as Row[];

  let drift = 0;
  let gap = 0;
  let ssot = 0;
  let collectionsHits = 0;
  let driftAndGap = 0;
  for (const r of result) {
    const isDrift = r.drift_count > 0;
    const isGap = r.factions === 0 || r.locations === 0 || r.characters === 0;
    const isSsot = r.source_kind === "ssot";
    const isMulti = r.contained_in >= 2;
    if (isDrift) drift += 1;
    if (isGap) gap += 1;
    if (isSsot) ssot += 1;
    if (isMulti) collectionsHits += 1;
    if (isDrift && isGap) driftAndGap += 1;
  }

  console.log(JSON.stringify({
    rows: result.length,
    drift,
    gap,
    ssot,
    collections: collectionsHits,
    drift_and_gap: driftAndGap,
  }));

  if (process.argv.includes("--detail")) {
    console.log("\n--- per-book detail ---");
    console.log("ext  slug                                 f  l  c  drift  in");
    for (const r of result) {
      console.log(
        `${(r.external_book_id ?? "-").padEnd(10)}  ${r.slug.padEnd(40, " ")}  ` +
          `${String(r.factions).padStart(2)} ${String(r.locations).padStart(2)} ${String(r.characters).padStart(2)}  ` +
          `${String(r.drift_count).padStart(5)}  ${String(r.contained_in).padStart(2)}`,
      );
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
