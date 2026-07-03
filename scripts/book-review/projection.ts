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
 *
 * Corpus rebind (Brief 176): the LIVE sweep enumerates the effective per-book
 * corpus (`scripts/seed-data/books/*.json`, via `loadCorpusBooks`) instead of
 * the frozen batch files, and titles come from the same corpus instead of the
 * frozen `book-roster.json` — so books added post-migration via `/add-book`
 * are reviewable. A per-book file's `curation` is byte-equal to its batch
 * override (equivalence gate, Brief 171), so projections are unchanged for the
 * migrated corpus (proven in test-book-review.ts). The batch loaders below
 * stay for the pilot/parity calibration slice, which is frozen by design.
 */
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { isVisibleFacetCategory } from "@/lib/facet-visibility";
import { normalizeAlignment, type Alignment } from "@/lib/seed/alignment";
import { loadBookFiles } from "../book-file";
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
/** Title/slug ref for one corpus book (fed from `books/*.json`, Brief 176). */
interface CorpusBookRef {
  externalBookId: string;
  slug: string;
  title: string;
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
  /** Title lookup, fed from the effective per-book corpus (Brief 176). */
  corpusByBook: Map<string, CorpusBookRef>;
}

async function readJson<T>(name: string): Promise<T> {
  return JSON.parse(await readFile(resolve(SEED_DIR, name), "utf8")) as T;
}

/**
 * Load every committed input the projection needs — DB-free, once per run.
 * `booksDir` is injectable for tests (defaults to `scripts/seed-data/books/`).
 */
export async function loadProjectionContext(booksDir?: string): Promise<ProjectionContext> {
  const [factions, locations, characters, factionPolicy, locationPolicy, catalog, overlay] =
    await Promise.all([
      readJson<SeedEntityRow[]>("factions.json"),
      readJson<SeedEntityRow[]>("locations.json"),
      readJson<SeedEntityRow[]>("characters.json"),
      readJson<FactionPolicyFile>("faction-policy.json"),
      readJson<LocationPolicyFile>("location-policy.json"),
      readJson<FacetCatalog>("facet-catalog.json"),
      readJson<{ final?: { books?: OverlayBook[] } }>("curation-overlay.json"),
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

  // Effective per-book corpus (Brief 176) — invalid files are skipped fail-soft
  // here (mirrors `loadEffectiveCorpusBooks`); the hard gate is `book:preflight`.
  const corpusByBook = new Map<string, CorpusBookRef>();
  for (const { book } of loadBookFiles(booksDir).books) {
    corpusByBook.set(book.externalBookId, {
      externalBookId: book.externalBookId,
      slug: book.slug,
      title: book.title,
    });
  }

  return {
    nameById,
    factionSkipCtx,
    locationSkipCtx,
    facetCategoryById,
    facetLabelById,
    curationFinalByBook,
    corpusByBook,
  };
}

/**
 * Discover every committed SSOT override batch (DB-free), sorted deterministically.
 * LEGACY (Brief 176): the full sweep now enumerates the per-book corpus via
 * `loadCorpusBooks`; this discovery walks the FROZEN batch world and remains
 * only as provenance tooling (B6 dead-code-sweep candidate).
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
 * Load the LIVE review corpus: every effective per-book file
 * (`scripts/seed-data/books/*.json`) as a projectable book, indexed by
 * externalBookId (Brief 176 rebind). A per-book file's `curation` is the exact
 * `overrides` payload a batch book carried (shared `OverrideCuration` shape;
 * byte-equal for the migrated corpus per the Brief-171 equivalence gate), so
 * `projectBook` treats both sources identically. Deterministic: files are read
 * in sorted-filename (= slug) order. `dir` is injectable for tests.
 */
export function loadCorpusBooks(dir?: string): Map<string, BatchBook> {
  const byId = new Map<string, BatchBook>();
  for (const { book } of loadBookFiles(dir).books) {
    byId.set(book.externalBookId, {
      externalBookId: book.externalBookId,
      slug: book.slug,
      overrides: book.curation,
    });
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

  const corpusRef = ctx.corpusByBook.get(book.externalBookId);
  return {
    externalBookId: book.externalBookId,
    slug: book.slug,
    title: corpusRef?.title ?? book.slug,
    synopsis,
    factions: toEdges("factions"),
    locations: toEdges("locations"),
    characters: toEdges("characters"),
    facets,
  };
}

/** The three axes a projection edge can live on (re-export for callers). */
export { ENTITY_AXES };
