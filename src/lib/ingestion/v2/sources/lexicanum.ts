/**
 * Pipeline V2 — Lexicanum source-claim adapter (Brief 054).
 *
 * V2 changes from V1's `lexicanum/parse.ts`:
 *
 *   1. Body-year regex no longer feeds `claim.fields.startY`/`endY` — it now
 *      writes to `claim.raw.bodyYearCandidates` (audit-only). V2 reads
 *      `startY`/`endY` for the FIELDS path ONLY from infobox cells
 *      (`Setting`, `Date`, `Story Date`). The body-year audit slot exists so
 *      Validator 1 can still see the unreliable values (false-gods →
 *      bodyYearCandidates=[39000], angel-exterminatus → endY=40000) and emit
 *      a year_outlier validation with the original raw value as evidence.
 *      Without that visibility, V2 would silently lose the audit signal that
 *      proves the body-year-source is broken.
 *
 *   2. New infobox fields: `Editor`/`Editors` (-> editorNames, distinct from
 *      Author) and the in-universe time fields above.
 *
 *   3. Expanded suffix probe list including stories/novellas with bare-word
 *      suffixes some Lexicanum editors used in years past
 *      (`_Anthology`/`_Story` without parens), and a canonical-redirect
 *      resolver: when an article HTML carries `<link rel="canonical">` whose
 *      path differs from the request URL, refetch from the canonical and
 *      parse THAT. Catches Lexicanum's article-name moves where the old URL
 *      still resolves to a stub.
 *
 * Output is `SourceClaim` (V2 shape), not the V1 `LexicanumPayload`. The V1
 * fetch transport (`lexicanum/fetch.ts`) is reused unchanged — it owns
 * crawl-delay throttling and the curl Cloudflare bypass.
 */
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

import { parseMScale } from "@/lib/m-scale";

import {
  fetchLexicanumArticle,
  searchLexicanumByTitle,
  titleToPageName,
  type FetchedArticle,
} from "../../lexicanum/fetch";
import type { SourceClaim, SourceClaimFields } from "../types";

const LEXICANUM_URL_SUFFIXES_V2 = [
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
  "_Anthology",
  "_Novella",
  "_Story",
  "", // plain — must remain last
];

interface InfoboxFields {
  author?: string;
  editor?: string;
  publisher?: string;
  series?: string;
  released?: string;
  pages?: string;
  editions?: string;
  setting?: string;
  date?: string;
  storyDate?: string;
  performer?: string;
  length?: string;
}

const INFOBOX_FIELD_MAP_V2: Record<string, keyof InfoboxFields> = {
  Author: "author",
  Authors: "author",
  Editor: "editor",
  Editors: "editor",
  Publisher: "publisher",
  Series: "series",
  Released: "released",
  Pages: "pages",
  Editions: "editions",
  Setting: "setting",
  Date: "date",
  "Story Date": "storyDate",
  "In-universe Date": "storyDate",
  Performer: "performer",
  Length: "length",
};

export interface DiscoveredV2LexicanumClaim {
  claim: SourceClaim;
}

export interface LexicanumDiscoveryV2Result {
  result: DiscoveredV2LexicanumClaim | null;
  /** Surface a reason ONLY for true crawler failures (HTTP error, malformed
   *  response). Normal "no article found" returns `result: null` with no
   *  reason — V2 lets `lexicanum_missing` validator produce that signal. */
  reason?: string;
  authorMismatch?: boolean;
}

/**
 * Look up a Lexicanum article for `title` and (optionally) `expectedAuthor`.
 *
 * Returns `result: null` when no candidate URL or search hit yielded a book
 * article. The caller (V2 source-claims orchestrator) feeds that signal into
 * Validator 5 (`lexicanum_missing`) — Stage 4 then emits the matching
 * `Validation` and the per-field records carry no Lexicanum value.
 */
