/**
 * Per-source default confidence value written to `works.confidence` when
 * a book's primary source is this one.
 *
 * Manual entries (1.00) are sacrosanct. Wikipedia ranks above Lexicanum
 * because Wikipedia tends to have stricter editorial canon than fan-wikis.
 * Future sources fill in their own slots; the LLM gets the lowest rating
 * because its text is paraphrased, not authoritative.
 */
import type { SourceName } from "./types";

export const SOURCE_CONFIDENCE: Record<SourceName, number> = {
  manual:       1.00,
  wikipedia:    0.85,
  lexicanum:    0.70,
  open_library: 0.80,    // 3b
  hardcover:    0.65,    // 3b
  llm:          0.50,    // 3c
};
