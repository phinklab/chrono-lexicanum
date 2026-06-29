/**
 * apply-override.ts — RETIRED (Brief 171 Teil B). The legacy batch applier.
 *
 * From Brief 060 to Brief 170 this was the `db:apply-override -- --batch=ssot-…`
 * writer: it read a `manual-overrides-ssot-*.json` batch + `book-roster.json` and
 * wrote each book into Postgres. Brief 171 migrated the WHOLE corpus into per-book
 * SSOT files (`scripts/seed-data/books/*.json`) and PROVED `apply(legacy) ==
 * apply(per-book)` via the empty equivalence diff (`npm run equiv:diff`). The batch
 * world is now frozen provenance, so this live batch-apply path is neutralized.
 *
 * Where everything went:
 *   - the shared writer            → scripts/book-apply-shared.ts (UNCHANGED, still
 *                                    the one apply path; `apply:book` uses it).
 *   - the Legacy projection +      → scripts/legacy-corpus-projection.ts
 *     `SERIES_BY_EXTERNAL_ID`        (migration source + equivalence golden).
 *   - the batch files (all 90)     → kept on disk, frozen provenance + golden.
 *
 * To apply the corpus now: `npm run apply:book -- --all` (or `--slug <slug>`).
 * The batch files stay readable for provenance; nothing writes them as a source.
 */
function main(): never {
  console.error(
    [
      "[apply-override] RETIRED (Brief 171). The legacy batch apply path is gone.",
      "",
      "  The corpus now lives ONLY in scripts/seed-data/books/*.json.",
      "  Apply it with:   npm run apply:book -- --all",
      "                   npm run apply:book -- --slug <slug>",
      "",
      "  Equivalence (apply(legacy) == apply(per-book)) is proven DB-free via:",
      "                   npm run equiv:diff",
      "",
      "  The 90 manual-overrides-ssot-*.json batch files + book-roster.json remain",
      "  on disk as frozen provenance; the Legacy projection lives in",
      "  scripts/legacy-corpus-projection.ts (migration + equivalence only).",
    ].join("\n"),
  );
  process.exit(1);
}

main();
