/**
 * projection.ts — Brief 154 (B11). The reviewer's READ-ONLY, DB-FREE view of a
 * book's *current* canonical state — the exact `work_*` edges + facets the
 * apply path produces — reconstructed from committed SSOT so the finder reviews
 * truth, not the raw batch.
 *
 * Full apply-chain fidelity (Brief 154 § "Read-only Eingang", parity-tested in
 * parity.ts):
 *   SSOT batch
 *     → resolveBookEdges (resolve* → normalize → faction/location skip →
 *       priority collapse → drop unresolved)      [shared with apply-override]
 *     → curation-overlay.final TAIL on top         [computeBookOps, in-memory]
 *
 * The `final` tail matters: W40K-0010 lives in `curation-overlay.final` (adds
 * ordo_malleus, removes chaos). Skip the tail and the finder re-proposes an
 * already-decided correction or reviews against edges the visitor never sees.
 *
 * Facets are read RAW (Brief 154 § "Facet-Findings nach Sichtbarkeit trennen"):
 * the projection keeps content-warning facets (which `loadBook` hides via
 * `isVisibleFacetCategory`) and flags each facet `visible` so the report can
 * split visible/Ask-relevant signal from `cw_*` noise. Facets are NOT in the
 * overlay (Brief 149/150) so no tail applies to them.
 */
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { isVisibleFacetCategory } from "@/lib/facet-visibility";
import { normalizeAlignment, type Alignment } from "@/lib/seed/alignment";
import {
  resolveBookEdges,
  type FactionSkipContext,
  type LocationSkipContext,
} from "../resolve-book-edges";
import {
  computeBookOps,
  ENTITY_AXES,
  type EntityAxis,
  type OverlayBook,
} from "../curation-overlay";

const SEED_DIR = resolve(process.cwd(), "scripts", "seed-data");

// ---- committed-data shapes (read-only parse types) --------------------------

interface SeedEntityRow {
  id: string;
  name: string;
  parent?: string | null;
  alignment?: string | null;
  tone?: string | null;
}
interface BatchSurfaceForm {
  name: string;
  role: string;
}
export interface BatchBook {
  externalBookId: string;
  slug: string;
  overrides: {
    synopsis: string;
    facetIds: string[];
    factions: BatchSurfaceForm[];
    locations: BatchSurfaceForm[];
    characters: BatchSurfaceForm[];
  };
}
interface BatchFile {
  batch: string;
  books: BatchBook[];
}
interface RosterBook {
  externalBookId: string;
  slug: string;
  title: string;
}
interface RosterFile {
  books: RosterBook[];
}
interface FactionPolicyFile {
  redundantWhenSubPresent?: string[];
}
interface LocationPolicyFile {
  redundantSurfaceForms?: unknown;
}
interface FacetCatalog {
  categories: Array<{
    id: string;
    values: Array<{ id: string; name: string }>;
  }>;
}

// ---- projected output -------------------------------------------------------

export interface ProjectedEdge {
  id: string;
  name: string;
  role: string;
}
export interface ProjectedFacet {
  id: string;
  label: string;
  category: string;
  /** false for content_warning facets (hidden from the visitor UI). */
  visible: boolean;
}
export interface ProjectedBook {
  externalBookId: string;
  slug: string;
  title: string;
  synopsis: string;
  factions: ProjectedEdge[];
  locations: ProjectedEdge[];
  characters: ProjectedEdge[];
  facets: ProjectedFacet[];
}

export interface ProjectionContext {
  nameById: Record<EntityAxis, Map<string, string>>;
  factionSkipCtx: FactionSkipContext;
  locationSkipCtx: LocationSkipContext;
  facetCategoryById: Map<string, string>;
  facetLabelById: Map<string, string>;
  curationFinalByBook: Map<string, OverlayBook>;
  rosterByBook: Map<string, RosterBook>;
}

async function readJson<T>(name: string): Promise<T> {
  return JSON.parse(await readFile(resolve(SEED_DIR, name), "utf8")) as T;
}

