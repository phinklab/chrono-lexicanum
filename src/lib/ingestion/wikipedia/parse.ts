/**
 * Parse a Wikipedia "List of Warhammer 40,000 novels"-style page into a
 * roster of `WikipediaBookEntry`.
 *
 * The page is hierarchical sections (`<h2>` / `<h3>`) → bullet lists
 * (`<ul><li>`). Each `<li>` looks like:
 *
 *   <li><i>Book 001 - Horus Rising</i> by Dan Abnett (2006, reissue 2018, ISBN 9781849707435)</li>
 *   <li><i>The Solar War</i> by John French (May 2019)</li>
 *   <li><i>Roboute Guilliman: Lord of Ultramar</i> by David Annandale (short novel) (2016)</li>
 *
 * We extract the title from the first `<i>` child, strip the optional
 * "Book NNN - " prefix (capturing NNN as `seriesIndex`), find the author
 * after "by " (or "edited by " for anthologies), and pull the first
 * 4-digit year that looks like a publication year.
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

function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function stripAuthorNoise(s: string): string {
  return s
    .replace(/^["“”]+|["“”]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
