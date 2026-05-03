/**
 * Phase 3c — Reader-Rating-Source-Priority.
 *
 * Eine Rating-Quelle pro Buch nach dieser Reihenfolge. Der LLM nimmt die erste
 * Quelle aus seiner Web-Search bei der ein numerischer Score sichtbar ist.
 * Hardcover-Rating steht aus 3b schon als `audit.averageRating` zur Verfügung
 * (siehe `discoverHardcoverBook` in `src/lib/ingestion/hardcover/parse.ts`) —
 * der LLM nutzt diesen Wert wenn weder Amazon noch Goodreads ein Rating
 * liefern, ohne neue API-Call. Audible ist 4.-Fallback fast nur für reine
 * Audio-Drama-Releases relevant.
 *
 * Die Liste ist Append-only erweiterbar (z.B. `apple_books` später wenn
 * Coverage es rechtfertigt). Heute sind alle vier Listed-Sources 0–5; die
 * Normalisierungs-Konvention `(value / sourceMax) * 5` steht im System-Prompt
 * für zukünftige Quellen mit anderen Skalen.
 *
 * Diese Konstante wird in `prompt.ts` in den User-Prompt embedded — kein
 * Code-Pfad iteriert sie (der LLM macht die Source-Selektion).
 */
export const RATING_SOURCE_PRIORITY = [
  "amazon",
  "goodreads",
  "hardcover",
  "audible",
] as const;

export type RatingSourceId = (typeof RATING_SOURCE_PRIORITY)[number];
