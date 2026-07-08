/**
 * YouTube-source acquisition adapter.
 *
 * A second source-acquisition path beside the RSS `feed.ts`, for a channel that
 * publishes lore ONLY on YouTube (no RSS feed). It fetches the channel's uploads
 * via the YouTube Data API v3 and maps them into the SAME `ParsedFeed` contract
 * (`{ show: ParsedShowMeta, episodes: PodcastEpisode[] }`) the RSS path produces,
 * so the downstream (LLM extract → alias resolve → artifact assembly → apply)
 * stays unchanged and source-agnostic. Only acquisition + the per-episode/show
 * link shape are source-aware (the latter lives in `links.ts`).
 *
 * Design mirrors `feed.ts`'s network/pure split so the mapping unit-tests
 * against a committed fixture with NO network and NO API key:
 *   - PURE (exported, fixture-tested): `parseIso8601Duration`, `mapChannelItem`,
 *     `mapVideoToEpisode`, `resolveExcludedPlaylistIds`, `selectUploadVideoIds`.
 *   - NETWORK (orchestrator): `fetchYoutubeFeed` wires the Data API GETs onto the
 *     pure mappers. The API key is passed in explicitly (read from
 *     `process.env.YOUTUBE_API_KEY` by the caller) — this module never touches
 *     `process.env`, so it stays env-free and testable.
 *
 * HARD constraint: metadata only. Pure HTTP GETs against the Data
 * API v3 — never download video or audio, in any path.
 *
 * Acquisition flow (backfill + incremental are identical — idempotent re-run):
 *   1. channels.list (forHandle | id)  → channel id, title, avatar, uploads (UU…)
 *   2. playlistItems.list (uploads)    → every upload's videoId + videoPublishedAt
 *   3. playlists.list + playlistItems  → resolve `excludePlaylists` titles → ids →
 *      collect their member video ids into a denylist
 *   4. select (exclude denylist, newest-first, optional --limit)
 *   5. videos.list (50-batches)        → title, description, publishedAt, duration
 */
import type { ParsedFeed } from "./feed";
import type { PodcastShowConfig } from "./registry";
import type { ParsedShowMeta, PodcastEpisode } from "./types";

const UA =
  "ChronoLexicanum/0.1 (https://github.com/phinklab/chrono-lexicanum; p.kuenzler@web.de)";

const API_BASE = "https://www.googleapis.com/youtube/v3";
const PAGE_SIZE = 50;
/** Defensive cap so a misbehaving `nextPageToken` can never loop forever. */
const MAX_PAGES = 1_000;

// Value narrowing (Data API returns JSON → unknown)

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

/** Canonical channel-id-bound uploads-feed URL — the stable `feedUrl` identity. */
export function uploadsFeedUrl(channelId: string): string {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
}

/** Watch-page URL for a video id — the per-episode `link` and `watch` link. */
export function watchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

// Pure: ISO-8601 duration → seconds

const ISO_DURATION_RE = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;

/**
 * Parse a YouTube `contentDetails.duration` (ISO-8601 duration, e.g. `PT1H2M3S`)
 * into whole seconds. The repo's existing `parseDurationToSeconds` only handles
 * the RSS `HH:MM:SS` form, so YouTube needs this dedicated parser.
 *
 * Returns `null` for an absent/empty/malformed value AND for a zero-length
 * duration (`P0D`, `PT0S`, `PT`) — a 0-second duration is not useful metadata,
 * so `null` ("unknown") is the honest value. Handles an
 * optional leading day component (`P#DT…`) for very long live VODs.
 */
export function parseIso8601Duration(raw: string | null): number | null {
  if (raw === null) return null;
  const s = raw.trim();
  if (s === "") return null;
  const m = ISO_DURATION_RE.exec(s);
  if (!m) return null;
  const days = m[1] ? Number.parseInt(m[1], 10) : 0;
  const hours = m[2] ? Number.parseInt(m[2], 10) : 0;
  const mins = m[3] ? Number.parseInt(m[3], 10) : 0;
  const secs = m[4] ? Number.parseInt(m[4], 10) : 0;
  const total = ((days * 24 + hours) * 60 + mins) * 60 + secs;
  return total > 0 ? total : null;
}

