/**
 * Shared types for the bulk-backfill ingestion pipeline.
 *
 * The contract is field-by-field and source-priority-driven:
 *   1. Discovery yields a roster of `WikipediaBookEntry`.
 *   2. Each active `SourceCrawler` produces a `SourcePayload` per entry.
 *   3. The merge engine combines payloads into a `MergedBook` per
 *      `FIELD_PRIORITY`; conflicts surface in the run's `field_conflicts`.
 *   4. The comparator reads the DB and produces a `DiffFile`.
 */

// Sources

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
 * names; resolution to FK ids happens at apply time.
 */
/** Format classification. Mirror of the `bookFormat` pgEnum
 *  (src/db/schema.ts) — keep the two in sync.
 */
export type BookFormat =
  | "novel"
  | "novella"
  | "short_story"
  | "anthology"
  | "audio_drama"
  | "omnibus"
  | "collection"
  | "artbook"
  | "scriptbook";

/** Availability classification. Mirror of the `bookAvailability` pgEnum — keep the two in sync. */
export type BookAvailability =
  | "in_print"
  | "oop_recent"
  | "oop_legacy"
  | "unavailable";

export interface SourcePayloadFields {
  // works.*
  title?: string;
  releaseYear?: number;
  /** In-universe year, numeric DB form: M*1000 + year_within_M. */
  startY?: number;
  endY?: number;
  synopsis?: string;
  coverUrl?: string;

  // book_details.*
  seriesId?: string;
  seriesIndex?: number;
  isbn13?: string;
  isbn10?: string;
  pageCount?: number;
  format?: BookFormat;
  availability?: BookAvailability;
  // LLM-only: soft-facet classification + reader rating. The facet IDs land
  // in the diff; the work_facets junction insert happens at apply time.
  // Rating is normalized to a 0–5 scale; source is a service-id string from
  // the source-priority list.
  facetIds?: string[];
  rating?: number;
  ratingSource?: string;
  ratingCount?: number;

