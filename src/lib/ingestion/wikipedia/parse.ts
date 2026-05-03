/**
 * Parse a Wikipedia WH40k-novels page into a roster of `WikipediaBookEntry`.
 *
 * Two structural variants exist on Wikipedia:
 *
 * 1. **List-style** (the canonical „List of Warhammer 40,000 novels"). The page
 *    is hierarchical sections (`<h2>` / `<h3>`) → bullet lists (`<ul><li>`).
 *    Each `<li>` looks like:
 *
 *      <li><i>Book 001 - Horus Rising</i> by Dan Abnett (2006, ISBN 9781849707435)</li>
 *      <li><i>The Solar War</i> by John French (May 2019)</li>
 *      <li><i>Roboute Guilliman: Lord of Ultramar</i> by David Annandale (short novel) (2016)</li>
 *
 *    Extracted via `parseListItem`: title from first `<i>`, optional
 *    `Book NNN - ` prefix → seriesIndex, „by Author" tail → author, first
 *    4-digit publication year → releaseYear.
 *
 * 2. **Wikitable-style** (Phase 3b: series-pages like „The Horus Heresy" or
 *    „Siege of Terra" wrap their book lists in `<table class="wikitable
 *    sortable">` with columns Book / Title / Author / Release date / Length).
 *    Extracted via `parseWikitableRow`.
 *
 * Both variants live in the same parser entry — `parseWikipediaList` walks the
 * page's children and dispatches based on element type. Section context is
 * tracked across both modes so audit logs preserve provenance.
 */
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import type { Element } from "domhandler";

import type { FetchedPage } from "./fetch";
import type { WikipediaBookEntry } from "../types";

/** Sections to stop parsing at (and not descend into). */
const RESERVED_SECTION_IDS = new Set([
  "See_also",
  "References",
  "External_links",
  "Notes",
  "Bibliography",
  "Further_reading",
]);

/**
 * Match `Book 001 - Title` (also `Book 001: Title` and `Book 001 – Title`
 * with en-dash). Returns the index and stripped title.
 */
const BOOK_INDEX_RE = /^Book\s+(\d{1,3})\s*[-–:]\s*(.+)$/i;

/** First plausible 4-digit publication year between 1980 and 2030. */
const YEAR_RE = /\b(19[89]\d|20[0-3]\d)\b/;

/**
 * "by Author" or "by Author1 and Author2" or '"various authors"'. We capture
 * up to the first paren or end-of-string. Editor lines ("edited by …") are
 * matched separately.
 */
