/**
 * book-file.ts — Brief 170 Teil A. Per-book SSOT source files.
 *
 * A `scripts/seed-data/books/<slug>.json` file is the additive, git-versioned
 * home for ONE new book — replacing the batch-file / slot / `loop:next` dance
 * for fresh releases. Legacy stays authoritative for the existing corpus; this
 * is strictly additive (Brief 170 §Constraints).
 *
 * This module is PURE (no DB, no network): file shape, schema validation,
 * dup-guard against the effective corpus (Legacy roster + `books/` folder),
 * additive-mode id allocation, and the projection of a per-book file into the
 * shared `RosterBook` / `OverrideBook` / `SeriesAnchor` shapes consumed by
 * `book-apply-shared.ts`. DB writes live in `apply-book.ts`.
 *
 * Lossless contract (Brief 170 §Design): `authors[]`, `editors[]`,
 * `authorship.editorialNote`, free `notes`, and the raw override curation
 * (`facetIds`, `factions[]`, `locations[]`, `characters[]`, `flags[]`, `rating`)
 * round-trip verbatim — no normalization, no abbreviation.
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { bookFormat } from "@/db/schema";
import { slugify } from "@/lib/slug";

import type { OverrideBook, OverrideCuration, SeriesAnchor } from "./book-apply-shared";
import type { RosterBook, RosterCollection } from "./seed-data/types";

export const BOOKS_DIR = resolve(process.cwd(), "scripts", "seed-data", "books");

/** The 9-value `book_format` DB enum — mirrored, drift-guarded in tests. */
export const VALID_BOOK_FORMATS: ReadonlySet<string> = new Set(bookFormat.enumValues);

/** Namespace + 4-digit suffix, e.g. `W40K-0600` / `HH-0298`. */
export const BOOK_ID_RE = /^(W40K|HH)-\d{4}$/;

export const BOOK_FILE_SCHEMA = "book-v1" as const;

// =============================================================================
// Types
// =============================================================================

/** Export/datei provenance. In Teil A NOT DB-materialized (no external_links row). */
export interface BookFileSource {
  /** e.g. `"track_of_words"`, `"black_library"`, `"manual"`. */
  kind: string;
  /** Lands in `works`-adjacent `RosterBook.sourceUrl`; creates no link row in Teil A. */
  url: string | null;
  confidence: number | null;
}

/** One member edge owned by a collection/anthology file (`collections.collects[]`). */
export interface BookFileCollectMember {
  externalBookId: string;
  /** 0-based position; defaults to array index when omitted. */
  displayOrder?: number;
  confidence?: number | null;
  basis?: string | null;
}

export interface BookFileCollections {
  /** Authoritative member edges — only THIS (collection) file owns them. */
  collects: BookFileCollectMember[];
  /**
   * Generated read-only back-reference (which collections contain this book).
   * IGNORED by the applier (Brief 170 §Design "Collections und Personen").
   */
  containedIn?: unknown;
}

export interface BookFileV1 {
  $schema: typeof BOOK_FILE_SCHEMA;
  externalBookId: string;
  slug: string;
  title: string;
  authors: string[];
  editors: string[];
  authorship: { editorialNote: "various" | null };
  releaseYear: number | null;
  /** One of the 9 `book_format` enum values. */
  format: string;
  seriesHint: string | null;
  /** Canonical `series.id` reference, or null. Replaces the legacy hard-coded map. */
  series: string | null;
  seriesIndex: number | null;
  notes: string | null;
  source: BookFileSource;
  curation: OverrideCuration;
  collections: BookFileCollections;
}

export interface LoadedBookFile {
  filename: string;
  book: BookFileV1;
}

export interface BookFileIssue {
  filename: string;
  externalBookId: string | null;
  message: string;
}

// =============================================================================
// Raw read (sync — usable from both async appliers and sync refresh)
// =============================================================================

/** Sorted `*.json` filenames under `dir`; `[]` if the folder is absent (missing = empty). */
export function listBookFiles(dir: string = BOOKS_DIR): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return []; // folder not created yet — additive, not an error
  }
  return entries.filter((f) => f.endsWith(".json")).sort();
}