/** Load every committed input the projection needs — DB-free, once per run. */
export async function loadProjectionContext(): Promise<ProjectionContext> {
  const [factions, locations, characters, factionPolicy, locationPolicy, catalog, overlay, roster] =
    await Promise.all([
      readJson<SeedEntityRow[]>("factions.json"),
      readJson<SeedEntityRow[]>("locations.json"),
      readJson<SeedEntityRow[]>("characters.json"),
      readJson<FactionPolicyFile>("faction-policy.json"),
      readJson<LocationPolicyFile>("location-policy.json"),
      readJson<FacetCatalog>("facet-catalog.json"),
      readJson<{ final?: { books?: OverlayBook[] } }>("curation-overlay.json"),
      readJson<RosterFile>("book-roster.json"),
    ]);

  const nameById: Record<EntityAxis, Map<string, string>> = {
    factions: new Map(factions.map((f) => [f.id, f.name])),
    locations: new Map(locations.map((l) => [l.id, l.name])),
    characters: new Map(characters.map((c) => [c.id, c.name])),
  };

  // Faction skip context (Brief 077) — mirrors apply-override's loadSkipContext.
  const alignmentById = new Map<string, Alignment>();
  for (const f of factions) alignmentById.set(f.id, normalizeAlignment(f));
  const factionSkipCtx: FactionSkipContext = {
    redundantIds: new Set(factionPolicy.redundantWhenSubPresent ?? []),
    alignmentById,
  };

  // Location skip context (Brief 084) — surface forms, normalized for matching.
  const redundantSurfaceForms = new Set<string>(
    (Array.isArray(locationPolicy.redundantSurfaceForms)
      ? locationPolicy.redundantSurfaceForms
      : []
    )
      .filter((s): s is string => typeof s === "string")
      .map((s) => s.trim().toLowerCase()),
  );
  const locationSkipCtx: LocationSkipContext = { redundantSurfaceForms };

  const facetCategoryById = new Map<string, string>();
  const facetLabelById = new Map<string, string>();
  for (const cat of catalog.categories) {
    for (const v of cat.values) {
      facetCategoryById.set(v.id, cat.id);
      facetLabelById.set(v.id, v.name);
    }
  }

  const curationFinalByBook = new Map<string, OverlayBook>();
  for (const b of overlay.final?.books ?? []) curationFinalByBook.set(b.externalBookId, b);

  const rosterByBook = new Map<string, RosterBook>();
  for (const b of roster.books) rosterByBook.set(b.externalBookId, b);

  return {
    nameById,
    factionSkipCtx,
    locationSkipCtx,
    facetCategoryById,
    facetLabelById,
    curationFinalByBook,
    rosterByBook,
  };
}

/**
 * Discover every committed SSOT override batch (DB-free), sorted deterministically
 * so chunking is stable run-to-run. Used by the FULL sweep (selection's pilot
 * constants stay for the calibration slice + the unit tests).
 */
export async function discoverAllBatches(): Promise<string[]> {
  const entries = await readdir(SEED_DIR);
  const batches = entries
    .map((f) => /^manual-overrides-(ssot-[a-z0-9-]+)\.json$/.exec(f)?.[1])
    .filter((b): b is string => Boolean(b))
    .sort();
  if (batches.length === 0) throw new Error("no manual-overrides-ssot-*.json batches found in seed-data");
  return batches;
}

/** Load named SSOT batch files, returning every book indexed by externalBookId. */
export async function loadBatchBooks(batches: readonly string[]): Promise<Map<string, BatchBook>> {
  const byId = new Map<string, BatchBook>();
  for (const batch of batches) {
    const file = await readJson<BatchFile>(`manual-overrides-${batch}.json`);
    if (file.batch !== batch) {
      throw new Error(`batch file mismatch: expected '${batch}', got '${file.batch}'`);
    }
    for (const book of file.books) byId.set(book.externalBookId, book);
  }
  return byId;
}

/**
 * Project one book's current canonical state: resolve the batch surface forms
 * the same way `apply-override` does, then apply the `curation-overlay.final`
 * edge tail on top. Pure given a loaded context.
 */
export function projectBook(book: BatchBook, ctx: ProjectionContext): ProjectedBook {
  const edges = resolveBookEdges(book.overrides, ctx.factionSkipCtx, ctx.locationSkipCtx);

  // axis → (id → role), seeded from the resolved/kept edges.
  const byAxis: Record<EntityAxis, Map<string, string>> = {
    factions: new Map(edges.keepFactions.map((e) => [e.id, e.role])),
    locations: new Map(edges.resolvedLocations.map((e) => [e.id, e.role])),
    characters: new Map(edges.resolvedCharacters.map((e) => [e.id, e.role])),
  };

  // curation-overlay.final TAIL — upsert adds, delete removes (mirrors applyBookOps).
  let synopsis = book.overrides.synopsis;
  const finalEntry = ctx.curationFinalByBook.get(book.externalBookId);
  if (finalEntry) {
    const ops = computeBookOps(finalEntry);
    for (const a of ops.edgeAdds) byAxis[a.axis].set(a.id, a.role);
    for (const r of ops.edgeRemoves) byAxis[r.axis].delete(r.id);
    const synopsisFix = ops.fieldWrites.find((f) => f.field === "synopsis");
    if (synopsisFix) synopsis = synopsisFix.value; // show the visitor-facing synopsis
  }

  const toEdges = (axis: EntityAxis): ProjectedEdge[] =>
    [...byAxis[axis].entries()]
      .map(([id, role]) => ({ id, name: ctx.nameById[axis].get(id) ?? id, role }))
      .sort((a, b) => a.id.localeCompare(b.id));

  const facets: ProjectedFacet[] = [...book.overrides.facetIds]
    .sort()
    .map((id) => {
      const category = ctx.facetCategoryById.get(id) ?? "unknown";
      return {
        id,
        label: ctx.facetLabelById.get(id) ?? id,
        category,
        visible: isVisibleFacetCategory(category),
      };
    });

  const roster = ctx.rosterByBook.get(book.externalBookId);
  return {
    externalBookId: book.externalBookId,
    slug: book.slug,
    title: roster?.title ?? book.slug,
    synopsis,
    factions: toEdges("factions"),
    locations: toEdges("locations"),
    characters: toEdges("characters"),
    facets,
  };
}

/** The three axes a projection edge can live on (re-export for callers). */
export { ENTITY_AXES };
