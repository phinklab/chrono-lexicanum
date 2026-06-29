/**
 * seed-resolver-extensions.ts — CLI shim (Brief 170).
 *
 * The seeding LOGIC moved to `scripts/seed-prolog.ts` (`seedResolverExtensions`)
 * so `apply:book` / `/add-book` can run the same non-destructive reference seed
 * in-process without a full `db:sync`. This file stays the CLI entrypoint —
 * `npm run db:seed-resolver-extensions` (and `run-phase4-apply.sh`) invoke it and
 * get the IDENTICAL console output + exit semantics as before.
 *
 * Inserts the factions / sectors / locations / characters from
 * scripts/seed-data/*.json. Order respects FK dependencies. Idempotent.
 *
 * CLI: npm run db:seed-resolver-extensions
 */
import { seedResolverExtensions } from "./seed-prolog";

seedResolverExtensions()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed-resolver-extensions] failed:", err);
    process.exit(1);
  });
