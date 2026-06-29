/**
 * apply-book.ts — Brief 170 Teil A. Targeted per-book SSOT applier.
 *
 * Writes ONE (`--slug`) or ALL (`--all`) `scripts/seed-data/books/<slug>.json`
 * files into Postgres through the SAME shared writer the legacy batch applier
 * uses (`./book-apply-shared` `applyBook`) — so a per-book book is materialized
 * legacy-equivalently (works/book_details/junctions/persons), idempotently,
 * touching no other work.
 *
 * Contract (Brief 170 §Design "apply:book"):
 *   - runs the shared, non-destructive reference/facet seed PROLOG first, so a
 *     brand-new faction/location/facet resolves without a full db:sync;
 *   - validates facets/roles/synopses/ratings before any mutation;
 *   - replaces details/junctions/links ONLY for the targeted work(s);
 *   - book_details.primary_era_id = "time_ending" on insert AND update;
 *   - `--all` is deterministic and is the additive `db:sync` tail (runs right
 *     after the legacy corpus, before podcast/audiobook/timeline/curation);
 *   - auto-created authors/editors land in persons.json once at run end;
 *   - `--verify` is read-only (db:drift): asserts each books/*.json is present.
 *
 * Collections (Brief 170 §Design "Collections und Personen"):
 *   - the collection file OWNS `collections.collects[]`; only it writes edges;
 *   - `apply:book --slug <collection>` replaces that collection's edges;
 *   - `apply:book --slug <member>` does NOT touch work_collections;
 *   - an unresolvable collects member halts loud.
 *
 * CLI:
 *   npm run apply:book -- --slug <slug>
 *   npm run apply:book -- --all
 *   npm run apply:book -- --verify
 *
 * Live-DB-write only on Philipp's explicit go (default: source → PR/merge →
 * apply). No `--dry` flag: invocation IS the write, matching apply-override.
 */
import { parseArgs } from "node:util";

import { eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import { bookDetails, workCollections, works } from "@/db/schema";

import {
  appendAutoCreatedPersons,
  applyBook,
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
  type RosterBook,
} from "./book-apply-shared";
import {
  collectionEdgesOf,
  findCorpusCollisions,
  findUnresolvableCollectMembers,
  loadBookFiles,
  projectToOverrideBook,
  projectToRosterBook,
  seriesAnchorOf,
  type BookFileV1,
  type LoadedBookFile,
} from "./book-file";
import { seedReferenceAndFacetProlog } from "./seed-prolog";

// =============================================================================
// CLI
// =============================================================================

interface ParsedCliArgs {
  slug: string;
  all: boolean;
  verify: boolean;
  help: boolean;
}

function parseCliArgs(argv: string[]): ParsedCliArgs {
  const { values } = parseArgs({
    args: argv,
    options: {
      slug: { type: "string" },
      all: { type: "boolean", default: false },
      verify: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
    strict: true,
    allowPositionals: false,
  });
  return {
    slug: String(values.slug ?? ""),
    all: Boolean(values.all),
    verify: Boolean(values.verify),
    help: Boolean(values.help),
  };
}

function printHelp(): void {
  console.log(`
apply-book.ts — write per-book SSOT files (scripts/seed-data/books/<slug>.json)
into Postgres. Brief 170 Teil A. Shares the legacy apply path via
scripts/book-apply-shared.ts.

Usage:
  npm run apply:book -- --slug <slug>   # one book, idempotent, targeted
  npm run apply:book -- --all           # every books/*.json (the db:sync tail)
  npm run apply:book -- --verify        # read-only presence check (db:drift)
  npm run apply:book -- --help

Behaviour:
  - Runs the non-destructive reference/facet seed prolog before validating.
  - One transaction per book; idempotent on works.external_book_id.
  - book_details.primary_era_id = "time_ending" on insert and update.
  - Collection files own collects[]; member applies leave work_collections alone.
  - Unknown authors/editors are appended to scripts/seed-data/persons.json.
  - --all on an empty books/ folder is a clean no-op (exit 0).

Live-DB write only on Philipp's explicit go. Default flow: write the source
file → PR/merge → targeted apply or db:sync.
`);
}

// =============================================================================
// Load + validate the per-book folder (shared by every mode)
// =============================================================================

interface LoadedCorpus {
  folder: LoadedBookFile[];
  rosterBooks: RosterBook[];
  knownExternalIds: Set<string>;
}

/** Load the folder + roster, run the schema + dup-guard gates. Throws on any issue. */
async function loadAndGuard(): Promise<LoadedCorpus> {
  const roster = await loadRoster();
  const { books: folder, issues } = loadBookFiles();
  if (issues.length > 0) {
    throw new Error(
      `[apply-book] ${issues.length} per-book file validation issue(s). Halt before mutation.\n` +
        issues.map((i) => `  - ${i.filename}: ${i.message}`).join("\n"),
    );
  }

  const collisions = findCorpusCollisions(folder, roster.books);
  if (collisions.length > 0) {
    throw new Error(
      `[apply-book] ${collisions.length} corpus collision(s) (slug/externalBookId across Legacy + books/). Halt.\n` +
        collisions.map((c) => `  - ${c}`).join("\n"),
    );
  }

  const knownExternalIds = new Set<string>([
    ...roster.books.map((b) => b.externalBookId),
    ...folder.map((f) => f.book.externalBookId),
  ]);
  return { folder, rosterBooks: roster.books, knownExternalIds };
}

// =============================================================================
// Apply (--slug / --all)
// =============================================================================

async function resolveWorkIdByExternalId(externalBookId: string): Promise<string | null> {
  const row = (await db
    .select({ id: works.id })
    .from(works)
    .where(eq(works.externalBookId, externalBookId))
    .limit(1)) as Array<{ id: string }>;
  return row[0]?.id ?? null;
}

/**
 * Per-book collections writer (collection-ownership semantics). For a selected
 * collection file: delete its current edges, re-insert from collects[]. A
 * selected member file (no collects[]) never reaches here, so its
 * work_collections rows are left intact.
 */
async function applyBookCollections(
  collection: BookFileV1,
  collectionWorkId: string,
): Promise<number> {
  // Idempotent: clear THIS collection's edges, then re-insert.
  await db
    .delete(workCollections)
    .where(eq(workCollections.collectionWorkId, collectionWorkId));

  const edges = collectionEdgesOf([collection]);
  if (edges.length === 0) return 0;

  const rows: Array<{
    collectionWorkId: string;
    contentWorkId: string;
    displayOrder: number;
    confidence: string | null;
    basis: string | null;
  }> = [];
  for (const e of edges) {
    const contentWorkId = await resolveWorkIdByExternalId(e.contentExternalId);
    if (contentWorkId === null) {
      throw new Error(
        `[apply-book] collection ${collection.externalBookId} collects ${e.contentExternalId}, ` +
          `but no work with that external_book_id exists in the DB. Apply the member first ` +
          `(or run --all). Halt.`,
      );
    }
    rows.push({
      collectionWorkId,
      contentWorkId,
      displayOrder: e.displayOrder,
      confidence: e.confidence !== null ? e.confidence.toFixed(2) : null,
      basis: e.basis,
    });
  }
  await db.insert(workCollections).values(rows);
  return rows.length;
}

async function runApply(mode: { slug: string; all: boolean }): Promise<void> {
  const { folder, rosterBooks, knownExternalIds } = await loadAndGuard();

  // Select the target set.
  let selected: LoadedBookFile[];
  if (mode.all) {
    selected = folder; // already sorted by filename → deterministic
  } else {
    const hit = folder.find((f) => f.book.slug === mode.slug);
    if (!hit) {
      throw new Error(
        `[apply-book] no per-book file with slug="${mode.slug}" under scripts/seed-data/books/. ` +
          `Available: ${folder.map((f) => f.book.slug).join(", ") || "(none)"}`,
      );
    }
    selected = [hit];
  }

  if (selected.length === 0) {
    console.log("[apply-book] books/ is empty — nothing to apply (clean no-op).");
    process.exit(0);
  }

  console.log(`[apply-book] selected ${selected.length} book(s): ${selected.map((s) => s.book.slug).join(", ")}`);

  // Reference/facet prolog FIRST — a new faction/location/facet must exist
  // before validation + resolution (Brief 170 §Design).
  console.log("[apply-book] running reference/facet seed prolog (non-destructive)…");
  await seedReferenceAndFacetProlog();

  const selectedBooks = selected.map((s) => s.book);
  const overrideBooks: OverrideBook[] = selectedBooks.map(projectToOverrideBook);

  // Validation gates (halt before mutation).
  const allFacetIds = new Set<string>();
  for (const b of overrideBooks) for (const f of b.overrides.facetIds) allFacetIds.add(f);
  await validateFacetIds(allFacetIds);
  console.log(`[apply-book] validated ${allFacetIds.size} distinct facet ids`);
  validateEntityRoles(overrideBooks);
  validateSynopses(overrideBooks, "books/ (per-book)");
  validateRatingOverrides(overrideBooks);
  console.log("[apply-book] validated roles, synopses, ratings");

  // Collection member resolvability (against the effective corpus).
  const collectIssues = findUnresolvableCollectMembers(selected, knownExternalIds);
  if (collectIssues.length > 0) {
    throw new Error(
      `[apply-book] ${collectIssues.length} unresolvable collects member(s). Halt.\n` +
        collectIssues.map((c) => `  - ${c}`).join("\n"),
    );
  }

  const skipCtx = await loadSkipContext();
  const locationSkipCtx = await loadLocationSkipContext();

  // Persons pre-pass over the selected books (their own authors/editors).
  const rosterByExternalId = new Map<string, RosterBook>(
    selectedBooks.map((b) => [b.externalBookId, projectToRosterBook(b)]),
  );
  const { autoCreated, distinct } = await ensurePersonsExist(overrideBooks, rosterByExternalId);
  console.log(
    `[apply-book] ensurePersonsExist: ${distinct} distinct slugs, ${autoCreated.length} newly created`,
  );

  // Per-book apply.
  const results: BookApplyResult[] = [];
  const externalIdToUuid = new Map<string, string>();
  for (const { book } of selected) {
    const roster = projectToRosterBook(book);
    const override = projectToOverrideBook(book);
    const series = seriesAnchorOf(book);
    const result = await applyBook(override, roster, series, skipCtx, locationSkipCtx);
    externalIdToUuid.set(result.externalBookId, result.workId);
    results.push(result);
    console.log(
      `[apply-book]   ${result.externalBookId.padEnd(10)} ${result.slug.padEnd(24)} path=${result.path} facets=${result.facetCount} factions=${result.factionCount} locations=${result.locationCount} characters=${result.characterCount} authors=${result.authorCount} editors=${result.editorCount} ${result.ratingSummary}`,
    );
  }

  // Collections — only for selected COLLECTION files (those with collects[]).
  let collectionEdges = 0;
  for (const { book } of selected) {
    if (book.collections.collects.length === 0) continue;
    const collectionWorkId = externalIdToUuid.get(book.externalBookId);
    if (!collectionWorkId) continue;
    collectionEdges += await applyBookCollections(book, collectionWorkId);
  }
  console.log(`[apply-book] work_collections written for selected collections: ${collectionEdges} rows`);

  // DB-side counts for the report.
  const summary = { works: results.length, ...(await countJunctions([...externalIdToUuid.values()])) };
  console.log(`[apply-book] DB-side counts:`, summary);

  if (autoCreated.length > 0) {
    const total = await appendAutoCreatedPersons(autoCreated);
    console.log(`[apply-book] appended ${autoCreated.length} new entries to persons.json (total now ${total})`);
  }

  const inserts = results.filter((r) => r.path === "insert").length;
  const updates = results.filter((r) => r.path === "update").length;
  console.log(`[apply-book] done. inserts=${inserts} updates=${updates} total=${results.length}`);
  process.exit(0);
}

// =============================================================================
// Verify (read-only — db:drift)
// =============================================================================

async function runVerify(): Promise<void> {
  const { folder } = await loadAndGuard();
  if (folder.length === 0) {
    console.log("[apply-book] verify: books/ is empty — nothing to check (ok).");
    process.exit(0);
  }

  const externalIds = folder.map((f) => f.book.externalBookId);
  const rows = (await db
    .select({
      externalBookId: works.externalBookId,
      slug: works.slug,
      workId: works.id,
    })
    .from(works)
    .where(inArray(works.externalBookId, externalIds))) as Array<{
      externalBookId: string | null;
      slug: string;
      workId: string;
    }>;
  const byExternalId = new Map(rows.map((r) => [r.externalBookId ?? "", r]));

  const detailRows = (await db
    .select({ workId: bookDetails.workId })
    .from(bookDetails)
    .where(inArray(bookDetails.workId, rows.map((r) => r.workId)))) as Array<{ workId: string }>;
  const detailSet = new Set(detailRows.map((r) => r.workId));

  const failures: string[] = [];
  for (const { book } of folder) {
    const row = byExternalId.get(book.externalBookId);
    if (!row) {
      failures.push(`${book.externalBookId} (${book.slug}): no works row — not applied yet`);
      continue;
    }
    if (row.slug !== book.slug) {
      failures.push(`${book.externalBookId}: works.slug="${row.slug}" ≠ file slug="${book.slug}"`);
    }
    if (!detailSet.has(row.workId)) {
      failures.push(`${book.externalBookId} (${book.slug}): no book_details row`);
    }
  }

  console.log(`[apply-book] verify: ${folder.length} per-book file(s), ${failures.length} mismatch(es)`);
  for (const f of failures) console.error(`[apply-book]   ✗ ${f}`);
  if (failures.length > 0) process.exit(1);
  console.log("[apply-book] verify: ok — every books/*.json is present in the DB.");
  process.exit(0);
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  const modes = [args.slug !== "", args.all, args.verify].filter(Boolean).length;
  if (modes !== 1) {
    console.error("[apply-book] exactly one of --slug <slug> | --all | --verify is required. Use --help.");
    process.exit(2);
  }

  if (args.verify) {
    await runVerify();
    return;
  }
  await runApply({ slug: args.slug, all: args.all });
}

main().catch((err) => {
  console.error("[apply-book] failed:", err instanceof Error ? (err.stack ?? err.message) : err);
  process.exit(1);
});
