import type { Metadata } from "next";
import Starfield from "@/components/chrome/Starfield";
import "./globals.css";

/**
 * Root layout for every route.
 *
 * Fonts are loaded from Google Fonts via <link> in <head>. We could use
 * `next/font` for self-hosting, but with five font families (Cinzel, Cormorant,
 * Newsreader, Space Grotesk, JetBrains Mono) the self-host bundle gets large.
 * Switch when we settle on the final 2–3 weights per family.
 *
 * Stacking order:
 *   - Starfield  (z-index 0, fixed, pointer-events: none)
 *   - children   (z-index 1, the route's own <main>)
 */
export const metadata: Metadata = {
  title: {
    default: "Chrono · Lexicanum — The 41st Millennium Novel Archive",
    template: "%s · Chrono Lexicanum",
  },
  description:
    "An interactive timeline, galaxy map, and recommendation engine for Warhammer 40,000 novels. Find your next book by era, faction, location or mood.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Chrono · Lexicanum",
    description:
      "Explore Warhammer 40k novels by era, faction, place and tone. A fan-made archive.",
    type: "website",
    siteName: "Chrono Lexicanum",
  },
  // No indexing during early development. Remove these once we go public.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-palette="cold" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&family=Newsreader:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Starfield />
        {children}
      </body>
    </html>
  );
}
