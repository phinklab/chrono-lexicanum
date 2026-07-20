import type { Metadata, Viewport } from "next";
import { Cardo, Cormorant_SC, Fragment_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { siteIndexable, siteOrigin } from "@/lib/site-url";
import SiteMenu from "@/components/chrome/SiteMenu";
import SiteNav from "@/components/chrome/SiteNav";
import SkipLink from "@/components/chrome/SkipLink";
import SiteBrand from "@/components/chrome/SiteBrand";
import BrandBeacon from "@/components/chrome/BrandBeacon";
import RevealObserver from "@/components/shared/RevealObserver";
import SiteLegal from "@/components/chrome/SiteLegal";
import MediaPlayer from "@/components/chrome/MediaPlayer";
import { NavProgressProvider } from "@/components/chrono/RouteProgress";
import "./globals.css";

// Display voice: Cormorant SC (small-caps titling face) — feeds --font-display
// in 00-tokens.css. Cinzel was removed in S7a: it only ever sat behind
// Cormorant SC in the stack and never rendered. The Chronicle's waypoint face
// (Cormorant Unicase) loads in the timeline segment (S7a), not site-wide.
const cormorantSC = Cormorant_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant-sc",
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

// Child routes set their own `title` (plain string — the template appends the
// site suffix exactly once; never hand-append "— Chrono Lexicanum" in a route,
// that doubles the brand), their own canonical (`alternates.canonical`) and
// their own `openGraph`. NOTE metadata merging is shallow per key: a route
// that redefines `openGraph` replaces this whole object — use `routeOg()`
// from `@/lib/seo` so type/siteName/default image survive.
export const metadata: Metadata = {
  title: {
    default: "Chrono Lexicanum — The 41st Millennium Novel Archive",
    template: "%s · Chrono Lexicanum",
  },
  description:
    "An interactive timeline, galaxy map, and recommendation engine for Warhammer 40,000 novels. Find your next book by era, faction, location or mood.",
  metadataBase: new URL(siteOrigin()),
  openGraph: {
    title: "Chrono Lexicanum",
    description:
      "Explore Warhammer 40k novels by era, faction, place and tone. A fan-made archive.",
    type: "website",
    siteName: "Chrono Lexicanum",
    images: ["/img/og-default.jpg"],
  },
  // noindex until the launch lever flips (PREVIEW_GATE=off) — baked at build
  // time, so going public requires a FRESH deploy (launch runbook). Admin/auth
  // surfaces (/login, /ingest, /book/*/audit) override back to noindex.
  robots: siteIndexable()
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

// viewportFit: "cover" lets fixed chrome extend into notch/home-bar regions;
// every fixed element pads with env(safe-area-inset-*) in its stylesheet.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050301",
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  // The `@modal` parallel slot. Renders the in-context
  // entity panel when an in-app soft-nav hits a `(.)character|faction|world`
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
      className={`${cormorantSC.variable} ${cardo.variable} ${fragmentMono.variable}`}
    >
      <body suppressHydrationWarning>
        {/* Skip link: first tabbable element on every route. A client island
            (no native hash-history entry — see SkipLink.tsx). */}
        <SkipLink />
        {/* Primary navigation: the left-edge SiteNav rail on hover-capable wide
            screens; the SiteMenu burger overlay takes over on touch / narrow
            viewports. The CSS breakpoint in 46-site-nav.css owns the hand-off,
            so both mount unconditionally and only one is ever visible. */}
        <SiteNav />
        <SiteMenu />
        {/* Fixed wordmark, top-left — hidden on the Hub (the hero IS the
            wordmark), the login gate and the map (own chrome). */}
        <SiteBrand />
        {/* Scrolled-in brand anchor: the observatory dot fades in top-left
            once a page is scrolled (all scrollable surfaces; map/timeline/
            login excluded inside the component). */}
        <BrandBeacon />
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
        {/* Fixed Imprint/Privacy links under the player:
            the legal-reachability guarantee for footerless desktop surfaces.
            Hidden on /login and ≤760px via 71-legal.css. */}
        <SiteLegal />
        {/* E6 observability: cookieless Web Analytics + Speed Insights. In
            production both load same-origin (v2 "resilient intake" unique
            paths under our own host) — covered by the S3b CSP ('self'); dev
            loads the debug script from va.vercel-scripts.com (dev-gated in
            the CSP). Data collection additionally requires the two toggles in
            the Vercel dashboard (launch runbook). */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
