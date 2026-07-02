/**
 * Convert step (Brief 174 P14 Teil A, Brief 183 Daten-Pass): read the
 * redditor's map Excel (`scripts/seed-data/source/Warhammer_map_SSOT.xlsx`,
 * sheet `Tabelle1`, 992 worlds) + the hand-curation Excel
 * (`scripts/seed-data/source/map-worlds-curation.xlsx`, sheets `Kuration` +
 * `Welten` — Philipps Arbeitsformat, replaces the retired
 * map-worlds.overrides.json), derive the per-world media links (books +
 * podcast episodes) JSON-first from the repo-side sources, and write the
 * committed catalog `scripts/seed-data/map-worlds.json` + the hand-gate
 * report `scripts/seed-data/map-worlds.review.md`.
 *
 * Pure file I/O — NO DB access (runs without `--env-file`; there is no
 * DATABASE_URL in play, by construction). Deterministic + idempotent:
 * identical (Excel + curation + corpus + overlay + podcast artifacts) →
 * byte-identical outputs; a second run produces no diff. Both Excel files are
 * READ-ONLY inputs in the normal run.
 *
 * `--sync-curation` additionally REWRITES the curation Excel: existing rows
 * are preserved (values as parsed; Bücher/Episoden counts refreshed), and
 * worklist locations that have no row yet are appended (sorted by work count
 * desc). This is the only code path that writes the curation file.
 *
 * All composition logic lives in the pure `scripts/map-worlds-core.ts`
 * (shared with `scripts/test-map-worlds.ts`). This wrapper only reads inputs,
 * validates the sheet shapes (fail-loud on drift), and writes the outputs.
 *
 * Usage:
 *   npm run import:map-worlds
 *   npm run import:map-worlds -- --sync-curation
 *
 * Brief 174 (2026-07-02) — sessions/2026-07-02-174-arch-map-ssot-reconciliation.md
 * Brief 183 (2026-07-02) — sessions/2026-07-02-183-arch-map-worlds-daten-pass.md
 */
