/**
 * TLBranson reading-order fetcher (Brief 054, Pipeline V2).
 *
 * Fetches the two reading-order pages on TLBranson.com via Node's native fetch
 * (the site sits behind WP-Rocket cache, no Cloudflare bot-management — undici
 * passes through cleanly, unlike Lexicanum). Each page is cached on disk under
 * `ingest/.cache/tlbranson/<page-slug>.html`; subsequent runs read from cache
 * with a 24h TTL. Cache directory is gitignored (`/ingest/.cache/`).
 */
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

const UA =
  "ChronoLexicanum/0.1 (https://github.com/phinklab/chrono-lexicanum; p.kuenzler@web.de)";

const REQUEST_TIMEOUT_MS = 30_000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_DIR = join(process.cwd(), "ingest", ".cache", "tlbranson");

export const TLBRANSON_PAGES = {
  "warhammer-40k-books-in-order":
    "https://www.tlbranson.com/warhammer-40k-books-in-order/",
  "horus-heresy-reading-order":
    "https://www.tlbranson.com/horus-heresy-reading-order/",
} as const;

export type TLBransonPageSlug = keyof typeof TLBRANSON_PAGES;

export interface FetchedTlbransonPage {
  slug: TLBransonPageSlug;
  url: string;
  html: string;
  fetchedAt: string;
  cached: boolean;
}

async function readCache(filepath: string): Promise<string | undefined> {
  try {
    const stats = await stat(filepath);
    if (Date.now() - stats.mtimeMs > CACHE_TTL_MS) return undefined;
    return await readFile(filepath, "utf8");
  } catch {
    return undefined;
  }
}

async function writeCache(filepath: string, html: string): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(filepath, html, "utf8");
}

export async function fetchTlbransonPage(
  slug: TLBransonPageSlug,
): Promise<FetchedTlbransonPage> {
  const url = TLBRANSON_PAGES[slug];
  const filepath = join(CACHE_DIR, `${slug}.html`);

  const cached = await readCache(filepath);
  if (cached) {
    return { slug, url, html: cached, fetchedAt: new Date().toISOString(), cached: true };
  }

  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`TLBranson fetch failed: ${res.status} ${res.statusText} for ${url}`);
  }
  const html = await res.text();
  await writeCache(filepath, html);
  return { slug, url, html, fetchedAt: new Date().toISOString(), cached: false };
}
