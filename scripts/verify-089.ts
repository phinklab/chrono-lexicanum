/**
 * Post-apply verification probe for Brief 089 Phase 4 (Resolver-Pass 5).
 *
 * Read-only. Produces the numbers the impl-report needs: smoke-slug junction
 * counts, rating coverage for 021..025, the Call-2 commissar facet on
 * W40K-0237/0247, the Call-3 author rows (W40K-0206/0244), the W40K-0244 Night
 * Lords check, an audit-cockpit drift/gap/collection replica per range, and a
 * work_collections spotcheck for one omnibus.
 */
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

async function run(label: string, query: string): Promise<void> {
  const result = (await db.execute(sql.raw(query))) as unknown as Record<
    string,
    unknown
  >[];
  console.log(`\n== ${label} ==`);
  for (const row of result) {
    console.log("  " + JSON.stringify(row));
  }
  if (result.length === 0) console.log("  (no rows)");
}

async function main(): Promise<void> {
  await run(
    "smoke slugs (f/l/c + in_coll)",
    `SELECT w.external_book_id, w.slug,
       (SELECT count(*)::int FROM work_factions x WHERE x.work_id=w.id) AS f,
       (SELECT count(*)::int FROM work_locations x WHERE x.work_id=w.id) AS l,
       (SELECT count(*)::int FROM work_characters x WHERE x.work_id=w.id) AS c,
       (SELECT count(*)::int FROM work_collections x WHERE x.content_work_id=w.id) AS in_coll
     FROM works w
     WHERE w.slug IN ('the-anarch','inquisitor-draco','the-green-tide','blind','grey-knights','gunheads','commissar','baneblade','the-remnant-blade','warrior-brood')
     ORDER BY w.external_book_id`,
  );

  await run(
    "rating coverage 021..025 by source",
    `SELECT bd.rating_source, count(*)::int AS n
     FROM works w JOIN book_details bd ON bd.work_id=w.id
     WHERE w.external_book_id >= 'W40K-0201' AND w.external_book_id <= 'W40K-0250'
       AND bd.rating IS NOT NULL
     GROUP BY bd.rating_source ORDER BY n DESC`,
  );
  await run(
    "rating coverage 021..025 rated/null/total",
    `SELECT count(*) FILTER (WHERE bd.rating IS NOT NULL)::int AS rated,
            count(*) FILTER (WHERE bd.rating IS NULL)::int AS null_rating,
            count(*)::int AS total
     FROM works w JOIN book_details bd ON bd.work_id=w.id
     WHERE w.external_book_id >= 'W40K-0201' AND w.external_book_id <= 'W40K-0250'`,
  );
  await run(
    "W40K-0205 (expected unrated marker) book_details",
    `SELECT w.external_book_id, bd.rating, bd.rating_source, bd.rating_count
     FROM works w JOIN book_details bd ON bd.work_id=w.id
     WHERE w.external_book_id = 'W40K-0205'`,
  );

  await run(
    "Call 2 — works carrying the commissar facet",
    `SELECT w.external_book_id, w.slug
     FROM work_facets wf JOIN works w ON w.id=wf.work_id
     WHERE wf.facet_value_id='commissar' ORDER BY w.external_book_id`,
  );
  await run(
    "Call 2 — W40K-0237 protagonist_class facets (inquisitor must be gone)",
    `SELECT wf.facet_value_id
     FROM work_facets wf JOIN works w ON w.id=wf.work_id
     WHERE w.external_book_id='W40K-0237'
       AND wf.facet_value_id IN ('commissar','inquisitor','guardsman') ORDER BY 1`,
  );

  await run(
    "Call 3 — author rows for W40K-0206 / W40K-0244",
    `SELECT w.external_book_id, p.name, wp.role
     FROM work_persons wp JOIN works w ON w.id=wp.work_id JOIN persons p ON p.id=wp.person_id
     WHERE w.external_book_id IN ('W40K-0206','W40K-0244') AND wp.role='author'
     ORDER BY w.external_book_id`,
  );

  await run(
    "W40K-0244 The Remnant Blade — faction junctions (Night Lords, not Imperial Guard)",
    `SELECT f.id, wf.raw_name, wf.role
     FROM work_factions wf JOIN works w ON w.id=wf.work_id JOIN factions f ON f.id=wf.faction_id
     WHERE w.external_book_id='W40K-0244' ORDER BY wf.role`,
  );

  for (const [label, lo, hi] of [
    ["audit replica OLD range 0001..0150", "W40K-0001", "W40K-0150"],
    ["audit replica NEW range 0151..0250", "W40K-0151", "W40K-0250"],
  ] as const) {
    await run(
      label,
      `WITH rng AS (
         SELECT id FROM works WHERE external_book_id >= '${lo}' AND external_book_id <= '${hi}'
       )
       SELECT
         (SELECT count(*)::int FROM rng) AS total_works,
         (SELECT count(*)::int FROM rng w WHERE
            EXISTS (SELECT 1 FROM work_factions j JOIN factions e ON e.id=j.faction_id
                    WHERE j.work_id=w.id AND j.raw_name IS NOT NULL AND lower(j.raw_name) <> lower(e.name))
         OR EXISTS (SELECT 1 FROM work_locations j JOIN locations e ON e.id=j.location_id
                    WHERE j.work_id=w.id AND j.raw_name IS NOT NULL AND lower(j.raw_name) <> lower(e.name))
         OR EXISTS (SELECT 1 FROM work_characters j JOIN characters e ON e.id=j.character_id
                    WHERE j.work_id=w.id AND j.raw_name IS NOT NULL AND lower(j.raw_name) <> lower(e.name))
         ) AS drift_works,
         (SELECT count(*)::int FROM rng w WHERE
            (SELECT count(*) FROM work_factions x WHERE x.work_id=w.id)=0
         OR (SELECT count(*) FROM work_locations x WHERE x.work_id=w.id)=0
         OR (SELECT count(*) FROM work_characters x WHERE x.work_id=w.id)=0
         ) AS gap_works,
         (SELECT count(DISTINCT x.content_work_id)::int FROM work_collections x
            WHERE x.content_work_id IN (SELECT id FROM rng)) AS content_in_collection`,
    );
  }

  await run(
    "work_collections spotcheck — W40K-0216 Grey Knights Omnibus constituents",
    `SELECT content.external_book_id, content.slug
     FROM work_collections wc
       JOIN works coll ON coll.id=wc.collection_work_id
       JOIN works content ON content.id=wc.content_work_id
     WHERE coll.external_book_id='W40K-0216' ORDER BY content.external_book_id`,
  );

  process.exit(0);
}

main().catch((err) => {
  console.error("[verify-089] failed:", err);
  process.exit(1);
});
