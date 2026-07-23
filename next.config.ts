import type { NextConfig } from "next";

// Simple static Content-Security-Policy (Board 121-P11, Entscheid 2026-06-12).
// Deliberately the *baseline* form, not the nonce-per-request form the
// next.config comment below flagged as the bigger step: a nonce forces every
// page into dynamic rendering, which we do not want for the ISR/SSG catalogue.
// The cost of going nonce-free is `'unsafe-inline'` on script-src — so this
// policy does NOT defend against inline-script XSS. What it *does* buy,
// statically and for free: no external script/object origin can be injected,
// clickjacking is closed (`frame-ancestors 'self'`, matching the existing
// X-Frame-Options), and `base-uri`/`form-action` hijacking is blocked.
// Nonce-based script-src hardening stays a future, separate step (see report).
//
// `img-src`/`media-src` allow `https:` because /archive + /archive/podcasts
// render DB-sourced cover/art URLs as plain <img> from open-ended external
// hosts (Open Library, podcast CDNs, …). `http:` is intentionally omitted —
// on the https production origin those would already be mixed-content-blocked.
//
// E6 observability contract (fixed here in S3b — S5 only activates, it never
// touches this policy again):
//  - Vercel Web Analytics + Speed Insights ship SAME-ORIGIN in production
//    (script under /_vercel/insights/ + /_vercel/speed-insights/, beacons POST
//    to the same paths) — covered by 'self'. Only dev loads their debug
//    scripts from https://va.vercel-scripts.com (script-src, dev-gated below).
//  - The error-only tracker (package picked in S5) MUST be bundled (script-src
//    'self') and report through a same-origin tunnel route (e.g. Sentry
//    `tunnelRoute`) — no third-party ingest origin is ever added to
//    connect-src. A tracker that can't tunnel same-origin is off the table.
const isDev = process.env.NODE_ENV !== "production";
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  // `unsafe-eval` is dev-only: React Refresh/HMR eval; the production bundle
  // runs without it (verified against the local prod build, Launch S3b).
  // va.vercel-scripts.com serves the Analytics/Speed-Insights debug scripts in
  // dev; production loads them same-origin (see E6 note above).
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ""}`,
  // Dev needs the HMR/React-Refresh websocket; prod talks only to its own
  // origin — the E6 tracker tunnels same-origin, so 'self' stays sufficient.
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-src 'self'",
  "media-src 'self' https:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

// Public assets keep stable, human-readable URLs because artwork can be
// replaced between deployments. Browsers may therefore reuse them for four
// hours, then must revalidate; Vercel can retain each immutable deployment's
// copy at the edge for a year. The Vercel-specific header is consumed by the
// CDN and is not forwarded to browsers.
const publicAssetCacheHeaders = [
  {
    key: "Cache-Control",
    value: "public, max-age=14400, must-revalidate",
  },
  {
    key: "Vercel-CDN-Cache-Control",
    value: "public, max-age=31536000",
  },
];

const nextConfig: NextConfig = {
  // Strict mode catches common bugs early; keep on in dev.
  reactStrictMode: true,

  // No `X-Powered-By: Next.js` fingerprint header (Launch S3b).
  poweredByHeader: false,

  // Pin the workspace root to THIS app dir. Without it Turbopack infers the
  // root from lockfiles and, inside a git worktree, picks the PARENT repo
  // (C:\...\chrono-lexicanum) — modules can then resolve from the parent's
  // node_modules (duplicate React = dead hydration). `process.cwd()` is the
  // dir `next dev`/`next build` runs in, i.e. this checkout; `__dirname`
  // resolves wrongly in the compiled config. Dev-only concern, but harmless
  // and correct for every checkout.
  turbopack: { root: process.cwd() },

  // Phone testing against the LAN URL (http://<LAN-IP>:3000): Next blocks
  // cross-origin requests to /_next dev resources by default; allow the dev
  // machine's LAN address. Dev-only setting, ignored in production builds.
  allowedDevOrigins: ["192.168.1.104"],

  // We do not yet ship images from external CDNs. Add remote patterns here
  // when cover-image work picks an actual source. (External cover/art URLs on
  // /archive render as plain <img>, not next/image — see the CSP note above.)
  images: {
    remotePatterns: [],
  },

  experimental: {
    // Prerender reads the committed snapshot, never Postgres (Launch S1b
    // Loader-Weiche) — the build needs no DB and CI proves it with an
    // unreachable DATABASE_URL. Two workers are defense in depth: if a
    // DB-touching page ever slips back into the prerender set, 2 workers ×
    // `max:5` pooler pool stays below the ~15 free-tier pooler slots instead
    // of the 15-worker stampede that produced 300s timeouts + retries. The
    // snapshot-fed static generation is I/O-light, so wall-clock impact is
    // negligible. The old DB-era crutches (`staticPageGenerationTimeout: 300`,
    // `staticGenerationMaxConcurrency: 3`) were removed after re-measurement
    // (Session S1b report): static gen completes in seconds against the
    // snapshot, well inside Next's 60s default.
    cpus: 2,
  },

  // Baseline security headers (Report 144 § S.2). HSTS is deliberately NOT
  // set here — Vercel adds it on production domains, doubling it just risks
  // drift. The CSP is the simple static baseline defined above (Board 121-P11):
  // nonce-based script hardening stays a future, separate step.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
      {
        source: "/img/:path*",
        headers: publicAssetCacheHeaders,
      },
      {
        source: "/audio/:path*",
        headers: publicAssetCacheHeaders,
      },
      {
        source: "/timeline/bg/:path*",
        headers: publicAssetCacheHeaders,
      },
    ];
  },

  // /werke + /podcasts merged under /archive (session 139); the German entity
  // paths migrated to the English canonical routes in Launch S4 (URL-Matrix,
  // launch-master-plan Anhang A.2). Every row is a 308 and the query string is
  // forwarded verbatim (Next's `redirects()` default) — no redirect rewrites or
  // drops parameters, so `?store=`, `?alignment=` etc. survive. `#ep-` fragments
  // never reach the server and are re-applied by the browser after the 308 —
  // episode deep-links keep scrolling+highlighting on hard loads. Internal links
  // all point at the canonical routes; these rows serve bookmarks and external
  // references.
  async redirects() {
    return [
      // /buecher was the maintainer-era catalogue; /archive is the canonical
      // public media archive (Board 121-P11). 308 keeps old bookmarks alive.
      { source: "/buecher", destination: "/archive", permanent: true },
      { source: "/werke", destination: "/archive", permanent: true },
      { source: "/podcasts", destination: "/archive/podcasts", permanent: true },
      {
        source: "/podcasts/:slug",
        destination: "/archive/podcasts/:slug",
        permanent: true,
      },
      // German → English entity detail routes (Launch S4). `?store=` survives
      // on /buch via the verbatim query forwarding above.
      { source: "/buch/:slug", destination: "/book/:slug", permanent: true },
      {
        source: "/buch/:slug/audit",
        destination: "/book/:slug/audit",
        permanent: true,
      },
      {
        source: "/charakter/:slug",
        destination: "/character/:slug",
        permanent: true,
      },
      { source: "/fraktion/:slug", destination: "/faction/:slug", permanent: true },
      { source: "/welt/:slug", destination: "/world/:slug", permanent: true },
      // /person stays — already English-capable (authors AND narrators).
      // Compendium category slugs → English (q/alignment/sort survive).
      {
        source: "/compendium/fraktionen",
        destination: "/compendium/factions",
        permanent: true,
      },
      {
        source: "/compendium/primarchen",
        destination: "/compendium/primarchs",
        permanent: true,
      },
      {
        source: "/compendium/charaktere",
        destination: "/compendium/characters",
        permanent: true,
      },
      {
        source: "/compendium/welten",
        destination: "/compendium/worlds",
        permanent: true,
      },
      {
        source: "/compendium/autoren",
        destination: "/compendium/authors",
        permanent: true,
      },
      // /fraktionen shortcut: target updated to the English category — a single
      // 308, never a double hop via /compendium/fraktionen. Was previously a
      // page-level redirect (src/app/fraktionen/page.tsx, removed in S4).
      {
        source: "/fraktionen",
        destination: "/compendium/factions",
        permanent: true,
      },
      // The Curator's two tools moved into the Compendium (Session 256). The
      // verbatim query forwarding keeps sealed answer deep-links
      // (/ask?experience=…) alive across the hop; `:path*` also matches the
      // bare /ask/faction (zero segments). The old German /ask/fraktion rows
      // point straight at the new home — a single 308, never a double hop.
      {
        source: "/ask",
        destination: "/compendium/four-questions",
        permanent: true,
      },
      {
        source: "/ask/faction/:path*",
        destination: "/compendium/one-faction-one-book/:path*",
        permanent: true,
      },
      {
        source: "/ask/fraktion/:path*",
        destination: "/compendium/one-faction-one-book/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
