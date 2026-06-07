/**
 * Compendium data layer — Brief 129 (Doorways). SERVER-ONLY (imports `@/db`).
 *
 * Each of the five categories is built from an existing aggregate query — no new
 * SQL: factions reuse `/fraktionen`'s `loadFactionGuide` (+ its `hasContent`
 * gate), the rest reuse the atlas inventory rows (`getCharaktereRows`,
 * `getWeltenRows`, `getPersonenRows`). The builders map those rows to the pure
 * `CompendiumItem` shape — a resolved entity `href` plus pre-computed display
 * strings — so the pages and the client controls stay db-free.
 *
 * Everything is wrapped in React `cache()`: a category page reads its own items
 * AND the layout reads all-five counts in the same request; caching collapses
 * the shared builder calls (and the shared `getCharaktereRows` behind Characters
 * + Primarchs) to one DB fan-out per request.
 */
import { cache } from "react";
import { cachedRead } from "@/lib/db-cache";
import {
  getCharaktereRows,
  getPersonenRows,
  getWeltenRows,
} from "@/lib/atlas/queries";
import { factionDot } from "@/lib/faction-colors";
import {
  loadFactionGuide,
  type Alignment,
  type FactionGuide,
} from "@/app/fraktionen/loader";
import { hasContent } from "@/app/fraktionen/filters";
import type { CompendiumItem } from "./categories";
import { CURATED_PRIMARCH_IDS } from "./primarchs";

/**
 * A world earns a place only once the archive returns to it. The threshold is a
 * named constant (Brief 129 leaves N to the implementer): with ~2400 location
 * rows, the long tail is single-mention scenery — 3+ appearances (books +
 * podcast episodes, counted off `work_locations`) marks a world the stories
 * actually orbit, which is what the directory should surface.
 */
export const WORLD_MENTION_THRESHOLD = 3;

const ALIGNMENT_LABELS: Record<Alignment, string> = {
  imperium: "Imperium",
  chaos: "Chaos",
  xenos: "Xenos",
  neutral: "Neutral",
};

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** A short sigil character reads as a badge; longer "glyphs" are prose → drop. */
function shortGlyph(glyph: string | null): string | null {
  if (!glyph) return null;
  const g = glyph.trim();
  return g.length > 0 && g.length <= 3 ? g : null;
}

/** Concise "what's behind this faction" line for a directory row. */
function factionStats(f: FactionGuide): string | null {
  const parts: string[] = [];
  if (f.bookCount > 0) parts.push(plural(f.bookCount, "book"));
  if (f.episodeCount > 0) parts.push(plural(f.episodeCount, "episode"));
  if (f.characterCount > 0) parts.push(plural(f.characterCount, "character"));
  if (f.subfactionCount > 0) parts.push(plural(f.subfactionCount, "sub-faction"));
  return parts.length > 0 ? parts.join(" · ") : null;
}

// ── Cached source rows (shared ACROSS requests + within one request) ─────────
// `cachedRead` wraps each source loader in Next's persistent Data Cache
// (`unstable_cache`, shared across requests and serverless instances) plus a
// React `cache()` for per-request dedup. The first request per TTL window does
// the real read; every concurrent visitor is served from cache, so the ~7
// queries this surface fans out no longer multiply by visitor-count and never
// swamp the `max:5` pool. The four reads always return non-empty data in normal
// operation (the archive always has factions, characters, worlds and authors),
// so an empty result means the read failed → `isDegraded` keeps it out of the
// cache. See `src/lib/db-cache.ts` for the full rationale.
const cachedFactionGuide = cachedRead(loadFactionGuide, ["compendium", "faction-guide"], {
  tags: ["compendium", "factions"],
  isDegraded: (rows) => rows.length === 0,
});
const cachedCharaktere = cachedRead(getCharaktereRows, ["compendium", "charaktere-rows"], {
  tags: ["compendium", "characters"],
  isDegraded: (rows) => rows.length === 0,
});
const cachedWelten = cachedRead(getWeltenRows, ["compendium", "welten-rows"], {
  tags: ["compendium", "worlds"],
  isDegraded: (rows) => rows.length === 0,
});
const cachedPersonen = cachedRead(getPersonenRows, ["compendium", "personen-rows"], {
  tags: ["compendium", "authors"],
  isDegraded: (rows) => rows.length === 0,
});

// ── Per-category builders ────────────────────────────────────────────────────

