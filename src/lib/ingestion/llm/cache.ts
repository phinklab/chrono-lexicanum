/**
 * Phase 3c — File-System-Cache für LLM-Anreicherungs-Antworten.
 *
 * Verhindert dass ein CLI-Crash mit erneutem Re-Run 20× neu bezahlt. Eine
 * Cache-File pro Buch (`ingest/.llm-cache/<slug>.json`) hält den Cache-Key
 * und das LLMPayload. Cache-Hit: Payload 1:1 zurückgeben. Cache-Miss oder
 * Schlüssel-Mismatch: API-Call → schreibe Datei → return.
 *
 * Cache-Key = sha256(slug + PROMPT_VERSION_HASH + sha256(JSON(merged.fields))),
 * gekürzt auf 32 Hex-Stellen. Jede Prompt-Änderung oder Input-Änderung
 * invalidiert automatisch.
 *
 * `ingest/.llm-cache/` ist gitignored (siehe .gitignore Phase 3c-Block).
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { LLMPayload, MergedBook } from "@/lib/ingestion/types";

const CACHE_DIR = join(process.cwd(), "ingest", ".llm-cache");

export interface CachedLlmEntry {
  key: string;
  model: string;
  version: string;          // PROMPT_VERSION_HASH
  savedAt: string;          // ISO timestamp
  payload: LLMPayload;
}

/**
 * Stable hash over the relevant input fields. Keeps the key deterministic
 * regardless of object-key insertion order in `merged.fields`.
 */
function hashMergedInput(merged: MergedBook): string {
  const fields = merged.fields;
  const sortedKeys = Object.keys(fields).sort();
  const canonical: Record<string, unknown> = {};
  for (const k of sortedKeys) {
    canonical[k] = (fields as Record<string, unknown>)[k];
  }
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

export function buildCacheKey(
  slug: string,
  promptVersionHash: string,
  merged: MergedBook,
): string {
  const inputHash = hashMergedInput(merged);
  return createHash("sha256")
    .update(`${slug}::${promptVersionHash}::${inputHash}`)
    .digest("hex")
    .slice(0, 32);
}

function cacheFilePath(slug: string): string {
  return join(CACHE_DIR, `${slug}.json`);
}

async function ensureCacheDir(): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
}

/**
 * Returns the cached payload if present AND the key matches; otherwise
 * undefined. Silent on file-not-found and on JSON-parse errors (a corrupt
 * cache file is treated as a miss).
 */
export async function readCache(
  slug: string,
  cacheKey: string,
): Promise<LLMPayload | undefined> {
  let raw: string;
  try {
    raw = await readFile(cacheFilePath(slug), "utf8");
  } catch {
    return undefined;
  }

  let entry: CachedLlmEntry;
  try {
    entry = JSON.parse(raw) as CachedLlmEntry;
  } catch {
    return undefined;
  }

  if (entry.key !== cacheKey) return undefined;
  return entry.payload;
}

export async function writeCache(
  slug: string,
  cacheKey: string,
  model: string,
  promptVersionHash: string,
  payload: LLMPayload,
): Promise<void> {
  await ensureCacheDir();
  const entry: CachedLlmEntry = {
    key: cacheKey,
    model,
    version: promptVersionHash,
    savedAt: new Date().toISOString(),
    payload,
  };
  await writeFile(cacheFilePath(slug), JSON.stringify(entry, null, 2), "utf8");
}
