/**
 * Parse a Lexicanum book article into a `LexicanumPayload`.
 *
 * The infobox is `<table class="book-table">` with `<tr><td><b>Field</b>
 * </td><td>Value</td></tr>` rows. Useful fields seen: Author, Publisher,
 * Series, Released, Pages, Editions (with ISBNs), Followed by, Preceded
 * by. In-universe years are NOT in the infobox; they live in body text
 * like "It is the [31st millennium]" or explicit "M41.998" mentions.
 *
 * Many fields are best-effort — we return `undefined` for anything we
 * cannot extract cleanly. The merge engine treats undefined as "this
 * source did not supply it" and falls through to the next priority.
 */
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

import { parseMScale } from "@/lib/m-scale";
import type {
  LexicanumPayload,
  SourcePayloadFields,
} from "@/lib/ingestion/types";

import type { FetchedArticle } from "./fetch";

/** Minimum signal that this is a book article (not disambiguation, not
 *  character page, not video-game article). */
function isBookArticle($: CheerioAPI): boolean {
  return $("table.book-table").length > 0;
}

/** Parse the article. Returns `null` when the page is not a book article
 *  (404 fall-through is handled by the caller). */
export function parseLexicanumArticle(
  article: FetchedArticle,
): LexicanumPayload | null {
  if (!article.html) return null;

  const $ = cheerio.load(article.html);
  if (!isBookArticle($)) return null;

  const infobox = readInfoboxFields($);
  const fields: SourcePayloadFields = {};

  // Title — use the bolded title in the infobox header (more reliable than
  // <title>, which adds " - Warhammer 40k - Lexicanum").
  const title = $("table.book-table th i b").first().text().trim();
  if (title) fields.title = title;

  if (infobox.author) fields.authorNames = [infobox.author];

  // Released: e.g. "April 2006", "2008", "May 2019"
  const releaseYear = parseReleasedYear(infobox.released);
  if (releaseYear !== undefined) fields.releaseYear = releaseYear;

  // Series — link text only; mapping to our catalog id is downstream.
  if (infobox.series) {
    // We don't have a deterministic id-mapping in 3a, so leave seriesId
    // unset and surface the human-readable name only when downstream
    // resolution is added (3d).
  }

  // ISBN13 — the first 13-digit ISBN found in Editions blob.
  if (infobox.editions) {
    const m = /\b(97[89]\d{10})\b/.exec(infobox.editions);
    if (m) fields.isbn13 = m[1];
  }

  // In-universe years — best-effort body scan. Look for explicit M-scale
  // strings ("001.M31", "M41.998", "M31"); fall through to "Nth millennium"
  // → start of that millennium.
  const bodyText = $(".mw-parser-output").text();
  const universe = extractUniverseYears(bodyText);
  if (universe.startY !== undefined) fields.startY = universe.startY;
  if (universe.endY !== undefined) fields.endY = universe.endY;

  return {
    source: "lexicanum",
    sourceUrl: article.url,
    fields,
  };
}

interface InfoboxFields {
  author?: string;
  publisher?: string;
  series?: string;
  released?: string;
  pages?: string;
  editions?: string;
  followedBy?: string;
  precededBy?: string;
  performer?: string;
  length?: string;
}

const INFOBOX_FIELD_MAP: Record<string, keyof InfoboxFields> = {
  Author: "author",
  Publisher: "publisher",
  Series: "series",
  Released: "released",
  Pages: "pages",
  Editions: "editions",
  "Followed by": "followedBy",
  "Preceded by": "precededBy",
  Performer: "performer",
  Length: "length",
};

function readInfoboxFields($: CheerioAPI): InfoboxFields {
  const out: InfoboxFields = {};
  $("table.book-table tr").each((_, row) => {
    const $row = $(row);
    const labelCell = $row.find("> td > b").first();
    if (labelCell.length === 0) return;
    const rawLabel = labelCell.text().replace(/ /g, " ").trim();
    const key = INFOBOX_FIELD_MAP[rawLabel];
    if (!key) return;
    const valueCell = $row.find("> td").eq(1);
    // Drop footnote markers ("[1]", "[a]") before extracting text.
    valueCell.find("sup").remove();
    const value = valueCell.text().replace(/\s+/g, " ").trim();
    if (value) out[key] = value;
  });
  return out;
}

function parseReleasedYear(released: string | undefined): number | undefined {
  if (!released) return undefined;
  const m = /\b(19[89]\d|20[0-3]\d)\b/.exec(released);
  return m ? Number.parseInt(m[1], 10) : undefined;
}

interface UniverseYears {
  startY?: number;
  endY?: number;
}

const M_SCALE_INLINE_RE = /\b((?:\d{3}\.M\d{1,2})|(?:M\d{1,2}\.\d{1,3})|(?:M\d{1,2}))\b/g;
const NTH_MILL_RE = /\b(\d{1,2})(?:st|nd|rd|th)\s+millennium\b/i;