export function readBookFilesRaw(dir: string = BOOKS_DIR): Array<{ filename: string; raw: unknown }> {
  return listBookFiles(dir).map((filename) => {
    const raw = JSON.parse(readFileSync(resolve(dir, filename), "utf8")) as unknown;
    return { filename, raw };
  });
}

// =============================================================================
// Validation
// =============================================================================

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function validateEntities(v: unknown, label: string, issues: string[]): void {
  if (!Array.isArray(v)) {
    issues.push(`curation.${label} must be an array`);
    return;
  }
  v.forEach((e, i) => {
    if (!isObject(e) || typeof e.name !== "string" || typeof e.role !== "string") {
      issues.push(`curation.${label}[${i}] must be { name: string, role: string }`);
    }
  });
}

/**
 * Validate one parsed per-book file against the `book-v1` shape. Returns the
 * typed book when clean, plus a list of human-readable issues. Mirrors the
 * `parseExtensionBook` `{book, issue}` idiom of `roster-extension.ts`.
 */
export function validateBookFile(
  raw: unknown,
  filename: string,
): { book: BookFileV1 | null; issues: string[] } {
  const issues: string[] = [];
  if (!isObject(raw)) {
    return { book: null, issues: [`${filename}: not a JSON object`] };
  }

  if (raw.$schema !== BOOK_FILE_SCHEMA) {
    issues.push(`$schema must be "${BOOK_FILE_SCHEMA}" (got ${JSON.stringify(raw.$schema)})`);
  }

  const externalBookId = raw.externalBookId;
  if (typeof externalBookId !== "string" || !BOOK_ID_RE.test(externalBookId)) {
    issues.push(`externalBookId must match ${BOOK_ID_RE} (got ${JSON.stringify(externalBookId)})`);
  }

  const slug = raw.slug;
  if (typeof slug !== "string" || slug.length === 0) {
    issues.push("slug must be a non-empty string");
  } else if (slugify(slug) !== slug) {
    issues.push(`slug must be clean (slugify(slug) === slug); got "${slug}" → "${slugify(slug)}"`);
  }

  if (typeof raw.title !== "string" || raw.title.length === 0) {
    issues.push("title must be a non-empty string");
  }

  if (!isStringArray(raw.authors)) issues.push("authors must be a string[]");
  else if (raw.authors.some((a) => a.trim().length === 0)) issues.push("authors[] must not contain empty strings");
  if (!isStringArray(raw.editors)) issues.push("editors must be a string[]");
  else if (raw.editors.some((e) => e.trim().length === 0)) issues.push("editors[] must not contain empty strings");

  if (!isObject(raw.authorship) || !(raw.authorship.editorialNote === "various" || raw.authorship.editorialNote === null)) {
    issues.push('authorship.editorialNote must be "various" or null');
  }

  if (!(raw.releaseYear === null || (typeof raw.releaseYear === "number" && Number.isInteger(raw.releaseYear) && raw.releaseYear > 0))) {
    issues.push("releaseYear must be a positive integer or null");
  }

  if (typeof raw.format !== "string" || !VALID_BOOK_FORMATS.has(raw.format)) {
    issues.push(`format must be one of the ${VALID_BOOK_FORMATS.size} book_format enum values (got ${JSON.stringify(raw.format)})`);
  }

  if (!(raw.seriesHint === null || typeof raw.seriesHint === "string")) issues.push("seriesHint must be a string or null");
  if (!(raw.series === null || typeof raw.series === "string")) issues.push("series must be a series id string or null");
  if (!(raw.seriesIndex === null || (typeof raw.seriesIndex === "number" && Number.isInteger(raw.seriesIndex)))) {
    issues.push("seriesIndex must be an integer or null");
  }
  if (!(raw.notes === null || typeof raw.notes === "string")) issues.push("notes must be a string or null");

  // source
  if (!isObject(raw.source)) {
    issues.push("source must be an object { kind, url, confidence }");
  } else {
    if (typeof raw.source.kind !== "string" || raw.source.kind.length === 0) issues.push("source.kind must be a non-empty string");
    if (!(raw.source.url === null || typeof raw.source.url === "string")) issues.push("source.url must be a string or null");
    if (!(raw.source.confidence === null || typeof raw.source.confidence === "number")) issues.push("source.confidence must be a number or null");
  }

  // curation
  if (!isObject(raw.curation)) {
    issues.push("curation must be an object");
  } else {
    const c = raw.curation;
    if (typeof c.synopsis !== "string" || c.synopsis.length === 0) issues.push("curation.synopsis must be a non-empty string");
    if (!isStringArray(c.facetIds)) issues.push("curation.facetIds must be a string[]");
    validateEntities(c.factions, "factions", issues);
    validateEntities(c.locations, "locations", issues);
    validateEntities(c.characters, "characters", issues);
    if (!Array.isArray(c.flags)) issues.push("curation.flags must be an array");
    if (!(c.rating === undefined || isObject(c.rating))) issues.push("curation.rating, if present, must be an object");
  }

  // collections
  if (!isObject(raw.collections) || !Array.isArray((raw.collections as Record<string, unknown>).collects)) {
    issues.push("collections must be an object with a collects[] array");
  } else {
    const collects = (raw.collections as { collects: unknown[] }).collects;
    collects.forEach((m, i) => {
      if (!isObject(m) || typeof m.externalBookId !== "string" || !BOOK_ID_RE.test(m.externalBookId)) {
        issues.push(`collections.collects[${i}].externalBookId must match ${BOOK_ID_RE}`);
      } else if (m.externalBookId === externalBookId) {
        issues.push(`collections.collects[${i}] references the collection itself (${externalBookId})`);
      }
      if (m && isObject(m) && m.displayOrder !== undefined && !(typeof m.displayOrder === "number" && Number.isInteger(m.displayOrder) && m.displayOrder >= 0)) {
        issues.push(`collections.collects[${i}].displayOrder must be a non-negative integer when present`);
      }
    });
  }

  const eid = typeof externalBookId === "string" ? externalBookId : null;
  return {
    book: issues.length === 0 ? (raw as unknown as BookFileV1) : null,
    issues: issues.map((m) => (eid ? `${eid}: ${m}` : m)),
  };
}

