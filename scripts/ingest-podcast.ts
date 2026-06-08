/**
 * Brief 122 B1-S2 + Brief 131 — registry-driven podcast ingest CLI (dry-run; no
 * schema, no DB). Two orthogonal axes: SOURCE (rss | youtube, from the registry)
 * × TAGGING (api | cc-direct, from `--tagging`).
 *
 *   • `--tagging=api` (DEFAULT, unchanged): fetch → extract every episode via the
 *     metered Anthropic API (`extract.ts`, LLM-cached) → resolve → assemble the
 *     committed artifact + report end-to-end. The SDK + extract + enrich + cache
 *     are LAZILY imported inside this path only, so the cc-direct path never
 *     loads `@anthropic-ai/sdk` (Brief 131 hard constraint: zero metered calls).
 *
 *   • `--tagging=cc-direct` (Variant B): a two-stage pipeline with the tagging
 *     done OUT OF PROCESS by `claude -p` subsessions on the Max allowance (driven
 *     by `scripts/run-podcast-tag-loop.sh`), so this script makes ZERO Anthropic
 *     API calls. `--stage=acquire` fetches the feed and writes a manifest; the
 *     external driver tags it in batches of 10; `--stage=assemble` joins manifest
 *     + the committed `<out>.extractions.json` into the SAME artifact + report the
 *     api path would produce (form-identical). Both stages are Anthropic-free and
 *     need no `ANTHROPIC_API_KEY`.
 *
 * Usage:
 *   npm run ingest:podcast                                   # default show, api
 *   npm run ingest:podcast -- --show adeptus-ridiculous      # one show, api
 *   npm run ingest:podcast -- --all                          # every show, api
 *   PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast
 *   # cc-direct (driven by run-podcast-tag-loop.sh between the two stages):
 *   npm run ingest:podcast -- --tagging=cc-direct --stage=acquire  --show luetin09 --limit=20 --out luetin09-ccdemo
 *   npm run ingest:podcast -- --tagging=cc-direct --stage=assemble --out luetin09-ccdemo
 *
 * The api path requires ANTHROPIC_API_KEY in .env.local (loaded via
 * `tsx --env-file`); the cc-direct path does not.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";

// Type-only — erased at runtime, so this line does NOT load the SDK. The value
// is dynamically imported inside the api path (`apiRun`).
import type AnthropicClient from "@anthropic-ai/sdk";

import {
  buildReport,
  buildShowArtifact,
  serializeArtifact,
  type EpisodeResult,
} from "@/lib/ingestion/podcast/artifact";
import { parseExtractionsFile } from "@/lib/ingestion/podcast/extraction";
import { fetchFeed, parseFeed } from "@/lib/ingestion/podcast/feed";
import { buildShowLinks } from "@/lib/ingestion/podcast/links";
import {
  buildManifest,
  CC_TAG_BATCH_SIZE,
  ccTagWorkDir,
  parseManifest,
  podcastOutDir,
  serializeManifest,
} from "@/lib/ingestion/podcast/manifest";
import { EPISODE_PROMPT_VERSION_HASH } from "@/lib/ingestion/podcast/prompt";
import {
  DEFAULT_SHOW_SLUG,
  getShow,
  loadRegistry,
  selectShows,
  type PodcastShowConfig,
} from "@/lib/ingestion/podcast/registry";
import { resolveEpisodeTags } from "@/lib/ingestion/podcast/resolve";
import type { ParsedShowMeta, PodcastEpisode } from "@/lib/ingestion/podcast/types";
import { fetchYoutubeFeed } from "@/lib/ingestion/podcast/youtube";

const OUT_DIR = podcastOutDir();

function exitWithError(msg: string, code = 1): never {
  console.error(`error: ${msg}`);
  process.exit(code);
}

interface CliConfig {
  all: boolean;
  show?: string;
  limit?: number;
  tagging: "api" | "cc-direct";
  stage?: "acquire" | "assemble";
  out?: string;
}

function parseCliArgs(): CliConfig {
  const { values } = parseArgs({
    options: {
      show: { type: "string" },
      all: { type: "boolean", default: false },
      limit: { type: "string" },
      tagging: { type: "string", default: "api" },
      stage: { type: "string" },
      out: { type: "string" },
    },
    strict: true,
  });

  const tagging = values.tagging;
  if (tagging !== "api" && tagging !== "cc-direct") {
    exitWithError(`--tagging must be "api" or "cc-direct" (got "${String(tagging)}")`);
  }

  const limit = values.limit !== undefined ? Number.parseInt(values.limit, 10) : undefined;
  if (limit !== undefined && (!Number.isFinite(limit) || limit < 1)) {
    exitWithError(`--limit must be a positive integer (got ${values.limit})`);
  }
  if (values.all && values.show !== undefined) {
    exitWithError("pass either --all or --show <slug>, not both");
  }
  if (values.all && values.out !== undefined) {
    exitWithError("--out cannot be combined with --all (it names a single output)");
  }

  let stage: "acquire" | "assemble" | undefined;
  if (tagging === "cc-direct") {
    if (values.all) {
      exitWithError("--tagging=cc-direct operates on a single show; --all is not supported");
    }
    if (values.stage === undefined) {
      exitWithError("--tagging=cc-direct requires --stage=acquire|assemble");
    }
    if (values.stage !== "acquire" && values.stage !== "assemble") {
      exitWithError(`--stage must be "acquire" or "assemble" (got "${values.stage}")`);
    }
    stage = values.stage;
  } else if (values.stage !== undefined) {
    exitWithError("--stage only applies to --tagging=cc-direct");
  }

  return { all: values.all === true, show: values.show, limit, tagging, stage, out: values.out };
}

/**
 * Result of source-acquisition: the episodes to PROCESS (already capped to
 * `--limit`), the show metadata, the effective `feedUrl` to record on the
 * artifact (canonical uploads-feed URL for YouTube), and `totalAvailable` — how
 * many episodes the source held before the cap, for an honest log line.
 * `--limit` is applied HERE for both sources (the single limiting point). This
 * function is Anthropic-free and shared by the api path and cc-direct acquire.
 */