const BY_AUTHOR_RE = /\bby\s+([^()]+?)(?=\s*[(,]|$)/i;
const EDITED_BY_RE = /\bedited\s+by\s+([^()]+?)(?=\s*[(,]|$)/i;

export function parseWikipediaList(page: FetchedPage): WikipediaBookEntry[] {
  const $ = cheerio.load(page.html);
  const content = $("#mw-content-text .mw-parser-output").first();
  if (content.length === 0) {
    throw new Error(
      `Wikipedia page ${page.pageName} has no .mw-parser-output container`,
    );
  }

  const entries: WikipediaBookEntry[] = [];
  let currentSectionId: string | null = null;
  let stopped = false;

  // Walk the content children in document order, tracking section context.
  content.children().each((_, el) => {
    if (stopped) return;
    const $el = $(el);

    // Wikipedia wraps headings in <div class="mw-heading mw-heading2">.
    const heading = $el.is("div.mw-heading") ? $el.find("h2, h3").first() : $el;

    if (heading.is("h2, h3")) {
      const id = heading.attr("id") ?? null;
      if (id && RESERVED_SECTION_IDS.has(id)) {
        stopped = true;
        return;
      }
      currentSectionId = id;
      return;
    }

    if ($el.is("ul")) {
      $el.children("li").each((_i, li) => {
        const entry = parseListItem($, li, page, currentSectionId);
        if (entry) entries.push(entry);
      });
      return;
    }

    // Phase 3b: series-pages use sortable wikitables instead of bullet lists.
    if ($el.is("table.wikitable")) {
      $el.find("> tbody > tr, > tr").each((_i, tr) => {
        const entry = parseWikitableRow($, tr, page, currentSectionId);
        if (entry) entries.push(entry);
      });
    }
  });

  return entries;
}

function parseListItem(
  $: CheerioAPI,
  li: Element,
  page: FetchedPage,
  sectionId: string | null,
): WikipediaBookEntry | null {
  const $li = $(li);
  const firstItalic = $li.find("> i").first();
  if (firstItalic.length === 0) return null;

  const rawTitle = collapseWhitespace(firstItalic.text());
  if (!rawTitle) return null;

  let title = rawTitle;
  let seriesIndex: number | undefined;

  const indexMatch = BOOK_INDEX_RE.exec(rawTitle);
  if (indexMatch) {
    seriesIndex = Number.parseInt(indexMatch[1], 10);
    title = collapseWhitespace(indexMatch[2]);
  }

  // The full text minus the title gives us " by Author (year, ...)" tail.
  const tail = collapseWhitespace($li.text().slice(rawTitle.length));

  let author: string | undefined;
  const byMatch = BY_AUTHOR_RE.exec(tail);
  if (byMatch) {
    author = stripAuthorNoise(byMatch[1]);
  } else {
    const edMatch = EDITED_BY_RE.exec(tail);
    if (edMatch) author = stripAuthorNoise(edMatch[1]);
  }

  let releaseYear: number | undefined;
  const yearMatch = YEAR_RE.exec(tail);
  if (yearMatch) releaseYear = Number.parseInt(yearMatch[1], 10);

  const sourcePage = sectionId
    ? `${page.url}#${sectionId}`
    : page.url;

  return {
    title,
    author,
    releaseYear,
    seriesIndex,
    sourcePage,
  };
}

/**
 * Parse a single `<tr>` of a series-page wikitable into a book entry.
 *
 * Expected column shape (Wikipedia convention for HH/Siege-style wikitables):
 *   1. `<th>` index   — book number inside the series (→ seriesIndex)
 *   2. `<td>`         — `<i><a>Title</a></i><br><i>Subtitle</i>`
 *   3. `<td>`         — author, often wrapped `<span class="fn">…</span>`
 *   4. `<td>`         — release-info blob (year + ISBN + format)
 *   5. `<td>`         — page count or duration
 *
 * Header rows (only `<th>`, no `<td>`) and rowspan-continuation rows are
 * skipped. We tolerate column reorderings: title is „first `<i>` inside any
 * `<td>`", year is „first 4-digit year anywhere in the row text", author
 * prefers the vcard span and falls back to the 2nd or 3rd `<td>`.
 */
function parseWikitableRow(
  $: CheerioAPI,
  tr: Element,
  page: FetchedPage,
  sectionId: string | null,
): WikipediaBookEntry | null {
  const $tr = $(tr);

  // Header rows have only <th> children — skip.
  const tds = $tr.find("> td");
  if (tds.length === 0) return null;

  // Title: first <i> inside any <td>. Skip "subtitle" italics by taking
  // only the first one — Wikipedia convention for these tables.
  const firstItalic = tds.find("i").first();
  if (firstItalic.length === 0) return null;
  const title = collapseWhitespace(firstItalic.text());
  if (!title) return null;

  // seriesIndex from the row's leading <th> (book number column).
  let seriesIndex: number | undefined;
  const leadingTh = $tr.find("> th").first();
  if (leadingTh.length > 0) {
    const idxText = leadingTh.text().replace(/[^\d]/g, "");
    if (idxText) {
      const num = Number.parseInt(idxText, 10);
      if (Number.isFinite(num) && num >= 1 && num <= 999) seriesIndex = num;
    }
  }

  // Author: prefer the vcard span (`<span class="fn">Dan Abnett</span>`).
  // Fall back to the third <td> as a heuristic, then sanity-filter year-like
  // strings out (release-date columns sneaking in).
  let author: string | undefined;
  const fn = tds.find("span.fn").first();
  if (fn.length > 0) {
    author = stripAuthorNoise(fn.text());
  } else if (tds.length >= 3) {
    const candidate = collapseWhitespace(tds.eq(2).text());
    if (candidate && candidate.length < 80 && !/\d{4}/.test(candidate)) {
      author = stripAuthorNoise(candidate);
    }
  }

  // releaseYear: first 4-digit year anywhere in the row.
  const rowText = collapseWhitespace($tr.text());
  let releaseYear: number | undefined;
  const yearMatch = YEAR_RE.exec(rowText);
  if (yearMatch) releaseYear = Number.parseInt(yearMatch[1], 10);

  const sourcePage = sectionId ? `${page.url}#${sectionId}` : page.url;

  return {
    title,
    author,
    releaseYear,
    seriesIndex,
    sourcePage,
  };
}

function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function stripAuthorNoise(s: string): string {
  return s
    .replace(/^["“”]+|["“”]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
