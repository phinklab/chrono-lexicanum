/**
 * Compendium category contract — Brief 129 (Doorways). PURE: no `@/db`, no JSX,
 * so the client controls island and the server pages share one source of truth
 * for the five top-level categories of the entity directory.
 *
 * A category is a doorway into one reference table, rendered in the gold archive
 * "reader-language" of /werke and /podcasts (dense, scannable rows — not a card
 * wall). The slug is the URL segment (`/compendium/<slug>`), ASCII-German and
 * URL-stable; the entity rows behind it link to the canonical detail routes
 * (`/fraktion`, `/charakter`, `/welt`, `/person`) which soft-nav into the
 * Brief-113 overlay. The `href` of each row is resolved server-side in
 * `./loader`, so this module stays free of routing detail beyond the category
 * itself.
 */

/** A facet pill for a category that supports faceted narrowing (factions). */
export interface CompendiumFacet {
  id: string;
  label: string;
}

export interface CompendiumCategory {
  /** URL segment under /compendium — stable, ASCII, lower-case. */
  slug: string;
  /** Display label (English/Latin surface, like /buch). */
  label: string;
  /** `// LATIN · ROLE` eyebrow, matching the entity-hub header grammar. */
  eyebrow: string;
  /** A single decorative sigil glyph for the overview door (aria-hidden). */
  sigil: string;
  /** Singular noun for count copy ("12 factions" / "1 faction"). */
  noun: string;
  /** One-line reader-language description. */
  blurb: string;
  /** True when the directory groups its rows (factions → by alignment). */
  grouped: boolean;
  /** Facet pills, when the category narrows by a single facet axis. */
  facets?: ReadonlyArray<CompendiumFacet>;
  /** The URL/query key the facet pills write (e.g. "alignment"). */
  facetParam?: string;
  /** True when the data for this category isn't curated yet (Primarchs). The
   *  door + nav stay visible; the directory renders a graceful pending state. */
  pending?: boolean;
}

/** Faction alignment is both the group axis and the facet axis. */
export const ALIGNMENT_FACETS: ReadonlyArray<CompendiumFacet> = [
  { id: "imperium", label: "Imperium" },
  { id: "chaos", label: "Chaos" },
  { id: "xenos", label: "Xenos" },
  { id: "neutral", label: "Neutral" },
];

/**
 * The five doors, in display order. Order matters: it drives the nav and the
 * overview. Factions lead (the richest, most-linked entity); Primarchs follow
 * as the curated elite; then the broad Characters/Worlds/Authors decks.
 */
export const COMPENDIUM_CATEGORIES: ReadonlyArray<CompendiumCategory> = [
  {
    slug: "fraktionen",
    label: "Factions",
    eyebrow: "// FRACTIO · FACTION",
    sigil: "✠",
    noun: "faction",
    blurb:
      "Every faction is a doorway — the books, podcasts and people that carry its story.",
    grouped: true,
    facets: ALIGNMENT_FACETS,
    facetParam: "alignment",
  },
  {
    slug: "primarchen",
    label: "Primarchs",
    eyebrow: "// PRIMARCHA · PRIMARCH",
    sigil: "❂",
    noun: "primarch",
    blurb: "The twenty sons of the Emperor — the demigods who led the Legions.",
    grouped: false,
  },
  {
    slug: "charaktere",
    label: "Characters",
    eyebrow: "// PERSONA · CHARACTER",
    sigil: "✶",
    noun: "character",
    blurb:
      "The named who recur across the archive — points of view, protagonists and foils.",
    grouped: false,
  },
  {
    slug: "welten",
    label: "Worlds",
    eyebrow: "// MVNDVS · WORLD",
    sigil: "◉",
    noun: "world",
    blurb:
      "The worlds the stories return to, ranked by how often the archive visits them.",
    grouped: false,
  },
  {
    slug: "autoren",
    label: "Authors",
    eyebrow: "// AVCTOR · AUTHOR",
    sigil: "❡",
    noun: "author",
    blurb: "The writers behind the canon — every novel and story traced to its hand.",
    grouped: false,
  },
];

export function findCategory(slug: string): CompendiumCategory | undefined {
  return COMPENDIUM_CATEGORIES.find((c) => c.slug === slug);
}

/**
 * One row in a category directory. Built server-side (`./loader`) so it carries
 * a resolved `href` and pre-computed display strings — the view just renders it.
 */
export interface CompendiumItem {
  /** Reference id = the entity route's `[slug]` segment. */
  id: string;
  name: string;
  /** Canonical detail route (soft-nav opens the overlay). */
  href: string;
  /** Small mono label before the name (faction / sector / alignment). */
  kicker: string | null;
  /** Mono stat suffix ("12 books · 3 episodes" / "7 appearances"). */
  meta: string | null;
  /** Faction-colour dot, or null when the category has no colour axis. */
  dotColor: string | null;
  /** Short sigil glyph (faction badge), or null. */
  glyph: string | null;
  /** Facet value for narrowing (alignment); null when not faceted. */
  facet: string | null;
  /** Grouping key + its label (alignment); null when the category is flat. */
  groupKey: string | null;
  groupLabel: string | null;
  /** "Most covered" sort weight (appearances / books+episodes). */
  weight: number;
}
