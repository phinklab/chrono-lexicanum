/**
 * Public book-browse data layer — DB-FREE façade (Launch S1b Loader-Weiche).
 *
 * This is the lean, visitor-facing book-browse loader: it loads exactly what
 * the public filters (`q`, `faction`, `format`, `facet`, `sort`), the row
 * rendering and the typeahead index need — no drift / alias / junction-gap /
 * SSOT audit machinery, and (since Launch S6) none of the fields the browse
 * surface never renders (synopsis, cover, setting dates, page count, era id,
 * series index — the full record lives one click away on `/book/[slug]`).
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
import { cache } from "react";
import { cachedRead } from "@/lib/db-cache";
import {
  isBuildPhase,
  readSnapshotArtifact,
} from "@/lib/snapshot/build-data";
import { compactBrowse, inflateBrowse } from "./browse-wire";

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
  releaseYear: number | null;
  format: string | null;
  /** Kept null-tolerant for the free-text haystack (most books carry `null`
   *  since the S1a era fix; only genuine setting-date buckets have a name). */
  eraName: string | null;
  seriesName: string | null;
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
 * The runtime read: live Postgres, compacted to the normalized wire shape
 * (`browse-wire.ts`, ~0.5 MB vs 2.05 MB flat — Next's Data Cache refuses
 * entries over 2 MB) and stored in the persistent, tagged Data Cache. ONE
 * fixed cache key — the whole catalogue is one entry, per-request views
 * (filter/sort/page) are derived in memory, so the key cardinality cannot
 * grow. `revalidateTag("books"|"archive")` (POST /api/revalidate) purges it
 * cross-instance after an apply run; a rejected fill is never persisted (S2).
 */
const cachedBrowseWire = cachedRead(
  async () => {
    const { fetchBrowseBooksLive } = await import("./loader-live");
    return compactBrowse(await fetchBrowseBooksLive());
  },
  ["browse-books-wire"],
  { tags: ["archive", "books"] },
);

/**
 * The public entry point. At build time the committed snapshot is the ONLY
 * data source (fail-closed: a missing artifact throws and fails the build);
 * at request time the wire entry is inflated back to `BrowseData` — wrapped
 * in React `cache()` so one request inflates at most once.
 */
export const loadBrowseBooks = cache(async (): Promise<BrowseData> => {
  if (isBuildPhase()) {
    return readSnapshotArtifact<BrowseData>("browseBooks");
  }
  return inflateBrowse(await cachedBrowseWire());
});

/**
 * Resolve a `?focus=<workId>` deep-link target to its book slug, independent of
 * the browse list above — robust against any future filter/limit on the
 * catalogue query, and (since S6) against the server-side pagination: the
 * timeline chips link here and the target book may live on any page. Unknown
 * id, non-book kind, malformed UUID or DB error all degrade to null (graceful
 * no-op). Deliberately OUTSIDE the S2 throw contract: the id is
 * client-controlled (a malformed UUID is a Postgres error, not an outage), and
 * a failed deep-link nicety must not take down an otherwise healthy archive
 * render. Only reachable at request time (`/archive` is searchParams-dynamic),
 * so it goes straight to the live module.
 */
export async function bookSlugById(id: string): Promise<string | null> {
  const { bookSlugByIdLive } = await import("./loader-live");
  return bookSlugByIdLive(id);
}
