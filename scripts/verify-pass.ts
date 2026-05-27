/**
 * verify-pass.ts — stable, config-driven post-apply verification digest for
 * Resolver-Pass Phase 4 (Brief 090; generalized from verify-NNN.ts).
 *
 * Read-only. Emits a FIXED-SIZE digest the Phase-4 subsession reads instead of
 * raw per-batch output (Brief 090 Baustein 4): smoke-slug junction counts for
 * the config's `verify.smokeSlugs`, rating coverage for `verify.ratingRange`,
 * and the audit-cockpit drift/gap/collection replica for `verify.oldRange` +
 * `verify.newRange`. Pass-specific one-off checks (a particular facet, a single
 * book's faction set, an author backfill) are NOT baked in — the phase runs
 * those as ad-hoc SQL if needed (resolver-pass-runbook §7). Digest size is
 * corpus-independent, so no new `-NNN` clone is needed.
 *
 * CLI: tsx --env-file=.env.local scripts/verify-pass.ts [--config scripts/resolver-pass.config.json]
 */
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

import { loadConfig } from "./resolver-pass-config";

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

/** SQL string literal with single-quote escaping (config values are trusted, but be safe). */
function lit(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

async function main(): Promise<void> {
  const cfg = loadConfig(process.argv);
  const { verify, pass, wave, aggregator } = cfg;

  console.log(`# verify-pass digest — ${pass}${wave ? ` (${wave})` : ""}`);

  // Per-wave resolver-pass section — runs only when the config carries a
  // verify block. The Consolidation-Pass configs intentionally omit `verify`
  // (no wave-specific smoke slugs / rating-range / old-vs-new ranges); for
  // those configs only the Out-of-Range-Digest below is emitted.
  if (verify) {
    const slugList = verify.smokeSlugs.map(lit).join(", ");
    await run(
      "smoke slugs (factions / locations / characters / in_collection)",
      `SELECT w.external_book_id, w.slug,
         (SELECT count(*)::int FROM work_factions x WHERE x.work_id=w.id) AS f,
         (SELECT count(*)::int FROM work_locations x WHERE x.work_id=w.id) AS l,
         (SELECT count(*)::int FROM work_characters x WHERE x.work_id=w.id) AS c,
         (SELECT count(*)::int FROM work_collections x WHERE x.content_work_id=w.id) AS in_coll
       FROM works w
       WHERE w.slug IN (${slugList})
       ORDER BY w.external_book_id`,
    );

    await run(
      `rating coverage ${verify.ratingRange.from}..${verify.ratingRange.to} by source`,
      `SELECT bd.rating_source, count(*)::int AS n
       FROM works w JOIN book_details bd ON bd.work_id=w.id
       WHERE w.external_book_id >= ${lit(verify.ratingRange.from)} AND w.external_book_id <= ${lit(verify.ratingRange.to)}
         AND bd.rating IS NOT NULL
       GROUP BY bd.rating_source ORDER BY n DESC`,
    );
    await run(
      `rating coverage ${verify.ratingRange.from}..${verify.ratingRange.to} rated/null/total`,
      `SELECT count(*) FILTER (WHERE bd.rating IS NOT NULL)::int AS rated,
              count(*) FILTER (WHERE bd.rating IS NULL)::int AS null_rating,
              count(*)::int AS total
       FROM works w JOIN book_details bd ON bd.work_id=w.id
       WHERE w.external_book_id >= ${lit(verify.ratingRange.from)} AND w.external_book_id <= ${lit(verify.ratingRange.to)}`,
    );

    for (const [label, lo, hi] of [
      [`audit replica OLD range ${verify.oldRange.from}..${verify.oldRange.to}`, verify.oldRange.from, verify.oldRange.to],
      [`audit replica NEW range ${verify.newRange.from}..${verify.newRange.to}`, verify.newRange.from, verify.newRange.to],
    ] as const) {
      await run(
        label,
        `WITH rng AS (
           SELECT id FROM works WHERE external_book_id >= ${lit(lo)} AND external_book_id <= ${lit(hi)}
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
  }

  // Brief 102 Out-of-Range-Digest — Cross-Domain-Boundary Tripwire. Counts
  // work_collections rows whose constituent (content_work_id) falls OUTSIDE
  // the union of aggregator.applyRanges. At Full-Corpus the union covers
  // every ingested book and expectation = 0; a non-zero count surfaces a
  // constituent that crossed the apply-range boundary (e.g. a W40K collection
  // referencing an un-applied HH novella in a partial-corpus pass).
  const ranges = aggregator.applyRanges ?? [];
  if (ranges.length > 0) {
    const domainPrefixes = Array.from(
      new Set(ranges.map((r) => (r.domain === "w40k" ? "W40K-" : "HH-"))),
    );
    const prefixList = domainPrefixes.map((p) => lit(`${p}%`)).join(", ");
    await run(
      `Out-of-Range constituent edges (Brief 102 Cross-Domain-Boundary Tripwire, expectation 0; applyRanges domains: ${domainPrefixes.join(", ")})`,
      `SELECT count(*)::int AS out_of_range_count
       FROM work_collections wc
       JOIN works cont ON cont.id = wc.content_work_id
       WHERE NOT (cont.external_book_id LIKE ANY (ARRAY[${prefixList}]))`,
    );
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("[verify-pass] failed:", err);
  process.exit(1);
});
