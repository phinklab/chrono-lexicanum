/**
 * Per-field source-priority for the multi-source merge engine.
 *
 * For each field, the merge engine walks the listed sources in order and
 * uses the first non-undefined value. An empty list means: no source is
 * active for this field in the current phase (placeholder for 3c).
 *
 * Phase 3a: Wikipedia (discovery + per-book payload aus discovery-entry)
 *           + Lexicanum (per-book article).
 * Phase 3b: + Open Library (cover, ISBN-13/10, page count, format-Heuristik,
 *             author-Lückenfüller). LLM steht in der Liste für Felder die in
 *             3c primär klassifiziert werden — `mergeBookFromSources` springt
 *             beim leeren Lookup automatisch zur nächsten Quelle.
 *           + Hardcover trägt NUR Audit-Slots (tags, averageRating) — nicht
 *             in FIELD_PRIORITY enthalten.
 */
import type { FieldName, SourceName } from "./types";

export const FIELD_PRIORITY: Record<FieldName, ReadonlyArray<SourceName>> = {
  // works.*
  title:         ["wikipedia", "lexicanum", "open_library"],
  releaseYear:   ["wikipedia", "lexicanum", "open_library"],
  startY:        ["lexicanum"],
  endY:          ["lexicanum"],
  synopsis:      [],                                    // 3c (LLM)
  coverUrl:      ["open_library"],                      // 3b

  // book_details.*
  seriesId:      ["wikipedia", "lexicanum"],
  seriesIndex:   ["wikipedia", "lexicanum"],
  isbn13:        ["open_library", "wikipedia"],         // 3b — OL bibliographisch-canonical
  isbn10:        ["open_library"],                      // 3b — OL only
  pageCount:     ["open_library"],                      // 3b
  format:        ["llm", "open_library"],               // 3c primary, 3b fallback
  availability:  ["llm", "open_library"],               // 3c primary, 3b fallback (Edition-History-Heuristik)

  // Junctions (raw names — FK resolution is downstream, post-3a)
  authorNames:   ["wikipedia", "lexicanum", "open_library"],  // 3b — OL füllt 25%-WP-Lücke
  factionNames:  ["lexicanum"],
  locationNames: ["lexicanum"],
  characterNames:["lexicanum"],
};