// Pure: misc field mapping

/** Collapse whitespace to single spaces (YouTube descriptions are already plain
 *  text; this matches the RSS path's final `htmlToText` whitespace pass so the
 *  tagging input has the same shape regardless of source). */
function normalizeDescription(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** RFC-3339 `publishedAt` → ISO 8601 (`…​.000Z`), mirroring `feed.ts`'s
 *  `normalizePubDate`, so cross-source pubDates sort and render identically. */
function normalizePublishedAt(raw: string | null): string | null {
  if (raw === null || raw.trim() === "") return null;
  const t = Date.parse(raw);
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString();
}

/** Best available thumbnail URL from a `snippet.thumbnails` object. */
function pickThumbnail(thumbnails: unknown): string | null {
  const rec = asRecord(thumbnails);
  if (!rec) return null;
  for (const size of ["high", "standard", "maxres", "medium", "default"]) {
    const url = asString(asRecord(rec[size])?.url);
    if (url) return url;
  }
  // Fall back to any thumbnail object's url.
  for (const v of Object.values(rec)) {
    const url = asString(asRecord(v)?.url);
    if (url) return url;
  }
  return null;
}

// Pure: channel item → show meta + ids

export interface ChannelResolution {
  channelId: string;
  uploadsPlaylistId: string;
  show: ParsedShowMeta;
}

/**
 * Map a `channels.list` item to the show metadata plus the two ids the adapter
 * needs: the channel id and the uploads playlist id
 * (`contentDetails.relatedPlaylists.uploads`). Throws if either id is missing —
 * a channel without an uploads playlist is unusable, and we fail loud rather
 * than silently emit an empty show.
 */
export function mapChannelItem(item: unknown): ChannelResolution {
  const rec = asRecord(item);
  if (!rec) throw new Error("youtube: channels.list item is not an object");
  const channelId = asString(rec.id);
  if (!channelId) throw new Error("youtube: channels.list item has no `id`");
  const snippet = asRecord(rec.snippet);
  const relatedPlaylists = asRecord(asRecord(rec.contentDetails)?.relatedPlaylists);
  const uploadsPlaylistId = asString(relatedPlaylists?.uploads);
  if (!uploadsPlaylistId) {
    throw new Error(`youtube: channel ${channelId} has no contentDetails.relatedPlaylists.uploads`);
  }
  const show: ParsedShowMeta = {
    title: asString(snippet?.title) ?? "",
    podcastGuid: null, // YouTube has no podcast:guid
    imageUrl: pickThumbnail(snippet?.thumbnails),
  };
  return { channelId, uploadsPlaylistId, show };
}

// Pure: video item → episode

/**
 * Map a `videos.list` item (`part=snippet,contentDetails`) to a `PodcastEpisode`
 * — the same internal shape the RSS parser yields. Returns `null` for an item
 * with no usable video id (defensive; the caller skips it). `audioUrl` is always
 * `null` (no enclosure); `season`/`episode` are always `null` (YouTube has no
 * numbering). The watch URL is the `link`.
 */
export function mapVideoToEpisode(item: unknown): PodcastEpisode | null {
  const rec = asRecord(item);
  if (!rec) return null;
  const videoId = asString(rec.id);
  if (!videoId) return null;
  const snippet = asRecord(rec.snippet);
  const contentDetails = asRecord(rec.contentDetails);
  return {
    guid: videoId,
    title: asString(snippet?.title) ?? "",
    descriptionText: normalizeDescription(asString(snippet?.description) ?? ""),
    pubDate: normalizePublishedAt(asString(snippet?.publishedAt)),
    durationSec: parseIso8601Duration(asString(contentDetails?.duration)),
    audioUrl: null,
    link: watchUrl(videoId),
    season: null,
    episode: null,
  };
}

// Pure: exclude-playlist title resolution

export interface ChannelPlaylist {
  id: string;
  title: string;
}

/**
 * Resolve the registry's `excludePlaylists` TITLES to playlist ids against the
 * channel's own playlists (exact title match). A requested title that matches no
 * playlist throws, listing the available titles — so a renamed playlist fails
 * LOUDLY instead of silently leaking its (unwanted) videos into the ingest. A
 * title matching several playlists excludes all of them (defensive). Pure.
 */
export function resolveExcludedPlaylistIds(
  playlists: readonly ChannelPlaylist[],
  titles: readonly string[],
): string[] {
  if (titles.length === 0) return [];
  const wanted = new Set(titles);
  const matched = playlists.filter((p) => wanted.has(p.title));
  const matchedTitles = new Set(matched.map((p) => p.title));
  const missing = titles.filter((t) => !matchedTitles.has(t));
  if (missing.length > 0) {
    const available = playlists.map((p) => `"${p.title}"`).join(", ");
    throw new Error(
      `youtube: excludePlaylists not found on channel: ${missing.map((t) => `"${t}"`).join(", ")} — ` +
        `available playlists: ${available || "(none)"}`,
    );
  }
  // Stable, de-duplicated id list.
  return [...new Set(matched.map((p) => p.id))];
}

// Pure: per-video include override

/**
 * Apply the registry's `includeVideoIds` allowlist ON TOP of the playlist
 * denylist: remove each force-included id from `excludedIds` so it survives
 * selection even though a denylisted playlist contains it (rescuing genuine
 * lore videos filed under an otherwise-denylisted playlist).
 * Returns a fresh set plus `reincluded` (how many ids were actually on the
 * denylist — an include id that was not excluded is a harmless no-op, counted
 * separately so the run report can flag a stale/typo'd id). Pure.
 */
export function applyIncludeOverrides(
  excludedIds: ReadonlySet<string>,
  includeVideoIds: readonly string[],
): { excludedIds: Set<string>; reincluded: number } {
  const out = new Set(excludedIds);
  let reincluded = 0;
  for (const id of includeVideoIds) {
    if (out.delete(id)) reincluded += 1;
  }
  return { excludedIds: out, reincluded };
}

// Pure: upload selection

export interface UploadRef {
  videoId: string;
  /** `contentDetails.videoPublishedAt` (ISO 8601) — newest-first ordering key. */
  videoPublishedAt: string | null;
}

/**
 * Select which upload video ids to ingest: drop any id in the `excludedIds`
 * denylist, order newest-first by `videoPublishedAt` (nulls last; tie-broken by
 * videoId so the order is total + deterministic), then take the first `limit`
 * (all when `limit` is undefined). Pure — the selection logic the orchestrator
 * leans on, unit-tested without network.
 */
export function selectUploadVideoIds(
  uploads: readonly UploadRef[],
  excludedIds: ReadonlySet<string>,
  limit?: number,
): string[] {
  const seen = new Set<string>();
  const kept: UploadRef[] = [];
  for (const u of uploads) {
    if (!u.videoId || excludedIds.has(u.videoId) || seen.has(u.videoId)) continue;
    seen.add(u.videoId);
    kept.push(u);
  }
  kept.sort((a, b) => {
    const ad = a.videoPublishedAt;
    const bd = b.videoPublishedAt;
    if (ad !== bd) {
      if (ad === null) return 1; // nulls last
      if (bd === null) return -1;
      return ad < bd ? 1 : -1; // newest first
    }
    return a.videoId < b.videoId ? 1 : a.videoId > b.videoId ? -1 : 0;
  });
  const ids = kept.map((u) => u.videoId);
  return limit !== undefined ? ids.slice(0, limit) : ids;
}

// Network layer

/** One GET against the Data API v3. Throws on non-2xx (with a body snippet, as
 *  the API returns a JSON error envelope) so the caller surfaces the failure. */
async function ytGet(
  path: string,
  params: Record<string, string>,
  apiKey: string,
): Promise<Record<string, unknown>> {
  const qs = new URLSearchParams({ ...params, key: apiKey }).toString();
  const url = `${API_BASE}/${path}?${qs}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.text()).slice(0, 500);
    } catch {
      /* ignore */
    }
    // Never echo the key in an error message (it is in `url`, not in `path`).
    throw new Error(`youtube: ${res.status} ${res.statusText} for ${path} ${detail}`.trim());
  }
  const json: unknown = await res.json();
  const rec = asRecord(json);
  if (!rec) throw new Error(`youtube: ${path} returned a non-object body`);
  return rec;
}

/** Resolve the channel by explicit id (preferred) or by the `@handle` parsed
 *  from `youtubeChannelUrl`. Throws if neither is available or no channel matches. */
async function resolveChannel(cfg: PodcastShowConfig, apiKey: string): Promise<unknown> {
  const params: Record<string, string> = { part: "snippet,contentDetails" };
  if (cfg.youtubeChannelId) {
    params.id = cfg.youtubeChannelId;
  } else {
    const handle = parseHandle(cfg.youtubeChannelUrl);
    if (!handle) {
      throw new Error(
        `youtube: show "${cfg.slug}" needs either youtubeChannelId or an @handle in youtubeChannelUrl`,
      );
    }
    params.forHandle = handle;
  }
  const body = await ytGet("channels", params, apiKey);
  const items = asArray(body.items);
  if (items.length === 0) {
    throw new Error(
      `youtube: no channel for show "${cfg.slug}" (${cfg.youtubeChannelId ?? cfg.youtubeChannelUrl})`,
    );
  }
  return items[0];
}

/** Extract a bare handle (`luetin09`) from a `…/@luetin09` URL or a raw `@handle`. */
export function parseHandle(channelUrl: string | null): string | null {
  if (!channelUrl) return null;
  const m = /@([^/?#\s]+)/.exec(channelUrl);
  return m ? m[1] : null;
}

/** Paginate a playlist's items → `{ videoId, videoPublishedAt }[]` plus the
 *  reported total. Items missing a videoId (rare) are skipped, not fatal. */
async function listAllPlaylistRefs(
  playlistId: string,
  apiKey: string,
): Promise<{ uploads: UploadRef[]; totalResults: number }> {
  const uploads: UploadRef[] = [];
  let totalResults = 0;
  let pageToken: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const params: Record<string, string> = {
      part: "contentDetails",
      playlistId,
      maxResults: String(PAGE_SIZE),
    };
    if (pageToken) params.pageToken = pageToken;
    const body = await ytGet("playlistItems", params, apiKey);
    if (page === 0) {
      totalResults = Number(asRecord(body.pageInfo)?.totalResults ?? 0) || 0;
    }
    for (const raw of asArray(body.items)) {
      const cd = asRecord(asRecord(raw)?.contentDetails);
      const videoId = asString(cd?.videoId);
      if (!videoId) continue;
      uploads.push({ videoId, videoPublishedAt: asString(cd?.videoPublishedAt) });
    }
    const next = asString(body.nextPageToken);
    if (!next) return { uploads, totalResults };
    pageToken = next;
  }
  throw new Error(`youtube: playlist ${playlistId} exceeded ${MAX_PAGES} pages (pagination loop?)`);
}

/** Paginate a channel's own playlists → `{ id, title }[]`. */
async function listAllChannelPlaylists(
  channelId: string,
  apiKey: string,
): Promise<ChannelPlaylist[]> {
  const out: ChannelPlaylist[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const params: Record<string, string> = {
      part: "snippet",
      channelId,
      maxResults: String(PAGE_SIZE),
    };
    if (pageToken) params.pageToken = pageToken;
    const body = await ytGet("playlists", params, apiKey);
    for (const raw of asArray(body.items)) {
      const rec = asRecord(raw);
      const id = asString(rec?.id);
      const title = asString(asRecord(rec?.snippet)?.title);
      if (id && title !== null) out.push({ id, title });
    }
    const next = asString(body.nextPageToken);
    if (!next) return out;
    pageToken = next;
  }
  throw new Error(`youtube: channel ${channelId} playlists exceeded ${MAX_PAGES} pages`);
}

/** Hydrate selected video ids (50-batches) → raw `videos.list` items. Private or
 *  deleted ids simply do not come back; the caller counts them as skipped. */
async function hydrateVideos(videoIds: readonly string[], apiKey: string): Promise<unknown[]> {
  const items: unknown[] = [];
  for (let i = 0; i < videoIds.length; i += PAGE_SIZE) {
    const batch = videoIds.slice(i, i + PAGE_SIZE);
    const body = await ytGet(
      "videos",
      { part: "snippet,contentDetails", id: batch.join(",") },
      apiKey,
    );
    for (const raw of asArray(body.items)) items.push(raw);
  }
  return items;
}

// Orchestrator

export interface FetchYoutubeOptions {
  /** Read from `process.env.YOUTUBE_API_KEY` by the caller (never by this lib). */
  apiKey: string;
  /** Cap the number of (newest, non-excluded) episodes — mirrors RSS `--limit`. */
  limit?: number;
}

/**
 * The `ParsedFeed` contract plus the YouTube-only provenance the ingest needs:
 * the resolved channel id, the canonical uploads-feed URL (the real `feedUrl`
 * identity, only knowable after the live channel resolve), and acquisition
 * stats for the run report / open questions.
 */
export interface YoutubeFeedResult extends ParsedFeed {
  channelId: string;
  canonicalFeedUrl: string;
  /** `pageInfo.totalResults` of the uploads playlist — the backfill dimension. */
  totalUploads: number;
  /** Distinct video ids on the denylist AFTER the include-override (the count
   *  that actually suppressed uploads). */
  excludedVideoCount: number;
  /** Denylisted ids force-included back via `includeVideoIds` (curation reach). */
  reincludedVideoCount: number;
  /** Selected ids that `videos.list` did not return (private/deleted) — skipped. */
  skippedUnavailable: number;
}

/**
 * Fetch a YouTube channel's uploads and map them into the `ParsedFeed` contract.
 * Network orchestration only — every transform is a pure exported helper above.
 */
export async function fetchYoutubeFeed(
  cfg: PodcastShowConfig,
  opts: FetchYoutubeOptions,
): Promise<YoutubeFeedResult> {
  const { apiKey, limit } = opts;
  if (!apiKey) throw new Error("fetchYoutubeFeed: a non-empty YOUTUBE_API_KEY is required");

  // 1. Channel → ids + show meta.
  const channelItem = await resolveChannel(cfg, apiKey);
  const { channelId, uploadsPlaylistId, show } = mapChannelItem(channelItem);

  // 2. Every upload (id + publishedAt) + the total.
  const { uploads, totalResults } = await listAllPlaylistRefs(uploadsPlaylistId, apiKey);

  // 3. Build the exclusion denylist from the named playlists.
  const denylistIds = new Set<string>();
  if (cfg.excludePlaylists.length > 0) {
    const channelPlaylists = await listAllChannelPlaylists(channelId, apiKey);
    const excludedPlaylistIds = resolveExcludedPlaylistIds(channelPlaylists, cfg.excludePlaylists);
    for (const plId of excludedPlaylistIds) {
      const { uploads: members } = await listAllPlaylistRefs(plId, apiKey);
      for (const m of members) denylistIds.add(m.videoId);
    }
  }

  // 3b. Force-include the curated lore videos back past the denylist.
  const { excludedIds, reincluded } = applyIncludeOverrides(denylistIds, cfg.includeVideoIds);

  // 4. Select (exclude, newest-first, optional limit).
  const selectedIds = selectUploadVideoIds(uploads, excludedIds, limit);

  // 5. Hydrate + map, preserving selection order; skip unavailable ids.
  const videoItems = await hydrateVideos(selectedIds, apiKey);
  const byId = new Map<string, unknown>();
  for (const item of videoItems) {
    const id = asString(asRecord(item)?.id);
    if (id) byId.set(id, item);
  }
  const episodes: PodcastEpisode[] = [];
  let skippedUnavailable = 0;
  for (const id of selectedIds) {
    const item = byId.get(id);
    const ep = item ? mapVideoToEpisode(item) : null;
    if (ep) episodes.push(ep);
    else skippedUnavailable += 1;
  }

  return {
    show,
    episodes,
    channelId,
    canonicalFeedUrl: uploadsFeedUrl(channelId),
    totalUploads: totalResults,
    excludedVideoCount: excludedIds.size,
    reincludedVideoCount: reincluded,
    skippedUnavailable,
  };
}
