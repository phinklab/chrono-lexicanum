/**
 * apply-override.ts — first active DB-write path of the Brief-058+ pipeline.
 *
 * Brief 060 (2026-05-11): the books in a `ssot-*` batch are written into
 * Postgres using a Cowork-curated override file as authority for the soft
 * fields (synopsis, facetIds, factions, locations, characters, flags), and
 * `book-roster.json` (the SSOT-Excel mirror) as authority for the hard fields
 * (title, releaseYear, format, seriesHint).
 *
 * Brief 170 (2026-06-28): the per-book apply logic — the validators, the notes
 * composition, the per-work writer (`applyBook`), `ensurePersonsExist`, and
 * `applyCollections` — moved VERBATIM into `./book-apply-shared` so the new
 * targeted `apply:book` (per-book SSOT) materializes a book through the SAME
 * code path. This file is now a thin CLI/orchestration shell over that shared
 * core: it loads a batch + roster, projects them into the shared `OverrideBook`
 * / `RosterBook` shapes, and drives the shared writer. Legacy behavior is
 * unchanged — same batches, same DB shape, same per-batch transaction model.
 *
 * What the script does:
 *   1. Loads `manual-overrides-<batch>.json` and `book-roster.json`.
 *   2. Validates facets / roles / synopses / ratings (halt before mutation).
 *   3. Pre-pass `ensurePersonsExist` — INSERTs missing author/editor persons.
 *   4. Per book: `applyBook` in its own transaction (idempotent on
 *      `external_book_id`; delete-then-insert junctions).
 *   5. Second pass: `applyCollections` writes `work_collections`.
 *   6. Final atomic append to scripts/seed-data/persons.json for auto-created.
 *
 * CLI:
 *   npm run db:apply-override -- --batch=ssot-w40k-001
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

import {
  appendAutoCreatedPersons,
  applyBook,
  applyCollections,
  countJunctions,
  ensurePersonsExist,
  loadLocationSkipContext,
  loadRoster,
  loadSkipContext,
  validateEntityRoles,
  validateFacetIds,
  validateRatingOverrides,
  validateSynopses,
  type BookApplyResult,
  type OverrideBook,
  type SeriesAnchor,
  SEED_DIR,
} from "./book-apply-shared";

const OVERRIDE_FILENAME_PREFIX = "manual-overrides-";
const BATCH_NAME_PATTERN = /^ssot-(w40k|hh)-\d{3}$/;

// Eisenhorn/Ravenor are seeded series; Bequin and The Magos have no series row
// and stay NULL until a future brief decides whether to add one.
const SERIES_BY_EXTERNAL_ID: Record<string, SeriesAnchor> = {
  "W40K-0001": { id: "eisenhorn", index: 1 },
  "W40K-0002": { id: "eisenhorn", index: 2 },
  "W40K-0003": { id: "eisenhorn", index: 3 },
  "W40K-0004": { id: "eisenhorn", index: null },
  "W40K-0005": { id: "ravenor", index: 1 },
  "W40K-0006": { id: "ravenor", index: 2 },
  "W40K-0007": { id: "ravenor", index: 3 },
  "W40K-0008": { id: "ravenor", index: null },
};

interface OverrideFile {
  $schema: string;
  batch: string;
  createdBy: string;
  createdAt: string;
  model: string;
  rationale: string;
  books: OverrideBook[];
}

// =============================================================================
// CLI
// =============================================================================

interface ParsedCliArgs {
  batch: string;
  help: boolean;
}

function parseCliArgs(argv: string[]): ParsedCliArgs {
  const { values } = parseArgs({
    args: argv,
    options: {
      batch: { type: "string" },
      help: { type: "boolean", short: "h", default: false },
    },
    strict: true,
    allowPositionals: false,
  });
  return {
    batch: String(values.batch ?? ""),
    help: Boolean(values.help),
  };
}

function printHelp(): void {
  console.log(`
apply-override.ts — write a Cowork-curated override batch into Postgres.

Usage:
  npm run db:apply-override -- --batch=ssot-w40k-001

Options:
  --batch <name>   Override batch name (matches scripts/seed-data/manual-overrides-<name>.json).
                   Must match /^ssot-(w40k|hh)-\\d{3}$/.
  -h, --help       Show this help.

Behaviour:
  - One transaction per book; idempotent on works.external_book_id.
  - Junctions are wiped and re-inserted per book (no diff).
  - Surface forms that do not resolve to reference IDs land in book_details.notes
    between ---surfaceForms--- delimiters for later resolver consumption.
  - work_collections is populated as a second pass after the per-book loop.

  Per-book apply logic is shared with \`apply:book\` (Brief 170) via
  scripts/book-apply-shared.ts.
`);
}

async function loadOverride(batch: string): Promise<OverrideFile> {
  const path = resolve(SEED_DIR, `${OVERRIDE_FILENAME_PREFIX}${batch}.json`);
  const raw = await readFile(path, "utf8");
  const parsed = JSON.parse(raw) as OverrideFile;
  if (parsed.batch !== batch) {
    throw new Error(
      `Override file batch mismatch: expected '${batch}', got '${parsed.batch}'`,
    );
  }
  return parsed;
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = parseCliArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  if (!args.batch) {
    console.error("[apply-override] --batch is required. Use --help for usage.");
    process.exit(2);
  }
  if (!BATCH_NAME_PATTERN.test(args.batch)) {
    console.error(
      `[apply-override] --batch must match ${BATCH_NAME_PATTERN}; got '${args.batch}'`,
    );
    process.exit(2);
  }

  console.log(`[apply-override] batch=${args.batch}`);
  const override = await loadOverride(args.batch);
  const roster = await loadRoster();
  const skipCtx = await loadSkipContext();
  const locationSkipCtx = await loadLocationSkipContext();

  console.log(
    `[apply-override] loaded override: ${override.books.length} books; createdBy=${override.createdBy}`,
  );
  console.log(
    `[apply-override] skip-context: ${skipCtx.redundantIds.size} redundant ids (${[...skipCtx.redundantIds].join(", ")}); ${skipCtx.alignmentById.size} factions in alignment map`,
  );
  console.log(
    `[apply-override] location-skip-context: ${locationSkipCtx.redundantSurfaceForms.size} redundant surface forms (case-insensitive)`,
  );

  const rosterByExternalId = new Map(roster.books.map((b) => [b.externalBookId, b]));
  const allFacetIds = new Set<string>();
  for (const b of override.books) for (const f of b.overrides.facetIds) allFacetIds.add(f);
  await validateFacetIds(allFacetIds);
  console.log(`[apply-override] validated ${allFacetIds.size} distinct facet ids`);
  validateEntityRoles(override.books);
  console.log("[apply-override] validated entity roles after normalization");
  validateSynopses(override.books, args.batch);
  console.log(
    `[apply-override] validated ${override.books.length} synopses (Brief 080 guard)`,
  );
  validateRatingOverrides(override.books);
  console.log("[apply-override] validated optional Goodreads rating overrides");

  const { autoCreated, distinct } = await ensurePersonsExist(
    override.books,
    rosterByExternalId,
  );
  console.log(
    `[apply-override] ensurePersonsExist: ${distinct} distinct slugs in batch, ${autoCreated.length} newly created in DB`,
  );
  if (autoCreated.length > 0) {
    for (const p of autoCreated) {
      console.log(`[apply-override]   + person ${p.id} (${p.name})`);
    }
  }

  const results: BookApplyResult[] = [];
  const externalIdToUuid = new Map<string, string>();

  for (const overrideBook of override.books) {
    const rosterBook = rosterByExternalId.get(overrideBook.externalBookId);
    if (!rosterBook) {
      throw new Error(
        `Override book ${overrideBook.externalBookId} has no matching row in book-roster.json`,
      );
    }
    const series = SERIES_BY_EXTERNAL_ID[overrideBook.externalBookId] ?? null;
    const result = await applyBook(
      overrideBook,
      rosterBook,
      series,
      skipCtx,
      locationSkipCtx,
    );
    externalIdToUuid.set(result.externalBookId, result.workId);
    results.push(result);
    console.log(
      `[apply-override]   ${result.externalBookId.padEnd(9)} ${result.slug.padEnd(22)} path=${result.path} facets=${result.facetCount} factions=${result.factionCount} locations=${result.locationCount} characters=${result.characterCount} authors=${result.authorCount} editors=${result.editorCount} ${result.ratingSummary}`,
    );
  }

  const collectionsCount = await applyCollections(externalIdToUuid, roster, args.batch);
  console.log(`[apply-override] work_collections written: ${collectionsCount} rows`);

  const summary = {
    works: results.length,
    ...(await countJunctions([...externalIdToUuid.values()])),
  };
  console.log(`[apply-override] DB-side counts:`, summary);

  if (autoCreated.length > 0) {
    const total = await appendAutoCreatedPersons(autoCreated);
    console.log(
      `[apply-override] appended ${autoCreated.length} new entries to persons.json (total now ${total})`,
    );
  }

  const unresolved = results.filter((r) => r.unresolvedAuthorship);
  if (unresolved.length > 0) {
    console.warn(
      `[apply-override] unresolved authorship for ${unresolved.length} book(s):`,
    );
    for (const r of unresolved) {
      console.warn(`[apply-override]   ${r.externalBookId} (${r.slug})`);
    }
  }

  const inserts = results.filter((r) => r.path === "insert").length;
  const updates = results.filter((r) => r.path === "update").length;
  console.log(
    `[apply-override] done. inserts=${inserts} updates=${updates} total=${results.length}`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("[apply-override] failed:", err);
  process.exit(1);
});
