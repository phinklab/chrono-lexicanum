/**
 * Live (Postgres) half of the podcast data layer. SERVER-ONLY, imports `@/db`
 * — reached exclusively via lazy `import()` from `./loader` at request time
 * (Launch S1b Loader-Weiche). At build time the façade reads the committed
 * snapshot instead. Domain notes (show→episode hop, RSS vs. YouTube URL
 * shapes) live on the façade's docstring in `./loader`.
 */
import "server-only";
import { db } from "@/db/client";
import { eq, inArray } from "drizzle-orm";
import { podcastEpisodeDetails } from "@/db/schema";
import type {
  EpisodeStub,
  PlatformLink,
  FactionTag,
  PodcastEpisode,
  PodcastIndexShow,
  PodcastSearchData,
  PodcastShowDetail,
} from "./loader";

// Platform-link presentation.
// "Where to listen" ordering for a lore podcast — apps first, then the home
// page, then the raw feed. serviceId → {label, order}; anything unmapped sorts
// last (under its service display_order) and shows the service's own name.
const PLATFORM: Record<string, { label: string; order: number }> = {
  apple_podcasts: { label: "Apple Podcasts", order: 1 },
  spotify: { label: "Spotify", order: 2 },
  youtube: { label: "YouTube", order: 3 },
  official_website: { label: "Website", order: 4 },
  rss: { label: "RSS", order: 5 },
};

interface RawLink {
  serviceId: string;
  url: string;
  service: { name: string; displayOrder: number } | null;
}

function buildPlatformLinks(links: RawLink[]): PlatformLink[] {
  return links
    .map((l) => {
      const meta = PLATFORM[l.serviceId];
      return {
        serviceId: l.serviceId,
        url: l.url,
        label: meta?.label ?? l.service?.name ?? l.serviceId,
        order: meta?.order ?? 90 + (l.service?.displayOrder ?? 0) / 1000,
      };
    })
    .sort((a, b) => a.order - b.order)
    .map(({ serviceId, url, label }) => ({ serviceId, url, label }));
}

// Faction tags
interface RawFaction {
  role: string | null;
  faction: { id: string; name: string } | null;
}

/** Up to 3 faction tags, subject-role first, deduped, alpha within a role tier. */
function topFactions(rows: RawFaction[]): FactionTag[] {
  const ranked = rows
    .filter(
      (r): r is { role: string | null; faction: { id: string; name: string } } =>
        r.faction != null,
    )
    .sort((a, b) => {
      const ra = a.role === "subject" ? 0 : 1;
      const rb = b.role === "subject" ? 0 : 1;
      if (ra !== rb) return ra - rb;
      return a.faction.name.localeCompare(b.faction.name, "en");
    });
  const out: FactionTag[] = [];
  const seen = new Set<string>();
  for (const r of ranked) {
    if (seen.has(r.faction.id)) continue;
    seen.add(r.faction.id);
    out.push({ id: r.faction.id, name: r.faction.name });
    if (out.length >= 3) break;
  }
  return out;
}

// Date helpers
function toMs(d: Date | null | undefined): number | null {
  return d ? d.getTime() : null;
}
function yearOf(ms: number | null): number | null {
  return ms == null ? null : new Date(ms).getUTCFullYear();
}
/** Newest first; undated sink to the bottom, then alpha for a stable order. */
function byNewest(
  a: { pubDateMs: number | null; title: string },
  b: { pubDateMs: number | null; title: string },
): number {
  if (a.pubDateMs == null && b.pubDateMs == null)
    return a.title.localeCompare(b.title, "en");
  if (a.pubDateMs == null) return 1;
  if (b.pubDateMs == null) return -1;
  return b.pubDateMs - a.pubDateMs;
}

/** Index contract (S2, see `src/lib/db-cache.ts`): DB errors throw — never an
 *  empty hall standing in for an outage. */
export async function loadPodcastIndexLive(): Promise<PodcastIndexShow[]> {
  const [showRows, episodeRows] = await Promise.all([
    db.query.works.findMany({
      where: (w, { eq }) => eq(w.kind, "podcast"),
      columns: { id: true, slug: true, title: true, coverUrl: true },
      with: {
        podcastDetails: { columns: { imageUrl: true } },
        externalLinks: {
          columns: { serviceId: true, url: true },
          with: { service: { columns: { name: true, displayOrder: true } } },
        },
      },
    }),
    db.query.works.findMany({
      where: (w, { eq }) => eq(w.kind, "podcast_episode"),
      columns: { id: true, title: true },
      with: {
        podcastEpisodeDetails: {
          columns: { podcastWorkId: true, pubDate: true },
        },
      },
    }),
  ]);

  // Bucket episode stubs under their show.
  const byShow = new Map<string, EpisodeStub[]>();
  for (const w of episodeRows) {
    const d = w.podcastEpisodeDetails;
    if (!d) continue;
    const stub: EpisodeStub = {
      id: w.id,
      title: w.title,
      pubDateMs: toMs(d.pubDate),
    };
    const bucket = byShow.get(d.podcastWorkId);
    if (bucket) bucket.push(stub);
    else byShow.set(d.podcastWorkId, [stub]);
  }

  return showRows
    .map((w) => {
      const eps = (byShow.get(w.id) ?? []).sort(byNewest);
      const years = eps
        .map((e) => yearOf(e.pubDateMs))
        .filter((y): y is number => y != null);
      return {
        id: w.id,
        slug: w.slug,
        title: w.title,
        artUrl: w.coverUrl ?? w.podcastDetails?.imageUrl ?? null,
        episodeCount: eps.length,
        firstPubYear: years.length ? Math.min(...years) : null,
        lastPubYear: years.length ? Math.max(...years) : null,
        platformLinks: buildPlatformLinks(w.externalLinks),
        latest: eps.slice(0, 3),
      };
    })
    .sort((a, b) => b.episodeCount - a.episodeCount);
}

