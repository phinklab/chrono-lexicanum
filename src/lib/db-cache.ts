/**
 * Cross-request cache for the read-mostly public catalogue. `cachedRead`
 * collapses concurrent reads through Next's persistent Data Cache so traffic
 * does not fan into the small Supabase pool.
 *
 * Loader contract: detail reads return data or `null` only for genuine absence;
 * index reads return arrays; DB/shape failures throw. Rejected fills are not
 * cached, while a failed refresh may continue serving the last good value.
 *
 * `unstable_cache` is intentional while `cacheComponents` is off: unlike the
 * default per-instance `use cache` store, it survives serverless fan-out.
 */
import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { READ_CACHE_TTL } from "@/lib/memory-cache";

// The per-instance sibling stays server-only-free for manual ask-engine scripts.
// Re-export it here so server code has one import home for both cache layers.
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
 * Persistent cross-instance cache plus React request dedupe. Loaders throw;
 * rejected cold fills retry on the next request and failed expired refreshes
 * preserve stale-good data. Values must be JSON-serializable and remain below
 * Next's 2 MB entry limit; compact larger wire shapes or use
 * {@link memoryCachedRead} for structures such as `Map` and `Set`.
 */
export function cachedRead<T>(
  fn: () => Promise<T>,
  keyParts: string[],
  options: CachedReadOptions = {},
): () => Promise<T> {
  const { tags, revalidate = READ_CACHE_TTL } = options;
  return cache(unstable_cache(fn, keyParts, { revalidate, tags }));
}
