/**
 * db-apply-scope.ts — RETIRED (Brief 171 Teil B).
 *
 * Brief 157 built this to DERIVE the batch apply scope from the committed
 * `manual-overrides-ssot-*.json` files and assert gap-free contiguity, feeding the
 * derived config to `run-phase4-apply.sh` inside `db:sync` / `db:rebuild`. Brief
 * 171 migrated the corpus into per-book SSOT files, so there is no batch scope and
 * no contiguity to assert anymore. The db chains now run the DB-free per-book
 * preflight instead:
 *
 *   npm run book:preflight        # scripts/book-corpus-preflight.ts
 *
 * which validates that every scripts/seed-data/books/*.json parses, is slug/id-
 * unique (folder-only), has resolvable collects[], and that the reference/facet
 * seed-prolog catalogs are present. The batch files remain on disk as frozen
 * provenance; nothing derives an apply scope from them.
 */
console.error(
  [
    "[db-apply-scope] RETIRED (Brief 171). No batch apply scope / contiguity anymore.",
    "  The corpus lives in scripts/seed-data/books/*.json.",
    "  Use the per-book preflight instead:  npm run book:preflight",
  ].join("\n"),
);
process.exit(1);
