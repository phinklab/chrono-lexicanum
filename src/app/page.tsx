import BottomConsole from "@/components/chrono/BottomConsole";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import GhostReadout from "@/components/chrono/GhostReadout";
import MainAuspex from "@/components/chrono/MainAuspex";
import SiteBackground from "@/components/chrome/SiteBackground";
import ScrollScrim from "@/app/buecher/ScrollScrim";
import HeroScrollCue from "@/components/home/HeroScrollCue";
import HomeSearch from "@/components/home/HomeSearch";
import HomeExplore from "@/components/home/HomeExplore";
import HubScrollReset from "@/components/home/HubScrollReset";
import { buildSearchIndex } from "@/app/werke/filters";
import { loadBrowseBooks } from "@/app/werke/loader";
import {
  loadPodcastSearchIndex,
  buildPodcastSuggestions,
} from "@/app/podcasts/loader";
import { loadPrimarchSuggestions } from "@/lib/compendium/loader";

export const revalidate = 3600;

const READOUT_LINES = [
  "· AUSPEX HANDSHAKE OK",
  "· CHRONO-INDEX MOUNTED",
  "· NOVELLAE LOADED",
  "· SCAN · SEGMENTUM ULTIMA",
  "· SCAN · SEGMENTUM OBSCURUS",
  "· COGNITIO LINK STABLE",
  "· STAMP M42.347 · SEALED",
  "· WARP TIDES · CALM · SHIFT +0.04",
  "· VOLT · 4.72 kV NOMINAL",
  "· INDEX · 7 ERAS · 5 SEGMENTA",
  "· OVERLAY · CICATRIX MALEDICTUM",
  "· OVERLAY · HIVE FLEET LEVIATHAN",
  "· COGITATOR-1011 · ONLINE",
  "· LECTIO PROFVNDA · READY",
];

export default async function HubPage() {
  // Reuse the public /werke + /podcasts loaders so the Home search console is fed
  // the same live, unified index the archive ranks — books first, then podcasts
  // (display-only — no schema/data change here).
  const [{ books }, podcastData, primarchSuggestions] = await Promise.all([
    loadBrowseBooks(),
    loadPodcastSearchIndex(),
    loadPrimarchSuggestions(),
  ]);
  const novelCount = books.length;
  const searchIndex = [
    ...buildSearchIndex(books),
    ...buildPodcastSuggestions(podcastData),
    ...primarchSuggestions,
  ];
  const stats = `${novelCount} NOVELS · 7 ERAS · 5 SEGMENTA`;

  // Three full-viewport "acts" with firm (mandatory) scroll-snap between them:
  // 1 splash → 2 what-can-I-do + search → 3 the grouped doorways. The fixed
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
          color="var(--cl-cyan)"
          opacity={0.3}
          lineMs={5200}
          typeSpeed={82}
          max={4}
          lines={READOUT_LINES}
        />
      </div>

      {/* ── Act 1 · Splash — title pushed low into the dark band, cue at base ── */}
      <section
        className="hub-act hub-act--splash"
        aria-label="Chrono Lexicanum — the archive console"
      >
        <FloatingCoord
          x="42%"
          y="120px"
          label="ROUTE · SEGMENTVM ULTIMA"
          delay={1.2}
          lifetime={5}
          color="var(--cl-cyan)"
          opacity={0.5}
        />
        <FloatingCoord
          x="58%"
          y="220px"
          label="HIT · NOVA TERRA · M42.347"
          delay={3}
          lifetime={5}
          color="var(--cl-cyan)"
          opacity={0.45}
        />

        <div className="hub-hero__auspex hub-hero__auspex--main" aria-hidden>
          <MainAuspex size={520} spinDur={240} spinRevDur={320} sweepDur={28} />
        </div>
        <div className="hub-hero__auspex hub-hero__auspex--secondary" aria-hidden>
          <MainAuspex size={320} spinDur={360} spinRevDur={440} sweepDur={36} />
        </div>

        <div className="hub-hero__title">
          <div className="hub-hero__eyebrow">
            {"// ARCHIVE-CONSOLE · COGITATOR ACTIVUS"}
          </div>
          <h1 className="hub-hero__heading">CHRONO LEXICANUM</h1>
          <p className="hub-hero__sub">
            A fan-made archive of Warhammer 40,000 novels — and the lore podcasts
            beside them — charted by era, faction and world.
          </p>
        </div>

        <HeroScrollCue label="What can I do here?" target=".hub-act--intro" />
      </section>

      {/* ── Act 2 · What can I do here? — welcome + the live search console ──── */}
      <section className="hub-act hub-act--intro" aria-label="What can I do here?">
        <div className="hub-intro">
          <p className="card-eyebrow">{"// INTROITVS"}</p>
          <h2 className="hub-intro__heading">What can I do here?</h2>
          <p className="hub-intro__body">
            A hobby — a fan-built archive of the 41st millennium, made with love for
            the Black Library and the slow, dark march of the grimdark. Search the
            catalogue below, or take one of the doorways further down; the hope is
            simple, that the cogitator gives you exactly the book you didn&rsquo;t
            know you wanted next.
          </p>
        </div>

        <p className="hub-toolbar">
          <span className="hub-toolbar__count">{novelCount} NOVELS</span>
          <span className="hub-toolbar__total">· 7 ERAS · 5 SEGMENTA</span>
        </p>

        <HomeSearch index={searchIndex} />

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
          <p className="card-eyebrow">{"// EXPLORA"}</p>
          <h2 className="hub-tools-head__heading">More to explore</h2>
        </div>

        <HomeExplore />

        <footer className="hub-footer">
          <span>EX TENEBRIS · COGNITIO</span>
          <span className="hub-footer__mid">BEST EXPERIENCED WITH SOUND</span>
          <span>STAMP M42.347</span>
        </footer>
      </section>

      <BottomConsole withCards={false} novelCountText={stats} />
    </main>
  );
}