import { existsSync, readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

import { readSheet } from "read-excel-file/node";
import writeXlsxFile, { type Cell } from "write-excel-file/node";

import { assertShowArtifact } from "@/lib/ingestion/podcast/apply-plan";
import { loadRegistry } from "@/lib/ingestion/podcast/registry";
import type { ShowArtifact } from "@/lib/ingestion/podcast/types";
import { validateMapWorlds, type MapWorldWork } from "@/lib/map/map-worlds-schema";

import locationsCanon from "./seed-data/locations.json";
import locationAliases from "./seed-data/location-aliases.json";
import factionsCanon from "./seed-data/factions.json";
import charactersCanon from "./seed-data/characters.json";
import erasCanon from "./seed-data/eras.json";

import { loadBannedPatterns } from "./apply-override-synopsis-lint";
import { VALID_BOOK_FORMATS, loadBookFiles } from "./book-file";
import { validateOverlay, type CurationOverlay, type RefSets } from "./curation-overlay";
import {
  CURATION_HEADERS,
  KNOWN_SEGMENTA,
  WELTEN_HEADERS,
  buildCatalog,
  buildLocationMatcher,
  deriveBookEdges,
  derivePodcastEdges,
  mergeWorkEdges,
  parseCurationSheet,
  parseWeltenSheet,
  renderReview,
  type CurationInput,
  type CurationRow,
  type CurationWorldRow,
  type ExcelWorldRow,
  type ReviewData,
  type SheetCell,
} from "./map-worlds-core";

const SOURCE_FILE = "scripts/seed-data/source/Warhammer_map_SSOT.xlsx";
const SHEET = "Tabelle1";
const CURATION_FILE = "scripts/seed-data/source/map-worlds-curation.xlsx";
const CURATION_SHEET = "Kuration";
const WELTEN_SHEET = "Welten";
const OVERLAY_FILE = "scripts/seed-data/curation-overlay.json";
const SEED_DIR = "scripts/seed-data";
const OUTPUT_FILE = "scripts/seed-data/map-worlds.json";
const REVIEW_FILE = "scripts/seed-data/map-worlds.review.md";

/** Expected header row (column F is the headerless y column). */
const EXPECTED_HEADERS = [
  "Name",
  "Primary Classification",
  "Secondary Classification",
  "Tertiary Classification",
  "Coordinates",
] as const;
const SEGMENTUM_HEADER = "Segmentum";

function trimCell(v: SheetCell): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function cellOrNull(v: SheetCell): string | null {
  const s = trimCell(v);
  return s === "" ? null : s;
}

/** Parse + fail-loud validate the SSOT sheet into ExcelWorldRow[]. */
async function readExcelRows(): Promise<ExcelWorldRow[]> {
  // `trim: false` mirrors import-ssot-roster/import-faction-starters:
  // read-excel-file 9.x crashes on some empty string-typed cells with trim
  // on; we trim ourselves.
  const raw = await readSheet(SOURCE_FILE, SHEET, { trim: false });

  const header = (raw[0] ?? []).map((v) => trimCell(v as SheetCell));
  const headerOk =
    EXPECTED_HEADERS.every((h, i) => header[i] === h) && header[6] === SEGMENTUM_HEADER;
  if (!headerOk) {
    console.error(`[import-map-worlds] '${SHEET}' header mismatch.`);
    console.error(`  expected: ${JSON.stringify([...EXPECTED_HEADERS, "(y, headerless)", SEGMENTUM_HEADER])}`);
    console.error(`  actual:   ${JSON.stringify(header)}`);
    process.exit(1);
  }

  const rows: ExcelWorldRow[] = [];
  const issues: string[] = [];
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i]! as SheetCell[];
    const sourceRow = i + 1;
    if (row.every((c) => c === null || c === undefined || trimCell(c) === "")) continue;
    const name = trimCell(row[0]);
    const x = row[4];
    const y = row[5];
    const segmentum = trimCell(row[6]);
    if (name === "") {
      issues.push(`row ${sourceRow}: 'Name' is empty but the row carries data`);
      continue;
    }
    if (typeof x !== "number" || !Number.isFinite(x) || typeof y !== "number" || !Number.isFinite(y)) {
      issues.push(`row ${sourceRow} ("${name}"): coordinates must be numeric (got x=${JSON.stringify(x)}, y=${JSON.stringify(y)})`);
      continue;
    }
    if (!KNOWN_SEGMENTA.has(segmentum)) {
      issues.push(`row ${sourceRow} ("${name}"): unknown Segmentum "${segmentum}" (expected one of ${[...KNOWN_SEGMENTA].join(", ")})`);
      continue;
    }
    rows.push({
      sourceRow,
      name,
      primary: cellOrNull(row[1]),
      secondary: cellOrNull(row[2]),
      // Tertiary (column D) is deliberately dropped — 4 rows, Brief 183.
      x,
      y,
      segmentum,
    });
  }
  if (issues.length > 0) {
    for (const m of issues) console.error(`[error ${SHEET}] ${m}`);
    console.error(`\n[import-map-worlds] ${issues.length} sheet issue(s) — aborting.`);
    process.exit(1);
  }
  return rows;
}

/** Read + parse the hand-curation Excel (both sheets) through the pure core
 *  parsers. The file is a committed input — missing = hard error. */
async function readCuration(): Promise<CurationInput> {
  if (!existsSync(resolve(process.cwd(), CURATION_FILE))) {
    throw new Error(
      `[import-map-worlds] ${CURATION_FILE} is missing — the curation Excel is a committed ` +
        `input (Brief 183); restore it from git.`,
    );
  }
  const kurationRaw = (await readSheet(CURATION_FILE, CURATION_SHEET, { trim: false })) as SheetCell[][];
  const weltenRaw = (await readSheet(CURATION_FILE, WELTEN_SHEET, { trim: false })) as SheetCell[][];
  return {
    rows: parseCurationSheet(kurationRaw),
    worldRows: parseWeltenSheet(weltenRaw),
  };
}

/** Load + validate the curation overlay through the SHARED validator, with
 *  RefSets built from the seed JSONs (DB-free, same ids the DB carries). */
