/**
 * Roster extension merge — additive book promotion for `import:ssot-roster`.
 *
 * The Excel SSOT (`Warhammer_Books_SSOT.xlsx`) is the FROZEN original 859 books.
 * Books detected by the weekly refresh pass (`refresh:check`) and greenlit by the
 * maintainer are NOT hand-added to the binary Excel — they accrete in
 * `scripts/seed-data/book-roster.extension.json` (rows pasted verbatim from a
 * refresh `proposal.json`). `import:ssot-roster` reads the Excel AND this file and
 * appends the extension books to `book-roster.json`, after which the ENTIRE
 * existing pipeline (`loop:next` → curate override → `apply:override`) absorbs
 * them exactly like Excel books — same tagging, same DB path. That closes the
 * "say yes to a detected book → it lands in the DB the usual way" loop.
 *
 * Pure: no FS / DB / network. The caller (`import-ssot-roster.ts`) does the file
 * read and folds the returned issues into its own loud-error gate. Unit-tested
 * offline via `scripts/test-roster-extension.ts`.
 *
 * Determinism: extension books carry a synthetic `sourceRow` (0 — they have no
 * Excel row) and are sorted into `book-roster.json` by `externalBookId` alongside
 * the Excel rows, so an UNCHANGED extension yields byte-identical output (an empty
 * or absent extension reproduces the pre-extension roster exactly).
 */
import { slugify } from "@/lib/slug";

import type { BookFormat, RosterBook } from "./seed-data/types";

/** Path of the additive extension file, relative to the repo root (= cwd). */
export const ROSTER_EXTENSION_FILE = "scripts/seed-data/book-roster.extension.json";

/** `sourceRow` value for extension books — 0 means "synthetic, not an Excel row". */
export const EXTENSION_SOURCE_ROW = 0;

/**
 * The DB `book_format` enum values the loader accepts, kept in lockstep with
 * `src/db/schema.ts` `bookFormat` and the `TYPE_MAP` values in
 * `import-ssot-roster.ts`. `scripts/test-roster-extension.ts` asserts this set
 * equals `bookFormat.enumValues`, so the three never drift.
 */
export const VALID_BOOK_FORMATS: ReadonlySet<BookFormat> = new Set<BookFormat>([
  "novel",
  "novella",
  "short_story",
  "anthology",
  "audio_drama",
  "omnibus",
  "collection",
  "artbook",
  "scriptbook",
]);

/** External-id pattern — shared with the roster + `loop:next` domain batching. */
const EXTERNAL_ID_RE = /^(?:W40K|HH)-\d{4}$/;

/** One validation problem in the extension file. */
export interface ExtensionIssue {
  /** 0-based index into the extension `books[]` array; −1 for a file-level issue. */
  index: number;
  message: string;
}

export interface ParseExtensionResult {
  books: RosterBook[];
  issues: ExtensionIssue[];
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Required non-empty string → trimmed value, or null when missing/blank/non-string. */
function reqString(o: Record<string, unknown>, key: string): string | null {
  const v = o[key];
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s === "" ? null : s;
}

/** Optional string → trimmed value | null (absent/blank), or `"invalid"` for a non-string. */
function optString(o: Record<string, unknown>, key: string): string | null | "invalid" {
  const v = o[key];
  if (v === undefined || v === null) return null;
  if (typeof v !== "string") return "invalid";
  const s = v.trim();
  return s === "" ? null : s;
}

/** Array of non-empty strings (absent → `[]`), or `"invalid"` on any non-string/blank member. */
function stringArray(o: Record<string, unknown>, key: string): string[] | "invalid" {
  const v = o[key];
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) return "invalid";
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== "string") return "invalid";
    const s = item.trim();
    if (s === "") return "invalid";
    out.push(s);
  }
  return out;
}

/**
 * Validate one extension book object → a `RosterBook` (with synthetic `sourceRow`),
 * or a single `ExtensionIssue`. `seenIds` / `seenSlugs` carry the Excel ids/slugs
 * PLUS the extension rows already accepted, so a duplicate against either source
 * is caught. Extra keys (e.g. the proposal's `source_kind` / `confidence`
 * provenance) are ignored, so a `proposal.json` row pastes in verbatim.
 */
