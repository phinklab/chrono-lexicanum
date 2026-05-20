/**
 * hardcover-title-normalize.ts — pure title-normalization helper.
 *
 * Re-implemented for Brief 086 (Pass 2) from the Brief-085 helper; the 085
 * branch (PR #72) was closed without merge, so this is committed fresh — same
 * cleanup ruleset, one new field (`originalIfDifferent`).
 *
 * Sits between the roster title and the Hardcover `_eq` query (exact-match
 * only — no fuzzy / `_ilike`), feeding the variant-cascade in
 * `backfill-hardcover-rating.ts`:
 *
 *   Stage 1 (cleanup, always): strip trailing volume-range, Part markers,
 *   `(Legends)` suffix, `Vol.`/`Volume N`, and Omnibus variants (specific
 *   patterns before the generic ` Omnibus` tail — otherwise generic would eat
 *   substrings before specific gets a chance, e.g. "Ravenor: The Omnibus" must
 *   become "Ravenor", not "Ravenor: The"). Fixpoint-loop, max 8 passes.
 *
 *   Stages 2-3 (colon-fallbacks): if `primary` still contains a colon, prepare
 *   two fallbacks — drop-suffix-after-colon ("Belisarius Cawl: The Great Work"
 *   -> "Belisarius Cawl") and drop-prefix-before-colon (-> "The Great Work").
 *   Deduped against `primary` and each other.
 *
 *   Stage 4 (original, NEW in 086): the ungecleaned roster title itself, used
 *   only when cleanup changed it (`originalIfDifferent !== null`). Heals the
 *   handful of cleanup over-reaches where the Hardcover canonical title IS the
 *   omnibus/long form (Ravenor, the two Iron-Warriors omnibuses in Brief 085).
 *
 * Pure function: no FS, no DB, no Drizzle, no Anthropic SDK. All inputs and
 * outputs are strings. Sibling of `apply-override-skip.ts` (Brief 077),
 * `apply-override-location-skip.ts` (Brief 084) and
 * `hardcover-author-normalize.ts` (Brief 086).
 */

export interface NormalizedTitleVariants {
  /** cleanup-step output (Stage 1). */
  primary: string;
  /** colon-splits (Stages 2-3); empty when `primary` has no colon. */
  fallbacks: string[];
  /** raw roster title (trimmed) when cleanup changed it, else null (Stage 4). */
  originalIfDifferent: string | null;
}

export function normalizeForHardcover(rosterTitle: string): NormalizedTitleVariants {
  const trimmed = rosterTitle.trim();
  const primary = applyCleanup(rosterTitle);
  if (primary.length === 0) {
    throw new Error(
      `normalizeForHardcover: cleanup produced empty string for "${rosterTitle}"`,
    );
  }
  const fallbacks = primary.includes(":")
    ? dedupAgainst(primary, [dropAfterColon(primary), dropBeforeColon(primary)])
    : [];
  const originalIfDifferent = trimmed !== primary ? trimmed : null;
  return { primary, fallbacks, originalIfDifferent };
}

function applyCleanup(title: string): string {
  let prev = "";
  let curr = title.trim();
  for (let i = 0; i < 8; i++) {
    if (curr === prev) return curr;
    prev = curr;
    curr = curr.replace(/,\s*\d+\s*[-–—]\s*\d+\s*$/u, "").trim();
    curr = curr
      .replace(/\s+Part\s+(?:One|Two|Three|I{1,3}|1|2|3)\s*$/iu, "")
      .trim();
    curr = curr.replace(/\s*\(Legends\)\s*$/iu, "").trim();
    curr = curr.replace(/\s+(?:Vol\.?|Volume)\s+\d+\s*$/iu, "").trim();
    curr = stripOmnibusVariants(curr).trim();
  }
  if (curr !== prev) {
    throw new Error(
      `applyCleanup: no fixpoint after 8 passes for "${title}" (last="${curr}")`,
    );
  }
  return curr;
}

function stripOmnibusVariants(title: string): string {
  const patterns: RegExp[] = [
    /:\s*The\s+Complete\s+\S+\s+Omnibus\s*$/iu,
    /:\s*The\s+(?:First|Second|Third|Founding|Saint|Lost|Victory)\s+Omnibus\s*$/iu,
    /:\s*The\s+Omnibus\s*$/iu,
    /\s+Omnibus\s*$/iu,
  ];
  for (const re of patterns) {
    if (re.test(title)) return title.replace(re, "").trim();
  }
  return title;
}

function dropAfterColon(title: string): string {
  const idx = title.indexOf(":");
  if (idx === -1) return title;
  return title.substring(0, idx).trim();
}

function dropBeforeColon(title: string): string {
  const idx = title.indexOf(":");
  if (idx === -1) return title;
  return title.substring(idx + 1).trim();
}

function dedupAgainst(primary: string, candidates: string[]): string[] {
  const seen = new Set<string>([primary]);
  const result: string[] = [];
  for (const c of candidates) {
    if (c.length === 0) continue;
    if (seen.has(c)) continue;
    seen.add(c);
    result.push(c);
  }
  return result;
}
