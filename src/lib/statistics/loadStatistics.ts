/**
 * Librarium (/statistics) — DB loader. SERVER-ONLY (imports `@/db`).
 *
 * One payload for the archive's self-portrait page: the holdings tiles, the
 * publication curve (per release year, stacked by format group), the
 * leaderboards (authors / faction leads + antagonists / characters / places),
 * the curated facet distributions, the Goodreads rating distribution and
 * the vox archive. All aggregation happens in SQL (F3
 * verdict, Session 237 — no client charting, no chart dependency); the
 * components only draw.
 *
 * Raw SQL via `db.execute` follows the compendium idiom
 * (`src/lib/compendium/queries.ts`): the postgres client runs with
 * `fetch_types: false`, so numerics arrive as strings and are coerced here.
 *
 * Index-loader error contract (S2, see `src/lib/db-cache.ts`): arrays are
 * legitimately empty while unseeded — DB/shape errors THROW into the route's
 * error boundary. Cached under the `statistics` tag plus `books`/`podcasts`,
 * so a partial post-apply purge of either source also refreshes this page.
 */
import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { cachedRead } from "@/lib/db-cache";
import { WORLD_MENTION_THRESHOLD } from "@/lib/compendium/loader";

/**
 * The five stacked series of the publication curve, in fixed stack order
 * (baseline first — categorical hues are assigned in this order and never
 * cycled). `collected` deliberately includes anthologies, omnibuses,
 * collections and the artbook/scriptbook edge cases (n=2 each) — nine raw
 * formats would be unreadable as a stack. A NULL format (none in the current
 * catalog) lands in `collected` as the honest "other" bucket.
 */
export const FORMAT_GROUPS = [
  "novels",
  "novellas",
  "shorts",
  "audio",
  "collected",
] as const;
export type FormatGroup = (typeof FORMAT_GROUPS)[number];

/**
 * Rating extremes are only quoted among books with at least this many
 * Goodreads votes — without a floor the "best-rated book of the archive"
 * would be a 13-vote outlier. The floor is surfaced in the chart footnote.
 */
export const RATING_VOTE_FLOOR = 100;

/**
 * The Hidden Shelf inverts the floor: books UNDER the extremes floor but with
 * at least this many votes, ranked by score — the archive's quiet
 * recommendations. Below ~10 votes a 4.7 is a friends-and-family number.
 */
export const HIDDEN_GEM_MIN_VOTES = 10;

export interface LibrariumTiles {
  books: number;
  authors: number;
  episodes: number;
  /** Whole hours, rounded — the honest headline unit for ~1.5k hours. */
  episodeHours: number;
  places: number;
  events: number;
}

export interface PublicationYear {
  year: number;
  /** Counts aligned with {@link FORMAT_GROUPS}. */
  counts: Record<FormatGroup, number>;
  total: number;
}

export interface AuthorRow {
  id: string;
  name: string;
  books: number;
  firstYear: number | null;
  lastYear: number | null;
}

export interface FactionRow {
  id: string;
  name: string;
  alignment: string;
  books: number;
}

export interface CharacterRow {
  id: string;
  name: string;
  povBooks: number;
  appearsBooks: number;
  totalBooks: number;
}

export interface PlaceRow {
  id: string;
  name: string;
  books: number;
}

export interface RatingExtreme {
  slug: string;
  title: string;
  rating: number;
  votes: number;
}

export interface RatingStats {
  rated: number;
  mean: number;
  median: number;
  /** 0.1-wide bins; `bin10` is rating×10 floored (28 → [2.8, 2.9)). */
  bins: { bin10: number; count: number }[];
  best: RatingExtreme | null;
  worst: RatingExtreme | null;
}

/** One curated facet value with its book reach (multi-label — sums exceed the catalog). */
export interface FacetCount {
  id: string;
  name: string;
  books: number;
}

