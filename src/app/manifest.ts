/**
 * Web-App-Manifest (Launch S5). Minimal by intent — the site is a content
 * archive, not an installable app: name, icons and the void theme colour so
 * pinned tabs / home-screen shortcuts render on-brand. `manifest-src 'self'`
 * is already in the S3b CSP.
 */
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chrono Lexicanum — The 41st Millennium Novel Archive",
    short_name: "Chrono Lexicanum",
    description:
      "An interactive timeline, galaxy map, and recommendation engine for Warhammer 40,000 novels.",
    start_url: "/",
    display: "browser",
    background_color: "#050301",
    theme_color: "#050301",
    icons: [
      { src: "/img/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/img/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
