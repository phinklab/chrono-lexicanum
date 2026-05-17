import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cartographer Lab — Prototype",
  robots: { index: false, follow: false },
};

// Isolated static sandbox for the Claude-Design Cartographer prototype.
// The prototype lives under /public/lab/cartographer-prototype/ as a UMD CDN
// HTML app (React + Babel from unpkg, window.* globals, localStorage). An
// iframe keeps it separate from the Next/Chrono runtime — no DB, no nav.
// The TSX port is Phase 2; this route is the standalone preview.
export default function CartographerLabPage() {
  return (
    <main className="fixed inset-0 z-0 bg-[#0a0703]">
      <iframe
        src="/lab/cartographer-prototype/index.html"
        title="Cartographer Prototype"
        className="block h-full w-full border-0"
      />
    </main>
  );
}
