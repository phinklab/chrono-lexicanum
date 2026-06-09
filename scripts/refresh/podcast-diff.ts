/**
 * Brief 133 — podcast new-episode diff.
 *
 * For each registered show, pull the live feed and diff its episode `guid`s
 * against the committed artifact `ingest/podcasts/<slug>.json` (the "last known
 * state"). New guids → report-only findings (NOT roster rows); a maintainer
 * ingests them via the existing `ingest:podcast` → `apply:podcast` flow.
 *
 * Fail-soft per show: a youtube show without an API key is `skipped`; a fetch
 * error OR a missing/unreadable committed artifact is `failed` — a missing
 * artifact is NEVER treated as "every episode is new". One dead feed is a noted
 * gap, never a crash, and never drags down the book pass.
 *
 * Reuses the exported feed primitives (`fetchFeed`/`parseFeed`, `fetchYoutubeFeed`)
 * directly — `scripts/ingest-podcast.ts` is NOT imported (it runs `main()` on load).
 * Dependency-injected so the diff unit-tests fully offline.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { fetchFeed, parseFeed } from "@/lib/ingestion/podcast/feed";
import { fetchYoutubeFeed } from "@/lib/ingestion/podcast/youtube";

import type { PodcastShowConfig } from "@/lib/ingestion/podcast/registry";
import type { PodcastEpisode } from "@/lib/ingestion/podcast/types";
import type { NewEpisode, PodcastDiffResult, PodcastShowDiff } from "./types";

/** Injectable IO surface — defaults hit the network + disk; tests pass fakes. */
export interface PodcastDiffDeps {
  fetchRss(feedUrl: string): Promise<PodcastEpisode[]>;
  fetchYoutube(cfg: PodcastShowConfig): Promise<PodcastEpisode[]>;
  /** Committed episode guids for a slug, or null when the artifact is absent. */
  loadCommittedGuids(slug: string): Set<string> | null;
  /** Whether youtube shows can be fetched (a key is present). */
  youtubeEnabled: boolean;
}

/** Recency window for the diff — a *refresh* reports recent additions, not the
 *  whole un-ingested back-catalog (which is a separate `ingest:podcast` backfill). */
export interface PodcastDiffWindow {
  /** "Now" in epoch ms — injected by the orchestrator (tests pass a fixed value). */
  nowMs: number;
  /** Episodes older than this many days are counted (`staleNewCount`) but not listed. */
  sinceDays: number;
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function toNewEpisode(e: PodcastEpisode): NewEpisode {
  return { guid: e.guid, title: e.title, pubDate: e.pubDate, link: e.link };
}

/** Whether an episode falls within the recency window. Undated episodes are kept (can't tell). */
function withinWindow(pubDate: string | null, cutoffMs: number): boolean {
  if (pubDate === null) return true;
  const t = Date.parse(pubDate);
  if (Number.isNaN(t)) return true;
  return t >= cutoffMs;
}

/** Diff one show's live feed against its committed artifact. Never throws. */
async function diffOneShow(
  cfg: PodcastShowConfig,
  deps: PodcastDiffDeps,
  window: PodcastDiffWindow,
): Promise<PodcastShowDiff> {
  const base = { slug: cfg.slug, title: cfg.title, source: cfg.source };

  if (cfg.source === "youtube" && !deps.youtubeEnabled) {
    const committed = deps.loadCommittedGuids(cfg.slug);
    return {
      ...base,
      status: "skipped",
      note: "youtube source skipped — no YOUTUBE_API_KEY in env",
      committedCount: committed?.size ?? 0,
      freshCount: 0,
      newEpisodes: [],
      staleNewCount: 0,
    };
  }

  const committed = deps.loadCommittedGuids(cfg.slug);
  if (committed === null) {
    return {
      ...base,
      status: "failed",
      note: `no committed artifact ingest/podcasts/${cfg.slug}.json — run ingest:podcast first (skipped to avoid a false "all-new" diff)`,
      committedCount: 0,
      freshCount: 0,
      newEpisodes: [],
      staleNewCount: 0,
    };
  }

  let fresh: PodcastEpisode[];
  try {
    fresh = cfg.source === "youtube" ? await deps.fetchYoutube(cfg) : await deps.fetchRss(cfg.feedUrl);
  } catch (e) {
    return {
      ...base,
      status: "failed",
      note: `feed fetch failed: ${errMsg(e)}`,
      committedCount: committed.size,
      freshCount: 0,
      newEpisodes: [],
      staleNewCount: 0,
    };
  }

  const cutoffMs = window.nowMs - window.sinceDays * 86_400_000;
  const allNew = fresh.filter((e) => !committed.has(e.guid));
  const recent = allNew.filter((e) => withinWindow(e.pubDate, cutoffMs));
  return {
    ...base,
    status: "ok",
    note: null,
    committedCount: committed.size,
    freshCount: fresh.length,
    newEpisodes: recent.map(toNewEpisode),
    staleNewCount: allNew.length - recent.length,
  };
}

/** Diff every registered show, fail-soft. Shows are processed in registry order. */
export async function diffPodcasts(
  shows: PodcastShowConfig[],
  deps: PodcastDiffDeps,
  window: PodcastDiffWindow,
): Promise<PodcastDiffResult> {
  const out: PodcastShowDiff[] = [];
  for (const cfg of shows) {
    out.push(await diffOneShow(cfg, deps, window));
  }
  return { shows: out };
}

// --- default (network + disk) deps -------------------------------------------

export interface DefaultDepsOptions {
  /** Absolute path to the committed artifact dir (`<repo>/ingest/podcasts`). */
  artifactDir: string;
  /** `process.env.YOUTUBE_API_KEY` (read by the orchestrator, not this lib). */
  youtubeApiKey?: string;
}

/** Wire the real feed primitives + artifact reads behind the injectable surface. */
export function defaultPodcastDiffDeps(opts: DefaultDepsOptions): PodcastDiffDeps {
  const key = opts.youtubeApiKey?.trim() ?? "";
  return {
    async fetchRss(feedUrl) {
      return parseFeed(await fetchFeed(feedUrl)).episodes;
    },
    async fetchYoutube(cfg) {
      return (await fetchYoutubeFeed(cfg, { apiKey: key })).episodes;
    },
    loadCommittedGuids(slug) {
      return readCommittedGuids(join(opts.artifactDir, `${slug}.json`));
    },
    youtubeEnabled: key.length > 0,
  };
}

/** Pull the `episodes[].guid` array out of an arbitrary parsed JSON value. */
function extractEpisodeGuids(parsed: unknown): Set<string> {
  const guids = new Set<string>();
  if (parsed === null || typeof parsed !== "object" || !("episodes" in parsed)) return guids;
  const eps = (parsed as { episodes: unknown }).episodes;
  if (!Array.isArray(eps)) return guids;
  for (const ep of eps) {
    if (ep === null || typeof ep !== "object") continue;
    const guid = (ep as { guid?: unknown }).guid;
    if (typeof guid === "string" && guid !== "") guids.add(guid);
  }
  return guids;
}

/** Read a committed `ShowArtifact` → its episode guid set; null if missing/unreadable. */
function readCommittedGuids(path: string): Set<string> | null {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return null; // ENOENT (or unreadable) → "no last-known state"
  }
  try {
    return extractEpisodeGuids(JSON.parse(text));
  } catch {
    return null; // malformed JSON → treat as absent (a failed diff, not "all new")
  }
}
