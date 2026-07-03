/**
 * Brief 122 B1-S2 — podcast show registry.
 *
 * The registry (`scripts/seed-data/podcast-shows.json`) replaces the hardcoded
 * `PILOT` constant the ingest used in Brief 110: one JSON entry per show. The
 * ingest reads it for `--show <slug>` (default = the pilot) and `--all`.
 *
 * A registry entry lists only what the feed can't supply: the show-level links
 * the ingest can't derive (official site, Spotify, YouTube). The RSS feed link
 * (from `feedUrl`) and the Apple link (from `appleId`) are DERIVED by
 * `links.ts`, so the registry stays minimal and DRY — see `SERVICE_LINK_SPEC`
 * for the per-service `kind`/`sourceKind`/`confidence` defaults (Brief 128 link
 * matrix). All validation is pure (`parseRegistry`); only `loadRegistry` touches
 * the filesystem, so the parser unit-tests without fixtures on disk.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  EXTERNAL_LINK_KINDS,
  PODCAST_LINK_SOURCE_KINDS,
  type ExternalLinkKind,
  type PodcastLinkSourceKind,
} from "./types";

export const REGISTRY_PATH = join(
  process.cwd(),
  "scripts",
  "seed-data",
  "podcast-shows.json",
);

/** The pilot — the default `--show` target when no slug is given. */
export const DEFAULT_SHOW_SLUG = "the-40k-lorecast";

/**
 * Where a show's episodes are acquired from (Brief 130). `rss` is the original
 * path (`feed.ts`): `feedUrl` is parsed as an RSS 2.0 feed. `youtube` is the
 * YouTube-source adapter (`youtube.ts`): the channel's uploads are fetched via
 * the YouTube Data API v3 and mapped into the same `ParsedFeed` contract. The
 * discriminator defaults to `rss`, so every pre-130 entry stays valid verbatim.
 */
export type PodcastSource = "rss" | "youtube";

export const PODCAST_SOURCES: readonly PodcastSource[] = ["rss", "youtube"];

export const DEFAULT_PODCAST_SOURCE: PodcastSource = "rss";

/**
 * A human-authored show-level link in the registry. `serviceId` + `url` are
 * required; `kind`/`sourceKind`/`confidence` default from `SERVICE_LINK_SPEC`
 * (overridable per-entry for a service not in the spec).
 */
export interface RegistryLinkInput {
  serviceId: string;
  url: string;
  kind?: ExternalLinkKind;
  sourceKind?: PodcastLinkSourceKind;
  confidence?: number;
}

/** One registry entry — a podcast show the ingest can resolve by slug. */
export interface PodcastShowConfig {
  slug: string;
  /** Acquisition path. Absent in the JSON → `rss` (back-compatible default). */
  source: PodcastSource;
  title: string;
  /**
   * For `source: "rss"` — the RSS 2.0 feed URL (fetched + parsed). For
   * `source: "youtube"` — a stable identity/provenance string only (the
   * channel-id-bound uploads-feed URL or the channel handle URL); it is NOT
   * fetched and NOT turned into an `rss` show link. The YouTube adapter resolves
   * the canonical uploads-feed URL from the live channel id at run time.
   */
  feedUrl: string;
  appleId: string | null;
  podcastGuid: string | null;
  links: RegistryLinkInput[];
  /** Optional — S4 (YouTube episode matching) reads these; B1 only carries them.
   *  For `source: "youtube"` the adapter uses `youtubeChannelId` when present,
   *  else resolves the channel from the `@handle` in `youtubeChannelUrl`. */
  youtubeChannelUrl: string | null;
  youtubeChannelId: string | null;
  /**
   * YouTube-source only (Brief 130 + Philipp 2026-06-07): titles of the
   * channel's own playlists whose member videos must be EXCLUDED from ingest
   * (off-topic content — e.g. hobby/painting tutorials, news/speculation, a
   * game playthrough). The adapter resolves each title to its playlist id at
   * run time and drops any upload that is a member. Empty for RSS shows.
   */
  excludePlaylists: string[];
  /**
   * YouTube-source only (Brief 130 curation, Philipp 2026-06-07): video ids to
   * FORCE-INCLUDE even though a denylisted playlist would otherwise exclude them
   * — the per-video allowlist that overrides `excludePlaylists`. The
   * "Discussion / News / Speculation" playlist mixes off-topic news/game/hobby
   * videos with genuine in-universe lore deep-dives (e.g. "Belisarius Cawl",
   * "The Silent Death of the STC"); those lore videos are curated back in here
   * by id. An id that is not actually on the denylist is a harmless no-op. Empty
   * for RSS shows. Video ids are permanent, so the list never goes stale.
   */
  includeVideoIds: string[];
  /**
   * Title-substring patterns (case-insensitive) whose matching episodes are
   * EXCLUDED at BOTH detection (the refresh report) and ingest (never written to
   * the artifact/DB). The RSS analogue of the YouTube playlist denylist: a feed
   * that publishes audio + video twins of each episode (e.g. Lorehammer's
   * "(Video) …" items) lists `["(Video)"]` here to keep only the audio cut.
   * Honored for any source; empty for shows that don't need it. (Philipp 2026-06-09.)
   */
  excludeTitlePatterns: string[];
}

