/**
 * books-excel.ts — Brief 171 Teil B. READ-ONLY Excel export of the per-book corpus.
 *
 * Renders `scripts/seed-data/books/*.json` into a single `.xlsx` for humans who
 * want the old spreadsheet view. This is a ONE-WAY export — NOT a source, NOT a
 * sync. Excel is no longer the SSOT (Brief 171 §Out of scope "Bidirektionaler
 * Excel-Sync oder Excel als SSOT"); `books/*.json` is. Re-running just regenerates
 * the file.
 *
 * SAFETY: writes only under the gitignored `ingest/.exports/` path and HARD-REFUSES
 * any output path under `scripts/seed-data/source/` (the frozen legacy Excel
 * inputs incl. `Warhammer_Books_SSOT.xlsx`) — the export can never clobber the
 * legacy input.
 *
 * DB-free: reads JSON only.
 *
 * CLI:
 *   npm run books:excel                         # → ingest/.exports/books.xlsx
 *   npm run books:excel -- --out <path.xlsx>    # custom (still refused under source/)
 */
import { mkdirSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";

import writeXlsxFile, { type Cell, type Column } from "write-excel-file/node";

import { BOOKS_DIR, loadBookFiles, type BookFileV1 } from "./book-file";

const DEFAULT_OUT = "ingest/.exports/books.xlsx";
const FORBIDDEN_DIR = resolve(process.cwd(), "scripts", "seed-data", "source");

type Row = BookFileV1;
// An empty value becomes a `null` cell (not `{value:null}`) — the v4 Cell shape.
const str = (v: string | null): Cell => (v ? { value: v, type: String } : null);
const num = (v: number | null): Cell => (v === null ? null : { value: v, type: Number });

// write-excel-file v4 `columns` API: each column has a header + a cell()
// producing a typed cell ({value, type}) or null for an empty cell. Read-only.
const COLUMNS: Column<Row>[] = [
  { header: "externalBookId", width: 12, cell: (b) => str(b.externalBookId) },
  { header: "slug", width: 28, cell: (b) => str(b.slug) },
  { header: "title", width: 36, cell: (b) => str(b.title) },
  { header: "authors", width: 24, cell: (b) => str(b.authors.join("; ")) },
  { header: "editors", width: 18, cell: (b) => str(b.editors.join("; ")) },
  { header: "editorialNote", width: 12, cell: (b) => str(b.authorship.editorialNote) },
  { header: "releaseYear", width: 10, cell: (b) => num(b.releaseYear) },
  { header: "format", width: 12, cell: (b) => str(b.format) },
  { header: "seriesHint", width: 24, cell: (b) => str(b.seriesHint) },
  { header: "series", width: 14, cell: (b) => str(b.series) },
  { header: "seriesIndex", width: 10, cell: (b) => num(b.seriesIndex) },
  { header: "notes", width: 30, cell: (b) => str(b.notes) },
  { header: "sourceKind", width: 14, cell: (b) => str(b.source.kind) },
  { header: "sourceUrl", width: 40, cell: (b) => str(b.source.url) },
  { header: "sourceConfidence", width: 10, cell: (b) => num(b.source.confidence) },
  { header: "synopsis", width: 60, cell: (b) => str(b.curation.synopsis) },
  { header: "facetIds", width: 40, cell: (b) => str(b.curation.facetIds.join(", ")) },
  { header: "factions", width: 36, cell: (b) => str(b.curation.factions.map((f) => `${f.name} (${f.role})`).join("; ")) },
  { header: "locations", width: 36, cell: (b) => str(b.curation.locations.map((l) => `${l.name} (${l.role})`).join("; ")) },
  { header: "characters", width: 36, cell: (b) => str(b.curation.characters.map((c) => `${c.name} (${c.role})`).join("; ")) },
  { header: "flagsCount", width: 8, cell: (b) => num(b.curation.flags.length) },
  { header: "rating", width: 24, cell: (b) => str(b.curation.rating ? JSON.stringify(b.curation.rating) : null) },
  { header: "collects", width: 30, cell: (b) => str(b.collections.collects.map((m) => m.externalBookId).join(", ")) },
];

async function main(): Promise<void> {
  const { values } = parseArgs({ options: { out: { type: "string" } } });
  const outRel = values.out ?? DEFAULT_OUT;
  const outAbs = resolve(process.cwd(), outRel);

  if (outAbs === FORBIDDEN_DIR || outAbs.startsWith(FORBIDDEN_DIR + sep)) {
    console.error(
      `[books-excel] REFUSING to write under scripts/seed-data/source/ — that holds the frozen legacy Excel inputs. Pick another path.`,
    );
    process.exit(2);
  }

  const { books, issues } = loadBookFiles(BOOKS_DIR);
  if (issues.length > 0) {
    console.error(`[books-excel] ${issues.length} per-book validation issue(s); fix before exporting.`);
    for (const i of issues.slice(0, 20)) console.error(`  - ${i.filename}: ${i.message}`);
    process.exit(1);
  }

  const rows = books.map((f) => f.book).sort((a, b) => a.externalBookId.localeCompare(b.externalBookId));

  mkdirSync(dirname(outAbs), { recursive: true });
  await writeXlsxFile(rows, { columns: COLUMNS }).toFile(outAbs);
  console.log(`[books-excel] wrote ${rows.length} books → ${outRel} (read-only reference export; NOT a source).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[books-excel] failed:", err instanceof Error ? (err.stack ?? err.message) : err);
  process.exit(1);
});
