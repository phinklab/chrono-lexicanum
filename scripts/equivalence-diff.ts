/**
 * equivalence-diff.ts — Brief 171 Teil B. The migration equivalence GATE.
 *
 * Proves `apply(legacy) == apply(per-book)` on the corpus-owned domain BEFORE
 * any batch/Excel/extension machinery is retired ("Kein Retirement ohne leeren
 * Aequivalenz-Diff" — Brief 171 §Constraints).
 *
 * Why a DB-free projection diff is the proof (Brief 171 §Aequivalenz-Diff):
 * both appliers call the SAME shared writer (`book-apply-shared.applyBook`),
 * which derives every corpus-owned row purely via `computeBookRows`. The ONLY
 * remaining diff surface is the PROJECTION — legacy (`book-roster.json` row +
 * matching `manual-overrides-ssot-*.json` book + `SERIES_BY_EXTERNAL_ID`) vs
 * per-book (`books/<slug>.json` → `projectTo{Roster,Override}Book` +
 * `seriesAnchorOf`). So `computeBookRows(legacy) deepEqual computeBookRows(per-book)`
 * for every book, plus the `work_collections` edge set, IS the row-level snapshot
 * the two applies would write — deterministic, no DB, no Prod risk.
 *
 * Modes:
 *   --projection (default)  DB-free parity-by-construction proof. Forces a STUB
 *                           DATABASE_URL so it can NEVER touch a live DB. This is
 *                           the committed gate (runs in CI / locally with no DB).
 *   --db-snapshot --out P   Read the CURRENT DB into the normalized domain and
 *                           write a snapshot JSON. Operator tool for a real deep
 *                           diff against a DISPOSABLE DB. Refuses Prod/.env.local
 *                           targets unless EQUIV_DISPOSABLE_DB_OK=1 is set.
 *   --compare A B           Deep-diff two snapshot JSONs produced by --db-snapshot.
 *
 * Proof artifacts go to /ingest/.equivalence/ (gitignored — never confused with
 * the committed /ingest/.last-run/ digests).
 *
 * CLI:
 *   npm run equiv:diff                 # projection gate (DB-free)
 *   tsx scripts/equivalence-diff.ts --db-snapshot --out ingest/.equivalence/legacy.json
 *   tsx scripts/equivalence-diff.ts --compare ingest/.equivalence/legacy.json ingest/.equivalence/perbook.json
 */
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path, { resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import {
  buildLegacyTriples,
  loadAllOverrideBooks,
  loadRosterSync,
} from "./legacy-corpus-projection";
import {
  collectionEdgesOf,
  loadBookFiles,
  projectToOverrideBook,
  projectToRosterBook,
  seriesAnchorOf,
} from "./book-file";
import { loadEraContext } from "./era-bucket";
import type { RosterCollection } from "./seed-data/types";

const EQUIV_DIR = resolve(process.cwd(), "ingest", ".equivalence");
const STUB_DATABASE_URL = "postgres://stub:stub@127.0.0.1:5432/stub";

// =============================================================================
// Stable normalization helpers
// =============================================================================

/** Recursively key-sorted JSON — stable identity for deep-equal by string. */
function stable(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as Record<string, unknown>).sort()) {
      out[k] = sortKeys((v as Record<string, unknown>)[k]);
    }
    return out;
  }
  return v;
}

/** Stable natural key for a collection edge (the applied work_collections row). */
function collectionKey(e: RosterCollection): string {
  const conf = e.confidence !== null ? e.confidence.toFixed(2) : "null";
  return `${e.collectionExternalId}→${e.contentExternalId}|order=${e.displayOrder}|conf=${conf}|basis=${e.basis ?? "null"}`;
}

// =============================================================================
// Projection diff (DB-free) — the gate
// =============================================================================