function loadOverlay(): CurationOverlay {
  const refs: RefSets = {
    factionIds: new Set(factionsCanon.map((f) => f.id)),
    locationIds: new Set(locationsCanon.map((l) => l.id)),
    characterIds: new Set(charactersCanon.map((c) => c.id)),
    eraIds: new Set(erasCanon.map((e) => e.id)),
    bookFormats: VALID_BOOK_FORMATS,
  };
  const raw: unknown = JSON.parse(readFileSync(resolve(process.cwd(), OVERLAY_FILE), "utf8"));
  return validateOverlay(raw, refs, {
    bannedSynopsisPatterns: loadBannedPatterns(resolve(process.cwd(), SEED_DIR)),
  });
}

/** Load every registered podcast show artifact (`ingest/podcasts/<slug>.json`). */
function loadShowArtifacts(): ShowArtifact[] {
  return loadRegistry().map((show) => {
    const path = resolve(process.cwd(), "ingest", "podcasts", `${show.slug}.json`);
    const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
    assertShowArtifact(parsed);
    return parsed;
  });
}

// =============================================================================
// --sync-curation — append missing worklist rows to the curation Excel
// =============================================================================

const str = (v: string | null): Cell => (v === null ? null : { value: v, type: String });
const num = (v: number | null): Cell => (v === null ? null : { value: v, type: Number });
const header = (v: string): Cell => ({ value: v, type: String, fontWeight: "bold" });

function countByType(works: ReadonlyArray<MapWorldWork> | undefined): { books: number; episodes: number } {
  const list = works ?? [];
  return {
    books: list.filter((w) => w.type === "book").length,
    episodes: list.filter((w) => w.type === "podcast_episode").length,
  };
}

/** Rewrite the curation Excel: existing rows preserved in sheet order (counts
 *  refreshed; Aktion/`-` normalized to their parsed form), missing worklist
 *  rows appended sorted by work count desc. */
async function syncCuration(
  curation: CurationInput,
  review: ReviewData,
  worksByLocation: ReadonlyMap<string, MapWorldWork[]>,
): Promise<number> {
  const missing = review.unplacedLocations.filter((u) => !u.inCurationSheet);

  const kurationRows: Cell[][] = [CURATION_HEADERS.map(header)];
  const rowFor = (r: CurationRow): Cell[] => {
    const counts = countByType(worksByLocation.get(r.locationId));
    return [
      str(r.locationId),
      str(r.name),
      num(counts.books),
      num(counts.episodes),
      str(r.actionRaw === "" ? null : r.actionRaw),
      str(r.target),
      num(r.x),
      num(r.y),
      str(r.segmentum),
      str(r.classification),
      str(r.note),
    ];
  };
  for (const r of curation.rows) kurationRows.push(rowFor(r));
  for (const u of missing) {
    kurationRows.push([
      str(u.locationId),
      str(u.name),
      num(u.books),
      num(u.episodes),
      null, null, null, null, null, null, null,
    ]);
  }

  const weltenRows: Cell[][] = [WELTEN_HEADERS.map(header)];
  for (const w of curation.worldRows) {
    weltenRows.push([str(w.worldId), str(w.locationIdOverride ?? "-"), str(w.note)]);
  }

  await writeXlsxFile([
    {
      sheet: CURATION_SHEET,
      data: kurationRows,
      columns: [
        { width: 26 }, { width: 30 }, { width: 8 }, { width: 9 }, { width: 8 }, { width: 20 },
        { width: 8 }, { width: 8 }, { width: 12 }, { width: 16 }, { width: 60 },
      ],
    },
    {
      sheet: WELTEN_SHEET,
      data: weltenRows,
      columns: [{ width: 26 }, { width: 20 }, { width: 60 }],
    },
  ]).toFile(resolve(process.cwd(), CURATION_FILE));
  return missing.length;
}

// =============================================================================

