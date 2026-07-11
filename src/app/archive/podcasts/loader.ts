/**
 * Public podcast data layer — DB-FREE façade (Launch S1b Loader-Weiche).
 *
 * Podcasts are the second media pillar next to books. A `kind='podcast'` show
 * work (→ `podcastDetails`) owns many `kind='podcast_episode'` works
 * (→ `podcastEpisodeDetails.podcastWorkId`). There is deliberately no `show`
 * relation on the episode self-link, so the show→episodes hop runs through an
 * explicit `podcastWorkId` filter, not a relation.
 *
 * Two reader projections:
 *   - `loadPodcastIndex()`   → the /podcasts hall: one row per show + platform
 *     links + a 3-episode teaser, busiest show first.
 *   - `loadPodcastShow(slug)` → /podcasts/[slug]: one show + ALL its episodes,
 *     entity-tagged, newest first, shaped for the client archive island.
 *
 * Source switch: the prerender-relevant projections (index + search) read the
 * committed snapshot at build time and lazy-import `./loader-live` (the
 * Postgres bodies) at request time; show details render on demand only and go
 * straight to the live module. This module must never statically import
 * `@/db` — the DB-free CI build depends on it. Episode `pubDate` crosses into
 * a client component, so it is exposed as epoch-ms (`pubDateMs`), never a `Date`.
 *
 * Note on the episode URL — two shapes:
 *   - RSS shows: one per-episode `external_links(listen)`, its url the same MP3
 *     enclosure as `podcast_episode_details.audio_url` (1:1). The reader exposes
 *     `audioUrl`, which drives both inline play and download.
 *   - YouTube shows (e.g. luetin09): `audio_url` is NULL — there is no MP3 — and
 *     the episode carries `external_links(kind='watch', serviceId='youtube')`
 *     pointing at the video. The reader exposes that as `watchUrl`; the archive
 *     row renders a "View ↗" out-link instead of "Listen ↗" + inline player.
 * "Listen in your app" stays served by the show-level `platformLinks`.
 */
import "server-only";
import { cache } from "react";
import { cachedRead } from "@/lib/db-cache";
import {
  isBuildPhase,
  readSnapshotArtifact,
} from "@/lib/snapshot/build-data";
import type { Suggestion } from "@/app/archive/filters";

// Shared shapes

/** One "where to listen" link on a show, resolved to a friendly platform label. */
export interface PlatformLink {
  serviceId: string;
  label: string;
  url: string;
}

export interface FactionTag {
  id: string;
  name: string;
}

export interface EpisodeStub {
  id: string;
  title: string;
  pubDateMs: number | null;
}

/** One show as it appears on the /podcasts index. */
export interface PodcastIndexShow {
  id: string;
  slug: string;
  title: string;
  /** Show art: prefer the work cover, fall back to the feed image. */
  artUrl: string | null;
  episodeCount: number;
  firstPubYear: number | null;
  lastPubYear: number | null;
  platformLinks: PlatformLink[];
  latest: EpisodeStub[];
}

/** One fully-serialized episode for the client archive island. */
export interface PodcastEpisode {
  id: string;
  title: string;
  pubDateMs: number | null;
  durationSec: number | null;
  episodeKind: string | null;
  /** The MP3 enclosure — drives both inline play and download (see file note). */
  audioUrl: string | null;
  /** A YouTube (or other `watch`) video URL for shows with no MP3 (see file note). */
  watchUrl: string | null;
  factions: FactionTag[];
}

/** One show + all episodes for /podcasts/[slug]. */
export interface PodcastShowDetail {
  id: string;
  slug: string;
  title: string;
  artUrl: string | null;
  episodeCount: number;
  firstPubYear: number | null;
  lastPubYear: number | null;
  platformLinks: PlatformLink[];
  episodes: PodcastEpisode[];
}

