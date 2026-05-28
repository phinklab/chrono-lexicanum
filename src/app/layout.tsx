import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, IBM_Plex_Mono } from "next/font/google";
import TopNav from "@/components/chrome/TopNav";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-palette="cold"
      data-theme="dark"
      className={`${cinzel.variable} ${cormorant.variable} ${plexMono.variable}`}
    >
      <body suppressHydrationWarning>
        <TopNav />
        {children}
        <MediaPlayer />
      </body>
    </html>
  );
}
