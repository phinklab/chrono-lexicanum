/**
 * seed-facets-089.ts — surgical, non-destructive facet_values upsert (Brief 089 Call 2).
 *
 * Brief 089 Call 2 adds one protagonist_class value (`commissar`) to
 * facet-catalog.json. `apply-override.ts:validateFacetIds` checks the DB
 * `facet_values` table and hard-throws on unknown ids, so the new value MUST be
 * in the DB before re-applying any book tagged `commissar` (W40K-0237/0247).
 *
 * Why a dedicated helper: `db:seed` is destructive (TRUNCATE ... RESTART
 * IDENTITY CASCADE on works/book_details/facets — would wipe the applied
 * authority layer), and `db:seed-resolver-extensions` does not touch facets.
 * This helper inserts every facet-catalog value with ON CONFLICT DO NOTHING:
 * existing rows are untouched, only genuinely-new values (commissar) land.
 * Idempotent — safe to re-run; a second run reports 0 newly inserted.
 *
 * CLI: tsx --env-file=.env.local scripts/seed-facets-089.ts
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { facetValues } from "@/db/schema";

const SEED_DIR = resolve(process.cwd(), "scripts", "seed-data");

interface FacetValue {
  id: string;
  name: string;
  description?: string;
  displayOrder?: number;
}
interface FacetCategory {
  id: string;
  values: FacetValue[];
}
interface FacetCatalog {
  categories: FacetCategory[];
}

async function main(): Promise<void> {
  const raw = await readFile(resolve(SEED_DIR, "facet-catalog.json"), "utf8");
  const catalog = JSON.parse(raw) as FacetCatalog;

  const rows = catalog.categories.flatMap((cat) =>
    cat.values.map((v) => ({
      id: v.id,
      categoryId: cat.id,
      name: v.name,
      description: v.description ?? null,
      displayOrder: v.displayOrder ?? 0,
    })),
  );

  const inserted = await db
    .insert(facetValues)
    .values(rows)
    .onConflictDoNothing()
    .returning({ id: facetValues.id });

  console.log(
    `[seed-facets-089] catalog values: ${rows.length}; newly inserted (ON CONFLICT DO NOTHING): ${inserted.length}`,
  );
  if (inserted.length > 0) {
    console.log(
      `[seed-facets-089] inserted ids: ${inserted.map((r) => r.id).join(", ")}`,
    );
  }

  const commissar = await db
    .select({ id: facetValues.id, name: facetValues.name })
    .from(facetValues)
    .where(eq(facetValues.id, "commissar"));
  if (commissar.length === 0) {
    throw new Error(
      "commissar facet value not present after seed — apply-override would hard-throw on W40K-0237/0247",
    );
  }
  console.log(
    `[seed-facets-089] verified facet_values.commissar present: "${commissar[0].name}"`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
