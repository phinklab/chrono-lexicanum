/**
 * Per-show podcast detail page. /podcasts/the-40k-lorecast
 *
 * 121-P4 (2026-06-06): the second half of the podcast redesign. The index
 * (/podcasts) is a hall of show doorways; this route opens one show and lists
 * every episode through the client archive island (filter + inline play +
 * faction chips). Mirrors the /buch/[slug] route shape — `params` Promise,
 * `notFound()` on a miss, `generateStaticParams` + `generateMetadata`.
 */
import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SiteBackground from "@/components/chrome/SiteBackground";
import AuspexSweep from "@/components/chrono/AuspexSweep";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import GhostReadout from "@/components/chrono/GhostReadout";
import ScrollScrim from "@/app/buecher/ScrollScrim";
import PodcastEpisodeArchive from "@/components/podcast/PodcastEpisodeArchive";
import { loadPodcastShow, podcastShowSlugs } from "../loader";

// Static shell, refreshed hourly — newly-ingested episodes surface without a
// redeploy, matching the index.
export const revalidate = 3600;

// Per-request memo: generateMetadata + the page both need the show, but it is
// one DB fan-out, so cache() collapses them to a single query.
const getShow = cache(loadPodcastShow);

type Params = { slug: string };

const READOUT_LINES = [
  "· VOX · DECODE STREAM",
  "· FEED MOUNTED · RSS STABLE",
  "· ENCLOSVRE · MP3 NOMINAL",
  "· INDEX · ANNVS / FACTIO",
  "· LATENCY NOMINAL",
  "· AVDITIO · READY",
];

function yearSpan(first: number | null, last: number | null): string | null {
  if (first == null || last == null) return null;
  return first === last ? `${last}` : `${first}–${last}`;
}

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await podcastShowSlugs();
  return slugs.map((slug) => ({ slug }));
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

  return (
    <main className="podcasts podcasts--show">
      <SiteBackground variant="vox" position="50% 38%" />
      <ScrollScrim
        className="pod-scrim"
        varName="--pod-scrim-opacity"
        heroSelector=".pod-mast"
        maxOpacity={0.7}
      />

      <div className="pod-readout" aria-hidden>
        <GhostReadout
          color="var(--cl-gold)"
          opacity={0.32}
          lineMs={5000}
          typeSpeed={80}
          max={4}
          lines={READOUT_LINES}
        />
      </div>
      <div className="pod-hud" aria-hidden>
        <div className="pod-hud__sweep">
          <AuspexSweep r={170} sweepDuration={16} accent="var(--cl-gold)" />
        </div>
      </div>

      <section className="pod-mast" aria-label={show.title}>
        <FloatingCoord
          x="42%"
          y="150px"
          label="VOX · DECODE LOCK"
          delay={1.4}
          lifetime={5}
          color="var(--cl-gold)"
          opacity={0.5}
        />
        <div className="pod-mast__inner">
          <div className="pod-mast__eyebrow">{`// VOX · ${show.title}`}</div>
          <h1 className="pod-mast__heading pod-mast__heading--show">
            {show.title}
          </h1>
          <p className="pod-mast__sub">{stats} · entity-tagged, newest first.</p>
        </div>
      </section>

      <div className="pod-body">
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

            <Link href="/podcasts" className="pod-plate__back">
              ← All podcasts
            </Link>
          </div>
        </div>

        <PodcastEpisodeArchive episodes={show.episodes} showTitle={show.title} />

        <footer className="pod-footer">
          <span>EX VOCE · COGNITIO</span>
          <span className="pod-footer__mid">DIRECT FEED · NO TRACKING</span>
          <span>STAMP M42.347</span>
        </footer>
      </div>
    </main>
  );
}
