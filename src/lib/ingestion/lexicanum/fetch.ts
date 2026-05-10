/**
 * Lexicanum article fetcher. Honors robots.txt's `Crawl-delay: 5` (hard
 * 5000ms gap between requests at the process level), retries 5xx up to
 * three times with exponential backoff, never retries 4xx.
 *
 * NOTE on Cloudflare: Lexicanum sits behind Cloudflare's bot-management.
 * Cloudflare fingerprints the TLS handshake / HTTP/2 settings, not just
 * the User-Agent — Node's native `fetch` (undici) is detected and gets a
 * 403 even with a browser UA, while `curl` passes through cleanly. We
 * therefore shell out to curl as the HTTP transport. Curl is available
 * built-in on Windows 10+, macOS, and most Linux distros.
 *
 * Phase 3 047 Hebel B adds an opensearch-API fallback for slug discovery
 * via the same curl shim. Cloudflare may still block `api.php` requests
 * on some configurations — `searchLexicanumByTitle` soft-fails to `[]` in
 * that case, and the URL-pattern probing in parse.ts continues to be the
 * primary discovery path.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { readLexCache, writeLexCache } from "./cache";

const execFileP = promisify(execFile);

const UA =
  "ChronoLexicanum/0.1 (https://github.com/phinklab/chrono-lexicanum; p.kuenzler@web.de)";

const ARTICLE_BASE = "https://wh40k.lexicanum.com/wiki/";

export const CRAWL_DELAY_MS = 5_000;
const REQUEST_TIMEOUT_SEC = 30;
const MAX_RETRIES_5XX = 3;
const STATUS_SENTINEL = "\n@@HTTPSTATUS@@";

let lastFetchAt = 0;

async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastFetchAt;
  if (elapsed < CRAWL_DELAY_MS) {
    await sleep(CRAWL_DELAY_MS - elapsed);
  }
  lastFetchAt = Date.now();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface FetchedArticle {
  /** URL-encoded path component (after /wiki/), e.g. "Horus_Rising_(Novel)". */
  pageName: string;
  /** Full URL as fetched (before redirects). */
  url: string;
  /** HTTP status of the final response. */
  status: number;
  /** HTML body when status is 200; null on 404 or other non-2xx. */
  html: string | null;
  fetchedAt: string;
}

/**
 * Fetch one Lexicanum article by URL-encoded page name. Returns
 * `{ status: 404, html: null }` on 404 (no throw — 404 is "no match here,
 * try the next candidate URL"). Throws only when retries are exhausted on
 * 5xx, on infrastructure errors (network down, timeout), or when curl is
 * unavailable.
 */
export async function fetchLexicanumArticle(
  pageName: string,
): Promise<FetchedArticle> {
  const url = ARTICLE_BASE + pageName;

  // Cache check before throttle — a hit/miss skips the 5 s crawl-delay
  // entirely. The latency win on lex-missing books (which probe ~13 URL
  // suffixes) is the dominant cost-saver of brief 056 Fix 1.
  const cached = await readLexCache(pageName);
  if (cached) {
    return {
      pageName,
      url: cached.url,
      status: cached.status,
      html: cached.kind === "hit" ? cached.html : null,
      fetchedAt: cached.fetchedAt,
    };
  }

  for (let attempt = 0; attempt <= MAX_RETRIES_5XX; attempt++) {
    await throttle();

    let result: { status: number; body: string };
    try {
      result = await curlGet(url);
    } catch (e) {
      if (attempt === MAX_RETRIES_5XX) throw e;
      await sleep(1000 * 2 ** attempt);
      continue;
    }

    const fetchedAt = new Date().toISOString();

    if (result.status >= 200 && result.status < 300) {
      await writeLexCache(pageName, {
        kind: "hit",
        url,
        fetchedAt,
        status: result.status,
        html: result.body,
      });
      return {
        pageName,
        url,
        status: result.status,
        html: result.body,
        fetchedAt,
      };
    }

    if (result.status >= 400 && result.status < 500) {
      await writeLexCache(pageName, {
        kind: "miss",
        url,
        fetchedAt,
        status: result.status,
        reason: `HTTP ${result.status}`,
      });
      return {
        pageName,
        url,
        status: result.status,
        html: null,
        fetchedAt,
      };
    }

    if (attempt === MAX_RETRIES_5XX) {
      throw new Error(
        `Lexicanum 5xx after ${MAX_RETRIES_5XX} retries: ${result.status} for ${url}`,
      );
    }
    await sleep(1000 * 2 ** attempt);
  }

  throw new Error("fetchLexicanumArticle: exhausted retries unexpectedly");
}

async function curlGet(url: string): Promise<{ status: number; body: string }> {
  const args = [
    "-s",
    "-L",
    "-A", UA,
    "-H", "Accept: text/html,application/xhtml+xml",
    "-H", "Accept-Language: en-US,en;q=0.9",
    "--max-time", String(REQUEST_TIMEOUT_SEC),
    "-w", STATUS_SENTINEL + "%{http_code}",
    url,
  ];

  const { stdout } = await execFileP("curl", args, {
    maxBuffer: 10 * 1024 * 1024,
    windowsHide: true,
  });

  const sep = stdout.lastIndexOf(STATUS_SENTINEL);
  if (sep < 0) {
    throw new Error(
      `curl output missing status sentinel for ${url} (got ${stdout.length} bytes)`,
    );
  }
  const status = Number.parseInt(stdout.slice(sep + STATUS_SENTINEL.length), 10);
  const body = stdout.slice(0, sep);
  return { status, body };
}

/**
 * Convert a free-form title ("Eisenhorn: Xenos") into the URL-encoded
 * MediaWiki page-name form ("Eisenhorn:_Xenos").
 */
export function titleToPageName(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, "_")
    // MediaWiki accepts most punctuation in page names verbatim. We only
    // need to escape the few characters that have URL-encoding meaning.
    .replace(/[%?#&]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

const OPENSEARCH_BASE = "https://wh40k.lexicanum.com/mediawiki/api.php";

/**
 * Phase 3 047 Hebel B — MediaWiki `opensearch` fallback for slug discovery.
 *
 * Returns up to `limit` candidate page names matching `title`. Soft-fails to
 * an empty array when the api.php endpoint is Cloudflare-blocked even via
 * the curl shim — the caller treats `[]` as "no fallback hits, give up".
 *
 * Response shape (MediaWiki opensearch): `[searchTerm, titles[], descs[],
 * urls[]]`. We only consume the titles array. Page names are returned as
 * MediaWiki strings (with spaces); the caller must run them through
 * `titleToPageName` before constructing a fetch URL.
 */
export async function searchLexicanumByTitle(
  title: string,
  limit: number = 5,
): Promise<string[]> {
  const params = new URLSearchParams({
    action: "opensearch",
    search: title,
    limit: String(limit),
    namespace: "0",
    format: "json",
  });
  const url = `${OPENSEARCH_BASE}?${params.toString()}`;

  await throttle();

  let result: { status: number; body: string };
  try {
    result = await curlGet(url);
  } catch {
    return [];
  }

  if (result.status !== 200) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.body);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed) || parsed.length < 2) return [];
  const titles = parsed[1];
  if (!Array.isArray(titles)) return [];
  return titles.filter((t): t is string => typeof t === "string");
}
