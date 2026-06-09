/**
 * Brief 133 — Track of Words "BL Pre-Order Tracker" book source.
 *
 * The tracker article embeds a *published Google Sheet* (iframe); the comprehensive
 * chronological tab exports as CSV at a pinned URL. This module fetches that CSV,
 * parses it into `CandidateBook`s, and diffs them against the committed roster via
 * the identity firewall. **`detectMissingBooks` NEVER throws** — any failure
 * (network, moved sheet, schema drift) returns `status:"unreachable"` with a note
 * and empty findings, so one dead source degrades to a partial report, not a crash.
 *
 * No DB/Drizzle import: `BookFormat` is type-only; the 9 enum values are mirrored
 * locally in the `Type`→format map (detection never writes the DB).
 */
import * as cheerio from "cheerio";

import { slugify } from "@/lib/slug";

import { bookIdentityKey, classifyCandidate, type RosterIndex } from "./identity";
import { toProposedRow, type IdAllocator } from "./proposal";

import type { BookFormat } from "../seed-data/types";
import type { BookDiffResult, CandidateBook, ProposedRosterRow, ReviewBook, SeriesPrefix } from "./types";

/** Config for the Track of Words source (loaded from `refresh-sources.json`). */
export interface TrackOfWordsConfig {
  /** Human-facing article URL — provenance on every proposed row + re-discovery anchor. */
  articleUrl: string;
  /** Pinned, verified CSV-export URL of the comprehensive tab (gid=374689393). */
  sheetCsvUrl: string;
  /** The sheet tab id — used to rebuild the CSV URL if re-discovery from the article fires. */
  gid: number;
  /** Floor year: rows older than this are skipped (currency-focused, logged not silent). */
  sinceYear: number;
}

const UA = "ChronoLexicanum/0.1 (https://github.com/phinklab/chrono-lexicanum; p.kuenzler@web.de)";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// Sheet-URL discovery (fallback path only — the happy path fetches the pinned URL)
// ---------------------------------------------------------------------------

/**
 * Pull the embedded Google-Sheet URL out of the article HTML. Primary: the
 * `<iframe>` `src`/`data-src`. Fallback: a raw regex over the HTML (covers
 * non-iframe embeds / lazy-load attributes). Returns null if no sheet is found.
 */
