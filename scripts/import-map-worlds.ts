/**
 * Convert step (Brief 174, P14 Teil A): read the redditor's map Excel
 * (`scripts/seed-data/source/Warhammer_map_SSOT.xlsx`, sheet `Tabelle1`,
 * 992 worlds) + the hand-override file, derive the per-world media links
 * (books + podcast episodes) JSON-first from the repo-side sources, and write
 * the committed catalog `scripts/seed-data/map-worlds.json` + the hand-gate
 * report `scripts/seed-data/map-worlds.review.md`.
 *
 * Pure file I/O — NO DB access (runs without `--env-file`; there is no
 * DATABASE_URL in play, by construction). Deterministic + idempotent:
 * identical (Excel + overrides + corpus + overlay + podcast artifacts) →
 * byte-identical outputs; a second run produces no diff.
 *
 * All composition logic lives in the pure `scripts/map-worlds-core.ts`
 * (shared with `scripts/test-map-worlds.ts`). This wrapper only reads inputs,
 * validates the sheet shape (fail-loud on drift), and writes the outputs.
 *
 * Usage:
 *   npm run import:map-worlds
 *
 * Brief 174 (2026-07-02) — sessions/2026-07-02-174-arch-map-ssot-reconciliation.md
 */
import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { readSheet } from "read-excel-file/node";

import { assertShowArtifact } from "@/lib/ingestion/podcast/apply-plan";
import { loadRegistry } from "@/lib/ingestion/podcast/registry";
import type { ShowArtifact } from "@/lib/ingestion/podcast/types";
import { validateMapWorlds } from "@/lib/map/map-worlds-schema";

import locationsCanon from "./seed-data/locations.json";
import locationAliases from "./seed-data/location-aliases.json";
import factionsCanon from "./seed-data/factions.json";
import charactersCanon from "./seed-data/characters.json";
import erasCanon from "./seed-data/eras.json";

import { loadBannedPatterns } from "./apply-override-synopsis-lint";
import { VALID_BOOK_FORMATS, loadBookFiles } from "./book-file";
import { validateOverlay, type CurationOverlay, type RefSets } from "./curation-overlay";
import {
  buildCatalog,
  buildLocationMatcher,
  deriveBookEdges,
  derivePodcastEdges,
  mergeWorkEdges,
  renderReview,
  validateOverridesFile,
  type ExcelWorldRow,
} from "./map-worlds-core";

const SOURCE_FILE = "scripts/seed-data/source/Warhammer_map_SSOT.xlsx";
const SHEET = "Tabelle1";
const OVERRIDES_FILE = "scripts/seed-data/map-worlds.overrides.json";
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

/** The five Segmenta of the frozen source sheet — a sixth value is drift. */
const KNOWN_SEGMENTA: ReadonlySet<string> = new Set([
  "Solar",
  "Obscurus",
  "Pacificus",
  "Tempestus",
  "Ultima",
]);

type Cell = string | number | boolean | Date | null | undefined;

function trimCell(v: Cell): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function cellOrNull(v: Cell): string | null {
  const s = trimCell(v);
  return s === "" ? null : s;
}

/** Parse + fail-loud validate the sheet into ExcelWorldRow[]. */
async function readExcelRows(): Promise<ExcelWorldRow[]> {
  // `trim: false` mirrors import-ssot-roster/import-faction-starters:
  // read-excel-file 9.x crashes on some empty string-typed cells with trim
  // on; we trim ourselves.
  const raw = await readSheet(SOURCE_FILE, SHEET, { trim: false });

  const header = (raw[0] ?? []).map((v) => trimCell(v as Cell));
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
    const row = raw[i]! as Cell[];
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
      tertiary: cellOrNull(row[3]),
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

async function main(): Promise<void> {
  const excelRows = await readExcelRows();
  console.log(`[import-map-worlds] read ${excelRows.length} worlds from ${SOURCE_FILE}`);

  const overridesRaw: unknown = JSON.parse(readFileSync(resolve(process.cwd(), OVERRIDES_FILE), "utf8"));
  const overrides = validateOverridesFile(overridesRaw);
  console.log(
    `[import-map-worlds] overrides: ${overrides.addWorlds.length} addWorlds, ` +
      `${Object.keys(overrides.worldOverrides).length} worldOverrides`,
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
    overrides,
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
    console.error(`\n[import-map-worlds] generated catalog violates map-worlds-v1 — aborting.`);
    process.exit(1);
  }

  await writeFile(OUTPUT_FILE, `${JSON.stringify(file, null, 2)}\n`, "utf8");
  await writeFile(REVIEW_FILE, renderReview(review), "utf8");

  const t = review.totals;
  console.log(`[import-map-worlds] wrote ${OUTPUT_FILE}: ${file.worlds.length} worlds`);
  console.log(
    `[import-map-worlds]   matched: ${t.matched} (${t.distinctMatchedLocationIds} locations), ` +
      `with works: ${t.matchedWithWorks}`,
  );
  console.log(
    `[import-map-worlds]   media: ${bookNotes.bookEdgeCount} book edges (${bookNotes.booksWithLocationEdges}/${bookNotes.bookCount} books), ` +
      `${podcastNotes.episodeEdgeCount} episode edges (${podcastNotes.episodesWithLocations}/${podcastNotes.episodeCount} episodes)`,
  );
  console.log(
    `[import-map-worlds] wrote ${REVIEW_FILE}: ${review.unplacedLocations.length} unplaced media locations, ` +
      `${review.duplicateNameGroups.length} duplicate-name groups, ${review.idCollisions.length} id collisions`,
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
