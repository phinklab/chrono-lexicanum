import type { Metadata } from "next";

import { routeOg } from "@/lib/seo";
import CartographerRoot from "@/components/cartographer/CartographerRoot";
import { loadMapWorlds } from "@/lib/map/load-map-worlds";
import { buildMapPayload } from "@/lib/map/payload";
// Route-scoped stylesheet (S7a): the Cartographer's ~54 KB load only here. Its
// body.cg-on-map chrome overrides out-specify the global 43/44/46 rules.
import "@/app/styles/55-map.css";

const MAP_DESCRIPTION =
  "The galaxy chart of the archive — sectors, worlds and the Warhammer 40,000 novels anchored to them, filterable by era.";

export const metadata: Metadata = {
  title: "Cartographer",
  description: MAP_DESCRIPTION,
  alternates: { canonical: "/map" },
  openGraph: routeOg({ title: "Cartographer", description: MAP_DESCRIPTION }),
};

// Server component: builds the compact chart payload from the committed
// SSOT catalog (scripts/seed-data/map-worlds.json — DB-free, bundled at
// build time) and mounts the client Cartographer inside `.map-route`.
// The chart itself is client-only (mount gate in CartographerRoot); the
// SSR pass paints overture + cartouche. Global burger/SiteMenu (z 80/81)
// sit above the full-bleed chart.
// No SiteBackground here: the chart sits on a single flat surface colour
// (--cl-void, via .map-route in 55-map.css) — deliberately no photo, veil,
// grain, or direction-proofs panel on this route.
export default function MapPage() {
  const payload = buildMapPayload(loadMapWorlds());
  return (
    <main
      className="map-route"
      style={{ position: "fixed", inset: 0, zIndex: 1, isolation: "isolate", contain: "paint" }}
    >
      <CartographerRoot payload={payload} />
    </main>
  );
}
