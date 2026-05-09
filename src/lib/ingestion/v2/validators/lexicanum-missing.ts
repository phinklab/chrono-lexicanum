/**
 * Validator 5 — `lexicanum_missing`.
 *
 * Pure transparency signal. When the Lexicanum source-claim adapter found
 * NO matching article (no candidate URL or opensearch hit yielded a book
 * page), surface a single info-severity validation so the diff makes the
 * coverage gap explicit. Junctions for that book then come exclusively from
 * the LLM (Stage 3) — there is nothing to drop or correct.
 */
import type { DiscoveredBook, SourceClaim, Validation } from "../types";

export function validateLexicanumMissing(
  claims: SourceClaim[],
  _discovered: DiscoveredBook,
): Validation[] {
  void _discovered;
  if (claims.some((c) => c.source === "lexicanum")) return [];
  return [
    {
      field: "(coverage)",
      severity: "info",
      kind: "lexicanum_missing",
      evidence: [],
      reasoning:
        "no lexicanum article — junctions come from LLM only. No drop signal; explicit transparency entry.",
    },
  ];
}
