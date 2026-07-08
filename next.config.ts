import type { NextConfig } from "next";

// Simple static Content-Security-Policy (Board 121-P11, Entscheid 2026-06-12).
// Deliberately the *baseline* form, not the nonce-per-request form the
// next.config comment below flagged as the bigger step: a nonce forces every
// page into dynamic rendering, which we do not want for the ISR/SSG catalogue.
// The cost of going nonce-free is `'unsafe-inline'` (+ `'unsafe-eval'`) on
// script-src — so this policy does NOT defend against inline-script XSS. What
// it *does* buy, statically and for free: no external script/object origin can
// be injected, clickjacking is closed (`frame-ancestors 'self'`, matching the
// existing X-Frame-Options), and `base-uri`/`form-action` hijacking is blocked.
// Nonce-based script-src hardening stays a future, separate step (see report).
//
// `img-src`/`media-src` allow `https:` because /archive + /archive/podcasts
// render DB-sourced cover/art URLs as plain <img> from open-ended external
// hosts (Open Library, podcast CDNs, …). `http:` is intentionally omitted —
// on the https production origin those would already be mixed-content-blocked.
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
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Dev needs the HMR/React-Refresh websocket; prod talks only to its own origin.
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-src 'self'",
  "media-src 'self' https:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const nextConfig: NextConfig = {
  // Strict mode catches common bugs early; keep on in dev.
  reactStrictMode: true,

  // /compendium (ISR, revalidate=300) still prerenders at build and shares the
  // max-5 pooler pool with ~1100 entity detail pages rendering concurrently —
  // its cold aggregate fill can exceed the 60s default and abort the deploy.
  // 180s held, but stayed tight (a transient retry on /person/dan_abnett in a
  // recent build log); 300s buys headroom for data growth (Report 144 § B.3).
  staticPageGenerationTimeout: 300,

  // We do not yet ship images from external CDNs. Add remote patterns here
  // when cover-image work picks an actual source. (Goodreads is no longer a
  // candidate — its API was discontinued December 2020. Phase-3 sources are
  // Wikipedia + Lexicanum + Open Library + Hardcover.)
  images: {
    remotePatterns: [
      // { protocol: "https", hostname: "static.wikia.nocookie.net" }, // Lexicanum thumbnails
      // { protocol: "https", hostname: "covers.openlibrary.org" }, // Open Library covers
    ],
  },

  // The legacy prototype lives under /archive/prototype-v1 and must NOT be
  // type-checked or built. See tsconfig.json `exclude` and .gitignore.
  experimental: {
    // Build-time SSG contention guard (Report 144 § A.3): every entity detail
    // page fires up to 4 parallel queries, and each export worker rendered 8
    // pages concurrently (default) against its per-process `max:5` pooler pool
    // — the plausible cause of the transient /person/dan_abnett retry (§ B.3).
    // 3 pages/worker keeps the per-process burst near the pool size; the build
    // is DB-bound, not CPU-bound, so wall-clock impact is small.
    staticGenerationMaxConcurrency: 3,
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
    ];
  },

  // /werke + /podcasts merged under /archive (session 139). Query strings are
  // auto-forwarded; `#ep-` fragments never reach the server and are re-applied
  // by the browser after the 308 — episode deep-links keep scrolling+highlighting
  // on hard loads. Internal links all point at /archive/*; these serve bookmarks
  // and external references.
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
    ];
  },
};

export default nextConfig;
