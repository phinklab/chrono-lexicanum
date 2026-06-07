/**
 * Brief 122 B1-S2 — deterministic cross-media link assembly for the artifact.
 *
 * Show links: for an RSS show the feed (from `feedUrl`) and the Apple page (from
 * `appleId`) are DERIVED; everything else (official site, Spotify, YouTube
 * channel) comes verbatim from the registry entry's `links[]`. Episode links:
 * the RSS audio enclosure as a `listen`/`rss`/`podcast_rss` link.
 *
 * Brief 130 makes both builders SOURCE-AWARE — the single deliberately
 * source-aware seam in the pipeline (`ParsedFeed` itself carries no provenance,
 * so the source is passed explicitly, never guessed from a URL shape):
 *   • A `youtube` show derives NO `rss` feed link from `feedUrl` (that value is
 *     an identity string, not a listenable RSS feed); it keeps only its
 *     registry links (the YouTube channel link).
 *   • A `youtube` episode carries one `watch`/`youtube`/`youtube` link to its
 *     video page (the per-episode analogue of the RSS audio enclosure) instead
 *     of an audio enclosure.
 *
 * Every builder dedups by `(serviceId, kind, url)` and sorts by the same key, so
 * the committed artifact is byte-stable regardless of input order (the Brief 110
 * determinism contract, extended to links). Pure — no I/O — so it unit-tests
 * cleanly alongside the rest of the lib.
 */
import {
  DEFAULT_PODCAST_SOURCE,
  SERVICE_LINK_SPEC,
  type PodcastShowConfig,
  type PodcastSource,
  type RegistryLinkInput,
} from "./registry";
import type { PodcastEpisode, PodcastLink } from "./types";

/** Canonical, region-neutral Apple Podcasts show URL from a numeric collection id. */
export function appleUrlFromId(appleId: string): string {
  return `https://podcasts.apple.com/podcast/id${appleId}`;
}

/**
 * Complete a registry link input into a full `PodcastLink`, filling
 * `kind`/`sourceKind`/`confidence` from `SERVICE_LINK_SPEC` unless the entry
 * overrode them. Throws if a service has no spec default and the entry left a
 * field unset (the registry parser already guards this, so this is defence in
 * depth for programmatic callers).
 */
export function enrichLink(input: RegistryLinkInput): PodcastLink {
  const spec = SERVICE_LINK_SPEC[input.serviceId];
  const kind = input.kind ?? spec?.kind;
  const sourceKind = input.sourceKind ?? spec?.sourceKind;
  const confidence = input.confidence ?? spec?.confidence;
  if (kind === undefined || sourceKind === undefined || confidence === undefined) {
    throw new Error(
      `link for serviceId "${input.serviceId}" is under-specified ` +
        `(no SERVICE_LINK_SPEC default and no explicit kind/sourceKind/confidence)`,
    );
  }
  return { serviceId: input.serviceId, kind, url: input.url, sourceKind, confidence };
}

function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Sort links deterministically by (serviceId, kind, url). */
export function sortLinks(links: readonly PodcastLink[]): PodcastLink[] {
  return [...links].sort(
    (a, b) => cmp(a.serviceId, b.serviceId) || cmp(a.kind, b.kind) || cmp(a.url, b.url),
  );
}

/**
 * Dedup by (serviceId, kind, url) — first occurrence wins — then sort. The key
 * is a JSON-encoded tuple, so no field boundary can be forged (a separator
 * character inside one value can never collide two distinct links).
 */
function dedupSort(links: PodcastLink[]): PodcastLink[] {
  const seen = new Map<string, PodcastLink>();
  for (const l of links) {
    const key = JSON.stringify([l.serviceId, l.kind, l.url]);
    if (!seen.has(key)) seen.set(key, l);
  }
  return sortLinks([...seen.values()]);
}

/**
 * Show-level links. For an RSS show: the derived RSS feed (from `feedUrl`) +
 * (when present) the derived Apple page (from `appleId`), then the registry's
 * explicit links. For a YouTube show (`config.source === "youtube"`): NO derived
 * `rss` link — `feedUrl` is an identity string, not a listenable feed — only the
 * registry's explicit links (the YouTube channel link). Deduped + sorted.
 */
export function buildShowLinks(config: PodcastShowConfig): PodcastLink[] {
  const links: PodcastLink[] = [];
  if (config.source === "rss") {
    links.push(enrichLink({ serviceId: "rss", url: config.feedUrl }));
    if (config.appleId) {
      links.push(enrichLink({ serviceId: "apple_podcasts", url: appleUrlFromId(config.appleId) }));
    }
  }
  for (const l of config.links) links.push(enrichLink(l));
  return dedupSort(links);
}

/**
 * Episode-level links, source-aware (the source is passed explicitly, never
 * inferred from `audioUrl`/`link`/URL domains — Brief 130):
 *   • `rss`     — the audio enclosure (`ep.audioUrl`) as a
 *     `listen`/`rss`/`podcast_rss` link. An episode without an enclosure (rare)
 *     yields no links.
 *   • `youtube` — the video page (`ep.link`) as a `watch`/`youtube`/`youtube`
 *     link (provenance `youtube`, confidence 1). A YouTube episode always has a
 *     watch URL; a missing one yields no links rather than a malformed entry.
 */
export function buildEpisodeLinks(
  ep: PodcastEpisode,
  source: PodcastSource = DEFAULT_PODCAST_SOURCE,
): PodcastLink[] {
  const links: PodcastLink[] = [];
  if (source === "youtube") {
    if (ep.link) {
      links.push(
        enrichLink({
          serviceId: "youtube",
          kind: "watch",
          url: ep.link,
          sourceKind: "youtube",
          confidence: 1,
        }),
      );
    }
  } else if (ep.audioUrl) {
    links.push(enrichLink({ serviceId: "rss", url: ep.audioUrl }));
  }
  return dedupSort(links);
}
