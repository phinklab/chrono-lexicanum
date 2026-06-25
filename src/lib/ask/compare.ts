import type { AskRecommendation } from "./types";

export function compareNullableDesc(
  a: number | null | undefined,
  b: number | null | undefined,
): number {
  if (a == null && b != null) return 1;
  if (a != null && b == null) return -1;
  if (a != null && b != null && a !== b) return b - a;
  return 0;
}

/**
 * The single merit comparator shared by `recommend()`, the curation overlay and
 * the precompute matrix (Brief 164). Ordering: `score → rating → title → slug`.
 *
 * `releaseYear` was removed as a tie-breaker. It used to sit between `rating`
 * and `title` and broke score ties in favour of newer books — a recency proxy
 * that demoted older canonical classics (e.g. Eisenhorn: *Xenos*, 2001) under
 * equally-rated newer titles. `slug` is unique and stable, so it is the final,
 * deterministic discriminator: identical answers always yield identical order
 * across runs, and across the base ranking, the overlay tail and the matrix.
 */
export function compareByMerit(a: AskRecommendation, b: AskRecommendation): number {
  if (a.score !== b.score) return b.score - a.score;

  const rating = compareNullableDesc(a.rating, b.rating);
  if (rating !== 0) return rating;

  const title = a.title.localeCompare(b.title, "en");
  if (title !== 0) return title;

  return a.slug.localeCompare(b.slug, "en");
}
