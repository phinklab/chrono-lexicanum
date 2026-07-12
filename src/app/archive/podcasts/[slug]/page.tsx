/**
 * Per-show podcast detail page. /archive/podcasts/the-40k-lorecast
 *
 * The index (/archive/podcasts) is a hall of show doorways; this route opens
 * one show and lists every episode through the client archive island (filter +
 * inline play + faction chips). Mirrors the /book/[slug] route shape —
 * `params` Promise, `notFound()` on a miss, `generateMetadata`. Shows render
 * on demand (empty `generateStaticParams`), never at build time.
 */
import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SiteBackground from "@/components/chrome/SiteBackground";
import AuspexPair from "@/components/chrono/AuspexPair";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import GhostReadout from "@/components/chrono/GhostReadout";
import ScrollScrim from "@/components/chrome/ScrollScrim";
import RouteScrollCue from "@/components/chrome/RouteScrollCue";
import PodcastEpisodeArchive from "@/components/podcast/PodcastEpisodeArchive";
import ArchiveModeToggle from "@/components/archive/ArchiveModeToggle";
import ArchiveFooter from "@/components/chrome/ArchiveFooter";
import JsonLd from "@/components/seo/JsonLd";
import { routeOg } from "@/lib/seo";
import { siteOrigin } from "@/lib/site-url";
import { loadPodcastShow } from "../loader";
// Segment-scoped stylesheet (S7a), shared with the podcast index page.
import "@/app/styles/62-podcasts.css";

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
  if (!show) return { title: "Podcast" };
  const span = yearSpan(show.firstPubYear, show.lastPubYear);
  const description = `Every episode of ${show.title} — ${show.episodeCount} episodes${
    span ? `, ${span}` : ""
  }, entity-tagged and newest first. Play in place, download, or open in your app.`;
  return {
    title: show.title,
    description,
    // Episodes are `#ep-…` fragments of this one document (URL matrix A.1) —
    // the show URL is the only canonical.
    alternates: { canonical: `/archive/podcasts/${show.slug}` },
    openGraph: routeOg({
      title: show.title,
      description,
      ...(show.artUrl ? { images: [{ url: show.artUrl }] } : {}),
    }),
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

  // Honest vox — this show's real holdings, no pseudo-telemetry.
  const voxLines = [
    "Vox · archivvm sonorvm",
    `${show.episodeCount} episodes${span ? ` · ${span}` : ""}`,
    "Index · annvs / factio",
    "Cognitio link stable",
  ];

  return (
    <main id="main" tabIndex={-1} className="podcasts podcasts--show">
      {/* schema.org PodcastSeries — series-level only; episodes are page
          fragments, never their own URLs (URL matrix A.1). */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "PodcastSeries",
          name: show.title,
          url: `${siteOrigin()}/archive/podcasts/${show.slug}`,
          ...(show.artUrl ? { image: show.artUrl } : {}),
        }}
      />
      <SiteBackground variant="main" position="right bottom" />
      <GhostReadout lines={voxLines} />

      {/* The same one-act hero shell as /archive + /archive/podcasts (the
          shared .catalogue-hero classes), so a show page opens with the same
          rhythm as its index. */}
      <section className="catalogue-hero route-act" aria-label={show.title}>
        <ScrollScrim
          className="site-scrim"
          varName="--scrim-o"
          heroSelector=".catalogue-hero"
          maxOpacity={0.94}
        />
        <AuspexPair quiet />
        <FloatingCoord x="10%" y="32%" label="Vox · decode lock" delay={9} />

        <p className="catalogue-hero__over">Podcast</p>
        <h1 className="catalogue-hero__heading catalogue-hero__heading--show">
          {show.title}
        </h1>
        <p className="catalogue-hero__edition">{stats} · entity-tagged, newest first.</p>
        <RouteScrollCue
          className="route-cue--flow"
          label="Browse the episodes"
          target=".pod-body"
        />
      </section>

      <div className="pod-body route-body-snap">
        {/* The register fork in the controls position — same placement as the
            index, so the switch stays present one level deeper. */}
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
