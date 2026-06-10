import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import TopNav from "@/components/chrome/TopNav";
import SiteMenu from "@/components/chrome/SiteMenu";
import MediaPlayer from "@/components/chrome/MediaPlayer";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cinzel",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

// Space Grotesk powers the Chronicle control-bar toggles + series-lane labels
// (the prototype's `--font-grotesk`). Bound to the existing token name so the
// ported `tlp-*` rules and the @theme `--font-grotesk` declaration resolve to
// a real loaded face instead of falling back to system-ui.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-space-grotesk",
  display: "swap",
});

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
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  // The `@modal` parallel slot (Brief 113, Phase B). Renders the in-context
  // entity panel when an in-app soft-nav hits a `(.)charakter|fraktion|welt`
  // intercept; otherwise `null` (slot default / catch-all). Sitting in the root
  // layout is what lets every in-app entity `<Link>` open the panel without any
  // per-link wiring.
  modal: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-palette="cold"
      data-theme="dark"
      className={`${cinzel.variable} ${cormorant.variable} ${plexMono.variable} ${spaceGrotesk.variable}`}
    >
      <body suppressHydrationWarning>
        <TopNav />
        <SiteMenu />
        {children}
        {modal}
        <MediaPlayer />
      </body>
    </html>
  );
}
