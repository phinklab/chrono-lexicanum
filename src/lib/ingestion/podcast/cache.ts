/**
 * LLM extraction cache (podcast).
 *
 * sha256 key + one JSON file PER SHOW holding a map of per-episode entries.
 * Lives under `ingest/.llm-cache/` (gitignored) so a re-run is cheap and --
 * because the cached extraction is replayed verbatim -- byte-stable.
 *
 * Cache key = sha256(model :: promptVersion :: guid :: normalized(title+desc))[:32].
 * Any model swap, prompt-schema change, or episode-text edit invalidates the key.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { EpisodeExtraction, PodcastEpisode } from "./types";

const CACHE_DIR = join(process.cwd(), "ingest", ".llm-cache");

// Separator between title and description in the key payload: the U+0000 (NUL)
// control char, built via fromCharCode so the source file stays clean ASCII
// (a literal NUL byte would make git treat this file as binary). NUL cannot
// occur in normalized text, so the two fields can never run together.
const KEY_SEP = String.fromCharCode(0);

export interface PodcastCacheEntry {
  key: string;
  model: string;
  version: string;
  savedAt: string;
  extraction: EpisodeExtraction;
  usage: { input: number; output: number };
}

/** One file per show: { cacheKey -> entry }. */
export type PodcastCacheFile = Record<string, PodcastCacheEntry>;

function normForKey(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

export function buildEpisodeCacheKey(
  model: string,
  version: string,
  ep: PodcastEpisode,
): string {
  const text = `${normForKey(ep.title)}${KEY_SEP}${normForKey(ep.descriptionText)}`;
  return createHash("sha256")
    .update(`${model}::${version}::${ep.guid}::${text}`)
    .digest("hex")
    .slice(0, 32);
}

function cacheFilePath(showSlug: string): string {
  return join(CACHE_DIR, `podcast-${showSlug}.json`);
}

/** Read the show's cache map. Missing file or corrupt JSON -> empty map (a miss). */
export async function loadShowCache(showSlug: string): Promise<PodcastCacheFile> {
  let raw: string;
  try {
    raw = await readFile(cacheFilePath(showSlug), "utf8");
  } catch {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as PodcastCacheFile;
    }
    return {};
  } catch {
    return {};
  }
}

export async function saveShowCache(
  showSlug: string,
  file: PodcastCacheFile,
): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cacheFilePath(showSlug), JSON.stringify(file, null, 2), "utf8");
}
