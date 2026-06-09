/**
 * Entity-blurb data layer — Board 121-P5. SERVER-ONLY.
 *
 * A thin curation layer over the entity graph: one curated description sentence
 * per faction / character / location, keyed by the same string id as the detail
 * route's `[slug]` (Spec 129 — no DB column, no migration). The JSON lives under
 * `scripts/seed-data/*-blurbs.json`; this module is the ONLY place in the app
 * that imports it (everything else imports `@/lib/blurbs`).
 *
 * Why module-scope Maps, not React `cache()`: the blurbs are STATIC build-time
 * data. `resolveJsonModule` bundles the JSON at build, and the id→Blurb Maps are
 * built once at module load — a per-process singleton with no per-request I/O.
 * `cache()` only dedupes *async* work within a request, so it buys nothing for a
 * synchronous in-memory lookup. The detail pages are SSG, so the resolved text
 * is baked into the static HTML at build time. This mirrors the established
 * seed-data → module-scope-Map convention in `src/lib/resolver/index.ts`.
 *
 * `import "server-only"` keeps the ~460 KB of blurb JSON out of every client
 * bundle: blurbs are resolved in the server-only entity loader, and only the
 * resolved `Blurb` object travels into the (server-rendered) view.
 */
import "server-only";
import factionBlurbs from "../../../scripts/seed-data/faction-blurbs.json";
import characterBlurbs from "../../../scripts/seed-data/character-blurbs.json";
import locationBlurbs from "../../../scripts/seed-data/location-blurbs.json";
import type { Blurb, EntityType } from "../entity/types";

/** The on-disk row shape (a superset of what we render). */
type RawBlurb = {
  id: string;
  blurb: string;
  confidence: number;
  sourceUrl?: string;
};

/** Index one blurb file into an id→Blurb map, dropping unrendered fields. */
function indexBlurbs(file: { blurbs: RawBlurb[] }): Map<string, Blurb> {
  const map = new Map<string, Blurb>();
  for (const b of file.blurbs) {
    map.set(b.id, {
      text: b.blurb,
      confidence: b.confidence,
      // Omit the key entirely when absent (no `sourceUrl: undefined`).
      ...(b.sourceUrl ? { sourceUrl: b.sourceUrl } : {}),
    });
  }
  return map;
}

/** Built once at module load. `person` has no curated blurbs → no entry. */
const BY_TYPE: Partial<Record<EntityType, Map<string, Blurb>>> = {
  faction: indexBlurbs(factionBlurbs),
  character: indexBlurbs(characterBlurbs),
  location: indexBlurbs(locationBlurbs),
};

/**
 * The curated blurb for one entity, or `null` when none exists (a missing id, or
 * a type without a blurb file). Synchronous — the caller stays a plain function.
 */
export function getBlurb(type: EntityType, id: string): Blurb | null {
  return BY_TYPE[type]?.get(id) ?? null;
}
