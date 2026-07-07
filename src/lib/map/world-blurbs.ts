/**
 * world-blurbs.ts — lazy client access to the map-world blurbs (178b Runde 8).
 *
 * `world-blurbs.json` carries one short researched sentence per chart contact
 * that has NO location-blurb: dust worlds and the few featured worlds without
 * a linked location. Keyed by map-world id (scripts/seed-data/map-worlds.json),
 * NOT by locationId — where a location-blurb exists (payload `blurb`, curated
 * in scripts/seed-data/location-blurbs.json) it always wins.
 *
 * The file is written by the maintainer-run research pass
 * (docs/map-world-blurbs-run.md) and grows toward ~900 entries — it is
 * dynamic-imported as its own chunk on first use (WorldPanel), so neither the
 * map payload nor the initial bundle carries it.
 */

let cache: Map<string, string> | null = null;
let pending: Promise<Map<string, string>> | null = null;

/** Tolerant index: a malformed row is skipped, a broken file degrades to
 *  "no blurbs" — the panel then keeps its "empty. add later" filler. */
function indexBlurbs(data: unknown): Map<string, string> {
  const map = new Map<string, string>();
  if (typeof data !== "object" || data === null) return map;
  const blurbs = (data as { blurbs?: unknown }).blurbs;
  if (!Array.isArray(blurbs)) return map;
  for (const raw of blurbs) {
    if (typeof raw !== "object" || raw === null) continue;
    const o = raw as Record<string, unknown>;
    if (typeof o.id === "string" && typeof o.blurb === "string" && o.blurb.length > 0) {
      map.set(o.id, o.blurb);
    }
  }
  return map;
}

export function loadWorldBlurbs(): Promise<Map<string, string>> {
  if (cache) return Promise.resolve(cache);
  pending ??= import("./world-blurbs.json").then((mod) => {
    cache = indexBlurbs(mod.default);
    return cache;
  });
  return pending;
}
