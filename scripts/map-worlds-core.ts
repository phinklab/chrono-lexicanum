/**
 * map-worlds-core.ts — Brief 174 (P14 Teil A) + Brief 183 (Daten-Pass). PURE
 * core of the map-catalog convert step: Excel rows + curation sheet +
 * repo-derived media edges → `map-worlds.json` (catalog) +
 * `map-worlds.review.md` (hand-gate report).
 *
 * NO DB, NO filesystem at call time (the IO wrapper `import-map-worlds.ts`
 * reads the inputs; this module composes them). The media derivation reuses
 * the SAME shared code paths the DB apply uses, so the catalog cannot drift
 * from `work_locations` semantics:
 *
 *   books    → `resolveLocations()` (scripts/resolve-book-edges.ts — the exact
 *              path `apply:book` writes) + the curation-overlay location tail
 *              (`computeBookOps`, add=upsert / remove=delete, mirroring
 *              `apply:curation-overlay`).
 *   episodes → the `apply-plan.ts` junction rules verbatim (FK-gate against
 *              locations.json ids, per-episode dedup with subject>mentioned,
 *              `deriveEpisodeSlug` for the frozen episode work slug).
 *
 * Excel-name → locations.json match is CASE-INSENSITIVE over canonical names
 * + alias keys (Philipp-Entscheid, Brief 174 Arch-Entscheidung 2) — unlike
 * the case-sensitive book-edge resolver, because Excel casing is foreign.
 * There is deliberately NO fuzzy matching (Brief 183): everything beyond the
 * exact match is explicit hand curation in
 * `scripts/seed-data/source/map-worlds-curation.xlsx` (sheet "Kuration",
 * one row per unmatched media location; actions link / rollup / pin; sheet
 * "Welten" for per-world locationId overrides — replaces the retired
 * `map-worlds.overrides.json`).
 *
 * Duplicate rule (review): the source map's repeated names (fleets, webway
 * gates, blackstone fortresses at several positions) are LEGITIMATE multi-pin
 * objects — ALL rows are kept and repeated slugs get deterministic ordinal
 * suffixes in sheet order (`commorragh`, `commorragh-2`, …). Nothing is
 * dropped; curation actions targeting a duplicated name apply to ALL
 * instances, consistent with the matcher.
 */
import { slugify } from "@/lib/slug";
import { deriveEpisodeSlug } from "@/lib/ingestion/podcast/apply-plan";
import type { ShowArtifact } from "@/lib/ingestion/podcast/types";
import {
  MAP_WORLDS_SCHEMA,
  type MapWorld,
  type MapWorldKind,
  type MapWorldWork,
  type MapWorldsFile,
  type BookWorkRole,
  type EpisodeWorkRole,
} from "@/lib/map/map-worlds-schema";
import { resolveLocations } from "./resolve-book-edges";
import { computeBookOps, type CurationOverlay } from "./curation-overlay";
import type { BookFileV1 } from "./book-file";

// =============================================================================
// Grid projection — frozen calibration of the redditor's pixel space
// =============================================================================

/**
 * Coordinate extent of the FROZEN 992-row Excel (probe 2026-07-02):
 * x ∈ [2.794, 7031], y ∈ [515, 6198] — pixel space of the source map image.
 * Hardcoded (not re-derived per run) so the projection is a STABLE contract:
 * curation pins are hand-entered in the SAME pixel space as the redditor
 * Excel (copy-paste compatible) and projected with the SAME formula — the
 * grid output must not shift if the Excel were ever re-exported. A source
 * row outside this box is a recalibration decision for a human → hard error.
 */
export const SOURCE_EXTENT = {
  minX: 2.794,
  maxX: 7031,
  minY: 515,
  maxY: 6198,
} as const;

export const GRID_GX_MAX = 1000;
/** ONE shared scale factor (the larger x-span) keeps the aspect ratio true. */
const GRID_SCALE = GRID_GX_MAX / (SOURCE_EXTENT.maxX - SOURCE_EXTENT.minX);
/** gy tops out below 1000 because the source map is wider than tall. */
export const GRID_GY_MAX = round2((SOURCE_EXTENT.maxY - SOURCE_EXTENT.minY) * GRID_SCALE);

/** Human-readable projection doc, embedded in the catalog's `grid.transform`. */
export const GRID_TRANSFORM_DOC =
  `gx = (x - ${SOURCE_EXTENT.minX}) * ${GRID_GX_MAX}/${SOURCE_EXTENT.maxX - SOURCE_EXTENT.minX}, ` +
  `gy = (y - ${SOURCE_EXTENT.minY}) * ${GRID_GX_MAX}/${SOURCE_EXTENT.maxX - SOURCE_EXTENT.minX} ` +
  `(gleicher Skalierungsfaktor für beide Achsen = seitenverhältnis-treu; y wächst wie im ` +
  `Quellbild nach unten; gerundet auf 2 Nachkommastellen). Quelle: Warhammer_map_SSOT.xlsx, ` +
  `Pixel-Raum x ∈ [${SOURCE_EXTENT.minX}, ${SOURCE_EXTENT.maxX}], y ∈ [${SOURCE_EXTENT.minY}, ${SOURCE_EXTENT.maxY}].`;

/** The five Segmenta of the frozen source sheet — a sixth value is drift.
 *  Curation pins must use one of these, too. */
export const KNOWN_SEGMENTA: ReadonlySet<string> = new Set([
  "Solar",
  "Obscurus",
  "Pacificus",
  "Tempestus",
  "Ultima",
]);

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/** Project one source-pixel coordinate pair onto the 0–1000 grid. */
export function projectToGrid(x: number, y: number, at: string): { gx: number; gy: number } {
  if (x < SOURCE_EXTENT.minX || x > SOURCE_EXTENT.maxX || y < SOURCE_EXTENT.minY || y > SOURCE_EXTENT.maxY) {
    throw new Error(
      `${at}: coordinate (${x}, ${y}) is outside the calibrated source extent ` +
        `x ∈ [${SOURCE_EXTENT.minX}, ${SOURCE_EXTENT.maxX}], y ∈ [${SOURCE_EXTENT.minY}, ${SOURCE_EXTENT.maxY}]. ` +
        `The Excel is frozen input — a new extent means recalibrating SOURCE_EXTENT (human decision).`,
    );
  }
  return {
    gx: round2((x - SOURCE_EXTENT.minX) * GRID_SCALE),
    gy: round2((y - SOURCE_EXTENT.minY) * GRID_SCALE),
  };
}

// =============================================================================
// kind mapping — Brief 183 § Daten D, verbatim. All 70 Excel primary values →
// 11 groups; `region` is curation-pin-only (never an Excel value).
// =============================================================================

/** Klassifikation cell value that marks a curation pin as a region. */
export const REGION_CLASSIFICATION = "Region" as const;

