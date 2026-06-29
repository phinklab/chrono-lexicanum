/**
 * migrate-corpus-to-books.ts — Brief 171 Teil B. The ONE-SHOT migration converter.
 *
 * Enumerates `book-roster.json.books[]` and writes exactly one
 * `scripts/seed-data/books/<slug>.json` (`book-v1`) per roster row — the full
 * existing corpus moved into the per-book SSOT home. After this runs (and the
 * equivalence diff is empty) the batch/Excel/extension machinery is retired and
 * the corpus lives ONLY in `books/`.
 *
 * Authority split (reproduced exactly so `apply(legacy) == apply(per-book)`):
 *   - hard fields  ← `book-roster.json` row (title, authors[], editors[],
 *                    editorialNote, releaseYear, format, seriesHint, notes)
 *   - soft curation ← matching `manual-overrides-ssot-*.json` book (synopsis,
 *                    facetIds, factions, locations, characters, flags, rating)
 *   - series        ← `SERIES_BY_EXTERNAL_ID` ONLY (8 ids; else null — NEVER
 *                    re-derived from seriesHint; Brief 171 §Serien-Parität)
 *   - collections   ← `book-roster.json.collections[]` grouped by
 *                    `collectionExternalId` into the owning file's `collects[]`
 *   - source        ← `book-roster.extension.json` provenance (37 books) or the
 *                    Excel default `{kind:"excel", url:sourceUrl, confidence:null}`
 *
 * ⚠ SLUG: the per-book file's `slug` (and filename) is the OVERRIDE slug, NOT the
 * roster slug. The Legacy writer puts `override.slug` in `works.slug`
 * (`computeBookRows`), so for the 2 books whose override slug differs from the
 * roster slug (W40K-0259, W40K-0330) the override slug is the equivalence-correct
 * one. Using the roster slug there would break the diff.
 *
 * PURE-ish: reads committed seed JSON, writes `books/*.json`. No DB, no network,
 * no LLM, no re-crawl. Idempotent — re-running overwrites byte-identically.
 *
 * CLI:
 *   tsx scripts/migrate-corpus-to-books.ts            # write the files
 *   tsx scripts/migrate-corpus-to-books.ts --dry-run  # validate + report, no write
 */
import { realpathSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

// Type-only from book-apply-shared (it loads @/db/client at import time; the
// converter is DB-free — it reads/writes JSON only).
import type {
  OverrideBook,
  OverrideCuration,
  RosterBook,
  RosterFile,
} from "./book-apply-shared";
import {
  BOOKS_DIR,
  validateBookFile,
  type BookFileCollectMember,
  type BookFileV1,
} from "./book-file";
import {
  loadAllOverrideBooks,
  loadExtensionProvenance,
  loadRosterSync,
  seriesAnchorFor,
  type LegacyBookSource,
} from "./legacy-corpus-projection";
import type { RosterCollection } from "./seed-data/types";

interface ConvertResult {
  filename: string;
  slug: string;
  externalBookId: string;
  json: string;
}

/** Group the flat collection edge list by the owning collection's external id. */
function groupCollections(collections: RosterCollection[]): Map<string, BookFileCollectMember[]> {
  const byCollection = new Map<string, BookFileCollectMember[]>();
  for (const edge of collections) {
    const members = byCollection.get(edge.collectionExternalId) ?? [];
    members.push({
      externalBookId: edge.contentExternalId,
      // Always written explicitly so `collectionEdgesOf` reproduces the exact
      // legacy displayOrder regardless of array position (set-equal at apply).
      displayOrder: edge.displayOrder,
      confidence: edge.confidence,
      basis: edge.basis,
    });
    byCollection.set(edge.collectionExternalId, members);
  }
  // Deterministic member order inside each file.
  for (const members of byCollection.values()) {
    members.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.externalBookId.localeCompare(b.externalBookId));
  }
  return byCollection;
}

/** The per-book `source` object: extension provenance, else the Excel default. */
function sourceFor(roster: RosterBook, ext: LegacyBookSource | undefined): BookFileV1["source"] {
  if (ext) {
    return { kind: ext.kind, url: ext.url ?? roster.sourceUrl ?? null, confidence: ext.confidence };
  }
  // Excel-origin book: the SSOT spreadsheet is the file provenance.
  return { kind: "excel", url: roster.sourceUrl ?? null, confidence: null };
}