// loadPodcastIndex — the /archive/podcasts hall (prerendered, revalidate=3600).
// Build: committed snapshot (fail-closed). Runtime (ISR refresh): live DB
// behind `cachedRead` — the `podcasts` tag lets `POST /api/revalidate` surface
// a fresh ingest immediately instead of waiting out the ISR window. Index
// contract (S2): an array; DB errors throw.
export async function loadPodcastIndex(): Promise<PodcastIndexShow[]> {
  if (isBuildPhase()) {
    return readSnapshotArtifact<PodcastIndexShow[]>("podcastIndex");
  }
  const { loadPodcastIndexLive } = await import("./loader-live");
  return cachedRead(loadPodcastIndexLive, ["podcast-index"], {
    tags: ["podcasts"],
  })();
}

// loadPodcastShow — show details render on demand only (empty
// `generateStaticParams` on the route), so this always takes the live path,
// behind a per-slug `cachedRead` (the loadBook pattern: a missing slug caches
// as a stable `null`, a DB error throws and is never cached). Even the
// biggest show's episode list is a few hundred KB — under the 2 MB entry cap.
export async function loadPodcastShow(
  slug: string,
): Promise<PodcastShowDetail | null> {
  const { loadPodcastShowLive } = await import("./loader-live");
  return cachedRead(() => loadPodcastShowLive(slug), ["podcast-show", slug], {
    tags: ["podcasts"],
  })();
}

// Unified search index (books + podcasts share one typeahead).
// The browse search (`werke/filters.ts`) is the archive-wide entry point; the
// host pages (Home, /werke, /podcasts) merge `buildPodcastSuggestions(...)`
// into `buildSearchIndex(books)` so podcasts surface in the SAME dropdown,
// right after books. This is a lighter sibling of `loadPodcastIndex` — it keeps
// EVERY episode (not the 3-ep teaser) but only the fields the typeahead needs.

/** All shows + all episodes, flattened to the minimum the typeahead ranks on. */
export interface PodcastSearchData {
  shows: Array<{ slug: string; title: string; episodeCount: number }>;
  episodes: Array<{
    id: string;
    title: string;
    showSlug: string;
    showTitle: string;
  }>;
}

/** `cache()`-wrapped so a page that also calls it elsewhere in one render
 *  dedupes the round-trip. Build: committed snapshot (fail-closed). Runtime:
 *  live DB behind `cachedRead` — `/archive` is searchParams-dynamic and
 *  composes this into every request, so without the cross-request layer the
 *  two projection queries would run per visitor. DB errors throw (S2). */
export const loadPodcastSearchIndex = cache(
  async (): Promise<PodcastSearchData> => {
    if (isBuildPhase()) {
      return readSnapshotArtifact<PodcastSearchData>("podcastSearch");
    }
    const { loadPodcastSearchIndexLive } = await import("./loader-live");
    return cachedRead(loadPodcastSearchIndexLive, ["podcast-search"], {
      tags: ["podcasts"],
    })();
  },
);

/** Flatten the podcast search data into `Suggestion`s for the shared typeahead.
 *  Each episode deep-links to `#ep-<id>` on its show (the archive scrolls to and
 *  highlights it); each show links to its page. `value` stays unique per row. */
export function buildPodcastSuggestions(data: PodcastSearchData): Suggestion[] {
  const out: Suggestion[] = [];
  for (const ep of data.episodes) {
    out.push({
      kind: "podcast",
      label: ep.title,
      value: ep.id,
      hint: ep.showTitle,
      href: `/archive/podcasts/${ep.showSlug}#ep-${ep.id}`,
    });
  }
  for (const s of data.shows) {
    out.push({
      kind: "podcast",
      label: s.title,
      value: `show:${s.slug}`,
      hint: `Show · ${s.episodeCount} ${
        s.episodeCount === 1 ? "episode" : "episodes"
      }`,
      href: `/archive/podcasts/${s.slug}`,
    });
  }
  return out;
}