const KIND_GROUPS: ReadonlyArray<[MapWorldKind, ReadonlyArray<string>]> = [
  [
    "imperial",
    [
      "Civilized World", "Hive World", "Industrial World", "Agri World", "Mining World",
      "Feral World", "Feudal World", "Frontier World", "Shrine World", "Cardinal World",
      "Cemetary World", "Penal World", "Quarry World", "Anchor World", "Ocean World",
      "Forest World", "Ice World", "Frozen World", "Gas Giant", "Artificial World",
      "Terra", "Mars", "War World", "Death World", "Severan Dominate World",
      "Lion's Protectorate",
    ],
  ],
  [
    "imperial-military",
    ["Fortress World", "Adeptus Astartes World", "Imperial Knight World", "Mechanicus Knight World", "Forge World"],
  ],
  [
    "station",
    [
      "Space Station", "Research Station", "Imperial Navy Base", "Deathwatch Fortress",
      "Custodes Watch Station", "Segmentum Fortress", "Inactive Blackstone Fortress",
      "Active Blackstone Fortress",
    ],
  ],
  ["fleet", ["Adeptus Astartes Fleet", "Imperial Fleet", "Necron Warship"]],
  [
    "chaos-warp",
    [
      "Warp Storm", "Daemon World", "Tzeentch Daemon World", "Nurgle Daemon World",
      "Slaanesh Daemon World", "Khorne Daemon World", "Hell Forge", "Fallen Knight World",
    ],
  ],
  ["gate", ["Webway Gate", "Warp Gate"]],
  ["aeldari", ["Craftworld", "Exodite World", "Maiden World"]],
  ["necron", ["Necron Tomb World", "Necron Crown World", "Contra Empyric Nexus"]],
  [
    "xenos",
    [
      "Ork World", "T'au Sept", "T'au Aligned World", "Firesight Enclave",
      "Votann Hold World", "Genestealer Infested", "Xenos World",
    ],
  ],
  ["dead", ["Dead World", "Destroyed World", "Devoured World", "Forbidden World"]],
  ["unclassified", ["Unclassified"]],
] as const;

/** Primary-Classification → kind. Exactly the 70 known Excel values; a value
 *  missing here (incl. "Region", which is curation-pin-only) is a DELIBERATE
 *  fail-loud: new Excel values require a conscious group assignment. */
export const KIND_BY_CLASSIFICATION: ReadonlyMap<string, MapWorldKind> = new Map(
  KIND_GROUPS.flatMap(([kind, values]) => values.map((v): [string, MapWorldKind] => [v, kind])),
);

// =============================================================================
// Input shapes
// =============================================================================

/** One validated Excel data row (IO layer parses + validates the sheet).
 *  Tertiary classification is deliberately dropped (4 rows, Brief 183). */
export interface ExcelWorldRow {
  /** 1-based Excel row number (header = row 1) — for review/error messages. */
  sourceRow: number;
  name: string;
  primary: string | null;
  secondary: string | null;
  x: number;
  y: number;
  segmentum: string;
}

// =============================================================================
// Curation sheet — map-worlds-curation.xlsx, the hand path (Brief 183).
// Replaces the retired map-worlds.overrides.json. Sheet "Kuration" is keyed
// by media location (one row per unmatched locations.json row with ≥1 work);
// sheet "Welten" is keyed by catalog world id (locationId override, e.g. to
// decouple one duplicate pin). The convert READS the file only.
// =============================================================================

/** Raw cell as delivered by `read-excel-file` (mirrors its value union). */
export type SheetCell = string | number | boolean | Date | null | undefined;

export type CurationAction = "link" | "rollup" | "pin";

/** One parsed row of sheet "Kuration". `action: null` = open (empty cell or
 *  "später"). The Bücher/Episoden columns are informational snapshots and are
 *  ignored by the convert (counts are re-derived every run). */
export interface CurationRow {
  /** 1-based sheet row (header = row 1) — for error messages. */
  sheetRow: number;
  locationId: string;
  name: string;
  action: CurationAction | null;
  /** Verbatim Aktion cell (trimmed) — `--sync-curation` writes it back so a
   *  hand-typed "später" marker survives the rewrite. */
  actionRaw: string;
  /** Catalog world id — required for link/rollup. */
  target: string | null;
  /** Pin coordinates in the SSOT pixel space (same numbers as the redditor
   *  Excel's Coordinates columns) — projected to the grid by the convert. */
  x: number | null;
  y: number | null;
  segmentum: string | null;
  classification: string | null;
  note: string | null;
}

/** One parsed row of sheet "Welten": force a world's locationId (a
 *  locations.json id) or force-unmatch it (cell "null" or "-"). */
export interface CurationWorldRow {
  sheetRow: number;
  worldId: string;
  locationIdOverride: string | null;
  note: string | null;
}

export interface CurationInput {
  rows: CurationRow[];
  worldRows: CurationWorldRow[];
}

export const CURATION_HEADERS = [
  "locationId", "Name", "Bücher", "Episoden", "Aktion", "Ziel",
  "x", "y", "Segmentum", "Klassifikation", "Notiz",
] as const;

export const WELTEN_HEADERS = ["Welt-ID", "locationId-Override", "Notiz"] as const;

function cellText(v: SheetCell): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function cellTextOrNull(v: SheetCell): string | null {
  const s = cellText(v);
  return s === "" ? null : s;
}

/** Numeric cell: real numbers pass through; text cells are parsed leniently
 *  (German decimal comma tolerated — hand-typed cells sometimes come through
 *  as text). Returns null for empty, NaN marker via exception. */
function cellNumberOrNull(v: SheetCell, at: string, issues: string[]): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") {
    if (!Number.isFinite(v)) {
      issues.push(`${at}: number is not finite`);
      return null;
    }
    return v;
  }
  const s = String(v).trim();
  if (s === "") return null;
  const n = Number(s.replace(",", "."));
  if (!Number.isFinite(n)) {
    issues.push(`${at}: "${s}" is not a number`);
    return null;
  }
  return n;
}

function isEmptyRow(row: ReadonlyArray<SheetCell>): boolean {
  return row.every((c) => cellText(c) === "");
}

function checkHeader(
  actual: ReadonlyArray<SheetCell>,
  expected: ReadonlyArray<string>,
  sheet: string,
): void {
  const got = expected.map((_, i) => cellText(actual[i]));
  if (!expected.every((h, i) => got[i] === h)) {
    throw new Error(
      `map-worlds-curation.xlsx sheet "${sheet}": header mismatch.\n` +
        `  expected: ${JSON.stringify(expected)}\n` +
        `  actual:   ${JSON.stringify(got)}`,
    );
  }
}