/** Load + validate every file under `dir`. Issues are collected, never thrown. */
export function loadBookFiles(dir: string = BOOKS_DIR): {
  books: LoadedBookFile[];
  issues: BookFileIssue[];
} {
  const books: LoadedBookFile[] = [];
  const issues: BookFileIssue[] = [];
  for (const { filename, raw } of readBookFilesRaw(dir)) {
    const { book, issues: fileIssues } = validateBookFile(raw, filename);
    const eid = isObject(raw) && typeof raw.externalBookId === "string" ? raw.externalBookId : null;
    for (const m of fileIssues) issues.push({ filename, externalBookId: eid, message: m });
    if (book) books.push({ filename, book });
  }
  return { books, issues };
}

// =============================================================================
// Dup-guard (effective corpus = Legacy roster + folder)
// =============================================================================

interface CorpusBookRef {
  externalBookId: string;
  slug: string;
}

/**
 * Collisions of slug or externalBookId — both INTRA-folder and against the
 * Legacy roster. The dup-guard is "hard red" (Brief 170 §Design): the same
 * identity must never exist in two worlds.
 */
export function findCorpusCollisions(
  folder: LoadedBookFile[],
  rosterBooks: CorpusBookRef[],
): string[] {
  const issues: string[] = [];
  const rosterIds = new Map(rosterBooks.map((b) => [b.externalBookId, b]));
  const rosterSlugs = new Map(rosterBooks.map((b) => [b.slug, b]));

  const seenIds = new Map<string, string>(); // id → filename
  const seenSlugs = new Map<string, string>();
  for (const { filename, book } of folder) {
    if (rosterIds.has(book.externalBookId)) {
      issues.push(`${book.externalBookId} (${filename}) collides with a Legacy roster book of the same externalBookId`);
    }
    if (rosterSlugs.has(book.slug)) {
      issues.push(`${book.slug} (${filename}) collides with a Legacy roster book of the same slug`);
    }
    const idDup = seenIds.get(book.externalBookId);
    if (idDup) issues.push(`externalBookId ${book.externalBookId} duplicated across ${idDup} and ${filename}`);
    else seenIds.set(book.externalBookId, filename);
    const slugDup = seenSlugs.get(book.slug);
    if (slugDup) issues.push(`slug ${book.slug} duplicated across ${slugDup} and ${filename}`);
    else seenSlugs.set(book.slug, filename);
  }
  return issues;
}

