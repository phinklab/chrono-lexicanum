/**
 * Brief 122 B1-S2 — deterministic cross-media link assembly for the artifact.
 *
 * Show links: the RSS feed (from `feedUrl`) and the Apple page (from `appleId`)
 * are DERIVED; everything else (official site, Spotify, YouTube channel) comes
 * verbatim from the registry entry's `links[]`. Episode links: the RSS audio
 * enclosure as a `listen`/`rss`/`podcast_rss` link.
 *
 * Every builder dedups by `(serviceId, kind, url)` and sorts by the same key, so
 * the committed artifact is byte-stable regardless of input order (the Brief 110
 * determinism contract, extended to links). Pure — no I/O — so it unit-tests
 * cleanly alongside the rest of the lib.
 */
import {
  SERVICE_LINK_SPEC,
  type PodcastShowConfig,
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
 * Show-level links: derived RSS feed + (when present) derived Apple page, then
 * the registry's explicit links. Deduped + sorted.
 */
export function buildShowLinks(config: PodcastShowConfig): PodcastLink[] {
  const links: PodcastLink[] = [enrichLink({ serviceId: "rss", url: config.feedUrl })];
  if (config.appleId) {
    links.push(enrichLink({ serviceId: "apple_podcasts", url: appleUrlFromId(config.appleId) }));
  }
  for (const l of config.links) links.push(enrichLink(l));
  return dedupSort(links);
}

/**
 * Episode-level links: the RSS audio enclosure as a `listen`/`rss`/`podcast_rss`
 * link. An episode without an enclosure (rare) yields no links.
 */
export function buildEpisodeLinks(ep: PodcastEpisode): PodcastLink[] {
  const links: PodcastLink[] = [];
  if (ep.audioUrl) links.push(enrichLink({ serviceId: "rss", url: ep.audioUrl }));
  return dedupSort(links);
}
