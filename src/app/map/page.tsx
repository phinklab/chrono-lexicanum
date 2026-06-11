import type { Metadata } from "next";

import { getIsAdmin } from "@/lib/atlas/auth";
import MapRoot from "@/components/map/MapRoot";
import SiteBackground from "@/components/chrome/SiteBackground";

export const metadata: Metadata = { title: "Cartographer — Chrono Lexicanum" };

// Server component (~30 LOC). Reads the auth signal forwarded by proxy.ts and
// mounts the client tree inside a `.map-route` wrapper so the print stylesheet
// can be scoped without bleeding into other pages. The global burger/SiteMenu
// (z 80/81, declared in `app/layout.tsx`) sits above the full-bleed map.
export default async function MapPage() {
  return (
    <main
      className="map-route"
      style={{ position: "fixed", inset: 0, zIndex: 1, isolation: "isolate", contain: "paint" }}
    >
      <SiteBackground variant="cartog-holo" position="50% 38%" />
      <MapRoot initialIsAdmin={await getIsAdmin()} />
    </main>
  );
}
