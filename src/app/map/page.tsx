import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cartographer — Galaxy Map" };

/**
 * Map route. Will host the ported GalaxyMode component (SVG segmentum map).
 *
 * Phase 2 work (see ROADMAP.md):
 *   - port GalaxyMode.jsx → src/components/map/Galaxy.tsx
 *   - swap window.LOCATIONS / window.SECTORS for DB-driven data
 *   - add a time-slider (filter visible books by in-universe year)
 */
export default function MapPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-frost-400">Phase 2</p>
      <h1 className="mt-3 font-cinzel text-4xl text-aquila">Cartographer</h1>
      <p className="mt-6 font-cormorant text-xl italic text-frost-50/80">
        The interactive galaxy map lives here. Sectors, worlds, and books-per-place — with a time
        slider to watch the Imperium fracture.
      </p>
    </main>
  );
}
