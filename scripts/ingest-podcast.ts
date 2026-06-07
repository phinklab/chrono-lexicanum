/**
 * Brief 122 B1-S2 — registry-driven podcast ingest CLI (dry-run; no schema, no DB).
 *
 * Reads the show registry (`scripts/seed-data/podcast-shows.json`), fetches each
 * targeted show's RSS feed, extracts every episode's subject entities via the
 * LLM, resolves them against the existing canonical set (reusing
 * `src/lib/aliases`), and writes a committed artifact + quality report under
 * `ingest/podcasts/`. The artifact now carries `show.links[]` and
 * `episodes[].links[]` (Brief 128 link matrix) so S3's apply can project them
 * into `external_links`. The LLM step is cached under `ingest/.llm-cache/`
 * (gitignored) so re-runs are cheap and the committed artifact is byte-stable.
 *
 * Usage:
 *   npm run ingest:podcast                              # default show (the pilot)
 *   npm run ingest:podcast -- --show adeptus-ridiculous # one registered show
 *   npm run ingest:podcast -- --all                     # every show; soft-fails per feed
 *   npm run ingest:podcast -- --show <slug> --limit=5   # cheap smoke (first 5 items)
 *   PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast
 *
 * Requires ANTHROPIC_API_KEY in .env.local (loaded via `tsx --env-file`).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";

import Anthropic from "@anthropic-ai/sdk";

import { estimateUsdCost, isLlmEnabled } from "@/lib/ingestion/llm/enrich";
import {
  buildShowArtifact,
  buildReport,
  serializeArtifact,
  type EpisodeResult,
} from "@/lib/ingestion/podcast/artifact";
import { loadShowCache, saveShowCache } from "@/lib/ingestion/podcast/cache";
import {
  EPISODE_PROMPT_VERSION_HASH,
  extractEpisodeEntities,
  getPodcastLlmModel,
} from "@/lib/ingestion/podcast/extract";
import { fetchFeed, parseFeed } from "@/lib/ingestion/podcast/feed";
import { buildShowLinks } from "@/lib/ingestion/podcast/links";
import { loadRegistry, selectShows, type PodcastShowConfig } from "@/lib/ingestion/podcast/registry";
import { resolveEpisodeTags } from "@/lib/ingestion/podcast/resolve";
import type { ParsedShowMeta, PodcastEpisode } from "@/lib/ingestion/podcast/types";
import { fetchYoutubeFeed } from "@/lib/ingestion/podcast/youtube";

const OUT_DIR = join(process.cwd(), "ingest", "podcasts");

function exitWithError(msg: string, code = 1): never {
  console.error(`error: ${msg}`);
  process.exit(code);
}

interface CliConfig {
  all: boolean;
  show?: string;
  limit?: number;
}

function parseCliArgs(): CliConfig {
  const { values } = parseArgs({
    options: {
      show: { type: "string" },
      all: { type: "boolean", default: false },
      limit: { type: "string" },
    },
    strict: true,
  });

  const limit = values.limit !== undefined ? Number.parseInt(values.limit, 10) : undefined;
  if (limit !== undefined && (!Number.isFinite(limit) || limit < 1)) {
    exitWithError(`--limit must be a positive integer (got ${values.limit})`);
  }
  if (values.all && values.show !== undefined) {
    exitWithError("pass either --all or --show <slug>, not both");
  }
  return { all: values.all === true, show: values.show, limit };
}

interface ShowStats {
  slug: string;
  title: string;
  episodes: number;
  withTag: number;
  cacheHits: number;
  tokensIn: number;
  tokensOut: number;
  estCost: number;
  jsonPath: string;
}

/**
 * Result of source-acquisition: the episodes to PROCESS (already capped to
 * `--limit`), the show metadata, the effective `feedUrl` to record on the
 * artifact (canonical uploads-feed URL for YouTube), and `totalAvailable` — how
 * many episodes the source held before the cap, for an honest log line.
 * `--limit` is applied HERE for both sources (the single limiting point), so the
 * downstream loop sees the same `episodes`-is-the-work-set contract regardless
 * of source.
 */
interface AcquiredFeed {
  show: ParsedShowMeta;
  episodes: PodcastEpisode[];
  feedUrl: string;
  totalAvailable: number;
}

/**
 * Source-dispatch (Brief 130): pick the acquisition path from `cfg.source`. RSS
 * is the default and unchanged (`fetchFeed` + `parseFeed`, then cap); YouTube
 * uses the Data API v3 adapter (which acquires the newest non-excluded uploads
 * up to `--limit` directly, so it hydrates only what it returns) and reports the
 * canonical channel-id-bound feed URL as the artifact's `feedUrl` identity.
 * Everything after this — extract, resolve, artifact assembly — is
 * source-agnostic.
 */
