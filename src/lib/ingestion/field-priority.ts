/**
 * Per-field source-priority for the multi-source merge engine.
 *
 * For each field, the merge engine walks the listed sources in order and
 * uses the first non-undefined value. An empty list means: no source is
 * active for this field in the current phase (placeholder for 3b/3c).
 *
 * Phase 3a active sources: `wikipedia` (discovery + per-book Wikipedia
 * payload if we ever build a Wikipedia article-crawler) + `lexicanum`.
 */
import type { FieldName, SourceName } from "./types";

export const FIELD_PRIORITY: Record<FieldName, ReadonlyArray<SourceName>> = {
  // works.*
  title:         ["wikipedia", "lexicanum"],
  releaseYear:   ["wikipedia", "lexicanum"],
  startY:        ["lexicanum"],
  endY:          ["lexicanum"],
  synopsis:      [],                                    // 3c (LLM)
  coverUrl:      [],                                    // 3b (Open Library)

  // book_details.*
  seriesId:      ["wikipedia", "lexicanum"],
  seriesIndex:   ["wikipedia", "lexicanum"],
  isbn13:        [],                                    // 3b (Open Library / Wikipedia)

  // Junctions (raw names — FK resolution is downstream, post-3a)
  authorNames:   ["wikipedia", "lexicanum"],
  factionNames:  ["lexicanum"],
  locationNames: ["lexicanum"],
  characterNames:["lexicanum"],
};
