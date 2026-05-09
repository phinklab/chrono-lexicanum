/**
 * Validator 2 — `edition_isbn_conflict`.
 *
 * When Lexicanum and Open Library both supply `isbn13` and the values differ,
 * emit `severity: warn` with `suggested.action: use` and the lower-numerical
 * ISBN as the suggested value. ISBN-13 numerical sort is a reasonable proxy
 * for first-edition order: GS1 prefixes 978/979 partition by region, but
 * within a region/publisher block the lower numbers are typically issued
 * earlier.
 *
 * No-op when only one source supplies the field, or both supply identical
 * values.
 */
import type { DiscoveredBook, SourceClaim, Validation } from "../types";

export function validateEditionIsbnConflict(
  claims: SourceClaim[],
  _discovered: DiscoveredBook,
): Validation[] {
  void _discovered;
  const lex = claims.find((c) => c.source === "lexicanum")?.fields.isbn13;
  const ol = claims.find((c) => c.source === "open_library")?.fields.isbn13;
  if (!lex || !ol || lex === ol) return [];

  const evidence = [
    { source: "lexicanum", value: lex },
    { source: "open_library", value: ol },
  ];
  const lower = compareIsbn13(lex, ol) < 0 ? lex : ol;

  return [
    {
      field: "isbn13",
      severity: "warn",
      kind: "edition_isbn_conflict",
      evidence,
      suggested: { value: lower, action: "use" },
      reasoning: `lexicanum and open_library disagree on isbn13; suggesting the numerically lower ${lower} (first-edition heuristic).`,
    },
  ];
}

function compareIsbn13(a: string, b: string): number {
  // Compare as 13-digit strings; lexicographic === numerical for fixed-width
  // numerics.
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
