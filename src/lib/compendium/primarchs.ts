/**
 * Curated primarch roster — Brief 129 (Doorways). PURE: a hand-maintained list
 * of `characters.id`s that ARE primarchs, so the Compendium can show a Primarchs
 * category distinct from the broad Characters deck.
 *
 * There is no `is_primarch` flag in the schema today, and the curation of which
 * character rows are primarchs is a Batches/data concern (Board 122), NOT a
 * Product-strand one — so this constant is the forward-compatible seam. It is
 * intentionally EMPTY right now: the Primarchs category stays visible and
 * renders a graceful "curation in progress" state until the roster is filled.
 *
 * When the data side is ready it replaces this constant (or supersedes it with
 * a generated JSON / a schema flag) — the loader reads only `CURATED_PRIMARCH_IDS`,
 * so nothing else in the Product strand changes. Ids that don't resolve to a
 * character row are dropped with a loud `console.error` (see `loadPrimarchItems`).
 */
export const CURATED_PRIMARCH_IDS: readonly string[] = [];
