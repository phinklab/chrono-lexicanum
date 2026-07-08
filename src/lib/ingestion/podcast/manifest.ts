/**
 * The CC-Direct acquire manifest + the artifact→extractions
 * migration. Anthropic-free (local types only), so it loads in the cc-direct
 * path and the migration script without `@anthropic-ai/sdk`.
 *
 * Manifest: the output of `--stage=acquire`. It carries everything the assemble
 * stage needs that is NOT a per-episode tag — show metadata, the acquisition
 * `source` (which selects the episode-link shape), and the episodes with their
 * tagging input (`descriptionText`). The tag stage (`claude -p` batches) reads
 * the episodes' title+description and writes per-episode extractions; assemble
 * joins manifest + extractions into the artifact. The manifest is a per-run
 * intermediate (it holds bulky descriptions), not a committed contract — the
 * committed contract is `<slug>.extractions.json`.
 *
 * Migration: `manifestFromArtifact` + `reconstructExtractionFromArtifactEpisode`
 * "decompile" a committed artifact back into a manifest + minimal extractions.
 * Re-running assemble over those reproduces the artifact BYTE-IDENTICALLY (proof
 * the cc-direct assemble is a faithful inverse, and the bridge that lets an api-
 * produced RSS artifact be adopted into the cc-direct workflow). It is HERMETIC:
 * `source` is inferred from the artifact's own episode-link provenance, so the
 * migration depends only on the committed file, never on the live registry.
 *
 * Why re-assembly is byte-identical (modulo alias drift): `buildShowArtifact`
 * re-sorts tags/unresolved and re-derives episode links from (audioUrl|link,
 * source), and the authoritative tag axis comes from `resolveSurfaceForm`, NOT
 * the extraction's bucket. So placing each committed tag's `rawName` under the
 * field matching its resolved `type` (and each unresolved under its `axisGuess`)
 * is a sufficient inverse: re-resolving yields the same canonical ids + roles,
 * collapsed-by-dedup forms leave no trace to recover, and the sort makes bucket
 * order irrelevant. The one assumption — every committed `rawName` still
 * resolves the same way — is exactly what the migration's re-assembly check
 * verifies empirically.
 */
import { join } from "node:path";

import type { AliasAxis } from "@/lib/aliases";

import { canonicalizeExtraction } from "./extraction";
import { DEFAULT_PODCAST_SOURCE, PODCAST_SOURCES, type PodcastSource } from "./registry";
import type {
  EpisodeArtifact,
  EpisodeExtraction,
  PodcastEpisode,
  PodcastLink,
  ShowArtifact,
} from "./types";

const MANIFEST_GENERATED_BY =
  "scripts/ingest-podcast.ts --stage=acquire — Brief 131 (CC-Direct acquire manifest)";

/** Inverse of resolve.ts FIELD_AXIS: the extraction field for a resolved axis. */
const AXIS_FIELD: Record<AliasAxis, "characters" | "factions" | "locations"> = {
  character: "characters",
  faction: "factions",
  location: "locations",
};

/** Show-level metadata + links — exactly the `buildShowArtifact` show input. */
export interface ManifestShow {
  slug: string;
  title: string;
  feedUrl: string;
  appleId: string | null;
  podcastGuid: string | null;
  imageUrl: string | null;
  links: PodcastLink[];
}

/** Output of `--stage=acquire`: show + source + episodes (with tagging input). */
export interface ShowManifest {
  $generatedBy: string;
  /** Acquisition source — selects the episode-link shape at assemble. */
  source: PodcastSource;
  /** `EPISODE_PROMPT_VERSION_HASH` the tagger is expected to follow. */
  promptVersion: string;
  show: ManifestShow;
  episodes: PodcastEpisode[];
}

