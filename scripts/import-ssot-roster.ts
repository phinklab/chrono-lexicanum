/**
 * SSOT-Loader: read the curated Maintainer-Excel and produce a deterministic
 * `scripts/seed-data/book-roster.json` that the Brief-058+ V2 pipeline reads
 * straight (skipping Wikipedia/TLBranson Discovery).
 *
 * Pure file I/O — no DB access. Re-run-stable: identical (Excel + roster
 * extension) → byte-identical JSON. All validation issues are collected; loader
 * prints the full list and exits non-zero rather than failing on the first problem.
 *
 * The Excel is the FROZEN original 859; books greenlit from the weekly refresh
 * pass accrete in `book-roster.extension.json` and are merged in below (Pass 3b),
 * so the rest of the pipeline (loop:next → override → apply:override) absorbs them
 * exactly like Excel rows. An empty/absent extension is a no-op. See roster-extension.ts.
 *
 * Usage:
 *   npm run import:ssot-roster
 *
 * Brief 057 (2026-05-10) — see sessions/2026-05-10-057-arch-excel-roster-import.md
 * for the contract (16-column Books sheet, 10-column Collection Links sheet).
 */
import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";

import { readSheet } from "read-excel-file/node";

import { slugify } from "@/lib/slug";

import { parseExtensionFile, ROSTER_EXTENSION_FILE } from "./roster-extension";

import type {
  BookFormat,
  RosterBook,
  RosterCollection,
  RosterFile,
} from "./seed-data/types";

// =============================================================================
// CONSTANTS
// =============================================================================

const SOURCE_FILE = "scripts/seed-data/source/Warhammer_Books_SSOT.xlsx";
const OUTPUT_FILE = "scripts/seed-data/book-roster.json";
const SCHEMA_VERSION = "1.0" as const;

const BOOKS_SHEET = "Books";
const LINKS_SHEET = "Collection Links";

// 16 columns — must match the Maintainer-Excel exactly. Order is the FROM-LEFT
// column order; the loader uses positional indexing rather than header-key
// lookups for re-run stability against header reorderings (which would still
// loud-error via the validation block below).
const BOOKS_HEADERS = [
  "Book ID",
  "Original #",
  "Source",
  "Title",
  "Author",
  "Release Date",
  "Release Year",
  "Type",
  "Section / Series",
  "Contained In Collection",
  "Contained In Book IDs",
  "Contained In Titles",
  "Collects Book IDs",
  "Collects Titles",
  "Source URL",
  "Relation Notes",
] as const;

const LINKS_HEADERS = [
  "Content Book ID",
  "Content Title",
  "Content Type",
  "Collection Book ID",
  "Collection Title",
  "Collection Type",
  "Relation",
  "Confidence",
  "Basis",
  "Source URL",
] as const;

// Excel-Type → DB-enum mapping. Keys are normalized (trim + collapse
// whitespace + lowercase). `BookFormat` derives from the Drizzle enum.
const TYPE_MAP: ReadonlyMap<string, BookFormat> = new Map<string, BookFormat>([
  ["novel", "novel"],
  ["novella", "novella"],
  ["short story", "short_story"],
  ["anthology", "anthology"],
  ["audio drama", "audio_drama"],
  ["omnibus", "omnibus"],
  ["collection", "collection"],
  ["artbook", "artbook"],
  ["scriptbook", "scriptbook"],
]);

// Author cell ≡ "various-marker" sentinel set. Empirics from real Excel
// (2026-05-10): only `"Various Authors"` appears, but the loader is
// case-insensitive and accepts the handful of plausible synonyms.
const VARIOUS_SENTINELS: ReadonlySet<string> = new Set([
  "various authors",
  "various",
  "various contributors",
]);

// Author parts that map to the "various"-editorial-note when found inside
// a multi-part author cell, e.g. `"Dan Abnett & Others"`.
const OTHERS_SENTINEL_PARTS: ReadonlySet<string> = new Set(["others"]);

