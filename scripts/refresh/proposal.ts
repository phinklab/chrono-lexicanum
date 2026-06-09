/**
 * Brief 133 — externalBookId allocation + roster-extension row projection.
 *
 * `makeIdAllocator` seeds from the live roster's per-prefix maxima, so a re-run
 * re-issues the SAME id for the same backlog (deterministic) and never collides
 * with a promoted book. `toProposedRow` projects a classified-new candidate into
 * the `book-roster.extension.json` row shape + provenance (Board 122 guardrail:
 * every proposed row carries `source_kind` + `confidence`).
 */
import { slugify } from "@/lib/slug";

import type { RosterFile } from "../seed-data/types";
import type { CandidateBook, ProposedRosterRow, SeriesPrefix } from "./types";

/** Hands out the next free `W40K-####` / `HH-####` id per series, collision-safe. */
export interface IdAllocator {
  next(prefix: SeriesPrefix): string;
}

const ID_PAD = 4;

/** Highest numeric suffix per prefix in the roster — the allocator seeds from here. */
function maxSuffixByPrefix(roster: RosterFile): Map<SeriesPrefix, number> {
  const max = new Map<SeriesPrefix, number>([
    ["HH", 0],
    ["W40K", 0],
  ]);
  for (const book of roster.books) {
    const m = book.externalBookId.match(/^(HH|W40K)-(\d+)$/);
    if (!m) continue;
    const prefix = m[1] as SeriesPrefix;
    const n = Number.parseInt(m[2], 10);
    if (n > (max.get(prefix) ?? 0)) max.set(prefix, n);
  }
  return max;
}

/**
 * Create an id allocator seeded from the roster's per-prefix maxima. `next()`
 * increments in-memory, so within one run ids never collide; across runs the
 * allocator re-seeds from the live roster, so the same backlog yields the same
 * ids week over week — the rolling PR doesn't thrash — and a promoted book's id
 * is never reissued (the next run seeds past it).
 */
export function makeIdAllocator(roster: RosterFile): IdAllocator {
  const counters = maxSuffixByPrefix(roster);
  return {
    next(prefix: SeriesPrefix): string {
      const n = (counters.get(prefix) ?? 0) + 1;
      counters.set(prefix, n);
      return `${prefix}-${String(n).padStart(ID_PAD, "0")}`;
    },
  };
}

/**
 * Project a classified-new candidate into a roster-extension row + provenance.
 * An unmappable tracker `Type` defaults to `"novel"` (the dominant format); the
 * maintainer corrects it at promotion (the report flags every defaulted format).
 */
export function toProposedRow(
  candidate: CandidateBook,
  allocator: IdAllocator,
  sourceUrl: string,
): ProposedRosterRow {
  return {
    externalBookId: allocator.next(candidate.seriesPrefix),
    slug: slugify(candidate.title),
    title: candidate.title,
    authors: candidate.authors,
    editors: [],
    editorialNote: candidate.editorialNote,
    releaseYear: candidate.releaseYear,
    format: candidate.format ?? "novel",
    seriesHint: candidate.seriesHint,
    sourceUrl,
    notes: null,
    source_kind: "track_of_words",
    confidence: 0.6,
  };
}
