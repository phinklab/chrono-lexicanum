/**
 * Compendium data layer — DB-FREE façade (Launch S1b Loader-Weiche).
 *
 * Each of the five categories is built from an existing aggregate query — no new
 * SQL: factions reuse `/fraktionen`'s `loadFactionGuide` (+ its `hasContent`
 * gate), the rest reuse the inventory rows in `./queries` (`getCharaktereRows`,
 * `getWeltenRows`, `getPersonenRows`). The builders map those rows to the pure
 * `CompendiumItem` shape — a resolved entity `href` plus pre-computed display
 * strings — so the pages and the client controls stay db-free.
 *
 * Source switch: the snapshot cuts at exactly these four `cachedRead` SOURCE
 * reads (see `scripts/snapshot-shared.ts`) — everything above them (items,
 * counts, suggestions) is pure and runs unchanged at build time, where Home's
 * unified search index composes the compendium suggestions into a prerender.
 * At request time the sources lazy-import their live DB modules; this module
 * must never statically import `@/db` (the DB-free CI build depends on it).
 *
 * Everything is wrapped in React `cache()`: a category page reads its own items
 * AND the layout reads all-five counts in the same request; caching collapses
 * the shared builder calls (and the shared `getCharaktereRows` behind Characters
 * + Primarchs) to one DB fan-out per request.
 */
import "server-only";
import { cache } from "react";
import { cachedRead } from "@/lib/db-cache";
import {
  isBuildPhase,
  readSnapshotArtifact,
} from "@/lib/snapshot/build-data";
import type {
  CharaktereRow,
  PersonenRow,
  WeltenRow,
} from "./queries";
import { factionDot } from "@/lib/faction-colors";
import type { Alignment, FactionGuide } from "@/app/fraktionen/loader";
import { hasContent } from "@/app/fraktionen/filters";
import { loadEntity } from "@/lib/entity/loader";
import {
  buildEntitySuggestions,
  type EntitySuggestionSource,
  type Suggestion,
} from "@/app/archive/filters";
import { listAliasEntries, type AliasAxis } from "@/lib/aliases";
import type { CompendiumItem } from "./categories";
import {
  ALL_PRIMARCH_CHARACTER_IDS,
  CURATED_PRIMARCH_IDS,
  PRIMARCH_MERGES,
} from "./primarchs";

/**
 * A world earns a place only once the archive returns to it. With ~2400
 * location rows, the long tail is single-mention scenery — requiring 2+
 * appearances (books + podcast episodes, counted off `work_locations`) keeps
 * the directory to worlds the stories actually orbit without opening the
 * single-mention scenery tail.
 */
export const WORLD_MENTION_THRESHOLD = 2;

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

// Source switches (Launch S1b): build → committed snapshot artifact
// (fail-closed), request time → lazy import of the live DB module. The switch
// sits UNDER `cachedRead`, so the caching contract is unchanged either way.
async function factionGuideSource(): Promise<FactionGuide[]> {
  if (isBuildPhase()) return readSnapshotArtifact<FactionGuide[]>("factionGuide");
  const { loadFactionGuide } = await import("@/app/fraktionen/loader");
  return loadFactionGuide();
}
async function charaktereSource(): Promise<CharaktereRow[]> {
  if (isBuildPhase()) return readSnapshotArtifact<CharaktereRow[]>("charaktereRows");
  const { getCharaktereRows } = await import("./queries");
  return getCharaktereRows();
}
async function weltenSource(): Promise<WeltenRow[]> {
  if (isBuildPhase()) return readSnapshotArtifact<WeltenRow[]>("weltenRows");
  const { getWeltenRows } = await import("./queries");
  return getWeltenRows();
}
async function personenSource(): Promise<PersonenRow[]> {
  if (isBuildPhase()) return readSnapshotArtifact<PersonenRow[]>("personenRows");
  const { getPersonenRows } = await import("./queries");
  return getPersonenRows();
}

// Cached source rows (shared ACROSS requests + within one request).
// `cachedRead` wraps each source loader in Next's persistent Data Cache
// (`unstable_cache`, shared across requests and serverless instances) plus a
// React `cache()` for per-request dedup. The first request per TTL window does
// the real read; every concurrent visitor is served from cache, so the ~7
// queries this surface fans out no longer multiply by visitor-count and never
// swamp the `max:5` pool. The four reads always return non-empty data in normal
// operation (the archive always has factions, characters, worlds and authors),
// so an empty result means the read failed → `isDegraded` keeps it out of the
// cache. See `src/lib/db-cache.ts` for the full rationale.
const cachedFactionGuide = cachedRead(factionGuideSource, ["compendium", "faction-guide"], {
  tags: ["compendium", "factions"],
  isDegraded: (rows) => rows.length === 0,
});
const cachedCharaktere = cachedRead(charaktereSource, ["compendium", "charaktere-rows"], {
  tags: ["compendium", "characters"],
  isDegraded: (rows) => rows.length === 0,
});
const cachedWelten = cachedRead(weltenSource, ["compendium", "welten-rows"], {
  tags: ["compendium", "worlds"],
  isDegraded: (rows) => rows.length === 0,
});
const cachedPersonen = cachedRead(personenSource, ["compendium", "personen-rows"], {
  tags: ["compendium", "authors"],
  isDegraded: (rows) => rows.length === 0,
});

