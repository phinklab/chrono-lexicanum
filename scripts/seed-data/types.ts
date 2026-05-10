/**
 * Roster types — exported by the SSOT loader (`scripts/import-ssot-roster.ts`)
 * and consumed by the Brief-058+ pipeline that reads `book-roster.json`
 * straight into the V2 batch-runner (skipping Wikipedia/TLBranson Discovery).
 *
 * Shape contract — all keys ALWAYS PRESENT. Missing scalar values are `null`,
 * missing collections are `[]`. Consumer code never has to do
 * `book.foo ?? defaultFoo`.
 *
 * Brief 057 (2026-05-10): the brief's acceptance bullet lists nine fields on
 * `RosterBook`; this implementation extends with `editors` + `editorialNote`
 * to preserve information lost when the loader strips `(ed.)` trailing or
 * collapses `"Various Authors"` to an empty author list. Both extensions are
 * documented in the impl-report's "Decisions I made" section.
 */

import type { bookFormat } from "@/db/schema";

/** DB enum values for `book_format` after the 0008 migration. */
export type BookFormat = (typeof bookFormat.enumValues)[number];

/** A single book entry in `book-roster.json`. */
export interface RosterBook {
  /** Stable Maintainer-Excel ID, e.g. `"W40K-0001"`, `"HH-0042"`. */
  externalBookId: string;
  /** URL slug — deterministic from title, with section-disambiguation on collision. */
  slug: string;
  /** Display title. */
  title: string;
  /**
   * Resolved author names. Empty `[]` for collective entries
   * (`editorialNote === "various"`).
   */
  authors: string[];
  /**
   * Resolved editor names — populated when the source cell carried an
   * `(ed.)` / `(eds.)` trailing marker. Empty `[]` otherwise.
   */
  editors: string[];
  /**
   * `"various"` for `"Various Authors"`-style sentinels in the source cell;
   * `null` otherwise. The downstream Author-Resolver should NOT create a
   * pseudo-person for `"various"` — it's a sentinel, not a name.
   */
  editorialNote: "various" | null;
  /**
   * Real-world publication year. The validator rejects rows where this is
   * missing/non-numeric, so it should always be a positive integer in
   * practice — but the type allows `null` to keep the JSON shape uniform
   * across the (rare) future case where the constraint is loosened.
   */
  releaseYear: number | null;
  /** Normalized DB-enum format value. */
  format: BookFormat;
  /**
   * Raw `Section / Series` cell from the Excel, e.g.
   * `"Inquisitor (Eisenhorn/Ravenor/Bequin)"`. The Series-Resolver
   * (Brief ~063) maps this to a canonical `series.id`.
   */
  seriesHint: string | null;
  /** Raw `Source URL` cell from the Excel, typically a Lexicanum link. */
  sourceUrl: string | null;
  /**
   * Raw `Relation Notes` cell — Maintainer-curated free text used for
   * collection-membership commentary etc. Lands in `book_details.notes`.
   */
  notes: string | null;
  /** 1-based Excel row number (header is row 1, first data row is 2). */
  sourceRow: number;
}

/** A single edge in `book-roster.json`'s `collections` array. */
export interface RosterCollection {
  /** Excel ID of the contained work. */
  contentExternalId: string;
  /** Excel ID of the containing collection (anthology/omnibus). */
  collectionExternalId: string;
  /**
   * 0-based position of the content within the collection. Derived from the
   * parent's `Collects Titles` semicolon-list when the parent's Books-row
   * carries one. Default `0` otherwise — the frontend falls back to
   * release-year sort for ties.
   */
  displayOrder: number;
  /**
   * Excel `Confidence` for the link, range 0.00–1.00 (validator-enforced).
   * Sanitised via `Math.round(x * 100) / 100` to avoid float-drift breaking
   * re-run determinism.
   */
  confidence: number | null;
  /**
   * Excel `Basis` cell — short prose justification for the link, e.g.
   * `"Explicit Eisenhorn omnibus follows the trilogy in TLBranson"`.
   */
  basis: string | null;
}

/** Top-level shape of `scripts/seed-data/book-roster.json`. */
export interface RosterFile {
  /** Bumped when the consumer-facing schema changes incompatibly. */
  schemaVersion: "1.0";
  /** Excel file name relative to `scripts/seed-data/source/`. */
  sourceFile: "Warhammer_Books_SSOT.xlsx";
  /** Sorted lexicographically by `externalBookId` ascending. */
  books: RosterBook[];
  /** Sorted lexicographically by `(contentExternalId, collectionExternalId)`. */
  collections: RosterCollection[];
}