// =============================================================================
// ISSUE COLLECTION
// =============================================================================

interface LoaderIssue {
  sheet: string;
  rowIndex: number;
  message: string;
}

interface LoaderWarning {
  sheet: string;
  rowIndex: number;
  message: string;
}

class IssueCollector {
  private readonly issues: LoaderIssue[] = [];
  private readonly warnings: LoaderWarning[] = [];

  pushIssue(issue: LoaderIssue): void {
    this.issues.push(issue);
  }

  pushWarning(warning: LoaderWarning): void {
    this.warnings.push(warning);
  }

  hasIssues(): boolean {
    return this.issues.length > 0;
  }

  printWarnings(): void {
    for (const w of this.warnings) {
      console.warn(`[warn ${w.sheet}:${w.rowIndex}] ${w.message}`);
    }
    if (this.warnings.length > 0) {
      console.warn(`[import-ssot-roster] ${this.warnings.length} warning(s).`);
    }
  }

  printIssuesAndExit(): never {
    for (const i of this.issues) {
      console.error(`[error ${i.sheet}:${i.rowIndex}] ${i.message}`);
    }
    console.error(
      `\n[import-ssot-roster] ${this.issues.length} issue(s) — aborting.`,
    );
    process.exit(1);
  }
}

// =============================================================================
// PURE COERCION HELPERS
// =============================================================================

