import type { Metadata } from "next";
import Link from "next/link";
import SiteBackground from "@/components/chrome/SiteBackground";
import ScrollScrim from "@/components/chrome/ScrollScrim";
import ArchiveFooter from "@/components/chrome/ArchiveFooter";
import RouteScrollCue from "@/components/chrome/RouteScrollCue";
import { routeOg } from "@/lib/seo";
import {
  loadLibrariumStats,
  RATING_VOTE_FLOOR,
  HIDDEN_GEM_MIN_VOTES,
  type FacetCount,
  type PodcastShowRow,
} from "@/lib/statistics/loadStatistics";
import StatTiles from "@/components/statistics/StatTiles";
import LibrariumNav from "@/components/statistics/LibrariumNav";
import RatingTrendChart from "@/components/statistics/RatingTrendChart";
import VoxGapBoard from "@/components/statistics/VoxGapBoard";
import PublicationChart from "@/components/statistics/PublicationChart";
import StackedYearChart from "@/components/statistics/StackedYearChart";
import BarLeaderboard from "@/components/statistics/BarLeaderboard";
import ChartLegend from "@/components/statistics/ChartLegend";
import RatingHistogram from "@/components/statistics/RatingHistogram";
import { fmt } from "@/components/statistics/chart-utils";
// Route-scoped stylesheet (S7a): the Librarium loads only here.
import "@/app/styles/60-statistics.css";

// Request-time route, like /now: the payload has no snapshot artifact, and a
// build-time prerender would read the live DB — an E4 violation (builds
// render from the committed snapshot only). The tagged Data Cache in the
// loader (TTL + `statistics` purge) carries the load instead.
export const dynamic = "force-dynamic";

const LIBRARIUM_DESCRIPTION =
  "The archive counts itself: three and a half decades of Black Library publishing, the busiest authors, protagonist and antagonist factions, the most-chronicled characters and worlds of Warhammer 40,000, and what the lore podcasts talk about.";

export const metadata: Metadata = {
  title: "Librarium — The Archive in Numbers",
  description: LIBRARIUM_DESCRIPTION,
  alternates: { canonical: "/statistics" },
  openGraph: routeOg({
    title: "Librarium — The Archive in Numbers",
    description: LIBRARIUM_DESCRIPTION,
  }),
};

/**
 * /statistics — the Librarium, the archive's self-portrait in charts (F3
 * verdict, Session 237; chart set revised across the F3 build review — the
 * setting-vs-release scatter was retired, the curated facet distributions
 * and the vox-archive act joined, the faction act split into lead/antagonist
 * ledgers, and the front-matter TOC became the sticky chapter rail).
 * Everything is computed live from the DB by `loadLibrariumStats` (cached
 * under the `statistics` tag); the charts are hand-rolled SVG/HTML Server
 * Components — no chart dependency, interactivity capped at CSS hover +
 * native tooltips. The one client island beyond the shared chrome is
 * LibrariumNav, whose history-free chapter jumps also fix the detail-overlay
 * back bug (see that file).
 */

const ALIGNMENT_VAR: Record<string, string> = {
  imperium: "--libr-c-imperium",
  chaos: "--libr-c-chaos",
  xenos: "--libr-c-xenos",
  // Neutral factions have never reached the top ranks; if one does it wears
  // the validated fifth categorical slot instead of stealing an allegiance hue.
  neutral: "--libr-c-collected",
};

/** The validated five categorical slots, reused as the show-stack palette. */
const SHOW_VARS = [
  "--libr-c-novel",
  "--libr-c-novella",
  "--libr-c-short",
  "--libr-c-audio",
  "--libr-c-collected",
];

/** "Lorehammer - A Warhammer 40k Podcast" → "Lorehammer" (legend label). */
const showShortName = (title: string): string =>
  title.split(/\s+[-–—:]\s+/)[0] || title;

/**
 * The chapter list for LibrariumNav: `label` is the short running title (the
 * marginalia rail + running head), `full` the chapter name as it stands over
 * its act (worn by the unfolded table of contents).
 */
