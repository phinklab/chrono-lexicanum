/**
 * Wikipedia list-page fetcher. Just an HTTP GET wrapped in our User-Agent
 * convention; Wikipedia has a generous rate-limit so no crawl-delay needed
 * for the small number of list pages we touch.
 */

const UA =
  "ChronoLexicanum/0.1 (https://github.com/phinklab/chrono-lexicanum; p.kuenzler@web.de)";

const ENWIKI_BASE = "https://en.wikipedia.org/wiki/";

export interface FetchedPage {
  pageName: string;          // "List_of_Warhammer_40,000_novels"
  url: string;               // full URL
  html: string;
  fetchedAt: string;         // ISO timestamp
}

/**
 * Fetch a Wikipedia article by its page name (URL-encoded form expected,
 * e.g. "List_of_Warhammer_40,000_novels").
 */
export async function fetchWikipediaPage(pageName: string): Promise<FetchedPage> {
  const url = ENWIKI_BASE + pageName;
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept": "text/html",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new Error(
      `Wikipedia fetch failed: ${res.status} ${res.statusText} for ${url}`,
    );
  }

  const html = await res.text();
  return {
    pageName,
    url,
    html,
    fetchedAt: new Date().toISOString(),
  };
}