/** One release year's average Goodreads verdict (years with ≥3 rated books). */
export interface RatingYear {
  year: number;
  avg: number;
  n: number;
}

/** A Hidden Shelf row: high score, few votes. */
export interface HiddenGem {
  slug: string;
  title: string;
  rating: number;
  votes: number;
  year: number | null;
}

/**
 * One banner's attention gap between the vox and the shelves. Shares are
 * measured WITHIN the compared banner set per medium (tag densities differ
 * between books and episodes; normalizing inside the set cancels that), so
 * `delta` = voxShare − bookShare in percentage points.
 */
export interface VoxGapRow {
  id: string;
  name: string;
  alignment: string | null;
  books: number;
  episodes: number;
  bookShare: number;
  voxShare: number;
  delta: number;
}

export interface PodcastShowRow {
  slug: string;
  title: string;
  episodes: number;
  avgMinutes: number;
  firstYear: number | null;
  lastYear: number | null;
}

export interface PodcastYear {
  year: number;
  /** Episode count per show slug. */
  counts: Record<string, number>;
  total: number;
}

export interface VoxEntityRow {
  id: string;
  name: string;
  alignment: string | null;
  episodes: number;
}

export interface LibrariumStats {
  tiles: LibrariumTiles;
  /** Ascending by year; years with zero books are absent (fill client-side). */
  publications: PublicationYear[];
  authors: AuthorRow[];
  /** Banners split by the part they play (F3 round 3): whose story it is … */
  factionLeads: FactionRow[];
  /** … and who it is fought against. */
  factionFoes: FactionRow[];
  characters: CharacterRow[];
  places: PlaceRow[];
  ratings: RatingStats;
  /** Average verdict per release year (F3 round 5 — "Better with Age?"). */
  ratingYears: RatingYear[];
  /** The Hidden Shelf — top-scored books under the extremes' vote floor. */
  hiddenGems: HiddenGem[];
  /** Curated facet distributions (F3 rounds 2+5 — plot type & protagonist
   *  class survived the review; tone/theme were cut as too diffuse). */
  plotTypes: FacetCount[];
  protagonists: FacetCount[];
  shows: PodcastShowRow[];
  podcastYears: PodcastYear[];
  voxFactions: VoxEntityRow[];
  voxCharacters: VoxEntityRow[];
  /** Attention gap vox↔shelf per banner, sorted vox-heavy first. */
  voxGap: VoxGapRow[];
}

const toNumber = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
};

const toNumberOrNull = (v: unknown): number | null =>
  v == null ? null : toNumber(v);

const toStringOrNull = (v: unknown): string | null =>
  v == null ? null : String(v);

/** Shape-check a raw `db.execute()` result (S2 shape-error contract). */
function rows(result: unknown): ReadonlyArray<Record<string, unknown>> {
  if (!Array.isArray(result)) {
    throw new Error("[statistics/loadStatistics] SQL result is not a row array");
  }
  for (const row of result) {
    if (typeof row !== "object" || row === null || Array.isArray(row)) {
      throw new Error(
        "[statistics/loadStatistics] SQL result row is not a plain object",
      );
    }
  }
  return result as ReadonlyArray<Record<string, unknown>>;
}