/** collects[] members must resolve somewhere in the effective corpus, else stop loud. */
export function findUnresolvableCollectMembers(
  folder: LoadedBookFile[],
  knownExternalIds: ReadonlySet<string>,
): string[] {
  const issues: string[] = [];
  for (const { filename, book } of folder) {
    for (const m of book.collections.collects) {
      if (!knownExternalIds.has(m.externalBookId)) {
        issues.push(`${book.externalBookId} (${filename}) collects unknown member ${m.externalBookId}`);
      }
    }
  }
  return issues;
}

// =============================================================================
// Additive-mode id allocation
// =============================================================================

export type SeriesPrefix = "HH" | "W40K";

/** Effective per-prefix max suffix across Legacy roster AND the per-book folder. */
export function effectiveMaxSuffix(
  rosterBooks: CorpusBookRef[],
  folder: LoadedBookFile[],
): Map<SeriesPrefix, number> {
  const max = new Map<SeriesPrefix, number>([
    ["HH", 0],
    ["W40K", 0],
  ]);
  const scan = (externalBookId: string): void => {
    const m = externalBookId.match(BOOK_ID_RE);
    if (!m) return;
    const prefix = m[1] as SeriesPrefix;
    const n = Number.parseInt(externalBookId.slice(prefix.length + 1), 10);
    if (n > (max.get(prefix) ?? 0)) max.set(prefix, n);
  };
  for (const b of rosterBooks) scan(b.externalBookId);
  for (const { book } of folder) scan(book.externalBookId);
  return max;
}

/** Next free id for a prefix in `additive` mode (effective max + 1). */
export function nextEffectiveId(
  prefix: SeriesPrefix,
  rosterBooks: CorpusBookRef[],
  folder: LoadedBookFile[],
): string {
  const n = (effectiveMaxSuffix(rosterBooks, folder).get(prefix) ?? 0) + 1;
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

// =============================================================================
// Projection into the shared apply shapes
// =============================================================================

/** Project a per-book file to the shared `RosterBook` (hard-field authority). */
export function projectToRosterBook(b: BookFileV1): RosterBook {
  return {
    externalBookId: b.externalBookId,
    slug: b.slug,
    title: b.title,
    authors: b.authors,
    editors: b.editors,
    editorialNote: b.authorship.editorialNote,
    releaseYear: b.releaseYear,
    format: b.format as RosterBook["format"],
    seriesHint: b.seriesHint,
    sourceUrl: b.source.url,
    notes: b.notes,
    // Per-book files are not Excel rows; 0 marks synthetic origin (matches the
    // extension-merge `EXTENSION_SOURCE_ROW` convention).
    sourceRow: 0,
  };
}

/** Project a per-book file to the shared `OverrideBook` (soft-curation authority). */
export function projectToOverrideBook(b: BookFileV1): OverrideBook {
  return {
    externalBookId: b.externalBookId,
    slug: b.slug,
    overrides: b.curation,
  };
}

/** The series anchor for `applyBook` — from the file, replacing the legacy id map. */
export function seriesAnchorOf(b: BookFileV1): SeriesAnchor | null {
  return b.series ? { id: b.series, index: b.seriesIndex } : null;
}

/**
 * Project the `collects[]` of every collection file into `RosterCollection`
 * edges. The collection file OWNS the edge (Brief 170 §Design): the edge's
 * `collectionExternalId` is the file's own id, `contentExternalId` each member.
 */
export function collectionEdgesOf(books: BookFileV1[]): RosterCollection[] {
  const edges: RosterCollection[] = [];
  for (const b of books) {
    b.collections.collects.forEach((m, i) => {
      edges.push({
        contentExternalId: m.externalBookId,
        collectionExternalId: b.externalBookId,
        displayOrder: m.displayOrder ?? i,
        confidence: m.confidence ?? null,
        basis: m.basis ?? null,
      });
    });
  }
  return edges;
}
