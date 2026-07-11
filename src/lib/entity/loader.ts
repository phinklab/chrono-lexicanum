/**
 * Entity-graph data layer — DB-FREE façade (Launch S1b Loader-Weiche).
 *
 * Three entry points:
 *   - `listHotEntityIds(type)` feeds `generateStaticParams` on the four entity
 *     routes: at build time the curated hot-id list comes straight from the
 *     committed snapshot (zero DB reads on the build path); at request time it
 *     intersects the curated constant with the live table.
 *   - `loadEntity(type, id)` returns the frame-agnostic `EntityView`, or null
 *     for a genuinely missing id → the page calls `notFound()`; DB errors
 *     THROW into the route's error boundary (S2 contract, see
 *     `src/lib/db-cache.ts`). At build
 *     time — only ever reached with hot ids, via `generateStaticParams` — it
 *     reads the per-entity snapshot payload (fail-closed: a missing artifact
 *     throws and fails the build). At request time (on-demand long tail, ISR
 *     refresh, modal intercepts, compendium merges) it lazy-imports the live
 *     Postgres module behind a per-id `cachedRead` layer (tag `entities`, the
 *     loadBook pattern) so repeat reads serve from the persistent Data Cache.
 *     Wrapped in React `cache()` so a route's
 *     `generateMetadata` + default export dedupe to a single read per request.
 *   - `listEntityIds(type)` (all ids, currently unconsumed — reserved for the
 *     S5 sitemap) always takes the live path.
 *
 * This module must never statically import `@/db` — every prerendered entity
 * page pulls it in, and the DB-free CI build depends on the chain staying
 * clean. The Postgres bodies live in `./loader-live`.
 */
import "server-only";
import { cache } from "react";
import { cachedRead } from "@/lib/db-cache";
import {
  isBuildPhase,
  readSnapshotArtifact,
  readSnapshotEntity,
} from "@/lib/snapshot/build-data";
import type { EntityType, EntityView } from "./types";

/**
 * All ids for one reference table (reserved for the S5 sitemap). Request-time
 * only — the build path never enumerates full tables.
 */
export async function listEntityIds(type: EntityType): Promise<string[]> {
  const { listEntityIdsLive } = await import("./loader-live");
  return listEntityIdsLive(type);
}

/**
 * The curated build-time prerender set for one entity type. At build time the
 * snapshot's hot-id list is authoritative: it was intersected with the live
 * table at export time, and every listed id is guaranteed a matching
 * `entities/<type>/<id>.json` payload (manifest gate), so `loadEntity` below
 * can never miss during prerender. At request time the live intersect keeps
 * the same drop-to-on-demand semantics for ids that have since vanished.
 */
export async function listHotEntityIds(type: EntityType): Promise<string[]> {
  if (isBuildPhase()) {
    const hotIds =
      readSnapshotArtifact<Record<EntityType, string[]>>("entityHotIds");
    return hotIds[type];
  }
  const { listHotEntityIdsLive } = await import("./loader-live");
  return listHotEntityIdsLive(type);
}

/**
 * Load one entity's full view payload, or null if the id does not exist (→
 * `notFound()`); DB errors throw. `cache()`-memoised per request so metadata +
 * page share one read.
 *
 * The runtime path adds a per-id `cachedRead` layer: one `EntityView` is a few
 * KB (far under the 2 MB entry cap), a missing id caches as a stable `null`,
 * and the `entities` tag lets `POST /api/revalidate` refresh every entity read
 * after an apply run instead of waiting for the 24 h ISR backstop.
 */
export const loadEntity = cache(
  async (type: EntityType, id: string): Promise<EntityView | null> => {
    if (isBuildPhase()) {
      return readSnapshotEntity<EntityView>(type, id);
    }
    const { loadEntityLive } = await import("./loader-live");
    return cachedRead(() => loadEntityLive(type, id), ["entity", type, id], {
      tags: ["entities"],
    })();
  },
);
