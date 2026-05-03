/**
 * M-scale conversion between Warhammer-style year notation and the numeric
 * representation stored in the DB (`numeric(10,3)`).
 *
 * Formula:  numeric = (M - 1) * 1000 + year_within_M
 *
 *   "001.M31" → 30001
 *   "997.M30" → 29997
 *   "M41"     → 40000  (no year-within-M; defaults to 0)
 *   "M41.998" → 40998  (alt notation seen in some Lexicanum infoboxes)
 *
 * Lexicanum is inconsistent: some pages write "999.M30", some "M41.998",
 * some just "M41". This parser accepts all three forms and returns null on
 * anything it cannot confidently parse.
 */

const M_FIRST_RE = /^M(\d{1,2})(?:\.(\d{1,3}))?$/i;
const YEAR_FIRST_RE = /^(\d{1,3})\.M(\d{1,2})$/i;

/**
 * Parse a Lexicanum-style M-year string into the numeric DB representation.
 * Returns null if the input is empty, undefined, or unparseable.
 */
export function parseMScale(input: string | undefined | null): number | null {
  if (!input) return null;
  const s = input.trim();
  if (!s) return null;

  let yearWithinM = 0;
  let millennium = 0;

  const yearFirst = YEAR_FIRST_RE.exec(s);
  if (yearFirst) {
    yearWithinM = Number.parseInt(yearFirst[1], 10);
    millennium = Number.parseInt(yearFirst[2], 10);
  } else {
    const mFirst = M_FIRST_RE.exec(s);
    if (!mFirst) return null;
    millennium = Number.parseInt(mFirst[1], 10);
    yearWithinM = mFirst[2] ? Number.parseInt(mFirst[2], 10) : 0;
  }

  if (!Number.isFinite(millennium) || millennium < 1) return null;
  if (!Number.isFinite(yearWithinM) || yearWithinM < 0 || yearWithinM > 999)
    return null;

  return (millennium - 1) * 1000 + yearWithinM;
}

/**
 * Inverse of parseMScale. Returns the canonical "NNN.MNN" form (year-first)
 * because that is what Lexicanum uses most consistently.
 */
export function formatMScale(numeric: number): string {
  const millennium = Math.floor(numeric / 1000) + 1;
  const yearWithinM = Math.floor(numeric % 1000);
  const yearStr = String(yearWithinM).padStart(3, "0");
  return `${yearStr}.M${millennium}`;
}
