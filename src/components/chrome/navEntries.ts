/**
 * navEntries — the ONE source of the primary-navigation IA, shared by the
 * desktop rail (SiteNav) and the burger overlay (SiteMenu).
 *
 * Structure decided Session 255 (research-backed: NN/g — visible beats
 * hidden, so the set stays FLAT; grouping is purely visual): three groups,
 * Cartographer leading the whole nav as the site's USP, never bundled away.
 * The `sub` glosses are the NN/g mitigation for branded labels — a quiet
 * descriptive line under each in-universe name.
 *
 * Home is NOT listed here: the rail omits it by design (BrandBeacon is the
 * way back; Philipp, Session 251), the burger overlay prepends it.
 */

export type NavEntry = {
  label: string;
  /** Descriptive sublabel/gloss shown under the branded label. */
  sub: string;
  href: string;
};

export type NavGroup = {
  /** Quiet group label — worn by the burger overlay; the rail separates
   *  groups with bare hairlines instead. */
  name: string;
  entries: readonly NavEntry[];
};

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    name: "Explore",
    entries: [
      { label: "Cartographer", sub: "The galaxy map", href: "/map" },
      { label: "Chronicle", sub: "The timeline", href: "/timeline" },
      { label: "Status Imperialis", sub: "When is now?", href: "/now" },
    ],
  },
  {
    name: "The Library",
    entries: [
      { label: "Archive", sub: "The catalogue", href: "/archive" },
      { label: "Compendium", sub: "Browse by topic", href: "/compendium" },
    ],
  },
  {
    name: "Services",
    entries: [
      { label: "Curator", sub: "Find your next book", href: "/ask" },
      { label: "Librarium", sub: "The archive in numbers", href: "/statistics" },
    ],
  },
];

/** Roman registry numerals — numbering runs THROUGH the groups. */
export const ROMAN = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
] as const;
