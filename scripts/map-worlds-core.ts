/**
 * map-worlds-core.ts — Brief 174 (P14 Teil A). PURE core of the map-catalog
 * convert step: Excel rows + overrides + repo-derived media edges →
 * `map-worlds.json` (catalog) + `map-worlds.review.md` (hand-gate report).
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
 *
 * Duplicate rule (review §3): the source map's repeated names (fleets, webway
 * gates, blackstone fortresses at several positions) are LEGITIMATE multi-pin
 * objects — ALL rows are kept and repeated slugs get deterministic ordinal
 * suffixes in sheet order (`commorragh`, `commorragh-2`, …). Nothing is
 * dropped; hand corrections go through the overrides file.
 */
import { slugify } from "@/lib/slug";
import { deriveEpisodeSlug } from "@/lib/ingestion/podcast/apply-plan";
import type { ShowArtifact } from "@/lib/ingestion/podcast/types";
import {
  MAP_WORLDS_SCHEMA,
  type MapWorld,
  type MapWorldClassification,
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
 * Philipp's hand-placed override coordinates live in the projected grid and
 * must not shift if the Excel were ever re-exported. A source row outside
 * this box is a recalibration decision for a human → hard error.
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
// Input shapes
// =============================================================================

/** One validated Excel data row (IO layer parses + validates the sheet). */
export interface ExcelWorldRow {
  /** 1-based Excel row number (header = row 1) — for review/error messages. */
  sourceRow: number;
  name: string;
  primary: string | null;
  secondary: string | null;
  tertiary: string | null;
  x: number;
  y: number;
  segmentum: string;
}

export const MAP_WORLDS_OVERRIDES_SCHEMA = "map-worlds-overrides-v1" as const;

/** A hand-added world (gap world from the review §2 worklist). `gx`/`gy` are
 *  REQUIRED grid coordinates — the review stubs ship them as `null` so a
 *  pasted-but-unedited stub fails loud instead of pinning at the corner. */
export interface OverrideAddWorld {
  /** Defaults to `slugify(name)`; must not collide with an existing id. */
  id?: string;
  name: string;
  gx: number | null;
  gy: number | null;
  classification?: Partial<MapWorldClassification>;
  segmentum?: string | null;
  /** Absent → auto-match by name (like Excel worlds); null → force unmatched. */
  locationId?: string | null;
}

/** A patch on one generated Excel world, keyed by its catalog id. */
export interface OverrideWorldPatch {
  name?: string;
  gx?: number;
  gy?: number;
  classification?: Partial<MapWorldClassification>;
  segmentum?: string | null;
  /** Present-with-string → force this match; present-with-null → force unmatched. */
  locationId?: string | null;
}

export interface MapWorldsOverridesFile {
  $schema: typeof MAP_WORLDS_OVERRIDES_SCHEMA;
  doc?: string;
  addWorlds: OverrideAddWorld[];
  worldOverrides: Record<string, OverrideWorldPatch>;
}

/** Validate + narrow the raw overrides JSON. Throws listing ALL problems. */
export function validateOverridesFile(raw: unknown): MapWorldsOverridesFile {
  const errors: string[] = [];
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("map-worlds.overrides.json: root must be an object");
  }
  const o = raw as Record<string, unknown>;
  if (o.$schema !== MAP_WORLDS_OVERRIDES_SCHEMA) {
    errors.push(`$schema must be "${MAP_WORLDS_OVERRIDES_SCHEMA}"`);
  }
  if (o.doc !== undefined && typeof o.doc !== "string") errors.push("doc must be a string");
  if (!Array.isArray(o.addWorlds)) errors.push("addWorlds must be an array");
  if (typeof o.worldOverrides !== "object" || o.worldOverrides === null || Array.isArray(o.worldOverrides)) {
    errors.push("worldOverrides must be an object (id → patch)");
  }
  if (errors.length > 0) {
    throw new Error(`map-worlds.overrides.json invalid:\n  - ${errors.join("\n  - ")}`);
  }
  return raw as unknown as MapWorldsOverridesFile;
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

/** Merge book + episode edges into one map with a stable per-location order:
 *  books before episodes, each sorted by slug (byte order). */
export function mergeWorkEdges(
  bookEdges: ReadonlyMap<string, MapWorldWork[]>,
  podcastEdges: ReadonlyMap<string, MapWorldWork[]>,
): Map<string, MapWorldWork[]> {
  const merged = new Map<string, MapWorldWork[]>();
  const locationIds = new Set<string>([...bookEdges.keys(), ...podcastEdges.keys()]);
  const bySlug = (a: MapWorldWork, b: MapWorldWork): number =>
    a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
  for (const id of [...locationIds].sort()) {
    const books = [...(bookEdges.get(id) ?? [])].sort(bySlug);
    const episodes = [...(podcastEdges.get(id) ?? [])].sort(bySlug);
    merged.set(id, [...books, ...episodes]);
  }
  return merged;
}

// =============================================================================
// Catalog composition
// =============================================================================

interface WorldDraft {
  id: string;
  name: string;
  classification: MapWorldClassification;
  segmentum: string | null;
  gx: number;
  gy: number;
  origin: "excel" | "override";
  /** undefined = auto-match by name; string|null = forced by an override. */
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

export interface ReviewData {
  totals: {
    excelWorlds: number;
    addedWorlds: number;
    matched: number;
    matchedWithWorks: number;
    distinctMatchedLocationIds: number;
  };
  /** §1 — matched worlds with their work counts. */
  matchedWorlds: Array<{ id: string; name: string; locationId: string; books: number; episodes: number }>;
  /** §2 — locations with ≥1 work but NO catalog world → Philipps worklist. */
  unplacedLocations: Array<{ locationId: string; name: string; books: number; episodes: number }>;
  /** §3 — repeated Excel names + the applied keep-all rule. */
  duplicateNameGroups: DuplicateNameGroup[];
  /** §4 — different raw names slugifying onto the same base id. */
  idCollisions: IdCollisionGroup[];
  /** §5 — derivation notes. */
  bookNotes: BookDerivationNotes;
  podcastNotes: PodcastDerivationNotes;
}

export interface CatalogInputs {
  excelRows: ExcelWorldRow[];
  overrides: MapWorldsOverridesFile;
  /** Case-insensitive surface form → locationId (from `buildLocationMatcher`). */
  matcher: ReadonlyMap<string, string>;
  /** locationId → canonical display name (review §2). */
  locationNames: ReadonlyMap<string, string>;
  worksByLocation: ReadonlyMap<string, MapWorldWork[]>;
  bookNotes: BookDerivationNotes;
  podcastNotes: PodcastDerivationNotes;
}

const CATALOG_DOC =
  "Map-Katalog der neuen Galaxiekarte (Brief 174, P14 Teil A) — generiert von " +
  "`npm run import:map-worlds` aus Warhammer_map_SSOT.xlsx (Welten + Koordinaten des " +
  "Redditors) + map-worlds.overrides.json (Hand-Nachplatzierungen/Korrekturen). " +
  "`locationId` verlinkt auf die bestehende locations.json-Row (/welt/{id}); `works` " +
  "sind die Bücher + Podcast-Episoden der gematchten Location, DB-frei abgeleitet aus " +
  "scripts/seed-data/books/*.json + curation-overlay.json + ingest/podcasts/<show>.json. " +
  "NICHT von Hand editieren: Korrekturen in map-worlds.overrides.json, dann Convert neu laufen lassen.";

/** Compose the catalog + review data from prepared inputs. Pure. */
export function buildCatalog(inputs: CatalogInputs): { file: MapWorldsFile; review: ReviewData } {
  const errors: string[] = [];

  // ---- 1. Excel rows → drafts with deterministic ids -----------------------
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
      classification: { primary: row.primary, secondary: row.secondary, tertiary: row.tertiary },
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

  // ---- 2. worldOverrides — patch generated Excel worlds by id --------------
  const draftById = new Map(drafts.map((d) => [d.id, d]));
  for (const [id, patch] of Object.entries(inputs.overrides.worldOverrides)) {
    const draft = draftById.get(id);
    if (draft === undefined) {
      errors.push(
        `worldOverrides["${id}"]: no Excel world with this id (worldOverrides patches ` +
          `generated worlds only; new worlds go into addWorlds)`,
      );
      continue;
    }
    if (patch.name !== undefined) draft.name = patch.name;
    if (patch.gx !== undefined) {
      if (!isGridCoord(patch.gx, GRID_GX_MAX)) errors.push(`worldOverrides["${id}"].gx must be a number in [0, ${GRID_GX_MAX}]`);
      else draft.gx = patch.gx;
    }
    if (patch.gy !== undefined) {
      if (!isGridCoord(patch.gy, GRID_GY_MAX)) errors.push(`worldOverrides["${id}"].gy must be a number in [0, ${GRID_GY_MAX}]`);
      else draft.gy = patch.gy;
    }
    if (patch.segmentum !== undefined) draft.segmentum = patch.segmentum;
    if (patch.classification !== undefined) {
      draft.classification = { ...draft.classification, ...patch.classification };
    }
    if (Object.prototype.hasOwnProperty.call(patch, "locationId")) {
      draft.forcedLocationId = patch.locationId ?? null;
    }
  }

  // ---- 3. addWorlds — hand-placed gap worlds --------------------------------
  for (const [i, add] of inputs.overrides.addWorlds.entries()) {
    const at = `addWorlds[${i}] ("${add.name}")`;
    const base = add.id ?? slugify(add.name);
    if (base === "") {
      errors.push(`${at}: id/name slugifies to an empty id`);
      continue;
    }
    if (usedIds.has(base)) {
      errors.push(`${at}: id "${base}" already exists in the catalog — pick an explicit unique "id"`);
      continue;
    }
    if (add.gx === null || add.gy === null) {
      errors.push(
        `${at}: gx/gy are null — fill in the hand coordinates (0–${GRID_GX_MAX} / 0–${GRID_GY_MAX} grid) ` +
          `before running the convert (review stubs ship null on purpose)`,
      );
      continue;
    }
    if (!isGridCoord(add.gx, GRID_GX_MAX)) {
      errors.push(`${at}: gx must be a number in [0, ${GRID_GX_MAX}]`);
      continue;
    }
    if (!isGridCoord(add.gy, GRID_GY_MAX)) {
      errors.push(`${at}: gy must be a number in [0, ${GRID_GY_MAX}]`);
      continue;
    }
    usedIds.add(base);
    drafts.push({
      id: base,
      name: add.name,
      classification: {
        primary: add.classification?.primary ?? null,
        secondary: add.classification?.secondary ?? null,
        tertiary: add.classification?.tertiary ?? null,
      },
      segmentum: add.segmentum ?? null,
      gx: round2(add.gx),
      gy: round2(add.gy),
      origin: "override",
      forcedLocationId: Object.prototype.hasOwnProperty.call(add, "locationId")
        ? (add.locationId ?? null)
        : undefined,
      sourceRow: null,
    });
  }

  // ---- 4. Match + attach works ----------------------------------------------
  const worlds: MapWorld[] = [];
  for (const draft of drafts) {
    let locationId: string | null;
    if (draft.forcedLocationId !== undefined) {
      locationId = draft.forcedLocationId;
      if (locationId !== null && !inputs.locationNames.has(locationId)) {
        errors.push(
          `world "${draft.id}": forced locationId "${locationId}" is not a locations.json id`,
        );
        continue;
      }
    } else {
      locationId = inputs.matcher.get(draft.name.trim().toLowerCase()) ?? null;
    }
    const works = locationId !== null ? [...(inputs.worksByLocation.get(locationId) ?? [])] : [];
    worlds.push({
      id: draft.id,
      name: draft.name,
      classification: draft.classification,
      segmentum: draft.segmentum,
      gx: draft.gx,
      gy: draft.gy,
      locationId,
      works,
      origin: draft.origin,
    });
  }

  if (errors.length > 0) {
    throw new Error(`map-worlds convert failed:\n  - ${errors.join("\n  - ")}`);
  }

  worlds.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  // ---- 5. Review data --------------------------------------------------------
  const matchedWorlds = worlds
    .filter((w): w is MapWorld & { locationId: string } => w.locationId !== null)
    .map((w) => ({
      id: w.id,
      name: w.name,
      locationId: w.locationId,
      books: w.works.filter((x) => x.type === "book").length,
      episodes: w.works.filter((x) => x.type === "podcast_episode").length,
    }));

  const coveredLocationIds = new Set(matchedWorlds.map((m) => m.locationId));
  const unplacedLocations = [...inputs.worksByLocation.entries()]
    .filter(([locationId, works]) => works.length > 0 && !coveredLocationIds.has(locationId))
    .map(([locationId, works]) => ({
      locationId,
      name: inputs.locationNames.get(locationId) ?? locationId,
      books: works.filter((x) => x.type === "book").length,
      episodes: works.filter((x) => x.type === "podcast_episode").length,
    }))
    .sort((a, b) => (a.locationId < b.locationId ? -1 : a.locationId > b.locationId ? 1 : 0));

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
    matchedWorlds,
    unplacedLocations,
    duplicateNameGroups,
    idCollisions,
    bookNotes: inputs.bookNotes,
    podcastNotes: inputs.podcastNotes,
  };

  const file: MapWorldsFile = {
    $schema: MAP_WORLDS_SCHEMA,
    doc: CATALOG_DOC,
    grid: { gxMax: GRID_GX_MAX, gyMax: GRID_GY_MAX, transform: GRID_TRANSFORM_DOC },
    worlds,
  };
  return { file, review };
}

function isGridCoord(v: unknown, max: number): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= max;
}

