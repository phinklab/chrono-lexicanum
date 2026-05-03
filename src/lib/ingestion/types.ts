/**
 * Shared types for the ingestion pipeline (Phase 3a — bulk-backfill skeleton).
 *
 * The contract is field-by-field and source-priority-driven:
 *   1. Discovery yields a roster of `WikipediaBookEntry`.
 *   2. Each active `SourceCrawler` produces a `SourcePayload` per entry.
 *   3. The merge engine combines payloads into a `MergedBook` per
 *      `FIELD_PRIORITY`; conflicts surface in the run's `field_conflicts`.
 *   4. The comparator reads the DB and produces a `DiffFile`.
 *
 * Phase 3a aktive Quellen: `wikipedia` (discovery only) + `lexicanum`.
 * 3b: open_library + hardcover. 3c: llm.
 */

// =============================================================================
// Sources
// =============================================================================

export type SourceName =
  | "manual"
  | "wikipedia"
  | "lexicanum"
  | "open_library"
  | "hardcover"
  | "llm";

/**
 * Flat record of fields a source can supply for one book. Each value is
 * `undefined` when the source did not provide that field.
 *
 * Junction-shaped fields (`authorNames`, `factionNames`, ...) carry raw
 * names; resolution to FK ids happens at apply time (Phase 3d).
 */
/** Phase 3b: Format-Klassifikation. Mirror der `bookFormat`-pgEnum. */
export type BookFormat =
  | "novel"
  | "novella"
  | "short_story"
  | "anthology"
  | "audio_drama"
  | "omnibus";

/** Phase 3b: Verfügbarkeits-Klassifikation. Mirror der `bookAvailability`-pgEnum. */
export type BookAvailability =
  | "in_print"
  | "oop_recent"
  | "oop_legacy"
  | "unavailable";

export interface SourcePayloadFields {
  // works.*
  title?: string;
  releaseYear?: number;
  /** In-universe year, numeric DB form: (M-1)*1000 + year_within_M. */
  startY?: number;
  endY?: number;
  synopsis?: string;
  coverUrl?: string;

  // book_details.*
  seriesId?: string;
  seriesIndex?: number;
  isbn13?: string;
  // Phase 3b additions:
  isbn10?: string;
  pageCount?: number;
  format?: BookFormat;
  availability?: BookAvailability;

  // Junctions (raw names; FK resolution is post-3a)
  authorNames?: string[];
  factionNames?: string[];
  locationNames?: string[];
  characterNames?: string[];
}

export type FieldName = keyof SourcePayloadFields;

/** Payload emitted by one SourceCrawler for one book. */
export interface SourcePayload {
  source: SourceName;
  /** External URL the data came from — surfaces in external_links at apply time. */
  sourceUrl?: string;
  fields: SourcePayloadFields;
}

/** Generic crawler interface. 3b/3c sources implement this same shape. */
export interface SourceCrawler<TPayload extends SourcePayload = SourcePayload> {
  name: SourceName;
  /**
   * Crawl one book. Returns `null` when no match was found (e.g., Lexicanum
   * has no article for that title). Throws only on infrastructure errors
   * (network, parse crash) so the caller can route the error into
   * `DiffFile.errors`.
   */
  crawl(entry: WikipediaBookEntry): Promise<TPayload | null>;
}

// =============================================================================
// Discovery + per-source payloads
// =============================================================================

export interface WikipediaBookEntry {
  /** Title as printed on the Wikipedia list page (italic-stripped, trimmed). */
  title: string;
  author?: string;
  /** Real-world publication year. */
  releaseYear?: number;
  /** Our-catalog series id when the section maps to one; otherwise undefined. */
  seriesId?: string;
  seriesIndex?: number;
  /** Wikipedia source page (URL). */
  sourcePage: string;
}

export interface LexicanumPayload extends SourcePayload {
  source: "lexicanum";
}

export interface WikipediaPayload extends SourcePayload {
  source: "wikipedia";
}

export interface OpenLibraryPayload extends SourcePayload {
  source: "open_library";
}

/**
 * Hardcover liefert primär Audit-Daten (tags, rating). Diese landen im
 * `audit`-Slot, nicht in `fields` — sie sind nicht in FIELD_PRIORITY und
 * werden nicht in DB-Spalten gemappt. Tags-zu-Facets-Mapping ist 3c LLM.
 */