interface ProjectionDiffResult {
  total: number;
  rowDeltas: Array<{ externalBookId: string; legacy: string; perBook: string }>;
  missingPerBook: string[];
  extraPerBook: string[];
  perBookFileIssues: string[];
  collectionsOnlyInLegacy: string[];
  collectionsOnlyInPerBook: string[];
  legacyCollectionCount: number;
  perBookCollectionCount: number;
}

export async function runProjectionDiff(): Promise<ProjectionDiffResult> {
  // ⚠ Force the STUB url BEFORE importing the computeBookRows module. The harness
  // never runs a query (computeBookRows + the skip loaders only read JSON), and
  // overwriting (not `??=`) guarantees it can't connect to Prod even if the
  // operator ran it with --env-file=.env.local. This is how the projection gate
  // "verweigert .env.local/Prod" (Brief 171 §Acceptance).
  process.env.DATABASE_URL = STUB_DATABASE_URL;
  const { computeBookRows, loadSkipContext, loadLocationSkipContext } = await import(
    "./book-apply-shared"
  );

  const roster = loadRosterSync();
  const { byExternalId } = loadAllOverrideBooks();
  const { triples, missingCuration } = buildLegacyTriples(roster, byExternalId);
  if (missingCuration.length > 0) {
    throw new Error(
      `[equiv] ${missingCuration.length} roster book(s) have no override — converter could not have run. Halt.`,
    );
  }

  const { books: perBookFiles, issues } = loadBookFiles();
  const perBookFileIssues = issues.map((i) => `${i.filename}: ${i.message}`);
  const perBookByExternalId = new Map(perBookFiles.map((f) => [f.book.externalBookId, f.book]));

  const skipCtx = await loadSkipContext();
  const locationSkipCtx = await loadLocationSkipContext();
  // Same era context on BOTH sides: the era anchor derives from the (proven
  // equal) slug, so it can never be the projection-diff surface.
  const eraCtx = loadEraContext();

  const rowDeltas: ProjectionDiffResult["rowDeltas"] = [];
  const missingPerBook: string[] = [];
  for (const { override, roster: rosterBook, series } of triples) {
    const perBook = perBookByExternalId.get(override.externalBookId);
    if (!perBook) {
      missingPerBook.push(override.externalBookId);
      continue;
    }
    const legacyRows = computeBookRows(override, rosterBook, series, skipCtx, locationSkipCtx, eraCtx);
    const perBookRows = computeBookRows(
      projectToOverrideBook(perBook),
      projectToRosterBook(perBook),
      seriesAnchorOf(perBook),
      skipCtx,
      locationSkipCtx,
      eraCtx,
    );
    const legacyStr = stable(legacyRows);
    const perBookStr = stable(perBookRows);
    if (legacyStr !== perBookStr) {
      rowDeltas.push({ externalBookId: override.externalBookId, legacy: legacyStr, perBook: perBookStr });
    }
  }

  const legacyIds = new Set(triples.map((t) => t.override.externalBookId));
  const extraPerBook = [...perBookByExternalId.keys()].filter((id) => !legacyIds.has(id));

  // Collections: legacy flat edge list vs per-book grouped collects[].
  const legacyEdges = new Map(roster.collections.map((e) => [collectionKey(e), e]));
  const perBookEdges = new Map(
    collectionEdgesOf(perBookFiles.map((f) => f.book)).map((e) => [collectionKey(e), e]),
  );
  const collectionsOnlyInLegacy = [...legacyEdges.keys()].filter((k) => !perBookEdges.has(k));
  const collectionsOnlyInPerBook = [...perBookEdges.keys()].filter((k) => !legacyEdges.has(k));

  return {
    total: triples.length,
    rowDeltas,
    missingPerBook,
    extraPerBook,
    perBookFileIssues,
    collectionsOnlyInLegacy,
    collectionsOnlyInPerBook,
    legacyCollectionCount: legacyEdges.size,
    perBookCollectionCount: perBookEdges.size,
  };
}

