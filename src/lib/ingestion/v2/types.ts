/**
 * Pipeline V2 — type definitions.
 *
 * V2's central data shape is the `BookV2Record`: per book, a map of
 * `FieldRecord<T>` (each field carries its own value+source+evidence+override
 * slot), plus a structured `validations[]` list, the raw `SourceClaim[]` for
 * audit, the raw LLM payload, and a per-book cost summary.
 *
 * `V2DiffFile` is the run-level wrapper; structured to ALSO satisfy the V1
 * dashboard's `DiffFile` shape (ranAt + 6 arrays + optional LLM-fields) so
 * `/ingest` and `/ingest/[runId]` render without dashboard-side edits. The
 * V1-shape compatibility is achieved via a synthesized `payload: MergedBook`
 * shim on every `BookV2Record` (mirrors the V2 fields back into the legacy
 * MergedBook form for the existing FieldOriginsTable to consume).
 */

import type { BookFormat, MergedBook, SourceName } from "../types";

// Stage 0 — Discovery

/** Discovery-source identifier shared by Wikipedia + TLBranson outputs, plus
 *  the `"ssot"` source that reads `scripts/seed-data/book-roster.json`
 *  in place of a crawl. */
export type DiscoverySource = "wikipedia" | "tlbranson" | "ssot";

/**
 * Single book emitted by a discovery module. Slug is canonical (slugify(title));
 * `releaseYearCandidates` carries every distinct year a discovery source
 * supplied (Validator 1 reads this for the year_outlier check at Stage 2).
 */
export interface DiscoveredBook {
  slug: string;
  title: string;
  releaseYear?: number;
  releaseYearCandidates?: number[];
  authorHint?: string;
  /** TLBranson: H3 section name. Wikipedia: section heading id. */
  seriesHint?: string;
  seriesIndex?: number;
  /** TLBranson "Best Entry Points" marker — fan-onboarding signal, not used
   *  for FK-resolution. */
  isEntryPoint?: boolean;
  /** Every page URL in which the book was discovered (one slug can show up in
   *  multiple list pages; dedup folds them here). */
  sourcePages: string[];
  /** Discovery sources that contributed (subset of `["wikipedia",
   *  "tlbranson"]`). Useful for the V2 diff's `discoverySource` audit slot. */
  discoverySources: DiscoverySource[];
}

/**
 * SSOT sidecar travelling alongside `DiscoveredBook` when the roster comes
 * from `scripts/seed-data/book-roster.json`. Carries the
 * maintainer-authoritative fields that the V2 pipeline must NOT overwrite
 * from Lexicanum / Open Library / LLM. `processBookV2(book, ssotContext?)`
 * threads it into Stage 2 (validator-skip), Stage 3 (prompt anchor), and
 * Stage 4 (field-pick override).
 */
export interface SsotBookContext {
  externalBookId: string;
  /** Maintainer-authoritative title — same value lives on `DiscoveredBook.title`,
   *  mirrored here so the SSOT context is a self-contained "authoritative
   *  fields" view for the LLM prompt and Stage-4 fold. */
  title: string;
  format: BookFormat;
  /** Full author list (DiscoveredBook only carries `authorHint` = first
   *  author). Empty `[]` when `editorialNote === "various"`. */
  authors: string[];
  /** Empty `[]` unless the source-cell carried an `(ed.)` marker. */
  editors: string[];
  editorialNote: "various" | null;
  /** Real-world publication year. `null` for the one Excel row that lacks it. */
  releaseYear: number | null;
  /** Raw "Section / Series" cell, e.g. `"Inquisitor (Eisenhorn/Ravenor/Bequin)"`. */
  seriesHint: string | null;
  notes: string | null;
  sourceRow: number;
}

/**
 * Return shape of `loadV2RosterSsot()` — mirrors the crawl-mode
 * `DiscoveryResult` (defined in `run-engine.ts`) so `run-batch` can branch on
 * the source without diverging downstream code. `ssotContexts` is keyed by
 * slug; `processBookV2` looks the sidecar up by `book.slug`.
 */
export interface SsotLoadResult {
  merged: DiscoveredBook[];
  ssotContexts: Map<string, SsotBookContext>;
  errors: { source: string; slug?: string; message: string }[];
  ssotSourceFile: string;
}

// Stage 1 — Source-Claims

