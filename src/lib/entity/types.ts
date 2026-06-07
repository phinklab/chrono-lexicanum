/**
 * Entity-graph shared contract — Brief 109, Step 1 of the entity-graph arc.
 *
 * This module is the durable seam the rest of the arc imports:
 *   - Step 1 (this brief): the three reference pages (/charakter, /fraktion, /welt)
 *   - Step 2 (panel/overlay): mounts the same `EntityView` in an intercepting route
 *   - Step 3 (universal search): resolves a hit to `TYPE_TO_ROUTE[type] + id`
 *
 * Hard rule: **no JSX and no `@/db` import here.** Everything in this file is a
 * plain type or a pure string helper so it can be imported from a client panel
 * (Step 2) without dragging server-only code into the bundle. The server-only
 * data layer lives in `./loader`; the db-free view lives in
 * `@/components/entity/`.
 */

/** The reference entities that own a public detail route. */
export type EntityType = "character" | "faction" | "location" | "person";

/**
 * The shareable URL contract: entity type → route prefix. The `[slug]` segment
 * IS the canonical reference id (e.g. `thousand_sons`) — there is no slug column
 * or slugify step (Brief 109, "Out of scope"). Step 3's search imports this map
 * verbatim so a search hit and a cross-link resolve to the same href.
 */
export const TYPE_TO_ROUTE: Record<EntityType, string> = {
  character: "/charakter",
  faction: "/fraktion",
  location: "/welt",
  person: "/person",
};

/**
 * Back-link target: entity type → its inventory deck under /atlas. The hub's
 * "‹ Characters" breadcrumb points here (Brief 113, Phase A). The atlas decks
 * are admin-gated today (a non-admin gets a 404) — that is the accepted
 * behaviour; the breadcrumb still names the canonical list a maintainer owns.
 * `label` matches the deck's own label (English, like /buch and the eyebrows).
 */
export const TYPE_TO_ATLAS: Record<EntityType, { href: string; label: string }> =
  {
    character: { href: "/atlas/charaktere", label: "Characters" },
    faction: { href: "/atlas/fraktionen", label: "Factions" },
    location: { href: "/atlas/welten", label: "Worlds" },
    person: { href: "/atlas/personen", label: "Authors" },
  };

/**
 * `works.kind` → human label for the "related works" group headings. The
 * `?? kind` fallback in `kindLabel` means a new work kind never breaks
 * rendering — it just shows its raw enum value until a label is added here.
 * UI copy follows the /buch surface (English / Latin), not the German routes.
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

/** href for a cross-link / linked fact. Pure — safe in a client bundle. */
export function entityHref(ref: EntityRef): string {
  return `${TYPE_TO_ROUTE[ref.type]}/${encodeURIComponent(ref.id)}`;
}

/**
 * One related work. The loader resolves `href` per kind so the view stays dumb:
 * a book links to /buch/[slug], a podcast show to /podcasts/[slug], a podcast
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
 * in `<main>`, the Step-2 panel wraps it in an overlay — both feed this exact
 * object to the same `<EntityView>`.
 */
export type EntityView = {
  type: EntityType;
  id: string;
  name: string;
  /** Short tagline under the title (allegiance / sector / tone). */
  oneLine?: string;
  facts: FactRow[];
  /** Free-text chips (location `tags`); omitted when empty. */
  tags?: string[];
  worksByKind: WorkGroup[];
  crossLinks: CrossLinkGroup[];
};