export function parseExtensionBook(
  raw: unknown,
  index: number,
  seenIds: ReadonlySet<string>,
  seenSlugs: ReadonlySet<string>,
): { book: RosterBook | null; issue: ExtensionIssue | null } {
  const fail = (message: string): { book: null; issue: ExtensionIssue } => ({
    book: null,
    issue: { index, message },
  });
  if (!isObject(raw)) return fail("book entry must be an object");

  const externalBookId = reqString(raw, "externalBookId");
  if (!externalBookId) return fail("`externalBookId` is required (non-empty string)");
  if (!EXTERNAL_ID_RE.test(externalBookId)) {
    return fail(
      `\`externalBookId\` = "${externalBookId}" must match W40K-#### or HH-#### ` +
        `(4 digits) — loop:next batches by that prefix`,
    );
  }
  if (seenIds.has(externalBookId)) {
    return fail(`\`externalBookId\` = "${externalBookId}" collides with an existing roster/extension id`);
  }

  const slug = reqString(raw, "slug");
  if (!slug) return fail(`\`slug\` is required for ${externalBookId}`);
  if (slug !== slugify(slug)) {
    return fail(
      `\`slug\` = "${slug}" for ${externalBookId} is not a clean slug (expected "${slugify(slug)}")`,
    );
  }
  if (seenSlugs.has(slug)) {
    return fail(
      `\`slug\` = "${slug}" for ${externalBookId} collides with an existing roster/extension slug — pick another`,
    );
  }

  const title = reqString(raw, "title");
  if (!title) return fail(`\`title\` is required for ${externalBookId}`);

  const authors = stringArray(raw, "authors");
  if (authors === "invalid") return fail(`\`authors\` for ${externalBookId} must be an array of non-empty strings`);
  const editors = stringArray(raw, "editors");
  if (editors === "invalid") return fail(`\`editors\` for ${externalBookId} must be an array of non-empty strings`);

  const noteRaw = raw.editorialNote;
  let editorialNote: "various" | null;
  if (noteRaw === undefined || noteRaw === null) editorialNote = null;
  else if (noteRaw === "various") editorialNote = "various";
  else return fail(`\`editorialNote\` for ${externalBookId} must be "various" or null`);

  const yr = raw.releaseYear;
  let releaseYear: number | null;
  if (yr === undefined || yr === null) releaseYear = null;
  else if (typeof yr === "number" && Number.isInteger(yr) && yr > 0) releaseYear = yr;
  else return fail(`\`releaseYear\` for ${externalBookId} must be a positive integer or null`);

  const fmtRaw = raw.format;
  if (typeof fmtRaw !== "string" || !VALID_BOOK_FORMATS.has(fmtRaw as BookFormat)) {
    const allowed = [...VALID_BOOK_FORMATS].join(", ");
    return fail(`\`format\` for ${externalBookId} = ${JSON.stringify(fmtRaw)} must be one of {${allowed}}`);
  }
  const format = fmtRaw as BookFormat;

  const seriesHint = optString(raw, "seriesHint");
  if (seriesHint === "invalid") return fail(`\`seriesHint\` for ${externalBookId} must be a string or null`);
  const sourceUrl = optString(raw, "sourceUrl");
  if (sourceUrl === "invalid") return fail(`\`sourceUrl\` for ${externalBookId} must be a string or null`);
  const notes = optString(raw, "notes");
  if (notes === "invalid") return fail(`\`notes\` for ${externalBookId} must be a string or null`);

  // Construct in the SAME key order as `RosterBook` declares — re-run determinism
  // depends on this (mirrors `import-ssot-roster.ts` Pass 3).
  const book: RosterBook = {
    externalBookId,
    slug,
    title,
    authors,
    editors,
    editorialNote,
    releaseYear,
    format,
    seriesHint,
    sourceUrl,
    notes,
    sourceRow: EXTENSION_SOURCE_ROW,
  };
  return { book, issue: null };
}

/**
 * Validate the whole extension payload. `excelIds` / `excelSlugs` are the
 * Excel-derived roster's ids/slugs; extension rows are checked against those AND
 * each other (first occurrence wins, later duplicates become issues). Collections
 * are NOT supported in the extension yet — a non-empty `collections[]` is a
 * loud-error (new-anthology membership goes through the Excel SSOT). Never throws;
 * an empty or `books`-less payload is a valid no-op.
 */
export function parseExtensionFile(
  raw: unknown,
  excelIds: ReadonlySet<string>,
  excelSlugs: ReadonlySet<string>,
): ParseExtensionResult {
  const issues: ExtensionIssue[] = [];
  const books: RosterBook[] = [];

  if (!isObject(raw)) {
    return { books, issues: [{ index: -1, message: "extension top-level must be a JSON object" }] };
  }

  const collections = raw.collections;
  if (Array.isArray(collections) && collections.length > 0) {
    issues.push({
      index: -1,
      message:
        `collections[] (${collections.length} edge(s)) is not supported in the extension yet — ` +
        `add collection membership for new anthologies via the Excel SSOT (see weekly-refresh-runbook.md)`,
    });
  }

  const rawBooks = raw.books;
  if (rawBooks === undefined || rawBooks === null) {
    return { books, issues }; // no `books` key → empty extension (valid no-op)
  }
  if (!Array.isArray(rawBooks)) {
    issues.push({ index: -1, message: "`books` must be an array" });
    return { books, issues };
  }

  const seenIds = new Set<string>(excelIds);
  const seenSlugs = new Set<string>(excelSlugs);
  for (let i = 0; i < rawBooks.length; i++) {
    const { book, issue } = parseExtensionBook(rawBooks[i], i, seenIds, seenSlugs);
    if (issue) {
      issues.push(issue);
      continue;
    }
    if (book) {
      seenIds.add(book.externalBookId);
      seenSlugs.add(book.slug);
      books.push(book);
    }
  }
  return { books, issues };
}
