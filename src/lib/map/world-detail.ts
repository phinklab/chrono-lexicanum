/**
 * world-detail.ts — SERVER-ONLY resolver for the lazy per-world detail
 * (`WorldDetail`: work list + blurb) behind `/api/map/world/{id}` (S10a).
 *
 * Blurb precedence mirrors the pre-S10a panel exactly: the curated
 * location-blurb (location-blurbs.json via locationId) wins; worlds without
 * one — dust and the few unlinked featured worlds — fall back to the
 * researched world-blurbs.json entry (keyed by map-world id, written by the
 * maintainer-run research pass, docs/map-world-blurbs-run.md); else null.
 *
 * Both JSON sources are bundled at build time; the id→world index is built
 * once per process (module-scope convention, see src/lib/blurbs).
 */
import "server-only";

import { getBlurb } from "../blurbs";
import { loadMapWorlds } from "./load-map-worlds";
import type { MapWorldWork } from "./map-worlds-schema";
import type { WorldDetail } from "./payload";
import worldBlurbsJson from "./world-blurbs.json";

/** Tolerant world-blurbs index: a malformed row is skipped, a broken file
 *  degrades to "no fallback blurbs" — the panel keeps its "empty" filler. */
function indexWorldBlurbs(data: unknown): Map<string, string> {
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

let worldsById: Map<string, { works: MapWorldWork[]; locationId: string | null }> | null = null;
let worldBlurbs: Map<string, string> | null = null;

function index(): {
  worlds: Map<string, { works: MapWorldWork[]; locationId: string | null }>;
  blurbs: Map<string, string>;
} {
  if (!worldsById) {
    worldsById = new Map(
      loadMapWorlds().worlds.map((w) => [w.id, { works: w.works, locationId: w.locationId }]),
    );
  }
  worldBlurbs ??= indexWorldBlurbs(worldBlurbsJson);
  return { worlds: worldsById, blurbs: worldBlurbs };
}

/** Every catalog world id — the static-params source for the detail route. */
export function allWorldIds(): string[] {
  return loadMapWorlds().worlds.map((w) => w.id);
}

/** Detail for one catalog world, or null for an unknown id. */
export function getWorldDetail(worldId: string): WorldDetail | null {
  const { worlds, blurbs } = index();
  const w = worlds.get(worldId);
  if (!w) return null;
  const locationBlurb = w.locationId ? getBlurb("location", w.locationId) : null;
  return {
    works: w.works,
    blurb: locationBlurb?.text ?? blurbs.get(worldId) ?? null,
  };
}