function cmpStr(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Episodes by (pubDate, guid) — same order the artifact uses, so batch
 *  assignment and the committed artifact share one ordering. */
function compareEpisodes(a: PodcastEpisode, b: PodcastEpisode): number {
  if (a.pubDate !== b.pubDate) {
    if (a.pubDate === null) return 1;
    if (b.pubDate === null) return -1;
    return cmpStr(a.pubDate, b.pubDate);
  }
  return cmpStr(a.guid, b.guid);
}

/** Build a manifest from freshly-acquired episodes (sorts episodes for stability). */
export function buildManifest(input: {
  source: PodcastSource;
  promptVersion: string;
  show: ManifestShow;
  episodes: PodcastEpisode[];
}): ShowManifest {
  return {
    $generatedBy: MANIFEST_GENERATED_BY,
    source: input.source,
    promptVersion: input.promptVersion,
    show: input.show,
    episodes: [...input.episodes].sort(compareEpisodes),
  };
}

function canonicalEpisode(e: PodcastEpisode): PodcastEpisode {
  return {
    guid: e.guid,
    title: e.title,
    descriptionText: e.descriptionText,
    pubDate: e.pubDate,
    durationSec: e.durationSec,
    audioUrl: e.audioUrl,
    link: e.link,
    season: e.season,
    episode: e.episode,
  };
}

/** Deterministic manifest JSON (fixed key order, episodes sorted, trailing NL). */
export function serializeManifest(m: ShowManifest): string {
  const ordered: ShowManifest = {
    $generatedBy: m.$generatedBy,
    source: m.source,
    promptVersion: m.promptVersion,
    show: {
      slug: m.show.slug,
      title: m.show.title,
      feedUrl: m.show.feedUrl,
      appleId: m.show.appleId,
      podcastGuid: m.show.podcastGuid,
      imageUrl: m.show.imageUrl,
      links: m.show.links,
    },
    episodes: [...m.episodes].sort(compareEpisodes).map(canonicalEpisode),
  };
  return JSON.stringify(ordered, null, 2) + "\n";
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Parse a manifest file we wrote (light structural validation). */
export function parseManifest(text: string): ShowManifest {
  const raw: unknown = JSON.parse(text);
  if (!isPlainObject(raw)) throw new Error("manifest: top-level must be an object");
  if (typeof raw.source !== "string" || !PODCAST_SOURCES.includes(raw.source as PodcastSource)) {
    throw new Error(`manifest.source: must be one of ${PODCAST_SOURCES.join("|")}`);
  }
  if (typeof raw.promptVersion !== "string" || raw.promptVersion.trim() === "") {
    throw new Error("manifest.promptVersion: required non-empty string");
  }
  if (!isPlainObject(raw.show)) throw new Error("manifest.show: required object");
  if (!Array.isArray(raw.episodes)) throw new Error("manifest.episodes: required array");
  const show = raw.show as unknown as ManifestShow;
  const episodes = (raw.episodes as unknown[]).map((e) => e as PodcastEpisode);
  return {
    $generatedBy: typeof raw.$generatedBy === "string" ? raw.$generatedBy : MANIFEST_GENERATED_BY,
    source: raw.source as PodcastSource,
    promptVersion: raw.promptVersion,
    show,
    episodes,
  };
}

// Migration: committed artifact → manifest + minimal extractions

/**
 * Infer the acquisition source from a committed artifact's own provenance —
 * hermetic, no registry lookup. An episode's audio/watch link carries the
 * `sourceKind` set by `buildEpisodeLinks` (`youtube` for a YouTube show,
 * `podcast_rss` for an RSS show), so the first episode link that declares one is
 * authoritative. (Show-level links are NOT used: an RSS show may curate a
 * YouTube channel link, so they don't discriminate.) Falls back to the default
 * (`rss`) only if no episode carries a link.
 */
export function inferSourceFromArtifact(artifact: ShowArtifact): PodcastSource {
  for (const ep of artifact.episodes) {
    for (const l of ep.links) {
      if (l.sourceKind === "youtube") return "youtube";
      if (l.sourceKind === "podcast_rss") return "rss";
    }
  }
  return DEFAULT_PODCAST_SOURCE;
}

/** Rebuild the `PodcastEpisode` an artifact episode came from. `descriptionText`
 *  is empty — assemble never reads it (only the tagger does), and the migration
 *  re-assembles, it does not re-tag. */
export function reconstructEpisodeFromArtifact(ea: EpisodeArtifact): PodcastEpisode {
  return {
    guid: ea.guid,
    title: ea.title,
    descriptionText: "",
    pubDate: ea.pubDate,
    durationSec: ea.durationSec,
    audioUrl: ea.audioUrl,
    link: ea.link,
    season: ea.season ?? null,
    episode: ea.episode ?? null,
  };
}

/**
 * Reconstruct the MINIMAL `EpisodeExtraction` that re-assembles to this artifact
 * episode. Each resolved tag's `rawName` goes under the field of its resolved
 * `type` (subject→primary, mentioned→mentioned); each unresolved form under its
 * `axisGuess`. Deduped by exact string per bucket. Not the original extraction
 * (collapsed forms are unrecoverable) — the minimal one that reproduces the
 * committed tags + unresolved through resolve + assemble.
 */
export function reconstructExtractionFromArtifactEpisode(ea: EpisodeArtifact): EpisodeExtraction {
  const ext: EpisodeExtraction = {
    episodeKind: ea.episodeKind,
    characters: { primary: [], mentioned: [] },
    factions: { primary: [], mentioned: [] },
    locations: { primary: [], mentioned: [] },
  };
  const seen = new Set<string>();
  const push = (
    field: "characters" | "factions" | "locations",
    bucket: "primary" | "mentioned",
    rawName: string,
  ): void => {
    const key = `${field}::${bucket}::${rawName}`;
    if (seen.has(key)) return;
    seen.add(key);
    ext[field][bucket].push(rawName);
  };
  for (const t of ea.tags) {
    push(AXIS_FIELD[t.type], t.role === "subject" ? "primary" : "mentioned", t.rawName);
  }
  for (const u of ea.unresolved) {
    push(AXIS_FIELD[u.axisGuess], u.role === "subject" ? "primary" : "mentioned", u.rawName);
  }
  return canonicalizeExtraction(ext);
}

/** Decompile a whole artifact into a manifest + per-guid extractions. */
export function manifestFromArtifact(artifact: ShowArtifact): {
  manifest: ShowManifest;
  extractions: Record<string, EpisodeExtraction>;
} {
  const source = inferSourceFromArtifact(artifact);
  const episodes = artifact.episodes.map(reconstructEpisodeFromArtifact);
  const extractions: Record<string, EpisodeExtraction> = {};
  for (const ea of artifact.episodes) {
    extractions[ea.guid] = reconstructExtractionFromArtifactEpisode(ea);
  }
  const manifest: ShowManifest = {
    $generatedBy: MANIFEST_GENERATED_BY,
    source,
    promptVersion: artifact.extraction.promptVersion,
    show: {
      slug: artifact.show.slug,
      title: artifact.show.title,
      feedUrl: artifact.show.feedUrl,
      appleId: artifact.show.appleId,
      podcastGuid: artifact.show.podcastGuid,
      imageUrl: artifact.show.imageUrl,
      links: artifact.show.links,
    },
    episodes,
  };
  return { manifest, extractions };
}

// CC-direct file layout (shared by ingest-podcast.ts + podcast-cc-tag.ts)

/**
 * Hard batch size for cc-direct tagging — exactly 10 episodes per `claude -p`
 * subsession. One source of truth for acquire's plan, prepare's
 * chunking, and the driver's loop bound.
 */
export const CC_TAG_BATCH_SIZE = 10;

/** `ingest/podcasts/` — committed artifacts, reports, and extractions files. */
export function podcastOutDir(): string {
  return join(process.cwd(), "ingest", "podcasts");
}

/**
 * `ingest/podcasts/.cc-tag/<out>/` — transient per-run working files (the
 * acquire manifest + per-batch input/output). Gitignored: not a committed
 * contract (the committed contract is `<out>.extractions.json` in the out dir).
 */
export function ccTagWorkDir(out: string): string {
  return join(process.cwd(), "ingest", "podcasts", ".cc-tag", out);
}

/** Zero-padded batch input filename (the tagger reads this). */
export function batchInputName(index: number): string {
  return `batch-${String(index).padStart(3, "0")}.input.json`;
}

/** Zero-padded batch output filename (the tagger writes this). */
export function batchOutputName(index: number): string {
  return `batch-${String(index).padStart(3, "0")}.output.json`;
}

/** Split items into fixed-size batches (the last batch may be short). */
export function chunkIntoBatches<T>(items: readonly T[], size: number = CC_TAG_BATCH_SIZE): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}
