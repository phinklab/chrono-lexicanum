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
  ctx: { client: Anthropic; model: string; limit?: number },
): Promise<ShowStats> {
  const { client, model, limit } = ctx;

  console.log(`\n=== ${cfg.slug} ===\nfetching feed: ${cfg.feedUrl}`);
  const xml = await fetchFeed(cfg.feedUrl);
  const { show, episodes: allEpisodes } = parseFeed(xml);
  const episodes = limit !== undefined ? allEpisodes.slice(0, limit) : allEpisodes;

  console.log(
    `parsed "${show.title}" — ${allEpisodes.length} episodes` +
      (limit !== undefined ? ` (processing first ${episodes.length})` : "") +
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
      feedUrl: cfg.feedUrl,
      appleId: cfg.appleId,
      // Feed-declared guid is authoritative; fall back to the registry's.
      podcastGuid: show.podcastGuid ?? cfg.podcastGuid,
      imageUrl: show.imageUrl,
      links: buildShowLinks(cfg),
    },
    model,
    promptVersion: EPISODE_PROMPT_VERSION_HASH,
    results,
  });

  await mkdir(OUT_DIR, { recursive: true });
  const jsonPath = join(OUT_DIR, `${cfg.slug}.json`);
  const reportPath = join(OUT_DIR, `${cfg.slug}.report.md`);
  await writeFile(jsonPath, serializeArtifact(artifact), "utf8");
  await writeFile(reportPath, buildReport(artifact), "utf8");

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

  console.log(
    `ingest target: ${cli.all ? `--all (${shows.length} shows)` : shows[0].slug}\n` +
      `model: ${model} · prompt ${EPISODE_PROMPT_VERSION_HASH}`,
  );

  const outcomes: ShowOutcome[] = [];
  for (const cfg of shows) {
    try {
      const stats = await ingestOneShow(cfg, { client, model, limit: cli.limit });
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