export async function discoverLexicanumClaimV2(
  title: string,
  expectedAuthor?: string,
): Promise<LexicanumDiscoveryV2Result> {
  const base = titleToPageName(title);
  const tried = new Set<string>();
  const seenAuthors: string[] = [];

  // Pass 1: URL-suffix probing.
  for (const suffix of LEXICANUM_URL_SUFFIXES_V2) {
    const pageName = `${base}${suffix}`;
    if (tried.has(pageName)) continue;
    tried.add(pageName);
    const probed = await tryProbe(pageName, expectedAuthor, tried);
    if (probed.kind === "match") return { result: { claim: probed.claim } };
    if (probed.kind === "author_mismatch") {
      seenAuthors.push(...probed.seen);
    }
  }

  // Pass 2: opensearch fallback.
  let searchHits: string[] = [];
  try {
    searchHits = await searchLexicanumByTitle(title, 5);
  } catch {
    searchHits = [];
  }
  for (const hit of searchHits.slice(0, 3)) {
    const pageName = titleToPageName(hit);
    if (tried.has(pageName)) continue;
    tried.add(pageName);
    const probed = await tryProbe(pageName, expectedAuthor, tried);
    if (probed.kind === "match") return { result: { claim: probed.claim } };
    if (probed.kind === "author_mismatch") {
      seenAuthors.push(...probed.seen);
    }
  }

  if (seenAuthors.length > 0) {
    return { result: null, authorMismatch: true };
  }
  return { result: null };
}

type ProbeResult =
  | { kind: "match"; claim: SourceClaim }
  | { kind: "miss" }
  | { kind: "author_mismatch"; seen: string[] };

async function tryProbe(
  pageName: string,
  expectedAuthor: string | undefined,
  tried: Set<string>,
): Promise<ProbeResult> {
  let article: FetchedArticle;
  try {
    article = await fetchLexicanumArticle(pageName);
  } catch {
    return { kind: "miss" };
  }
  if (article.status !== 200 || !article.html) return { kind: "miss" };

  // Canonical-redirect resolution.
  const canonicalPage = readCanonicalPageName(article.html);
  let final = article;
  if (canonicalPage && canonicalPage !== pageName && !tried.has(canonicalPage)) {
    tried.add(canonicalPage);
    try {
      const followed = await fetchLexicanumArticle(canonicalPage);
      if (followed.status === 200 && followed.html) final = followed;
    } catch {
      /* ignore canonical-follow failures; fall back to original */
    }
  }

  const $ = cheerio.load(final.html ?? "");
  if ($("table.book-table").length === 0) return { kind: "miss" };

  const fields = extractFields($);
  const author = fields.authorNames?.join(" ").toLowerCase() ?? "";

  if (expectedAuthor && !isEditorLikeHint(expectedAuthor)) {
    const exp = expectedAuthor.toLowerCase();
    if (!author || !author.includes(exp)) {
      return { kind: "author_mismatch", seen: fields.authorNames ?? [] };
    }
  }

  // Body-year audit: collect every M-scale mention in the article body for
  // Validator 1's evidence. This is intentionally NOT promoted to fields —
  // validator-decided drop-or-use is the only path body-year can become a
  // FieldRecord.
  const bodyYearCandidates = collectBodyYearCandidates($);

  const claim: SourceClaim = {
    source: "lexicanum",
    sourceUrl: final.url,
    fetchedAt: final.fetchedAt,
    fields,
    notes: [],
    raw: {
      pageName: final.pageName,
      status: final.status,
      bodyYearCandidates,
    },
  };
  return { kind: "match", claim };
}

