/**
 * Brief 110 Step 1 — podcast pilot ingest CLI (dry-run; no schema, no DB).
 *
 * Fetches one show's RSS feed, extracts each episode's subject entities via the
 * LLM, resolves them against the existing canonical set (reusing
 * `src/lib/aliases`), and writes a committed artifact + quality report under
 * `ingest/podcasts/`. The LLM step is cached under `ingest/.llm-cache/`
 * (gitignored) so re-runs are cheap and the committed artifact is byte-stable.
 *
 * Usage:
 *   npm run ingest:podcast                       # full pilot (The 40k Lorecast)
 *   npm run ingest:podcast -- --limit=5          # cheap smoke (first 5 feed items)
 *   PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast
 *   npm run ingest:podcast -- --feed=<url> --slug=<slug> [--apple-id=<id>]
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
import { resolveEpisodeTags } from "@/lib/ingestion/podcast/resolve";

/** Pilot show — Brief 110 (resolved via Apple lookup id=1709093251). */
const PILOT = {
  slug: "the-40k-lorecast",
  title: "The 40k Lorecast",
  feedUrl: "https://feeds.redcircle.com/cc233adb-de43-49be-bb76-9720292ddc98",
  appleId: "1709093251" as string | null,
};

const OUT_DIR = join(process.cwd(), "ingest", "podcasts");

function exitWithError(msg: string, code = 1): never {
  console.error(`error: ${msg}`);
  process.exit(code);
}

interface CliConfig {
  slug: string;
  feedUrl: string;
  appleId: string | null;
  limit?: number;
}

function parseCliArgs(): CliConfig {
  const { values } = parseArgs({
    options: {
      slug: { type: "string" },
      feed: { type: "string" },
      "apple-id": { type: "string" },
      limit: { type: "string" },
    },
    strict: true,
  });

  const feedUrl = values.feed ?? PILOT.feedUrl;
  const slug = values.slug ?? PILOT.slug;
  // appleId defaults to the pilot's only when the feed is the pilot feed.
  const appleId =
    values["apple-id"] ?? (feedUrl === PILOT.feedUrl ? PILOT.appleId : null);
  const limit = values.limit !== undefined ? Number.parseInt(values.limit, 10) : undefined;
  if (limit !== undefined && (!Number.isFinite(limit) || limit < 1)) {
    exitWithError(`--limit must be a positive integer (got ${values.limit})`);
  }
  return { slug, feedUrl, appleId, limit };
}

async function main(): Promise<void> {
  const cfg = parseCliArgs();

  if (!isLlmEnabled()) {
    exitWithError(
      "ANTHROPIC_API_KEY missing — podcast extraction needs the LLM. Set it in .env.local, " +
        "then run: PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast",
    );
  }

  const model = getPodcastLlmModel();
  console.log(`fetching feed: ${cfg.feedUrl}`);
  const xml = await fetchFeed(cfg.feedUrl);
  const { show, episodes: allEpisodes } = parseFeed(xml);
  const episodes =
    cfg.limit !== undefined ? allEpisodes.slice(0, cfg.limit) : allEpisodes;

  console.log(
    `parsed "${show.title}" — ${allEpisodes.length} episodes` +
      (cfg.limit !== undefined ? ` (processing first ${episodes.length})` : "") +
      `\nmodel: ${model} · prompt ${EPISODE_PROMPT_VERSION_HASH}`,
  );

  const client = new Anthropic();
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
      title: show.title || cfg.slug,
      feedUrl: cfg.feedUrl,
      appleId: cfg.appleId,
      podcastGuid: show.podcastGuid,
      imageUrl: show.imageUrl,
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
      `cache hits      = ${cacheHits}/${episodes.length}\n` +
      `tokens in/out   = ${tokensIn} / ${tokensOut}\n` +
      `est. USD cost   = $${estCost.toFixed(4)} (this run; cached episodes cost $0)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
