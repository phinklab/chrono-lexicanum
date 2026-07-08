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
import { loadUnifiedSearchIndex } from "@/lib/search-index";

export const revalidate = 3600;

export default async function HubPage() {
  const { books, podcastData, searchIndex } = await loadUnifiedSearchIndex();
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
    <main className="hub">
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
        aria-label="Chrono Lexicanum — the archive"
      >
        <AuspexPair />
        <FloatingCoord x="9%" y="30%" label="Route · Segmentvm Vltima" delay={6} />

        <p className="hub-hero__over">A Fan Archive of the 41st Millennium</p>
        <h1 className="hub-hero__heading">Chrono Lexicanum</h1>
        <p className="hub-hero__edition">
          <b>Chart the eras</b>, roam the galaxy, or ask the archive where to
          begin.
        </p>
        <RouteScrollCue
          className="route-cue--flow hub-hero__cue"
          label="Enter the archive"
          target=".hub-act--intro"
        />
      </section>

      {/* Act 2: Praefatio — reading column + live search + holdings */}
      <section className="hub-act hub-act--intro" aria-label="What lives in the archive?">
        <div className="hub-nave">
          <h2 className="lx-sect reveal">What lives in the archive?</h2>
          <p className="lx-prose lx-initial hub-praefatio reveal">
            A hobby — a fan-built archive of the 41st millennium, made with love
            for the Black Library and the slow, dark march of the grimdark.
            Search the catalogue below, or take one of the doorways further
            down.
          </p>

          <HomeSearch index={searchIndex} />

          <p className="lx-stat hub-holdings reveal">
            <b>{novelCount} novels</b>
            <span>
              {episodeCount} episodes · {podcastCount} podcasts
            </span>
            <span>7 eras · 5 segmenta</span>
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
