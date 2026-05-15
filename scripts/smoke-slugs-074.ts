/**
 * Brief 074 helper — smoke-slug junction counts for the impl report.
 *
 * Reads a list of slugs, queries work_factions / work_locations / work_characters
 * counts per slug, plus the contained-in count from work_collections.
 */
import { sql } from "drizzle-orm";

import { db } from "../src/db/client";

const SLUGS = [
  "honourbound",
  "the-infinite-and-the-divine",
  "brutal-kunnin",
  "krieg",
  "archmagos",
  "inquisitor-draco",
  "voidscarred",
  "the-green-tide",
];

interface Row {
  slug: string;
  external_book_id: string | null;
  factions: number;
  locations: number;
  characters: number;
  collection_membership: number;
}

async function main() {
  const result = (await db.execute(sql`
    SELECT w.slug, w.external_book_id,
           COALESCE((SELECT COUNT(*) FROM work_factions WHERE work_id = w.id), 0)::int AS factions,
           COALESCE((SELECT COUNT(*) FROM work_locations WHERE work_id = w.id), 0)::int AS locations,
           COALESCE((SELECT COUNT(*) FROM work_characters WHERE work_id = w.id), 0)::int AS characters,
           COALESCE((SELECT COUNT(*) FROM work_collections WHERE content_work_id = w.id OR collection_work_id = w.id), 0)::int AS collection_membership
      FROM works w
     WHERE w.slug IN (${sql.join(SLUGS.map(s => sql`${s}`), sql`, `)})
     ORDER BY array_position(ARRAY[${sql.join(SLUGS.map(s => sql`${s}`), sql`, `)}]::text[], w.slug)
  `)) as unknown as Row[];

  console.log("slug                          ext         f   l   c   in-coll");
  for (const r of result) {
    console.log(
      `${r.slug.padEnd(30, " ")}${(r.external_book_id ?? "-").padEnd(12, " ")}${String(r.factions).padStart(3)} ${String(r.locations).padStart(3)} ${String(r.characters).padStart(3)} ${String(r.collection_membership).padStart(7)}`,
    );
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
