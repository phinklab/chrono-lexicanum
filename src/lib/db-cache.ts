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
 * Default TTL for cached catalogue reads, in seconds. Stale-by-a-few-minutes is
 * fine — the data only changes on ingestion. Five minutes is frequent enough to
 * feel live, rare enough to reduce the DB to ~one read per window per cache key.
 * Bump in one place if the catalogue ever needs to feel fresher.
 */
export const READ_CACHE_TTL = 300;

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
 * the value returns) — so only cache compact, list-shaped reads. This is why the
 * fat `/werke` book loader (full synopses + every relation ≈ 2.8 MB) is NOT
 * routed through here; cache lean row-projections, not heavy detail payloads.
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