async function acquireFeed(
  cfg: PodcastShowConfig,
  opts: { limit?: number; youtubeApiKey?: string },
): Promise<AcquiredFeed> {
  if (cfg.source === "youtube") {
    if (!opts.youtubeApiKey) {
      throw new Error(
        `show "${cfg.slug}" is source:"youtube" but YOUTUBE_API_KEY is missing — ` +
          "set it in .env.local (see .env.example)",
      );
    }
    console.log(
      `acquiring YouTube uploads: ${cfg.youtubeChannelUrl ?? cfg.youtubeChannelId ?? "(channel)"}`,
    );
    const yt = await fetchYoutubeFeed(cfg, { apiKey: opts.youtubeApiKey, limit: opts.limit });
    console.log(
      `resolved channel ${yt.channelId} — ${yt.totalUploads} uploads total` +
        (cfg.excludePlaylists.length > 0
          ? `, ${yt.excludedVideoCount} video(s) on the exclude-denylist`
          : "") +
        (yt.reincludedVideoCount > 0
          ? `, ${yt.reincludedVideoCount} curated lore video(s) force-included`
          : "") +
        (yt.skippedUnavailable > 0 ? `, ${yt.skippedUnavailable} unavailable skipped` : ""),
    );
    // The adapter already applied `--limit` (newest non-excluded first); the
    // returned episodes ARE the work-set.
    return {
      show: yt.show,
      episodes: yt.episodes,
      feedUrl: yt.canonicalFeedUrl,
      totalAvailable: yt.totalUploads,
    };
  }
  console.log(`fetching feed: ${cfg.feedUrl}`);
  const { show, episodes } = parseFeed(await fetchFeed(cfg.feedUrl));
  const work = opts.limit !== undefined ? episodes.slice(0, opts.limit) : episodes;
  return { show, episodes: work, feedUrl: cfg.feedUrl, totalAvailable: episodes.length };
}

interface ShowOutcome {
  slug: string;
  status: "ok" | "failed";
  stats?: ShowStats;
  error?: string;
}

/**
 * Ingest one registered show end-to-end: fetch + parse feed, extract + resolve
 * each episode (LLM-cached), assemble the artifact (with derived show/episode
 * links), and write the committed JSON + report. Throws on any feed/parse
 * failure so the caller can soft-fail it under `--all`.
 */
async function ingestOneShow(
  cfg: PodcastShowConfig,
  ctx: { client: Anthropic; model: string; limit?: number; youtubeApiKey?: string },
): Promise<ShowStats> {
  const { client, model, limit, youtubeApiKey } = ctx;

  console.log(`\n=== ${cfg.slug} (${cfg.source}) ===`);
  const { show, episodes, feedUrl, totalAvailable } = await acquireFeed(cfg, {
    limit,
    youtubeApiKey,
  });

  console.log(
    `"${show.title}" — ${totalAvailable} available, processing ${episodes.length}` +
      (limit !== undefined ? ` (--limit=${limit})` : "") +
      `\nmodel: ${model} · prompt ${EPISODE_PROMPT_VERSION_HASH}`,
  );

  const cache = await loadShowCache(cfg.slug);

  const results: EpisodeResult[] = [];
  let tokensIn = 0;
  let tokensOut = 0;
  let cacheHits = 0;

  for (let i = 0; i < episodes.length; i++) {
    const ep = episodes[i];
    const r = await extractEpisodeEntities(ep, { client, model, cache });
    if (r.fromCache) {
      cacheHits += 1;
    } else {
      tokensIn += r.usage.input;
      tokensOut += r.usage.output;
      await saveShowCache(cfg.slug, cache); // persist progressively (crash-safe)
    }
    const { tags, unresolved } = resolveEpisodeTags(r.extraction);
    results.push({ episode: ep, extraction: r.extraction, tags, unresolved });

    const flag = r.fromCache ? "cache" : "llm  ";
    console.log(
      `[${i + 1}/${episodes.length}] ${flag} ${tags.length} tags / ${unresolved.length} unresolved · ${ep.title}`,
    );
  }

  const artifact = buildShowArtifact({
    show: {
      slug: cfg.slug,
      title: show.title || cfg.title,
      // Canonical channel-id-bound feed URL for YouTube (resolved live), the
      // registry feed URL for RSS.
      feedUrl,
      appleId: cfg.appleId,
      // Feed-declared guid is authoritative; fall back to the registry's.
      podcastGuid: show.podcastGuid ?? cfg.podcastGuid,
      imageUrl: show.imageUrl,
      links: buildShowLinks(cfg),
    },
    source: cfg.source,
    model,
    promptVersion: EPISODE_PROMPT_VERSION_HASH,
    results,
  });

  await mkdir(OUT_DIR, { recursive: true });
  const jsonPath = join(OUT_DIR, `${cfg.slug}.json`);
  const reportPath = join(OUT_DIR, `${cfg.slug}.report.md`);
  await writeFile(jsonPath, serializeArtifact(artifact), "utf8");
  await writeFile(reportPath, buildReport(artifact, cfg.source), "utf8");

  const withTag = artifact.episodes.filter((e) => e.tags.length > 0).length;
  const estCost = estimateUsdCost(
    { totalTokensIn: tokensIn, totalTokensOut: tokensOut, totalWebSearches: 0 },
    model,
  );
  console.log(
    `\nwrote: ${jsonPath}\n` +
      `       ${reportPath}\n` +
      `episodes        = ${artifact.episodes.length}\n` +
      `with ≥1 tag     = ${withTag} (${
        artifact.episodes.length > 0
          ? ((withTag / artifact.episodes.length) * 100).toFixed(1)
          : "0.0"
      }%)\n` +
      `show links      = ${artifact.show.links.length}\n` +
      `cache hits      = ${cacheHits}/${episodes.length}\n` +
      `tokens in/out   = ${tokensIn} / ${tokensOut}\n` +
      `est. USD cost   = $${estCost.toFixed(4)} (this run; cached episodes cost $0)`,
  );

  return {
    slug: cfg.slug,
    title: artifact.show.title,
    episodes: artifact.episodes.length,
    withTag,
    cacheHits,
    tokensIn,
    tokensOut,
    estCost,
    jsonPath,
  };
}

