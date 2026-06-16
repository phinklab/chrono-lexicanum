import type { Metadata } from "next";
import Link from "next/link";
import SiteBackground from "@/components/chrome/SiteBackground";
import AuspexSweep from "@/components/chrono/AuspexSweep";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import GhostReadout from "@/components/chrono/GhostReadout";
import CatalogueTelemetry from "@/components/chrono/CatalogueTelemetry";
import ScrollScrim from "@/components/chrome/ScrollScrim";
import PodcastsSearch from "@/components/podcast/PodcastsSearch";
import ArchiveModeToggle from "@/components/archive/ArchiveModeToggle";
import ArchiveFooter from "@/components/chrome/ArchiveFooter";
import { loadBrowseBooks } from "@/app/archive/loader";
import { buildSearchIndex } from "@/app/archive/filters";
import { loadPrimarchSuggestions } from "@/lib/compendium/loader";
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
  const [shows, { books }, podcastData, primarchSuggestions] = await Promise.all([
    loadPodcastIndex(),
    loadBrowseBooks(),
    loadPodcastSearchIndex(),
    loadPrimarchSuggestions(),
  ]);
  const totalEpisodes = shows.reduce((n, s) => n + s.episodeCount, 0);
  const showWord =
    shows.length === 1 ? "One show" : `${shows.length} shows`;
  const searchIndex = [
    ...buildSearchIndex(books),
    ...buildPodcastSuggestions(podcastData),
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

  return (
    <main className="podcasts">
      <SiteBackground variant="vox" position="50% 38%" />
      <ScrollScrim
        className="pod-scrim"
        varName="--pod-scrim-opacity"
        heroSelector=".pod-mast"
        maxOpacity={0.7}
      />

      {/* Fixed HUD atmosphere — sweep + readout, pinned to the viewport so they
          sit over the crisp top of the cathedral-vox photo (the /ask treatment). */}
      <div className="pod-readout" aria-hidden>
        <GhostReadout
          color="var(--cl-gold)"
          opacity={0.32}
          lineMs={5000}
          typeSpeed={80}
          max={4}
          lines={readoutLines}
        />
      </div>
      <div className="pod-hud" aria-hidden>
        <div className="pod-hud__sweep">
          <AuspexSweep r={170} sweepDuration={16} accent="var(--cl-gold)" />
        </div>
      </div>

      <section className="pod-mast" aria-label="Podcasts — the lore-cast pillar">
        <FloatingCoord
          x="58%"
          y="150px"
          label="VOX · SEGMENTVM SOLAR"
          delay={1.4}
          lifetime={5}
          color="var(--cl-gold)"
          opacity={0.5}
        />
        <div className="pod-mast__inner">
          <div className="pod-mast__eyebrow">{"VOX · ARCHIVVM SONORVM"}</div>
          <h1 className="pod-mast__heading">PODCASTS</h1>
          <div className="pod-mast__rule" aria-hidden />
          <p className="pod-mast__sub">
            {shows.length === 0
              ? "No podcasts in the database yet."
              : `${showWord} · ${totalEpisodes} episodes — play in place, download, or open in your app.`}
          </p>
        </div>
      </section>

      <div className="pod-body">
        {searchIndex.length > 0 && <PodcastsSearch index={searchIndex} />}

        {/* The register fork, prominent in the controls position under the
            search — sibling of /archive's browse-controls row (Session 142;
            the fixed bottom-right micro-pill is retired). */}
        <div className="pod-controls">
          <ArchiveModeToggle active="podcasts" />
        </div>

        {shows.length > 0 && (
          <div className="pod-toolbar">
            <span className="pod-toolbar__count">
              {shows.length} · {shows.length === 1 ? "SHOW" : "SHOWS"}
            </span>
            <span className="pod-toolbar__total">/ {totalEpisodes} episodes</span>
            <span className="pod-toolbar__dot" aria-hidden>
              ·
            </span>
            <CatalogueTelemetry accent="gold" />
          </div>
        )}

        {shows.length === 0 ? (
          <div className="pod-empty">
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

        {shows.length > 0 && (
          <ArchiveFooter mid="DIRECT FEED · NO TRACKING" />
        )}
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
