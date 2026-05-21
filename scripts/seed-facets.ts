/**
 * seed-facets.ts — stable, non-destructive facet_values upsert for Resolver-Pass
 * Phase 4 (Brief 090; generalized from seed-facets-NNN.ts).
 *
 * A pass that adds a new facet value to facet-catalog.json must land it in the
 * DB `facet_values` table BEFORE re-applying any book tagged with it, because
 * `apply-override.ts:validateFacetIds` checks the DB and hard-throws on unknown
 * ids. `db:seed` is destructive (TRUNCATE works/book_details/facets) and
 * `db:seed-resolver-extensions` does not touch facets — hence this surgical
 * helper: it inserts every facet-catalog value with ON CONFLICT DO NOTHING, so
 * existing rows are untouched and only genuinely-new values land. Idempotent —
 * a second run reports 0 newly inserted. Wave-independent (reads the whole
 * catalog), so no new `-NNN` clone is needed.
 *
 * CLI: tsx --env-file=.env.local scripts/seed-facets.ts
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

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
    `[seed-facets] catalog values: ${rows.length}; newly inserted (ON CONFLICT DO NOTHING): ${inserted.length}`,
  );
  if (inserted.length > 0) {
    console.log(
      `[seed-facets] inserted ids: ${inserted.map((r) => r.id).join(", ")}`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
