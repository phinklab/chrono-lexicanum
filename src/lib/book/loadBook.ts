/**
 * Book-detail data layer — DB-FREE façade (Launch S4b Loader-Weiche, the
 * entity `loader.ts` pattern).
 *
 * The canonical `book/[slug]` page AND the `@modal/(.)book` intercept share
 * this one data source — zero fork, exactly like `src/lib/entity/loader.ts`.
 *
 * Two entry points:
 *   - `listHotBookSlugs()` feeds `generateStaticParams` on /book/[slug]: at
 *     build time the curated hot-slug list comes straight from the committed
 *     snapshot (zero DB reads on the build path); at request time (`next dev`)
 *     it intersects the curated constant with the live works table.
 *   - `loadBook(slug)` returns the full detail payload, or null for a
 *     genuinely missing slug → the page calls `notFound()`; DB errors THROW
 *     into the route's error boundary (S2 contract, see `src/lib/db-cache.ts`).
 *     At build time — only ever reached with hot slugs, via
 *     `generateStaticParams` — it reads the per-book snapshot payload
 *     (fail-closed: a missing artifact throws and fails the build). At request
 *     time it lazy-imports the live Postgres module behind a per-slug
 *     `cachedRead` layer: repeat visits serve from Next's persistent Data
 *     Cache instead of re-running the 8-query fan-out (under load the uncached
 *     route degraded from 0.21 s to a 90 s timeout); one payload is a few KB,
 *     far under the 2 MB cache cap. A missing slug caches as `null` (a stable
 *     404 is a legitimate result); a DB error is never cached. The `books` tag
 *     is invalidated by `POST /api/revalidate` after ingestion.
 *
 * Wrapped in React `cache()` (per-request memo: `generateMetadata` + the
 * default export dedupe to a single read). This module must never statically
 * import `@/db` — every prerendered book page pulls it in, and the DB-free CI
 * build depends on the chain staying clean. The Postgres bodies live in
 * `./loader-live`.
 */
import "server-only";
import { cache } from "react";
import { cachedRead } from "@/lib/db-cache";
import {
  isBuildPhase,
  readSnapshotArtifact,
  readSnapshotBook,
} from "@/lib/snapshot/build-data";
import type { BookDetail } from "./loader-live";

export type { BookDetail } from "./loader-live";

/**
 * The curated build-time prerender set for /book/[slug]. At build time the
 * snapshot's hot-slug list is authoritative: it was intersected with the live
 * works table at export time, and every listed slug is guaranteed a matching
 * `books/<slug>.json` payload (manifest gate), so `loadBook` below can never
 * miss during prerender. At request time the live intersect keeps the same
 * drop-to-on-demand semantics for slugs that have since vanished.
 */
export async function listHotBookSlugs(): Promise<string[]> {
  if (isBuildPhase()) {
    return readSnapshotArtifact<string[]>("bookHotSlugs");
  }
  const { listHotBookSlugsLive } = await import("./loader-live");
  return listHotBookSlugsLive();
}

/**
 * Load one book's full detail payload by slug, or null if the slug does not
 * exist (→ 404); DB errors throw. See the module header for the build/runtime
 * split and the cache layers.
 */
export const loadBook = cache(async (slug: string): Promise<BookDetail | null> => {
  if (isBuildPhase()) {
    return readSnapshotBook<BookDetail>(slug);
  }
  const { loadBookLive } = await import("./loader-live");
  return cachedRead(() => loadBookLive(slug), ["book", slug], {
    tags: ["books"],
  })();
});
