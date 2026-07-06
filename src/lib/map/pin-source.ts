/**
 * pin-source.ts — the community seam (Brief 178, Entscheid 6): pins reach the
 * chart through a typed source registry so filters / popup / hit-testing stay
 * source-agnostic. v1 ships exactly one source (`catalog`); a future
 * community layer adds a second source here without touching the chart.
 *
 * Deliberately synchronous and boring. `detail()` is the pressure valve: if
 * the one-shot payload ever grows too big, work lists move behind this call
 * (lazy fetch) without any UI change.
 *
 * Session-Nachtrag 178: dust worlds (no linked works) are contacts too — the
 * source resolves all 1054 catalog ids, so every dot on the chart opens a
 * panel. Dust details are synthesized from the compact tuples (n=0, works=[]).
 */

import type { FeaturedWorld, MapPayload } from "./payload";

export interface PinSource {
  id: string;
  /** Every pin this source contributes, in stable order. */
  pins(): readonly FeaturedWorld[];
  /** Full detail for one pin (world panel), or null. */
  detail(worldId: string): FeaturedWorld | null;
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
      works: [],
    };
    if (si >= 0) d.seg = payload.segs[si];
    byId.set(id, d);
  }
  return {
    id: "catalog",
    pins: () => payload.featured,
    detail: (worldId) => byId.get(worldId) ?? null,
  };
}