async function fetchLibrariumStats(): Promise<LibrariumStats> {
  // Holdings tiles — one roundtrip of scalar subqueries.
  const tileRow = rows(
    await db.execute(sql`
      SELECT
        (SELECT count(*) FROM works WHERE kind = 'book') AS books,
        (SELECT count(DISTINCT wp.person_id)
           FROM work_persons wp
           JOIN works w ON w.id = wp.work_id AND w.kind = 'book'
          WHERE wp.role IN ('author', 'co_author')) AS authors,
        (SELECT count(*) FROM podcast_episode_details) AS episodes,
        (SELECT coalesce(sum(duration_sec), 0)
           FROM podcast_episode_details) AS episode_seconds,
        -- Same criterion as the /compendium/worlds directory the tile links
        -- to (F3 round 3: the tile said 446 raw location rows, the target
        -- page 219): a place counts once the archive returns to it.
        (SELECT count(*) FROM (
           SELECT location_id FROM work_locations
           GROUP BY location_id
           HAVING count(*) >= ${WORLD_MENTION_THRESHOLD}
         ) charted) AS places,
        (SELECT count(*) FROM events) AS events
    `),
  )[0];

  const tiles: LibrariumTiles = {
    books: toNumber(tileRow?.books),
    authors: toNumber(tileRow?.authors),
    episodes: toNumber(tileRow?.episodes),
    episodeHours: Math.round(toNumber(tileRow?.episode_seconds) / 3600),
    places: toNumber(tileRow?.places),
    events: toNumber(tileRow?.events),
  };

  // Publication curve — release year × format group.
  const pubRows = rows(
    await db.execute(sql`
      SELECT
        w.release_year AS year,
        CASE
          WHEN bd.format = 'novel' THEN 'novels'
          WHEN bd.format = 'novella' THEN 'novellas'
          WHEN bd.format = 'short_story' THEN 'shorts'
          WHEN bd.format = 'audio_drama' THEN 'audio'
          ELSE 'collected'
        END AS grp,
        count(*) AS n
      FROM works w
      JOIN book_details bd ON bd.work_id = w.id
      WHERE w.kind = 'book' AND w.release_year IS NOT NULL
      GROUP BY 1, 2
      ORDER BY 1
    `),
  );

  const byYear = new Map<number, PublicationYear>();
  for (const r of pubRows) {
    const year = toNumber(r.year);
    const grp = String(r.grp) as FormatGroup;
    if (!FORMAT_GROUPS.includes(grp)) continue;
    let entry = byYear.get(year);
    if (!entry) {
      entry = {
        year,
        counts: { novels: 0, novellas: 0, shorts: 0, audio: 0, collected: 0 },
        total: 0,
      };
      byYear.set(year, entry);
    }
    const n = toNumber(r.n);
    entry.counts[grp] += n;
    entry.total += n;
  }
  const publications = [...byYear.values()].sort((a, b) => a.year - b.year);

  // Author league — container volumes (omnibuses/collections that re-collect
  // existing works, per work_collections) are excluded so repackaging does
  // not double-count a career. count(DISTINCT) because the same person may
  // hold author AND co_author on one work (the junction PK includes role).
  const authorRows = rows(
    await db.execute(sql`
      SELECT
        p.id,
        p.name,
        count(DISTINCT w.id) AS books,
        min(w.release_year) AS first_year,
        max(w.release_year) AS last_year
      FROM work_persons wp
      JOIN works w ON w.id = wp.work_id AND w.kind = 'book'
      JOIN persons p ON p.id = wp.person_id
      WHERE wp.role IN ('author', 'co_author')
        AND w.id NOT IN (SELECT collection_work_id FROM work_collections)
      GROUP BY p.id, p.name
      ORDER BY books DESC, p.name ASC
      LIMIT 15
    `),
  );
  const authors: AuthorRow[] = authorRows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    books: toNumber(r.books),
    firstYear: toNumberOrNull(r.first_year),
    lastYear: toNumberOrNull(r.last_year),
  }));

  // Faction boards — split by junction role (F3 round 3, maintainer verdict:
  // an undifferentiated presence count buries the question readers actually
  // bring — whose story is it, and who is the enemy. Orks lead the antagonist
  // ledger with 110 books yet almost never carry a story). Two ledgers:
  // role='primary' (the banner the tale is told from) and role='antagonist';
  // 'supporting'/'background' appearances stay out of both.
  //
  // The factions table is a hierarchy (Imperium of Man → Adeptus Astartes →
  // 42 chapters → …), and a book tagged 'ultramarines' carries no extra
  // 'adeptus_astartes' row — so a flat per-tag count ranks subsets above
  // their own umbrella (Ultramarines 90 vs. Adeptus Astartes 79; flagged by
  // the maintainer in the F3 build review). Two-part fix: each ranked
  // faction counts its whole subtree (recursive CTE), and the pure CLASS
  // umbrellas — where a direct tag just means "unspecified member" — stand
  // outside the ranking entirely, else the board degrades into taxonomy
  // (Imperium 759, Chaos 493, …). A banner here is a specific army, chapter
  // or legion.
  const factionBoard = async (
    role: "primary" | "antagonist",
  ): Promise<FactionRow[]> => {
    const r = rows(
      await db.execute(sql`
        WITH RECURSIVE tree AS (
          SELECT id AS root, id AS node
          FROM factions
          WHERE id NOT IN
            ('imperium', 'chaos', 'adeptus_astartes', 'heretic_astartes')
          UNION ALL
          SELECT t.root, f.id
          FROM tree t
          JOIN factions f ON f.parent_id = t.node
        )
        SELECT f.id, f.name, f.alignment, count(DISTINCT wf.work_id) AS books
        FROM tree t
        JOIN factions f ON f.id = t.root
        JOIN work_factions wf ON wf.faction_id = t.node
          AND wf.role = ${role}
        JOIN works w ON w.id = wf.work_id AND w.kind = 'book'
        GROUP BY f.id, f.name, f.alignment
        ORDER BY books DESC, f.name ASC
        LIMIT 12
      `),
    );
    return r.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      alignment: String(row.alignment),
      books: toNumber(row.books),
    }));
  };
  const factionLeads = await factionBoard("primary");
  const factionFoes = await factionBoard("antagonist");

  // Character leaderboard — pov + appears; the 36 'mentioned' rows are noise
  // at leaderboard scale and stay out.
  const characterRows = rows(
    await db.execute(sql`
      SELECT
        c.id,
        c.name,
        count(DISTINCT wc.work_id) FILTER (WHERE wc.role = 'pov') AS pov_books,
        count(DISTINCT wc.work_id) AS total_books
      FROM work_characters wc
      JOIN works w ON w.id = wc.work_id AND w.kind = 'book'
      JOIN characters c ON c.id = wc.character_id
      WHERE wc.role IN ('pov', 'appears')
      GROUP BY c.id, c.name
      ORDER BY total_books DESC, c.name ASC
      LIMIT 15
    `),
  );
  const characters: CharacterRow[] = characterRows.map((r) => {
    const total = toNumber(r.total_books);
    const pov = toNumber(r.pov_books);
    return {
      id: String(r.id),
      name: String(r.name),
      povBooks: pov,
      appearsBooks: total - pov,
      totalBooks: total,
    };
  });

  // Most-chronicled places — deliberately unfiltered (F3 build decision):
  // regions like the Eye of Terror sit beside worlds like Terra, and the
  // chart says "places", not "worlds".
  const placeRows = rows(
    await db.execute(sql`
      SELECT l.id, l.name, count(DISTINCT wl.work_id) AS books
      FROM work_locations wl
      JOIN works w ON w.id = wl.work_id AND w.kind = 'book'
      JOIN locations l ON l.id = wl.location_id
      GROUP BY l.id, l.name
      ORDER BY books DESC, l.name ASC
      LIMIT 15
    `),
  );
  const places: PlaceRow[] = placeRows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    books: toNumber(r.books),
  }));

  // Rating distribution — every stored rating is Goodreads-sourced (probed
  // 2026-07-20: 676/896, rating_source uniformly 'goodreads'); the footnote
  // wording still reads the coverage from this payload, never hardcodes it.
  const ratingSummary = rows(
    await db.execute(sql`
      SELECT
        count(*) AS rated,
        avg(bd.rating) AS mean,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY bd.rating) AS median
      FROM book_details bd
      JOIN works w ON w.id = bd.work_id AND w.kind = 'book'
      WHERE bd.rating IS NOT NULL
    `),
  )[0];
  const ratingBins = rows(
    await db.execute(sql`
      SELECT floor(bd.rating * 10)::int AS bin10, count(*) AS n
      FROM book_details bd
      JOIN works w ON w.id = bd.work_id AND w.kind = 'book'
      WHERE bd.rating IS NOT NULL
      GROUP BY 1
      ORDER BY 1
    `),
  );
  const extreme = async (dir: "ASC" | "DESC"): Promise<RatingExtreme | null> => {
    const r = rows(
      await db.execute(sql`
        SELECT w.slug, w.title, bd.rating, bd.rating_count
        FROM book_details bd
        JOIN works w ON w.id = bd.work_id AND w.kind = 'book'
        WHERE bd.rating IS NOT NULL
          AND bd.rating_count >= ${RATING_VOTE_FLOOR}
        ORDER BY bd.rating ${dir === "ASC" ? sql`ASC` : sql`DESC`},
                 bd.rating_count DESC
        LIMIT 1
      `),
    )[0];
    if (!r) return null;
    return {
      slug: String(r.slug),
      title: String(r.title),
      rating: toNumber(r.rating),
      votes: toNumber(r.rating_count),
    };
  };
  const ratings: RatingStats = {
    rated: toNumber(ratingSummary?.rated),
    mean: toNumber(ratingSummary?.mean),
    median: toNumber(ratingSummary?.median),
    bins: ratingBins.map((r) => ({
      bin10: toNumber(r.bin10),
      count: toNumber(r.n),
    })),
    best: await extreme("DESC"),
    worst: await extreme("ASC"),
  };

  // "Better with Age?" — the average verdict per release year. Years with
  // fewer than three rated volumes would put single-book spikes on the line
  // (probed 2026-07-20: the ≥3 window runs 2004–2026, climbing ~3.5 → ~4.0).
  const trendRows = rows(
    await db.execute(sql`
      SELECT w.release_year AS year, avg(bd.rating) AS avg_rating,
             count(*) AS n
      FROM book_details bd
      JOIN works w ON w.id = bd.work_id AND w.kind = 'book'
      WHERE bd.rating IS NOT NULL AND w.release_year IS NOT NULL
      GROUP BY 1
      HAVING count(*) >= 3
      ORDER BY 1
    `),
  );
  const ratingYears: RatingYear[] = trendRows.map((r) => ({
    year: toNumber(r.year),
    avg: toNumber(r.avg_rating),
    n: toNumber(r.n),
  }));

  // The Hidden Shelf — the extremes floor inverted: loved by the few who
  // found them (pool at these bounds: ~120 books).
  const gemRows = rows(
    await db.execute(sql`
      SELECT w.slug, w.title, bd.rating, bd.rating_count, w.release_year
      FROM book_details bd
      JOIN works w ON w.id = bd.work_id AND w.kind = 'book'
      WHERE bd.rating IS NOT NULL
        AND bd.rating_count >= ${HIDDEN_GEM_MIN_VOTES}
        AND bd.rating_count < ${RATING_VOTE_FLOOR}
      ORDER BY bd.rating DESC, bd.rating_count DESC
      LIMIT 10
    `),
  );
  const hiddenGems: HiddenGem[] = gemRows.map((r) => ({
    slug: String(r.slug),
    title: String(r.title),
    rating: toNumber(r.rating),
    votes: toNumber(r.rating_count),
    year: toNumberOrNull(r.release_year),
  }));

  // Curated facet distributions — plot type + protagonist class (the tone
  // and theme categories were cut in the F3 round-5 review: too diffuse).
  // One roundtrip, split in TS. Multi-label: the counts overlap, and the
  // act's footnote says so.
  const facetRows = rows(
    await db.execute(sql`
      SELECT fv.category_id, fv.id, fv.name,
             count(DISTINCT wf.work_id) AS books
      FROM work_facets wf
      JOIN facet_values fv ON fv.id = wf.facet_value_id
      JOIN works w ON w.id = wf.work_id AND w.kind = 'book'
      WHERE fv.category_id IN ('plot_type', 'protagonist_class')
      GROUP BY fv.category_id, fv.id, fv.name
      ORDER BY books DESC, fv.name ASC
    `),
  );
  const facetsFor = (category: string): FacetCount[] =>
    facetRows
      .filter((r) => String(r.category_id) === category)
      .map((r) => ({
        id: String(r.id),
        name: String(r.name),
        books: toNumber(r.books),
      }));

  // The vox archive — shows, the episode curve, and what the podcasts talk
  // about (the ingest's LLM-extracted entity junctions on episodes).
  const showRows = rows(
    await db.execute(sql`
      SELECT p.slug, p.title, count(*) AS episodes,
             round(avg(ped.duration_sec) / 60.0) AS avg_min,
             min(extract(year FROM ped.pub_date))::int AS first_y,
             max(extract(year FROM ped.pub_date))::int AS last_y
      FROM podcast_episode_details ped
      JOIN works p ON p.id = ped.podcast_work_id
      GROUP BY p.slug, p.title
      ORDER BY episodes DESC, p.title ASC
    `),
  );
  const shows: PodcastShowRow[] = showRows.map((r) => ({
    slug: String(r.slug),
    title: String(r.title),
    episodes: toNumber(r.episodes),
    avgMinutes: toNumber(r.avg_min),
    firstYear: toNumberOrNull(r.first_y),
    lastYear: toNumberOrNull(r.last_y),
  }));

  const podYearRows = rows(
    await db.execute(sql`
      SELECT extract(year FROM ped.pub_date)::int AS year, p.slug AS show,
             count(*) AS n
      FROM podcast_episode_details ped
      JOIN works p ON p.id = ped.podcast_work_id
      WHERE ped.pub_date IS NOT NULL
      GROUP BY 1, 2
      ORDER BY 1
    `),
  );
  const podByYear = new Map<number, PodcastYear>();
  for (const r of podYearRows) {
    const year = toNumber(r.year);
    let entry = podByYear.get(year);
    if (!entry) {
      entry = { year, counts: {}, total: 0 };
      podByYear.set(year, entry);
    }
    const n = toNumber(r.n);
    const show = String(r.show);
    entry.counts[show] = (entry.counts[show] ?? 0) + n;
    entry.total += n;
  }
  const podcastYears = [...podByYear.values()].sort((a, b) => a.year - b.year);

  // Same banner semantics as the book board: subtree rollup, class umbrellas
  // outside the ranking — the two boards must stay comparable.
  const voxFactionRows = rows(
    await db.execute(sql`
      WITH RECURSIVE tree AS (
        SELECT id AS root, id AS node
        FROM factions
        WHERE id NOT IN
          ('imperium', 'chaos', 'adeptus_astartes', 'heretic_astartes')
        UNION ALL
        SELECT t.root, f.id
        FROM tree t
        JOIN factions f ON f.parent_id = t.node
      )
      SELECT f.id, f.name, f.alignment, count(DISTINCT wf.work_id) AS episodes
      FROM tree t
      JOIN factions f ON f.id = t.root
      JOIN work_factions wf ON wf.faction_id = t.node
      JOIN works w ON w.id = wf.work_id AND w.kind = 'podcast_episode'
      GROUP BY f.id, f.name, f.alignment
      ORDER BY episodes DESC, f.name ASC
      LIMIT 10
    `),
  );
  const voxFactions: VoxEntityRow[] = voxFactionRows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    alignment: toStringOrNull(r.alignment),
    episodes: toNumber(r.episodes),
  }));

  const voxCharacterRows = rows(
    await db.execute(sql`
      SELECT c.id, c.name, count(DISTINCT wc.work_id) AS episodes
      FROM work_characters wc
      JOIN works w ON w.id = wc.work_id AND w.kind = 'podcast_episode'
      JOIN characters c ON c.id = wc.character_id
      GROUP BY c.id, c.name
      ORDER BY episodes DESC, c.name ASC
      LIMIT 10
    `),
  );
  const voxCharacters: VoxEntityRow[] = voxCharacterRows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    alignment: null,
    episodes: toNumber(r.episodes),
  }));

  // "Talked About, Written About" — one rollup across both media, then the
  // gap computed in TS: candidate set = union of the top 12 banners per
  // medium; shares normalized WITHIN that set per medium (books carry more
  // faction tags per work than episodes — set-internal shares cancel the
  // density bias); delta in percentage points, vox-heavy first.
  const gapRows = rows(
    await db.execute(sql`
      WITH RECURSIVE tree AS (
        SELECT id AS root, id AS node
        FROM factions
        WHERE id NOT IN
          ('imperium', 'chaos', 'adeptus_astartes', 'heretic_astartes')
        UNION ALL
        SELECT t.root, f.id
        FROM tree t
        JOIN factions f ON f.parent_id = t.node
      )
      SELECT f.id, f.name, f.alignment,
        count(DISTINCT wf.work_id) FILTER (WHERE w.kind = 'book') AS books,
        count(DISTINCT wf.work_id)
          FILTER (WHERE w.kind = 'podcast_episode') AS episodes
      FROM tree t
      JOIN factions f ON f.id = t.root
      JOIN work_factions wf ON wf.faction_id = t.node
      JOIN works w ON w.id = wf.work_id
        AND w.kind IN ('book', 'podcast_episode')
      GROUP BY f.id, f.name, f.alignment
    `),
  );
  const gapAll = gapRows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    alignment: toStringOrNull(r.alignment),
    books: toNumber(r.books),
    episodes: toNumber(r.episodes),
  }));
  const topBy = (key: "books" | "episodes") =>
    [...gapAll].sort((a, b) => b[key] - a[key] || a.name.localeCompare(b.name))
      .slice(0, 12);
  const gapSet = new Map(
    [...topBy("books"), ...topBy("episodes")].map((f) => [f.id, f]),
  );
  const setBooks = [...gapSet.values()].reduce((s, f) => s + f.books, 0);
  const setEps = [...gapSet.values()].reduce((s, f) => s + f.episodes, 0);
  const voxGap: VoxGapRow[] = [...gapSet.values()]
    .map((f) => {
      const bookShare = setBooks > 0 ? (f.books / setBooks) * 100 : 0;
      const voxShare = setEps > 0 ? (f.episodes / setEps) * 100 : 0;
      return { ...f, bookShare, voxShare, delta: voxShare - bookShare };
    })
    .sort((a, b) => b.delta - a.delta || a.name.localeCompare(b.name));

  return {
    tiles,
    publications,
    authors,
    factionLeads,
    factionFoes,
    characters,
    places,
    ratings,
    ratingYears,
    hiddenGems,
    plotTypes: facetsFor("plot_type"),
    protagonists: facetsFor("protagonist_class"),
    shows,
    podcastYears,
    voxFactions,
    voxCharacters,
    voxGap,
  };
}

/**
 * Cross-request cached entry point (see `src/lib/db-cache.ts`). Tagged
 * `statistics` (own purge) + `books`/`podcasts` so the post-apply
 * revalidation of either source refreshes the numbers. The key carries a
 * payload-shape version: the Data Cache outlives deploys, and an old-shape
 * entry served against new code would crash the route.
 */
export const loadLibrariumStats = cachedRead(
  fetchLibrariumStats,
  ["statistics", "librarium-stats-v4"],
  { tags: ["statistics", "books", "podcasts"] },
);
