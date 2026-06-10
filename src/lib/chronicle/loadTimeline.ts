/**
 * Chronicle timeline — DB loader (Brief 138). SERVER-ONLY (imports `@/db`).
 *
 * Loads the full 8-era spine in one relational query (eras → events →
 * event_works → work/series, authors nested), plus one batched
 * episode-id → parent-show lookup for podcast chip hrefs. Hooks are resolved
 * server-side into ready-to-render chips `{ kind, title, meta, href }` so the
 * client islands stay dumb; a curated `display_label` always wins over the
 * derived attribution. Per-era view tuning (grouping/domain/ticks) is merged
 * in from `viewConfig.ts` — the client receives one self-contained payload
 * shaped like the prototype's `CHRONICLE_ERAS`.
 */
import { db } from "@/db/client";
import { resolveEpisodeShows } from "@/lib/work-links";
import {
  ERA_VIEW_CONFIG,
  fallbackEraView,
  type EraGrouping,
  type EraTick,
} from "./viewConfig";

export interface ChronicleChip {
  kind: "BOOK" | "PODCAST";
  title: string;
  /** Attribution line; UI renders `${kind} · ${meta}` (kind only when empty). */
  meta: string;
  href: string | null;
}

export interface ChronicleEvent {
  id: string;
  title: string;
  dateLabel: string;
  tier: "epoch" | "major" | "minor";
  approx: boolean;
  offscale: boolean;
  blurb: string;
  /** Era-local minimap coords (see viewConfig.ts); 0 for offscale rows. */
  y0: number;
  y1: number;
  artCreditName: string | null;
  artCreditUrl: string | null;
  media: ChronicleChip[];
}

export interface ChronicleEraData {
  id: string;
  /** Millennium label ("PRE-M30", "M32–34", …). */
  m: string;
  name: string;
  short: string;
  sub: string;
  tagline: string;
  intro: string;
  /** Public asset path of the chapter artwork (/timeline/bg/*.webp). */
  cover: string;
  grouping: EraGrouping;
  groupLabel: string | null;
  baseM: number | null;
  domain: [number, number];
  ticks: EraTick[];
  events: ChronicleEvent[];
}

/** "Graham McNeill" → "G. McNeill" (prototype attribution style). */
function abbrevAuthor(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  const last = parts[parts.length - 1];
  return `${parts[0][0]}. ${last}`;
}

type HookRow = {
  role: string;
  displayLabel: string | null;
  work: {
    id: string;
    slug: string;
    title: string;
    kind: string;
    persons: { person: { name: string } }[];
    podcastEpisodeDetails: { episode: number | null } | null;
  } | null;
  series: { id: string; name: string } | null;
};

function buildChip(
  hook: HookRow,
  shows: Map<string, { slug: string; title: string }>,
): ChronicleChip | null {
  const kind: ChronicleChip["kind"] = hook.role === "podcast" ? "PODCAST" : "BOOK";

  // Series-level hook (Gaunt's Ghosts, The Beast Arises): the archive filtered
  // to that series — its free-text `?q=` matches `seriesName` exactly.
  if (hook.series) {
    return {
      kind,
      title: hook.series.name,
      meta: hook.displayLabel ?? "SERIES",
      href: `/archive?q=${encodeURIComponent(hook.series.name)}`,
    };
  }
  if (!hook.work) return null;
  const w = hook.work;

  if (w.kind === "podcast_episode") {
    const show = shows.get(w.id) ?? null;
    const epNo = w.podcastEpisodeDetails?.episode ?? null;
    return {
      kind,
      title: show ? `${show.title} — ${w.title}` : w.title,
      meta: hook.displayLabel ?? (epNo != null ? `EP. ${epNo}` : show?.title ?? ""),
      // `#ep-<id>` deep link; the episode archive resolves it on a fresh
      // document load, so target=_blank chips land highlighted.
      href: show ? `/archive/podcasts/${show.slug}#ep-${w.id}` : null,
    };
  }

  // Book chip → the popup over the archive catalogue (`?focus=` is resolved
  // by /archive into the @modal intercept; unknown ids degrade to a no-op).
  const author = w.persons[0]?.person.name;
  return {
    kind,
    title: w.title,
    meta: hook.displayLabel ?? (author ? abbrevAuthor(author) : ""),
    href: `/archive?focus=${w.id}`,
  };
}

/**
 * Full timeline payload, ordered by era `sortOrder` / event `sortIndex` /
 * chip `position`. Returns null when the DB is unreachable — the page renders
 * an honest empty state instead of a 500.
 */
export async function loadChronicleTimeline(): Promise<ChronicleEraData[] | null> {
  try {
    const eraRows = await db.query.eras.findMany({
      orderBy: (e, { asc }) => [asc(e.sortOrder)],
      with: {
        events: {
          orderBy: (ev, { asc }) => [asc(ev.sortIndex)],
          with: {
            works: {
              orderBy: (ew, { asc }) => [asc(ew.position)],
              columns: { role: true, displayLabel: true },
              with: {
                work: {
                  columns: { id: true, slug: true, title: true, kind: true },
                  with: {
                    persons: {
                      where: (wp, { eq }) => eq(wp.role, "author"),
                      orderBy: (wp, { asc }) => [asc(wp.displayOrder)],
                      columns: { personId: true },
                      with: { person: { columns: { name: true } } },
                    },
                    podcastEpisodeDetails: { columns: { episode: true } },
                  },
                },
                series: { columns: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    const episodeIds = eraRows.flatMap((era) =>
      era.events.flatMap((ev) =>
        ev.works
          .filter((h) => h.work?.kind === "podcast_episode")
          .map((h) => h.work!.id),
      ),
    );
    const shows = await resolveEpisodeShows(episodeIds);

    return eraRows.map((era) => {
      const view =
        ERA_VIEW_CONFIG[era.id] ??
        fallbackEraView(Number(era.startY), Number(era.endY));
      const toY = (scale: string | null): number => {
        if (scale == null) return 0;
        const v = Number(scale);
        if (!Number.isFinite(v)) return 0;
        return view.axis.unit === "millennia" ? v / 1000 : v - view.axis.baseY;
      };
      return {
        id: era.id,
        m: era.mLabel ?? era.name,
        name: era.name,
        short: era.short ?? era.name,
        sub: era.sub ?? "",
        tagline: era.tagline ?? "",
        intro: era.intro ?? era.tagline ?? "",
        cover: era.coverRef ?? "",
        grouping: view.grouping,
        groupLabel: view.groupLabel ?? null,
        baseM: view.baseM ?? null,
        domain: view.domain,
        ticks: view.ticks,
        events: era.events.map((ev) => ({
          id: ev.id,
          title: ev.title,
          dateLabel: ev.dateLabel,
          tier: ev.tier,
          approx: ev.approx,
          offscale: ev.offscale,
          blurb: ev.blurb,
          y0: ev.offscale ? 0 : toY(ev.startY),
          y1: ev.offscale ? 0 : toY(ev.endY ?? ev.startY),
          artCreditName: ev.artCreditName,
          artCreditUrl: ev.artCreditUrl,
          media: ev.works
            .map((h) => buildChip(h, shows))
            .filter((c): c is ChronicleChip => c !== null),
        })),
      };
    });
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error(`[/timeline] loadChronicleTimeline failed (${msg}).`);
    return null;
  }
}
