/**
 * Compendium shell (Brief 129 — Doorways; restyled Session 142). Wraps the
 * overview (`/compendium`) and every category directory
 * (`/compendium/[category]`) in one gold register frame: a vista backdrop with
 * the /ask + /podcasts readability fade, a lean hero with a Terminus rule, and
 * the persistent category nav with live counts. The teal re-skin is retired —
 * the Compendium reads as the REGISTRVM of the archive (Report 141, idea C2-3),
 * in the same gold language as every other surface.
 *
 * Server component: it loads the per-category counts once (cached, so the active
 * directory page dedupes its own builder call) and hands them to the db-free
 * <CompendiumNav>.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import SiteBackground from "@/components/chrome/SiteBackground";
import ScrollScrim from "@/app/buecher/ScrollScrim";
import AuspexSweep from "@/components/chrono/AuspexSweep";
import GhostReadout from "@/components/chrono/GhostReadout";
import FloatingCoord from "@/components/chrono/FloatingCoord";
import CompendiumNav from "@/components/compendium/CompendiumNav";
import ArchiveFooter from "@/components/chrome/ArchiveFooter";
import { loadCompendiumCounts } from "@/lib/compendium/loader";

export const metadata: Metadata = {
  title: "Compendium — Chrono Lexicanum",
  description:
    "The entity directory of the archive — factions, primarchs, characters, worlds and the authors behind the canon, each a doorway into its books and podcasts.",
};

const READOUT_LINES = [
  "· COMPENDIVM · INDEX RERVM",
  "· V CATEGORIAE · MOUNTED",
  "· FRACTIO / PERSONA / MVNDVS",
  "· DOORWAY · LIBRORVM / VOX",
  "· COGNITIO LINK STABLE",
];

export default async function CompendiumLayout({
  children,
}: {
  children: ReactNode;
}) {
  const counts = await loadCompendiumCounts();

  return (
    <main className="compendium">
      <SiteBackground variant="scriptorium" position="50% 30%" />
      <ScrollScrim
        className="cmp-scrim"
        varName="--cmp-scrim-opacity"
        heroSelector=".cmp-hero"
        maxOpacity={0.72}
      />

      {/* Fixed HUD atmosphere — sweep + readout pinned to the viewport so they sit
          over the crisp top of the scriptorium photo (the /ask + /podcasts skeleton:
          the masthead carries only the title; the HUD lives outside it). */}
      <div className="cmp-readout" aria-hidden>
        <GhostReadout
          color="var(--cl-gold)"
          opacity={0.3}
          lineMs={5200}
          typeSpeed={80}
          max={4}
          lines={READOUT_LINES}
        />
      </div>
      <div className="cmp-hud" aria-hidden>
        <div className="cmp-hud__sweep">
          <AuspexSweep r={170} sweepDuration={16} accent="var(--cl-gold)" />
        </div>
      </div>

      <header className="cmp-hero">
        <FloatingCoord
          x="58%"
          y="150px"
          label="ARCHIVVM · RERVM OMNIVM"
          delay={1.4}
          lifetime={5}
          color="var(--cl-gold)"
          opacity={0.5}
        />
        <div className="cmp-hero__inner">
          <p className="cmp-hero__eyebrow">{"// COMPENDIVM · INDEX RERVM"}</p>
          <h1 className="cmp-hero__heading">COMPENDIUM</h1>
          <div className="cmp-hero__rule" aria-hidden />
          <p className="cmp-hero__sub">
            Every faction, world, character and author in the archive — each a
            doorway into the books and podcasts behind it.
          </p>
        </div>
      </header>

      <div className="cmp-body">
        <CompendiumNav counts={counts} />
        {children}
        <ArchiveFooter mid="INDEX RERVM OMNIVM" />
      </div>
    </main>
  );
}