function extractUniverseYears(text: string): UniverseYears {
  const years: number[] = [];

  let match: RegExpExecArray | null;
  while ((match = M_SCALE_INLINE_RE.exec(text)) !== null) {
    const val = parseMScale(match[1]);
    if (val !== null) years.push(val);
  }

  if (years.length === 0) {
    const m = NTH_MILL_RE.exec(text);
    if (m) {
      const millennium = Number.parseInt(m[1], 10);
      if (Number.isFinite(millennium) && millennium >= 1) {
        years.push((millennium - 1) * 1000);
      }
    }
  }

  if (years.length === 0) return {};

  const min = Math.min(...years);
  const max = Math.max(...years);
  return { startY: min, endY: max };
}

// =============================================================================
// Slug discovery — try multiple URL forms until one resolves to a book article
// =============================================================================

import {
  fetchLexicanumArticle,
  searchLexicanumByTitle,
  titleToPageName,
} from "./fetch";

export interface DiscoveredArticle {
  article: FetchedArticle;
  payload: LexicanumPayload;
}

// Phase 3 047 Hebel B — extended URL-pattern list. Pre-047 the pipeline only
// tried `_(Novel)` / plain / `_(novel)` and missed every short story, novella,
// audio drama, and anthology. The 044 batch produced 0/50 books with
// factionNames/locationNames/characterNames as a direct consequence (those
// fields hang off the Lexicanum article).
//
// Suffix order matters: most-specific wins first. The plain title goes last
// so that a same-named non-book article (e.g. a character page) does not
// hijack the discovery before a `(Novel)` or `(Audio_Drama)` candidate is
// tried. Author-disambiguation in the success path keeps a wrong-match
// from leaking through.
const LEXICANUM_URL_SUFFIXES = [
  "_(Novel)",
  "_(novel)",
  "_(Anthology)",
  "_(anthology)",
  "_(Novella)",
  "_(novella)",
  "_(Audio_Drama)",
  "_(audio_drama)",
  "_(Short_Story)",
  "_(short_story)",
  "", // plain — last
];

/**
 * Try to find a Lexicanum book article for a given title.
 *
 * Strategy (Phase 3 047 Hebel B):
 *   1. URL probing — walk `LEXICANUM_URL_SUFFIXES` until a 200 yields a
 *      book article whose author matches.
 *   2. MediaWiki opensearch fallback — when every URL pattern misses, ask
 *      the search API for candidate page names and probe the top 3.
 *
 * If `expectedAuthor` is provided, every candidate's author is compared
 * (case-insensitive substring) — a non-match returns null with an `errors`
 * signal in the caller's diff. The first matching candidate wins.
 */
export async function discoverLexicanumArticle(
  title: string,
  expectedAuthor?: string,
): Promise<{ result: DiscoveredArticle | null; reason?: string }> {
  const base = titleToPageName(title);
  const tried = new Set<string>();

  // Pass 1: URL pattern probing.
  const patternCandidates = LEXICANUM_URL_SUFFIXES.map(
    (suffix) => `${base}${suffix}`,
  );
  for (const pageName of patternCandidates) {
    if (tried.has(pageName)) continue;
    tried.add(pageName);
    const probe = await tryLexicanumCandidate(pageName, expectedAuthor);
    if (probe.kind === "match") return { result: probe.discovered };
    if (probe.kind === "author_mismatch") return { result: null, reason: probe.reason };
  }

  // Pass 2: opensearch fallback. If api.php is Cloudflare-blocked, the
  // helper returns [] and we fall through to the original "no candidate"
  // error. The merged book stays junction-empty, but the LLM-extracted
  // junction names (047 Hebel B prompt-side) still backfill those fields.
  const searchHits = await searchLexicanumByTitle(title, 5);
  for (const hitTitle of searchHits.slice(0, 3)) {
    const pageName = titleToPageName(hitTitle);
    if (tried.has(pageName)) continue;
    tried.add(pageName);
    const probe = await tryLexicanumCandidate(pageName, expectedAuthor);
    if (probe.kind === "match") return { result: probe.discovered };
    // Author-mismatch on a search hit is downgraded to "skip and try the
    // next" — the search fallback is exploratory by nature, an early
    // mismatch shouldn't poison the whole discovery.
  }

  return { result: null, reason: "no candidate URL returned a book article" };
}

type CandidateProbe =
  | { kind: "match"; discovered: DiscoveredArticle }
  | { kind: "miss" }
  | { kind: "author_mismatch"; reason: string };

async function tryLexicanumCandidate(
  pageName: string,
  expectedAuthor: string | undefined,
): Promise<CandidateProbe> {
  const article = await fetchLexicanumArticle(pageName);
  if (article.status !== 200 || !article.html) return { kind: "miss" };

  const payload = parseLexicanumArticle(article);
  if (!payload) return { kind: "miss" };

  if (expectedAuthor) {
    const got = (payload.fields.authorNames ?? []).join(" ").toLowerCase();
    if (!got || !got.includes(expectedAuthor.toLowerCase())) {
      return {
        kind: "author_mismatch",
        reason: `author mismatch: lexicanum says "${
          (payload.fields.authorNames ?? []).join(", ")
        }", wikipedia says "${expectedAuthor}"`,
      };
    }
  }

  return { kind: "match", discovered: { article, payload } };
}