/**
 * Per-service link defaults — the Brief 128 link matrix as data. `serviceId` →
 * the `external_link_kind`, the `source_kind` provenance, and the default
 * confidence a show/episode link of that service carries.
 */
export const SERVICE_LINK_SPEC: Record<
  string,
  { kind: ExternalLinkKind; sourceKind: PodcastLinkSourceKind; confidence: number }
> = {
  rss: { kind: "listen", sourceKind: "podcast_rss", confidence: 1 },
  apple_podcasts: { kind: "listen", sourceKind: "manual", confidence: 1 },
  spotify: { kind: "listen", sourceKind: "manual", confidence: 1 },
  official_website: { kind: "official_page", sourceKind: "manual", confidence: 1 },
  youtube: { kind: "watch", sourceKind: "manual", confidence: 1 },
};

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

/** Optional string|null field — coerces a present non-string to error, absent → null. */
function optString(o: Record<string, unknown>, key: string, where: string): string | null {
  const v = o[key];
  if (v === undefined || v === null) return null;
  if (typeof v !== "string" || v.trim() === "") {
    throw new Error(`${where}.${key}: must be a non-empty string when present`);
  }
  return v;
}

/** `source` discriminator — absent → the default (`rss`); else must be a known source. */
function parseSource(o: Record<string, unknown>, where: string): PodcastSource {
  const v = o.source;
  if (v === undefined || v === null) return DEFAULT_PODCAST_SOURCE;
  if (typeof v !== "string" || !PODCAST_SOURCES.includes(v as PodcastSource)) {
    throw new Error(
      `${where}.source "${String(v)}" must be one of ${PODCAST_SOURCES.map((s) => `"${s}"`).join(" | ")}`,
    );
  }
  return v as PodcastSource;
}

/** Optional `string[]` of playlist titles to exclude — absent → `[]`. */
function parseExcludePlaylists(
  o: Record<string, unknown>,
  source: PodcastSource,
  where: string,
): string[] {
  const v = o.excludePlaylists;
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) throw new Error(`${where}.excludePlaylists: must be an array of strings`);
  const titles = v.map((t, i) => {
    if (typeof t !== "string" || t.trim() === "") {
      throw new Error(`${where}.excludePlaylists[${i}]: must be a non-empty string`);
    }
    return t;
  });
  // A denylist is only meaningful for a YouTube source (RSS has no playlists);
  // a non-empty list on an RSS entry is a config mistake, surfaced loudly.
  if (titles.length > 0 && source !== "youtube") {
    throw new Error(`${where}.excludePlaylists: only valid for source "youtube" (got "${source}")`);
  }
  return titles;
}