function readCanonicalPageName(html: string): string | undefined {
  const $ = cheerio.load(html);
  const href = $('link[rel="canonical"]').attr("href");
  if (!href) return undefined;
  const m = /\/wiki\/(.+?)(?:[#?].*)?$/.exec(href);
  if (!m) return undefined;
  return m[1];
}

function extractFields($: CheerioAPI): SourceClaimFields {
  const out: SourceClaimFields = {};
  const infobox = readInfoboxFields($);

  // Title — bolded title in the infobox header.
  const title = $("table.book-table th i b").first().text().trim();
  if (title) out.title = title;

  if (infobox.author) {
    out.authorNames = splitNames(infobox.author);
  }
  if (infobox.editor) {
    out.editorNames = splitNames(infobox.editor);
  }

  const releaseYear = parseReleasedYear(infobox.released);
  if (releaseYear !== undefined) out.releaseYear = releaseYear;

  if (infobox.editions) {
    const m13 = /\b(97[89]\d{10})\b/.exec(infobox.editions);
    if (m13) out.isbn13 = m13[1];
  }

  if (infobox.publisher) out.publisher = infobox.publisher;

  // In-universe years from the infobox cells. Setting/Date/Story Date are
  // tried in turn; the first that parses to a valid M-scale wins.
  const universeText = infobox.storyDate ?? infobox.date ?? infobox.setting;
  if (universeText) {
    const range = parseInfoboxYearRange(universeText);
    if (range.startY !== undefined) out.startY = range.startY;
    if (range.endY !== undefined) out.endY = range.endY;
  }

  return out;
}

function readInfoboxFields($: CheerioAPI): InfoboxFields {
  const out: InfoboxFields = {};
  $("table.book-table tr").each((_, row) => {
    const $row = $(row);
    const labelCell = $row.find("> td > b").first();
    if (labelCell.length === 0) return;
    const rawLabel = labelCell.text().replace(/ /g, " ").trim();
    const key = INFOBOX_FIELD_MAP_V2[rawLabel];
    if (!key) return;
    const valueCell = $row.find("> td").eq(1);
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

const M_RANGE_RE = /(?:\d{3}\.M\d{1,2}|M\d{1,2}\.\d{1,3}|M\d{1,2})/g;

function parseInfoboxYearRange(text: string): { startY?: number; endY?: number } {
  const tokens: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = M_RANGE_RE.exec(text)) !== null) {
    const v = parseMScale(m[0]);
    if (v !== null) tokens.push(v);
  }
  if (tokens.length === 0) {
    // "31st millennium" → start of M31.
    const nth = /\b(\d{1,2})(?:st|nd|rd|th)\s+millennium\b/i.exec(text);
    if (nth) {
      const millennium = Number.parseInt(nth[1], 10);
      if (Number.isFinite(millennium) && millennium >= 1) {
        tokens.push((millennium - 1) * 1000);
      }
    }
  }
  if (tokens.length === 0) return {};
  const min = Math.min(...tokens);
  const max = Math.max(...tokens);
  return { startY: min, endY: max };
}

function splitNames(s: string): string[] {
  return s
    .split(/\s*(?:,|;|\sand\s|\s&\s)\s*/i)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

/**
 * "Various" / "Editor" / "edited by" / "anonymous" hints from Wikipedia
 * are stand-ins for "this is an editor-led anthology, not a single-author
 * book". When the discovered authorHint matches, do NOT enforce author
 * matching against Lexicanum's contributor list — the multi-author
 * roster on Lexicanum is correct, the Wikipedia hint is just imprecise.
 */
function isEditorLikeHint(hint: string): boolean {
  return /^(?:various|editors?|edited\s+by|anonymous)\b/i.test(hint.trim());
}

/**
 * Walk the parsed article body, collect every M-scale token AND every
 * "Nth millennium" mention, return them as numeric values on the DB scale.
 * Audit-only — these never become a field value; Validator 1 reads them via
 * `claim.raw.bodyYearCandidates` to emit year_outlier validations against
 * the discovered series anchor.
 *
 * "Nth millennium" handling matters for the false-gods canary: that page's
 * body contains "40th millennium" (a fan-wiki reference unrelated to the
 * actual setting M30/M31), which V1 promoted to startY=39000 and which V2
 * preserves here as an audit candidate so Validator 1 can record what was
 * rejected.
 */
function collectBodyYearCandidates($: CheerioAPI): number[] {
  const text = $(".mw-parser-output").text();
  const tokens = new Set<number>();
  const re = /\b((?:\d{3}\.M\d{1,2})|(?:M\d{1,2}\.\d{1,3})|(?:M\d{1,2}))\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const v = parseMScale(m[1]);
    if (v !== null) tokens.add(v);
  }
  // "Nth millennium" — start of millennium = (N-1)*1000.
  const millRe = /\b(\d{1,2})(?:st|nd|rd|th)\s+millennium\b/gi;
  let mm: RegExpExecArray | null;
  while ((mm = millRe.exec(text)) !== null) {
    const n = Number.parseInt(mm[1], 10);
    if (Number.isFinite(n) && n >= 1) tokens.add((n - 1) * 1000);
  }
  return Array.from(tokens).sort((a, b) => a - b);
}