export const loadFactionItems = cache(async (): Promise<CompendiumItem[]> => {
  const guide = await cachedFactionGuide();
  return guide
    .filter(hasContent)
    .map((f): CompendiumItem => ({
      id: f.id,
      name: f.name,
      href: `/fraktion/${f.id}`,
      kicker: ALIGNMENT_LABELS[f.alignment],
      meta: factionStats(f),
      dotColor: factionDot(f.name),
      glyph: shortGlyph(f.glyph),
      facet: f.alignment,
      groupKey: f.alignment,
      groupLabel: ALIGNMENT_LABELS[f.alignment],
      weight: f.bookCount + f.episodeCount,
    }));
});

export const loadCharacterItems = cache(async (): Promise<CompendiumItem[]> => {
  const rows = await cachedCharaktere();
  const primarchs = new Set(CURATED_PRIMARCH_IDS);
  // A character earns a row when it actually appears in a work; primarchs are
  // hoisted into their own category, so they're excluded here (no double-listing).
  return rows
    .filter((c) => c.workCount > 0 && !primarchs.has(c.id))
    .map((c): CompendiumItem => ({
      id: c.id,
      name: c.name,
      href: `/charakter/${c.id}`,
      kicker: c.primaryFactionName,
      meta: plural(c.workCount, "appearance"),
      dotColor: c.primaryFactionName ? factionDot(c.primaryFactionName) : null,
      glyph: null,
      facet: null,
      groupKey: null,
      groupLabel: null,
      weight: c.workCount,
    }));
});

export const loadPrimarchItems = cache(async (): Promise<CompendiumItem[]> => {
  const ids = CURATED_PRIMARCH_IDS;
  if (ids.length === 0) return []; // Roster not curated yet → graceful pending.
  const rows = await cachedCharaktere();
  const byId = new Map(rows.map((c) => [c.id, c]));
  const items: CompendiumItem[] = [];
  for (const id of ids) {
    const c = byId.get(id);
    if (!c) {
      // A curated id that no longer resolves is a data error, not a silent drop.
      console.error(
        `[/compendium/primarchen] curated primarch id "${id}" not found in characters — dropping.`,
      );
      continue;
    }
    items.push({
      id: c.id,
      name: c.name,
      href: `/charakter/${c.id}`,
      kicker: c.primaryFactionName,
      meta: c.workCount > 0 ? plural(c.workCount, "appearance") : null,
      dotColor: c.primaryFactionName ? factionDot(c.primaryFactionName) : null,
      glyph: null,
      facet: null,
      groupKey: null,
      groupLabel: null,
      weight: c.workCount,
    });
  }
  return items;
});

export const loadWorldItems = cache(async (): Promise<CompendiumItem[]> => {
  const rows = await cachedWelten();
  return rows
    .filter((w) => w.workCount >= WORLD_MENTION_THRESHOLD)
    .map((w): CompendiumItem => ({
      id: w.id,
      name: w.name,
      href: `/welt/${w.id}`,
      kicker: w.sectorName,
      meta: plural(w.workCount, "appearance"),
      dotColor: null,
      glyph: null,
      facet: null,
      groupKey: null,
      groupLabel: null,
      weight: w.workCount,
    }));
});

export const loadAuthorItems = cache(async (): Promise<CompendiumItem[]> => {
  const rows = await cachedPersonen();
  // Autoren = persons who hold an authoring role on at least one work (a
  // narrator-only person belongs to a future category, not here).
  return rows
    .filter((p) => p.roles.includes("author") || p.roles.includes("co_author"))
    .map((p): CompendiumItem => ({
      id: p.id,
      name: p.name,
      href: `/person/${p.id}`,
      kicker: null,
      meta: p.workCount > 0 ? plural(p.workCount, "work") : null,
      dotColor: null,
      glyph: null,
      facet: null,
      groupKey: null,
      groupLabel: null,
      weight: p.workCount,
    }));
});

/** Dispatch a category slug to its builder. Unknown slug → empty list. */
export function loadCategoryItems(slug: string): Promise<CompendiumItem[]> {
  switch (slug) {
    case "fraktionen":
      return loadFactionItems();
    case "primarchen":
      return loadPrimarchItems();
    case "charaktere":
      return loadCharacterItems();
    case "welten":
      return loadWorldItems();
    case "autoren":
      return loadAuthorItems();
    default:
      return Promise.resolve([]);
  }
}

/** Item counts per category slug, for the nav badges + overview. Cached. */
export const loadCompendiumCounts = cache(
  async (): Promise<Record<string, number>> => {
    const [fraktionen, primarchen, charaktere, welten, autoren] =
      await Promise.all([
        loadFactionItems(),
        loadPrimarchItems(),
        loadCharacterItems(),
        loadWorldItems(),
        loadAuthorItems(),
      ]);
    return {
      fraktionen: fraktionen.length,
      primarchen: primarchen.length,
      charaktere: charaktere.length,
      welten: welten.length,
      autoren: autoren.length,
    };
  },
);
