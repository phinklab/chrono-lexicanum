/**
 * Entity-graph shared contract.
 *
 * This module is the durable seam the entity graph imports:
 *   - the reference pages (/character, /faction, /world)
 *   - the panel/overlay that mounts the same `EntityView` in an intercepting route
 *   - the universal search, which resolves a hit to `TYPE_TO_ROUTE[type] + id`
 *
 * Hard rule: **no JSX and no `@/db` import here.** Everything in this file is a
 * plain type or a pure string helper so it can be imported from a client panel
 * without dragging server-only code into the bundle. The server-only
 * data layer lives in `./loader`; the db-free view lives in
 * `@/components/entity/`.
 */

/** The reference entities that own a public detail route. */
export type EntityType = "character" | "faction" | "location" | "person";

/**
 * The shareable URL contract: entity type → route prefix. The `[slug]` segment
 * IS the canonical reference id (e.g. `thousand_sons`) — there is no slug column
 * or slugify step. The universal search imports this map
 * verbatim so a search hit and a cross-link resolve to the same href.
 */
export const TYPE_TO_ROUTE: Record<EntityType, string> = {
  character: "/character",
  faction: "/faction",
  location: "/world",
  person: "/person",
};

/**
 * Back-link target: entity type → its public directory under /compendium. The
 * hub's "‹ Characters" breadcrumb points here — the canonical public list. The
 * slugs are the compendium category slugs (`lib/compendium/categories.ts`);
 * `label` matches each category's own English label.
 */
export const TYPE_TO_COMPENDIUM: Record<EntityType, { href: string; label: string }> =
  {
    character: { href: "/compendium/characters", label: "Characters" },
    faction: { href: "/compendium/factions", label: "Factions" },
    location: { href: "/compendium/worlds", label: "Worlds" },
    person: { href: "/compendium/authors", label: "Authors" },
  };

/**
 * `works.kind` → human label for the "related works" group headings. The
 * `?? kind` fallback in `kindLabel` means a new work kind never breaks
 * rendering — it just shows its raw enum value until a label is added here.
 * UI copy follows the /book surface (English / Latin).
 */
export const KIND_LABELS: Record<string, string> = {
  book: "Books",
  podcast_episode: "Podcast episodes",
  podcast: "Podcasts",
  film: "Films",
  tv_series: "Series",
  channel: "Channels",
  video: "Videos",
};

export function kindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind;
}

/** A reference to another routable entity (renders as a real `<a>`). */
export type EntityRef = {
  type: EntityType;
  id: string;
  name: string;
};

/**
 * A curated one-or-two-sentence description of an entity. The
 * text lives in `scripts/seed-data/{faction,character,location}-blurbs.json` (a
 * thin curation layer, no DB column) and is resolved server-side in
 * the loader. This is a pure shape: the data module that reads the JSON is
 * `server-only` (`@/lib/blurbs`); only the resolved object reaches the view.
 */
export type Blurb = {
  /** The description sentence(s). */
  text: string;
  /** Curation confidence 0–1; a very low value renders more quietly. */
  confidence: number;
  /** Attribution URL (e.g. Lexicanum), shown as an optional subtle cite. */
  sourceUrl?: string;
};

/** href for a cross-link / linked fact. Pure — safe in a client bundle. */
export function entityHref(ref: EntityRef): string {
  return `${TYPE_TO_ROUTE[ref.type]}/${encodeURIComponent(ref.id)}`;
}

/**
 * One related work. The loader resolves `href` per kind so the view stays dumb:
 * a book links to /book/[slug], a podcast show to /archive/podcasts/[slug], a podcast
 * episode to its parent show (with `showTitle` for context); a kind with no
 * public surface arrives with `href === null` and renders inert.
 */
export type WorkRef = {
  slug: string;
  title: string;
  kind: string;
  releaseYear: number | null;
  coverUrl: string | null;
  /** Annotation suffix (e.g. "pov", "antagonist"); null when it is the
   *  type's default role — the loader nulls defaults so the view stays dumb. */
  role: string | null;
  /** Target route, or null when the kind has no public surface (inert card). */
  href?: string | null;
  /** Parent show title for a podcast episode — shown as context in the card. */
  showTitle?: string | null;
};

/**
 * A scalar attribute of the entity. `value` is either plain text (alignment,
 * sector name, coordinates) or a link to another routable entity. Sectors are
 * NOT routable (no /sektor route) → they arrive as plain strings, never refs.
 */
export type FactRow = {
  label: string;
  value: string | EntityRef;
};

/** Related works of one `kind`, already sorted (oldest first, then title). */
export type WorkGroup = {
  kind: string;
  label: string;
  works: WorkRef[];
};

/** A labelled set of graph edges to other entities (parent, children, …). */
export type CrossLinkGroup = {
  label: string;
  items: EntityRef[];
};

/**
 * The complete render payload for one entity. Frame-agnostic: the page wraps it
 * in `<main>`, the panel wraps it in an overlay — both feed this exact
 * object to the same `<EntityView>`.
 */
export type EntityView = {
  type: EntityType;
  id: string;
  name: string;
  /** Short tagline under the title (allegiance / sector / tone). */
  oneLine?: string;
  /** Curated description lead; omitted when none is curated. */
  blurb?: Blurb;
  facts: FactRow[];
  /** Free-text chips (location `tags`); omitted when empty. */
  tags?: string[];
  worksByKind: WorkGroup[];
  crossLinks: CrossLinkGroup[];
};
