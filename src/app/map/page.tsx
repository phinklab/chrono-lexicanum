import type { Metadata } from "next";
import SiteBackground from "@/components/chrome/SiteBackground";
import CornerAuspex from "@/components/chrono/CornerAuspex";

export const metadata: Metadata = { title: "Cartographer — Chrono Lexicanum" };

/**
 * Map route. Will host the ported GalaxyMode component (SVG segmentum map).
 *
 * Brief 096 keeps the layout exactly as it stands today and only re-themes
 * the global shell — Cartographer's bespoke redesign is explicitly out of
 * scope for this brief. So this page stays a stub shell until the real
 * GalaxyMode is ported.
 */
export default function MapPage() {
  return (
    <main className="stub-shell">
      <SiteBackground variant="cartog" position="center" />
      <div className="stub-shell__decor" aria-hidden>
        <CornerAuspex size={140} label="CARTOG // 1011" />
      </div>
      <div className="stub-shell__inner">
        <p className="stub-shell__eyebrow">{"// PHASE-3 · IN VORBEREITUNG"}</p>
        <h1 className="stub-shell__title">CARTOGRAPHER</h1>
        <span className="c-hairline stub-shell__rule" aria-hidden />
        <p className="stub-shell__body">
          Galaktische Karte — Segmenta, Sektoren, Welten, Buch-Pins. Mit Zeitschieber,
          um dem Imperium beim Zerfallen zuzusehen. Erscheint, sobald GalaxyMode
          aus dem alten Prototyp portiert ist.
        </p>
      </div>
    </main>
  );
}
