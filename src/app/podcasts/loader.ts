/**
 * Public podcast data layer (Brief 120 → 121-P4 redesign). SERVER-ONLY (imports `@/db`).
 *
 * Podcasts are the second media pillar next to books. A `kind='podcast'` show
 * work (→ `podcastDetails`) owns many `kind='podcast_episode'` works
 * (→ `podcastEpisodeDetails.podcastWorkId`). There is deliberately no `show`
 * relation on the episode self-link (schema note, Brief 114), so the
 * show→episodes hop runs through an explicit `podcastWorkId` filter, not a
 * relation.
 *
 * Two reader projections:
 *   - `loadPodcastIndex()`   → the /podcasts hall: one row per show + platform
 *     links + a 3-episode teaser, busiest show first.
 *   - `loadPodcastShow(slug)` → /podcasts/[slug]: one show + ALL its episodes,
 *     entity-tagged, newest first, shaped for the client archive island.
 *
 * Both wrap in try/catch → empty so an unreachable DB at build time degrades to
 * an empty hall instead of failing `next build`. Episode `pubDate` crosses into
 * a client component, so it is exposed as epoch-ms (`pubDateMs`), never a `Date`.
 *
 * Note on the episode URL: the ingest stores exactly one per-episode link —
 * `external_links(listen)` — and its url is the same MP3 enclosure as
 * `podcast_episode_details.audio_url` (verified 1:1 across all 512 rows). There
 * is no separate episode web page, so the reader exposes a single `audioUrl`
 * that drives both inline play and download; "listen in your app" is served by
 * the show-level `platformLinks` (Apple / Spotify / YouTube / Website / RSS).
 */
import { db } from "@/db/client";
import { eq, inArray } from "drizzle-orm";
import { podcastEpisodeDetails } from "@/db/schema";

// ── Shared shapes ───────────────────────────────────────────────────────────

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

// ── Platform-link presentation ──────────────────────────────────────────────
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

// ── Faction tags ────────────────────────────────────────────────────────────
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

// ── Date helpers ────────────────────────────────────────────────────────────
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

// ── loadPodcastIndex ────────────────────────────────────────────────────────
export async function loadPodcastIndex(): Promise<PodcastIndexShow[]> {
  try {
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
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/podcasts] index fetch failed (${msg}); rendering empty hall.`);
    return [];
  }
}

// ── loadPodcastShow ─────────────────────────────────────────────────────────
export async function loadPodcastShow(
  slug: string,
): Promise<PodcastShowDetail | null> {
  try {
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
        return {
          id: w.id,
          title: w.title,
          pubDateMs: toMs(d?.pubDate),
          durationSec: d?.durationSec ?? null,
          episodeKind: d?.episodeKind ?? null,
          audioUrl: d?.audioUrl ?? null,
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
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(
      `[/podcasts/${slug}] show fetch failed (${msg}); treating as not found.`,
    );
    return null;
  }
}

// ── podcastShowSlugs (generateStaticParams) ─────────────────────────────────
export async function podcastShowSlugs(): Promise<string[]> {
  try {
    const rows = await db.query.works.findMany({
      where: (w, { eq }) => eq(w.kind, "podcast"),
      columns: { slug: true },
    });
    return rows.map((r) => r.slug);
  } catch {
    return [];
  }
}
