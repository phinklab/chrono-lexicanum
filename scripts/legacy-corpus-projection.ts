/**
 * legacy-corpus-projection.ts — Brief 171 Teil B. The Legacy corpus projection,
 * extracted from `apply-override.ts` so the one-shot migration converter AND the
 * equivalence harness share ONE definition — never a parallel re-implementation
 * that could silently drift from the (now retired) batch applier.
 *
 * "Legacy projection" = the rule that turns a `book-roster.json` row + its
 * matching `manual-overrides-ssot-*.json` book + the hard-coded
 * `SERIES_BY_EXTERNAL_ID` anchor into the `(OverrideBook, RosterBook,
 * SeriesAnchor)` triple the shared writer (`book-apply-shared.applyBook` /
 * `computeBookRows`) consumes, plus the flat `collections[]` edge list.
 *
 * PURE: no DB, no network (only synchronous reads of committed seed JSON). After
 * Teil B retirement `apply-override.ts` is a neutralized stub; this module keeps
 * the Legacy projection alive as BOTH the migration source AND the equivalence
 * golden, both fully DB-free (parity-by-construction at the projection — Brief
 * 171 §Aequivalenz-Diff).
 *
 * The 8-entry series map moved here VERBATIM from `apply-override.ts`
 * (`SERIES_BY_EXTERNAL_ID`) — the gate-critical series-parity source.
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Type-only import — NEVER a value import from book-apply-shared here. That
// module loads `@/db/client` at import time (throws without DATABASE_URL); this
// projection must stay DB-free so the converter + the projection-level harness
// run with no DB env at all (Brief 171 §Aequivalenz-Diff "Parität-by-construction").
import type {
  OverrideBook,
  RosterBook,
  RosterFile,
  SeriesAnchor,
} from "./book-apply-shared";
import type { RosterCollection } from "./seed-data/types";

/** Local copy of the seed dir — defined here (not imported) to stay DB-free. */
const SEED_DIR = resolve(process.cwd(), "scripts", "seed-data");

// =============================================================================
// Series anchors (moved VERBATIM from apply-override.ts — Brief 171 §Konverter)
// =============================================================================

/**
 * Eisenhorn/Ravenor are the ONLY seeded series. Legacy set
 * `book_details.series_id` / `series_index` for exactly these 8 external ids;
 * every other book stayed NULL. Bequin and The Magos have no series row and stay
 * NULL until a future brief decides whether to add one. The converter must
 * reproduce this map EXACTLY — never re-derive series from `seriesHint`, or the
 * equivalence diff breaks (Brief 171 §Serien-Parität).
 */
export const SERIES_BY_EXTERNAL_ID: Record<string, SeriesAnchor> = {
  "W40K-0001": { id: "eisenhorn", index: 1 },
  "W40K-0002": { id: "eisenhorn", index: 2 },
  "W40K-0003": { id: "eisenhorn", index: 3 },
  "W40K-0004": { id: "eisenhorn", index: null },
  "W40K-0005": { id: "ravenor", index: 1 },
  "W40K-0006": { id: "ravenor", index: 2 },
  "W40K-0007": { id: "ravenor", index: 3 },
  "W40K-0008": { id: "ravenor", index: null },
};

/** The series anchor for one external id, or null (the exact Legacy rule). */
export function seriesAnchorFor(externalBookId: string): SeriesAnchor | null {
  return SERIES_BY_EXTERNAL_ID[externalBookId] ?? null;
}

// =============================================================================
// Batch override loading (all 90 manual-overrides-ssot-*.json)
// =============================================================================

const ROSTER_PATH = resolve(SEED_DIR, "book-roster.json");
const EXTENSION_PATH = resolve(SEED_DIR, "book-roster.extension.json");

/** Matches every active batch file — the same shape `db-apply-scope.ts` parsed. */
export const BATCH_FILE_RE = /^manual-overrides-(ssot-(?:w40k|hh)-\d{3})\.json$/;

interface OverrideFile {
  $schema?: string;
  batch: string;
  books: OverrideBook[];
}

/** Sorted list of every `manual-overrides-ssot-*.json` filename under `dir`. */
export function listBatchFiles(dir: string = SEED_DIR): string[] {
  return readdirSync(dir)
    .filter((f) => BATCH_FILE_RE.test(f))
    .sort();
}

/**
 * Load every batch file and build the `externalBookId → OverrideBook` map. A
 * book appearing in two batches is a hard error (the Legacy corpus has none, and
 * a dup would make the projection ambiguous). Returns the map plus the batch
 * count for reporting.
 */
