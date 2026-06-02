/**
 * Public podcast-browse data layer (Brief 120). SERVER-ONLY (imports `@/db`).
 *
 * Podcasts are the second media pillar next to books. The shape mirrors the
 * works-centric schema: a `kind='podcast'` show work (→ `podcastDetails`) owns
 * many `kind='podcast_episode'` works (→ `podcastEpisodeDetails.podcastWorkId`).
 * There is deliberately no `show` relation on the episode self-link (schema
 * note, Brief 114), so we load episodes flat and group them by `podcastWorkId`
 * in memory. One fan-out per kind, wrapped try/catch → empty so an unreachable
 * DB at build time degrades to an empty hall instead of failing `next build`.
 */
import { db } from "@/db/client";

export interface PodcastEpisode {
  id: string;
  title: string;
  pubDate: Date | null;
  durationSec: number | null;
  episodeKind: string | null;
  audioUrl: string | null;
}

export interface PodcastShow {
  id: string;
  slug: string;
  title: string;
  synopsis: string | null;
  /** Show art: prefer the work cover, fall back to the feed image. */
  artUrl: string | null;
  feedUrl: string | null;
  appleId: string | null;
  episodeCount: number;
  firstPubYear: number | null;
  lastPubYear: number | null;
  episodes: PodcastEpisode[];
}

function pubYear(d: Date | null): number | null {
  return d ? d.getUTCFullYear() : null;
}

/** Newest first; episodes without a pub date sink to the bottom. */
function byNewest(a: PodcastEpisode, b: PodcastEpisode): number {
  const at = a.pubDate ? a.pubDate.getTime() : null;
  const bt = b.pubDate ? b.pubDate.getTime() : null;
  if (at == null && bt == null) return a.title.localeCompare(b.title, "en");
  if (at == null) return 1;
  if (bt == null) return -1;
  return bt - at;
}

export async function loadPodcasts(): Promise<PodcastShow[]> {
  try {
    const [showRows, episodeRows] = await Promise.all([
      db.query.works.findMany({
        where: (w, { eq }) => eq(w.kind, "podcast"),
        columns: {
          id: true,
          slug: true,
          title: true,
          synopsis: true,
          coverUrl: true,
        },
        with: {
          podcastDetails: {
            columns: { feedUrl: true, appleId: true, imageUrl: true },
          },
        },
      }),
      db.query.works.findMany({
        where: (w, { eq }) => eq(w.kind, "podcast_episode"),
        columns: { id: true, title: true },
        with: {
          podcastEpisodeDetails: {
            columns: {
              podcastWorkId: true,
              audioUrl: true,
              durationSec: true,
              pubDate: true,
              episodeKind: true,
            },
          },
        },
      }),
    ]);

    // Bucket episodes under their show.
    const byShow = new Map<string, PodcastEpisode[]>();
    for (const w of episodeRows) {
      const d = w.podcastEpisodeDetails;
      if (!d) continue;
      const ep: PodcastEpisode = {
        id: w.id,
        title: w.title,
        pubDate: d.pubDate ?? null,
        durationSec: d.durationSec ?? null,
        episodeKind: d.episodeKind ?? null,
        audioUrl: d.audioUrl ?? null,
      };
      const bucket = byShow.get(d.podcastWorkId);
      if (bucket) bucket.push(ep);
      else byShow.set(d.podcastWorkId, [ep]);
    }

    const shows: PodcastShow[] = showRows
      .map((w) => {
        const episodes = (byShow.get(w.id) ?? []).sort(byNewest);
        const years = episodes
          .map((e) => pubYear(e.pubDate))
          .filter((y): y is number => y != null);
        return {
          id: w.id,
          slug: w.slug,
          title: w.title,
          synopsis: w.synopsis ?? null,
          artUrl: w.coverUrl ?? w.podcastDetails?.imageUrl ?? null,
          feedUrl: w.podcastDetails?.feedUrl ?? null,
          appleId: w.podcastDetails?.appleId ?? null,
          episodeCount: episodes.length,
          firstPubYear: years.length ? Math.min(...years) : null,
          lastPubYear: years.length ? Math.max(...years) : null,
          episodes,
        };
      })
      // Busiest shows first.
      .sort((a, b) => b.episodeCount - a.episodeCount);

    return shows;
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/podcasts] DB fetch failed (${msg}); rendering empty hall.`);
    return [];
  }
}
