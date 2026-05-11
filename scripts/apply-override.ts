/**
 * apply-override.ts — first active DB-write path of the Brief-058+ pipeline.
 *
 * Brief 060 (2026-05-11): the 10 books in `ssot-w40k-001` (W40K-0001..W40K-0010)
 * are written into Postgres using a Cowork-curated override file as authority for
 * the soft fields (synopsis, facetIds, factions, locations, characters, flags),
 * and `book-roster.json` (the SSOT-Excel mirror) as authority for the hard fields
 * (title, releaseYear, format, seriesHint).
 *
 * What the script does:
 *   1. Loads `manual-overrides-<batch>.json` and `book-roster.json` from
 *      `scripts/seed-data/`.
 *   2. For each of the 10 books, opens its own transaction:
 *      - UPSERT works (idempotent on `external_book_id` UNIQUE).
 *      - UPSERT bookDetails.
 *      - DELETE-then-INSERT junctions (work_facets, work_persons, work_factions,
 *        work_locations) — gives us per-row idempotency without per-row diff.
 *      - Persist non-canonical surface forms (factions/locations/characters that
 *        do not resolve to reference IDs, plus any `data_conflict` flags) into
 *        `book_details.notes` between `---surfaceForms---` delimiters. The
 *        Resolver brief (062-063) extracts these later.
 *   3. After all 10 books: a second pass writes `work_collections` rows. They
 *      need the works.id UUIDs of every book in the batch, so they are deferred
 *      until the per-book pass has produced an externalBookId → UUID map.
 *
 * Authority-vs-source split:
 *   - `works.synopsis`        ← override
 *   - `works.title`           ← roster
 *   - `works.releaseYear`     ← roster
 *   - `works.externalBookId`  ← roster (idempotency anchor)
 *   - `works.sourceKind`      ← const "ssot"
 *   - `works.confidence`      ← const "1.00"
 *   - `bookDetails.format`    ← roster (or override `data_conflict.suggestion`)
 *   - `bookDetails.notes`     ← surfaceForms JSON block
 *   - `bookDetails.primaryEraId` ← const "time_ending" (M41)
 *   - `bookDetails.seriesId`/`seriesIndex` ← seriesHint→reference mapping
 *
 * Anything not in the override file stays NULL. No fallback to LLM diffs.
 *
 * CLI:
 *   npm run db:apply-override -- --batch=ssot-w40k-001
 */
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { resolve } from "node:path";

