/**
 * Cross-request caching for read-mostly DB loaders.
 *
 * The archive's public catalogue (factions, characters, worlds, authors, books)
 * changes only when the ingestion pipeline runs — yet every visitor-facing page
 * used to re-query Postgres on *every* request. Under concurrency that fans many
 * queries into the small Supabase transaction-pooler pool (`max: 5`), which
 * queues inside pgbouncer until `statement_timeout` and "the cancelled state
 * poisons the next request" (see `src/db/client.ts`). The visible symptom was
 * `/compendium` taking ~77 s per load because its layout alone fires ~7 queries
 * per request (impl report 2026-06-07-129).
 *
 * `cachedRead` decouples visitor-count from query-count: the first request in
 * each TTL window does the real read; every other concurrent visitor — across
 * serverless instances — is served from Next's persistent Data Cache.
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
import { cache } from "react";
import { unstable_cache } from "next/cache";

/**
 * Default TTL for cached catalogue reads, in seconds. Stale-by-up-to-an-hour is
 * fine — the data only changes when an ingestion/apply run lands (roughly
 * weekly). The original 300 s meant a heavy cold refill every five minutes; the
 * /compendium fill was measured at 60–120 s and wedged the whole `max:5` pool
 * while it ran (Report 144 § P.1), so the refill must be rare, not frequent.
 * Freshness after an apply run comes from on-demand invalidation
 * (`POST /api/revalidate` → `revalidateTag`), not from a short TTL.
 */
export const READ_CACHE_TTL = 3600;

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
] as const;

interface CachedReadOptions<T> {
  /** Cache tags for on-demand invalidation (e.g. from the ingestion pipeline). */
  tags?: string[];
  /** TTL override (seconds). Defaults to {@link READ_CACHE_TTL}. */
  revalidate?: number;
  /**
   * Returns true when a result is a *degraded* (DB-error) fallback that must NOT
   * be cached. Our loaders swallow DB errors into an empty result; without this
   * guard a single transient failure during a cache-fill would persist "empty"
   * for the whole TTL. When `isDegraded` returns true we throw inside the cached
   * scope so `unstable_cache` skips persisting, and the caller falls back to a
   * live read for that one request — the next request retries.
   */
  isDegraded?: (value: T) => boolean;
}

/**
 * Wrap a zero-arg DB loader so its result is cached across requests (and across
 * serverless instances) for {@link READ_CACHE_TTL} seconds. Layers React
 * `cache()` on top so repeat calls within a single request collapse to one.
 *
 * The loader MUST return a JSON-serializable value (no `Date`, class instances,
 * or `Buffer`) — `unstable_cache` serializes through the Data Cache. All current
 * catalogue loaders already map raw rows to primitives, so this holds; re-verify
 * if a loader's return shape grows a non-serializable field.
 *
 * It MUST also stay under Next's hard **2 MB per-cache-entry limit**. Over that,
 * `unstable_cache` refuses to store it and the set-failure surfaces as an
 * uncatchable background unhandledRejection (the set is fire-and-forget after
 * the value returns) — so only cache compact, list-shaped reads. Payloads that
 * cannot fit (the `/archive` browse blob measured 2.21 MB even with truncated
 * synopses) go through {@link memoryCachedRead} below instead.
 */
export function cachedRead<T>(
  fn: () => Promise<T>,
  keyParts: string[],
  options: CachedReadOptions<T> = {},
): () => Promise<T> {
  const { tags, revalidate = READ_CACHE_TTL, isDegraded } = options;

  const fetchFresh = unstable_cache(
    async (): Promise<T> => {
      const value = await fn();
      if (isDegraded?.(value)) {
        throw new Error(`[db-cache] degraded read (${keyParts.join(":")}) — not caching`);
      }
      return value;
    },
    keyParts,
    { revalidate, tags },
  );

  return cache(async (): Promise<T> => {
    try {
      return await fetchFresh();
    } catch {
      // Degraded result (or a real cache/read error). Fall back to a single live
      // read — the underlying loaders already degrade to an empty value on DB
      // failure, so this never throws and never caches the bad result.
      return fn();
    }
  });
}

/** Reset hooks for every {@link memoryCachedRead} instance (best-effort,
 *  current process only) — called by `POST /api/revalidate` alongside
 *  `revalidateTag` so an apply run can also nudge the in-memory layer. */
const memoryCacheResets: Array<() => void> = [];

export function resetMemoryCaches(): void {
  for (const reset of memoryCacheResets) reset();
}

/**
 * In-memory, per-instance sibling of {@link cachedRead} for read-mostly
 * payloads that exceed Next's 2 MB per-cache-entry limit and therefore cannot
 * use the persistent Data Cache (the `/archive` browse blob: 2.60 MB full,
 * 2.21 MB with truncated synopses — measured 2026-06-12, 889 books).
 *
 * The cache holds the *promise*, so concurrent callers coalesce onto one
 * in-flight read — the anti-stampede property that stops N parallel `/archive`
 * requests from firing N pool-exhausting queries (Report 144 § P.2). Scope is
 * one server process: each serverless instance fills once per TTL window,
 * which trades the cross-instance sharing of `cachedRead` for freedom from the
 * size cap. A degraded or thrown fill is dropped immediately so the next
 * request retries instead of pinning a bad value for the whole TTL.
 */
export function memoryCachedRead<T>(
  fn: () => Promise<T>,
  options: { ttlSeconds?: number; isDegraded?: (value: T) => boolean } = {},
): () => Promise<T> {
  const { ttlSeconds = READ_CACHE_TTL, isDegraded } = options;
  let cached: Promise<T> | null = null;
  let expiresAt = 0;
  let fillSeq = 0;
  memoryCacheResets.push(() => {
    cached = null;
  });

  return async (): Promise<T> => {
    if (cached && expiresAt > Date.now()) return cached;
    // Sequence number guards the late-resolution paths: a degraded/failed fill
    // only clears the slot if no newer fill has replaced it in the meantime.
    const seq = ++fillSeq;
    const value = (async () => {
      try {
        const v = await fn();
        // A degraded (empty-on-error) fill serves this round of callers but is
        // not retained — the next request retries instead of pinning a bad
        // value for the whole TTL.
        if (isDegraded?.(v) && seq === fillSeq) cached = null;
        return v;
      } catch (err) {
        if (seq === fillSeq) cached = null;
        throw err;
      }
    })();
    cached = value;
    expiresAt = Date.now() + ttlSeconds * 1000;
    return value;
  };
}
