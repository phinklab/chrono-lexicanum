/**
 * TLBranson reading-order parser (Brief 054, Pipeline V2).
 *
 * Walks the WordPress article body, tracks the current H3 section as
 * `seriesHint`, and emits one `DiscoveredBook` per `<li>` that looks like a
 * book entry. Heuristics:
 *
 *   - Title preference: first `<i>`/`<em>` text inside the `<li>`. Fallback:
 *     anchor text whose href is NOT an amazon/amzn affiliate link.
 *   - Author: `by <Name>` extraction from the `<li>` text.
 *   - Year: first 4-digit year (1980–2030) in the `<li>` text. Newest-block
 *     bullets carry full dates; we only consume the year.
 *   - "Best Entry Points" detection: any H2/H3 heading whose text matches
 *     /best entry|where to start/i opens the entry-points subtree. Series
 *     names listed in that subtree are remembered; later books whose
 *     `seriesHint` equals one of those names get `isEntryPoint = true`.
 *
 * Affiliate-link strip: any `<a>` whose href contains `amzn.to` /
 * `amazon.com`/`amazon.de` is treated as URL-only — its anchor text is
 * still considered for fallback title extraction (Amazon links sometimes
 * are the only readable title), but the link itself is not surfaced.
 *
 * If the parser returns 0 entries, the orchestrator surfaces a loud error.
 * This is the single fallback strategy — a structural site rebuild trips
 * monthly maintenance, not the pipeline.
 */
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import type { Element } from "domhandler";

import { slugify } from "@/lib/slug";

import type { DiscoveredBook } from "../v2/types";

import type { FetchedTlbransonPage, TLBransonPageSlug } from "./fetch";

