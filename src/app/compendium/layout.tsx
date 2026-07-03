/**
 * Compendium shell — wraps the overview (`/compendium`) and every category
 * directory (`/compendium/[category]`): the fixed art, the masthead ("The
 * Registry / The Compendium") and the Imprimatur foot. The category nav lives
 * on the directory pages, not here — the overview leads straight into the
 * doorways (Brief 184).
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

export const metadata: Metadata = {
  title: "Compendium — Chrono Lexicanum",
  description:
    "The entity directory of the archive — factions, primarchs, characters, worlds and the authors behind the canon, each a doorway into its books and podcasts.",
};

const VOX_LINES = [
  "Compendivm · quinque portae",
  "Fractio / Persona / Mvndvs",
  "Doorway · librorvm / vox",
  "Cognitio link stable",
];

export default function CompendiumLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="compendium route-snap">
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

        <p className="cmp-hero__over">The Registry</p>
        <h1 className="cmp-hero__heading">The Compendium</h1>
        <p className="cmp-hero__edition">
          Five doorways into the archive — each one leads to the books and
          voices that carry its story.
        </p>
        <RouteScrollCue
          className="route-cue--flow"
          label="Open the registers"
          target=".cmp-body"
        />
      </header>

      <div className="cmp-body route-body-snap">
        {children}
        <ArchiveFooter mid="Five doorways into the archive" />
      </div>
    </main>
  );
}