export type ClaimSource = "lexicanum" | "open_library" | "hardcover";

export interface SourceClaimFields {
  title?: string;
  authorNames?: string[];
  /** Names found in an Editor / Editors infobox cell (V2 Lexicanum only). */
  editorNames?: string[];
  releaseYear?: number;
  isbn13?: string;
  isbn10?: string;
  pageCount?: number;
  coverUrl?: string;
  /** In-universe years from a structured infobox cell (V2 Lexicanum only —
   *  body-year regex was dropped). */
  startY?: number;
  endY?: number;
  publisher?: string;
  format?: BookFormat;
}

/**
 * One source's claim for one book. `notes[]` is the crawler's running
 * commentary used by validators (e.g. "pagecount_below_threshold" triggers
 * pagecount_outlier). `raw` carries the unprocessed payload for audit.
 */
export interface SourceClaim {
  source: ClaimSource;
  sourceUrl?: string;
  fetchedAt: string;
  fields: SourceClaimFields;
  raw?: unknown;
  notes: string[];
}

// Stage 2 — Validators

export type ValidationKind =
  | "year_outlier"
  | "edition_isbn_conflict"
  | "pagecount_outlier"
  | "author_editor_suspicion"
  | "lexicanum_missing";

export type ValidationSeverity = "info" | "warn" | "error";

export type ValidationAction = "use" | "drop" | "flag" | "defer_to_llm";

export interface Validation {
  field: string;
  severity: ValidationSeverity;
  kind: ValidationKind;
  evidence: { source: string; value: unknown }[];
  suggested?: { value?: unknown; action: ValidationAction };
  reasoning: string;
}

// Stage 3 — Slim LLM (typed payload returned by the V2 enricher)

export type EntityRole = string;

export interface RoleAnnotated {
  name: string;
  role: EntityRole;
}

export interface SlimLlmPayload {
  /** Synopsis written by the LLM (paraphrased, 100–150 words). */
  synopsis?: string;
  /** Format classification. Rating + availability are intentionally not
   *  part of V2. */
  format?: BookFormat;
  facetIds?: string[];
  factions?: RoleAnnotated[];
  characters?: RoleAnnotated[];
  locations?: RoleAnnotated[];
  /** Storefront/reference URLs the LLM happened to surface — kept for audit;
   *  V2 does no availability classification. */
  discoveredLinks?: { serviceHint: string; kind: string; url: string }[];
  flags?: { kind: string; field?: string; reasoning?: string }[];
  /** In-universe year hints from the LLM web-search; only used when Lexicanum
   *  did not supply startY/endY (default = leave null). */
  startY?: number;
  endY?: number;
  /** Raw model response audit. */
  audit: {
    modelUsed: string;
    tokenUsage: { input: number; output: number; webSearchCount: number };
  };
}

// Stage 4 — BookV2Record + V2DiffFile

/**
 * Per-field record. Each scalar lifted to value+provenance+override slot.
 * `source` distinguishes a raw source ("lexicanum"), the LLM ("llm"),
 * the validator that overrode a value ("validator-corrected"), or pure
 * discovery-side data ("discovery").
 */
export type FieldRecordSource =
  | ClaimSource
  | "discovery"
  | "llm"
  | "validator"
  | "validator-corrected"
  | "ssot";

export interface FieldRecord<T> {
  value: T;
  source: FieldRecordSource;
  fetchedAt: string;
  /** Human override slot — null until filled by a manual hand-check. */
  override: T | null;
  /** Set when `source === "validator-corrected"` to show the raw values that
   *  were rejected. */
  evidence?: { source: string; value: unknown }[];
}

/** Cost slot per book. Aggregated to the run-level `llmCostSummary`. */
export interface BookLlmCostSummary {
  tokensIn: number;
  tokensOut: number;
  webSearches: number;
  estUsdCost: number;
}

/**
 * Pipeline-V2 per-book record. `slug`, `fields`, `validations`, `rawClaims`,
 * `rawLlmPayload`, `llmCostSummary` are the core V2 fields; the
 * additional `wikipediaTitle`, `payload` (synthesized MergedBook) sit below
 * to keep the V1 `/ingest/[runId]` drill-down rendering without code
 * changes (it expects `entry.payload.fields`/`entry.payload.fieldOrigins`
 * etc.). The shim is computed in `diff-writer.ts` from the FieldRecord
 * values.
 */
