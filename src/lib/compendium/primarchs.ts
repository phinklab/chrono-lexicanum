/**
 * Curated primarch roster. PURE: a hand-maintained list
 * of `characters.id`s that ARE primarchs, so the Compendium shows a Primarchs
 * category distinct from the broad Characters deck. Listing an id here does both
 * jobs at once (see `./loader`): it fills the Primarchs segment
 * (`loadPrimarchItems`) AND drops that character from the Characters deck
 * (`loadCharacterItems` skips these ids), so no primarch is double-listed.
 *
 * There is no `is_primarch` column in the schema, so this frontend constant is
 * the source of truth — a deliberate Product-strand curation, no DB change. It
 * lists the 18 Legion primarchs that own a character row; the II and XI ("lost")
 * primarchs were struck from canon and have no row. The Alpha Legion's twins,
 * Alpharius and Omegon, collapse into ONE merged entry ("Alpharius Omegon", see
 * `PRIMARCH_MERGES`) — so only `alpharius` is listed here and `omegon` is folded
 * into it. Ordered by Legion numeral for readability only — the directory
 * re-sorts by coverage / A–Z (`./filters`), so this order never reaches the
 * screen. If an `is_primarch` flag ever lands in the schema it supersedes this
 * list and nothing else in the Product strand changes. An id that doesn't
 * resolve to a character row is dropped with a loud `console.error` (see
 * `loadPrimarchItems`).
 */
export const CURATED_PRIMARCH_IDS: readonly string[] = [
  "lion_el_jonson", // I · Dark Angels
  "fulgrim", // III · Emperor's Children
  "perturabo", // IV · Iron Warriors
  "jaghatai_khan", // V · White Scars
  "leman_russ", // VI · Space Wolves
  "rogal_dorn", // VII · Imperial Fists
  "konrad_curze", // VIII · Night Lords
  "sanguinius", // IX · Blood Angels
  "ferrus_manus", // X · Iron Hands
  "angron", // XII · World Eaters
  "roboute_guilliman", // XIII · Ultramarines
  "mortarion", // XIV · Death Guard
  "magnus_the_red", // XV · Thousand Sons
  "horus", // XVI · Sons of Horus
  "lorgar", // XVII · Word Bearers
  "vulkan", // XVIII · Salamanders
  "corax", // XIX · Raven Guard
  "alpharius", // XX · Alpha Legion (merged with omegon → "Alpharius Omegon")
];

/**
 * Curated primarch merges: a canonical `characters.id` displays under a combined
 * name and absorbs sibling character ids into one Compendium entry + one detail
 * view. The Alpha Legion's primarchs Alpharius and Omegon are a single doorway —
 * the stories treat the twins as one identity, so the merged entry's appearances
 * (and its detail page) include every work featuring EITHER or BOTH. The
 * canonical id (the map key) is the one that stays in `CURATED_PRIMARCH_IDS` and
 * owns the `/character/<id>` route; the absorbed ids redirect to it.
 */
export const PRIMARCH_MERGES: Readonly<
  Record<string, { name: string; absorbs: readonly string[] }>
> = {
  alpharius: { name: "Alpharius Omegon", absorbs: ["omegon"] },
};

/** Character ids folded into another primarch's merged entry (never standalone). */
export const ABSORBED_PRIMARCH_IDS: readonly string[] = Object.values(
  PRIMARCH_MERGES,
).flatMap((m) => [...m.absorbs]);

/**
 * Every character id that IS a primarch — the curated canonical roster plus the
 * absorbed twins. Used to keep all primarchs (incl. absorbed ones) out of the
 * broad Characters deck, so no primarch is double-listed.
 */
export const ALL_PRIMARCH_CHARACTER_IDS: readonly string[] = [
  ...CURATED_PRIMARCH_IDS,
  ...ABSORBED_PRIMARCH_IDS,
];

/**
 * If `id` is a twin absorbed into a merged primarch, return the canonical id it
 * should resolve to (so `/character/<absorbed>` redirects to the merged page);
 * otherwise null.
 */
export function absorbedInto(id: string): string | null {
  for (const [canonicalId, m] of Object.entries(PRIMARCH_MERGES)) {
    if (m.absorbs.includes(id)) return canonicalId;
  }
  return null;
}
