import type { Metadata } from "next";
import SiteBackground from "@/components/chrome/SiteBackground";
import AuspexSweep from "@/components/chrono/AuspexSweep";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import GhostReadout from "@/components/chrono/GhostReadout";
import { loadPodcasts, type PodcastEpisode, type PodcastShow } from "./loader";

export const metadata: Metadata = {
  title: "Podcasts — Chrono Lexicanum",
  description:
    "The lore-podcast pillar of the archive — shows and every episode, newest first, with a direct line to listen.",
};

// Static shell, refreshed hourly (matches the Home) so newly-ingested episodes
// surface without a redeploy. No searchParams here, so the page stays static.
export const revalidate = 3600;

// Editorial vocabulary for episodeKind. 'lore' is the house norm for a lore
// podcast, so it stays unchipped (149 identical "LORE" chips would be noise) —
// only the off-format episodes carry a tag.
const EPISODE_KIND_LABELS: Record<string, string> = {
  lore: "Lore",
  news_recap: "News & recap",
  interview: "Interview",
  other: "Other",
};

const READOUT_LINES = [
  "· VOX · ARCHIVVM SONORVM",
  "· FEED MOUNTED · RSS STABLE",
  "· DECODE · MP3 ENCLOSVRE",
  "· SIGNAL · LORE CAST",
  "· LATENCY NOMINAL",
  "· AVDITIO · READY",
];

function formatDuration(sec: number | null): string | null {
  if (sec == null || sec <= 0) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m`;
}

const DAY_MONTH = new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" });

function shortDate(d: Date | null): string {
  return d ? DAY_MONTH.format(d) : "—";
}

interface YearGroup {
  year: number | null;
  episodes: PodcastEpisode[];
}

/** Group an already-newest-first episode list into year buckets, preserving
 *  order (so the buckets come out newest-year-first, undated last). */
function groupByYear(episodes: PodcastEpisode[]): YearGroup[] {
  const groups: YearGroup[] = [];
  let current: YearGroup | null = null;
  for (const ep of episodes) {
    const y = ep.pubDate ? ep.pubDate.getUTCFullYear() : null;
    if (!current || current.year !== y) {
      current = { year: y, episodes: [] };
      groups.push(current);
    }
    current.episodes.push(ep);
  }
  return groups;
}

export default async function PodcastsPage() {
  const shows = await loadPodcasts();
  const totalEpisodes = shows.reduce((n, s) => n + s.episodeCount, 0);

  return (
    <main className="podcasts">
      <SiteBackground variant="librarium" position="50% 38%" />

      <header className="pod-hero">
        <div className="pod-hero__sweep" aria-hidden>
          <AuspexSweep r={150} sweepDuration={16} accent="var(--cl-cyan)" />
        </div>
        <div className="pod-hero__readout" aria-hidden>
          <GhostReadout
            color="var(--cl-cyan)"
            opacity={0.32}
            lineMs={5000}
            typeSpeed={80}
            max={4}
            lines={READOUT_LINES}
          />
        </div>
        <FloatingCoord
          x="62%"
          y="40px"
          label="VOX · SEGMENTVM SOLAR"
          delay={1.4}
          lifetime={5}
          color="var(--cl-cyan)"
          opacity={0.5}
        />

        <div className="pod-hero__inner">
          <div className="pod-hero__eyebrow">{"// VOX · ARCHIVVM SONORVM"}</div>
          <h1 className="pod-hero__heading">PODCASTS</h1>
          <p className="pod-hero__sub">
            {shows.length === 0
              ? "No podcasts in the database yet."
              : `The lore-podcast pillar — ${
                  shows.length === 1 ? "one show" : `${shows.length} shows`
                }, ${totalEpisodes} episodes, newest first.`}
          </p>
        </div>
      </header>

      <div className="pod-body">
        {shows.length === 0 ? (
          <div className="pod-empty c-glass c-corners">
            The database has no podcast feeds yet. Once a feed is ingested its
            shows and episodes will appear here.
          </div>
        ) : (
          shows.map((show) => <ShowSection key={show.id} show={show} />)
        )}

        {shows.length > 0 && (
          <footer className="pod-footer">
            <span>EX VOCE · COGNITIO</span>
            <span className="pod-footer__mid">DIRECT FEED · NO TRACKING</span>
            <span>STAMP M42.347</span>
          </footer>
        )}
      </div>
    </main>
  );
}

function ShowSection({ show }: { show: PodcastShow }) {
  const groups = groupByYear(show.episodes);
  const span =
    show.firstPubYear != null && show.lastPubYear != null
      ? show.firstPubYear === show.lastPubYear
        ? `${show.lastPubYear}`
        : `${show.firstPubYear}–${show.lastPubYear}`
      : null;
  const appleUrl = show.appleId
    ? `https://podcasts.apple.com/podcast/id${show.appleId}`
    : null;

  return (
    <section className="pod-show" aria-label={show.title}>
      <div className="pod-show__head c-glass c-corners">
        <div className="pod-show__art" aria-hidden>
          {show.artUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={show.artUrl} alt="" loading="lazy" width={132} height={132} />
          ) : (
            <div className="pod-show__art-placeholder">VOX</div>
          )}
        </div>

        <div className="pod-show__meta">
          <div className="pod-show__kicker">PODCAST · LORE CAST</div>
          <h2 className="pod-show__title">{show.title}</h2>
          <p className="pod-show__stats">
            {show.episodeCount} episodes{span ? ` · ${span}` : ""}
          </p>
          {show.synopsis && <p className="pod-show__synopsis">{show.synopsis}</p>}

          {(appleUrl || show.feedUrl) && (
            <div className="pod-show__links">
              {appleUrl && (
                <a
                  href={appleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pod-link pod-link--apple"
                >
                  Apple Podcasts ↗
                </a>
              )}
              {show.feedUrl && (
                <a
                  href={show.feedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pod-link pod-link--rss"
                >
                  RSS feed ↗
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="pod-show__empty">No episodes recorded for this show yet.</p>
      ) : (
        <div className="pod-show__episodes">
          {groups.map((g) => (
            <section className="pod-year" key={g.year ?? "undated"}>
              <h3 className="pod-year__label">
                <span>{g.year ?? "Undated"}</span>
                <span className="pod-year__count">{g.episodes.length}</span>
              </h3>
              <ol className="pod-episodes">
                {g.episodes.map((ep) => (
                  <li key={ep.id}>
                    <EpisodeRow ep={ep} />
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function EpisodeRow({ ep }: { ep: PodcastEpisode }) {
  const dur = formatDuration(ep.durationSec);
  const showKind = ep.episodeKind != null && ep.episodeKind !== "lore";
  const kindLabel = ep.episodeKind
    ? EPISODE_KIND_LABELS[ep.episodeKind] ?? ep.episodeKind
    : null;

  return (
    <div className="pod-ep">
      <span className="pod-ep__date">{shortDate(ep.pubDate)}</span>
      <span className="pod-ep__title">{ep.title}</span>
      {showKind && kindLabel && <span className="pod-ep__kind">{kindLabel}</span>}
      {dur && <span className="pod-ep__dur">{dur}</span>}
      {ep.audioUrl ? (
        <a
          className="pod-ep__listen"
          href={ep.audioUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Listen ↗
        </a>
      ) : (
        <span className="pod-ep__listen pod-ep__listen--off" aria-hidden>
          —
        </span>
      )}
    </div>
  );
}