/** Optional `string[]` of video ids to force-include past the denylist — absent → `[]`. */
function parseIncludeVideoIds(
  o: Record<string, unknown>,
  source: PodcastSource,
  where: string,
): string[] {
  const v = o.includeVideoIds;
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) throw new Error(`${where}.includeVideoIds: must be an array of strings`);
  const ids = v.map((t, i) => {
    if (typeof t !== "string" || t.trim() === "") {
      throw new Error(`${where}.includeVideoIds[${i}]: must be a non-empty string`);
    }
    return t;
  });
  // Like the denylist, a per-video include override only makes sense for YouTube.
  if (ids.length > 0 && source !== "youtube") {
    throw new Error(`${where}.includeVideoIds: only valid for source "youtube" (got "${source}")`);
  }
  return ids;
}

/**
 * Optional `string[]` of case-insensitive title-substring patterns to exclude —
 * absent → `[]`. Unlike the YouTube-only denylists above, this is valid for ANY
 * source (an RSS feed is the primary user: dropping "(Video)" twins).
 */
function parseExcludeTitlePatterns(o: Record<string, unknown>, where: string): string[] {
  const v = o.excludeTitlePatterns;
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) throw new Error(`${where}.excludeTitlePatterns: must be an array of strings`);
  return v.map((t, i) => {
    if (typeof t !== "string" || t.trim() === "") {
      throw new Error(`${where}.excludeTitlePatterns[${i}]: must be a non-empty string`);
    }
    return t;
  });
}

function parseLink(raw: unknown, where: string): RegistryLinkInput {
  if (!isObject(raw)) throw new Error(`${where}: must be an object`);
  const serviceId = reqString(raw, "serviceId", where);
  const url = reqString(raw, "url", where);
  const spec = SERVICE_LINK_SPEC[serviceId];

  const out: RegistryLinkInput = { serviceId, url };

  if (raw.kind !== undefined) {
    if (!EXTERNAL_LINK_KINDS.includes(raw.kind as ExternalLinkKind)) {
      throw new Error(`${where}.kind "${String(raw.kind)}" is not a known external_link_kind`);
    }
    out.kind = raw.kind as ExternalLinkKind;
  }
  if (raw.sourceKind !== undefined) {
    if (!PODCAST_LINK_SOURCE_KINDS.includes(raw.sourceKind as PodcastLinkSourceKind)) {
      throw new Error(
        `${where}.sourceKind "${String(raw.sourceKind)}" must be one of ${PODCAST_LINK_SOURCE_KINDS.join("|")}`,
      );
    }
    out.sourceKind = raw.sourceKind as PodcastLinkSourceKind;
  }
  if (raw.confidence !== undefined) {
    // Bound to [0, 1] up front so a bad registry fails here, not later at S3's
    // `external_links.confidence numeric(3,2)` Postgres constraint.
    if (
      typeof raw.confidence !== "number" ||
      !Number.isFinite(raw.confidence) ||
      raw.confidence < 0 ||
      raw.confidence > 1
    ) {
      throw new Error(`${where}.confidence: must be a number in [0, 1]`);
    }
    out.confidence = raw.confidence;
  }

  // A service with no spec default must spell out kind+sourceKind+confidence so
  // `enrich` (links.ts) can always produce a complete link.
  if (spec === undefined) {
    if (out.kind === undefined || out.sourceKind === undefined || out.confidence === undefined) {
      throw new Error(
        `${where}.serviceId "${serviceId}" has no SERVICE_LINK_SPEC default — ` +
          `provide explicit kind, sourceKind and confidence`,
      );
    }
  }
  return out;
}

/**
 * Validate + narrow the raw registry JSON to `PodcastShowConfig[]`. Pure (no
 * filesystem). Throws on the first malformed entry — slugs must be unique, the
 * core string fields present, and every link well-formed.
 */