/**
 * Gate verdict. `extraPerBook` is deliberately NOT part of it (2026-W30):
 * post-retirement, a per-book file with no legacy counterpart is the ADDITIVE
 * case the path exists for — every book promoted from the weekly refresh
 * (`add-book-runbook.md`) is one, and Legacy (`book-roster*.json`,
 * `manual-overrides-ssot-*.json`, the Excel SSOT) stays frozen by design. Held
 * against zero, the gate would reject every new release forever.
 *
 * What still proves the migration was lossless: `rowDeltas` (every legacy book
 * projects to identical rows from its per-book file), `missingPerBook` (no
 * legacy book lost its file), the file-validation issues, and the collection
 * edge sets. Extras are still counted and listed in the report — visible, not
 * failing.
 */
export function isClean(r: ProjectionDiffResult): boolean {
  return (
    r.rowDeltas.length === 0 &&
    r.missingPerBook.length === 0 &&
    r.perBookFileIssues.length === 0 &&
    r.collectionsOnlyInLegacy.length === 0 &&
    r.collectionsOnlyInPerBook.length === 0
  );
}

function writeProjectionReport(r: ProjectionDiffResult): string {
  mkdirSync(EQUIV_DIR, { recursive: true });
  const path = resolve(EQUIV_DIR, "projection-diff.md");
  const clean = isClean(r);
  const lines: string[] = [
    "# Equivalence projection diff (Brief 171 — DB-free gate)",
    "",
    `Result: **${clean ? "EMPTY DIFF — apply(legacy) == apply(per-book)" : "DELTAS FOUND — GATE FAILED"}**`,
    "",
    `- books compared: ${r.total}`,
    `- corpus-owned row deltas (works + book_details + persons + facets + factions + locations + characters): ${r.rowDeltas.length}`,
    `- per-book files missing for a legacy book: ${r.missingPerBook.length}`,
    `- per-book files with no legacy counterpart (additive, informational): ${r.extraPerBook.length}`,
    `- per-book file validation issues: ${r.perBookFileIssues.length}`,
    `- work_collections edges: legacy=${r.legacyCollectionCount} per-book=${r.perBookCollectionCount}; only-legacy=${r.collectionsOnlyInLegacy.length}, only-per-book=${r.collectionsOnlyInPerBook.length}`,
    "",
  ];
  const dump = (title: string, items: string[]): void => {
    if (items.length === 0) return;
    lines.push(`## ${title} (${items.length})`, "");
    for (const it of items.slice(0, 100)) lines.push(`- ${it}`);
    if (items.length > 100) lines.push(`- … and ${items.length - 100} more`);
    lines.push("");
  };
  dump("Missing per-book files", r.missingPerBook);
  dump("Additive per-book files (no legacy counterpart — informational)", r.extraPerBook);
  dump("Per-book file validation issues", r.perBookFileIssues);
  dump("Collection edges only in legacy", r.collectionsOnlyInLegacy);
  dump("Collection edges only in per-book", r.collectionsOnlyInPerBook);
  if (r.rowDeltas.length > 0) {
    lines.push(`## Corpus-owned row deltas (${r.rowDeltas.length})`, "");
    for (const d of r.rowDeltas.slice(0, 40)) {
      lines.push(`### ${d.externalBookId}`, "", "legacy:", "```json", d.legacy, "```", "per-book:", "```json", d.perBook, "```", "");
    }
  }
  writeFileSync(path, lines.join("\n") + "\n", "utf8");
  return path;
}

// =============================================================================
// DB snapshot (operator tool — disposable DB only)
// =============================================================================