/** Detail contract (S2): data | null (unknown slug) | throw (DB error). */
export async function loadPodcastShowLive(
  slug: string,
): Promise<PodcastShowDetail | null> {
  const show = await db.query.works.findFirst({
    where: (w, { and, eq }) => and(eq(w.kind, "podcast"), eq(w.slug, slug)),
    columns: { id: true, slug: true, title: true, coverUrl: true },
    with: {
      podcastDetails: { columns: { imageUrl: true } },
      externalLinks: {
        columns: { serviceId: true, url: true },
        with: { service: { columns: { name: true, displayOrder: true } } },
      },
    },
  });
  if (!show) return null;

  // No `show` relation on the episode self-link → resolve episode workIds via
  // an explicit podcastWorkId filter, then load them with their tags in one
  // relational fan-out.
  const idRows = await db
    .select({ id: podcastEpisodeDetails.workId })
    .from(podcastEpisodeDetails)
    .where(eq(podcastEpisodeDetails.podcastWorkId, show.id));
  const ids = idRows.map((r) => r.id);

  const epRows = ids.length
    ? await db.query.works.findMany({
        where: (w) => inArray(w.id, ids),
        columns: { id: true, title: true },
        with: {
          podcastEpisodeDetails: {
            columns: {
              audioUrl: true,
              durationSec: true,
              pubDate: true,
              episodeKind: true,
            },
          },
          externalLinks: {
            columns: { kind: true, serviceId: true, url: true },
          },
          factions: {
            columns: { role: true },
            with: { faction: { columns: { id: true, name: true } } },
          },
        },
      })
    : [];

  const episodes: PodcastEpisode[] = epRows
    .map((w) => {
      const d = w.podcastEpisodeDetails;
      // YouTube shows have no MP3 (audioUrl NULL) but carry a `watch` link to
      // the video; surface it so the row can offer "View ↗".
      const watchUrl =
        w.externalLinks.find(
          (l) => l.kind === "watch" || l.serviceId === "youtube",
        )?.url ?? null;
      return {
        id: w.id,
        title: w.title,
        pubDateMs: toMs(d?.pubDate),
        durationSec: d?.durationSec ?? null,
        episodeKind: d?.episodeKind ?? null,
        audioUrl: d?.audioUrl ?? null,
        watchUrl,
        factions: topFactions(w.factions),
      };
    })
    .sort(byNewest);

  const years = episodes
    .map((e) => yearOf(e.pubDateMs))
    .filter((y): y is number => y != null);

  return {
    id: show.id,
    slug: show.slug,
    title: show.title,
    artUrl: show.coverUrl ?? show.podcastDetails?.imageUrl ?? null,
    episodeCount: episodes.length,
    firstPubYear: years.length ? Math.min(...years) : null,
    lastPubYear: years.length ? Math.max(...years) : null,
    platformLinks: buildPlatformLinks(show.externalLinks),
    episodes,
  };
}

/** Live body of the typeahead projection — see `loadPodcastSearchIndex` in
 *  `./loader` (the façade owns the per-request `cache()` wrapper). */
export async function loadPodcastSearchIndexLive(): Promise<PodcastSearchData> {
  const [showRows, episodeRows] = await Promise.all([
    db.query.works.findMany({
      where: (w, { eq }) => eq(w.kind, "podcast"),
      columns: { id: true, slug: true, title: true },
    }),
    db.query.works.findMany({
      where: (w, { eq }) => eq(w.kind, "podcast_episode"),
      columns: { id: true, title: true },
      with: {
        podcastEpisodeDetails: { columns: { podcastWorkId: true } },
      },
    }),
  ]);

  const showById = new Map(
    showRows.map((s) => [s.id, { slug: s.slug, title: s.title }]),
  );
  const countBySlug = new Map<string, number>();
  const episodes: PodcastSearchData["episodes"] = [];
  for (const w of episodeRows) {
    const showId = w.podcastEpisodeDetails?.podcastWorkId;
    const show = showId ? showById.get(showId) : undefined;
    if (!show) continue;
    episodes.push({
      id: w.id,
      title: w.title,
      showSlug: show.slug,
      showTitle: show.title,
    });
    countBySlug.set(show.slug, (countBySlug.get(show.slug) ?? 0) + 1);
  }

  const shows = showRows.map((s) => ({
    slug: s.slug,
    title: s.title,
    episodeCount: countBySlug.get(s.slug) ?? 0,
  }));

  return { shows, episodes };
}