interface AcquiredFeed {
  show: ParsedShowMeta;
  episodes: PodcastEpisode[];
  feedUrl: string;
  totalAvailable: number;
}

/**
 * Source-dispatch (Brief 130): pick the acquisition path from `cfg.source`. RSS
 * uses `fetchFeed` + `parseFeed`, then caps; YouTube uses the Data API v3 adapter
 * (which acquires the newest non-excluded uploads up to `--limit` directly) and
 * reports the canonical channel-id-bound feed URL as the artifact's `feedUrl`.
 * Everything after this — tagging, resolve, assembly — is source-agnostic.
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

// --- the api tagging path (Variant A — metered, lazily imported) -------------

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

/** Deps the api path injects so this module never imports the SDK at top-level.
 *  All `typeof import(...)` are type-only (erased) — the values are dynamically
 *  imported once in `apiRun` and passed down. */
interface ApiDeps {
  client: AnthropicClient;
  model: string;
  limit?: number;
  youtubeApiKey?: string;
  extractEpisodeEntities: typeof import("@/lib/ingestion/podcast/extract").extractEpisodeEntities;
  loadShowCache: typeof import("@/lib/ingestion/podcast/cache").loadShowCache;
  saveShowCache: typeof import("@/lib/ingestion/podcast/cache").saveShowCache;
  estimateUsdCost: typeof import("@/lib/ingestion/llm/enrich").estimateUsdCost;
}

/**
 * Ingest one registered show end-to-end via the metered API: acquire, extract +
 * resolve each episode (LLM-cached), assemble the artifact (derived links), and
 * write the committed JSON + report. Throws on any feed/parse failure so the
 * caller can soft-fail it under `--all`. `outBasename` defaults to the slug.
 */
