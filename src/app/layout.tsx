import type { Metadata } from "next";
import {
  Cardo,
  Cinzel,
  Cormorant_SC,
  Cormorant_Unicase,
  Fragment_Mono,
} from "next/font/google";
import SiteMenu from "@/components/chrome/SiteMenu";
import SiteNav from "@/components/chrome/SiteNav";
import SiteBrand from "@/components/chrome/SiteBrand";
import RevealObserver from "@/components/shared/RevealObserver";
import SiteLegal from "@/components/chrome/SiteLegal";
import MediaPlayer from "@/components/chrome/MediaPlayer";
import { NavProgressProvider } from "@/components/chrono/RouteProgress";
import "./globals.css";

// Display voice: Cormorant SC (small-caps titling face), Cinzel as the loaded
// fallback — both feed --font-display in 00-tokens.css.
const cormorantSC = Cormorant_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant-sc",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cinzel",
  display: "swap",
});

// Waypoint voice (--font-unicase): the Chronicle's era-band stop labels.
// Upright only — the face ships no italic.
const cormorantUnicase = Cormorant_Unicase({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-cormorant-unicase",
  display: "swap",
});

// Reading voice (--font-body).
const cardo = Cardo({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-cardo",
  display: "swap",
});

// Telemetry voice (--font-mono): registry numbers, M-scale, vox lines.
const fragmentMono = Fragment_Mono({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-fragment-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Chrono Lexicanum — The 41st Millennium Novel Archive",
    template: "%s · Chrono Lexicanum",
  },
  description:
    "An interactive timeline, galaxy map, and recommendation engine for Warhammer 40,000 novels. Find your next book by era, faction, location or mood.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Chrono Lexicanum",
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
      className={`${cormorantSC.variable} ${cinzel.variable} ${cormorantUnicase.variable} ${cardo.variable} ${fragmentMono.variable}`}
    >
      <body suppressHydrationWarning>
        {/* Primary navigation: the left-edge SiteNav rail on hover-capable wide
            screens; the SiteMenu burger overlay takes over on touch / narrow
            viewports. The CSS breakpoint in 46-site-nav.css owns the hand-off,
            so both mount unconditionally and only one is ever visible. */}
        <SiteNav />
        <SiteMenu />
        {/* Fixed wordmark, top-left — hidden on the Hub (the hero IS the
            wordmark), the login gate and the map (own chrome). */}
        <SiteBrand />
        {/* One app-wide scroll-reveal observer (survives navigations and
            catches Suspense-streamed content). */}
        <RevealObserver />
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
        {/* Fixed Impressum/Datenschutz links under the player (Brief 179):
            the legal-reachability guarantee for footerless desktop surfaces.
            Hidden on /login and ≤760px via 71-legal.css. */}
        <SiteLegal />
      </body>
    </html>
  );
}
