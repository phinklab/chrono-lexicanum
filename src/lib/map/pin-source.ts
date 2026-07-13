/**
 * pin-source.ts — the community seam: pins reach the
 * chart through a typed source registry so filters / popup / hit-testing stay
 * source-agnostic. v1 ships exactly one source (`catalog`); a future
 * community layer adds a second source here without touching the chart.
 *
 * `detail()` is the pressure valve, and since S10a the valve is open: the
 * one-shot payload carries pins + counts only, and the work list + blurb of
 * the clicked world arrive per world from `/api/map/world/{id}` (prerendered
 * static JSON, cached here per session). `peek()` is the synchronous
 * skeleton lookup for camera flights, hash restore and the panel shell.
 *
 * Dust worlds (no linked works) are contacts too — the
 * source resolves all 1054 catalog ids, so every dot on the chart opens a
 * panel. Dust skeletons are synthesized from the compact tuples (n=0).
 */

import type { FeaturedWorld, MapPayload, WorldDetail } from "./payload";

export interface PinSource {
  id: string;
  /** Every pin this source contributes, in stable order. */
  pins(): readonly FeaturedWorld[];
  /** Synchronous skeleton for one pin (position, name, kind, count), or
   *  null for an unknown id. */
  peek(worldId: string): FeaturedWorld | null;
  /** Full detail for one pin (world panel) — lazy, cached. Resolves null
   *  for unknown ids or when the fetch fails: the panel keeps its skeleton
   *  and shows the "empty" filler instead of crashing. */
  detail(worldId: string): Promise<WorldDetail | null>;
}

/** Runtime shape-check on the fetched JSON — a CDN error page or truncated
 *  body degrades to null, never into the panel render. */
function asWorldDetail(data: unknown): WorldDetail | null {
  if (typeof data !== "object" || data === null) return null;
  const o = data as { works?: unknown; blurb?: unknown };
  if (!Array.isArray(o.works)) return null;
  return {
    works: o.works as WorldDetail["works"],
    blurb: typeof o.blurb === "string" && o.blurb.length > 0 ? o.blurb : null,
  };
}

export function catalogSource(payload: MapPayload): PinSource {
  const byId = new Map(payload.featured.map((f) => [f.id, f]));
  for (const [gx, gy, ci, id, name, si] of payload.dust) {
    const d: FeaturedWorld = {
      id,
      name,
      kind: payload.kinds[payload.clsKind[ci]] ?? "unclassified",
      c: ci,
      gx,
      gy,
      n: 0,
    };
    if (si >= 0) d.seg = payload.segs[si];
    byId.set(id, d);
  }
  const details = new Map<string, Promise<WorldDetail | null>>();
  return {
    id: "catalog",
    pins: () => payload.featured,
    peek: (worldId) => byId.get(worldId) ?? null,
    detail: (worldId) => {
      if (!byId.has(worldId)) return Promise.resolve(null);
      let p = details.get(worldId);
      if (!p) {
        p = fetch(`/api/map/world/${encodeURIComponent(worldId)}`)
          .then((res) => (res.ok ? res.json() : null))
          .then(asWorldDetail)
          .catch(() => null);
        // A failed fetch stays retryable on the next open instead of
        // pinning null for the session.
        p.then((d) => {
          if (d === null) details.delete(worldId);
        });
        details.set(worldId, p);
      }
      return p;
    },
  };
}