export interface BookV2Record {
  slug: string;
  fields: BookV2Fields;
  validations: Validation[];
  rawClaims: SourceClaim[];
  rawLlmPayload: SlimLlmPayload | null;
  llmCostSummary: BookLlmCostSummary | null;
  /** Discovery source pages this book showed up in. */
  sourcePages: string[];
  // V1 dashboard compatibility shim
  /** Wikipedia-style display title; the dashboard uses this when
   *  `payload.fields.title` is absent. */
  wikipediaTitle: string;
  /** Synthesized V1 `MergedBook` mirror so the V1 drill-down renders without
   *  edits. Generated mechanically from `fields` — not authoritative. */
  payload: MergedBook;
}

export interface BookV2Fields {
  title: FieldRecord<string>;
  authorNames: FieldRecord<string[]>;
  releaseYear: FieldRecord<number | null>;
  seriesHint: FieldRecord<string | null>;
  seriesIndex: FieldRecord<number | null>;
  isEntryPoint: FieldRecord<boolean | null>;
  isbn13: FieldRecord<string | null>;
  isbn10: FieldRecord<string | null>;
  pageCount: FieldRecord<number | null>;
  coverUrl: FieldRecord<string | null>;
  format: FieldRecord<BookFormat | null>;
  startY: FieldRecord<number | null>;
  endY: FieldRecord<number | null>;
  synopsis: FieldRecord<string | null>;
  facetIds: FieldRecord<string[]>;
  factions: FieldRecord<RoleAnnotated[]>;
  locations: FieldRecord<RoleAnnotated[]>;
  characters: FieldRecord<RoleAnnotated[]>;
}

/** Run-level summary aggregated from per-book `BookV2Record.llmCostSummary`. */
export interface V2RunLlmCostSummary {
  totalTokensIn: number;
  totalTokensOut: number;
  totalWebSearches: number;
  estUsdCost: number;
}

/**
 * V2 diff-file shape. The first six fields (`ranAt`, `added`, `updated`,
 * `skipped_manual`, `skipped_unchanged`, `field_conflicts`, `errors`)
 * intentionally mirror V1's `DiffFile` so the existing `/ingest` dashboard
 * `isDiffFileLike` validator passes and the list-card + drill-down render.
 * V2-specific fields are additive (`pipeline`, `pilot`, `validationSummary`).
 */
export interface V2DiffFile {
  ranAt: string;
  pipeline: "v2";
  pilot: string;
  /** Both discovery sources used in the run — array, not a literal "wikipedia"
   *  string. The V1 dashboard reads this as opaque text via toSummary; the
   *  detail page joins it on `, ` so an array stringifies cleanly. */
  discoverySource: DiscoverySource[];
  discoveryPages: string[];
  activeSources: SourceName[];
  discovered: number;
  /** V2 records typed as AddedEntry-shape so the V1 dashboard component
   *  signature matches; the extra V2 fields ride along on the same object. */
  added: BookV2Record[];
  updated: never[];
  skipped_manual: never[];
  skipped_unchanged: never[];
  field_conflicts: never[];
  errors: { source: string; slug?: string; message: string }[];
  validationSummary: Record<ValidationKind, number>;
  llmModel: string;
  llmPromptVersion: string;
  llmCostSummary: V2RunLlmCostSummary;
}

// V1 dashboard compatibility note (no static type-check)
//
// `BookV2Record` is intentionally NOT a structural subtype of V1's
// `AddedEntry`. The V1 `rawLlmPayload?: RawLlmPayload` and V2's
// `rawLlmPayload: SlimLlmPayload | null` have divergent shapes, which
// TypeScript cannot reconcile in a single union.
//
// Runtime compatibility is preserved: the V1 dashboard reads
// `entry.payload.fields/fieldOrigins/primarySource/confidence/externalUrls`
// from the synthesized `payload: MergedBook` shim, and uses optional
// chaining on `entry.rawLlmPayload?.facetIds`/`?.discoveredLinks` — those
// resolve to undefined on V2 records (no render). `entry.rawHardcoverPayload`
// is absent on V2 records, optional in V1 — also no render.
//
// The single load-bearing constraint is that `V2DiffFile` matches V1
// `DiffFile`'s `isDiffFileLike` predicate (ranAt + 6 arrays). Verified by
// the file's typing — the six array fields are required.