// =============================================================================
// Review report renderer — deterministic markdown (no timestamps)
// =============================================================================

export function renderReview(review: ReviewData): string {
  const lines: string[] = [];
  const t = review.totals;
  lines.push("# map-worlds — Review-Report (Brief 174)");
  lines.push("");
  lines.push(
    "> Generiert von `npm run import:map-worlds` — nicht von Hand editieren. " +
      "Hand-Korrekturen: `map-worlds.overrides.json`, dann Convert neu laufen lassen.",
  );
  lines.push("");

  // ---- §1 Match-Übersicht ----
  lines.push("## 1. Match-Übersicht Excel ↔ Bestand");
  lines.push("");
  lines.push(`- Katalog-Welten gesamt: **${t.excelWorlds + t.addedWorlds}** (${t.excelWorlds} aus der Excel, ${t.addedWorlds} aus Overrides)`);
  lines.push(`- Gematcht auf eine \`locations.json\`-Row: **${t.matched}** Welten (${t.distinctMatchedLocationIds} verschiedene Locations)`);
  lines.push(`- Davon mit ≥1 Werk (Buch/Podcast): **${t.matchedWithWorks}**`);
  lines.push("");
  lines.push("| Welt-ID | Name | locationId | Bücher | Episoden |");
  lines.push("|---|---|---|---:|---:|");
  for (const m of review.matchedWorlds) {
    lines.push(`| \`${m.id}\` | ${m.name} | \`${m.locationId}\` | ${m.books} | ${m.episodes} |`);
  }
  lines.push("");

  // ---- §2 Gegenliste / Nachplatzierungs-Worklist ----
  lines.push("## 2. Nachplatzierungs-Worklist — Medien-Welten ohne Excel-Match");
  lines.push("");
  lines.push(
    `**${review.unplacedLocations.length}** \`locations.json\`-Rows tragen ≥1 Werk, haben aber keine Welt im Katalog. ` +
      "Zum Nachplatzieren: Stub unten in `map-worlds.overrides.json` → `addWorlds` kopieren, " +
      "`gx`/`gy` mit Hand-Koordinaten füllen (gleiche Raster wie der Katalog: gx 0–1000, gy 0–" +
      `${GRID_GY_MAX}), Convert neu laufen lassen. \`gx\`/\`gy\` = \`null\` bricht den Convert absichtlich ab.`,
  );
  lines.push("");
  lines.push("| locationId | Name | Bücher | Episoden |");
  lines.push("|---|---|---:|---:|");
  for (const u of review.unplacedLocations) {
    lines.push(`| \`${u.locationId}\` | ${u.name} | ${u.books} | ${u.episodes} |`);
  }
  lines.push("");
  lines.push("Copy-paste-Stubs (`addWorlds`-Einträge):");
  lines.push("");
  lines.push("```json");
  const stubs = review.unplacedLocations.map((u) =>
    [
      "  {",
      `    "name": ${JSON.stringify(u.name)},`,
      `    "gx": null,`,
      `    "gy": null,`,
      `    "locationId": ${JSON.stringify(u.locationId)}`,
      "  }",
    ].join("\n"),
  );
  lines.push(`[\n${stubs.join(",\n")}\n]`);
  lines.push("```");
  lines.push("");

  // ---- §3 Dubletten ----
  lines.push("## 3. Excel-Namensdubletten + angewandte Regel");
  lines.push("");
  lines.push(
    "**Regel: keep-all mit Ordinal-Suffix.** Wiederholte Namen sind auf der Quellkarte " +
      "überwiegend legitime Mehrfach-Objekte (Flotten an mehreren Positionen, Webway-Gates, " +
      "Blackstone Fortresses) — es wird KEINE Zeile verworfen. Wiederholte Slugs bekommen in " +
      "Sheet-Reihenfolge deterministische Suffixe (`-2`, `-3`, …). Alle Instanzen eines Namens " +
      "matchen dieselbe Location (gleiches `locationId`, gleiche Werke); einzelne Pins lassen " +
      "sich per `worldOverrides.<id>.locationId: null` entkoppeln.",
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

  // ---- §4 ID-Kollisionen ----
  lines.push("## 4. ID-Kollisionen (verschiedene Namen → gleicher Basis-Slug)");
  lines.push("");
  if (review.idCollisions.length === 0) {
    lines.push("Keine — jeder Basis-Slug stammt von genau einem (ggf. wiederholten) Namen.");
  } else {
    for (const c of review.idCollisions) {
      lines.push(`- \`${c.baseId}\`: ${c.names.map((n) => `"${n}"`).join(", ")} (Suffix-Vergabe in Sheet-Reihenfolge)`);
    }
  }
  lines.push("");

  // ---- §5 Ableitungs-Notizen ----
  const b = review.bookNotes;
  const p = review.podcastNotes;
  lines.push("## 5. Medien-Ableitung (JSON-first, DB-frei)");
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
