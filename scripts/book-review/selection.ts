/**
 * selection.ts — Brief 154 (B11). The pilot's calibration slice is FIXED, not
 * "first N by roster order": exactly W40K-0001…W40K-0040 — the first four W40K
 * SSOT batches (Eisenhorn/Ravenor), every book carrying all three dimensions.
 *
 * Calibration bias (Brief 154 § "Pilot, nicht Voll-Lauf"): this slice is
 * Cowork-Opus ground truth and unusually clean, so the false-positive rate the
 * pilot measures is a LOWER BOUND — the report must not naively extrapolate it
 * to all 889 books.
 *
 * A review CHUNK (one finder+verifier subsession) is `REVIEW_CHUNK_SIZE` books
 * — distinct from an SSOT "batch" (a 10-book override file). 40 / 8 = 5 chunks,
 * each well under the ~120k token ceiling (Brief 154 § "Kontext-Disziplin").
 */

/** The four SSOT override files that hold W40K-0001…W40K-0040. */
export const PILOT_BATCHES = [
  "ssot-w40k-001",
  "ssot-w40k-002",
  "ssot-w40k-003",
  "ssot-w40k-004",
] as const;

/** The exact, ordered pilot book ids: W40K-0001 … W40K-0040. */
export const PILOT_BOOK_IDS: string[] = Array.from(
  { length: 40 },
  (_, i) => `W40K-${String(i + 1).padStart(4, "0")}`,
);

/** Books per finder/verifier subsession. Overridable via env for tuning. */
export const REVIEW_CHUNK_SIZE = Number(process.env.BOOK_REVIEW_CHUNK_SIZE ?? "8") || 8;

/** Split the ordered pilot ids into deterministic chunks of `REVIEW_CHUNK_SIZE`. */
export function chunkBookIds(
  ids: readonly string[] = PILOT_BOOK_IDS,
  size: number = REVIEW_CHUNK_SIZE,
): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += size) chunks.push([...ids.slice(i, i + size)]);
  return chunks;
}