async function main(): Promise<void> {
  const { values } = parseArgs({ options: { "sync-curation": { type: "boolean" } } });
  const doSync = values["sync-curation"] === true;

  const excelRows = await readExcelRows();
  console.log(`[import-map-worlds] read ${excelRows.length} worlds from ${SOURCE_FILE}`);

  const curation = await readCuration();
  const actions = curation.rows.filter((r) => r.action !== null);
  console.log(
    `[import-map-worlds] curation: ${curation.rows.length} rows ` +
      `(${actions.filter((r) => r.action === "link").length} link, ` +
      `${actions.filter((r) => r.action === "rollup").length} rollup, ` +
      `${actions.filter((r) => r.action === "pin").length} pin), ` +
      `${curation.worldRows.length} world overrides`,
  );

  const { books, issues } = loadBookFiles();
  if (issues.length > 0) {
    for (const i of issues) console.error(`[error ${i.filename}] ${i.message}`);
    console.error(`\n[import-map-worlds] ${issues.length} invalid book file(s) — aborting.`);
    process.exit(1);
  }
  const overlay = loadOverlay();
  const { byLocation: bookEdges, notes: bookNotes } = deriveBookEdges(
    books.map((b) => b.book),
    overlay,
  );

  const artifacts = loadShowArtifacts();
  const locationIds = new Set(locationsCanon.map((l) => l.id));
  const { byLocation: podcastEdges, notes: podcastNotes } = derivePodcastEdges(artifacts, locationIds);

  const worksByLocation = mergeWorkEdges(bookEdges, podcastEdges);
  const matcher = buildLocationMatcher(locationsCanon, locationAliases as Record<string, string>);
  const locationNames = new Map(locationsCanon.map((l) => [l.id, l.name]));

  const { file, review } = buildCatalog({
    excelRows,
    curation,
    matcher,
    locationNames,
    worksByLocation,
    bookNotes,
    podcastNotes,
  });

  // Self-check: the generated catalog must satisfy its own schema contract.
  const schemaErrors = validateMapWorlds(JSON.parse(JSON.stringify(file)));
  if (schemaErrors.length > 0) {
    for (const e of schemaErrors) console.error(`[error map-worlds.json] ${e}`);
    console.error(`\n[import-map-worlds] generated catalog violates map-worlds-v2 — aborting.`);
    process.exit(1);
  }

  await writeFile(OUTPUT_FILE, `${JSON.stringify(file, null, 2)}\n`, "utf8");
  await writeFile(REVIEW_FILE, renderReview(review), "utf8");

  const t = review.totals;
  const c = review.coverage;
  console.log(`[import-map-worlds] wrote ${OUTPUT_FILE}: ${file.worlds.length} worlds`);
  console.log(
    `[import-map-worlds]   matched: ${t.matched} (${t.distinctMatchedLocationIds} locations), ` +
      `with works: ${t.matchedWithWorks}`,
  );
  console.log(
    `[import-map-worlds]   curation applied: ${review.applied.links.length} links, ` +
      `${review.applied.rollups.length} rollups, ${review.applied.pins.length} pins, ` +
      `${review.applied.worldOverrides.length} world overrides`,
  );
  console.log(
    `[import-map-worlds]   coverage: ${c.placedWorkEdges}/${c.totalWorkEdges} work edges placed ` +
      `(${c.totalWorkEdges === 0 ? "0" : ((c.placedWorkEdges / c.totalWorkEdges) * 100).toFixed(1)} %)`,
  );
  console.log(
    `[import-map-worlds]   media: ${bookNotes.bookEdgeCount} book edges (${bookNotes.booksWithLocationEdges}/${bookNotes.bookCount} books), ` +
      `${podcastNotes.episodeEdgeCount} episode edges (${podcastNotes.episodesWithLocations}/${podcastNotes.episodeCount} episodes)`,
  );
  console.log(
    `[import-map-worlds] wrote ${REVIEW_FILE}: ${review.unplacedLocations.length} open media locations, ` +
      `${review.duplicateNameGroups.length} duplicate-name groups, ${review.idCollisions.length} id collisions`,
  );

  if (doSync) {
    const appended = await syncCuration(curation, review, worksByLocation);
    console.log(
      appended > 0
        ? `[import-map-worlds] --sync-curation: appended ${appended} new worklist row(s) to ${CURATION_FILE}`
        : `[import-map-worlds] --sync-curation: no new worklist rows — ${CURATION_FILE} rewritten (counts refreshed)`,
    );
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