const CONTENTS = [
  { num: "I", label: "Holdings", full: "The Holdings", id: "holdings" },
  { num: "II", label: "Stacks", full: "The Growing Stacks", id: "stacks" },
  { num: "III", label: "Scribes", full: "The Scribes’ League", id: "scribes" },
  { num: "IV", label: "Banners", full: "Banners on the Shelves", id: "banners" },
  { num: "V", label: "Cast", full: "The Recurring Cast", id: "cast" },
  { num: "VI", label: "Places", full: "Most-Chronicled Places", id: "places" },
  { num: "VII", label: "Shapes", full: "The Shape of the Stories", id: "shapes" },
  { num: "VIII", label: "Verdict", full: "The Readers’ Verdict", id: "verdict" },
  { num: "IX", label: "Trend", full: "Better with Age?", id: "trend" },
  { num: "X", label: "Gems", full: "The Hidden Shelf", id: "gems" },
  { num: "XI", label: "Vox", full: "The Vox Archive", id: "vox" },
  { num: "XII", label: "Vox Gap", full: "Talked About, Written About", id: "gap" },
];

/** Facet distribution rows → board rows (linked into the archive filter). */
function facetBoardRows(facets: FacetCount[], totalBooks: number) {
  return facets.map((f) => ({
    key: f.id,
    href: `/archive?facet=${encodeURIComponent(f.id)}`,
    label: f.name,
    value: f.books,
    annotation:
      totalBooks > 0
        ? `${Math.round((f.books / totalBooks) * 100)}% of books`
        : undefined,
    segments: [{ value: f.books, varName: "--libr-c-gold", label: "books" }],
    title: `${f.name}: ${f.books} books`,
  }));
}

