/**
 * Open Library payload extraction.
 *
 * Strategy:
 *   1. Search by title + (optional) author, fetch top hits.
 *   2. Pick the first doc whose `author_name` matches `expectedAuthor`
 *      (case-insensitive substring) — same disambiguation pattern as
 *      `discoverLexicanumArticle`. If `expectedAuthor` is undefined, take
 *      the top doc.
 *   3. Build a `SourcePayload`:
 *        - title, authorNames, releaseYear (first_publish_year)
 *        - isbn13 (first 13-digit, 978/979-prefixed)
 *        - isbn10 (first 10-digit including X check-digit)
 *        - pageCount (number_of_pages_median)
 *        - coverUrl (built from cover_i)
 *        - sourceUrl (built from work key) — surfaces in external_links at apply time
 *
 * Format/Availability sind in 3b absichtlich `undefined`. Open Library liefert
 * `physical_format` nur per-Edition (zusätzlicher HTTP-call), und die top-most
 * Edition ist häufig die französische Übersetzung — Heuristik wäre brittle.
 * 3c LLM klassifiziert format/availability belastbar mit Web-Search.
 */
import type {
  OpenLibraryPayload,
  SourcePayloadFields,
} from "@/lib/ingestion/types";

import { coverIdToUrl, searchOpenLibrary, workKeyToUrl } from "./fetch";
import type { OpenLibraryDoc } from "./fetch";

export interface DiscoveredOpenLibraryBook {
  doc: OpenLibraryDoc;
  payload: OpenLibraryPayload;
}

/**
 * Find an Open-Library book for `title` (+ optional `expectedAuthor`).
 *
 * Returns `{ result: { doc, payload }, reason? }`. The `reason` field is
 * populated when no match is found or when author disambiguation rejected
 * every candidate — caller routes it into `DiffFile.errors`.
 */
export async function discoverOpenLibraryBook(
  title: string,
  expectedAuthor?: string,
): Promise<{ result: DiscoveredOpenLibraryBook | null; reason?: string }> {
  const response = await searchOpenLibrary(title, expectedAuthor, 5);

  if (response.numFound === 0 || response.docs.length === 0) {
    return { result: null, reason: "no Open Library hits for title+author" };
  }

  const expected = expectedAuthor?.trim().toLowerCase();
  const matched = expected
    ? response.docs.find((doc) => authorMatchesExpected(doc, expected))
    : response.docs[0];

  if (!matched) {
    const seen = response.docs
      .map((d) => (d.author_name ?? []).join(", ") || "—")
      .join(" / ");
    return {
      result: null,
      reason: `author mismatch: open library returned [${seen}], wikipedia says "${expectedAuthor}"`,
    };
  }

  const payload: OpenLibraryPayload = {
    source: "open_library",
    sourceUrl: workKeyToUrl(matched.key),
    fields: extractFields(matched),
  };

  return { result: { doc: matched, payload } };
}

function authorMatchesExpected(doc: OpenLibraryDoc, expected: string): boolean {
  const names = doc.author_name ?? [];
  for (const name of names) {
    if (name.toLowerCase().includes(expected)) return true;
  }
  return false;
}

function extractFields(doc: OpenLibraryDoc): SourcePayloadFields {
  const fields: SourcePayloadFields = {};

  if (doc.title) fields.title = doc.title;

  if (doc.author_name && doc.author_name.length > 0) {
    fields.authorNames = doc.author_name.slice();
  }

  if (typeof doc.first_publish_year === "number") {
    fields.releaseYear = doc.first_publish_year;
  }

  if (doc.isbn && doc.isbn.length > 0) {
    const isbn13 = doc.isbn.find((s) => /^97[89]\d{10}$/.test(s));
    if (isbn13) fields.isbn13 = isbn13;

    const isbn10 = doc.isbn.find((s) => /^\d{9}[\dXx]$/.test(s));
    if (isbn10) fields.isbn10 = isbn10.toUpperCase();
  }

  if (typeof doc.number_of_pages_median === "number") {
    fields.pageCount = doc.number_of_pages_median;
  }

  if (typeof doc.cover_i === "number") {
    fields.coverUrl = coverIdToUrl(doc.cover_i);
  }

  return fields;
}
