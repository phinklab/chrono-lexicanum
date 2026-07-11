/**
 * In-memory, per-instance promise cache — the process-local sibling of
 * `cachedRead` in `src/lib/db-cache.ts` (which re-exports everything here and
 * documents the caching strategy + the S2 loader error contract).
 *
 * Deliberately NO `import "server-only"` and no `next/*` imports: this module
 * is reached by the ask engine (`src/lib/ask/recommend.ts` / `matrix.ts`),
 * which the manual DB-gated scripts (`scripts/test-ask-recommend.ts`,
 * `scripts/audit-ask-combinations.ts`) load under plain `tsx` — outside Next,
 * where `server-only` does not even resolve. The server-side write paths
 * (route handler, loaders) keep their guard via `db-cache.ts`.
 */

/**
 * Default TTL for cached catalogue reads, in seconds. Stale-by-up-to-an-hour is
 * fine — the data only changes when an ingestion/apply run lands (roughly
 * weekly). A short TTL (e.g. 300 s) means a heavy cold refill every five
 * minutes; the /compendium fill was measured at 60–120 s and wedges the whole
 * `max:5` pool while it runs, so the refill must be rare, not frequent.
 * Freshness after an apply run comes from on-demand invalidation
 * (`POST /api/revalidate` → `revalidateTag` + `resetMemoryCaches`), not from a
 * short TTL.
 */
export const READ_CACHE_TTL = 3600;

/** Reset hooks for every {@link memoryCachedRead} instance (best-effort,
 *  current process only) — called by `POST /api/revalidate` alongside
 *  `revalidateTag` so an apply run can also nudge the in-memory layer. */
const memoryCacheResets: Array<() => void> = [];

export function resetMemoryCaches(): void {
  for (const reset of memoryCacheResets) reset();
}

/**
 * Wrap a zero-arg async loader in a per-process promise cache. Used for
 * read-mostly payloads that exceed Next's 2 MB per-cache-entry limit and
 * therefore cannot use the persistent Data Cache (the `/archive` browse blob:
 * 2.60 MB full, 2.21 MB with truncated synopses — measured at 889 books), and
 * for non-serializable derived structures (the /ask book list and result
 * matrix hold `Map`s/`Set`s).
 *
 * The cache holds the *promise*, so concurrent callers coalesce onto one
 * in-flight read — the anti-stampede property that stops N parallel `/archive`
 * requests from firing N pool-exhausting queries. Scope is
 * one server process: each serverless instance fills once per TTL window,
 * which trades the cross-instance sharing of `cachedRead` for freedom from the
 * size cap. A rejected fill is evicted immediately (all coalesced callers of
 * that round see the error once; the next request retries), so a transient
 * failure never poisons follow-up requests for the rest of the TTL.
 */
export function memoryCachedRead<T>(
  fn: () => Promise<T>,
  options: { ttlSeconds?: number } = {},
): () => Promise<T> {
  const { ttlSeconds = READ_CACHE_TTL } = options;
  let cached: Promise<T> | null = null;
  let expiresAt = 0;
  let fillSeq = 0;
  memoryCacheResets.push(() => {
    cached = null;
  });

  return async (): Promise<T> => {
    if (cached && expiresAt > Date.now()) return cached;
    // Sequence number guards the late-rejection path: a failed fill only
    // clears the slot if no newer fill has replaced it in the meantime.
    const seq = ++fillSeq;
    const value = (async () => {
      try {
        return await fn();
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
