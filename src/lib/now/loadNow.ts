/**
 * Status Imperialis (/now) — DB loader. SERVER-ONLY (imports `@/db`).
 *
 * One payload for the archive's "when is now" page: the Indomitus era row
 * (context copy), the era's event spine with resolved media chips (reusing
 * the Chronicle's `buildChip`, so /now and /timeline emit identical links),
 * the "playing out now" book list — dated rows (`works.startY ≥ 41999`, the
 * Fall-of-Cadia floor, released since the Gathering Storm wave — see
 * NOW_RELEASE_FLOOR) merged with the curated leading-edge additions below.
 *
 * Index-loader error contract (S2, see `src/lib/db-cache.ts`): arrays are
 * legitimately empty while unseeded — DB errors THROW into the route's error
 * boundary. Cached under the `now` tag plus `timeline`/`books`, so a partial
 * post-apply purge of either source also refreshes this page.
 */
import { db } from "@/db/client";
import { cachedRead } from "@/lib/db-cache";
import { resolveEpisodeShows } from "@/lib/work-links";
import { buildChip, type ChronicleChip } from "@/lib/chronicle/loadTimeline";

/** Setting floor of the "now" window: 999.M41, the Fall of Cadia. */
const NOW_FLOOR_Y = "41999";

/**
 * Release floor of the "now" window. 999.M41 was the FROZEN present of the
 * setting for two decades of publishing, so a settingY filter alone sweeps in
 * the whole classic back catalogue (Nightbringer 2002, Dawn of War 2004,
 * Cain's Last Stand 2008, …) that sits on that date without advancing the
 * story. The moving present only exists since the Gathering Storm publishing
 * wave — its first novels (Cadia Stands, Dark Imperium) landed 2017.
 */
const NOW_RELEASE_FLOOR = 2017;

/**
 * Curated leading-edge additions (Philipp, Session 251): the newest releases
 * that advance the story's front line but carry no DB setting date (yet).
 * Web-researched per title (WarCom reveals, Lexicanum, review coverage) —
 * `dateLabel` is deliberately approximate reading copy, `sortY` only orders
 * the merged list and is never displayed. A slug that later gains a real DB
 * date wins over its row here (dedupe in the loader); the Weekly-Refresh
 * Status-Imperialis check (F1-B1) is the standing prompt to revisit this set.
 */
const CURATED_NOW_BOOKS: {
  slug: string;
  dateLabel: string;
  sortY: number;
  confidence: "H" | "M" | "L";
}[] = [
  // Kasrkin survivors in the direct aftermath of Cadia's fall.
  { slug: "veterans-of-the-fall", dateLabel: "right after the Fall of Cadia", sortY: 41999.2, confidence: "H" },
  // Steel Tread sequel — the Croatoas campaign beneath the new-born Rift.
  { slug: "demolisher", dateLabel: "under the new-born Great Rift", sortY: 41999.4, confidence: "H" },
  // Alpha Legion vs. the Indomitus Crusade (Harrowmaster sequel).
  { slug: "ghost-legion", dateLabel: "during the Indomitus Crusade", sortY: 42005, confidence: "H" },
  // Cawl chain, after Genefather: bridging the Attilan Gap.
  { slug: "archmagos", dateLabel: "Cawl's bid to bridge the Great Rift", sortY: 42020, confidence: "H" },
  // Vashtorr-cult era; the chapter's own "new Imperium" framing.
  { slug: "carcharadons-void-exile", dateLabel: "after the Great Rift, year unknown", sortY: 42021, confidence: "M" },
  // Ghazghkull's ongoing Waaagh!, released with the Armageddon wave.
  { slug: "ghazghkull-thraka-warlord-of-warlords", dateLabel: "the road to Armageddon's fourth war", sortY: 42024, confidence: "M" },
  // The 11th-edition front line: the Fourth War for Armageddon.
  { slug: "armageddon-season-of-fire", dateLabel: "the Fourth War for Armageddon", sortY: 42025, confidence: "H" },
];

export interface NowEvent {
  id: string;
  title: string;
  dateLabel: string;
  tier: "epoch" | "major" | "minor";
  approx: boolean;
  blurb: string;
  /** Public asset path (/timeline/bg/*.webp); null renders without a plate. */
  artworkRef: string | null;
  media: ChronicleChip[];
}

export interface NowBook {
  id: string;
  slug: string;
  title: string;
  author: string | null;
  dateLabel: string;
  /** Curated 'H' / 'M' / 'L'; null for legacy rows without provenance. */
  confidence: string | null;
}

export interface StatusImperialisData {
  era: {
    id: string;
    mLabel: string;
    name: string;
    tagline: string;
    intro: string;
  } | null;
  events: NowEvent[];
  books: NowBook[];
}

/** Honest fallback when a dated row carries no curated label. */
function fallbackDateLabel(startY: string | null): string {
  if (startY == null) return "~M42";
  return Number(startY) < 42000 ? "999.M41" : "~M42";
}

