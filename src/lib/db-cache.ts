/**
 * Cross-request caching for read-mostly DB loaders.
 *
 * The archive's public catalogue (factions, characters, worlds, authors, books)
 * changes only when the ingestion pipeline runs — yet without caching every
 * visitor-facing page re-queries Postgres on *every* request. Under concurrency
 * that fans many queries into the small Supabase transaction-pooler pool
 * (`max: 5`), which queues inside pgbouncer until `statement_timeout` and "the
 * cancelled state poisons the next request" (see `src/db/client.ts`). The
 * visible symptom was `/compendium` taking ~77 s per load because its layout
 * alone fires ~7 queries per request.
 *
 * `cachedRead` decouples visitor-count from query-count: the first request in
 * each TTL window does the real read; every other concurrent visitor — across
 * serverless instances — is served from Next's persistent Data Cache.
 *
 * ## Loader error contract (Launch S2)
 *
 * Every public loader follows one convention — three states, no Result
 * framework:
 *
 *   - **Detail loaders** (one entity/book/show by id or slug) return the data,
 *     or `null` for genuine absence (no such row), and THROW on DB/shape
 *     errors. Only `null` leads to `notFound()`; a throw reaches the route's
 *     error boundary.
 *   - **Index loaders** (catalogue lists) return an array — legitimately empty
 *     is a valid result — and THROW on DB/shape errors.
 *
 * So a DB outage renders an error surface, never a 404 and never an "empty
 * archive". The cache layers below inherit that contract: a throwing fill is
 * never persisted (Next's `unstable_cache` only stores resolved values), the
 * error propagates to the caller exactly once per request (no retry
 * fallback), and — on the warm path — an expired entry whose background
 * refresh fails keeps serving the last good value (`unstable_cache` returns
 * the stale response when its revalidation callback rejects), which preserves
 * the stale-good behaviour during a transient incident.
 *
 * Why `unstable_cache` and not the newer `'use cache'` directive: `'use cache'`
 * requires the app-wide `cacheComponents` flag, which (a) is a project-wide
 * behaviour switch that deletes every `export const revalidate` we already rely
 * on (Home, /podcasts), and (b) defaults to a per-instance in-memory store that
 * does NOT survive serverless fan-out — so it would miss on most concurrent
 * requests and still hammer the DB. `unstable_cache` uses the shared, persistent
 * Data Cache, which is exactly what a high-concurrency read-mostly site needs.
 * It is deprecated-in-name but fully supported while `cacheComponents` is off
 * (Next 16.2).
 */
import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { READ_CACHE_TTL } from "@/lib/memory-cache";

// The per-instance sibling (`memoryCachedRead`, its reset registry and the
// shared TTL) lives in `src/lib/memory-cache.ts` — a deliberately
// `server-only`-free module so the ask engine stays loadable from the manual
// tsx scripts. Re-exported here so server code keeps one import home for the
// caching layer.
export {
  READ_CACHE_TTL,
  memoryCachedRead,
  resetMemoryCaches,
} from "@/lib/memory-cache";

/**
 * Canonical registry of catalogue cache tags. Every `cachedRead` call site
 * draws its tags from this set so `POST /api/revalidate` can blow the whole
 * catalogue cache after an ingestion/apply run without the two lists drifting.
 * Add here first when introducing a new tag.
 */
export const CATALOGUE_TAGS = [
  "compendium",
  "factions",
  "characters",
  "worlds",
  "authors",
  "archive",
  "books",
  "entities",
  "podcasts",
  "timeline",
  "now",
  "statistics",
] as const;

interface CachedReadOptions {
  /** Cache tags for on-demand invalidation (e.g. from the ingestion pipeline). */
  tags?: string[];
  /** TTL override (seconds). Defaults to {@link READ_CACHE_TTL}. */
  revalidate?: number;
}

/**
 * Wrap a zero-arg DB loader so its result is cached across requests (and across
 * serverless instances) for {@link READ_CACHE_TTL} seconds. Layers React
 * `cache()` on top so repeat calls within a single request collapse to one.
 *
 * Error semantics follow the S2 contract (file header): the loader THROWS on
 * DB/shape errors. `unstable_cache` never persists a rejected fill, so a cold
 * failure propagates to the error boundary and the next request retries; a
 * failure while refreshing an expired entry serves the last good value
 * (stale-good). There is deliberately NO catch-and-retry here — a failing
 * source is hit exactly once per request.
 *
 * The loader MUST return a JSON-serializable value (no `Date`, class instances,
 * or `Buffer`) — `unstable_cache` serializes through the Data Cache. All current
 * catalogue loaders already map raw rows to primitives, so this holds; re-verify
 * if a loader's return shape grows a non-serializable field.
 *
 * It MUST also stay under Next's hard **2 MB per-cache-entry limit**. Over that,
 * `unstable_cache` refuses to store it and the set-failure surfaces as an
 * uncatchable background unhandledRejection (the set is fire-and-forget after
 * the value returns) — so only cache compact, list-shaped reads. A payload that
 * would not fit gets a compact wire shape first (the `/archive` browse blob
 * measured 2.05 MB flat and stores as a ~0.5 MB normalized entry since S6 —
 * see `src/app/archive/browse-wire.ts`); {@link memoryCachedRead} below
 * remains for values that cannot pass the serialization boundary at all
 * (the /ask engine's `Map`/`Set` structures).
 */
export function cachedRead<T>(
  fn: () => Promise<T>,
  keyParts: string[],
  options: CachedReadOptions = {},
): () => Promise<T> {
  const { tags, revalidate = READ_CACHE_TTL } = options;
  return cache(unstable_cache(fn, keyParts, { revalidate, tags }));
}