/** Build the `book-v1` object for one roster row (keys in declaration order). */
export function buildBookFile(
  roster: RosterBook,
  override: OverrideBook,
  ext: LegacyBookSource | undefined,
  collects: BookFileCollectMember[],
): BookFileV1 {
  const series = seriesAnchorFor(roster.externalBookId);
  return {
    $schema: "book-v1",
    externalBookId: roster.externalBookId,
    // ⚠ override slug — the one Legacy writes to works.slug (see header note).
    slug: override.slug,
    title: roster.title,
    authors: roster.authors,
    editors: roster.editors,
    authorship: { editorialNote: roster.editorialNote },
    releaseYear: roster.releaseYear,
    format: roster.format,
    seriesHint: roster.seriesHint,
    series: series?.id ?? null,
    seriesIndex: series?.index ?? null,
    notes: roster.notes,
    source: sourceFor(roster, ext),
    // Curation copied verbatim — the lossless contract (Brief 170 §Design).
    curation: override.overrides as OverrideCuration,
    collections: { collects },
  };
}

export function convertCorpus(
  roster: RosterFile,
  overrideByExternalId: Map<string, OverrideBook>,
  extProvenance: Map<string, LegacyBookSource>,
): { results: ConvertResult[]; missingCuration: string[]; issues: string[]; slugCollisions: string[] } {
  const missingCuration: string[] = [];
  const issues: string[] = [];
  const slugCollisions: string[] = [];
  const collectionsByOwner = groupCollections(roster.collections);
  const seenSlugs = new Map<string, string>();
  const results: ConvertResult[] = [];

  for (const rosterBook of roster.books) {
    const override = overrideByExternalId.get(rosterBook.externalBookId);
    if (!override) {
      missingCuration.push(rosterBook.externalBookId);
      continue;
    }
    const book = buildBookFile(
      rosterBook,
      override,
      extProvenance.get(rosterBook.externalBookId),
      collectionsByOwner.get(rosterBook.externalBookId) ?? [],
    );

    // Schema gate — every produced file must satisfy the Teil-A validator.
    const filename = `${book.slug}.json`;
    const { issues: fileIssues } = validateBookFile(book, filename);
    for (const m of fileIssues) issues.push(m);

    const prev = seenSlugs.get(book.slug);
    if (prev) {
      slugCollisions.push(`slug "${book.slug}" produced by both ${prev} and ${rosterBook.externalBookId}`);
    } else {
      seenSlugs.set(book.slug, rosterBook.externalBookId);
    }

    results.push({
      filename,
      slug: book.slug,
      externalBookId: book.externalBookId,
      json: JSON.stringify(book, null, 2) + "\n",
    });
  }

  return { results, missingCuration, issues, slugCollisions };
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: { "dry-run": { type: "boolean", default: false } },
    strict: true,
    allowPositionals: false,
  });
  const dryRun = Boolean(values["dry-run"]);

  const roster = loadRosterSync();
  const { byExternalId, batchCount } = loadAllOverrideBooks();
  const extProvenance = loadExtensionProvenance();
  console.log(
    `[migrate] roster books=${roster.books.length} collections=${roster.collections.length}; ` +
      `override books=${byExternalId.size} across ${batchCount} batches; ` +
      `extension provenance=${extProvenance.size}`,
  );

  const { results, missingCuration, issues, slugCollisions } = convertCorpus(roster, byExternalId, extProvenance);

  if (missingCuration.length > 0) {
    console.error(
      `[migrate] HALT — ${missingCuration.length} roster book(s) have NO override curation:\n` +
        missingCuration.map((id) => `  - ${id}`).join("\n"),
    );
    process.exit(1);
  }
  if (slugCollisions.length > 0) {
    console.error(
      `[migrate] HALT — ${slugCollisions.length} slug collision(s) among produced files:\n` +
        slugCollisions.map((c) => `  - ${c}`).join("\n"),
    );
    process.exit(1);
  }
  if (issues.length > 0) {
    console.error(
      `[migrate] HALT — ${issues.length} produced file(s) fail book-v1 validation:\n` +
        issues.slice(0, 50).map((m) => `  - ${m}`).join("\n") +
        (issues.length > 50 ? `\n  … and ${issues.length - 50} more` : ""),
    );
    process.exit(1);
  }

  const collectionFiles = results.filter((r) => r.json.includes('"collects": [\n')).length;
  if (dryRun) {
    console.log(
      `[migrate] dry-run OK — would write ${results.length} files (${collectionFiles} carry collects[]). No files written.`,
    );
    process.exit(0);
  }

  for (const r of results) {
    writeFileSync(resolve(BOOKS_DIR, r.filename), r.json, "utf8");
  }
  console.log(`[migrate] wrote ${results.length} files to ${BOOKS_DIR} (${collectionFiles} carry collects[]).`);
  process.exit(0);
}

/** True only when directly invoked (tsx scripts/migrate-corpus-to-books.ts). */
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
    console.error("[migrate] failed:", err instanceof Error ? (err.stack ?? err.message) : err);
    process.exit(1);
  });
}