async function fetchStatusImperialis(): Promise<StatusImperialisData> {
  const eraRow = await db.query.eras.findFirst({
    where: (e, { eq: whereEq }) => whereEq(e.id, "indomitus"),
  });

  const eventRows = await db.query.events.findMany({
    where: (ev, { eq: whereEq }) => whereEq(ev.eraId, "indomitus"),
    orderBy: (ev, { asc: orderAsc }) => [orderAsc(ev.sortIndex)],
    with: {
      works: {
        orderBy: (ew, { asc: orderAsc }) => [orderAsc(ew.position)],
        columns: { role: true, displayLabel: true },
        with: {
          work: {
            columns: { id: true, slug: true, title: true, kind: true },
            with: {
              persons: {
                where: (wp, { eq: whereEq }) => whereEq(wp.role, "author"),
                orderBy: (wp, { asc: orderAsc }) => [orderAsc(wp.displayOrder)],
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
  });

  const episodeIds = eventRows.flatMap((ev) =>
    ev.works
      .filter((h) => h.work?.kind === "podcast_episode")
      .map((h) => h.work!.id),
  );
  const shows = await resolveEpisodeShows(episodeIds);

  const bookRows = await db.query.works.findMany({
    where: (w, { and: whereAnd, eq: whereEq, gte: whereGte }) =>
      whereAnd(
        whereEq(w.kind, "book"),
        whereGte(w.startY, NOW_FLOOR_Y),
        // NULL releaseYear drops out too: without a modern release date the
        // row can't prove it belongs to the moving present — the curated
        // block above is the deliberate path onto the list for those.
        whereGte(w.releaseYear, NOW_RELEASE_FLOOR),
      ),
    orderBy: (w, { asc: orderAsc }) => [orderAsc(w.startY), orderAsc(w.title)],
    columns: {
      id: true,
      slug: true,
      title: true,
      startY: true,
      releaseYear: true,
      settingDateLabel: true,
      settingConfidence: true,
    },
    with: {
      persons: {
        where: (wp, { eq: whereEq }) => whereEq(wp.role, "author"),
        orderBy: (wp, { asc: orderAsc }) => [orderAsc(wp.displayOrder)],
        columns: { personId: true },
        with: { person: { columns: { name: true } } },
      },
    },
  });

  const curatedRows = await db.query.works.findMany({
    where: (w, { and: whereAnd, eq: whereEq, inArray: whereIn }) =>
      whereAnd(
        whereEq(w.kind, "book"),
        whereIn(
          w.slug,
          CURATED_NOW_BOOKS.map((c) => c.slug),
        ),
      ),
    columns: { id: true, slug: true, title: true, releaseYear: true },
    with: {
      persons: {
        where: (wp, { eq: whereEq }) => whereEq(wp.role, "author"),
        orderBy: (wp, { asc: orderAsc }) => [orderAsc(wp.displayOrder)],
        columns: { personId: true },
        with: { person: { columns: { name: true } } },
      },
    },
  });

  const dated = bookRows.map((w) => ({
    id: w.id,
    slug: w.slug,
    title: w.title,
    author: w.persons[0]?.person.name ?? null,
    dateLabel: w.settingDateLabel ?? fallbackDateLabel(w.startY),
    confidence: w.settingConfidence,
    sortY: Number(w.startY ?? NOW_FLOOR_Y),
    releaseYear: w.releaseYear,
  }));
  // Curated additions: a slug the dated query already covers is dropped here,
  // so a later content release (real DB date) supersedes its curated row.
  const datedSlugs = new Set(dated.map((b) => b.slug));
  const curatedBySlug = new Map(curatedRows.map((w) => [w.slug, w]));
  const curated = CURATED_NOW_BOOKS.flatMap((c) => {
    const w = curatedBySlug.get(c.slug);
    if (!w || datedSlugs.has(c.slug)) return [];
    return [
      {
        id: w.id,
        slug: w.slug,
        title: w.title,
        author: w.persons[0]?.person.name ?? null,
        dateLabel: c.dateLabel,
        confidence: c.confidence as string | null,
        sortY: c.sortY,
        releaseYear: w.releaseYear,
      },
    ];
  });

  // "The Present in Print" = the TEN NEWEST RELEASES of the window, shown in
  // canonical in-universe order. Selection axis (release year, newest wins;
  // in-universe date breaks ties) and display axis (timeline position) are
  // deliberately different — Philipp, Session 251.
  const books: NowBook[] = [...dated, ...curated]
    .sort(
      (a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0) || b.sortY - a.sortY,
    )
    .slice(0, 10)
    .sort((a, b) => a.sortY - b.sortY || a.title.localeCompare(b.title))
    .map(({ sortY: _sortY, releaseYear: _releaseYear, ...book }) => book);

  return {
    era: eraRow
      ? {
          id: eraRow.id,
          mLabel: eraRow.mLabel ?? eraRow.name,
          name: eraRow.name,
          tagline: eraRow.tagline ?? "",
          intro: eraRow.intro ?? eraRow.tagline ?? "",
        }
      : null,
    events: eventRows.map((ev) => ({
      id: ev.id,
      title: ev.title,
      dateLabel: ev.dateLabel,
      tier: ev.tier,
      approx: ev.approx,
      blurb: ev.blurb,
      artworkRef: ev.artworkRef,
      media: ev.works
        .map((h) => buildChip(h, shows))
        .filter((c): c is ChronicleChip => c !== null),
    })),
    books,
  };
}

export const loadStatusImperialis = cachedRead(
  fetchStatusImperialis,
  ["status-imperialis"],
  { tags: ["now", "timeline", "books"] },
);
