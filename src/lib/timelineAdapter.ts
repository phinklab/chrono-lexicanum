/**
 * timelineAdapter — the single `work row → TimelineBook` shaping used by both
 * loaders in `src/app/timeline/page.tsx` (`loadTimeline` for the full ribbon +
 * accordion, `loadEraBooks` for the server-filtered zoom view). Extracted so
 * the two call sites can't drift (they were duplicated inline before this port)
 * and so adding a field — like `fmt` for the Chronicle marker shapes — happens
 * in exactly one place.
 *
 * The input is typed structurally against the fields the loaders' relational
 * queries actually select, so the Drizzle-inferred row (which carries extra
 * columns + relations) is assignable without a cast.
 */

import {
  eraIdForYear,
  normalizeFormat,
  type Era,
  type TimelineBook,
} from "@/lib/timeline";

/** The slice of a `db.query.works.findMany(...)` row this adapter reads. */
export interface TimelineWorkRow {
  id: string;
  slug: string;
  title: string;
  /** `numeric` columns arrive as strings from the postgres driver. */
  startY: string | number | null;
  endY: string | number | null;
  bookDetails: {
    seriesId: string | null;
    seriesIndex: number | null;
    primaryEraId: string | null;
    format: string | null;
  } | null;
  factions: ReadonlyArray<{ factionId: string }>;
  persons: ReadonlyArray<{ person: { name: string } }>;
}

/**
 * Reshape one relational work row into the `TimelineBook` the client consumes.
 *
 * Era membership for the Chronicle is derived from the book's real in-universe
 * setting date (`startY`) via `eraIdForYear` — the same data the ribbon pins
 * use — rather than the editorial `book_details.primary_era_id` anchor, which
 * in the current local catalogue is not yet curated (every row defaults to one
 * era, which would clump the whole ribbon into a single band). When `eras` is
 * omitted the anchor is used verbatim (so non-Chronicle callers are unchanged).
 */
export function mapWorkToTimelineBook(
  w: TimelineWorkRow,
  eras?: readonly Era[],
): TimelineBook {
  const seriesId = w.bookDetails?.seriesId ?? null;
  const startY = Number(w.startY ?? 0);
  const primaryEraId = eras
    ? eraIdForYear(startY, eras)
    : w.bookDetails?.primaryEraId ?? "";
  return {
    id: w.id,
    slug: w.slug,
    title: w.title,
    authors: w.persons.map((wp) => wp.person.name),
    startY,
    endY: Number(w.endY ?? 0),
    primaryEraId,
    factions: w.factions.map((f) => f.factionId),
    series: seriesId
      ? { id: seriesId, order: w.bookDetails?.seriesIndex ?? null }
      : null,
    fmt: normalizeFormat(w.bookDetails?.format) ?? "novel",
  };
}
