/**
 * Person-identity helpers for the seed/apply pipeline.
 *
 * Single source of truth for two callers that both turn a person's display
 * name into a stable `persons.id` slug + a NOT-NULL `persons.name_sort`:
 *
 *   - `scripts/apply-override.ts` — the SSOT/resolver apply path, which
 *     auto-creates author/editor persons and composes their `work_persons`
 *     rows.
 *   - `scripts/apply-audiobook-narrators.ts` — the audiobook-credit apply
 *     path (Brief 105), which auto-creates narrator/co_narrator/full_cast
 *     persons from `scripts/seed-data/audiobook-narrators.json`.
 *
 * Both MUST slugify identically: a person who both writes and narrates (e.g.
 * an author who also reads their own book) has to collapse to one
 * `persons.id`. These functions used to live in `apply-override.ts`, but that
 * module runs `main()` on import, so they were extracted here (mirroring the
 * Brief 077 extraction of `src/lib/seed/alignment.ts`). Bodies are unchanged.
 */

/**
 * Slugify a display name into a stable `persons.id`.
 *
 * Deterministic + idempotent. Verified to reproduce all 12 existing
 * persons.json IDs from their `name` fields ("Dan Abnett" → "dan_abnett",
 * "Aaron Dembski-Bowden" → "aaron_dembski_bowden", "Graham McNeill" →
 * "graham_mcneill", etc.). Edge cases: "C.S. Goto" → "c_s_goto",
 * "O'Brien" → "o_brien".
 */
export function slugifyPerson(displayName: string): string {
  // \p{Mn} = Unicode Nonspacing Mark — the combining diacritics produced by
  // NFKD decomposition ("ü" → "u" + U+0308). Stripping them yields ASCII.
  return displayName
    .normalize("NFKD")
    .replace(/\p{Mn}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Derive a Library-of-Congress style nameSort ("Lastname, Firstname rest").
 *   "Dan Abnett"           → "Abnett, Dan"
 *   "Aaron Dembski-Bowden" → "Dembski-Bowden, Aaron"
 *   "C.S. Goto"            → "Goto, C.S."
 *   "Anonymous"            → "Anonymous"   (single-token fallback)
 *
 * Single-token fallback returns the original string because the DB column
 * `persons.name_sort` is NOT NULL (src/db/schema.ts); brief 062 originally
 * suggested NULL, but the schema disallows it, so we keep the token verbatim.
 */
export function deriveNameSort(displayName: string): string {
  const trimmed = displayName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return trimmed;
  const last = parts[parts.length - 1];
  const rest = parts.slice(0, -1).join(" ");
  return `${last}, ${rest}`;
}
