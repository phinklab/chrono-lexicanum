/**
 * Curated primarch roster — Brief 129 (Doorways). PURE: a hand-maintained list
 * of `characters.id`s that ARE primarchs, so the Compendium shows a Primarchs
 * category distinct from the broad Characters deck. Listing an id here does both
 * jobs at once (see `./loader`): it fills the Primarchs segment
 * (`loadPrimarchItems`) AND drops that character from the Characters deck
 * (`loadCharacterItems` skips these ids), so no primarch is double-listed.
 *
 * There is no `is_primarch` column in the schema, so this frontend constant is
 * the source of truth — a deliberate Product-strand curation, no DB change. It
 * lists the 18 Legion primarchs plus Omegon (the Alpha Legion twin) = 19 rows;
 * the II and XI ("lost") primarchs were struck from canon and have no character
 * row. Ordered by Legion numeral for readability only — the directory re-sorts
 * by coverage / A–Z (`./filters`), so this order never reaches the screen. If an
 * `is_primarch` flag ever lands in the schema it supersedes this list and
 * nothing else in the Product strand changes. An id that doesn't resolve to a
 * character row is dropped with a loud `console.error` (see `loadPrimarchItems`).
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
  "alpharius", // XX · Alpha Legion
  "omegon", // XX · Alpha Legion (twin)
];
