/**
 * Manual-protection comparator (read-only DB diff).
 *
 * Loads every `works` row (joined with `book_details`) into memory once
 * and matches each merged pipeline book against:
 *   - exact slug equality
 *   - or normalized-title equality (because manual books carry a
 *     `-<id>` suffix on their slug — `slugify("The Talon of Horus")`
 *     is `the-talon-of-horus` but the DB row is `the-talon-of-horus-bl01`)
 *
 * Categorization:
 *   - DB row found AND `sourceKind = 'manual'` → `skipped_manual`
 *     (diff is computed for visibility but the apply step in 3d will skip)
 *   - DB row found, non-manual, with field changes → `updated`
 *   - DB row found, non-manual, no field changes → `skipped_unchanged`
 *   - no DB row → `added`
 */
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { bookDetails, works } from "@/db/schema";
import { slugify } from "@/lib/slug";

import type {
  AddedEntry,
  DiffFieldChange,
  FieldName,
  MergedBook,
  SkippedManualEntry,
  SkippedUnchangedEntry,
  SourcePayloadFields,
  UpdatedEntry,
} from "./types";

interface DbBook {
  workId: string;
  slug: string;
  title: string;
  releaseYear: number | null;
  startY: number | null;
  endY: number | null;
  synopsis: string | null;
  coverUrl: string | null;
  sourceKind: string;
  confidence: string | null;
  // book_details
  isbn13: string | null;
  isbn10: string | null;
  seriesId: string | null;
  seriesIndex: number | null;
  pageCount: number | null;
  format: string | null;
  availability: string | null;
  // Phase 3c (Migration 0006): Reader-Rating-Capture. Drizzle gibt numeric als
  // string zurück, Number-Comparison passiert in `scalarEqual`.
  rating: string | null;
  ratingSource: string | null;
  ratingCount: number | null;
}

let cachedDbBooks: DbBook[] | null = null;
let cachedDbBooksByNormalizedSlug: Map<string, DbBook> | null = null;

/**
 * Fetch all works + book_details once and cache for the duration of the
 * process. The comparator is read-only so the cache is never invalidated.
 */
export async function loadDbBooks(): Promise<{
  rows: DbBook[];
  byNormalizedSlug: Map<string, DbBook>;
}> {
  if (cachedDbBooks && cachedDbBooksByNormalizedSlug) {
    return { rows: cachedDbBooks, byNormalizedSlug: cachedDbBooksByNormalizedSlug };
  }

  const rows = await db
    .select({
      workId: works.id,
      slug: works.slug,
      title: works.title,
      releaseYear: works.releaseYear,
      startY: works.startY,
      endY: works.endY,
      synopsis: works.synopsis,
      coverUrl: works.coverUrl,
      sourceKind: works.sourceKind,
      confidence: works.confidence,
      isbn13: bookDetails.isbn13,
      isbn10: bookDetails.isbn10,
      seriesId: bookDetails.seriesId,
      seriesIndex: bookDetails.seriesIndex,
      pageCount: bookDetails.pageCount,
      format: bookDetails.format,
      availability: bookDetails.availability,
      rating: bookDetails.rating,
      ratingSource: bookDetails.ratingSource,
      ratingCount: bookDetails.ratingCount,
    })
    .from(works)
    .leftJoin(bookDetails, eq(bookDetails.workId, works.id));

  const normalized: DbBook[] = rows.map((r) => ({
    ...r,
    startY: r.startY === null ? null : Number(r.startY),
    endY: r.endY === null ? null : Number(r.endY),
  }));

  const byNormalizedSlug = new Map<string, DbBook>();
  for (const row of normalized) {
    // Match key: slugified title (no id-suffix). Lets pipeline slugs (which
    // never carry a manual id-suffix) align with manual DB slugs.
    const key = slugify(row.title);
    byNormalizedSlug.set(key, row);
    // Also index by literal DB slug, in case the pipeline ever produces
    // an exact match (e.g. a non-manual book).
    byNormalizedSlug.set(row.slug, row);
  }

  cachedDbBooks = normalized;
  cachedDbBooksByNormalizedSlug = byNormalizedSlug;
  return { rows: normalized, byNormalizedSlug };
}

export type ComparedEntry =
  | { kind: "added"; entry: AddedEntry }
  | { kind: "updated"; entry: UpdatedEntry }
  | { kind: "skipped_manual"; entry: SkippedManualEntry }
  | { kind: "skipped_unchanged"; entry: SkippedUnchangedEntry };

/**
 * Compare one merged pipeline book against the DB.
 */
export async function compareBook(
  wikipediaTitle: string,
  merged: MergedBook,
): Promise<ComparedEntry> {
  const { byNormalizedSlug } = await loadDbBooks();

  const dbBook =
    byNormalizedSlug.get(merged.slug) ??
    byNormalizedSlug.get(slugify(wikipediaTitle));

  if (!dbBook) {
    return {
      kind: "added",
      entry: {
        wikipediaTitle,
        slug: merged.slug,
        payload: merged,
      },
    };
  }

  const diff = computeDiff(merged.fields, dbBook);

  if (dbBook.sourceKind === "manual") {
    return {
      kind: "skipped_manual",
      entry: {
        slug: merged.slug,
        dbSlug: dbBook.slug,
        wouldBeDiff: diff,
      },
    };
  }

  if (Object.keys(diff).length === 0) {
    return {
      kind: "skipped_unchanged",
      entry: { slug: merged.slug, dbSlug: dbBook.slug },
    };
  }

  return {
    kind: "updated",
    entry: { slug: merged.slug, dbSlug: dbBook.slug, diff },
  };
}

// =============================================================================
// Field-by-field diff
// =============================================================================

/**
 * Map merged-payload field names to the DB column they correspond to.
 * Junction-shaped fields (authorNames, factionNames, ...) are intentionally
 * not diffed in 3a — junction comparison needs FK resolution which is a
 * 3d concern. They will surface in `added.payload` for visibility but
 * won't appear in `diff`.
 */
const SCALAR_FIELD_TO_DB: Partial<Record<FieldName, keyof DbBook>> = {
  title: "title",
  releaseYear: "releaseYear",
  startY: "startY",
  endY: "endY",
  synopsis: "synopsis",
  coverUrl: "coverUrl",
  isbn13: "isbn13",
  isbn10: "isbn10",
  seriesId: "seriesId",
  seriesIndex: "seriesIndex",
  pageCount: "pageCount",
  format: "format",
  availability: "availability",
  // Phase 3c — facetIds NICHT hier (Junction-Insert ist 3d).
  rating: "rating",
  ratingSource: "ratingSource",
  ratingCount: "ratingCount",
};

function computeDiff(
  merged: SourcePayloadFields,
  db: DbBook,
): Record<string, DiffFieldChange> {
  const out: Record<string, DiffFieldChange> = {};
  for (const [field, dbCol] of Object.entries(SCALAR_FIELD_TO_DB) as Array<
    [FieldName, keyof DbBook]
  >) {
    const newValue = merged[field];
    if (newValue === undefined) continue;
    const oldValue = db[dbCol] ?? null;
    if (!scalarEqual(oldValue, newValue)) {
      out[field] = { old: oldValue, new: newValue };
    }
  }
  return out;
}

function scalarEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a === "string" && typeof b === "string") {
    return a.trim() === b.trim();
  }
  if (typeof a === "number" && typeof b === "number") return a === b;
  // String-number cross-comparison (DB returns numerics as strings).
  if (typeof a === "string" && typeof b === "number") return Number(a) === b;
  if (typeof a === "number" && typeof b === "string") return a === Number(b);
  return false;
}