/** Parse + shape-validate sheet "Kuration". Throws listing ALL problems. */
export function parseCurationSheet(raw: ReadonlyArray<ReadonlyArray<SheetCell>>): CurationRow[] {
  checkHeader(raw[0] ?? [], CURATION_HEADERS, "Kuration");
  const issues: string[] = [];
  const rows: CurationRow[] = [];
  const seenLocationIds = new Map<string, number>();
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i]!;
    const sheetRow = i + 1;
    if (isEmptyRow(row)) continue;
    const at = `Kuration row ${sheetRow}`;
    const locationId = cellText(row[0]);
    const name = cellText(row[1]);
    if (locationId === "") {
      issues.push(`${at}: locationId is empty but the row carries data`);
      continue;
    }
    const firstRow = seenLocationIds.get(locationId);
    if (firstRow !== undefined) {
      issues.push(`${at}: duplicate locationId "${locationId}" (first seen in row ${firstRow})`);
      continue;
    }
    seenLocationIds.set(locationId, sheetRow);
    if (name === "") issues.push(`${at} ("${locationId}"): Name is empty`);

    const actionRaw = cellText(row[4]);
    const actionKey = actionRaw.toLowerCase();
    let action: CurationAction | null;
    if (actionKey === "" || actionKey === "später" || actionKey === "spaeter") {
      action = null;
    } else if (actionKey === "link" || actionKey === "rollup" || actionKey === "pin") {
      action = actionKey;
    } else {
      issues.push(`${at} ("${locationId}"): unknown Aktion "${cellText(row[4])}" (expected link | rollup | pin | später | empty)`);
      continue;
    }

    const target = cellTextOrNull(row[5]);
    const x = cellNumberOrNull(row[6], `${at} ("${locationId}") x`, issues);
    const y = cellNumberOrNull(row[7], `${at} ("${locationId}") y`, issues);
    const segmentum = cellTextOrNull(row[8]);
    const classification = cellTextOrNull(row[9]);
    const note = cellTextOrNull(row[10]);

    if ((action === "link" || action === "rollup") && target === null) {
      issues.push(`${at} ("${locationId}"): Aktion "${action}" requires Ziel (a catalog world id)`);
    }
    if (action === "pin") {
      if (x === null || y === null) issues.push(`${at} ("${locationId}"): Aktion "pin" requires x AND y`);
      if (segmentum === null) issues.push(`${at} ("${locationId}"): Aktion "pin" requires Segmentum`);
      if (classification === null) issues.push(`${at} ("${locationId}"): Aktion "pin" requires Klassifikation`);
      if (target !== null) issues.push(`${at} ("${locationId}"): Aktion "pin" must not carry Ziel`);
    }

    rows.push({ sheetRow, locationId, name, action, actionRaw, target, x, y, segmentum, classification, note });
  }
  if (issues.length > 0) {
    throw new Error(`map-worlds-curation.xlsx sheet "Kuration" invalid:\n  - ${issues.join("\n  - ")}`);
  }
  return rows;
}

/** Parse + shape-validate sheet "Welten". Throws listing ALL problems. */
export function parseWeltenSheet(raw: ReadonlyArray<ReadonlyArray<SheetCell>>): CurationWorldRow[] {
  checkHeader(raw[0] ?? [], WELTEN_HEADERS, "Welten");
  const issues: string[] = [];
  const rows: CurationWorldRow[] = [];
  const seenWorldIds = new Map<string, number>();
  for (let i = 1; i < raw.length; i++) {
    const row = raw[i]!;
    const sheetRow = i + 1;
    if (isEmptyRow(row)) continue;
    const at = `Welten row ${sheetRow}`;
    const worldId = cellText(row[0]);
    if (worldId === "") {
      issues.push(`${at}: Welt-ID is empty but the row carries data`);
      continue;
    }
    const firstRow = seenWorldIds.get(worldId);
    if (firstRow !== undefined) {
      issues.push(`${at}: duplicate Welt-ID "${worldId}" (first seen in row ${firstRow})`);
      continue;
    }
    seenWorldIds.set(worldId, sheetRow);
    const overrideRaw = cellText(row[1]);
    if (overrideRaw === "") {
      issues.push(`${at} ("${worldId}"): locationId-Override is empty — use a locations.json id, or "null" / "-" to force-unmatch`);
      continue;
    }
    const locationIdOverride =
      overrideRaw === "-" || overrideRaw.toLowerCase() === "null" ? null : overrideRaw;
    rows.push({ sheetRow, worldId, locationIdOverride, note: cellTextOrNull(row[2]) });
  }
  if (issues.length > 0) {
    throw new Error(`map-worlds-curation.xlsx sheet "Welten" invalid:\n  - ${issues.join("\n  - ")}`);
  }
  return rows;
}

// =============================================================================
// Location matcher — case-insensitive over canonical names + alias keys
// =============================================================================

export interface SeedLocation {
  id: string;
  name: string;
}

/**
 * Build the case-insensitive surface-form → locationId map. Fails loud when
 * two rows/aliases claim the same lowercased surface form for DIFFERENT ids
 * (silent ambiguity would make the Excel match nondeterministic) or when an
 * alias points at an id `locations.json` does not have.
 */
export function buildLocationMatcher(
  locations: ReadonlyArray<SeedLocation>,
  aliases: Readonly<Record<string, string>>,
): Map<string, string> {
  const knownIds = new Set(locations.map((l) => l.id));
  const matcher = new Map<string, string>();
  const claim = (surface: string, id: string, source: string): void => {
    const key = surface.trim().toLowerCase();
    if (key === "") return;
    const existing = matcher.get(key);
    if (existing !== undefined && existing !== id) {
      throw new Error(
        `location matcher: surface form "${surface}" (${source}) maps to both ` +
          `"${existing}" and "${id}" — resolve the ambiguity in locations.json/location-aliases.json.`,
      );
    }
    matcher.set(key, id);
  };
  for (const l of locations) claim(l.name, l.id, "locations.json name");
  for (const [surface, id] of Object.entries(aliases)) {
    if (!knownIds.has(id)) {
      throw new Error(
        `location matcher: alias "${surface}" points at unknown location id "${id}".`,
      );
    }
    claim(surface, id, "location-aliases.json key");
  }
  return matcher;
}

// =============================================================================
// Media derivation — books (corpus + overlay tail) and podcast episodes
// =============================================================================

export interface BookDerivationNotes {
  bookCount: number;
  booksWithLocationEdges: number;
  bookEdgeCount: number;
  overlayLocationAdds: number;
  overlayLocationRemoves: number;
  /** Overlay `final` books with location ops but no corpus file — skipped. */
  overlayBooksNotInCorpus: string[];
}

/**
 * Books → location edges, exactly as the DB path crystallizes them:
 * `resolveLocations(curation.locations)` per book, then the curation-overlay
 * location tail (remove = drop the (book, location) edge, add = upsert with
 * the hand role) — mirroring `apply:book` + `apply:curation-overlay`.
 */
