/**
 * Brief 133 / Board 122-B10 — weekly content-refresh detection types.
 *
 * Shared shapes for the additions-only refresh pass: book candidates parsed from
 * the Track of Words BL pre-order tracker, the diff verdicts against the committed
 * `book-roster.json`, the podcast-feed delta, and the maintainer-facing proposal.
 *
 * Pure types — NO DB/Drizzle import (detection never writes the DB). `BookFormat`
 * is type-only-imported so the `bookFormat` pgEnum value (and thus drizzle-orm) is
 * never loaded at runtime by the detection path.
 */
import type { BookFormat } from "../seed-data/types";

/** Provenance tag on every proposed row + per-source health note (Board 122 guardrail). */
export type RefreshSourceKind = "track_of_words" | "podcast_rss" | "podcast_youtube";

/** The two external-id series the roster uses. */
export type SeriesPrefix = "HH" | "W40K";

/** A book parsed from the upstream tracker, normalized for identity matching. */
export interface CandidateBook {
  title: string;
  /** Verbatim author cell from the sheet (audit). */
  authorsRaw: string;
  /** Split author display names; empty for a `various` anthology. */
  authors: string[];
  editorialNote: "various" | null;
  releaseYear: number | null;
  /** Best-effort `book_format` from the tracker `Type` column; null if unmappable. */
  format: BookFormat | null;
  /** Raw `Setting/series` cell — also drives the id-prefix guess. */
  seriesHint: string | null;
  /** Inferred external-id series prefix (Horus Heresy → HH, else W40K). */
  seriesPrefix: SeriesPrefix;
  /** `slugify(title)`. */
  titleSlug: string;
  /** `slugify(title) | authorKey | year` — the strict identity key. */
  identityKey: string;
}

/** Verdict for one candidate against the roster index. */
export type BookMatchVerdict =
  | { kind: "exact" }
  | { kind: "title-collision"; rosterId: string; rosterTitle: string }
  | { kind: "new" };

/**
 * A proposed roster-extension row: the `RosterBook` shape (minus the Excel-only
 * `sourceRow`) plus provenance. Copy-paste-ready into `book-roster.extension.json`.
 */
export interface ProposedRosterRow {
  externalBookId: string;
  slug: string;
  title: string;
  authors: string[];
  editors: string[];
  editorialNote: "various" | null;
  releaseYear: number | null;
  format: BookFormat;
  seriesHint: string | null;
  sourceUrl: string | null;
  notes: string | null;
  /** Board 122 guardrail: every proposed row carries provenance + confidence. */
  source_kind: RefreshSourceKind;
  confidence: number;
}

/**
 * A candidate that collides with an existing roster title — surfaced for human
 * review (omnibus / re-title / partial-author-match), never auto-proposed.
 */
export interface ReviewBook {
  title: string;
  authorsRaw: string;
  releaseYear: number | null;
  collidesWithId: string;
  collidesWithTitle: string;
}

/** Result of the book diff — fail-soft: `unreachable` carries a note + empty findings. */
export interface BookDiffResult {
  status: "ok" | "unreachable";
  sourceUrl: string;
  /** The CSV export URL actually fetched (null if discovery/fetch failed). */
  csvUrl: string | null;
  /** Human-readable reason when `status === "unreachable"` (or a soft warning). */
  note: string | null;
  /** Rows present upstream, absent from the roster — proposed additions. */
  newBooks: ProposedRosterRow[];
  /** externalBookIds of new rows whose `format` was defaulted (Type unmappable) — the report flags these. */
  formatDefaultedIds: string[];
  /** Title-collisions needing a human eye (NOT auto-proposed). */
  reviewBooks: ReviewBook[];
  /** Unique, in-scope, recent rows actually classified. */
  consideredRows: number;
  /** Rows skipped by the `sinceYear` floor (logged, never silently dropped). */
  skippedOlderRows: number;
  /** Rows skipped as out-of-scope settings (Age of Sigmar / Old World / setting-less separators). */
  skippedOutOfScopeRows: number;
  /** Rows skipped as intra-tracker duplicates of an already-seen book (multi-format/date listings). */
  skippedDuplicateRows: number;
}

/** A new episode in a feed not present in the committed artifact. */
export interface NewEpisode {
  guid: string;
  title: string;
  pubDate: string | null;
  link: string | null;
}

/** Per-show podcast diff outcome. `skipped` = youtube without an API key. */
export interface PodcastShowDiff {
  slug: string;
  title: string;
  source: "rss" | "youtube";
  status: "ok" | "failed" | "skipped";
  note: string | null;
  /** The floor ISO date actually used for this show — its curation cursor, or the baseline when never reviewed. */
  floorIso: string;
  committedCount: number;
  /** Total episodes fetched from the live feed (the full-feed scale, pre-floor). */
  freshCount: number;
  /** New episodes (in the feed, not in the committed artifact) ON/AFTER the floor AND not title-excluded. */
  newEpisodes: NewEpisode[];
  /** Feed episodes published BEFORE the show's floor — never considered, only counted (the "old back-catalog" Philipp wants ignored). */
  skippedBeforeFloor: number;
  /** On/after-floor episodes dropped by the show's `excludeTitlePatterns` (e.g. Lorehammer "(Video)" twins) — counted, never silent. */
  skippedExcludedByTitle: number;
}

export interface PodcastDiffResult {
  shows: PodcastShowDiff[];
}

/**
 * The whole detection outcome — serialized to `proposal.json`. Deliberately
 * timestamp-free so a stable backlog produces byte-identical output week over
 * week (the rolling PR doesn't thrash). The run timestamp lives in the Markdown
 * report + PR body instead.
 */
export interface RefreshProposal {
  $generatedBy: string;
  isoWeek: string;
  books: BookDiffResult;
  podcasts: PodcastDiffResult;
  /** True when there is ≥1 new book or ≥1 new episode. Drives the PR/no-op decision. */
  hasFindings: boolean;
}
