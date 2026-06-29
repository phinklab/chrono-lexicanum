/**
 * seed-facets.ts — CLI shim (Brief 170).
 *
 * The upsert LOGIC moved to `scripts/seed-prolog.ts` (`seedFacets`) so
 * `apply:book` / `/add-book` can run the same non-destructive facet seed
 * in-process. This file stays the CLI entrypoint: `run-phase4-apply.sh` invokes
 * `npx tsx --env-file=.env.local scripts/seed-facets.ts` and greps the
 * `[seed-facets]` lines — both preserved.
 *
 * Inserts every facet-catalog value with ON CONFLICT DO NOTHING. Idempotent.
 *
 * CLI: tsx --env-file=.env.local scripts/seed-facets.ts
 */
import { seedFacets } from "./seed-prolog";

seedFacets()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