function toTrimmedString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function normalizeWhitespace(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

function toPositiveInt(v: unknown): number | "missing" | "invalid" {
  if (v === null || v === undefined || v === "") return "missing";
  const n =
    typeof v === "number" ? v : Number.parseInt(String(v).trim(), 10);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return "invalid";
  return n;
}

function toConfidence(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n =
    typeof v === "number" ? v : Number.parseFloat(String(v).trim());
  if (!Number.isFinite(n) || n < 0 || n > 1) return null;
  // Sanitise float drift so byte-identical re-runs are guaranteed across
  // OS/Excel-version differences.
  return Math.round(n * 100) / 100;
}

// =============================================================================
// PURE PARSERS — exported for the validation smoke harness
// =============================================================================

export function normalizeFormat(
  raw: unknown,
  ctx: { sheet: string; rowIndex: number },
): BookFormat | LoaderIssue {
  const s = toTrimmedString(raw);
  if (!s) {
    return { ...ctx, message: `'Type' is empty` };
  }
  const key = normalizeWhitespace(s).toLowerCase();
  const mapped = TYPE_MAP.get(key);
  if (!mapped) {
    const allowed = [...TYPE_MAP.keys()]
      .map((k) => `"${k}"`)
      .join(", ");
    return {
      ...ctx,
      message: `'Type' = "${s}" not in {${allowed}} (case-insensitive)`,
    };
  }
  return mapped;
}

export interface SplitAuthorsResult {
  authors: string[];
  editors: string[];
  editorialNote: "various" | null;
}

export function splitAuthors(
  raw: unknown,
  ctx: { sheet: string; rowIndex: number },
): SplitAuthorsResult | LoaderIssue {
  const s = toTrimmedString(raw);
  if (!s) {
    return { authors: [], editors: [], editorialNote: null };
  }
  // Whole-cell sentinel.
  if (VARIOUS_SENTINELS.has(s.toLowerCase())) {
    return { authors: [], editors: [], editorialNote: "various" };
  }
  // `(ed.)` / `(eds.)` / `(editor)` trailing — strip and route the residual
  // to `editors[]` instead of `authors[]`. Empirics 2026-05-10: Excel has 0
  // occurrences, but defensive parsing is cheap.
  let working = s;
  let isEditorialCredit = false;
  const edMatch = working.match(/^(.*?)\s*\((eds?\.|editors?)\)\s*$/i);
  if (edMatch) {
    isEditorialCredit = true;
    working = edMatch[1].trim();
  }
  // Any other parenthetical → loud-error. Maintainer normalises upstream.
  if (/\(/.test(working)) {
    return {
      ...ctx,
      message:
        `'Author' = "${s}" contains an unrecognised parenthetical. ` +
        `Loader supports only "(ed.)" / "(eds.)" / "(editor)" trailing markers.`,
    };
  }
  // Split on common separators.
  const parts = working
    .split(/\s*,\s*|\s+and\s+|\s+&\s+/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  // "Others" sentinel inside a multi-part cell → drop the part and flip
  // editorialNote to "various". Covers patterns like "Dan Abnett & Others".
  let editorialNote: "various" | null = null;
  const cleanParts = parts.filter((p) => {
    if (OTHERS_SENTINEL_PARTS.has(p.toLowerCase())) {
      editorialNote = "various";
      return false;
    }
    return true;
  });
  if (isEditorialCredit) {
    return { authors: [], editors: cleanParts, editorialNote };
  }
  return { authors: cleanParts, editors: [], editorialNote };
}

// =============================================================================
// SLUG RESOLUTION
// =============================================================================

interface SlugInputRow {
  externalBookId: string;
  title: string;
  section: string | null;
  rowIndex: number;
}

interface SlugResolution {
  slug: string;
  needsSectionDisambiguation: boolean;
}

export interface SlugResolveResult {
  resolutions: Map<string, SlugResolution>;
  issues: LoaderIssue[];
  sectionDisambigSamples: Array<{ slug: string; titles: string[] }>;
}

export function resolveSlugs(rows: SlugInputRow[]): SlugResolveResult {
  // Pass 1: bare title → slug.
  const initial = new Map<string, SlugInputRow[]>();
  for (const r of rows) {
    const slug = slugify(r.title);
    const arr = initial.get(slug);
    if (arr) arr.push(r);
    else initial.set(slug, [r]);
  }
  const resolutions = new Map<string, SlugResolution>();
  const issues: LoaderIssue[] = [];
  const sectionDisambigSamples: Array<{ slug: string; titles: string[] }> = [];

  for (const [slug, group] of initial) {
    if (group.length === 1) {
      const r = group[0]!;
      resolutions.set(r.externalBookId, {
        slug,
        needsSectionDisambiguation: false,
      });
      continue;
    }
    // Pass 2: section disambiguation. ALL members get the suffix so the
    // outcome is order-independent.
    sectionDisambigSamples.push({
      slug,
      titles: group.map((g) => g.title),
    });
    const second = new Map<string, SlugInputRow[]>();
    for (const r of group) {
      const sectionSuffix = r.section ?? "no-section";
      const newSlug = slugify(`${r.title}-${sectionSuffix}`);
      const arr = second.get(newSlug);
      if (arr) arr.push(r);
      else second.set(newSlug, [r]);
    }
    for (const [newSlug, group2] of second) {
      if (group2.length === 1) {
        const r = group2[0]!;
        resolutions.set(r.externalBookId, {
          slug: newSlug,
          needsSectionDisambiguation: true,
        });
      } else {
        // Triple collision — loud-error per row, no third tier.
        for (const r of group2) {
          issues.push({
            sheet: BOOKS_SHEET,
            rowIndex: r.rowIndex,
            message:
              `Triple slug collision after section-disambiguation: ` +
              `title="${r.title}" → slug="${newSlug}". ` +
              `Add a "Slug" override column to the Excel for this row.`,
          });
        }
      }
    }
  }

  return { resolutions, issues, sectionDisambigSamples };
}

// =============================================================================
// ROW-LEVEL PARSERS (pure, exported for the validation smoke harness)
// =============================================================================

export interface PartialBook {
  externalBookId: string;
  title: string;
  authorsRaw: unknown;
  releaseYear: number | null;
  format: BookFormat;
  section: string | null;
  sourceUrl: string | null;
  notes: string | null;
  collectsTitles: string | null;
  sourceRow: number;
}

export interface ParseBookRowResult {
  partial: PartialBook | null;
  issue: LoaderIssue | null;
  warning: LoaderWarning | null;
}

/**
 * Validate a single Books-sheet row (excluding header). The `knownExternalIds`
 * set is used to detect duplicates; callers add the returned `partial.externalBookId`
 * after the fact. Returns at most one of `partial`/`issue`; `warning` is
 * orthogonal (a row may produce both a partial AND a warning, e.g. missing year).
 */
export function parseBookRow(
  row: readonly unknown[],
  sourceRow: number,
  knownExternalIds: ReadonlySet<string>,
): ParseBookRowResult {
  const ctx = { sheet: BOOKS_SHEET, rowIndex: sourceRow };

  const externalBookId = toTrimmedString(row[0]);
  if (!externalBookId) {
    return {
      partial: null,
      issue: { ...ctx, message: `'Book ID' is empty` },
      warning: null,
    };
  }
  if (knownExternalIds.has(externalBookId)) {
    return {
      partial: null,
      issue: {
        ...ctx,
        message: `Duplicate 'Book ID' = "${externalBookId}"`,
      },
      warning: null,
    };
  }

  const title = toTrimmedString(row[3]);
  if (!title) {
    return {
      partial: null,
      issue: { ...ctx, message: `'Title' is empty` },
      warning: null,
    };
  }

  const yearResult = toPositiveInt(row[6]);
  let releaseYear: number | null;
  let warning: LoaderWarning | null = null;
  if (yearResult === "missing") {
    // Brief constraint-tension: the brief lists "Year not parsable as positive
    // integer" as a loud-error, BUT also notes 858/859 coverage — implying
    // Cowork accepts the 1 missing-year row in practice. Pragmatic
    // interpretation: missing → warn + null; non-numeric → error. Documented
    // in the impl-report under "Decisions I made".
    warning = {
      ...ctx,
      message: `'Release Year' is missing for ${externalBookId} "${title}" — emitting null`,
    };
    releaseYear = null;
  } else if (yearResult === "invalid") {
    return {
      partial: null,
      issue: {
        ...ctx,
        message: `'Release Year' = ${JSON.stringify(row[6])} not parsable as positive integer`,
      },
      warning: null,
    };
  } else {
    releaseYear = yearResult;
  }

  const fmt = normalizeFormat(row[7], ctx);
  if (typeof fmt !== "string") {
    return { partial: null, issue: fmt, warning: null };
  }

  return {
    partial: {
      externalBookId,
      title,
      authorsRaw: row[4],
      releaseYear,
      format: fmt,
      section: toTrimmedString(row[8]),
      sourceUrl: toTrimmedString(row[14]),
      notes: toTrimmedString(row[15]),
      collectsTitles: toTrimmedString(row[13]),
      sourceRow,
    },
    issue: null,
    warning,
  };
}

export interface ValidateLinkResult {
  collection: RosterCollection | null;
  issue: LoaderIssue | null;
}

/**
 * Validate a single Collection-Links row and derive `displayOrder` from the
 * parent's "Collects Titles" sequence. Pure — caller threads `knownPairs`
 * (for dedup) and `collectsByParent` (parent → ordered child-titles).
 */
export function validateCollectionLinkRow(
  row: readonly unknown[],
  sourceRow: number,
  knownExternalIds: ReadonlySet<string>,
  knownPairs: ReadonlySet<string>,
  collectsByParent: ReadonlyMap<string, readonly string[]>,
): ValidateLinkResult {
  const ctx = { sheet: LINKS_SHEET, rowIndex: sourceRow };

  const contentExternalId = toTrimmedString(row[0]);
  const collectionExternalId = toTrimmedString(row[3]);

  if (!contentExternalId) {
    return {
      collection: null,
      issue: { ...ctx, message: `'Content Book ID' is empty` },
    };
  }
  if (!collectionExternalId) {
    return {
      collection: null,
      issue: { ...ctx, message: `'Collection Book ID' is empty` },
    };
  }
  if (!knownExternalIds.has(contentExternalId)) {
    return {
      collection: null,
      issue: {
        ...ctx,
        message: `'Content Book ID' = "${contentExternalId}" does not match any row in '${BOOKS_SHEET}'`,
      },
    };
  }
  if (!knownExternalIds.has(collectionExternalId)) {
    return {
      collection: null,
      issue: {
        ...ctx,
        message: `'Collection Book ID' = "${collectionExternalId}" does not match any row in '${BOOKS_SHEET}'`,
      },
    };
  }

  const pairKey = `${contentExternalId}|${collectionExternalId}`;
  if (knownPairs.has(pairKey)) {
    return {
      collection: null,
      issue: {
        ...ctx,
        message: `Duplicate (content, collection) pair = (${contentExternalId}, ${collectionExternalId})`,
      },
    };
  }

  const childSequence = collectsByParent.get(collectionExternalId);
  const contentTitle = toTrimmedString(row[1]);
  let displayOrder = 0;
  if (childSequence && contentTitle) {
    const idx = childSequence.indexOf(contentTitle);
    if (idx >= 0) displayOrder = idx;
  }

  return {
    collection: {
      contentExternalId,
      collectionExternalId,
      displayOrder,
      confidence: toConfidence(row[7]),
      basis: toTrimmedString(row[8]),
    },
    issue: null,
  };
}

// =============================================================================
// MAIN
// =============================================================================

function compareString(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Read + JSON-parse the additive roster extension; null when the file is absent. */
function readExtensionRaw(): unknown | null {
  let text: string;
  try {
    text = readFileSync(ROSTER_EXTENSION_FILE, "utf8");
  } catch {
    return null; // absent → no-op (byte-stable, as before the extension existed)
  }
  try {
    return JSON.parse(text) as unknown;
  } catch (e) {
    throw new Error(
      `${ROSTER_EXTENSION_FILE}: invalid JSON — ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

async function main(): Promise<void> {
  // RETIRED (Brief 171 Teil B): the Excel SSOT (Warhammer_Books_SSOT.xlsx) +
  // book-roster.extension.json are no longer LIVE sources — the corpus lives in
  // scripts/seed-data/books/*.json. This importer (which rebuilt book-roster.json
  // from the Excel + extension) is neutralized as Legacy-only; the Excel +
  // extension + roster stay on disk as frozen provenance and the import logic
  // below is preserved for that provenance, but it refuses to run without an
  // explicit escape hatch. A read-only Excel VIEW of the per-book corpus is
  // `npm run books:excel` (a one-way export, NOT a source).
  if (process.env.ALLOW_RETIRED_SSOT_IMPORT !== "1") {
    console.error(
      [
        "[import-ssot-roster] RETIRED (Brief 171). Excel is no longer the SSOT.",
        "  The corpus lives in scripts/seed-data/books/*.json; add books there",
        "  (scripts/seed-data/books/README.md). Warhammer_Books_SSOT.xlsx +",
        "  book-roster.extension.json remain as frozen provenance only.",
        "  Read-only Excel view of the per-book corpus: npm run books:excel",
        "  (Provenance re-run only: ALLOW_RETIRED_SSOT_IMPORT=1 — re-derives the",
        "   frozen book-roster.json; not part of any live pipeline.)",
      ].join("\n"),
    );
    process.exit(1);
  }

  console.log(`[import-ssot-roster] reading ${SOURCE_FILE}`);

  // `trim: false` works around a read-excel-file 9.0.9 bug where empty
  // string-typed cells crash `parseString`. We coerce + trim ourselves below.
  const booksRaw = await readSheet(SOURCE_FILE, BOOKS_SHEET, { trim: false });
  const linksRaw = await readSheet(SOURCE_FILE, LINKS_SHEET, { trim: false });

  // -------- Header validation --------
  const booksHeader = booksRaw[0]?.map((v) => String(v).trim()) ?? [];
  if (
    booksHeader.length !== BOOKS_HEADERS.length ||
    !BOOKS_HEADERS.every((h, i) => h === booksHeader[i])
  ) {
    console.error(`[import-ssot-roster] '${BOOKS_SHEET}' header mismatch.`);
    console.error(`  expected: ${JSON.stringify(BOOKS_HEADERS)}`);
    console.error(`  actual:   ${JSON.stringify(booksHeader)}`);
    process.exit(1);
  }
  const linksHeader = linksRaw[0]?.map((v) => String(v).trim()) ?? [];
  if (
    linksHeader.length !== LINKS_HEADERS.length ||
    !LINKS_HEADERS.every((h, i) => h === linksHeader[i])
  ) {
    console.error(`[import-ssot-roster] '${LINKS_SHEET}' header mismatch.`);
    console.error(`  expected: ${JSON.stringify(LINKS_HEADERS)}`);
    console.error(`  actual:   ${JSON.stringify(linksHeader)}`);
    process.exit(1);
  }

  const issues = new IssueCollector();
  const booksData = booksRaw.slice(1);

  // -------- Pass 1: row-level Books validation, build partials + ID set --------
  const partials: PartialBook[] = [];
  const externalIdSet = new Set<string>();

  for (let i = 0; i < booksData.length; i++) {
    const r = booksData[i]!;
    const sourceRow = i + 2;
    const result = parseBookRow(r, sourceRow, externalIdSet);
    if (result.warning) issues.pushWarning(result.warning);
    if (result.issue) {
      issues.pushIssue(result.issue);
      continue;
    }
    if (result.partial) {
      externalIdSet.add(result.partial.externalBookId);
      partials.push(result.partial);
    }
  }

  // -------- Pass 2: deterministic slug resolution --------
  const slugResult = resolveSlugs(
    partials.map((p) => ({
      externalBookId: p.externalBookId,
      title: p.title,
      section: p.section,
      rowIndex: p.sourceRow,
    })),
  );
  for (const i of slugResult.issues) issues.pushIssue(i);

  // -------- Pass 3: split authors, build full RosterBook[] --------
  const books: RosterBook[] = [];
  for (const p of partials) {
    const slugRes = slugResult.resolutions.get(p.externalBookId);
    if (!slugRes) continue; // triple-collision already logged

    const authorsResult = splitAuthors(p.authorsRaw, {
      sheet: BOOKS_SHEET,
      rowIndex: p.sourceRow,
    });
    if ("message" in authorsResult) {
      issues.pushIssue(authorsResult);
      continue;
    }

    // Construct in the SAME literal order as `RosterBook` declares its keys
    // — Node 20+ preserves insertion order for non-integer-string keys, and
    // re-run determinism depends on this order being stable.
    books.push({
      externalBookId: p.externalBookId,
      slug: slugRes.slug,
      title: p.title,
      authors: authorsResult.authors,
      editors: authorsResult.editors,
      editorialNote: authorsResult.editorialNote,
      releaseYear: p.releaseYear,
      format: p.format,
      seriesHint: p.section,
      sourceUrl: p.sourceUrl,
      notes: p.notes,
      sourceRow: p.sourceRow,
    });
  }

  // -------- Pass 3b: merge the additive roster extension --------
  // The Excel is the frozen original 859; books greenlit from the weekly refresh
  // (refresh:check → maintainer review) accrete in book-roster.extension.json and
  // are appended here so loop:next → override → apply:override absorbs them like
  // Excel rows. Collections stay Excel-only (extension is books-only); an
  // empty/absent extension is a no-op (byte-identical roster).
  const excelSlugs = new Set<string>(books.map((b) => b.slug));
  const extensionRaw = readExtensionRaw();
  let extensionCount = 0;
  if (extensionRaw !== null) {
    const ext = parseExtensionFile(extensionRaw, externalIdSet, excelSlugs);
    for (const issue of ext.issues) {
      issues.pushIssue({
        sheet: "extension",
        rowIndex: issue.index,
        message: issue.message,
      });
    }
    for (const b of ext.books) {
      externalIdSet.add(b.externalBookId);
      books.push(b);
    }
    extensionCount = ext.books.length;
  }

  // -------- Pass 4: pre-build maps for display_order derivation --------
  // Parent → ordered child-titles (semicolon-split from Books-sheet
  // "Collects Titles"). Empty parents simply don't appear here.
  const collectsByParent = new Map<string, string[]>();
  for (const p of partials) {
    if (!p.collectsTitles) continue;
    const titles = p.collectsTitles
      .split(/\s*;\s*/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    collectsByParent.set(p.externalBookId, titles);
  }

  // -------- Pass 5: Collection Links validation + display_order derivation --
  const linksData = linksRaw.slice(1);
  const linkPairs = new Set<string>();
  const collections: RosterCollection[] = [];

  for (let i = 0; i < linksData.length; i++) {
    const r = linksData[i]!;
    const sourceRow = i + 2;
    const result = validateCollectionLinkRow(
      r,
      sourceRow,
      externalIdSet,
      linkPairs,
      collectsByParent,
    );
    if (result.issue) {
      issues.pushIssue(result.issue);
      continue;
    }
    if (result.collection) {
      linkPairs.add(
        `${result.collection.contentExternalId}|${result.collection.collectionExternalId}`,
      );
      collections.push(result.collection);
    }
  }

  // -------- Print warnings (always), then errors (gate) --------
  issues.printWarnings();
  if (issues.hasIssues()) {
    issues.printIssuesAndExit();
  }

  // -------- Sort deterministically --------
  books.sort((a, b) => compareString(a.externalBookId, b.externalBookId));
  collections.sort((a, b) => {
    const c = compareString(a.contentExternalId, b.contentExternalId);
    return c !== 0
      ? c
      : compareString(a.collectionExternalId, b.collectionExternalId);
  });

  const output: RosterFile = {
    schemaVersion: SCHEMA_VERSION,
    sourceFile: "Warhammer_Books_SSOT.xlsx",
    books,
    collections,
  };

  const json = `${JSON.stringify(output, null, 2)}\n`;
  await writeFile(OUTPUT_FILE, json, "utf8");

  // -------- Empirics for impl-report --------
  console.log(`[import-ssot-roster] wrote ${OUTPUT_FILE}`);
  console.log(`  books:        ${books.length}`);
  console.log(`  extension:    ${extensionCount} merged from ${ROSTER_EXTENSION_FILE}`);
  console.log(`  collections:  ${collections.length}`);
  console.log(`[slug] section-disambiguations: ${slugResult.sectionDisambigSamples.length}`);
  if (slugResult.sectionDisambigSamples.length > 0) {
    console.log(`[slug] examples (up to 5):`);
    for (const s of slugResult.sectionDisambigSamples.slice(0, 5)) {
      console.log(`  "${s.slug}" — titles: ${JSON.stringify(s.titles)}`);
    }
  }

  const variousCount = books.filter((b) => b.editorialNote === "various").length;
  const editorsCount = books.filter((b) => b.editors.length > 0).length;
  const multiAuthorCount = books.filter((b) => b.authors.length > 1).length;
  const soloAuthorCount = books.filter((b) => b.authors.length === 1).length;
  const noAuthorMarkerCount = books.filter(
    (b) => b.authors.length === 0 && b.editorialNote === null && b.editors.length === 0,
  ).length;
  console.log(
    `[authors] solo=${soloAuthorCount} multi=${multiAuthorCount} various=${variousCount} editors=${editorsCount} no-author-no-marker=${noAuthorMarkerCount}`,
  );

  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("[import-ssot-roster] unexpected error:", err);
  process.exit(1);
});