export function deriveBookEdges(
  books: ReadonlyArray<BookFileV1>,
  overlay: CurationOverlay | null,
): { byLocation: Map<string, MapWorldWork[]>; notes: BookDerivationNotes } {
  const notes: BookDerivationNotes = {
    bookCount: books.length,
    booksWithLocationEdges: 0,
    bookEdgeCount: 0,
    overlayLocationAdds: 0,
    overlayLocationRemoves: 0,
    overlayBooksNotInCorpus: [],
  };

  // Corpus pass — per book: locationId → role (shared resolver path).
  const edgesByExternalId = new Map<string, Map<string, BookWorkRole>>();
  const bookByExternalId = new Map<string, BookFileV1>();
  for (const book of books) {
    bookByExternalId.set(book.externalBookId, book);
    const resolved = resolveLocations(book.curation.locations);
    const perBook = new Map<string, BookWorkRole>();
    for (const e of resolved) perBook.set(e.id, e.role);
    edgesByExternalId.set(book.externalBookId, perBook);
  }

  // Overlay tail — location axis only, remove-then-add like `applyBookOps`.
  if (overlay !== null) {
    for (const overlayBook of overlay.final.books) {
      const ops = computeBookOps(overlayBook);
      const locationRemoves = ops.edgeRemoves.filter((r) => r.axis === "locations");
      const locationAdds = ops.edgeAdds.filter((a) => a.axis === "locations");
      if (locationRemoves.length === 0 && locationAdds.length === 0) continue;
      const perBook = edgesByExternalId.get(overlayBook.externalBookId);
      if (perBook === undefined) {
        notes.overlayBooksNotInCorpus.push(overlayBook.externalBookId);
        continue;
      }
      for (const r of locationRemoves) {
        if (perBook.delete(r.id)) notes.overlayLocationRemoves += 1;
      }
      for (const a of locationAdds) {
        // validateOverlay enforced AXIS_ROLES.locations = primary|secondary|mentioned.
        perBook.set(a.id, a.role as BookWorkRole);
        notes.overlayLocationAdds += 1;
      }
    }
  }

  // Invert: locationId → sorted book work refs.
  const byLocation = new Map<string, MapWorldWork[]>();
  for (const [externalId, perBook] of edgesByExternalId) {
    if (perBook.size === 0) continue;
    notes.booksWithLocationEdges += 1;
    const book = bookByExternalId.get(externalId);
    if (book === undefined) continue; // unreachable — same key set
    for (const [locationId, role] of perBook) {
      notes.bookEdgeCount += 1;
      const list = byLocation.get(locationId) ?? [];
      list.push({ type: "book", slug: book.slug, title: book.title, role });
      byLocation.set(locationId, list);
    }
  }
  return { byLocation, notes };
}

export interface PodcastDerivationNotes {
  showCount: number;
  episodeCount: number;
  episodesWithLocations: number;
  episodeEdgeCount: number;
  /** Tags whose canonicalId is not a locations.json id (FK-gate), per apply-plan. */
  droppedMissingRef: number;
}

/**
 * Podcast episodes → location edges, mirroring `apply-plan.ts` verbatim:
 * FK-gate against the seed location ids, per-episode dedup by canonicalId
 * with `subject` beating `mentioned`, episode work slug via
 * `deriveEpisodeSlug(show, guid)`.
 */
export function derivePodcastEdges(
  artifacts: ReadonlyArray<ShowArtifact>,
  validLocationIds: ReadonlySet<string>,
): { byLocation: Map<string, MapWorldWork[]>; notes: PodcastDerivationNotes } {
  const notes: PodcastDerivationNotes = {
    showCount: artifacts.length,
    episodeCount: 0,
    episodesWithLocations: 0,
    episodeEdgeCount: 0,
    droppedMissingRef: 0,
  };
  const byLocation = new Map<string, MapWorldWork[]>();
  for (const artifact of artifacts) {
    for (const episode of artifact.episodes) {
      notes.episodeCount += 1;
      const perEpisode = new Map<string, EpisodeWorkRole>();
      for (const tag of episode.tags) {
        if (tag.type !== "location") continue;
        if (!validLocationIds.has(tag.canonicalId)) {
          notes.droppedMissingRef += 1;
          continue;
        }
        const existing = perEpisode.get(tag.canonicalId);
        if (existing === undefined || (existing === "mentioned" && tag.role === "subject")) {
          perEpisode.set(tag.canonicalId, tag.role);
        }
      }
      if (perEpisode.size === 0) continue;
      notes.episodesWithLocations += 1;
      for (const [locationId, role] of perEpisode) {
        notes.episodeEdgeCount += 1;
        const list = byLocation.get(locationId) ?? [];
        list.push({
          type: "podcast_episode",
          slug: deriveEpisodeSlug(artifact.show.slug, episode.guid),
          show: artifact.show.slug,
          title: episode.title,
          role,
        });
        byLocation.set(locationId, list);
      }
    }
  }
  return { byLocation, notes };
}

/** Stable per-location work order: books before episodes, each by slug. */
function compareWorks(a: MapWorldWork, b: MapWorldWork): number {
  if (a.type !== b.type) return a.type === "book" ? -1 : 1;
  return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
}

/** Merge book + episode edges into one map with the stable order. */
export function mergeWorkEdges(
  bookEdges: ReadonlyMap<string, MapWorldWork[]>,
  podcastEdges: ReadonlyMap<string, MapWorldWork[]>,
): Map<string, MapWorldWork[]> {
  const merged = new Map<string, MapWorldWork[]>();
  const locationIds = new Set<string>([...bookEdges.keys(), ...podcastEdges.keys()]);
  for (const id of [...locationIds].sort()) {
    merged.set(id, [...(bookEdges.get(id) ?? []), ...(podcastEdges.get(id) ?? [])].sort(compareWorks));
  }
  return merged;
}

// =============================================================================
// Catalog composition
// =============================================================================

/** Rollup role conflict: the stronger role wins (Brief 183 Scope 2). Book and
 *  episode entries never collide (dedup key includes `type`). */
function roleStrength(work: MapWorldWork): number {
  if (work.type === "book") {
    return work.role === "primary" ? 3 : work.role === "secondary" ? 2 : 1;
  }
  return work.role === "subject" ? 2 : 1;
}

interface WorldDraft {
  id: string;
  name: string;
  kind: MapWorldKind;
  classification: string | null;
  classification2: string | null;
  segmentum: string | null;
  gx: number;
  gy: number;
  origin: "excel" | "override";
  /** undefined = auto-match by name; string|null = forced by curation. */
  forcedLocationId: string | null | undefined;
  sourceRow: number | null;
}

export interface DuplicateNameGroup {
  name: string;
  entries: Array<{ id: string; sourceRow: number; gx: number; gy: number; segmentum: string | null }>;
}

export interface IdCollisionGroup {
  baseId: string;
  names: string[];
}

export interface AppliedLink {
  locationId: string;
  locationName: string;
  worldIds: string[];
  works: number;
}

export interface AppliedRollup {
  locationId: string;
  locationName: string;
  worldIds: string[];
  works: number;
}

export interface AppliedPin {
  locationId: string;
  worldId: string;
  name: string;
  kind: MapWorldKind;
  /** Hand-entered SSOT pixel coordinates (sheet input). */
  x: number;
  y: number;
  /** Projected grid coordinates (catalog output). */
  gx: number;
  gy: number;
  works: number;
}

export interface AppliedWorldOverride {
  worldId: string;
  locationId: string | null;
}

export interface AppliedCuration {
  links: AppliedLink[];
  rollups: AppliedRollup[];
  pins: AppliedPin[];
  worldOverrides: AppliedWorldOverride[];
}