/** Refuse a Prod / .env.local target unless the operator explicitly waived it. */
export function assertDisposableTarget(): void {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) {
    throw new Error("[equiv] --db-snapshot needs DATABASE_URL (a DISPOSABLE DB). None set.");
  }
  if (process.env.EQUIV_DISPOSABLE_DB_OK === "1") return;
  // Heuristics: anything that looks like the managed Supabase Prod pooler is
  // refused. The operator points DATABASE_URL at a local/branch DB and sets
  // EQUIV_DISPOSABLE_DB_OK=1 to confirm it is throwaway.
  const prodLike = /supabase\.(co|com)|pooler\.supabase|\.neon\.tech|amazonaws\.com/i.test(url);
  if (prodLike || url === STUB_DATABASE_URL) {
    throw new Error(
      `[equiv] DATABASE_URL looks like a managed/Prod (or stub) target — refusing to snapshot.\n` +
        `        Point it at a DISPOSABLE DB and set EQUIV_DISPOSABLE_DB_OK=1 to confirm.`,
    );
  }
}

async function runDbSnapshot(outPath: string): Promise<void> {
  assertDisposableTarget();
  const { db } = await import("@/db/client");
  const schema = await import("@/db/schema");
  const { eq, inArray } = await import("drizzle-orm");

  const bookWorks = (await db
    .select({
      id: schema.works.id,
      externalBookId: schema.works.externalBookId,
      slug: schema.works.slug,
      title: schema.works.title,
      synopsis: schema.works.synopsis,
      releaseYear: schema.works.releaseYear,
      sourceKind: schema.works.sourceKind,
      confidence: schema.works.confidence,
    })
    .from(schema.works)
    .where(eq(schema.works.kind, "book"))) as Array<{
      id: string;
      externalBookId: string | null;
      slug: string;
      title: string;
      synopsis: string | null;
      releaseYear: number | null;
      sourceKind: string | null;
      confidence: string | null;
    }>;

  const idToExternal = new Map(bookWorks.map((w) => [w.id, w.externalBookId ?? w.id]));
  const ids = bookWorks.map((w) => w.id);

  const details = (await db.select().from(schema.bookDetails).where(inArray(schema.bookDetails.workId, ids))) as Array<
    Record<string, unknown> & { workId: string }
  >;
  const detailByWork = new Map(details.map((d) => [d.workId, d]));

  const facets = await db.select().from(schema.workFacets).where(inArray(schema.workFacets.workId, ids));
  const persons = await db
    .select()
    .from(schema.workPersons)
    .where(inArray(schema.workPersons.workId, ids));
  const factions = await db.select().from(schema.workFactions).where(inArray(schema.workFactions.workId, ids));
  const locations = await db.select().from(schema.workLocations).where(inArray(schema.workLocations.workId, ids));
  const characters = await db.select().from(schema.workCharacters).where(inArray(schema.workCharacters.workId, ids));
  const collections = await db.select().from(schema.workCollections);

  const ext = (id: string): string => idToExternal.get(id) ?? id;
  const snapshot = {
    works: bookWorks
      .map((w) => ({
        externalBookId: w.externalBookId,
        slug: w.slug,
        title: w.title,
        synopsis: w.synopsis,
        releaseYear: w.releaseYear,
        sourceKind: w.sourceKind,
        confidence: w.confidence,
        details: (() => {
          const d = detailByWork.get(w.id);
          if (!d) return null;
          return {
            format: d.format,
            seriesId: d.seriesId,
            seriesIndex: d.seriesIndex,
            notes: d.notes,
            rating: d.rating,
            ratingSource: d.ratingSource,
            ratingCount: d.ratingCount,
            primaryEraId: d.primaryEraId,
          };
        })(),
      }))
      .sort((a, b) => String(a.externalBookId).localeCompare(String(b.externalBookId))),
    facets: facets.map((f) => `${ext(f.workId)}|${f.facetValueId}`).sort(),
    persons: persons
      .filter((p) => p.role === "author" || p.role === "editor")
      .map((p) => `${ext(p.workId)}|${p.personId}|${p.role}|${p.displayOrder}`)
      .sort(),
    factions: factions.map((f) => `${ext(f.workId)}|${f.factionId}|${f.role}|${f.rawName}`).sort(),
    locations: locations.map((l) => `${ext(l.workId)}|${l.locationId}|${l.role}|${l.rawName}`).sort(),
    characters: characters.map((c) => `${ext(c.workId)}|${c.characterId}|${c.role}|${c.rawName}`).sort(),
    collections: collections
      .map((c) => `${ext(c.collectionWorkId)}→${ext(c.contentWorkId)}|${c.displayOrder}|${c.confidence}|${c.basis}`)
      .sort(),
  };

  mkdirSync(EQUIV_DIR, { recursive: true });
  writeFileSync(resolve(outPath), stable(snapshot) + "\n", "utf8");
  console.log(`[equiv] DB snapshot written: ${outPath} (works=${snapshot.works.length})`);
}

