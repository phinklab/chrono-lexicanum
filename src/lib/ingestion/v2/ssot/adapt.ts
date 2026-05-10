/**
 * SSOT adapter — RosterBook → DiscoveredBook + SsotBookContext (Brief 058).
 *
 * The V2 pipeline's Stage 1-4 code is unaware of the roster source. When the
 * roster comes from `scripts/seed-data/book-roster.json` (SSOT mode), this
 * adapter translates each `RosterBook` into the `DiscoveredBook` shape the
 * pipeline already consumes, plus a `SsotBookContext` sidecar that carries
 * the SSOT-fixed fields (format, editors, editorialNote, notes, externalBookId).
 *
 * The sidecar is threaded through `processBookV2(book, ssotContext?)` and
 * applied in Stage 4 (`foldIntoBookV2Record`) to override Lexicanum/OL/LLM
 * proposals for `title`, `authorNames`, `releaseYear`, `format`, `seriesHint`.
 */
import type { RosterBook } from "@/../scripts/seed-data/types";

import type { DiscoveredBook, SsotBookContext } from "../types";

export function rosterBookToDiscovered(rb: RosterBook): DiscoveredBook {
  return {
    slug: rb.slug,
    title: rb.title,
    // Author-hint is the first listed author — used by Lexicanum/OL search
    // disambiguation. The full author list is preserved via the SSOT sidecar
    // and applied by the Stage-4 fold-priority override.
    authorHint: rb.authors[0],
    // RosterBook.releaseYear is `number | null` (the one null in 859 books is
    // W40K-0307 "War for Armageddon Omnibus"). DiscoveredBook.releaseYear is
    // `number | undefined` — map null→undefined; downstream pickClaim then
    // falls through to Lexicanum/OL as usual for that row.
    releaseYear: rb.releaseYear ?? undefined,
    seriesHint: rb.seriesHint ?? undefined,
    // Excel has no per-book seriesIndex or isEntryPoint marker — discovery-only
    // signals from TLBranson. SSOT entries simply leave them unset.
    seriesIndex: undefined,
    isEntryPoint: undefined,
    sourcePages: rb.sourceUrl ? [rb.sourceUrl] : [],
    discoverySources: ["ssot"],
  };
}

export function rosterBookToSsotContext(rb: RosterBook): SsotBookContext {
  return {
    externalBookId: rb.externalBookId,
    title: rb.title,
    format: rb.format,
    authors: rb.authors,
    editors: rb.editors,
    editorialNote: rb.editorialNote,
    releaseYear: rb.releaseYear,
    seriesHint: rb.seriesHint,
    notes: rb.notes,
    sourceRow: rb.sourceRow,
  };
}