import { count, eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import {
  bookDetails,
  facetValues,
  works,
  workCollections,
  workFacets,
  workFactions,
  workLocations,
  workPersons,
} from "@/db/schema";

const SEED_DIR = resolve(process.cwd(), "scripts", "seed-data");
const ROSTER_PATH = resolve(SEED_DIR, "book-roster.json");
const OVERRIDE_FILENAME_PREFIX = "manual-overrides-";

const M41_ERA_ID = "time_ending";
const AUTHOR_PERSON_ID = "dan_abnett";
const BATCH_NAME_PATTERN = /^ssot-(w40k|hh)-\d{3}$/;

// Highest-role-wins for work_factions composite-PK collision resolution.
const FACTION_ROLE_PRIORITY: Record<string, number> = {
  primary: 4,
  supporting: 3,
  antagonist: 2,
  background: 1,
};

// Override-surface-form name → reference table id. Anything not here stays
// in `bookDetails.notes` as an unresolved surface form.
const CANONICAL_FACTION_RESOLVE: Record<string, string> = {
  Inquisition: "inquisition",
  "Ordo Xenos": "inquisition",
  "Ordo Malleus": "inquisition",
  "Ordo Hereticus": "inquisition",
  Chaos: "chaos",
  "Adeptus Mechanicus": "mechanicus",
  Necrons: "necrons",
};

const CANONICAL_LOCATION_RESOLVE: Record<string, string> = {
  "Eye of Terror": "eye_of_terror",
};

// Eisenhorn/Ravenor are seeded series; Bequin and The Magos have no series row
// and stay NULL until a future brief decides whether to add one.
const SERIES_BY_EXTERNAL_ID: Record<string, { id: string; index: number | null }> = {
  "W40K-0001": { id: "eisenhorn", index: 1 },
  "W40K-0002": { id: "eisenhorn", index: 2 },
  "W40K-0003": { id: "eisenhorn", index: 3 },
  "W40K-0004": { id: "eisenhorn", index: null },
  "W40K-0005": { id: "ravenor", index: 1 },
  "W40K-0006": { id: "ravenor", index: 2 },
  "W40K-0007": { id: "ravenor", index: 3 },
  "W40K-0008": { id: "ravenor", index: null },
};

// =============================================================================
// Types
// =============================================================================

interface OverrideFlag {
  kind: string;
  field?: string;
  current?: string;
  suggestion?: string;
  sources?: string[];
  reasoning?: string;
}

interface OverrideEntity {
  name: string;
  role: string;
}

interface OverrideBook {
  externalBookId: string;
  slug: string;
  overrides: {
    synopsis: string;
    facetIds: string[];
    factions: OverrideEntity[];
    locations: OverrideEntity[];
    characters: OverrideEntity[];
    flags: OverrideFlag[];
  };
}

interface OverrideFile {
  $schema: string;
  batch: string;
  createdBy: string;
  createdAt: string;
  model: string;
  rationale: string;
  books: OverrideBook[];
}

interface RosterBook {
  externalBookId: string;
  slug: string;
  title: string;
  authors: string[];
  editors: string[];
  editorialNote: string | null;
  releaseYear: number | null;
  format: string | null;
  seriesHint: string | null;
  sourceUrl: string | null;
  notes: string | null;
  sourceRow: number;
}

interface RosterCollection {
  contentExternalId: string;
  collectionExternalId: string;
  displayOrder: number;
  confidence: number | null;
  basis: string | null;
}

interface RosterFile {
  schemaVersion: string;
  sourceFile: string;
  books: RosterBook[];
  collections: RosterCollection[];
}

type ApplyPath = "insert" | "update";

interface BookApplyResult {
  externalBookId: string;
  slug: string;
  workId: string;
  path: ApplyPath;
  facetCount: number;
  factionCount: number;
  locationCount: number;
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
`);
}

// =============================================================================
// Helpers
// =============================================================================

function pickFinalFormat(roster: RosterBook, override: OverrideBook): {
  format: string | null;
  formatOverride: { from: string | null; to: string; reason: string } | null;
} {
  const dataConflict = override.overrides.flags.find(
    (f) => f.kind === "data_conflict" && f.field === "format" && f.suggestion,
  );
  if (dataConflict) {
    return {
      format: dataConflict.suggestion ?? null,
      formatOverride: {
        from: dataConflict.current ?? roster.format ?? null,
        to: dataConflict.suggestion!,
        reason: dataConflict.reasoning ?? "data_conflict flag in override file",
      },
    };
  }
  return { format: roster.format ?? null, formatOverride: null };
}

function resolveFactions(input: OverrideEntity[]): Array<{ id: string; role: string }> {
  // Collapse multiple surface forms onto the same canonical id, keeping the
  // highest-priority role per id (FACTION_ROLE_PRIORITY).
  const byId = new Map<string, string>();
  for (const f of input) {
    const id = CANONICAL_FACTION_RESOLVE[f.name];
    if (!id) continue;
    const incomingPriority = FACTION_ROLE_PRIORITY[f.role] ?? 0;
    const current = byId.get(id);
    const currentPriority = current ? FACTION_ROLE_PRIORITY[current] ?? 0 : -1;
    if (incomingPriority > currentPriority) byId.set(id, f.role);
  }
  return [...byId.entries()].map(([id, role]) => ({ id, role }));
}

function resolveLocations(input: OverrideEntity[]): Array<{ id: string; role: string }> {
  return input
    .map((l) => {
      const id = CANONICAL_LOCATION_RESOLVE[l.name];
      return id ? { id, role: l.role } : null;
    })
    .filter((x): x is { id: string; role: string } => x !== null);
}

function buildSurfaceFormsBlock(
  override: OverrideBook,
  formatOverride: { from: string | null; to: string; reason: string } | null,
): string {
  const factionsUnresolved = override.overrides.factions
    .filter((f) => !CANONICAL_FACTION_RESOLVE[f.name])
    .map((f) => ({ name: f.name, role: f.role }));
  const locationsUnresolved = override.overrides.locations
    .filter((l) => !CANONICAL_LOCATION_RESOLVE[l.name])
    .map((l) => ({ name: l.name, role: l.role }));
  const charactersUnresolved = override.overrides.characters.map((c) => ({
    name: c.name,
    role: c.role,
  }));
  const payload: Record<string, unknown> = {
    factionsUnresolved,
    locationsUnresolved,
    charactersUnresolved,
    flags: override.overrides.flags,
  };
  if (formatOverride) payload.formatOverride = formatOverride;
  const json = JSON.stringify(payload, null, 2);
  return `---surfaceForms---\n${json}\n---/surfaceForms---`;
}

function composeNotes(
  rosterNotes: string | null,
  surfaceFormsBlock: string,
): string {
  const head = (rosterNotes ?? "").trim();
  return head ? `${head}\n\n${surfaceFormsBlock}` : surfaceFormsBlock;
}

// =============================================================================
// Apply pipeline
// =============================================================================

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

async function loadRoster(): Promise<RosterFile> {
  const raw = await readFile(ROSTER_PATH, "utf8");
  return JSON.parse(raw) as RosterFile;
}

async function validateFacetIds(allFacetIds: Set<string>): Promise<void> {
  if (allFacetIds.size === 0) return;
  const rows = (await db
    .select({ id: facetValues.id })
    .from(facetValues)
    .where(inArray(facetValues.id, [...allFacetIds]))) as Array<{ id: string }>;
  const found = new Set(rows.map((r) => r.id));
  const missing = [...allFacetIds].filter((id) => !found.has(id));
  if (missing.length > 0) {
    throw new Error(
      `Override references unknown facet_value ids: ${missing.join(", ")}. ` +
        `Halt before mutation.`,
    );
  }
}

async function applyBook(
  override: OverrideBook,
  roster: RosterBook,
): Promise<BookApplyResult> {
  return await db.transaction(async (tx) => {
    const { format, formatOverride } = pickFinalFormat(roster, override);
    const surfaceFormsBlock = buildSurfaceFormsBlock(override, formatOverride);
    const notes = composeNotes(roster.notes, surfaceFormsBlock);

    const existing = (await tx
      .select({ id: works.id })
      .from(works)
      .where(eq(works.externalBookId, override.externalBookId))) as Array<{ id: string }>;
    const path: ApplyPath = existing.length > 0 ? "update" : "insert";

    let workId: string;
    if (path === "update") {
      workId = existing[0].id;
      await tx
        .update(works)
        .set({
          synopsis: override.overrides.synopsis,
          // Title and slug stay frozen on update — externalBookId is the only
          // identity anchor; renames live in the SSOT-Excel and require an
          // explicit re-import path that brief 060 does not implement.
          updatedAt: new Date(),
        })
        .where(eq(works.id, workId));
    } else {
      const inserted = (await tx
        .insert(works)
        .values({
          kind: "book",
          canonicity: "official",
          slug: override.slug,
          title: roster.title,
          synopsis: override.overrides.synopsis,
          releaseYear: roster.releaseYear ?? null,
          externalBookId: override.externalBookId,
          sourceKind: "ssot",
          confidence: "1.00",
        })
        .returning({ id: works.id })) as Array<{ id: string }>;
      workId = inserted[0].id;
    }

    const series = SERIES_BY_EXTERNAL_ID[override.externalBookId] ?? null;

    // book_details upsert via primaryKey conflict (workId is PK).
    await tx
      .insert(bookDetails)
      .values({
        workId,
        format: format as never,
        notes,
        primaryEraId: M41_ERA_ID,
        seriesId: series?.id ?? null,
        seriesIndex: series?.index ?? null,
      })
      .onConflictDoUpdate({
        target: bookDetails.workId,
        set: {
          format: format as never,
          notes,
          primaryEraId: M41_ERA_ID,
          seriesId: series?.id ?? null,
          seriesIndex: series?.index ?? null,
        },
      });

    // Junctions: delete-then-insert. work_collections is handled in a second
    // pass once every book in the batch has a UUID.
    await tx.delete(workFacets).where(eq(workFacets.workId, workId));
    if (override.overrides.facetIds.length > 0) {
      await tx.insert(workFacets).values(
        override.overrides.facetIds.map((facetValueId) => ({
          workId,
          facetValueId,
        })),
      );
    }

    await tx.delete(workPersons).where(eq(workPersons.workId, workId));
    await tx.insert(workPersons).values([
      {
        workId,
        personId: AUTHOR_PERSON_ID,
        role: "author",
        displayOrder: 0,
      },
    ]);

    await tx.delete(workFactions).where(eq(workFactions.workId, workId));
    const resolvedFactions = resolveFactions(override.overrides.factions);
    if (resolvedFactions.length > 0) {
      await tx.insert(workFactions).values(
        resolvedFactions.map((f) => ({
          workId,
          factionId: f.id,
          role: f.role,
        })),
      );
    }

    await tx.delete(workLocations).where(eq(workLocations.workId, workId));
    const resolvedLocations = resolveLocations(override.overrides.locations);
    if (resolvedLocations.length > 0) {
      await tx.insert(workLocations).values(
        resolvedLocations.map((l) => ({
          workId,
          locationId: l.id,
          role: l.role,
        })),
      );
    }

    return {
      externalBookId: override.externalBookId,
      slug: override.slug,
      workId,
      path,
      facetCount: override.overrides.facetIds.length,
      factionCount: resolvedFactions.length,
      locationCount: resolvedLocations.length,
    };
  });
}

async function applyCollections(
  externalIdToUuid: Map<string, string>,
  roster: RosterFile,
): Promise<number> {
  const batchExternalIds = new Set(externalIdToUuid.keys());
  // A collection row is in scope iff BOTH endpoints are inside the override
  // batch. Cross-batch refs (e.g. a future Eisenhorn-shorts collection
  // pointing at a non-W40K-001 piece) stay untouched.
  const inScope = roster.collections.filter(
    (c) =>
      batchExternalIds.has(c.collectionExternalId) &&
      batchExternalIds.has(c.contentExternalId),
  );

  const batchUuids = [...externalIdToUuid.values()];
  // Idempotency: clear out any rows whose collection-side OR content-side UUID
  // belongs to this batch, then re-insert.
  if (batchUuids.length > 0) {
    await db
      .delete(workCollections)
      .where(inArray(workCollections.collectionWorkId, batchUuids));
    await db
      .delete(workCollections)
      .where(inArray(workCollections.contentWorkId, batchUuids));
  }

  if (inScope.length === 0) return 0;

  const rows = inScope.map((c) => ({
    collectionWorkId: externalIdToUuid.get(c.collectionExternalId)!,
    contentWorkId: externalIdToUuid.get(c.contentExternalId)!,
    displayOrder: c.displayOrder,
    confidence: c.confidence !== null ? c.confidence.toFixed(2) : null,
    basis: c.basis,
  }));
  await db.insert(workCollections).values(rows);
  return rows.length;
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

  console.log(
    `[apply-override] loaded override: ${override.books.length} books; createdBy=${override.createdBy}`,
  );

  const rosterByExternalId = new Map(roster.books.map((b) => [b.externalBookId, b]));
  const allFacetIds = new Set<string>();
  for (const b of override.books) for (const f of b.overrides.facetIds) allFacetIds.add(f);
  await validateFacetIds(allFacetIds);
  console.log(`[apply-override] validated ${allFacetIds.size} distinct facet ids`);

  const results: BookApplyResult[] = [];
  const externalIdToUuid = new Map<string, string>();

  for (const overrideBook of override.books) {
    const rosterBook = rosterByExternalId.get(overrideBook.externalBookId);
    if (!rosterBook) {
      throw new Error(
        `Override book ${overrideBook.externalBookId} has no matching row in book-roster.json`,
      );
    }
    const result = await applyBook(overrideBook, rosterBook);
    externalIdToUuid.set(result.externalBookId, result.workId);
    results.push(result);
    console.log(
      `[apply-override]   ${result.externalBookId.padEnd(9)} ${result.slug.padEnd(22)} path=${result.path} facets=${result.facetCount} factions=${result.factionCount} locations=${result.locationCount}`,
    );
  }

  const collectionsCount = await applyCollections(externalIdToUuid, roster);
  console.log(`[apply-override] work_collections written: ${collectionsCount} rows`);

  // Summary counts straight from the DB so the report has authoritative numbers.
  const batchUuidList = [...externalIdToUuid.values()];
  const countOf = async (
    table: typeof workFacets | typeof workPersons | typeof workFactions | typeof workLocations,
  ): Promise<number> => {
    if (batchUuidList.length === 0) return 0;
    const r = await db
      .select({ n: count() })
      .from(table)
      .where(inArray(table.workId, batchUuidList));
    return r[0]?.n ?? 0;
  };
  const summary = {
    works: results.length,
    work_facets: await countOf(workFacets),
    work_persons: await countOf(workPersons),
    work_factions: await countOf(workFactions),
    work_locations: await countOf(workLocations),
    work_collections:
      batchUuidList.length === 0
        ? 0
        : (
            await db
              .select({ n: count() })
              .from(workCollections)
              .where(inArray(workCollections.collectionWorkId, batchUuidList))
          )[0]?.n ?? 0,
  };
  console.log(`[apply-override] DB-side counts:`, summary);

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
