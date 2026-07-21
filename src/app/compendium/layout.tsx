/**
 * Compendium shell — wraps the overview (`/compendium`), every category
 * directory (`/compendium/[category]`) and the two guided-pick tools
 * (`/compendium/four-questions`, `/compendium/one-faction-one-book`): the
 * fixed art, the masthead ("The Registry / The Compendium") and the
 * Imprimatur foot. The category nav lives on the directory/tool pages, not
 * here — the overview leads straight into the doorways.
 */
import type { Metadata } from "next";
import { type ReactNode } from "react";
import SiteBackground from "@/components/chrome/SiteBackground";
import ScrollScrim from "@/components/chrome/ScrollScrim";
import AuspexPair from "@/components/chrono/AuspexPair";
import GhostReadout from "@/components/chrono/GhostReadout";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import RouteScrollCue from "@/components/chrome/RouteScrollCue";
import ArchiveFooter from "@/components/chrome/ArchiveFooter";
// Segment-scoped stylesheet (S7a): loads for the overview and every category.
import "@/app/styles/66-compendium.css";

// Title/description default for the whole segment; the overview page adds its
// canonical itself and each category page overrides all three (canonicals must
// NOT live in a layout — they would stamp every child with the same URL).
export const metadata: Metadata = {
  title: "Compendium",
  description:
    "The entity directory of the archive — factions, primarchs, characters, worlds and the authors behind the canon, each a doorway into its books and podcasts.",
};

const VOX_LINES = [
  "Compendivm · quinque portae",
  "Fractio / Persona / Mvndvs",
  "IV qvaestiones · vna factio",
  "Doorway · librorvm / vox",
  "Cognitio link stable",
];

export default function CompendiumLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main id="main" tabIndex={-1} className="compendium route-snap">
      <SiteBackground variant="main" position="right bottom" />
      <ScrollScrim
        className="site-scrim"
        varName="--scrim-o"
        heroSelector=".cmp-hero"
        maxOpacity={0.94}
      />
      <GhostReadout lines={VOX_LINES} />

      <header className="cmp-hero route-act">
        <AuspexPair />
        <FloatingCoord x="9%" y="30%" label="Archivvm · rervm omnivm" delay={7} />

        <p className="lx-hero__over">The Registry</p>
        <h1 className="lx-hero__heading">The Compendium</h1>
        <p className="lx-hero__edition">
          Five doorways into the archive — and two guided picks that lead
          straight to your next book.
        </p>
        <RouteScrollCue
          className="route-cue--flow lx-hero__cue"
          label="Open the registers"
          target=".cmp-body"
        />
      </header>

      <div className="cmp-body route-body-snap">
        {children}
        <ArchiveFooter mid="Doorways & guided picks" />
      </div>
    </main>
  );
}
