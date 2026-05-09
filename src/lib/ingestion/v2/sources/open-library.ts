/**
 * Pipeline V2 — Open Library source-claim adapter (Brief 054).
 *
 * V2 changes from V1's `open_library/parse.ts`:
 *
 *   1. New sanity-checks on `pageCount`. `< 30` → field NOT set, `notes`
 *      entry "pagecount_below_threshold". `> 1500` → field IS set with
 *      `notes` entry "pagecount_unusually_high". Validator 3 picks the notes
 *      up at Stage 2.
 *   2. The 047 hardenings (`language=eng` filter, RELEASE_YEAR_DRIFT_THRESHOLD)
 *      stay live — they sit on the V1 fetch transport, which V2 reuses.
 *
 * Hardcover author-mismatch policy moved to `hardcover.ts` (silent-skip).
 */
import {
  searchOpenLibrary,
  coverIdToUrl,
  workKeyToUrl,
  type OpenLibraryDoc,
} from "../../open_library/fetch";
import type { SourceClaim, SourceClaimFields } from "../types";

const RELEASE_YEAR_DRIFT_THRESHOLD = 3;
const PAGE_COUNT_LOWER_THRESHOLD = 30;
const PAGE_COUNT_UPPER_THRESHOLD = 1500;

export interface OpenLibraryDiscoveryV2Result {
  result: { claim: SourceClaim } | null;
  reason?: string;
  authorMismatch?: boolean;
}

export async function discoverOpenLibraryClaimV2(
  title: string,
  expectedAuthor?: string,
  expectedYear?: number,
): Promise<OpenLibraryDiscoveryV2Result> {
  let response;
  try {
    response = await searchOpenLibrary(title, expectedAuthor, 5);
  } catch (e) {
    return {
      result: null,
      reason: e instanceof Error ? e.message : String(e),
    };
  }

  if (response.numFound === 0 || response.docs.length === 0) {
    return { result: null };
  }

  const expected = expectedAuthor?.trim().toLowerCase();
  const matched = expected
    ? response.docs.find((doc) => authorMatches(doc, expected))
    : response.docs[0];

  if (!matched) {
    return { result: null, authorMismatch: true };
  }

  const { fields, notes } = extractFields(matched, expectedYear);
  const claim: SourceClaim = {
    source: "open_library",
    sourceUrl: workKeyToUrl(matched.key),
    fetchedAt: new Date().toISOString(),
    fields,
    notes,
    raw: matched,
  };
  return { result: { claim } };
}

function authorMatches(doc: OpenLibraryDoc, expected: string): boolean {
  for (const name of doc.author_name ?? []) {
    if (name.toLowerCase().includes(expected)) return true;
  }
  return false;
}

function extractFields(
  doc: OpenLibraryDoc,
  expectedYear?: number,
): { fields: SourceClaimFields; notes: string[] } {
  const fields: SourceClaimFields = {};
  const notes: string[] = [];

  if (doc.title) fields.title = doc.title;

  if (doc.author_name && doc.author_name.length > 0) {
    fields.authorNames = doc.author_name.slice();
  }

  if (typeof doc.first_publish_year === "number") {
    const olYear = doc.first_publish_year;
    const skipYear =
      typeof expectedYear === "number" &&
      olYear - expectedYear >= RELEASE_YEAR_DRIFT_THRESHOLD;
    if (!skipYear) fields.releaseYear = olYear;
    else notes.push(`releaseYear_skipped_drift_${olYear}_vs_${expectedYear}`);
  }

  if (doc.isbn && doc.isbn.length > 0) {
    const isbn13 = doc.isbn.find((s) => /^97[89]\d{10}$/.test(s));
    if (isbn13) fields.isbn13 = isbn13;
    const isbn10 = doc.isbn.find((s) => /^\d{9}[\dXx]$/.test(s));
    if (isbn10) fields.isbn10 = isbn10.toUpperCase();
  }

  if (typeof doc.number_of_pages_median === "number") {
    const pc = doc.number_of_pages_median;
    if (pc < PAGE_COUNT_LOWER_THRESHOLD) {
      notes.push(`pagecount_below_threshold:${pc}`);
      // field NOT set
    } else {
      fields.pageCount = pc;
      if (pc > PAGE_COUNT_UPPER_THRESHOLD) {
        notes.push(`pagecount_unusually_high:${pc}`);
      }
    }
  }

  if (typeof doc.cover_i === "number") {
    fields.coverUrl = coverIdToUrl(doc.cover_i);
  }

  return { fields, notes };
}