export function loadAllOverrideBooks(dir: string = SEED_DIR): {
  byExternalId: Map<string, OverrideBook>;
  batchCount: number;
} {
  const byExternalId = new Map<string, OverrideBook>();
  const firstSeenIn = new Map<string, string>();
  const dups: string[] = [];
  const files = listBatchFiles(dir);
  for (const filename of files) {
    const parsed = JSON.parse(readFileSync(resolve(dir, filename), "utf8")) as OverrideFile;
    for (const book of parsed.books) {
      if (byExternalId.has(book.externalBookId)) {
        dups.push(`${book.externalBookId} in ${filename} and ${firstSeenIn.get(book.externalBookId)}`);
        continue;
      }
      byExternalId.set(book.externalBookId, book);
      firstSeenIn.set(book.externalBookId, filename);
    }
  }
  if (dups.length > 0) {
    throw new Error(
      `[legacy-projection] ${dups.length} override book(s) appear in more than one batch:\n` +
        dups.map((d) => `  - ${d}`).join("\n"),
    );
  }
  return { byExternalId, batchCount: files.length };
}

// =============================================================================
// Roster + flat collections edge list
// =============================================================================

/** Synchronous roster read (DB-free) — the migration/harness counterpart of the async `loadRoster`. */
export function loadRosterSync(path: string = ROSTER_PATH): RosterFile {
  return JSON.parse(readFileSync(path, "utf8")) as RosterFile;
}

/**
 * The Legacy flat collection edge list — `book-roster.json.collections[]`
 * verbatim. The per-book side reproduces this via `collectionEdgesOf(bookFiles)`
 * (grouped by `collectionExternalId`); the harness set-compares the two.
 */
export function legacyCollectionEdges(roster: RosterFile): RosterCollection[] {
  return roster.collections;
}

// =============================================================================
// Extension provenance (file-level source, NOT a DB column)
// =============================================================================

/** The file-provenance carried by a `book-roster.extension.json` book. */
export interface LegacyBookSource {
  kind: string;
  url: string | null;
  confidence: number | null;
}

interface ExtensionBookRaw {
  externalBookId?: unknown;
  sourceUrl?: unknown;
  source_kind?: unknown;
  confidence?: unknown;
}

interface ExtensionFileRaw {
  books?: ExtensionBookRaw[];
}

/**
 * Map `externalBookId → {kind, url, confidence}` for the books that were
 * promoted through `book-roster.extension.json` (37 in the current corpus). The
 * extension carries `source_kind` + `confidence` provenance that was DROPPED
 * when `import:ssot-roster` merged it into `book-roster.json` — the converter
 * re-attaches it to the per-book `source` object. Books with no `source_kind`
 * (the 6 OFOB picks) keep their `sourceUrl` and fall back to `kind="manual"`.
 * Returns an empty map if the extension file is absent.
 */
export function loadExtensionProvenance(path: string = EXTENSION_PATH): Map<string, LegacyBookSource> {
  const out = new Map<string, LegacyBookSource>();
  let raw: ExtensionFileRaw;
  try {
    raw = JSON.parse(readFileSync(path, "utf8")) as ExtensionFileRaw;
  } catch {
    return out; // no extension → no extra provenance (valid)
  }
  for (const b of raw.books ?? []) {
    if (typeof b.externalBookId !== "string") continue;
    const kind = typeof b.source_kind === "string" && b.source_kind.length > 0 ? b.source_kind : "manual";
    const url = typeof b.sourceUrl === "string" && b.sourceUrl.length > 0 ? b.sourceUrl : null;
    const confidence = typeof b.confidence === "number" ? b.confidence : null;
    out.set(b.externalBookId, { kind, url, confidence });
  }
  return out;
}

// =============================================================================
// Convenience: the full legacy triple for one roster row
// =============================================================================

/**
 * The `(override, roster, series)` triple the shared writer consumes for one
 * book — the SINGLE place the migration converter and the equivalence golden
 * agree on what "the Legacy projection of book X" is.
 */
export interface LegacyTriple {
  override: OverrideBook;
  roster: RosterBook;
  series: SeriesAnchor | null;
}

/**
 * Build the legacy triple for every roster row. Halts hard (with the full list)
 * when a roster book has no matching override — "fehlende Kuration stoppt hart"
 * (Brief 171 §Konverter). The override `slug` (not the roster `slug`) is the one
 * the Legacy writer puts in `works.slug`; the caller is responsible for honoring
 * that (see the converter).
 */
export function buildLegacyTriples(
  roster: RosterFile,
  overrideByExternalId: Map<string, OverrideBook>,
): { triples: LegacyTriple[]; missingCuration: string[] } {
  const triples: LegacyTriple[] = [];
  const missingCuration: string[] = [];
  for (const rosterBook of roster.books) {
    const override = overrideByExternalId.get(rosterBook.externalBookId);
    if (!override) {
      missingCuration.push(rosterBook.externalBookId);
      continue;
    }
    triples.push({
      override,
      roster: rosterBook,
      series: seriesAnchorFor(rosterBook.externalBookId),
    });
  }
  return { triples, missingCuration };
}
