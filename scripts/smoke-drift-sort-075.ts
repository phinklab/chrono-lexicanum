/**
 * Brief 075 Track A smoke — replicates the sortBooks drift-branch
 * (driftCount desc, confidence desc, updatedAt desc, externalBookId asc)
 * against the current DB so the impl report can quote the expected
 * /buecher?audit=drift ordering.
 *
 * Read-only. Usage:
 *   npx tsx --env-file=.env.local scripts/smoke-drift-sort-075.ts            # top 10 drift books
 *   npx tsx --env-file=.env.local scripts/smoke-drift-sort-075.ts --limit=20
 */
import { sql } from "drizzle-orm";

import { db } from "../src/db/client";

interface Row {
  external_book_id: string | null;
  slug: string;
  title: string;
  confidence: string | null;
  updated_at: string;
  drift_count: number;
  factions: number;
  locations: number;
  characters: number;
}

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="))?.slice(8);
  const limit = limitArg ? Number(limitArg) : 10;
  if (!Number.isFinite(limit) || limit <= 0) {
    console.error("--limit must be a positive integer");
    process.exit(1);
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
    )
    SELECT w.external_book_id,
           w.slug,
           w.title,
           w.confidence::text AS confidence,
           w.updated_at::text AS updated_at,
           (COALESCE(wf.drift, 0) + COALESCE(wl.drift, 0) + COALESCE(wc.drift, 0))::int
             AS drift_count,
           COALESCE(wf.n, 0)::int AS factions,
           COALESCE(wl.n, 0)::int AS locations,
           COALESCE(wc.n, 0)::int AS characters
      FROM works w
      LEFT JOIN wf ON wf.work_id = w.id
      LEFT JOIN wl ON wl.work_id = w.id
      LEFT JOIN wc ON wc.work_id = w.id
     WHERE w.kind = 'book'
       AND w.source_kind = 'ssot'
       AND (COALESCE(wf.drift, 0) + COALESCE(wl.drift, 0) + COALESCE(wc.drift, 0)) > 0
     ORDER BY drift_count DESC,
              (w.confidence)::numeric DESC NULLS LAST,
              w.updated_at DESC,
              w.external_book_id ASC NULLS LAST
     LIMIT ${limit}
  `)) as unknown as Row[];

  console.log("=== /buecher?audit=drift sort smoke (top " + String(limit) + ") ===");
  console.log(
    [
      "rank".padStart(4),
      "external".padEnd(10),
      "drift".padStart(5),
      "conf".padStart(4),
      "f/l/c".padEnd(8),
      "updated".padEnd(10),
      "title",
    ].join("  "),
  );
  result.forEach((r, i) => {
    const conf = r.confidence ?? "null";
    const flc = `${r.factions}/${r.locations}/${r.characters}`;
    const date = r.updated_at.slice(0, 10);
    console.log(
      [
        String(i + 1).padStart(4),
        (r.external_book_id ?? "-").padEnd(10),
        String(r.drift_count).padStart(5),
        conf.padStart(4),
        flc.padEnd(8),
        date.padEnd(10),
        r.title,
      ].join("  "),
    );
  });
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