export function extractSheetUrl(html: string): string | null {
  const $ = cheerio.load(html);
  for (const el of $("iframe").toArray()) {
    const src = $(el).attr("src") ?? $(el).attr("data-src");
    if (src && /docs\.google\.com\/spreadsheets/.test(src)) return src;
  }
  const m = html.match(/https:\/\/docs\.google\.com\/spreadsheets\/[^\s"'<>\\]+/);
  return m ? m[0] : null;
}

/**
 * Turn a sheet URL into a CSV-export URL for tab `gid`. Handles the published
 * (`/d/e/<token>/…`) and the shared (`/d/<id>/…`) forms. The published check
 * runs first — its `/d/e/` prefix would otherwise be captured by the `/d/<id>`
 * pattern. Returns null if the URL is neither shape.
 */
export function toCsvExportUrl(sheetUrl: string, gid: number): string | null {
  const published = sheetUrl.match(/(https:\/\/docs\.google\.com\/spreadsheets\/d\/e\/[^/]+)\//);
  if (published) return `${published[1]}/pub?gid=${gid}&single=true&output=csv`;
  const shared = sheetUrl.match(/(https:\/\/docs\.google\.com\/spreadsheets\/d\/[^/]+)\//);
  if (shared) return `${shared[1]}/export?format=csv&gid=${gid}`;
  return null;
}

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

/**
 * RFC-4180-aware CSV parser: quote-aware, handles `""`-escaped quotes and
 * newlines inside quoted fields. Hand-rolled to avoid a new dependency. Returns
 * a row-major array of string cells; a trailing newline does not yield a spurious
 * empty final row.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Strip surrounding `*…*` italic markers + whitespace from a cell. */
function cleanCell(s: string): string {
  return s.trim().replace(/^\*+/, "").replace(/\*+$/, "").trim();
}

/** Parse a 4-digit year cell; null if blank / TBC / out of a sane range. */
function parseYear(s: string): number | null {
  const m = s.trim().match(/^(\d{4})$/);
  if (!m) return null;
  const y = Number.parseInt(m[1], 10);
  return y >= 1980 && y <= 2100 ? y : null;
}

/**
 * Split a cleaned author cell into display names. A `various`-sentinel cell
 * (`"Various"`, `"Various Authors"`) collapses to `editorialNote:"various"` with
 * an empty author list — anthologies/omnibuses must never key on a contributor
 * list (the identity firewall depends on this).
 */
function splitCandidateAuthors(raw: string): { authors: string[]; editorialNote: "various" | null } {
  const cleaned = raw.trim();
  if (cleaned === "") return { authors: [], editorialNote: null };
  if (/various/i.test(cleaned)) return { authors: [], editorialNote: "various" };
  const parts = cleaned
    .split(/\s*(?:,|;|&|\band\b)\s*/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !/^various$/i.test(p));
  return { authors: parts, editorialNote: null };
}

/** Inferred external-id series prefix from the `Setting/series` cell. */
function inferSeriesPrefix(setting: string): SeriesPrefix {
  return /horus\s*heresy/i.test(setting) ? "HH" : "W40K";
}

/**
 * Scope gate: the roster covers Warhammer 40,000 + the Horus Heresy ONLY, but the
 * tracker spans every Black Library setting. Rows tagged Age of Sigmar / Warhammer
 * – The Old World / Warhammer Chronicles — and the setting-less weekly separator
 * rows ("No new Black Library pre-orders this weekend") — are out of scope and
 * skipped. Conservative by design: an unrecognized setting is excluded (a missed
 * 40k book resurfaces on the next run / via review) rather than flooding the
 * proposal with other-universe titles. The accepted setting shapes are `40k…` and
 * `…Horus Heresy…` (see the runbook's revisit trigger).
 */
export function isInScopeSetting(setting: string | null): boolean {
  if (setting === null) return false;
  const s = setting.toLowerCase();
  if (s.includes("horus heresy")) return true;
  return /^40k\b/.test(s);
}

/**
 * Map the tracker `Type` cell to a `book_format` enum value. Keys are normalized
 * (lowercased, non-alpha stripped) so `"Audio Drama"`/`"audiobook"` both land on
 * `audio_drama`. The 9 values mirror the `bookFormat` pgEnum WITHOUT importing it
 * (detection stays Drizzle-free). Unmappable `Type` → null (proposal defaults it).
 */
const FORMAT_BY_NORMALIZED: Record<string, BookFormat> = {
  novel: "novel",
  novella: "novella",
  shortstory: "short_story",
  anthology: "anthology",
  audiodrama: "audio_drama",
  audiobook: "audio_drama",
  audio: "audio_drama",
  omnibus: "omnibus",
  collection: "collection",
  artbook: "artbook",
  scriptbook: "scriptbook",
};

export function mapFormat(typeRaw: string): BookFormat | null {
  const norm = typeRaw.toLowerCase().replace(/[^a-z]/g, "");
  return FORMAT_BY_NORMALIZED[norm] ?? null;
}

function buildCandidate(input: {
  title: string;
  authorsRaw: string;
  authors: string[];
  editorialNote: "various" | null;
  year: number | null;
  setting: string;
  typeRaw: string;
}): CandidateBook {
  return {
    title: input.title,
    authorsRaw: input.authorsRaw,
    authors: input.authors,
    editorialNote: input.editorialNote,
    releaseYear: input.year,
    format: mapFormat(input.typeRaw),
    seriesHint: input.setting !== "" ? input.setting : null,
    seriesPrefix: inferSeriesPrefix(input.setting),
    titleSlug: slugify(input.title),
    identityKey: bookIdentityKey(input.title, input.authors, input.editorialNote, input.year),
  };
}

export interface ParseTrackerResult {
  candidates: CandidateBook[];
  headerOk: boolean;
  /** Names of required columns the header was missing (drives the unreachable note). */
  missing: string[];
}

/**
 * Parse the tracker CSV into candidates. Columns are resolved by header NAME
 * (not position) so a re-ordered sheet still parses; a sheet missing Title /
 * Author / Year reports `headerOk:false` (→ caller marks the source unreachable
 * rather than silently mis-parsing). Structurally-empty rows (no title) are
 * skipped. The `sinceYear` floor is applied by the caller, not here.
 */
export function parseTrackerCsv(csv: string): ParseTrackerResult {
  const rows = parseCsv(csv);
  if (rows.length === 0) return { candidates: [], headerOk: false, missing: ["<empty sheet>"] };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const yearIdx = header.findIndex((h) => h.includes("year"));
  const titleIdx = header.findIndex((h) => h.startsWith("title") || h.includes("product"));
  const authorIdx = header.findIndex((h) => h.includes("author"));
  const settingIdx = header.findIndex((h) => h.includes("setting") || h.includes("series"));
  const typeIdx = header.findIndex((h) => h === "type");

  const missing: string[] = [];
  if (titleIdx < 0) missing.push("Title");
  if (authorIdx < 0) missing.push("Author");
  if (yearIdx < 0) missing.push("Year");
  if (missing.length > 0) return { candidates: [], headerOk: false, missing };

  const candidates: CandidateBook[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const title = cleanCell(cells[titleIdx] ?? "");
    if (title === "") continue;
    const authorsRaw = cleanCell(cells[authorIdx] ?? "");
    const year = parseYear(cells[yearIdx] ?? "");
    const setting = settingIdx >= 0 ? cleanCell(cells[settingIdx] ?? "") : "";
    const typeRaw = typeIdx >= 0 ? cleanCell(cells[typeIdx] ?? "") : "";
    const { authors, editorialNote } = splitCandidateAuthors(authorsRaw);
    candidates.push(buildCandidate({ title, authorsRaw, authors, editorialNote, year, setting, typeRaw }));
  }
  return { candidates, headerOk: true, missing: [] };
}

// ---------------------------------------------------------------------------
// Fetch + diff (fail-soft)
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** Native-fetch text with timeout + retry/backoff (mirrors the hardcover transport). */
async function fetchText(url: string): Promise<string> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "text/csv, text/html, */*" },
        redirect: "follow",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (e) {
      if (attempt === MAX_RETRIES) throw e;
      await sleep(1000 * 2 ** attempt);
      continue;
    }
    if (res.status >= 200 && res.status < 300) return res.text();
    if (res.status >= 400 && res.status < 500 && res.status !== 429) {
      throw new Error(`${res.status} ${res.statusText} for ${url}`);
    }
    if (attempt === MAX_RETRIES) throw new Error(`${res.status} after ${MAX_RETRIES} retries for ${url}`);
    await sleep(1000 * 2 ** attempt);
  }
  throw new Error(`fetchText: exhausted retries for ${url}`);
}

/** Injectable fetch surface — the default hits the network; tests pass a fake. */
export interface BookSourceDeps {
  fetchText(url: string): Promise<string>;
}

function unreachable(cfg: TrackOfWordsConfig, csvUrl: string | null, note: string): BookDiffResult {
  return {
    status: "unreachable",
    sourceUrl: cfg.articleUrl,
    csvUrl,
    note,
    newBooks: [],
    formatDefaultedIds: [],
    reviewBooks: [],
    consideredRows: 0,
    skippedOlderRows: 0,
    skippedOutOfScopeRows: 0,
    skippedDuplicateRows: 0,
  };
}

/**
 * Fetch the tracker, parse it, and diff against the roster. Pinned CSV URL first;
 * on failure, re-discover the sheet from the article HTML before giving up. Any
 * unrecoverable failure returns `status:"unreachable"` (never throws). New rows
 * become proposed roster-extension rows; title-collisions go to `reviewBooks`.
 */
export async function detectMissingBooks(
  cfg: TrackOfWordsConfig,
  index: RosterIndex,
  allocator: IdAllocator,
  deps: BookSourceDeps = { fetchText },
): Promise<BookDiffResult> {
  let csv: string;
  let csvUrl = cfg.sheetCsvUrl;
  try {
    csv = await deps.fetchText(cfg.sheetCsvUrl);
  } catch (primaryErr) {
    try {
      const html = await deps.fetchText(cfg.articleUrl);
      const sheetUrl = extractSheetUrl(html);
      const rediscovered = sheetUrl ? toCsvExportUrl(sheetUrl, cfg.gid) : null;
      if (!rediscovered) {
        return unreachable(cfg, null, `book source unreachable: ${errMsg(primaryErr)}; no sheet URL in article HTML`);
      }
      csvUrl = rediscovered;
      csv = await deps.fetchText(rediscovered);
    } catch (fallbackErr) {
      return unreachable(cfg, null, `book source unreachable: ${errMsg(primaryErr)} (fallback: ${errMsg(fallbackErr)})`);
    }
  }

  const parsed = parseTrackerCsv(csv);
  if (!parsed.headerOk) {
    return unreachable(cfg, csvUrl, `tracker sheet schema changed: missing column(s) ${parsed.missing.join(", ")}`);
  }
  if (parsed.candidates.length === 0) {
    return unreachable(cfg, csvUrl, "tracker sheet returned zero parseable rows");
  }

  const newBooks: ProposedRosterRow[] = [];
  const formatDefaultedIds: string[] = [];
  const reviewBooks: ReviewBook[] = [];
  let consideredRows = 0;
  let skippedOlderRows = 0;
  let skippedOutOfScopeRows = 0;
  let skippedDuplicateRows = 0;
  // Collapse a book listed on several tracker rows (multiple formats/dates) to one
  // proposal — keyed year-relaxed so a "2025 announce + 2026 release" pair merges.
  const seenDedupKeys = new Set<string>();
  for (const cand of parsed.candidates) {
    if (!isInScopeSetting(cand.seriesHint)) {
      skippedOutOfScopeRows++;
      continue;
    }
    if (cand.releaseYear !== null && cand.releaseYear < cfg.sinceYear) {
      skippedOlderRows++;
      continue;
    }
    const dedupKey = bookIdentityKey(cand.title, cand.authors, cand.editorialNote, null);
    if (seenDedupKeys.has(dedupKey)) {
      skippedDuplicateRows++;
      continue;
    }
    seenDedupKeys.add(dedupKey);
    consideredRows++;
    const verdict = classifyCandidate(cand, index);
    if (verdict.kind === "new") {
      const row = toProposedRow(cand, allocator, cfg.articleUrl);
      newBooks.push(row);
      if (cand.format === null) formatDefaultedIds.push(row.externalBookId);
    } else if (verdict.kind === "title-collision") {
      reviewBooks.push({
        title: cand.title,
        authorsRaw: cand.authorsRaw,
        releaseYear: cand.releaseYear,
        collidesWithId: verdict.rosterId,
        collidesWithTitle: verdict.rosterTitle,
      });
    }
  }

  return {
    status: "ok",
    sourceUrl: cfg.articleUrl,
    csvUrl,
    note: null,
    newBooks,
    formatDefaultedIds,
    reviewBooks,
    consideredRows,
    skippedOlderRows,
    skippedOutOfScopeRows,
    skippedDuplicateRows,
  };
}