export interface ReviewData {
  totals: {
    excelWorlds: number;
    addedWorlds: number;
    matched: number;
    matchedWithWorks: number;
    distinctMatchedLocationIds: number;
  };
  coverage: { placedWorkEdges: number; totalWorkEdges: number };
  /** §1 — matched worlds with their work counts. */
  matchedWorlds: Array<{ id: string; name: string; locationId: string; books: number; episodes: number }>;
  /** §2 — open worklist: locations with ≥1 work, neither matched/linked/
   *  pinned nor rolled up. Sorted by work count DESC (Philipps priority). */
  unplacedLocations: Array<{
    locationId: string;
    name: string;
    books: number;
    episodes: number;
    /** false = the curation sheet has no row for this location yet
     *  (run `import:map-worlds -- --sync-curation`). */
    inCurationSheet: boolean;
  }>;
  /** §3 — applied hand curation (sheet order). */
  applied: AppliedCuration;
  /** §4 — repeated Excel names + the applied keep-all rule. */
  duplicateNameGroups: DuplicateNameGroup[];
  /** §5 — different raw names slugifying onto the same base id. */
  idCollisions: IdCollisionGroup[];
  /** §6 — derivation notes. */
  bookNotes: BookDerivationNotes;
  podcastNotes: PodcastDerivationNotes;
}

export interface CatalogInputs {
  excelRows: ExcelWorldRow[];
  curation: CurationInput;
  /** Case-insensitive surface form → locationId (from `buildLocationMatcher`). */
  matcher: ReadonlyMap<string, string>;
  /** locationId → canonical display name (review §2). */
  locationNames: ReadonlyMap<string, string>;
  worksByLocation: ReadonlyMap<string, MapWorldWork[]>;
  bookNotes: BookDerivationNotes;
  podcastNotes: PodcastDerivationNotes;
}

const CATALOG_DOC =
  "Map-Katalog der neuen Galaxiekarte (Brief 174 + 183, P14 Teil A) — generiert von " +
  "`npm run import:map-worlds` aus Warhammer_map_SSOT.xlsx (Welten + Koordinaten des " +
  "Redditors) + map-worlds-curation.xlsx (Hand-Kuration: link/rollup/pin + Welten-Overrides). " +
  "`locationId` verlinkt auf die bestehende locations.json-Row (/welt/{id}); `works` " +
  "sind die Bücher + Podcast-Episoden der verknüpften Location (Rollup-Werke tragen `via`), " +
  "DB-frei abgeleitet aus scripts/seed-data/books/*.json + curation-overlay.json + " +
  "ingest/podcasts/<show>.json. `kind` gruppiert die 70 Excel-Klassifikationen in 11 Gruppen " +
  "+ `region` (Kurations-Pins). NICHT von Hand editieren: Kuration in " +
  "map-worlds-curation.xlsx, dann Convert neu laufen lassen.";