export interface HardcoverPayload extends SourcePayload {
  source: "hardcover";
  audit?: {
    tags?: string[];
    averageRating?: number;
  };
}

// =============================================================================
// Merge engine output
// =============================================================================

export interface MergedBook {
  /** Pipeline-canonical slug = slugify(title), no id-suffix. */
  slug: string;
  /** sourceKind to write at apply time (3d). Picked as the highest-priority
   *  source that supplied the title field — stable, predictable. */
  primarySource: SourceName;
  /** Confidence written to works.confidence at apply time. */
  confidence: number;
  /** Final field values after priority-merge. */
  fields: SourcePayloadFields;
  /** Per-field origin source — useful for debugging the diff. */
  fieldOrigins: Partial<Record<FieldName, SourceName>>;
  /** Source-URLs gathered, one per source that contributed. Become
   *  external_links rows at apply time. */
  externalUrls: Array<{ source: SourceName; url: string }>;
}

export interface MergeFieldConflict {
  field: FieldName;
  sources: Array<{ source: SourceName; value: unknown }>;
}

// =============================================================================
// Diff file (the JSON written to ingest/.last-run/)
// =============================================================================

export interface DiffFieldChange {
  old: unknown;
  new: unknown;
}

export interface AddedEntry {
  wikipediaTitle: string;
  slug: string;
  payload: MergedBook;
  /**
   * Phase 3b audit-only: raw Hardcover-Tags + average rating, falls Hardcover
   * für dieses Buch einen Treffer geliefert hat. Nicht in FIELD_PRIORITY,
   * nicht in DB-Spalten — pure Sichtbarkeit für 3c LLM-Mapping auf Facets.
   */
  rawHardcoverPayload?: {
    tags?: string[];
    averageRating?: number;
  };
}

export interface UpdatedEntry {
  slug: string;
  /** The actual DB slug (manual books carry an `-<id>` suffix). */
  dbSlug: string;
  diff: Record<string, DiffFieldChange>;
}

export interface SkippedManualEntry {
  /** Pipeline slug (slugify(title), no suffix). */
  slug: string;
  /** Actual DB slug (with `-<id>` suffix on manual books). */
  dbSlug: string;
  /** Field changes that would have been applied if the book were not manual. */
  wouldBeDiff: Record<string, DiffFieldChange>;
}

export interface SkippedUnchangedEntry {
  slug: string;
  dbSlug: string;
}

export interface FieldConflictEntry {
  slug: string;
  field: string;
  sources: Array<{ source: SourceName; value: unknown }>;
}

export interface ErrorEntry {
  slug?: string;
  wikipediaTitle?: string;
  source: SourceName | "discovery";
  message: string;
}

/**
 * Phase 3b: wenn dasselbe Buch in Hauptliste UND Sub-Liste gefunden wird
 * (z.B. „Horus Rising" in `List_of_Warhammer_40,000_novels` UND
 * `Horus_Heresy_(novels)`), wird es per `slugify(title)` dedupliziert —
 * Sub-Liste-Felder gewinnen pro Feld. Dieser Audit-Slot zeigt welche Quellen
 * pro Slug zur Discovery beigetragen haben (kein Fehler, nur Sichtbarkeit).
 */
export interface DiscoveryDuplicateEntry {
  slug: string;
  sources: string[];
}

export interface DiffFile {
  ranAt: string;
  discoverySource: "wikipedia";
  discoveryPages: string[];
  activeSources: SourceName[];
  discovered: number;
  added: AddedEntry[];
  updated: UpdatedEntry[];
  skipped_manual: SkippedManualEntry[];
  skipped_unchanged: SkippedUnchangedEntry[];
  field_conflicts: FieldConflictEntry[];
  errors: ErrorEntry[];
  /** Phase 3b: optional Top-Level-Audit. Wird nur ausgegeben wenn nicht-leer. */
  discoveryDuplicates?: DiscoveryDuplicateEntry[];
}

// =============================================================================
// Resumable run state (persisted to ingest/.state/in-progress.json)
// =============================================================================

export interface RunState {
  runId: string;                          // ISO timestamp at start
  startedAt: string;
  discoveryPages: string[];
  discoveredRoster: WikipediaBookEntry[]; // cached to skip re-discovery on resume
  processedIndex: number;                 // -1 before the first entry is done
  partialDiff: DiffFile;                  // accumulated diff so far
  config: {
    limit?: number;
    slug?: string;
    sources: SourceName[];                // 3a: ["lexicanum"]
  };
}