async function ingestOneShow(
  cfg: PodcastShowConfig,
  ctx: ApiDeps,
  outBasename: string,
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

  const cache = await ctx.loadShowCache(cfg.slug);

  const results: EpisodeResult[] = [];
  let tokensIn = 0;
  let tokensOut = 0;
  let cacheHits = 0;

  for (let i = 0; i < episodes.length; i++) {
    const ep = episodes[i];
    const r = await ctx.extractEpisodeEntities(ep, { client, model, cache });
    if (r.fromCache) {
      cacheHits += 1;
    } else {
      tokensIn += r.usage.input;
      tokensOut += r.usage.output;
      await ctx.saveShowCache(cfg.slug, cache); // persist progressively (crash-safe)
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
      feedUrl,
      appleId: cfg.appleId,
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
  const jsonPath = join(OUT_DIR, `${outBasename}.json`);
  const reportPath = join(OUT_DIR, `${outBasename}.report.md`);
  await writeFile(jsonPath, serializeArtifact(artifact), "utf8");
  await writeFile(reportPath, buildReport(artifact, cfg.source), "utf8");

  const withTag = artifact.episodes.filter((e) => e.tags.length > 0).length;
  const estCost = ctx.estimateUsdCost(
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

async function apiRun(cli: CliConfig): Promise<void> {
  // Lazy — the SDK and the metered extract/enrich/cache modules load ONLY here,
  // so `--tagging=cc-direct` never pulls in `@anthropic-ai/sdk`.
  const { default: AnthropicCtor } = await import("@anthropic-ai/sdk");
  const { estimateUsdCost, isLlmEnabled } = await import("@/lib/ingestion/llm/enrich");
  const { extractEpisodeEntities, getPodcastLlmModel } = await import(
    "@/lib/ingestion/podcast/extract"
  );
  const { loadShowCache, saveShowCache } = await import("@/lib/ingestion/podcast/cache");

  if (!isLlmEnabled()) {
    exitWithError(
      "ANTHROPIC_API_KEY missing — api tagging needs the LLM. Set it in .env.local, " +
        "run: PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast " +
        "(or use --tagging=cc-direct, which makes no API calls).",
    );
  }

  const registry = loadRegistry();
  const shows = selectShows(registry, { all: cli.all, show: cli.show });
  const model = getPodcastLlmModel();
  const client = new AnthropicCtor();
  const youtubeApiKey = process.env.YOUTUBE_API_KEY?.trim() || undefined;
  if (shows.some((s) => s.source === "youtube") && !youtubeApiKey) {
    console.warn(
      'warning: a targeted show is source:"youtube" but YOUTUBE_API_KEY is unset — ' +
        "that show will fail. Set it in .env.local (see .env.example).",
    );
  }

  console.log(
    `ingest target: ${cli.all ? `--all (${shows.length} shows)` : shows[0].slug} · tagging=api\n` +
      `model: ${model} · prompt ${EPISODE_PROMPT_VERSION_HASH}`,
  );

  const deps: ApiDeps = {
    client,
    model,
    limit: cli.limit,
    youtubeApiKey,
    extractEpisodeEntities,
    loadShowCache,
    saveShowCache,
    estimateUsdCost,
  };

  const outcomes: ShowOutcome[] = [];
  for (const cfg of shows) {
    const outBasename = cli.out ?? cfg.slug;
    try {
      const stats = await ingestOneShow(cfg, deps, outBasename);
      outcomes.push({ slug: cfg.slug, status: "ok", stats });
    } catch (err) {
      // Soft-fail per feed: a dead/zicky feed must not abort the whole run.
      const error = err instanceof Error ? err.message : String(err);
      console.error(`\n✗ ${cfg.slug}: ${error}`);
      outcomes.push({ slug: cfg.slug, status: "failed", error });
    }
  }

  if (shows.length > 1) printMultiShowSummary(outcomes);
  if (outcomes.some((o) => o.status === "failed")) process.exitCode = 1;
}

// --- the cc-direct tagging path (Variant B — Anthropic-free) ------------------

/** `--stage=acquire`: fetch the feed/uploads and write the manifest the external
 *  `claude -p` tagger + `--stage=assemble` consume. Anthropic-free; needs only a
 *  YouTube key for a YouTube show, never an Anthropic key. */
async function ccAcquire(cli: CliConfig): Promise<void> {
  const registry = loadRegistry();
  const cfg = getShow(registry, cli.show ?? DEFAULT_SHOW_SLUG);
  const out = cli.out ?? cfg.slug;
  const youtubeApiKey = process.env.YOUTUBE_API_KEY?.trim() || undefined;

  console.log(`\n=== ${cfg.slug} (${cfg.source}) · cc-direct acquire → ${out} ===`);
  const { show, episodes, feedUrl, totalAvailable } = await acquireFeed(cfg, {
    limit: cli.limit,
    youtubeApiKey,
  });

  const manifest = buildManifest({
    source: cfg.source,
    promptVersion: EPISODE_PROMPT_VERSION_HASH,
    show: {
      slug: cfg.slug,
      title: show.title || cfg.title,
      feedUrl,
      appleId: cfg.appleId,
      podcastGuid: show.podcastGuid ?? cfg.podcastGuid,
      imageUrl: show.imageUrl,
      links: buildShowLinks(cfg),
    },
    episodes,
  });

  const workDir = ccTagWorkDir(out);
  await mkdir(workDir, { recursive: true });
  const manifestPath = join(workDir, "manifest.json");
  await writeFile(manifestPath, serializeManifest(manifest), "utf8");

  const batchCount = Math.ceil(manifest.episodes.length / CC_TAG_BATCH_SIZE);
  console.log(
    `"${manifest.show.title}" — ${totalAvailable} available, acquired ${manifest.episodes.length}` +
      (cli.limit !== undefined ? ` (--limit=${cli.limit})` : "") +
      `\nwrote manifest: ${manifestPath}` +
      `\nbatch plan    : ${batchCount} batch(es) of ≤${CC_TAG_BATCH_SIZE} episodes` +
      `\nprompt version: ${EPISODE_PROMPT_VERSION_HASH}` +
      `\nnext          : tag via scripts/run-podcast-tag-loop.sh --out ${out}, then --stage=assemble`,
  );
}

/** `--stage=assemble`: join the manifest + the committed `<out>.extractions.json`
 *  into the SAME artifact + report the api path produces. Anthropic-free; no key
 *  of any kind. Fails loudly if any episode lacks an extraction. */
async function ccAssemble(cli: CliConfig): Promise<void> {
  const out = cli.out ?? cli.show ?? DEFAULT_SHOW_SLUG;
  const workDir = ccTagWorkDir(out);
  const manifestPath = join(workDir, "manifest.json");
  const extractionsPath = join(OUT_DIR, `${out}.extractions.json`);

  const manifest = parseManifest(await readFile(manifestPath, "utf8"));
  const extractionsFile = parseExtractionsFile(await readFile(extractionsPath, "utf8"));

  if (manifest.promptVersion !== extractionsFile.promptVersion) {
    console.warn(
      `warning: manifest promptVersion (${manifest.promptVersion}) != extractions ` +
        `promptVersion (${extractionsFile.promptVersion}) — conventions may have drifted.`,
    );
  }

  const results: EpisodeResult[] = [];
  const missing: string[] = [];
  for (const ep of manifest.episodes) {
    const extraction = extractionsFile.extractions[ep.guid];
    if (!extraction) {
      missing.push(ep.guid);
      continue;
    }
    const { tags, unresolved } = resolveEpisodeTags(extraction);
    results.push({ episode: ep, extraction, tags, unresolved });
  }
  if (missing.length > 0) {
    exitWithError(
      `${extractionsPath}: missing extractions for ${missing.length}/${manifest.episodes.length} ` +
        `episode(s) — run the tagger to completion first. First missing: ${missing.slice(0, 5).join(", ")}` +
        (missing.length > 5 ? ", …" : ""),
    );
  }

  const artifact = buildShowArtifact({
    show: manifest.show,
    source: manifest.source,
    model: extractionsFile.model,
    promptVersion: extractionsFile.promptVersion,
    results,
  });

  await mkdir(OUT_DIR, { recursive: true });
  const jsonPath = join(OUT_DIR, `${out}.json`);
  const reportPath = join(OUT_DIR, `${out}.report.md`);
  await writeFile(jsonPath, serializeArtifact(artifact), "utf8");
  await writeFile(reportPath, buildReport(artifact, manifest.source), "utf8");

  const withTag = artifact.episodes.filter((e) => e.tags.length > 0).length;
  console.log(
    `\n=== ${out} · cc-direct assemble ===\n` +
      `wrote: ${jsonPath}\n` +
      `       ${reportPath}\n` +
      `episodes        = ${artifact.episodes.length}\n` +
      `with ≥1 tag     = ${withTag} (${
        artifact.episodes.length > 0
          ? ((withTag / artifact.episodes.length) * 100).toFixed(1)
          : "0.0"
      }%)\n` +
      `model           = ${extractionsFile.model} · prompt ${extractionsFile.promptVersion}\n` +
      `tagging         = cc-direct (zero Anthropic API calls)`,
  );
}

async function main(): Promise<void> {
  const cli = parseCliArgs();
  if (cli.tagging === "cc-direct") {
    if (cli.stage === "acquire") return ccAcquire(cli);
    return ccAssemble(cli);
  }
  return apiRun(cli);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
