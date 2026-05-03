/**
 * Open Library search-API HTTP transport.
 *
 * Open Library hat keine Cloudflare-Hürde wie Lexicanum — native `fetch`
 * reicht. Die public REST-API ist dokumentiert auf
 * <https://openlibrary.org/dev/docs/api/search>; Limit ist 100 calls/min,
 * wir bleiben mit ~1 call/Buch bei einer 5s-Lexicanum-Crawl-Cadence weit
 * darunter. Trotzdem 200ms Höflichkeits-Puffer als Rate-Limit-Schutz —
 * Hardware-Latency tankt das im Praxis-Lauf ohnehin auf.
 *
 * Retries: 3× auf 5xx/429 mit 1/2/4s Backoff (mirror lexicanum/fetch.ts).
 * Timeout: 30s via AbortSignal (mirror wikipedia/fetch.ts).
 */

const UA =
  "ChronoLexicanum/0.1 (https://github.com/phinklab/chrono-lexicanum; p.kuenzler@web.de)";

const SEARCH_BASE = "https://openlibrary.org/search.json";

const POLITENESS_DELAY_MS = 200;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;

let lastFetchAt = 0;

async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastFetchAt;
  if (elapsed < POLITENESS_DELAY_MS) {
    await sleep(POLITENESS_DELAY_MS - elapsed);
  }
  lastFetchAt = Date.now();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** A single Open Library search hit (subset of fields we request). */
export interface OpenLibraryDoc {
  key: string;                       // "/works/OL5843391W"
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];                   // mischt 10- und 13-stellige
  number_of_pages_median?: number;
  cover_i?: number;
  edition_count?: number;
}

export interface OpenLibrarySearchResponse {
  numFound: number;
  docs: OpenLibraryDoc[];
}

const SEARCH_FIELDS = [
  "key",
  "title",
  "author_name",
  "first_publish_year",
  "isbn",
  "number_of_pages_median",
  "cover_i",
  "edition_count",
].join(",");

/**
 * Search Open Library for a book by title (+ optional author for disambiguation).
 * Returns up to `limit` hits — caller picks the best match.
 */
export async function searchOpenLibrary(
  title: string,
  author: string | undefined,
  limit: number = 5,
): Promise<OpenLibrarySearchResponse> {
  const params = new URLSearchParams();
  params.set("title", title);
  if (author) params.set("author", author);
  params.set("limit", String(limit));
  params.set("fields", SEARCH_FIELDS);

  const url = `${SEARCH_BASE}?${params.toString()}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await throttle();

    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (e) {
      if (attempt === MAX_RETRIES) throw e;
      await sleep(1000 * 2 ** attempt);
      continue;
    }

    if (res.status >= 200 && res.status < 300) {
      return (await res.json()) as OpenLibrarySearchResponse;
    }

    if (res.status >= 400 && res.status < 500 && res.status !== 429) {
      // 4xx other than 429: surface as empty result; don't retry.
      return { numFound: 0, docs: [] };
    }

    if (attempt === MAX_RETRIES) {
      throw new Error(
        `Open Library ${res.status} after ${MAX_RETRIES} retries: ${url}`,
      );
    }
    await sleep(1000 * 2 ** attempt);
  }

  throw new Error("searchOpenLibrary: exhausted retries unexpectedly");
}

/**
 * Build the Open-Library-cover image URL from a `cover_i` numeric ID.
 * `L` = ~480px wide, suitable for both detail-page hero and thumbnail.
 */
export function coverIdToUrl(coverId: number): string {
  return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
}

/** Build the canonical Open Library work URL from a `/works/OL...W` key. */
export function workKeyToUrl(key: string): string {
  return `https://openlibrary.org${key}`;
}