function runCompare(aPath: string, bPath: string): boolean {
  const a = stable(JSON.parse(readFileSync(resolve(aPath), "utf8")));
  const b = stable(JSON.parse(readFileSync(resolve(bPath), "utf8")));
  if (a === b) {
    console.log(`[equiv] snapshots IDENTICAL: ${aPath} == ${bPath}`);
    return true;
  }
  console.error(`[equiv] snapshots DIFFER: ${aPath} != ${bPath}`);
  // Coarse domain-level pointer (full deep-diff is the operator's jq/diff job).
  const oa = JSON.parse(a) as Record<string, unknown[]>;
  const ob = JSON.parse(b) as Record<string, unknown[]>;
  for (const k of Object.keys(oa)) {
    const la = Array.isArray(oa[k]) ? oa[k].length : 1;
    const lb = Array.isArray(ob[k]) ? ob[k].length : 1;
    if (stable(oa[k]) !== stable(ob[k])) console.error(`  - domain "${k}" differs (a=${la}, b=${lb})`);
  }
  return false;
}

// =============================================================================
// Main
// =============================================================================

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      projection: { type: "boolean", default: false },
      "db-snapshot": { type: "boolean", default: false },
      out: { type: "string" },
      compare: { type: "boolean", default: false },
    },
    strict: true,
    allowPositionals: true,
  });

  if (values.compare) {
    if (positionals.length !== 2) {
      console.error("[equiv] --compare needs exactly two snapshot paths.");
      process.exit(2);
    }
    process.exit(runCompare(positionals[0], positionals[1]) ? 0 : 1);
  }

  if (values["db-snapshot"]) {
    if (!values.out) {
      console.error("[equiv] --db-snapshot needs --out <path>.");
      process.exit(2);
    }
    await runDbSnapshot(values.out);
    process.exit(0);
  }

  // Default: the projection gate.
  const result = await runProjectionDiff();
  const reportPath = writeProjectionReport(result);
  const clean = isClean(result);
  console.log(
    `[equiv] projection diff: ${result.total} books, ${result.rowDeltas.length} row delta(s), ` +
      `collections legacy=${result.legacyCollectionCount}/per-book=${result.perBookCollectionCount} ` +
      `(only-legacy=${result.collectionsOnlyInLegacy.length}, only-per-book=${result.collectionsOnlyInPerBook.length}), ` +
      `missing=${result.missingPerBook.length}, extra=${result.extraPerBook.length}, fileIssues=${result.perBookFileIssues.length}`,
  );
  console.log(`[equiv] report: ${reportPath}`);
  if (clean) {
    console.log("[equiv] ✅ EMPTY DIFF — apply(legacy) == apply(per-book). Retirement gate OPEN.");
    process.exit(0);
  }
  console.error("[equiv] ❌ DELTAS FOUND — retirement gate CLOSED. See report.");
  process.exit(1);
}

/** True only when directly invoked (tsx scripts/equivalence-diff.ts). */
function isMain(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  const self = fileURLToPath(import.meta.url);
  try {
    return realpathSync(entry) === realpathSync(self);
  } catch {
    return path.resolve(entry).toLowerCase() === path.resolve(self).toLowerCase();
  }
}

if (isMain()) {
  main().catch((err) => {
    console.error("[equiv] failed:", err instanceof Error ? (err.stack ?? err.message) : err);
    process.exit(1);
  });
}
