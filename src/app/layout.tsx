import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import SiteMenu from "@/components/chrome/SiteMenu";
import SiteNav from "@/components/chrome/SiteNav";
import MediaPlayer from "@/components/chrome/MediaPlayer";
import { NavProgressProvider } from "@/components/chrono/RouteProgress";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cinzel",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
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

// Space Grotesk is bound to the `--font-grotesk` token (declared in
// 00-tokens.css). Its only styling consumer was the old Chronicle accordion
// (`tlp-*` rules in 57-chronicle.css), removed in Board 121-P11 — the face is
// therefore currently orphaned. Kept wired here deliberately: dropping the font
// import + token is a P7 CSS/token-cleanup decision, out of P11 scope.
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
        {/* Primary navigation: the left-edge SiteNav rail on hover-capable wide
            screens; the SiteMenu burger overlay takes over on touch / narrow
            viewports. The CSS breakpoint in 46-site-nav.css owns the hand-off,
            so both mount unconditionally and only one is ever visible. */}
        <SiteNav />
        <SiteMenu />
        {/* The shared route-transition provider owns the one `useTransition`
            that drives the global pending beam + the inline search affordance.
            Both `children` and the `@modal` slot sit inside it so in-context
            entity panels can navigate through the same hook. The provider is a
            client boundary, but its children are server-rendered nodes passed
            as props — the pages themselves stay server components. */}
        <NavProgressProvider>
          {children}
          {modal}
        </NavProgressProvider>
        <MediaPlayer />
      </body>
    </html>
  );
}
