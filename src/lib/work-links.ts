/**
 * Shared work → public-route link helpers. SERVER-ONLY (imports `@/db`).
 *
 * Shared so the Chronicle
 * timeline's media chips and the entity panels emit identical deep links —
 * especially the podcast-episode pattern (`/archive/podcasts/<show>#ep-<id>`),
 * which the episode archive island resolves on load (expand + scroll +
 * highlight; works on a fresh document, so new-tab opening is safe).
 */
import { eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db/client";
import {
  podcastEpisodeDetails as podcastEpisodeDetailsTable,
  works as worksTable,
} from "@/db/schema";

/** Per-kind public route, or null when the kind has no detail surface yet. */
export function workHref(
  kind: string,
  slug: string,
  showSlug: string | null,
  workId: string,
): string | null {
  switch (kind) {
    case "book":
      return `/book/${slug}`;
    case "podcast":
      return `/archive/podcasts/${slug}`;
    case "podcast_episode":
      // Episodes have no own page — deep-link into the parent show's archive,
      // targeting this episode by work id (`#ep-<id>`). The archive island
      // expands that episode's year, scrolls it into view and highlights it.
      return showSlug ? `/archive/podcasts/${showSlug}#ep-${workId}` : null;
    default:
      return null;
  }
}

/**
 * Batch episode-work-id → parent show {slug,title}. One query for the whole
 * page; empty input short-circuits (no pointless `WHERE id IN ()`).
 */
export async function resolveEpisodeShows(
  episodeIds: string[],
): Promise<Map<string, { slug: string; title: string }>> {
  const map = new Map<string, { slug: string; title: string }>();
  if (episodeIds.length === 0) return map;
  const showWorks = alias(worksTable, "show_works");
  const rows = await db
    .select({
      episodeId: podcastEpisodeDetailsTable.workId,
      slug: showWorks.slug,
      title: showWorks.title,
    })
    .from(podcastEpisodeDetailsTable)
    .innerJoin(
      showWorks,
      eq(showWorks.id, podcastEpisodeDetailsTable.podcastWorkId),
    )
    .where(inArray(podcastEpisodeDetailsTable.workId, episodeIds));
  for (const r of rows) map.set(r.episodeId, { slug: r.slug, title: r.title });
  return map;
}