  // Junctions (raw names; FK resolution happens at apply time)
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

/** Generic crawler interface — every source implements this same shape. */
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

// Discovery + per-source payloads

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
 * Hardcover primarily supplies audit data (tags, rating). These land in the
 * `audit` slot, not in `fields` — they are not in FIELD_PRIORITY and are not
 * mapped to DB columns. Mapping tags to facets is the LLM step's job.
 *
 * `contributorNames` carries the full list of Hardcover-side contributors
 * (`hit.contributions[].author.name`). Surfaces in the LLM user-prompt as an
 * explicit "cross-check author_mismatch" hint for anthologies and
 * editor-attributed multi-author releases — the model is blind to this
 * without the explicit nudge.
 */
export interface HardcoverPayload extends SourcePayload {
  source: "hardcover";
  audit?: {
    tags?: string[];
    averageRating?: number;
    contributorNames?: string[];
  };
}

/**
 * LLM enrichment flags. Audit slots published by the LLM module for
 * plausibility cross-checks (`year_glitch`, `series_total_mismatch`,
 * `author_mismatch`, `data_conflict`), vocabulary compliance
 * (`value_outside_vocabulary`, `proposed_new_facet`), tool-use trajectory
 * (`insufficient_web_search`), and coverage gaps (`no_storefronts_found`,
 * `no_rating_found`).
 */
export type LLMFlagKind =
  | "data_conflict"
  | "value_outside_vocabulary"
  | "series_total_mismatch"
  | "author_mismatch"
  | "year_glitch"
  | "proposed_new_facet"
  | "insufficient_web_search"
  | "no_storefronts_found"
  | "no_rating_found";

export interface LLMFlag {
  kind: LLMFlagKind;
  field?: string;
  current?: unknown;
  suggestion?: unknown;
  sources?: string[];
  reasoning?: string;
}

/**
 * Storefront link candidate — a side effect of the availability web-search
 * round in the LLM step. `serviceHint` should match a `services.json` ID
 * (`black_library`, `amazon`, `audible`, `kindle`, `apple_books`,
 * `warhammer_plus`); the apply step resolves it into the FK against
 * `services.id`.
 */
export interface DiscoveredLink {
  serviceHint: string;
  kind: "shop" | "audio" | "reference";
  url: string;
}

/**
 * LLM enrichment payload. The LLM job supplies `fields` (synopsis, format,
 * availability, facetIds, rating + ratingSource + ratingCount) plus `audit`
 * (plausibility flags, storefront URLs, token usage). The `audit` slot is
 * split in `processOne` — `discoveredLinks` + `facetIds` become per-book
 * anchors on AddedEntry/UpdatedEntry/SkippedManualEntry; `flags` +
 * `tokenUsage` aggregate onto the top-level DiffFile.
 */
export interface LLMPayload extends SourcePayload {
  source: "llm";
  audit?: {
    facetIds?: string[];
    flags?: LLMFlag[];
    discoveredLinks?: DiscoveredLink[];
    tokenUsage?: {
      input: number;
      output: number;
      webSearchCount: number;
    };
    /**
     * Model that produced this payload. Authoritative for cache-hits (= the
     * model that wrote the cache, not the current run's model). Surfaces in
     * `rawLlmPayload.model` per book for cross-model-comparison runs.
     */
    modelUsed?: string;
  };
}

// Merge engine output

export interface MergedBook {
  /** Pipeline-canonical slug = slugify(title), no id-suffix. */
  slug: string;
  /** sourceKind to write at apply time. Picked as the highest-priority
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

// Diff file (the JSON written to ingest/.last-run/)

export interface DiffFieldChange {
  old: unknown;
  new: unknown;
}

/**
 * Per-book audit anchor for apply-time FK resolution + junction inserts.
 * Attached to AddedEntry/UpdatedEntry/SkippedManualEntry when the LLM step
 * supplied `discoveredLinks` and/or `facetIds`. On SkippedManualEntry the
 * slot is pure visibility — the apply ignores it there (manual wins).
 */
export interface RawLlmPayload {
  /** Model that produced this entry (per-book, may differ from run-level
   *  `DiffFile.llmModel` when re-runs use a different model). */
  model?: string;
  facetIds?: string[];
  discoveredLinks?: DiscoveredLink[];
}

export interface AddedEntry {
  wikipediaTitle: string;
  slug: string;
  payload: MergedBook;
  /**
   * Audit-only: raw Hardcover tags + average rating, when Hardcover returned
   * a hit for this book. Not in FIELD_PRIORITY, not in DB columns — pure
   * visibility for the LLM mapping onto facets.
   *
   * `contributorNames` mirrors the same field on `HardcoverPayload.audit` so
   * the diff captures Hardcover's full contributor list (used for post-hoc
   * author-mismatch triage).
   */
  rawHardcoverPayload?: {
    tags?: string[];
    averageRating?: number;
    contributorNames?: string[];
  };
  /** Per-book audit anchor (FK-resolution input for the apply step). */
  rawLlmPayload?: RawLlmPayload;
}

export interface UpdatedEntry {
  slug: string;
  /** The actual DB slug (manual books carry an `-<id>` suffix). */
  dbSlug: string;
  diff: Record<string, DiffFieldChange>;
  /** Per-book audit anchor (FK-resolution input for the apply step). */
  rawLlmPayload?: RawLlmPayload;
}

export interface SkippedManualEntry {
  /** Pipeline slug (slugify(title), no suffix). */
  slug: string;
  /** Actual DB slug (with `-<id>` suffix on manual books). */
  dbSlug: string;
  /** Field changes that would have been applied if the book were not manual. */
  wouldBeDiff: Record<string, DiffFieldChange>;
  /**
   * Pure visibility: "the LLM would have discovered X, but manual wins".
   * The apply does not iterate over skipped_manual.
   */
  rawLlmPayload?: RawLlmPayload;
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
 * When the same book is found on the main list AND a sub-list (e.g.
 * "Horus Rising" in `List_of_Warhammer_40,000_novels` AND
 * `Horus_Heresy_(novels)`), it is deduplicated via `slugify(title)` —
 * sub-list fields win per field. This audit slot shows which sources
 * contributed to discovery per slug (not an error, just visibility).
 */
export interface DiscoveryDuplicateEntry {
  slug: string;
  sources: string[];
}

/**
 * Plausibility flag with a slug anchor. Top-level audit list in the diff
 * JSON, aggregated from the per-book `LLMPayload.audit.flags`.
 */
export interface DiffLLMFlag extends LLMFlag {
  slug: string;
}

/** Aggregated cost summary over the whole run. */
export interface LlmCostSummary {
  totalTokensIn: number;
  totalTokensOut: number;
  totalWebSearches: number;
  estUsdCost: number;
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
  /** Optional top-level audit; only emitted when non-empty. */
  discoveryDuplicates?: DiscoveryDuplicateEntry[];
  /** Model string of the LLM enrichment (e.g. "claude-sonnet-4-6"). */
  llmModel?: string;
  /** sha256[:12] of the prompt string + tool schema. Cache invalidator. */
  llmPromptVersion?: string;
  /** Aggregated plausibility flags per slug. */
  llm_flags?: DiffLLMFlag[];
  /** Cost + tool-call roll-up of the LLM step. */
  llmCostSummary?: LlmCostSummary;
}

// Resumable run state (persisted to ingest/.state/in-progress.json)

export interface RunState {
  runId: string;                          // ISO timestamp at start
  startedAt: string;
  discoveryPages: string[];
  discoveredRoster: WikipediaBookEntry[]; // cached to skip re-discovery on resume
  processedIndex: number;                 // -1 before the first entry is done
  partialDiff: DiffFile;                  // accumulated diff so far
  config: {
    limit?: number;
    /** 0-based start index into the discovery roster. Default 0
     *  (= start at the first book). Used for sliced re-runs. */
    offset?: number;
    slug?: string;
    sources: SourceName[];
  };
}