export function parseRegistry(raw: unknown): PodcastShowConfig[] {
  if (!Array.isArray(raw)) throw new Error("registry: top-level must be an array");
  const slugs = new Set<string>();
  return raw.map((entry, i) => {
    const where = `registry[${i}]`;
    if (!isObject(entry)) throw new Error(`${where}: must be an object`);

    const slug = reqString(entry, "slug", where);
    if (slugs.has(slug)) throw new Error(`${where}.slug: duplicate slug "${slug}"`);
    slugs.add(slug);

    const source = parseSource(entry, where);

    const links =
      entry.links === undefined || entry.links === null
        ? []
        : Array.isArray(entry.links)
          ? entry.links.map((l, j) => parseLink(l, `${where}.links[${j}]`))
          : (() => {
              throw new Error(`${where}.links: must be an array`);
            })();

    return {
      slug,
      source,
      title: reqString(entry, "title", where),
      feedUrl: reqString(entry, "feedUrl", where),
      appleId: optString(entry, "appleId", where),
      podcastGuid: optString(entry, "podcastGuid", where),
      links,
      youtubeChannelUrl: optString(entry, "youtubeChannelUrl", where),
      youtubeChannelId: optString(entry, "youtubeChannelId", where),
      excludePlaylists: parseExcludePlaylists(entry, source, where),
      includeVideoIds: parseIncludeVideoIds(entry, source, where),
      excludeTitlePatterns: parseExcludeTitlePatterns(entry, where),
    };
  });
}

/** Read + validate the committed registry from disk. */
export function loadRegistry(path: string = REGISTRY_PATH): PodcastShowConfig[] {
  const raw: unknown = JSON.parse(readFileSync(path, "utf8"));
  return parseRegistry(raw);
}

/** Find a show by slug or throw (listing available slugs to aid the caller). */
export function getShow(registry: PodcastShowConfig[], slug: string): PodcastShowConfig {
  const found = registry.find((s) => s.slug === slug);
  if (!found) {
    throw new Error(
      `registry: no show with slug "${slug}" (have: ${registry.map((s) => s.slug).join(", ")})`,
    );
  }
  return found;
}

/**
 * Resolve which shows a run targets — the pure core of the ingest CLI:
 *   • `--all`        → every registered show, in registry order;
 *   • `--show <slug>`→ just that show (throws on an unknown slug);
 *   • neither        → the default (pilot) show.
 */
export function selectShows(
  registry: PodcastShowConfig[],
  opts: { all?: boolean; show?: string },
): PodcastShowConfig[] {
  if (opts.all) return [...registry];
  return [getShow(registry, opts.show ?? DEFAULT_SHOW_SLUG)];
}

/**
 * Whether an episode title matches any exclude pattern (case-insensitive
 * substring). Shared by the refresh diff (detection) and the ingest acquire
 * (write path) so the two never drift. Empty patterns → never excluded.
 */
export function isTitleExcluded(title: string, patterns: readonly string[]): boolean {
  if (patterns.length === 0) return false;
  const t = title.toLowerCase();
  return patterns.some((p) => t.includes(p.toLowerCase()));
}

/**
 * Apply a show's `excludeTitlePatterns` to a freshly-acquired episode list —
 * the ingest-side twin filter (Brief 175). This is the exact filter
 * `acquireFeed` (scripts/ingest-podcast.ts) runs on every RSS acquire, exported
 * so a test can prove a cold re-ingest of e.g. Lorehammer would drop the
 * "(Video)" twins instead of re-introducing them. `dropped` is reported so the
 * caller can log the exclusion (counted, never silent).
 */
export function dropExcludedTitles<T extends { title: string }>(
  episodes: readonly T[],
  patterns: readonly string[],
): { kept: T[]; dropped: number } {
  const kept = episodes.filter((e) => !isTitleExcluded(e.title, patterns));
  return { kept, dropped: episodes.length - kept.length };
}
