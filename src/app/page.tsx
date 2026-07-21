import type { Metadata } from "next";
import AuspexPair from "@/components/chrono/AuspexPair";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import GhostReadout from "@/components/chrono/GhostReadout";
import SiteBackground from "@/components/chrome/SiteBackground";
import ArchiveFooter from "@/components/chrome/ArchiveFooter";
import ScrollScrim from "@/components/chrome/ScrollScrim";
import RouteScrollCue from "@/components/chrome/RouteScrollCue";
import HomeSearch from "@/components/home/HomeSearch";
import HomeExplore from "@/components/home/HomeExplore";
import HubScrollReset from "@/components/home/HubScrollReset";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_NAME } from "@/lib/seo";
import { siteOrigin } from "@/lib/site-url";
import { loadBrowseBooks } from "@/app/archive/loader";
import { loadPodcastSearchIndex } from "@/app/archive/podcasts/loader";
// Route-scoped stylesheet (S7a): the Hub's three acts load only on Home. Its
// .hub-search override of .browse-search out-specifies the global 61 rules.
import "@/app/styles/50-hub.css";

export const revalidate = 3600;

// Title/description/OG come from the root layout defaults (the Hub IS the
// site); only the canonical is route-specific.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HubPage() {
  // Counts only — the suggestion index itself no longer rides in the page
  // flight; the search console fetches /api/search-index on first focus (S6).
  const [{ books }, podcastData] = await Promise.all([
    loadBrowseBooks(),
    loadPodcastSearchIndex(),
  ]);
  const novelCount = books.length;
  const podcastCount = podcastData.shows.length;
  const episodeCount = podcastData.episodes.length;

  // The vox scribe carries REAL holdings instead of pseudo-telemetry.
  const voxLines = [
    `${novelCount} records indexed`,
    `${episodeCount} episodes · ${podcastCount} podcasts`,
    "VII erae · V segmenta",
    "Fontes · Lexicanvm / OL / HC",
    "Cognitio link stable",
  ];

  // Three acts: 1 splash (the wordmark IS the hero) → 2 Praefatio + search →
  // 3 the grouped doorways. The fixed art + ScrollScrim sit behind all three.
  return (
    <main id="main" tabIndex={-1} className="hub">
      {/* schema.org WebSite: names the site for search engines and points the
          Sitelinks-search action at the real /archive?q= entry. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          alternateName: "Chrono · Lexicanum",
          url: `${siteOrigin()}/`,
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${siteOrigin()}/archive?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <HubScrollReset />
      <SiteBackground variant="main" position="right bottom" />
      <ScrollScrim
        className="site-scrim"
        varName="--scrim-o"
        heroSelector=".hub-act--splash"
        maxOpacity={0.94}
      />
      <GhostReadout lines={voxLines} />

      {/* Act 1: Splash */}
      <section
        className="hub-act hub-act--splash"
        aria-label="Chrono Lexicanum, the archive"
      >
        <AuspexPair />
        <FloatingCoord x="9%" y="30%" label="Route · Segmentvm Vltima" delay={6} />

        <p className="lx-hero__over">A Fan Archive of the 41st Millennium</p>
        <h1 className="lx-hero__heading">Chrono Lexicanum</h1>
        <p className="lx-hero__edition hub-hero__edition">
          <b>Chart the eras</b>, roam the galaxy, or ask the Curator for your
          next book.
        </p>
        <RouteScrollCue
          className="route-cue--flow lx-hero__cue"
          label="Enter the archive"
          target=".hub-act--intro"
        />
      </section>

      {/* Act 2: Praefatio — reading column + live search + holdings */}
      <section className="hub-act hub-act--intro" aria-label="What lives in the archive?">
        <div className="hub-nave">
          <h2 className="lx-sect reveal">What lives in the archive?</h2>
          <p className="lx-prose lx-initial hub-praefatio reveal">
            Chrono Lexicanum is a fan-built archive of Warhammer lore, made
            with love for the incredible Black Library books, for the fan
            podcasts that keep the lore alive, for the impressive community
            work of charting a star map of the galaxy, and for the fan art of
            talented and kind digital artists that carries it all. I hope you
            enjoy your stay. Dig right into the search below, or take one of
            the doorways further down.
          </p>

          <HomeSearch />

          <p className="lx-stat hub-holdings reveal">
            <b>{novelCount} novels</b>
            <span>{episodeCount} podcast episodes</span>
          </p>
        </div>
      </section>

      {/* Act 3: More to explore — the doorways as a grouped registry */}
      <section className="hub-act hub-act--explore" aria-label="More to explore">
        <div className="hub-explore-shell">
          <h2 className="lx-sect reveal">More to explore</h2>
          <HomeExplore />
        </div>

        <ArchiveFooter mid="Best experienced with sound" />
      </section>
    </main>
  );
}
