/**
 * Public book-browse data layer — DB-FREE façade (Launch S1b Loader-Weiche).
 *
 * This is the lean, visitor-facing book-browse loader: it loads exactly what
 * the public filters (`q`, `faction`, `format`, `facet`, `sort`) and the row
 * rendering need — no drift / alias / junction-gap / SSOT audit machinery.
 *
 * Source switch: at build time (`next build` prerenders Home, which composes
 * this into the unified search index) the data comes from the committed
 * snapshot artifact; at request time it comes from Postgres via a lazy
 * `import()` of `./loader-live`. This module must never statically import
 * `@/db` — the DB-free CI build depends on it. Index contract (S2, see
 * `src/lib/db-cache.ts`): an array — a runtime DB error THROWS into the
 * route's error boundary, never an empty hall.
 */
import "server-only";
import { memoryCachedRead } from "@/lib/db-cache";
import {
  isBuildPhase,
  readSnapshotArtifact,
} from "@/lib/snapshot/build-data";

export interface BrowseFacet {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string | null;
}

export interface BrowseFaction {
  id: string;
  name: string;
  /** `work_factions.role` — 'primary' decides the row marker. */
  role: string | null;
  /** `factions.alignment` + parent link, feed `factionIconClass`. */
  alignment: string | null;
  parentId: string | null;
}

export interface BrowseBook {
  id: string;
  slug: string;
  title: string;
  synopsis: string | null;
  coverUrl: string | null;
  releaseYear: number | null;
  startY: number | null;
  endY: number | null;
  format: string | null;
  pageCount: number | null;
  eraId: string | null;
  eraName: string | null;
  seriesName: string | null;
  seriesIndex: number | null;
  authors: string[];
  factions: BrowseFaction[];
  facets: BrowseFacet[];
}

export interface EraOption {
  id: string;
  name: string;
  sortOrder: number;
}

export interface BrowseData {
  books: BrowseBook[];
  /** All eras (sort-order asc) so the page can show them in canon sequence. */
  eras: EraOption[];
}

/**
 * The source switch. At build time the committed snapshot is the ONLY data
 * source (fail-closed: a missing artifact throws and fails the build); at
 * request time the live DB body is lazy-imported.
 */
async function fetchBrowseBooks(): Promise<BrowseData> {
  if (isBuildPhase()) {
    return readSnapshotArtifact<BrowseData>("browseBooks");
  }
  const { fetchBrowseBooksLive } = await import("./loader-live");
  return fetchBrowseBooksLive();
}

/**
 * The public entry point: `fetchBrowseBooks` behind a per-instance memory
 * cache. The blob is too big for the persistent Data Cache (2.21 MB even with
 * teaser synopses, vs Next's 2 MB cap — see `src/lib/db-cache.ts`), so this
 * uses `memoryCachedRead`: one real DB fan-out per instance per TTL window,
 * and concurrent requests coalesce onto the same in-flight read instead of
 * each firing their own pool-exhausting query (six
 * parallel `/archive` requests were measured starving the whole `max:5`
 * pool). A rejected fill is evicted immediately, so a transient DB failure
 * never pins an error for the rest of the TTL.
 */
export const loadBrowseBooks = memoryCachedRead(fetchBrowseBooks);

/**
 * Resolve a `?focus=<workId>` deep-link target to its book slug, independent of
 * the browse list above — robust against any future filter/limit on the
 * catalogue query (the timeline chips link here). Unknown id, non-book
 * kind, malformed UUID or DB error all degrade to null (graceful no-op).
 * Deliberately OUTSIDE the S2 throw contract: the id is client-controlled
 * (a malformed UUID is a Postgres error, not an outage), and a failed
 * deep-link nicety must not take down an otherwise healthy archive render.
 * Only reachable at request time (`/archive` is searchParams-dynamic), so it
 * goes straight to the live module.
 */
export async function bookSlugById(id: string): Promise<string | null> {
  const { bookSlugByIdLive } = await import("./loader-live");
  return bookSlugByIdLive(id);
}