function printMultiShowSummary(outcomes: ShowOutcome[]): void {
  console.log(`\n=== multi-show ingest summary (${outcomes.length} shows) ===`);
  for (const o of outcomes) {
    if (o.status === "ok" && o.stats) {
      const s = o.stats;
      console.log(
        `✓ ${s.slug.padEnd(22)} ${s.episodes} episodes, ${s.withTag} tagged, ` +
          `${s.cacheHits}/${s.episodes} cache, $${s.estCost.toFixed(4)}`,
      );
    } else {
      console.log(`✗ ${o.slug.padEnd(22)} FAILED: ${o.error}`);
    }
  }
}

async function main(): Promise<void> {
  if (!isLlmEnabled()) {
    exitWithError(
      "ANTHROPIC_API_KEY missing — podcast extraction needs the LLM. Set it in .env.local, " +
        "then run: PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast",
    );
  }

  const cli = parseCliArgs();
  const registry = loadRegistry();
  const shows = selectShows(registry, { all: cli.all, show: cli.show });
  const model = getPodcastLlmModel();
  const client = new Anthropic();
  // YouTube-source shows (Brief 130) need a Data API v3 key; RSS shows ignore it.
  // Read once here so the lib stays env-free; acquireFeed errors clearly if a
  // YouTube show is targeted without it.
  const youtubeApiKey = process.env.YOUTUBE_API_KEY?.trim() || undefined;
  if (shows.some((s) => s.source === "youtube") && !youtubeApiKey) {
    console.warn(
      "warning: a targeted show is source:\"youtube\" but YOUTUBE_API_KEY is unset — " +
        "that show will fail. Set it in .env.local (see .env.example).",
    );
  }

  console.log(
    `ingest target: ${cli.all ? `--all (${shows.length} shows)` : shows[0].slug}\n` +
      `model: ${model} · prompt ${EPISODE_PROMPT_VERSION_HASH}`,
  );

  const outcomes: ShowOutcome[] = [];
  for (const cfg of shows) {
    try {
      const stats = await ingestOneShow(cfg, { client, model, limit: cli.limit, youtubeApiKey });
      outcomes.push({ slug: cfg.slug, status: "ok", stats });
    } catch (err) {
      // Soft-fail per feed: a dead/zicky feed must not abort the whole run.
      const error = err instanceof Error ? err.message : String(err);
      console.error(`\n✗ ${cfg.slug}: ${error}`);
      outcomes.push({ slug: cfg.slug, status: "failed", error });
    }
  }

  if (shows.length > 1) printMultiShowSummary(outcomes);

  // Surface any failure to CI via the exit code, but only after every show ran.
  if (outcomes.some((o) => o.status === "failed")) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
