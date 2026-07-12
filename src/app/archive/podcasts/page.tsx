import type { Metadata } from "next";
import Link from "next/link";
import SiteBackground from "@/components/chrome/SiteBackground";
import AuspexPair from "@/components/chrono/AuspexPair";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import GhostReadout from "@/components/chrono/GhostReadout";
import ScrollScrim from "@/components/chrome/ScrollScrim";
import RouteScrollCue from "@/components/chrome/RouteScrollCue";
import PodcastsSearch from "@/components/podcast/PodcastsSearch";
import ArchiveModeToggle from "@/components/archive/ArchiveModeToggle";
import ArchiveFooter from "@/components/chrome/ArchiveFooter";
import { loadBrowseBooks } from "@/app/archive/loader";
import { shortDayMonth } from "@/lib/dates";
import { routeOg } from "@/lib/seo";
import { loadPodcastIndex, type PodcastIndexShow } from "./loader";

const PODCASTS_DESCRIPTION =
  "The lore-podcast pillar of the archive — every show and episode, newest first, with a direct line to play, download or open in your app.";

export const metadata: Metadata = {
  title: "Podcasts",
  description: PODCASTS_DESCRIPTION,
  alternates: { canonical: "/archive/podcasts" },
  openGraph: routeOg({ title: "Podcasts", description: PODCASTS_DESCRIPTION }),
};

// Static shell, refreshed hourly (matches Home) so newly-ingested episodes
// surface without a redeploy. No searchParams here, so the page stays static.
export const revalidate = 3600;

function yearSpan(first: number | null, last: number | null): string | null {
  if (first == null || last == null) return null;
  return first === last ? `${last}` : `${first}–${last}`;
}

export default async function PodcastsPage() {
  // The show hall plus the books count for the WORKS door. The archive-wide
  // search console fetches its index lazily (/api/search-index, S6) — nothing
  // search-related rides in this page's flight.
  const [shows, { books }] = await Promise.all([
    loadPodcastIndex(),
    loadBrowseBooks(),
  ]);
  const totalEpisodes = shows.reduce((n, s) => n + s.episodeCount, 0);
  const showWord =
    shows.length === 1 ? "One show" : `${shows.length} shows`;

  // Honest vox — real holdings, no pseudo-telemetry.
  const voxLines = [
    "Vox · archivvm sonorvm",
    `${shows.length} ${shows.length === 1 ? "show" : "shows"} · ${totalEpisodes} episodes`,
    "Feed · RSS direct",
    "Cognitio link stable",
  ];

  // The podcasts index rides /archive's catalogue shell:
  // same library backdrop, same 100dvh floated-title hero, same
  // overlay/scrim, same centred search console + register fork — so toggling
  // WORKS↔PODCASTS shifts no element. Only the list below swaps (book rows ↔
  // show cards). The .catalogue--vox modifier shares the --werke styling via
  // :is() in 61/31; the per-show detail page keeps its own main.podcasts shell.
  return (
    <main className="catalogue catalogue--vox">
      <SiteBackground variant="main" position="right bottom" />
      <GhostReadout lines={voxLines} />

      <section
        className="catalogue-hero route-act"
        aria-label="Podcasts — the lore-cast pillar"
      >
        <ScrollScrim
          className="site-scrim"
          varName="--scrim-o"
          heroSelector=".catalogue-hero"
          maxOpacity={0.94}
        />
        <AuspexPair />
        <FloatingCoord x="10%" y="32%" label="Vox · Segmentvm Solar" delay={9} />

        <p className="catalogue-hero__over">The Index</p>
        <h1 className="catalogue-hero__heading">The Archive</h1>
        <p className="catalogue-hero__edition">
          {shows.length === 0
            ? "No podcasts in the database yet."
            : `${showWord} · ${totalEpisodes} episodes — play in place, download, or open in your app.`}
        </p>
        <RouteScrollCue
          className="route-cue--flow"
          label="Choose your archive"
          target=".catalogue-body"
        />
      </section>

      <div className="catalogue-body route-body-snap">
        <ArchiveModeToggle
          active="podcasts"
          booksLine={`${books.length} novels, novellas & audio dramas`}
          podcastsLine={`${totalEpisodes} episodes · ${showWord.toLowerCase()}`}
        />

        <div className="browse-filters" role="group" aria-label="Browse the archive">
          <PodcastsSearch />
        </div>

        {shows.length > 0 && (
          <p className="catalogue-census">
            <b>
              {shows.length} · {shows.length === 1 ? "show" : "shows"}
            </b>{" "}
            / {totalEpisodes} episodes
          </p>
        )}

        {shows.length === 0 ? (
          <div className="catalogue-empty">
            The vox archive is silent — no feeds have reached it yet.
          </div>
        ) : (
          <div className="pod-hall">
            {shows.map((show) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
        )}

        {shows.length > 0 && <ArchiveFooter mid="DIRECT FEED · NO TRACKING" />}
      </div>
    </main>
  );
}

/**
 * A frameless show block. The whole surface navigates to the detail route via a
 * stretched title-link (`.pod-card__title-link::after` covers the block); the
 * platform links sit on a higher stacking layer so they stay independently
 * clickable without nesting an <a> inside an <a>.
 */
function ShowCard({ show }: { show: PodcastIndexShow }) {
  const span = yearSpan(show.firstPubYear, show.lastPubYear);

  return (
    <article className="pod-card">
      <div className="pod-card__art" aria-hidden>
        {show.artUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={show.artUrl} alt="" loading="lazy" width={132} height={132} />
        ) : (
          <div className="pod-card__art-ph">VOX</div>
        )}
      </div>

      <div className="pod-card__body">
        <h2 className="pod-card__title">
          <Link href={`/archive/podcasts/${show.slug}`} className="pod-card__title-link">
            {show.title}
          </Link>
        </h2>
        <p className="pod-card__stats">
          {show.episodeCount} episodes{span ? ` · ${span}` : ""}
        </p>

        {show.platformLinks.length > 0 && (
          <div className="pod-card__platforms">
            {show.platformLinks.map((p) => (
              <a
                key={p.serviceId}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="pod-platform"
              >
                {p.label} ↗
              </a>
            ))}
          </div>
        )}

        {show.latest.length > 0 && (
          <ul className="pod-card__latest" aria-label="Latest episodes">
            {show.latest.map((ep) => (
              <li key={ep.id} className="pod-card__latest-row">
                <span className="pod-card__latest-date">
                  {shortDayMonth(ep.pubDateMs)}
                </span>
                <span className="pod-card__latest-title">{ep.title}</span>
              </li>
            ))}
          </ul>
        )}

        <span className="pod-card__open" aria-hidden>
          Open show →
        </span>
      </div>
    </article>
  );
}
