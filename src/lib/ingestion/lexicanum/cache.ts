/**
 * Lexicanum per-page cache (Brief 056 Fix 1).
 *
 * Wraps `fetchLexicanumArticle` with a 24h on-disk cache under
 * `ingest/.cache/lexicanum/<slug>.json`. Hits *and* misses are cached: a 4xx
 * response gets a `kind: "miss"` marker so the next run of the same
 * `lexicanum_missing` book skips ~13 URL probes × 5 s throttle each.
 *
 * Why a JSON envelope (vs. TLBranson's raw HTML files): we need to remember
 * a successful fetch *and* an authoritative 4xx — raw HTML can't represent
 * the latter, and re-probing a 404 every run is the throttle-dominant cost.
 *
 * Filename convention is human-debuggable slugified pageName (mirrors
 * TLBranson's slug-based file layout). MediaWiki page names contain `:` and
 * parens (`Eisenhorn:_Xenos_(Novel)`) which aren't filesystem-safe on
 * Windows, so we replace anything outside `[a-zA-Z0-9._-]` with `_`. On
 * pathological lengths (>200 chars) we truncate and append a short sha256
 * suffix to avoid collisions.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_DIR = join(process.cwd(), "ingest", ".cache", "lexicanum");
const FILENAME_MAX = 200;

export type LexCacheEntry =
  | {
      kind: "hit";
      url: string;
      fetchedAt: string;
      status: number;
      html: string;
    }
  | {
      kind: "miss";
      url: string;
      fetchedAt: string;
      status: number;
      reason: string;
    };

export function lexCacheFilename(pageName: string): string {
  const safe = pageName.replace(/[^a-zA-Z0-9._-]/g, "_");
  if (safe.length <= FILENAME_MAX) return `${safe}.json`;
  const hash = createHash("sha256").update(pageName).digest("hex").slice(0, 8);
  // reserve room for `_<hash>.json` (1 + 8 + 5 = 14 chars)
  return `${safe.slice(0, FILENAME_MAX - 14)}_${hash}.json`;
}

export async function readLexCache(
  pageName: string,
): Promise<LexCacheEntry | undefined> {
  const filepath = join(CACHE_DIR, lexCacheFilename(pageName));
  try {
    const stats = await stat(filepath);
    if (Date.now() - stats.mtimeMs > CACHE_TTL_MS) return undefined;
    const raw = await readFile(filepath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!isLexCacheEntry(parsed)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export async function writeLexCache(
  pageName: string,
  entry: LexCacheEntry,
): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  const filepath = join(CACHE_DIR, lexCacheFilename(pageName));
  const tmp = `${filepath}.tmp`;
  await writeFile(tmp, JSON.stringify(entry, null, 2), "utf8");
  await rename(tmp, filepath);
}

function isLexCacheEntry(v: unknown): v is LexCacheEntry {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (typeof o.url !== "string") return false;
  if (typeof o.fetchedAt !== "string") return false;
  if (typeof o.status !== "number") return false;
  if (o.kind === "hit") return typeof o.html === "string";
  if (o.kind === "miss") return typeof o.reason === "string";
  return false;
}