function ShowRoster({ shows }: { shows: PodcastShowRow[] }) {
  return (
    <ul className="libr-extremes" aria-label="The archive's podcast shows">
      {shows.map((s) => (
        <li key={s.slug}>
          <Link className="libr-extreme" href={`/archive/podcasts/${s.slug}`}>
            <span className="libr-extreme__kind">
              {s.firstYear && s.lastYear
                ? `${s.firstYear}–${s.lastYear}`
                : "on air"}
            </span>
            <span className="libr-extreme__title">{s.title}</span>
            <span className="libr-extreme__meta">
              {fmt(s.episodes)} episodes · ≈{fmt(s.avgMinutes)} min each
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function StatisticsPage() {
  const stats = await loadLibrariumStats();
  const { tiles, ratings } = stats;

  const showSeries = stats.shows.slice(0, SHOW_VARS.length).map((s, i) => ({
    key: s.slug,
    label: showShortName(s.title),
    singular: `episode from ${showShortName(s.title)}`,
    plural: `episodes from ${showShortName(s.title)}`,
    varName: SHOW_VARS[i],
  }));

  return (
    <main id="main" tabIndex={-1} className="libr-shell">
      <SiteBackground variant="main" position="right bottom" />
      <ScrollScrim
        className="site-scrim"
        varName="--scrim-o"
        heroSelector=".libr-hero"
        maxOpacity={0.94}
      />

      {/* Masthead — the house fold rule (~92vh act, copy docked at the fold). */}
      <header className="libr-hero">
        <p className="libr-hero__over">The archive counts itself</p>
        <h1 className="libr-hero__heading">Librarium</h1>
        <p className="libr-hero__edition">
          The whole record, from the first novel to the newest podcast,
          <em className="libr-hero__edition-q">drawn to scale.</em>
        </p>
        <RouteScrollCue
          className="route-cue--flow libr-hero__cue"
          label="Open the ledger"
          target=".libr-holdings"
        />
      </header>

      {/* Chapter navigation: marginalia rail on the right edge (desktop),
          running head + unfolding contents below 1180px; jumps touch no
          history (see LibrariumNav on the detail-overlay back bug). */}
      <LibrariumNav chapters={CONTENTS} />

      {/* I — the headline counts. */}
      <section
        id="holdings"
        className="libr-act libr-holdings"
        aria-label="The holdings"
      >
        <h2 className="lx-sect reveal">The Holdings</h2>
        <div className="reveal">
          <StatTiles tiles={tiles} />
        </div>
      </section>

      {/* II — publications per year, stacked by format. */}
      <section
        id="stacks"
        className="libr-act"
        aria-label="Books published per year"
      >
        <h2 className="lx-sect reveal">The Growing Stacks</h2>
        <p className="libr-lede lx-prose reveal">
          What Black Library put on the shelves each year, stacked by
          format. Hover over a column for the exact numbers.
        </p>
        <div className="reveal">
          <PublicationChart publications={stats.publications} />
        </div>
      </section>

      {/* III — the author league. */}
      <section
        id="scribes"
        className="libr-act"
        aria-label="Most prolific authors"
      >
        <h2 className="lx-sect reveal">The Scribes&rsquo; League</h2>
        <p className="libr-lede lx-prose reveal">
          The fifteen busiest authors in the archive. The year range marks
          their first and their latest book.
        </p>
        <div className="reveal">
          <BarLeaderboard
            ariaLabel="Top 15 authors by number of books"
            rows={stats.authors.map((a) => ({
              key: a.id,
              href: `/person/${encodeURIComponent(a.id)}`,
              label: a.name,
              value: a.books,
              annotation:
                a.firstYear && a.lastYear
                  ? `${a.firstYear}–${a.lastYear}`
                  : undefined,
              segments: [
                { value: a.books, varName: "--libr-c-gold", label: "books" },
              ],
              title: `${a.name}: ${a.books} books`,
            }))}
          />
        </div>
      </section>

      {/* IV — faction presence. */}
      <section
        id="banners"
        className="libr-act"
        aria-label="Most present factions"
      >
        <h2 className="lx-sect reveal">Banners on the Shelves</h2>
        <p className="libr-lede lx-prose reveal">
          One ranking with two readings. Protagonists shows whose story a
          book tells, Antagonists shows who stands against them. The
          Imperium supplies most of the heroes; its enemies fill the
          opposing list.
        </p>
        {/* One board, two modes — a CSS-only radio toggle in the map
            era-plate's segment language (gold dot marks the active mode);
            the checked radio decides which ledger is shown. No client JS. */}
        <div className="libr-ledger reveal">
          <input
            type="radio"
            name="banners-mode"
            id="banners-lead"
            className="libr-ledger__radio libr-ledger__radio--lead"
            defaultChecked
          />
          <input
            type="radio"
            name="banners-mode"
            id="banners-foe"
            className="libr-ledger__radio libr-ledger__radio--foe"
          />
          <div className="libr-ledger__modes">
            <label className="libr-ledger__mode" htmlFor="banners-lead">
              Protagonists
            </label>
            <label className="libr-ledger__mode" htmlFor="banners-foe">
              Antagonists
            </label>
          </div>
          <ChartLegend
            items={[
              { varName: "--libr-c-imperium", label: "Imperium" },
              { varName: "--libr-c-chaos", label: "Chaos" },
              { varName: "--libr-c-xenos", label: "Xenos" },
            ]}
          />
          <div className="libr-ledger__view libr-ledger__view--lead">
            <BarLeaderboard
              ariaLabel="Top 12 factions leading books"
              rows={stats.factionLeads.map((f) => ({
                key: f.id,
                href: `/faction/${encodeURIComponent(f.id)}`,
                label: f.name,
                value: f.books,
                annotation: f.alignment,
                segments: [
                  {
                    value: f.books,
                    varName:
                      ALIGNMENT_VAR[f.alignment] ?? "--libr-c-collected",
                    label: f.alignment,
                  },
                ],
                title: `${f.name}: protagonist in ${f.books} books`,
              }))}
            />
          </div>
          <div className="libr-ledger__view libr-ledger__view--foe">
            <BarLeaderboard
              ariaLabel="Top 12 factions as antagonists"
              rows={stats.factionFoes.map((f) => ({
                key: f.id,
                href: `/faction/${encodeURIComponent(f.id)}`,
                label: f.name,
                value: f.books,
                annotation: f.alignment,
                segments: [
                  {
                    value: f.books,
                    varName:
                      ALIGNMENT_VAR[f.alignment] ?? "--libr-c-collected",
                    label: f.alignment,
                  },
                ],
                title: `${f.name}: antagonist in ${f.books} books`,
              }))}
            />
          </div>
          <p className="libr-foot">
            each faction is counted together with its chapters, regiments
            and orders; umbrella groups like the Imperium or Chaos as a
            whole are not ranked
          </p>
        </div>
      </section>

      {/* V — the recurring cast. */}
      <section
        id="cast"
        className="libr-act"
        aria-label="Most recurring characters"
      >
        <h2 className="lx-sect reveal">The Recurring Cast</h2>
        <p className="libr-lede lx-prose reveal">
          Who keeps returning to the page. The solid part of each bar
          counts the books told from that character&rsquo;s point of view.
        </p>
        <div className="reveal">
          <ChartLegend
            items={[
              { varName: "--libr-c-gold", label: "Point of view" },
              { varName: "--libr-c-gold-faint", label: "Appears" },
            ]}
          />
          <BarLeaderboard
            ariaLabel="Top 15 characters by number of books"
            rows={stats.characters.map((c) => ({
              key: c.id,
              href: `/character/${encodeURIComponent(c.id)}`,
              label: c.name,
              value: c.totalBooks,
              segments: [
                {
                  value: c.povBooks,
                  varName: "--libr-c-gold",
                  label: "pov",
                },
                {
                  value: c.appearsBooks,
                  varName: "--libr-c-gold-faint",
                  label: "appears",
                },
              ],
              title: `${c.name}: ${c.totalBooks} books (${c.povBooks} as point of view)`,
            }))}
          />
          <p className="libr-foot">
            character tagging is densest for the Horus Heresy; figures of
            the 41st millennium are undercounted here
          </p>
        </div>
      </section>

      {/* VI — most-chronicled places. */}
      <section
        id="places"
        className="libr-act"
        aria-label="Most chronicled places"
      >
        <h2 className="lx-sect reveal">Most-Chronicled Places</h2>
        <p className="libr-lede lx-prose reveal">
          Where the stories keep returning. Worlds share this list with
          larger regions: the Eye of Terror is not a world, but few places
          are written about more.
        </p>
        <div className="reveal">
          <BarLeaderboard
            ariaLabel="Top 15 places by number of books"
            rows={stats.places.map((p) => ({
              key: p.id,
              href: `/world/${encodeURIComponent(p.id)}`,
              label: p.name,
              value: p.books,
              segments: [
                { value: p.books, varName: "--libr-c-gold", label: "books" },
              ],
              title: `${p.name}: chronicled in ${p.books} books`,
            }))}
          />
        </div>
      </section>

      {/* VII — plot types + protagonists. */}
      <section
        id="shapes"
        className="libr-act"
        aria-label="Plot types and protagonists"
      >
        <h2 className="lx-sect reveal">The Shape of the Stories</h2>
        <p className="libr-lede lx-prose reveal">
          War stories lead, as expected. The mystery shelf runs deeper than
          the reputation suggests. The second board shows who gets to carry
          the story.
        </p>
        <div className="libr-duo reveal">
          <div>
            <p className="libr-kicker">Plot types</p>
            <BarLeaderboard
              ariaLabel="Books per plot type"
              showRank={false}
              rows={facetBoardRows(stats.plotTypes, tiles.books)}
            />
          </div>
          <div>
            <p className="libr-kicker">Who carries the story</p>
            <BarLeaderboard
              ariaLabel="Books per protagonist class"
              showRank={false}
              rows={facetBoardRows(stats.protagonists, tiles.books)}
            />
          </div>
        </div>
        <p className="libr-foot reveal">
          a book can carry several tags, so the readings overlap
        </p>
      </section>

      {/* VIII — the readers' verdict. */}
      <section
        id="verdict"
        className="libr-act"
        aria-label="Rating distribution"
      >
        <h2 className="lx-sect reveal">The Readers&rsquo; Verdict</h2>
        <p className="libr-lede lx-prose reveal">
          How the shelves score: every rated volume&rsquo;s Goodreads
          average, binned to a tenth of a star.
        </p>
        <div className="reveal">
          <RatingHistogram ratings={ratings} />
          <p className="libr-foot">source: Goodreads</p>
        </div>
      </section>

      {/* IX — the verdict over time. */}
      <section
        id="trend"
        className="libr-act"
        aria-label="Average rating per release year"
      >
        <h2 className="lx-sect reveal">Better with Age?</h2>
        <p className="libr-lede lx-prose reveal">
          Each year&rsquo;s releases, scored by their readers. The average
          has been climbing for two decades.
        </p>
        <div className="reveal">
          <RatingTrendChart years={stats.ratingYears} />
          <p className="libr-foot">
            yearly Goodreads averages, drawn for years with at least three
            rated volumes
          </p>
        </div>
      </section>

      {/* X — the hidden shelf. */}
      <section
        id="gems"
        className="libr-act"
        aria-label="Highly rated books with few ratings"
      >
        <h2 className="lx-sect reveal">The Hidden Shelf</h2>
        <p className="libr-lede lx-prose reveal">
          High scores from small crowds: books their readers loved but few
          have found. Every row opens the book.
        </p>
        <div className="reveal">
          <ul className="libr-extremes" aria-label="The hidden shelf">
            {stats.hiddenGems.map((g) => (
              <li key={g.slug}>
                <Link className="libr-extreme" href={`/book/${g.slug}`}>
                  <span className="libr-extreme__kind">
                    rated {g.rating.toFixed(2)}
                  </span>
                  <span className="libr-extreme__title">{g.title}</span>
                  <span className="libr-extreme__meta">
                    {fmt(g.votes)} ratings{g.year ? ` · ${g.year}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="libr-foot">
            books with at least {HIDDEN_GEM_MIN_VOTES} but fewer than
            {" "}{RATING_VOTE_FLOOR} ratings
          </p>
        </div>
      </section>

      {/* XI — the vox archive. */}
      <section id="vox" className="libr-act" aria-label="The podcast archive">
        <h2 className="lx-sect reveal">The Vox Archive</h2>
        <p className="libr-lede lx-prose reveal">
          The spoken record: {fmt(tiles.episodes)} episodes across{" "}
          {stats.shows.length} lore shows, roughly {fmt(tiles.episodeHours)}{" "}
          hours of listening, and a tally of what the shows keep coming
          back to.
        </p>
        <div className="reveal">
          <StackedYearChart
            data={stats.podcastYears}
            series={showSeries}
            ariaLabel="Podcast episodes per year, stacked by show"
          />
          <p className="libr-kicker libr-kicker--roster">
            <span className="libr-kicker__tag">Vox</span>The shows on record
          </p>
          <ShowRoster shows={stats.shows} />
        </div>
        <div className="libr-duo libr-duo--pushed reveal">
          <div>
            <p className="libr-kicker">
              <span className="libr-kicker__tag">Vox</span>Most-discussed
              banners
            </p>
            <BarLeaderboard
              ariaLabel="Top 10 factions by podcast episodes"
              rows={stats.voxFactions.map((f) => ({
                key: f.id,
                href: `/faction/${encodeURIComponent(f.id)}`,
                label: f.name,
                value: f.episodes,
                annotation: f.alignment ?? undefined,
                segments: [
                  {
                    value: f.episodes,
                    varName: f.alignment
                      ? ALIGNMENT_VAR[f.alignment] ?? "--libr-c-collected"
                      : "--libr-c-collected",
                    label: f.alignment ?? "faction",
                  },
                ],
                title: `${f.name}: discussed in ${f.episodes} episodes`,
              }))}
            />
          </div>
          <div>
            <p className="libr-kicker">
              <span className="libr-kicker__tag">Vox</span>Most-discussed
              figures
            </p>
            <BarLeaderboard
              ariaLabel="Top 10 characters by podcast episodes"
              rows={stats.voxCharacters.map((c) => ({
                key: c.id,
                href: `/character/${encodeURIComponent(c.id)}`,
                label: c.name,
                value: c.episodes,
                segments: [
                  {
                    value: c.episodes,
                    varName: "--libr-c-gold",
                    label: "episodes",
                  },
                ],
                title: `${c.name}: discussed in ${c.episodes} episodes`,
              }))}
            />
          </div>
        </div>
        <p className="libr-foot reveal">
          factions and figures are machine-read from the episode notes; the
          counting rules match the book ranking
        </p>
      </section>

      {/* XII — the attention gap between the vox and the shelves. */}
      <section
        id="gap"
        className="libr-act"
        aria-label="Attention gap between podcasts and books"
      >
        <h2 className="lx-sect reveal">Talked About, Written About</h2>
        <p className="libr-lede lx-prose reveal">
          The podcasts and the shelves disagree. The talk leans xenos:
          Necrons, Aeldari and Orks get more airtime than their shelf space
          earns, while the Guard and the Traitor Legions are written about
          far more than they are discussed.
        </p>
        <div className="reveal">
          <ChartLegend
            items={[
              { varName: "--libr-c-gold", label: "Louder on the shelf" },
              { varName: "--libr-c-xenos", label: "Louder on the vox" },
            ]}
          />
          <VoxGapBoard rows={stats.voxGap} />
          <p className="libr-foot">
            each faction&rsquo;s share of podcast episodes against its
            share of books, measured among the factions listed here; the
            bar shows the difference in percentage points
          </p>
        </div>
      </section>

      <ArchiveFooter mid="Numbers are also a chronicle" />
    </main>
  );
}
