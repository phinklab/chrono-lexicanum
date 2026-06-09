/**
 * Brief 133 — refresh source configuration loader + validator.
 *
 * `scripts/seed-data/refresh-sources.json` is the "config-driven source" the
 * brief asks for: the pinned, verified Track of Words CSV URL (tab gid=374689393,
 * the comprehensive chronological list) + the year floor. Validated on load so an
 * edited/malformed config fails loud at startup, not mid-parse.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { TrackOfWordsConfig } from "./book-source";

export interface PodcastRefreshConfig {
  /** BASELINE date floor for the episode diff (ISO `YYYY-MM-DD`) — the floor for a
   *  show that has never been reviewed. Per-show curation cursors
   *  (`ingest/refresh/curation-state.json`, advanced via `refresh:mark-reviewed`)
   *  override it once a show is curated. Episodes before a show's effective floor
   *  are never considered — only counted. */
  episodeSinceDate: string;
}

export interface RefreshSourcesConfig {
  trackOfWords: TrackOfWordsConfig;
  podcasts: PodcastRefreshConfig;
}

/** Default podcast date floor when the config omits it — only consider episodes
 *  from 2026 on (the corpus is current to ~2026; older feed entries are noise). */
const DEFAULT_EPISODE_SINCE_DATE = "2026-01-01";

export const REFRESH_SOURCES_PATH = join(
  process.cwd(),
  "scripts",
  "seed-data",
  "refresh-sources.json",
);

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function reqString(o: Record<string, unknown>, key: string, where: string): string {
  const v = o[key];
  if (typeof v !== "string" || v.trim() === "") {
    throw new Error(`${where}.${key}: required non-empty string`);
  }
  return v;
}

function reqNumber(o: Record<string, unknown>, key: string, where: string): number {
  const v = o[key];
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new Error(`${where}.${key}: required finite number`);
  }
  return v;
}

/** Optional ISO-date field with a fallback default; validated parseable. */
function optDate(o: Record<string, unknown>, key: string, fallback: string, where: string): string {
  const v = o[key];
  if (v === undefined || v === null) return fallback;
  if (typeof v !== "string" || Number.isNaN(Date.parse(v))) {
    throw new Error(`${where}.${key}: must be a parseable ISO date string (e.g. "2026-01-01") when present`);
  }
  return v;
}

/** Validate + narrow the raw `refresh-sources.json` to a typed config. Pure. */
export function parseRefreshSources(raw: unknown): RefreshSourcesConfig {
  if (!isObject(raw)) throw new Error("refresh-sources: top-level must be an object");
  const tow = raw.trackOfWords;
  if (!isObject(tow)) throw new Error("refresh-sources.trackOfWords: required object");
  const podcasts = isObject(raw.podcasts) ? raw.podcasts : {};
  return {
    trackOfWords: {
      articleUrl: reqString(tow, "articleUrl", "trackOfWords"),
      sheetCsvUrl: reqString(tow, "sheetCsvUrl", "trackOfWords"),
      gid: reqNumber(tow, "gid", "trackOfWords"),
      sinceYear: reqNumber(tow, "sinceYear", "trackOfWords"),
    },
    podcasts: {
      episodeSinceDate: optDate(podcasts, "episodeSinceDate", DEFAULT_EPISODE_SINCE_DATE, "podcasts"),
    },
  };
}

/** Read + validate the committed refresh-source config from disk. */
export function loadRefreshSources(path: string = REFRESH_SOURCES_PATH): RefreshSourcesConfig {
  const raw: unknown = JSON.parse(readFileSync(path, "utf8"));
  return parseRefreshSources(raw);
}
