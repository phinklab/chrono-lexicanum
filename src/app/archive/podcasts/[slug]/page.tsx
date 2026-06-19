/**
 * Per-show podcast detail page. /archive/podcasts/the-40k-lorecast
 *
 * 121-P4 (2026-06-06): the second half of the podcast redesign. The index
 * (/archive/podcasts) is a hall of show doorways; this route opens one show and lists
 * every episode through the client archive island (filter + inline play +
 * faction chips). Mirrors the /buch/[slug] route shape — `params` Promise,
 * `notFound()` on a miss, `generateMetadata`. Shows render on demand (empty
 * `generateStaticParams`), never at build time.
 */
import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SiteBackground from "@/components/chrome/SiteBackground";
import AuspexSweep from "@/components/chrono/AuspexSweep";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import GhostReadout from "@/components/chrono/GhostReadout";
import ScrollScrim from "@/components/chrome/ScrollScrim";
import RouteScrollCue from "@/components/chrome/RouteScrollCue";
import PodcastEpisodeArchive from "@/components/podcast/PodcastEpisodeArchive";
import ArchiveModeToggle from "@/components/archive/ArchiveModeToggle";
import ArchiveFooter from "@/components/chrome/ArchiveFooter";
import { loadPodcastShow } from "../loader";

// Static shell, refreshed hourly — newly-ingested episodes surface without a
// redeploy, matching the index.
export const revalidate = 3600;

// Per-request memo: generateMetadata + the page both need the show, but it is
// one DB fan-out, so cache() collapses them to a single query.
const getShow = cache(loadPodcastShow);

type Params = { slug: string };

function yearSpan(first: number | null, last: number | null): string | null {
  if (first == null || last == null) return null;
  return first === last ? `${last}` : `${first}–${last}`;
}

// No build-time prerender. Each show costs ~3 uncached DB queries via
// `loadPodcastShow`; under the build's page concurrency those queued through
// the small pooler pool past Vercel's 60s static-generation timeout. The empty
// array is Next's documented "all paths at runtime" pattern: the route stays
// ISR (`revalidate` above), the first visitor fills the cache, and the build
// does zero DB work here. Don't delete the function — without it the route
// would render fully dynamically on every request instead.
export async function generateStaticParams(): Promise<Params[]> {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const show = await getShow(slug);
  if (!show) return { title: "Podcast — Chrono Lexicanum" };
  const span = yearSpan(show.firstPubYear, show.lastPubYear);
  return {
    title: `${show.title} — Chrono Lexicanum`,
    description: `Every episode of ${show.title} — ${show.episodeCount} episodes${
      span ? `, ${span}` : ""
    }, entity-tagged and newest first. Play in place, download, or open in your app.`,
  };
}

export default async function PodcastShowPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const show = await getShow(slug);
  if (!show) notFound();

  const span = yearSpan(show.firstPubYear, show.lastPubYear);
  const stats = `${show.episodeCount} episodes${span ? ` · ${span}` : ""}`;

  // Honest readout — this show's real holdings, no pseudo-telemetry
  // (Report 141; sibling of the index readout).
  const readoutLines = [
    "· VOX · ARCHIVVM SONORVM",
    `· ${show.episodeCount} EPISODES${span ? ` · ${span}` : ""}`,
    "· INDEX · ANNVS / FACTIO",
    "· PLAY / DOWNLOAD / OPEN IN APP",
    "· COGNITIO LINK STABLE",
  ];

  return (
    <main className="podcasts podcasts--show">
      <SiteBackground variant="main" position="right bottom" />

      {/* The same one-act hero shell as /archive + /archive/podcasts (the shared
          .catalogue-hero classes): a 100dvh masthead with the title and auspex
          parked low, a ghost readout and a NEXT scroll cue into the episode
          body — so a show page opens with the same rhythm as its index
          (maintainer polish 2026-06-20). */}
      <section className="catalogue-hero route-act" aria-label={show.title}>
        <ScrollScrim maxOpacity={0.77} />
        <div className="catalogue-hero__sweep" aria-hidden>
          <AuspexSweep r={180} sweepDuration={18} accent="var(--cl-gold)" />
        </div>
        <div className="werke-hero__readout" aria-hidden>
          <GhostReadout
            color="var(--cl-gold)"
            opacity={0.32}
            lineMs={5000}
            typeSpeed={80}
            max={4}
            lines={readoutLines}
          />
        </div>
        <FloatingCoord
          x="42%"
          y="120px"
          label="VOX · DECODE LOCK"
          delay={1.2}
          lifetime={5}
          color="var(--cl-gold)"
          opacity={0.55}
        />
        <FloatingCoord
          x="58%"
          y="220px"
          label={`VOX · ${show.episodeCount} EP`}
          delay={3.0}
          lifetime={5}
          color="var(--cl-gold)"
          opacity={0.55}
        />
        <div className="catalogue-hero__title">
          <div className="catalogue-hero__eyebrow">{"VOX · ARCHIVVM SONORVM"}</div>
          <h1 className="catalogue-hero__heading catalogue-hero__heading--show">
            {show.title}
          </h1>
          <div className="catalogue-hero__rule" aria-hidden />
          <p className="catalogue-hero__sub">
            {stats} · entity-tagged, newest first.
          </p>
        </div>
        <RouteScrollCue label="Browse the episodes" target=".pod-body" />
      </section>

      <div className="pod-body route-body-snap">
        {/* The register fork in the controls position — same placement as the
            index, so the switch stays present one level deeper (Session 142). */}
        <div className="pod-controls">
          <ArchiveModeToggle active="podcasts" />
        </div>

        <div className="pod-plate">
          <div className="pod-plate__art" aria-hidden>
            {show.artUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={show.artUrl}
                alt=""
                loading="lazy"
                width={116}
                height={116}
              />
            ) : (
              <div className="pod-plate__art-ph">VOX</div>
            )}
          </div>

          <div className="pod-plate__meta">
            <div className="pod-plate__kicker">PODCAST · LORE CAST</div>
            {/* Restated title — a non-heading element so a SR heading pass
                doesn't hear the show title twice (h1 mast → here). */}
            <p className="pod-plate__name">{show.title}</p>
            <p className="pod-plate__stats">{stats}</p>

            {show.platformLinks.length > 0 && (
              <div className="pod-plate__platforms">
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

            <Link href="/archive/podcasts" className="pod-plate__back">
              ← All podcasts
            </Link>
          </div>
        </div>

        <PodcastEpisodeArchive episodes={show.episodes} showTitle={show.title} />

        <ArchiveFooter mid="DIRECT FEED · NO TRACKING" />
      </div>
    </main>
  );
}