/** Compose the catalog + review data from prepared inputs. Pure. */
export function buildCatalog(inputs: CatalogInputs): { file: MapWorldsFile; review: ReviewData } {
  const errors: string[] = [];

  const kindFor = (classification: string | null, at: string): MapWorldKind => {
    if (classification === null) {
      errors.push(`${at}: Primary Classification is empty — new/unknown values need a deliberate kind assignment (Brief 183 § Daten D)`);
      return "unclassified";
    }
    const kind = KIND_BY_CLASSIFICATION.get(classification);
    if (kind === undefined) {
      errors.push(`${at}: unknown classification "${classification}" — new Excel values need a deliberate kind assignment (Brief 183 § Daten D)`);
      return "unclassified";
    }
    return kind;
  };

  // ---- 1. Excel rows → drafts with deterministic ids + kind ------------------
  const drafts: WorldDraft[] = [];
  const usedIds = new Set<string>();
  const byBaseId = new Map<string, Array<{ name: string; draft: WorldDraft }>>();
  for (const row of inputs.excelRows) {
    const base = slugify(row.name);
    if (base === "") {
      errors.push(`Excel row ${row.sourceRow}: name "${row.name}" slugifies to an empty id`);
      continue;
    }
    let id = base;
    for (let n = 2; usedIds.has(id); n++) id = `${base}-${n}`;
    usedIds.add(id);
    const { gx, gy } = projectToGrid(row.x, row.y, `Excel row ${row.sourceRow} ("${row.name}")`);
    const draft: WorldDraft = {
      id,
      name: row.name,
      kind: kindFor(row.primary, `Excel row ${row.sourceRow} ("${row.name}")`),
      classification: row.primary,
      classification2: row.secondary,
      segmentum: row.segmentum,
      gx,
      gy,
      origin: "excel",
      forcedLocationId: undefined,
      sourceRow: row.sourceRow,
    };
    drafts.push(draft);
    const group = byBaseId.get(base) ?? [];
    group.push({ name: row.name, draft });
    byBaseId.set(base, group);
  }
  const draftById = new Map(drafts.map((d) => [d.id, d]));

  // ---- 2. Sheet "Welten" — per-world locationId overrides --------------------
  const applied: AppliedCuration = { links: [], rollups: [], pins: [], worldOverrides: [] };
  for (const wr of inputs.curation.worldRows) {
    const at = `Welten row ${wr.sheetRow} ("${wr.worldId}")`;
    const draft = draftById.get(wr.worldId);
    if (draft === undefined) {
      errors.push(`${at}: no catalog world with this id`);
      continue;
    }
    if (wr.locationIdOverride !== null && !inputs.locationNames.has(wr.locationIdOverride)) {
      errors.push(`${at}: locationId-Override "${wr.locationIdOverride}" is not a locations.json id`);
      continue;
    }
    draft.forcedLocationId = wr.locationIdOverride;
    applied.worldOverrides.push({ worldId: wr.worldId, locationId: wr.locationIdOverride });
  }

  // ---- 3. Pre-curation match state (guard base) -------------------------------
  // Which locations are already covered BEFORE link/rollup/pin? A curation
  // action on such a location is stale → fail loud (Brief 183 Scope 1).
  const preMatchedLocationIds = new Set<string>();
  for (const d of drafts) {
    const effective =
      d.forcedLocationId !== undefined
        ? d.forcedLocationId
        : (inputs.matcher.get(d.name.trim().toLowerCase()) ?? null);
    if (effective !== null) preMatchedLocationIds.add(effective);
  }

  const curationRows = inputs.curation.rows;
  for (const row of curationRows) {
    const at = `Kuration row ${row.sheetRow} ("${row.locationId}")`;
    if (!inputs.locationNames.has(row.locationId)) {
      errors.push(`${at}: locationId is not a locations.json id`);
      continue;
    }
    if (row.action !== null && preMatchedLocationIds.has(row.locationId)) {
      errors.push(
        `${at}: Aktion "${row.action}" on an already matched location — the catalog covers it ` +
          `(via name match or Welten-Override); remove the Aktion or the row`,
      );
    }
  }

  /** All drafts sharing the target draft's (trimmed, lowercased) name —
   *  curation actions apply to every instance, consistent with the matcher. */
  const sameNameInstances = (target: WorldDraft): WorldDraft[] => {
    const key = target.name.trim().toLowerCase();
    return drafts.filter((d) => d.name.trim().toLowerCase() === key);
  };

  // ---- 4. Pins — new hand-placed worlds (BEFORE rollups: Brief 183 Scope 2) --
  for (const row of curationRows) {
    if (row.action !== "pin") continue;
    const at = `Kuration row ${row.sheetRow} ("${row.locationId}")`;
    if (row.x === null || row.y === null || row.segmentum === null || row.classification === null) {
      // parseCurationSheet already rejects this; double-guard for direct calls.
      errors.push(`${at}: pin requires x, y, Segmentum, Klassifikation`);
      continue;
    }
    // Pin coordinates are SSOT-pixel-space (redditor-Excel-kompatibel) and go
    // through the SAME projection as Excel worlds — out-of-extent fails loud.
    let projected: { gx: number; gy: number };
    try {
      projected = projectToGrid(row.x, row.y, at);
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
      continue;
    }
    if (!KNOWN_SEGMENTA.has(row.segmentum)) {
      errors.push(`${at}: unknown Segmentum "${row.segmentum}" (expected one of ${[...KNOWN_SEGMENTA].join(", ")})`);
      continue;
    }
    const kind: MapWorldKind =
      row.classification === REGION_CLASSIFICATION
        ? "region"
        : kindFor(row.classification, at);
    const id = slugify(row.name);
    if (id === "") {
      errors.push(`${at}: pin name "${row.name}" slugifies to an empty id`);
      continue;
    }
    if (usedIds.has(id)) {
      errors.push(`${at}: pin id "${id}" already exists in the catalog — rename the pin`);
      continue;
    }
    usedIds.add(id);
    const draft: WorldDraft = {
      id,
      name: row.name,
      kind,
      classification: row.classification,
      classification2: null,
      segmentum: row.segmentum,
      gx: projected.gx,
      gy: projected.gy,
      origin: "override",
      forcedLocationId: row.locationId,
      sourceRow: null,
    };
    drafts.push(draft);
    draftById.set(id, draft);
    applied.pins.push({
      locationId: row.locationId,
      worldId: id,
      name: row.name,
      kind,
      x: row.x,
      y: row.y,
      gx: draft.gx,
      gy: draft.gy,
      works: (inputs.worksByLocation.get(row.locationId) ?? []).length,
    });
  }

  // ---- 5. Links — an Excel world exists under another name --------------------
  for (const row of curationRows) {
    if (row.action !== "link") continue;
    const at = `Kuration row ${row.sheetRow} ("${row.locationId}")`;
    if (row.target === null) continue; // parse guard
    const target = draftById.get(row.target);
    if (target === undefined) {
      errors.push(`${at}: Ziel "${row.target}" is not a catalog world id`);
      continue;
    }
    const instances = sameNameInstances(target);
    let ok = true;
    for (const inst of instances) {
      if (inst.forcedLocationId !== undefined) {
        errors.push(`${at}: Ziel-Welt "${inst.id}" already carries a forced locationId (Welten-Override or another link)`);
        ok = false;
        continue;
      }
      const natural = inputs.matcher.get(inst.name.trim().toLowerCase());
      if (natural !== undefined) {
        errors.push(`${at}: Ziel-Welt "${inst.id}" already matches location "${natural}" by name — a link would silently replace it`);
        ok = false;
      }
    }
    if (!ok) continue;
    for (const inst of instances) inst.forcedLocationId = row.locationId;
    applied.links.push({
      locationId: row.locationId,
      locationName: inputs.locationNames.get(row.locationId) ?? row.locationId,
      worldIds: instances.map((i) => i.id),
      works: (inputs.worksByLocation.get(row.locationId) ?? []).length,
    });
  }

  // ---- 6. Match + attach own-location works -----------------------------------
  const worlds: MapWorld[] = [];
  const worldByDraftId = new Map<string, MapWorld>();
  for (const draft of drafts) {
    let locationId: string | null;
    if (draft.forcedLocationId !== undefined) {
      locationId = draft.forcedLocationId;
      if (locationId !== null && !inputs.locationNames.has(locationId)) {
        errors.push(`world "${draft.id}": forced locationId "${locationId}" is not a locations.json id`);
        continue;
      }
    } else {
      locationId = inputs.matcher.get(draft.name.trim().toLowerCase()) ?? null;
    }
    const works = locationId !== null ? [...(inputs.worksByLocation.get(locationId) ?? [])] : [];
    const world: MapWorld = {
      id: draft.id,
      name: draft.name,
      kind: draft.kind,
      classification: draft.classification,
      classification2: draft.classification2,
      segmentum: draft.segmentum,
      gx: draft.gx,
      gy: draft.gy,
      locationId,
      works,
      origin: draft.origin,
    };
    worlds.push(world);
    worldByDraftId.set(draft.id, world);
  }

  // ---- 7. Rollups — attach a location's works to a target world ---------------
  // AFTER pins (a rollup may target a pin world, e.g. helican → gudrun) and
  // AFTER own-location works, so dedup sees the target's own works.
  const rollupSourceIds = new Set(
    curationRows.filter((r) => r.action === "rollup").map((r) => r.locationId),
  );
  const rolledWorldIds = new Set<string>();
  for (const row of curationRows) {
    if (row.action !== "rollup") continue;
    const at = `Kuration row ${row.sheetRow} ("${row.locationId}")`;
    if (row.target === null) continue; // parse guard
    const targetDraft = draftById.get(row.target);
    if (targetDraft === undefined) {
      errors.push(`${at}: Ziel "${row.target}" is not a catalog world id`);
      continue;
    }
    const sourceWorks = inputs.worksByLocation.get(row.locationId) ?? [];
    const instances = sameNameInstances(targetDraft)
      .map((d) => worldByDraftId.get(d.id))
      .filter((w): w is MapWorld => w !== undefined);
    let ok = true;
    for (const world of instances) {
      if (world.locationId !== null && rollupSourceIds.has(world.locationId)) {
        errors.push(
          `${at}: Rollup-Kette — Ziel-Welt "${world.id}" (location "${world.locationId}") ist selbst ` +
            `Quelle eines Rollups; Ketten sind nicht erlaubt (direkt ans End-Ziel hängen)`,
        );
        ok = false;
      }
    }
    if (!ok) continue;
    for (const world of instances) {
      rolledWorldIds.add(world.id);
      for (const work of sourceWorks) {
        const existing = world.works.find((w) => w.type === work.type && w.slug === work.slug);
        if (existing === undefined) {
          world.works.push({ ...work, via: row.locationId });
        } else if (roleStrength(work) > roleStrength(existing)) {
          world.works[world.works.indexOf(existing)] = { ...work, via: row.locationId };
        }
      }
    }
    applied.rollups.push({
      locationId: row.locationId,
      locationName: inputs.locationNames.get(row.locationId) ?? row.locationId,
      worldIds: instances.map((w) => w.id),
      works: sourceWorks.length,
    });
  }
  for (const id of rolledWorldIds) {
    worldByDraftId.get(id)?.works.sort(compareWorks);
  }

  if (errors.length > 0) {
    throw new Error(`map-worlds convert failed:\n  - ${errors.join("\n  - ")}`);
  }

  worlds.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  // ---- 8. Coverage — placed vs. total (location, work) edges ------------------
  const coveredLocationIds = new Set(
    worlds.filter((w) => w.locationId !== null).map((w) => w.locationId as string),
  );
  let totalWorkEdges = 0;
  let placedWorkEdges = 0;
  for (const [locationId, works] of inputs.worksByLocation) {
    totalWorkEdges += works.length;
    if (coveredLocationIds.has(locationId) || rollupSourceIds.has(locationId)) {
      placedWorkEdges += works.length;
    }
  }

  // ---- 9. Review data ----------------------------------------------------------
  const matchedWorlds = worlds
    .filter((w): w is MapWorld & { locationId: string } => w.locationId !== null)
    .map((w) => ({
      id: w.id,
      name: w.name,
      locationId: w.locationId,
      books: w.works.filter((x) => x.type === "book" && x.via === undefined).length,
      episodes: w.works.filter((x) => x.type === "podcast_episode" && x.via === undefined).length,
    }));

  const curationRowLocationIds = new Set(curationRows.map((r) => r.locationId));
  const unplacedLocations = [...inputs.worksByLocation.entries()]
    .filter(
      ([locationId, works]) =>
        works.length > 0 && !coveredLocationIds.has(locationId) && !rollupSourceIds.has(locationId),
    )
    .map(([locationId, works]) => ({
      locationId,
      name: inputs.locationNames.get(locationId) ?? locationId,
      books: works.filter((x) => x.type === "book").length,
      episodes: works.filter((x) => x.type === "podcast_episode").length,
      inCurationSheet: curationRowLocationIds.has(locationId),
    }))
    .sort((a, b) => {
      const byWorks = b.books + b.episodes - (a.books + a.episodes);
      if (byWorks !== 0) return byWorks;
      return a.locationId < b.locationId ? -1 : a.locationId > b.locationId ? 1 : 0;
    });

  const duplicateNameGroups: DuplicateNameGroup[] = [];
  const idCollisions: IdCollisionGroup[] = [];
  for (const [baseId, group] of [...byBaseId.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (group.length < 2) continue;
    const distinctNames = new Set(group.map((g) => g.name.trim().toLowerCase()));
    if (distinctNames.size > 1) {
      idCollisions.push({ baseId, names: [...new Set(group.map((g) => g.name))] });
    }
    if (distinctNames.size < group.length) {
      duplicateNameGroups.push({
        name: group[0]!.name,
        entries: group.map((g) => ({
          id: g.draft.id,
          sourceRow: g.draft.sourceRow ?? 0,
          gx: g.draft.gx,
          gy: g.draft.gy,
          segmentum: g.draft.segmentum,
        })),
      });
    }
  }

  const review: ReviewData = {
    totals: {
      excelWorlds: worlds.filter((w) => w.origin === "excel").length,
      addedWorlds: worlds.filter((w) => w.origin === "override").length,
      matched: matchedWorlds.length,
      matchedWithWorks: matchedWorlds.filter((m) => m.books + m.episodes > 0).length,
      distinctMatchedLocationIds: coveredLocationIds.size,
    },
    coverage: { placedWorkEdges, totalWorkEdges },
    matchedWorlds,
    unplacedLocations,
    applied,
    duplicateNameGroups,
    idCollisions,
    bookNotes: inputs.bookNotes,
    podcastNotes: inputs.podcastNotes,
  };

  const file: MapWorldsFile = {
    $schema: MAP_WORLDS_SCHEMA,
    doc: CATALOG_DOC,
    grid: { gxMax: GRID_GX_MAX, gyMax: GRID_GY_MAX, transform: GRID_TRANSFORM_DOC },
    coverage: { placedWorkEdges, totalWorkEdges },
    worlds,
  };
  return { file, review };
}

// =============================================================================
// Review report renderer — deterministic markdown (no timestamps)
// =============================================================================

export function renderReview(review: ReviewData): string {
  const lines: string[] = [];
  const t = review.totals;
  const c = review.coverage;
  const pct = c.totalWorkEdges === 0 ? "0" : ((c.placedWorkEdges / c.totalWorkEdges) * 100).toFixed(1);
  lines.push("# map-worlds — Review-Report (Brief 174 + 183)");
  lines.push("");
  lines.push(
    "> Generiert von `npm run import:map-worlds` — nicht von Hand editieren. " +
      "Der Hand-Pfad ist `scripts/seed-data/source/map-worlds-curation.xlsx`: Sheet „Kuration“ " +
      "hat eine Zeile pro Medien-Location ohne Match — `Aktion` = `link` (Excel-Welt existiert " +
      "unter anderem Namen; `Ziel` = Welt-ID, deren `locationId` gesetzt wird), `rollup` (Werke " +
      "an die Ziel-Welt anhängen, Herkunft via `via`), `pin` (neue Welt; `x`/`y`/`Segmentum`/" +
      "`Klassifikation` Pflicht — `x`/`y` im SSOT-Pixelraum der Redditor-Excel, der Convert " +
      "projiziert sie aufs Grid; Klassifikation „Region“ → `kind: region`) oder leer/`später` " +
      "(offen). Sheet „Welten“ erzwingt pro Welt-ID ein `locationId` (oder `-`/`null` = bewusst " +
      "ohne Match, z. B. Dubletten-Entkopplung). Danach Convert neu laufen lassen.",
  );
  lines.push("");
  lines.push(`**Abdeckung: ${c.placedWorkEdges} von ${c.totalWorkEdges} Werk-Kanten (${pct} %) platziert** (matched/link/pin/rollup).`);
  lines.push("");

  // ---- §1 Match-Übersicht ----
  lines.push("## 1. Match-Übersicht Excel ↔ Bestand");
  lines.push("");
  lines.push(`- Katalog-Welten gesamt: **${t.excelWorlds + t.addedWorlds}** (${t.excelWorlds} aus der Excel, ${t.addedWorlds} Kurations-Pins)`);
  lines.push(`- Verknüpft mit einer \`locations.json\`-Row: **${t.matched}** Welten (${t.distinctMatchedLocationIds} verschiedene Locations)`);
  lines.push(`- Davon mit ≥1 eigenem Werk (Buch/Podcast, ohne Rollup): **${t.matchedWithWorks}**`);
  lines.push("");
  lines.push("| Welt-ID | Name | locationId | Bücher | Episoden |");
  lines.push("|---|---|---|---:|---:|");
  for (const m of review.matchedWorlds) {
    lines.push(`| \`${m.id}\` | ${m.name} | \`${m.locationId}\` | ${m.books} | ${m.episodes} |`);
  }
  lines.push("");

  // ---- §2 Nachplatzierungs-Worklist ----
  lines.push("## 2. Nachplatzierungs-Worklist — offene Medien-Locations");
  lines.push("");
  const missingFromSheet = review.unplacedLocations.filter((u) => !u.inCurationSheet).length;
  lines.push(
    `**${review.unplacedLocations.length}** \`locations.json\`-Rows tragen ≥1 Werk und sind weder ` +
      "verknüpft noch gerollt — absteigend nach Werk-Zahl. Zum Abarbeiten: Zeile in der " +
      "Kurations-Excel mit einer `Aktion` versehen (s. Kopf), Convert neu laufen lassen." +
      (missingFromSheet > 0
        ? ` **${missingFromSheet}** Zeile(n) fehlen noch in der Kurations-Excel (Marker ✚) — ` +
          "`npm run import:map-worlds -- --sync-curation` ergänzt sie."
        : ""),
  );
  lines.push("");
  lines.push("| locationId | Name | Bücher | Episoden |");
  lines.push("|---|---|---:|---:|");
  for (const u of review.unplacedLocations) {
    lines.push(`| \`${u.locationId}\`${u.inCurationSheet ? "" : " ✚"} | ${u.name} | ${u.books} | ${u.episodes} |`);
  }
  lines.push("");

  // ---- §3 Angewandte Kuration ----
  const a = review.applied;
  lines.push("## 3. Angewandte Kuration");
  lines.push("");
  const appliedTotal = a.links.length + a.rollups.length + a.pins.length + a.worldOverrides.length;
  if (appliedTotal === 0) {
    lines.push("Keine — die Kurations-Excel enthält (noch) keine Aktionen.");
    lines.push("");
  } else {
    if (a.links.length > 0) {
      lines.push(`### Links (${a.links.length})`);
      lines.push("");
      lines.push("| locationId | Name | → Welt-ID(s) | Werke |");
      lines.push("|---|---|---|---:|");
      for (const l of a.links) {
        lines.push(`| \`${l.locationId}\` | ${l.locationName} | ${l.worldIds.map((w) => `\`${w}\``).join(", ")} | ${l.works} |`);
      }
      lines.push("");
    }
    if (a.rollups.length > 0) {
      lines.push(`### Rollups (${a.rollups.length})`);
      lines.push("");
      lines.push("| locationId | Name | → Welt-ID(s) | Werke |");
      lines.push("|---|---|---|---:|");
      for (const r of a.rollups) {
        lines.push(`| \`${r.locationId}\` | ${r.locationName} | ${r.worldIds.map((w) => `\`${w}\``).join(", ")} | ${r.works} |`);
      }
      lines.push("");
    }
    if (a.pins.length > 0) {
      lines.push(`### Pins (${a.pins.length})`);
      lines.push("");
      lines.push("| locationId | Welt-ID | Name | kind | x | y | gx | gy | Werke |");
      lines.push("|---|---|---|---|---:|---:|---:|---:|---:|");
      for (const p of a.pins) {
        lines.push(`| \`${p.locationId}\` | \`${p.worldId}\` | ${p.name} | \`${p.kind}\` | ${p.x} | ${p.y} | ${p.gx} | ${p.gy} | ${p.works} |`);
      }
      lines.push("");
    }
    if (a.worldOverrides.length > 0) {
      lines.push(`### Welten-Overrides (${a.worldOverrides.length})`);
      lines.push("");
      lines.push("| Welt-ID | locationId |");
      lines.push("|---|---|");
      for (const o of a.worldOverrides) {
        lines.push(`| \`${o.worldId}\` | ${o.locationId === null ? "— (entkoppelt)" : `\`${o.locationId}\``} |`);
      }
      lines.push("");
    }
  }

  // ---- §4 Dubletten ----
  lines.push("## 4. Excel-Namensdubletten + angewandte Regel");
  lines.push("");
  lines.push(
    "**Regel: keep-all mit Ordinal-Suffix.** Wiederholte Namen sind auf der Quellkarte " +
      "überwiegend legitime Mehrfach-Objekte (Flotten an mehreren Positionen, Webway-Gates, " +
      "Blackstone Fortresses) — es wird KEINE Zeile verworfen. Wiederholte Slugs bekommen in " +
      "Sheet-Reihenfolge deterministische Suffixe (`-2`, `-3`, …). Alle Instanzen eines Namens " +
      "matchen dieselbe Location (gleiches `locationId`, gleiche Werke); einzelne Pins lassen " +
      "sich über Sheet „Welten“ (`locationId-Override` = `-`) entkoppeln.",
  );
  lines.push("");
  for (const g of review.duplicateNameGroups) {
    lines.push(`### ${g.name} (${g.entries.length}×)`);
    lines.push("");
    lines.push("| Welt-ID | Excel-Zeile | gx | gy | Segmentum |");
    lines.push("|---|---:|---:|---:|---|");
    for (const e of g.entries) {
      lines.push(`| \`${e.id}\` | ${e.sourceRow} | ${e.gx} | ${e.gy} | ${e.segmentum ?? "—"} |`);
    }
    lines.push("");
  }

  // ---- §5 ID-Kollisionen ----
  lines.push("## 5. ID-Kollisionen (verschiedene Namen → gleicher Basis-Slug)");
  lines.push("");
  if (review.idCollisions.length === 0) {
    lines.push("Keine — jeder Basis-Slug stammt von genau einem (ggf. wiederholten) Namen.");
  } else {
    for (const col of review.idCollisions) {
      lines.push(`- \`${col.baseId}\`: ${col.names.map((n) => `"${n}"`).join(", ")} (Suffix-Vergabe in Sheet-Reihenfolge)`);
    }
  }
  lines.push("");

  // ---- §6 Ableitungs-Notizen ----
  const b = review.bookNotes;
  const p = review.podcastNotes;
  lines.push("## 6. Medien-Ableitung (JSON-first, DB-frei)");
  lines.push("");
  lines.push(
    "Quellen: `scripts/seed-data/books/*.json` (geteilter Resolver-Pfad `resolveLocations`, " +
      "wie `apply:book`) + `curation-overlay.json`-Location-Tail (wie `apply:curation-overlay`) " +
      "+ `ingest/podcasts/<show>.json` (Junction-Regeln aus `apply-plan.ts`, wie `apply:podcast`). " +
      "Der Convert läuft ohne DB-Verbindung.",
  );
  lines.push("");
  lines.push(`- Bücher im Korpus: ${b.bookCount}, davon mit ≥1 Location-Kante: ${b.booksWithLocationEdges} (${b.bookEdgeCount} Kanten)`);
  lines.push(`- Overlay-Location-Tail: ${b.overlayLocationAdds} Adds, ${b.overlayLocationRemoves} Removes` +
    (b.overlayBooksNotInCorpus.length > 0
      ? ` — übersprungen (kein Korpus-File): ${b.overlayBooksNotInCorpus.map((x) => `\`${x}\``).join(", ")}`
      : ""));
  lines.push(`- Podcast-Shows: ${p.showCount}, Episoden: ${p.episodeCount}, davon mit ≥1 Location-Kante: ${p.episodesWithLocations} (${p.episodeEdgeCount} Kanten, ${p.droppedMissingRef} FK-Drops)`);
  lines.push("");
  lines.push(
    "Read-only `work_locations`-Stichprobe (Verifikations-Check, kein Datenpfad): " +
      "siehe Impl-Report `sessions/2026-07-02-174-impl-map-ssot-reconciliation.md` § Verification.",
  );
  lines.push("");
  return lines.join("\n");
}
