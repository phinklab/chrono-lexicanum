import type { Metadata } from "next";
import Link from "next/link";
import SiteBackground from "@/components/chrome/SiteBackground";
import AuspexSweep from "@/components/chrono/AuspexSweep";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import GhostReadout from "@/components/chrono/GhostReadout";
import ScrollScrim from "@/components/chrome/ScrollScrim";
import RouteScrollCue from "@/components/chrome/RouteScrollCue";
import PodcastsSearch from "@/components/podcast/PodcastsSearch";
import ArchiveModeToggle from "@/components/archive/ArchiveModeToggle";
import ArchiveFooter from "@/components/chrome/ArchiveFooter";
import { loadBrowseBooks } from "@/app/archive/loader";
import { buildSearchIndex } from "@/app/archive/filters";
import {
  loadCompendiumSearchSuggestions,
  loadPrimarchSuggestions,
} from "@/lib/compendium/loader";
import {
  loadPodcastIndex,
  loadPodcastSearchIndex,
  buildPodcastSuggestions,
  type PodcastIndexShow,
} from "./loader";

export const metadata: Metadata = {
  title: "Podcasts — Chrono Lexicanum",
  description:
    "The lore-podcast pillar of the archive — every show and episode, newest first, with a direct line to play, download or open in your app.",
};

// Static shell, refreshed hourly (matches Home) so newly-ingested episodes
// surface without a redeploy. No searchParams here, so the page stays static.
export const revalidate = 3600;

const DAY_MONTH = new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" });

function shortDate(ms: number | null): string {
  return ms == null ? "—" : DAY_MONTH.format(new Date(ms));
}

function yearSpan(first: number | null, last: number | null): string | null {
  if (first == null || last == null) return null;
  return first === last ? `${last}` : `${first}–${last}`;
}

export default async function PodcastsPage() {
  // The show hall plus the unified search index — books (from /archive) merged
  // with podcasts so this view carries the same archive-wide search Home and
  // the books view do.
  const [
    shows,
    { books },
    podcastData,
    compendiumSuggestions,
    primarchSuggestions,
  ] = await Promise.all([
    loadPodcastIndex(),
    loadBrowseBooks(),
    loadPodcastSearchIndex(),
    loadCompendiumSearchSuggestions(),
    loadPrimarchSuggestions(),
  ]);
  const totalEpisodes = shows.reduce((n, s) => n + s.episodeCount, 0);
  const showWord =
    shows.length === 1 ? "One show" : `${shows.length} shows`;
  const searchIndex = [
    ...buildSearchIndex(books),
    ...buildPodcastSuggestions(podcastData),
    ...compendiumSuggestions,
    ...primarchSuggestions,
  ];

  // Honest readout — real holdings, no pseudo-telemetry (the feed/latency
  // lines died with the lab port, Report 141; sibling of /archive's readout).
  const readoutLines = [
    "· VOX · ARCHIVVM SONORVM",
    `· ${shows.length} ${shows.length === 1 ? "SHOW" : "SHOWS"} · ${totalEpisodes} EPISODES`,
    "· FEED · RSS DIRECT",
    "· PLAY / DOWNLOAD / OPEN IN APP",
    "· COGNITIO LINK STABLE",
  ];

  // The podcasts index rides /archive's catalogue shell (Brief-less polish
  // 2026-06-19): same library backdrop, same 100dvh floated-title hero, same
  // overlay/scrim, same centred search console + register fork — so toggling
  // WORKS↔PODCASTS shifts no element. Only the list below swaps (book rows ↔
  // show cards). The .catalogue--vox modifier shares the --werke styling via
  // :is() in 61/31; the per-show detail page keeps its own main.podcasts shell.
  return (
    <main className="catalogue catalogue--vox">
      <SiteBackground variant="main" position="right bottom" />
      <section
        className="catalogue-hero route-act"
        aria-label="Podcasts — the lore-cast pillar"
      >
        <ScrollScrim maxOpacity={0.77} />
        <div className="catalogue-hero__sweep" aria-hidden>
          <AuspexSweep r={180} sweepDuration={18} accent="var(--cl-gold)" />
        </div>
        <div className="werke-hero__readout" aria-hidden>
          <GhostReadout
            color="var(--cl-gold)"
            opacity={0.34}
            lineMs={5200}
            typeSpeed={80}
            max={4}
            lines={readoutLines}
          />
        </div>
        <FloatingCoord
          x="42%"
          y="120px"
          label="VOX · SEGMENTVM SOLAR"
          delay={1.2}
          lifetime={5}
          color="var(--cl-gold)"
          opacity={0.55}
        />
        <FloatingCoord
          x="58%"
          y="220px"
          label="FEED · RSS DIRECT"
          delay={3.0}
          lifetime={5}
          color="var(--cl-gold)"
          opacity={0.55}
        />
        <div className="catalogue-hero__title">
          <div className="catalogue-hero__eyebrow">{"VOX · ARCHIVVM SONORVM"}</div>
          <h1 className="catalogue-hero__heading">PODCASTS</h1>
          <div className="catalogue-hero__rule" aria-hidden />
          <p className="catalogue-hero__sub">
            {shows.length === 0
              ? "No podcasts in the database yet."
              : `${showWord} · ${totalEpisodes} episodes — play in place, download, or open in your app.`}
          </p>
        </div>
        <RouteScrollCue label="Browse the podcasts" target=".catalogue-body" />
      </section>

      <div className="catalogue-body route-body-snap">
        {searchIndex.length > 0 && (
          <div className="browse-filters" role="group" aria-label="Browse the archive">
            <PodcastsSearch index={searchIndex} />
            {/* The register fork (WORKS | PODCASTS) leads the controls row, in
                the same slot as /archive's WerkeFilters — the toggle is the
                pivot, so it must not move when the views swap. */}
            <div className="browse-controls">
              <ArchiveModeToggle active="podcasts" />
            </div>
          </div>
        )}

        {shows.length > 0 && (
          <div className="catalogue-toolbar">
            <div className="catalogue-toolbar__left">
              <span className="catalogue-toolbar__count">
                {shows.length} · {shows.length === 1 ? "SHOW" : "SHOWS"}
              </span>
              <span className="catalogue-toolbar__total">/ {totalEpisodes} episodes</span>
            </div>
          </div>
        )}

        {shows.length === 0 ? (
          <div className="catalogue-empty">
            The database has no podcast feeds yet. Once a feed is ingested its
            shows and episodes will appear here.
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
        <div className="pod-card__kicker">PODCAST · LORE CAST</div>
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
                  {shortDate(ep.pubDateMs)}
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