const YEAR_RE = /\b(19[89]\d|20[0-3]\d)\b/;
const BY_AUTHOR_RE = /\bby\s+([^()\n,;]+?)(?=\s*[(,;]|$)/i;
const ENTRY_POINT_RE = /best\s+entry|where\s+to\s+start/i;

const AFFILIATE_HOST_RE = /(?:^|\.)(?:amazon\.[a-z.]+|amzn\.to)$/i;

/**
 * Cross-link nav-article titles that TLBranson pages embed in
 * "Recommended next reads" / sidebar sections — these are links to OTHER
 * reading-order articles on the same site, not real W40k books. Rule:
 * "Ways to Read X", "X Books in Order", "Reading Order", "Guide to X".
 * Real W40k titles never match these patterns.
 */
const NAV_TITLE_RE = /\b(ways?\s+to\s+read|books?\s+in\s+order|reading\s+order|guide\s+to)\b/i;

interface ParseContext {
  pageUrl: string;
  pageSlug: TLBransonPageSlug;
}

export function parseTlbransonPage(page: FetchedTlbransonPage): DiscoveredBook[] {
  const $ = cheerio.load(page.html);

  // Most WordPress themes wrap the article body in `.entry-content`; fall
  // back to `<article>` then `<main>`.
  const root =
    $(".entry-content").first().length > 0
      ? $(".entry-content").first()
      : $("article").first().length > 0
        ? $("article").first()
        : $("main").first();

  if (root.length === 0) {
    return [];
  }

  const ctx: ParseContext = { pageUrl: page.url, pageSlug: page.slug };

  // Pass 1: collect the names of series listed under any "Best Entry Points"
  // / "Where to Start" heading.
  const entryPointSeriesNames = collectEntryPointSeries($, root);

  // Pass 2: walk the article and emit DiscoveredBook entries.
  const found: DiscoveredBook[] = [];
  let currentSeriesH3: string | null = null;
  let currentSeriesH2: string | null = null;

  root.find("h2, h3, ul, ol").each((_, el) => {
    const $el = $(el);
    if ($el.is("h2")) {
      currentSeriesH2 = collapse($el.text());
      currentSeriesH3 = null;
      return;
    }
    if ($el.is("h3")) {
      currentSeriesH3 = collapse($el.text());
      return;
    }
    // Skip lists inside the "Best Entry Points" H2 — those are series anchors,
    // not actual book entries.
    if (currentSeriesH2 && ENTRY_POINT_RE.test(currentSeriesH2)) return;

    $el.children("li").each((_i, li) => {
      const entry = parseBullet($, li, currentSeriesH3 ?? currentSeriesH2 ?? null, ctx);
      if (entry) found.push(entry);
    });
  });

  // Mark isEntryPoint where seriesHint matches a remembered entry-point series
  // (case-insensitive, normalized whitespace).
  if (entryPointSeriesNames.size > 0) {
    for (const book of found) {
      if (!book.seriesHint) continue;
      const norm = book.seriesHint.toLowerCase().replace(/\s+/g, " ").trim();
      if (entryPointSeriesNames.has(norm)) {
        book.isEntryPoint = true;
      }
    }
  }

  return dedupBySlug(found);
}

function collectEntryPointSeries(
  $: CheerioAPI,
  root: cheerio.Cheerio<Element>,
): Set<string> {
  const out = new Set<string>();
  let inSection = false;

  root.children().each((_, el) => {
    const $el = $(el);
    if ($el.is("h2")) {
      inSection = ENTRY_POINT_RE.test(collapse($el.text()));
      return;
    }
    if (!inSection) return;
    if ($el.is("h3, h4")) {
      const name = collapse($el.text());
      if (name) out.add(name.toLowerCase().replace(/\s+/g, " ").trim());
      return;
    }
    if ($el.is("ul, ol")) {
      $el.find("> li").each((_i, li) => {
        const linkText = collapse($(li).find("a").first().text());
        const fallback = collapse($(li).text());
        const candidate = linkText || fallback.split(/[—:–-]/)[0];
        if (candidate) out.add(candidate.toLowerCase().replace(/\s+/g, " ").trim());
      });
    }
  });

  return out;
}

function parseBullet(
  $: CheerioAPI,
  li: Element,
  seriesHint: string | null,
  ctx: ParseContext,
): DiscoveredBook | null {
  const $li = $(li);
  const fullText = collapse($li.text());
  if (!fullText) return null;

  // Title preference: first <i>/<em>; else first non-affiliate <a> text;
  // else strip "(date)", "by Author", "(year)" trailers off the bullet's
  // raw text. The Newest-block bullets carry full dates inline ("Chem Dog
  // (March 27, 2026)") and have neither `<i>` nor `<a>` to anchor on.
  let title = collapse($li.find("> i, > em").first().text());
  if (!title) {
    $li.find("a").each((_i, a) => {
      if (title) return;
      const href = $(a).attr("href") ?? "";
      if (isAffiliateLink(href)) return;
      const text = collapse($(a).text());
      if (text) title = text;
    });
  }
  if (!title) {
    title = stripTitleTrailers(fullText);
  } else {
    title = stripTitleTrailers(title);
  }
  if (!title || title.length < 2) return null;

  // Reject TLBranson cross-links to other reading-order articles ("X Ways
  // to Read", "Y Books in Order", "Reading Order") — these are nav, not books.
  if (NAV_TITLE_RE.test(title)) return null;

  const slug = slugify(title);
  if (!slug) return null;

  const authorMatch = BY_AUTHOR_RE.exec(fullText);
  const authorHint = authorMatch ? collapse(authorMatch[1]) : undefined;

  const yearMatch = YEAR_RE.exec(fullText);
  const releaseYear = yearMatch ? Number.parseInt(yearMatch[1], 10) : undefined;

  return {
    slug,
    title,
    releaseYear,
    authorHint,
    seriesHint: seriesHint ?? undefined,
    sourcePages: [ctx.pageUrl],
    discoverySources: ["tlbranson"],
  };
}

/**
 * Strip trailing "(date/year)", "by Author", and bracketed annotation off a
 * raw bullet text. Three passes:
 *
 *   1. Cut at " by " — everything before is the title candidate.
 *   2. Cut at the first opening paren (date or annotation).
 *   3. Trim and collapse whitespace.
 */
function stripTitleTrailers(s: string): string {
  let t = s;
  const byIdx = t.search(/\s+by\s+/i);
  if (byIdx >= 0) t = t.slice(0, byIdx);
  const parenIdx = t.indexOf("(");
  if (parenIdx >= 0) t = t.slice(0, parenIdx);
  // Also drop trailing dash-prefixed annotations: "Foo - Newest 40k novel"
  const dashIdx = t.search(/\s+[—–-]\s+/);
  if (dashIdx >= 0) t = t.slice(0, dashIdx);
  return collapse(t);
}

function isAffiliateLink(href: string): boolean {
  try {
    const u = new URL(href);
    return AFFILIATE_HOST_RE.test(u.hostname);
  } catch {
    return false;
  }
}

function collapse(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function dedupBySlug(books: DiscoveredBook[]): DiscoveredBook[] {
  const out = new Map<string, DiscoveredBook>();
  for (const b of books) {
    const existing = out.get(b.slug);
    if (!existing) {
      out.set(b.slug, b);
      continue;
    }
    // Merge sourcePages, prefer first seriesHint, keep first authorHint/year.
    const merged: DiscoveredBook = { ...existing };
    for (const p of b.sourcePages) {
      if (!merged.sourcePages.includes(p)) merged.sourcePages.push(p);
    }
    if (!merged.seriesHint && b.seriesHint) merged.seriesHint = b.seriesHint;
    if (!merged.authorHint && b.authorHint) merged.authorHint = b.authorHint;
    if (merged.releaseYear === undefined && b.releaseYear !== undefined) {
      merged.releaseYear = b.releaseYear;
    }
    if (b.isEntryPoint) merged.isEntryPoint = true;
    out.set(b.slug, merged);
  }
  return Array.from(out.values());
}
