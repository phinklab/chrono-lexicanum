import type { Metadata } from "next";
import SiteBackground from "@/components/chrome/SiteBackground";
import WordField from "@/components/chrono/WordField";
import LetterField from "@/components/chrono/LetterField";
import GhostReadout from "@/components/chrono/GhostReadout";
import AskClient from "@/components/ask/AskClient";

export const metadata: Metadata = { title: "Ask the Archive — Chrono Lexicanum" };

/**
 * /ask — Oraculum funnel.
 *
 * Server shell: librarium photo + vignette/grain, two ambient flicker
 * layers (Latin phrases via WordField, single glyphs via LetterField),
 * a gold-toned status ticker (GhostReadout) anchored top-right, and the
 * interactive AskClient that owns phase/state and renders the centred
 * stage + bottom-nav.
 */

const ASK_READOUT_LINES = [
  "· AUSPEX HANDSHAKE OK",
  "· CHRONO-INDEX MOUNTED",
  "· 350 NOVELLAE LOADED",
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
  "· SECT-ORC // READY",
  "· AWAITING QUERENT...",
];

export default function AskPage() {
  return (
    <main className="ask">
      <SiteBackground variant="librarium" position="50% 30%" />

      <WordField count={6} seed={11} color="201,166,90" baseOpacity={0.14} />
      <LetterField count={18} seed={37} color="var(--cl-gold)" baseOpacity={0.10} />

      <div className="ask-readout" aria-hidden>
        <GhostReadout
          color="var(--cl-gold)"
          opacity={0.32}
          lineMs={5200}
          typeSpeed={85}
          max={4}
          lines={ASK_READOUT_LINES}
        />
      </div>

      <AskClient />
    </main>
  );
}