// Per-category builders

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
  const primarchs = new Set(ALL_PRIMARCH_CHARACTER_IDS);
  // A character earns a row when it actually appears in a work; primarchs are
  // hoisted into their own category, so they're excluded here (no double-listing).
  // The exclusion set covers absorbed twins too (e.g. Omegon), so a merged
  // primarch never leaks back into the broad Characters deck.
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
  // Resolved in PARALLEL: a sequential for-loop would make
  // the builder's latency scale linearly with the number of merged entries'
  // `loadEntity` fan-outs. Today only one id is merged, but the shape must not
  // become a serial query cascade as merges grow. `Promise.all` keeps order;
  // each entity fan-out is at most 4 queries, deduped per request via `cache()`.
  const items = await Promise.all(
    ids.map(async (id): Promise<CompendiumItem | null> => {
      const c = byId.get(id);
      if (!c) {
        // A curated id that no longer resolves is a data error, not a silent drop.
        console.error(
          `[/compendium/primarchen] curated primarch id "${id}" not found in characters — dropping.`,
        );
        return null;
      }
      const merge = PRIMARCH_MERGES[id];
      let name = c.name;
      let workCount = c.workCount;
      if (merge) {
        name = merge.name;
        // Honest union count = exactly the works the merged detail page lists
        // (deduped across the twins). Reuse the cached entity loader so the card's
        // "N appearances" can never drift from the page it links to. On a failed
        // read the cheap aggregate (canonical twin only) is the graceful fallback.
        const view = await loadEntity("character", id);
        if (view) {
          workCount = view.worksByKind.reduce((n, g) => n + g.works.length, 0);
        }
      }
      return {
        id: c.id,
        name,
        href: `/charakter/${c.id}`,
        kicker: c.primaryFactionName,
        meta: workCount > 0 ? plural(workCount, "appearance") : null,
        dotColor: c.primaryFactionName ? factionDot(c.primaryFactionName) : null,
        glyph: null,
        facet: null,
        groupKey: null,
        groupLabel: null,
        weight: workCount,
      };
    }),
  );
  return items.filter((it): it is CompendiumItem => it !== null);
});

/**
 * Primarch typeahead entries for the universal search (Home / /podcasts / /werke).
 * Deliberately CHEAP — it reuses the already-cached character rows (same
 * `cachedCharaktere` the directory builds on) and only needs id + label + a
 * faction hint, so it does NOT call `loadEntity` (the per-entity work-union the
 * directory cards need for their counts). Merged twins surface under their
 * combined name with the canonical id as `value` ("Alpharius Omegon" → `alpharius`),
 * and "Alpharius Omegon" contains "omegon", so a search for "omegon" still hits
 * the merged entry. A pick routes via `primarchFocusHref` to the Compendium
 * primarch directory with the overlay popped open.
 */
export const loadPrimarchSuggestions = cache(async (): Promise<Suggestion[]> => {
  const ids = CURATED_PRIMARCH_IDS;
  if (ids.length === 0) return [];
  const rows = await cachedCharaktere();
  const byId = new Map(rows.map((c) => [c.id, c]));
  const out: Suggestion[] = [];
  for (const id of ids) {
    const c = byId.get(id);
    if (!c) continue; // a missing id is reported by loadPrimarchItems; stay quiet here
    const merge = PRIMARCH_MERGES[id];
    out.push({
      kind: "primarch",
      label: merge ? merge.name : c.name,
      value: id,
      hint: c.primaryFactionName,
    });
  }
  return out;
});

function itemSearchHint(item: CompendiumItem): string | null {
  const parts = [item.kicker, item.meta].filter((v): v is string => Boolean(v));
  return parts.length > 0 ? parts.join(" · ") : null;
}

function aliasesByCanonicalId(axis: AliasAxis): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const entry of listAliasEntries(axis)) {
    const bucket = out.get(entry.canonicalId);
    if (bucket) bucket.push(entry.surfaceForm);
    else out.set(entry.canonicalId, [entry.surfaceForm]);
  }
  return out;
}

function entitySource(
  kind: EntitySuggestionSource["kind"],
  item: CompendiumItem,
  aliases: ReadonlyMap<string, readonly string[]>,
): EntitySuggestionSource {
  return {
    kind,
    label: item.name,
    value: item.id,
    hint: itemSearchHint(item),
    aliases: aliases.get(item.id) ?? [],
  };
}

/**
 * Faction / character / world suggestions for the universal search. This uses
 * the same visible rows as the Compendium directories, so counts, focus targets
 * and the search dropdown cannot drift apart. Alias rows are display-only
 * surfaces (`Alias → Canonical`) that still commit the canonical id.
 */
export const loadCompendiumSearchSuggestions = cache(
  async (): Promise<Suggestion[]> => {
    const [factions, characters, worlds] = await Promise.all([
      loadFactionItems(),
      loadCharacterItems(),
      loadWorldItems(),
    ]);

    const factionAliases = aliasesByCanonicalId("faction");
    const characterAliases = aliasesByCanonicalId("character");
    const locationAliases = aliasesByCanonicalId("location");

    return buildEntitySuggestions([
      ...factions.map((item) => entitySource("faction", item, factionAliases)),
      ...characters.map((item) => entitySource("character", item, characterAliases)),
      ...worlds.map((item) => entitySource("world", item, locationAliases)),
    ]);
  },
);

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
