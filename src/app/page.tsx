import BottomConsole from "@/components/chrono/BottomConsole";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import GhostReadout from "@/components/chrono/GhostReadout";
import MainAuspex from "@/components/chrono/MainAuspex";
import SiteBackground from "@/components/chrome/SiteBackground";
import ArchiveFooter from "@/components/chrome/ArchiveFooter";
import ScrollScrim from "@/components/chrome/ScrollScrim";
import HeroScrollCue from "@/components/home/HeroScrollCue";
import HomeSearch from "@/components/home/HomeSearch";
import HomeExplore from "@/components/home/HomeExplore";
import HubScrollReset from "@/components/home/HubScrollReset";
import { buildSearchIndex } from "@/app/archive/filters";
import { loadBrowseBooks } from "@/app/archive/loader";
import {
  loadPodcastSearchIndex,
  buildPodcastSuggestions,
} from "@/app/archive/podcasts/loader";
import { loadPrimarchSuggestions } from "@/lib/compendium/loader";

export const revalidate = 3600;

export default async function HubPage() {
  // Reuse the public /archive loaders so the Home search console is fed
  // the same live, unified index the archive ranks — books first, then podcasts
  // (display-only — no schema/data change here).
  const [{ books }, podcastData, primarchSuggestions] = await Promise.all([
    loadBrowseBooks(),
    loadPodcastSearchIndex(),
    loadPrimarchSuggestions(),
  ]);
  const novelCount = books.length;
  const podcastCount = podcastData.shows.length;
  const episodeCount = podcastData.episodes.length;
  const searchIndex = [
    ...buildSearchIndex(books),
    ...buildPodcastSuggestions(podcastData),
    ...primarchSuggestions,
  ];
  const stats = `${novelCount} NOVELS · 7 ERAS · 5 SEGMENTA`;

  // The readout carries REAL holdings instead of pseudo-telemetry (the
  // warp-tide/voltage lines died with the lab port, Report 141).
  const readoutLines = [
    `· ${novelCount} RECORDS INDEXED`,
    `· ${podcastCount} PODCASTS · ${episodeCount} EPISODES`,
    "· 7 ERAS · 5 SEGMENTA",
    "· SOURCES · LEXICANVM / OL / HC",
    "· COGNITIO LINK STABLE",
  ];

  // Three full-viewport "acts" with firm (mandatory) scroll-snap between them:
  // 1 splash → 2 Praefatio + search → 3 the grouped doorways. The fixed
  // hub.webp + <ScrollScrim> sit behind all three; the BottomConsole is a HUD.
  return (
    <main className="hub">
      <HubScrollReset />
      <SiteBackground variant="hub" />
      <ScrollScrim
        className="hub-scrim"
        varName="--hub-scrim-opacity"
        heroSelector=".hub-act--splash"
      />

      <div className="hub-readout" aria-hidden>
        <GhostReadout
          color="var(--cl-gold)"
          opacity={0.5}
          lineMs={5200}
          typeSpeed={82}
          max={4}
          lines={readoutLines}
        />
      </div>

      {/* ── Act 1 · Splash — title pushed low into the dark band, cue at base ── */}
      <section
        className="hub-act hub-act--splash"
        aria-label="Chrono Lexicanum — the archive"
      >
        <FloatingCoord
          x="42%"
          y="120px"
          label="ROUTE · SEGMENTVM ULTIMA"
          delay={1.2}
          lifetime={5}
          color="var(--cl-gold)"
          opacity={0.7}
        />
        <FloatingCoord
          x="58%"
          y="220px"
          label="HIT · NOVA TERRA · M42.347"
          delay={3}
          lifetime={5}
          color="var(--cl-gold)"
          opacity={0.6}
        />
        <FloatingCoord
          x="26%"
          y="34%"
          label="SCAN · SEGMENTVM OBSCVRVS"
          delay={5.4}
          lifetime={5}
          color="var(--cl-gold)"
          opacity={0.55}
        />

        <div className="hub-hero__auspex hub-hero__auspex--main" aria-hidden>
          <MainAuspex
            size={520}
            accent="var(--cl-gold)"
            spinDur={240}
            spinRevDur={320}
            sweepDur={28}
          />
        </div>
        <div className="hub-hero__auspex hub-hero__auspex--secondary" aria-hidden>
          <MainAuspex
            size={320}
            accent="var(--cl-gold)"
            spinDur={360}
            spinRevDur={440}
            sweepDur={36}
          />
        </div>

        <div className="hub-hero__title">
          <p className="hub-eyebrow">{"ARCHIVVM · COGITATOR ACTIVVS"}</p>
          <h1 className="hub-hero__heading">CHRONO LEXICANUM</h1>
          <div className="hub-hero__rule" aria-hidden />
          <p className="hub-hero__sub">
            A fan-made archive of Warhammer 40,000 novels and the lore podcasts
            beside them. Chart the eras in the Chronicle, roam the galaxy with
            the Cartographer, browse the Compendium — or Ask the Archive for
            your next book.
          </p>
        </div>

        <HeroScrollCue label="What can I do here?" target=".hub-act--intro" />
      </section>

      {/* ── Act 2 · Praefatio — the reading column with initial + live search ── */}
      <section className="hub-act hub-act--intro" aria-label="What can I do here?">
        <div className="hub-intro">
          <div className="hub-intro__head">
            <p className="hub-eyebrow">{"PRAEFATIO"}</p>
            <h2 className="hub-intro__heading">What can I do here?</h2>
          </div>
          <p className="lx-prose lx-initial">
            A hobby — a fan-built archive of the 41st millennium, made with love
            for the Black Library and the slow, dark march of the grimdark.
            Search the catalogue below, or take one of the doorways further down;
            the hope is simple, that the cogitator gives you exactly the book you
            didn&rsquo;t know you wanted next.
          </p>
        </div>

        <HomeSearch index={searchIndex} />

        <p className="lx-stat hub-stat">
          <b>{novelCount} NOVELS</b>
          <span>
            {episodeCount} EPISODES · {podcastCount} PODCASTS
          </span>
          <span>7 ERAS · 5 SEGMENTA</span>
        </p>

        <HeroScrollCue
          label="More to explore"
          target=".hub-act--explore"
          className="hub-cue--floor"
        />
      </section>

      {/* ── Act 3 · More to explore — the doorways as a grouped registry ─────── */}
      <section
        className="hub-act hub-act--explore"
        aria-label="More to explore"
      >
        <div className="hub-tools-head">
          <p className="hub-eyebrow">{"EXPLORA"}</p>
          <h2 className="hub-tools-head__heading">More to explore</h2>
        </div>

        <HomeExplore />

        <ArchiveFooter mid="BEST EXPERIENCED WITH SOUND" />
      </section>

      <BottomConsole withCards={false} novelCountText={stats} />
    </main>
  );
}
